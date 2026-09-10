import * as resumeService from '../services/resumeService.js';
import * as atsHistoryService from '../services/atsHistoryService.js';
import * as atsImprovementService from '../services/atsImprovementService.js';
import { analyzeResume, checkAtsServiceHealth, improveResume } from '../services/atsService.js';
import { createDailyQuota } from '../services/dailyQuota.js';
import { isValidUuid } from '../utils/uuid.js';

const ATS_CHECK_LIMIT = parseInt(process.env.ATS_CHECK_LIMIT, 10) || 20;

// "Improve This Resume" has its own, separate lifetime-per-user cap from
// ATS_CHECK_LIMIT — a single click can cost up to 6 Gemini calls (up to 3
// rounds of propose + rescore), so it would be unfair for one click to
// silently burn through a big chunk of a user's regular check budget.
const IMPROVE_LIFETIME_LIMIT = parseInt(process.env.IMPROVE_LIFETIME_LIMIT, 10) || 5;

// ---------------------------------------------------------------------
// Daily project-wide Gemini budget
//
// The Gemini API key backing this project is on the free tier — a shared,
// project-wide quota of 20 requests/DAY TOTAL (confirmed directly via a
// 429 RESOURCE_EXHAUSTED error during development), not per-user and not
// per-endpoint. Both /check and /improve draw from that same real ceiling,
// so their daily caps are sized together against it, not independently:
//
//   ATS check:    1 Gemini call per check.
//   Improve run:  up to 6 Gemini calls per run (up to 3 rounds of
//                 propose_improvement + analyze each — NOT 3 calls total,
//                 that's 3 *rounds*, each round is 2 calls).
//
//   worst case = ATS_CHECK_DAILY_GLOBAL_LIMIT × 1
//              + IMPROVE_DAILY_GLOBAL_LIMIT × 6
//
// With the defaults below that's 6×1 + 2×6 = 18, leaving a 2-request
// buffer under the real 20/day ceiling (some slack for the health-check
// ping on startup, retries, etc). Both counters are instances of the same
// createDailyQuota() factory (services/dailyQuota.js) precisely so they're
// reasoned about as one shared budget rather than two unrelated numbers.
// ---------------------------------------------------------------------
const ATS_CHECK_DAILY_GLOBAL_LIMIT = parseInt(process.env.ATS_CHECK_DAILY_GLOBAL_LIMIT, 10) || 6;
const IMPROVE_DAILY_GLOBAL_LIMIT = parseInt(process.env.IMPROVE_DAILY_GLOBAL_LIMIT, 10) || 2;

const atsCheckDailyQuota = createDailyQuota(ATS_CHECK_DAILY_GLOBAL_LIMIT);
const improveDailyQuota = createDailyQuota(IMPROVE_DAILY_GLOBAL_LIMIT);

// In-flight reservation tracking per user to prevent concurrent race-condition quota bypass
const userInFlightChecks = new Map();
const userInFlightImproves = new Map();

// Never forward a raw DB/PostgREST error to the client — log it for
// diagnostics and return a clean, generic message instead. Errors thrown
// by atsService.js's analyzeResume/improveResume are already safe,
// self-constructed messages (never raw), so this only matters for the
// resume-lookup/history DB calls in the handlers below.
function genericServerError(res, error, context) {
    console.error(`${context}:`, error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

export async function checkAts(req, res) {
    let reservedDailySlot = false;
    let reservedUserSlot = false;
    let dbReservationId = null;
    let reservationCompleted = false;
    try {
        const { resumeId, temporaryResumeContent, jobDescription } = req.body;

        // Exactly one resume source: a saved resume by id (existing path,
        // unchanged below) or a temporary CV extracted via POST
        // /api/resumes/upload but never saved (the ATS-Checker-only upload
        // path — see ATSCheckerPage.jsx). temporaryResumeContent is trusted
        // the same way upsertResume already trusts client-supplied resume
        // `content` for saving a resume — it's the requesting user's own
        // data, not a reference to anyone else's, so there's no ownership
        // check to perform on it (nothing is being looked up by id).
        if ((!resumeId && !temporaryResumeContent) || !jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ error: 'A resume (or uploaded CV) and jobDescription are required' });
        }
        if (resumeId && !isValidUuid(resumeId)) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        if (resumeId && temporaryResumeContent) {
            return res.status(400).json({ error: 'Provide either resumeId or temporaryResumeContent, not both' });
        }

        // 1. In-process fast rejection for concurrent bursts within same process
        const inFlight = userInFlightChecks.get(req.user.id) || 0;
        const checkCount = await atsHistoryService.countChecksForUser(req.supabase, req.user.id);
        if (checkCount + inFlight >= ATS_CHECK_LIMIT) {
            return res.status(403).json({
                error: `You've used all ${ATS_CHECK_LIMIT} of your ATS checks.`,
            });
        }
        userInFlightChecks.set(req.user.id, inFlight + 1);
        reservedUserSlot = true;

        // 2. Database atomic reservation for cross-process concurrency safety
        try {
            const reservation = await atsHistoryService.reserveCheckSlot(req.supabase, {
                userId: req.user.id,
                resumeId: resumeId || null,
                jobDescription,
                limit: ATS_CHECK_LIMIT,
            });
            if (!reservation.reserved) {
                return res.status(403).json({
                    error: `You've used all ${ATS_CHECK_LIMIT} of your ATS checks.`,
                });
            }
            dbReservationId = reservation.reservationId;
        } catch (resError) {
            console.warn('DB check reservation warning (fallback to in-memory guard):', resError.message);
        }

        // Project-wide daily throttle — distinct from the per-user lifetime
        // cap above. See the budget comment near the top of this file.
        if (!atsCheckDailyQuota.tryReserve()) {
            return res.status(503).json({
                error: 'ATS checks are temporarily unavailable — the daily AI usage limit has been reached for all users. Please try again tomorrow.',
                code: 'ATS_CHECK_DAILY_LIMIT_REACHED',
            });
        }
        reservedDailySlot = true;

        let resumeContent;
        if (resumeId) {
            let resume;
            try {
                resume = await resumeService.getResumeByIdForUser(req.supabase, resumeId, req.user.id);
            } catch (lookupError) {
                // A malformed (non-UUID) resumeId is a 404, not a 500.
                if (lookupError.code === '22P02') {
                    atsCheckDailyQuota.release();
                    reservedDailySlot = false;
                    return res.status(404).json({ error: 'Resume not found' });
                }
                throw lookupError;
            }
            if (!resume) {
                atsCheckDailyQuota.release();
                reservedDailySlot = false;
                return res.status(404).json({ error: 'Resume not found' });
            }
            resumeContent = resume.content;
        } else {
            resumeContent = temporaryResumeContent;
        }

        const result = await analyzeResume(resumeContent, jobDescription);

        // Complete the reservation in database with final score and result
        if (dbReservationId) {
            try {
                await atsHistoryService.completeCheckSlot(req.supabase, dbReservationId, {
                    overallScore: result.overallScore,
                    resultJson: result,
                });
                reservationCompleted = true;
            } catch (completeErr) {
                console.error('Failed to complete check reservation in DB:', completeErr);
            }
        } else {
            try {
                await atsHistoryService.saveAtsCheck(req.supabase, {
                    userId: req.user.id,
                    resumeId: resumeId || null,
                    jobDescription,
                    overallScore: result.overallScore,
                    resultJson: result,
                });
            } catch (saveError) {
                console.error('Failed to save ATS check history:', saveError);
            }
        }

        res.status(200).json(result);
    } catch (error) {
        if (reservedDailySlot) {
            atsCheckDailyQuota.release();
        }
        // The microservice-unreachable case gets its own status/code so the
        // frontend can show a distinct "service is down" state instead of
        // a generic error indistinguishable from e.g. bad input.
        if (error.code === 'ATS_SERVICE_UNAVAILABLE') {
            return res.status(503).json({ error: error.message, code: error.code });
        }
        genericServerError(res, error, 'ATS request failed');
    } finally {
        if (dbReservationId && !reservationCompleted) {
            await atsHistoryService.releaseCheckSlot(req.supabase, dbReservationId);
        }
        if (reservedUserSlot) {
            const current = userInFlightChecks.get(req.user.id) || 1;
            if (current <= 1) {
                userInFlightChecks.delete(req.user.id);
            } else {
                userInFlightChecks.set(req.user.id, current - 1);
            }
        }
    }
}

// "Improve This Resume" has its own, separate lifetime-per-user cap from
// ATS_CHECK_LIMIT — a single click can cost up to 6 Gemini calls (up to 3
// rounds of propose + rescore), so it would be unfair for one click to
// silently burn through a big chunk of a user's regular check budget.
// Usage is logged to ats_improvements (ats_improvements_migration.sql)
// solely so this cap can be enforced independently of regular checks — see
// countImprovementsForUser's lifetime cap below.
export async function improveResumeHandler(req, res) {
    let reservedDailySlot = false;
    let reservedUserImproveSlot = false;
    let dbImproveReservationId = null;
    let improveCompleted = false;
    try {
        const { resumeId, jobDescription, currentAnalysis } = req.body;

        if (!resumeId || !jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ error: 'resumeId and jobDescription are required' });
        }
        if (!isValidUuid(resumeId)) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        // 1. In-process fast rejection for concurrent bursts
        const inFlight = userInFlightImproves.get(req.user.id) || 0;
        const improveCount = await atsImprovementService.countImprovementsForUser(req.supabase, req.user.id);
        if (improveCount + inFlight >= IMPROVE_LIFETIME_LIMIT) {
            return res.status(403).json({
                error: `You've used all ${IMPROVE_LIFETIME_LIMIT} of your resume improvements.`,
            });
        }
        userInFlightImproves.set(req.user.id, inFlight + 1);
        reservedUserImproveSlot = true;

        // 2. Database atomic reservation for cross-process concurrency safety
        try {
            const reservation = await atsImprovementService.reserveImprovementSlot(req.supabase, {
                userId: req.user.id,
                resumeId,
                jobDescription,
                limit: IMPROVE_LIFETIME_LIMIT,
            });
            if (!reservation.reserved) {
                return res.status(403).json({
                    error: `You've used all ${IMPROVE_LIFETIME_LIMIT} of your resume improvements.`,
                });
            }
            dbImproveReservationId = reservation.reservationId;
        } catch (resError) {
            console.warn('DB improve reservation warning (fallback to in-memory guard):', resError.message);
        }

        // Project-wide daily throttle — distinct from the per-user lifetime
        // cap above. See the budget comment near the top of this file.
        if (!improveDailyQuota.tryReserve()) {
            return res.status(503).json({
                error: 'Resume improvement is temporarily unavailable — the daily AI usage limit has been reached for all users. Please try again tomorrow.',
                code: 'IMPROVE_DAILY_LIMIT_REACHED',
            });
        }
        reservedDailySlot = true;

        let resume;
        try {
            resume = await resumeService.getResumeByIdForUser(req.supabase, resumeId, req.user.id);
        } catch (lookupError) {
            if (lookupError.code === '22P02') {
                improveDailyQuota.release();
                reservedDailySlot = false;
                return res.status(404).json({ error: 'Resume not found' });
            }
            throw lookupError;
        }
        if (!resume) {
            improveDailyQuota.release();
            reservedDailySlot = false;
            return res.status(404).json({ error: 'Resume not found' });
        }

        const result = await improveResume(resume.content, jobDescription, currentAnalysis ?? null);

        // Complete the reservation in database with final scores
        if (dbImproveReservationId) {
            try {
                await atsImprovementService.completeImprovementSlot(req.supabase, dbImproveReservationId, {
                    initialScore: result.initialScore,
                    finalScore: result.finalScore,
                    iterations: result.iterations,
                });
                improveCompleted = true;
            } catch (completeErr) {
                console.error('Failed to complete improvement reservation in DB:', completeErr);
            }
        } else {
            try {
                await atsImprovementService.saveImprovement(req.supabase, {
                    userId: req.user.id,
                    resumeId,
                    jobDescription,
                    initialScore: result.initialScore,
                    finalScore: result.finalScore,
                    iterations: result.iterations,
                });
            } catch (saveError) {
                console.error('Failed to save ATS improvement usage log:', saveError.message);
            }
        }

        res.status(200).json(result);
    } catch (error) {
        if (reservedDailySlot) {
            improveDailyQuota.release();
        }
        if (error.code === 'ATS_SERVICE_UNAVAILABLE') {
            return res.status(503).json({ error: error.message, code: error.code });
        }
        genericServerError(res, error, 'ATS request failed');
    } finally {
        if (dbImproveReservationId && !improveCompleted) {
            await atsImprovementService.releaseImprovementSlot(req.supabase, dbImproveReservationId);
        }
        if (reservedUserImproveSlot) {
            const current = userInFlightImproves.get(req.user.id) || 1;
            if (current <= 1) {
                userInFlightImproves.delete(req.user.id);
            } else {
                userInFlightImproves.set(req.user.id, current - 1);
            }
        }
    }
}

export async function getImproveLimit(req, res) {
    try {
        const count = await atsImprovementService.countImprovementsForUser(req.supabase, req.user.id);
        res.status(200).json({
            count,
            limit: IMPROVE_LIFETIME_LIMIT,
            dailyGlobalRemaining: improveDailyQuota.remaining(),
        });
    } catch (error) {
        genericServerError(res, error, 'Failed to fetch improve limit');
    }
}

export async function getHistory(req, res) {
    try {
        const [history, count] = await Promise.all([
            atsHistoryService.getHistoryForUser(req.supabase, req.user.id),
            atsHistoryService.countChecksForUser(req.supabase, req.user.id),
        ]);
        res.status(200).json({
            history,
            count,
            limit: ATS_CHECK_LIMIT,
            dailyGlobalRemaining: atsCheckDailyQuota.remaining(),
        });
    } catch (error) {
        genericServerError(res, error, 'Failed to fetch ATS history');
    }
}

/**
 * Lets the frontend show "is the ATS service actually up" without anyone
 * needing to check terminals — a lightweight passthrough of the same
 * reachability check checkAts relies on.
 */
export async function getStatus(req, res) {
    const available = await checkAtsServiceHealth();
    res.status(200).json({ available });
}

export async function getHistoryItem(req, res) {
    if (!isValidUuid(req.params.id)) {
        return res.status(404).json({ error: 'History item not found' });
    }
    try {
        const item = await atsHistoryService.getHistoryItemForUser(req.supabase, req.params.id, req.user.id);
        if (!item) {
            return res.status(404).json({ error: 'History item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        if (error.code === '22P02') {
            return res.status(404).json({ error: 'History item not found' });
        }
        genericServerError(res, error, 'Failed to fetch history item');
    }
}
