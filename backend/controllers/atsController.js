import * as resumeService from '../services/resumeService.js';
import * as atsHistoryService from '../services/atsHistoryService.js';
import * as atsImprovementService from '../services/atsImprovementService.js';
import { analyzeResume, checkAtsServiceHealth, improveResume } from '../services/atsService.js';
import { createDailyQuota } from '../services/dailyQuota.js';

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

export async function checkAts(req, res) {
    let reservedDailySlot = false;
    try {
        const { resumeId, jobDescription } = req.body;

        if (!resumeId || !jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ error: 'resumeId and jobDescription are required' });
        }

        // Enforced before touching the resume lookup or Gemini at all —
        // a capped user should never cost an API call.
        const checkCount = await atsHistoryService.countChecksForUser(req.supabase, req.user.id);
        if (checkCount >= ATS_CHECK_LIMIT) {
            return res.status(403).json({
                error: `You've used all ${ATS_CHECK_LIMIT} of your ATS checks.`,
            });
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

        const resume = await resumeService.getResumeByIdForUser(req.supabase, resumeId, req.user.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const result = await analyzeResume(resume.content, jobDescription);

        // History is supplementary — a save failure shouldn't break the
        // actual check the user is waiting on, so it's logged, not thrown.
        try {
            await atsHistoryService.saveAtsCheck(req.supabase, {
                userId: req.user.id,
                resumeId,
                jobDescription,
                overallScore: result.overallScore,
                resultJson: result,
            });
        } catch (saveError) {
            console.error('Failed to save ATS check history:', saveError.message);
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
        res.status(500).json({ error: error.message });
    }
}

// Improve results (ImproveResult from the Python service) are never saved
// to ats_checks — the 1-3 internal rescores per click are an implementation
// detail, not user-initiated checks, and shouldn't clutter ATS history or
// the Dashboard's Recent Activity feed. Exactly one row is written to the
// separate ats_improvements table per completed run, purely to power
// countImprovementsForUser's lifetime cap below.
export async function improveResumeHandler(req, res) {
    let reservedDailySlot = false;
    try {
        const { resumeId, jobDescription, currentAnalysis } = req.body;

        if (!resumeId || !jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ error: 'resumeId and jobDescription are required' });
        }

        // Per-user lifetime cap — enforced before touching the resume
        // lookup or Gemini at all, same principle as checkAts's own cap.
        const improveCount = await atsImprovementService.countImprovementsForUser(req.supabase, req.user.id);
        if (improveCount >= IMPROVE_LIFETIME_LIMIT) {
            return res.status(403).json({
                error: `You've used all ${IMPROVE_LIFETIME_LIMIT} of your resume improvements.`,
            });
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

        const resume = await resumeService.getResumeByIdForUser(req.supabase, resumeId, req.user.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const result = await improveResume(resume.content, jobDescription, currentAnalysis ?? null);

        // Usage logging is supplementary — a save failure shouldn't break
        // the result the user is waiting on, so it's logged, not thrown.
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

        res.status(200).json(result);
    } catch (error) {
        if (reservedDailySlot) {
            improveDailyQuota.release();
        }
        if (error.code === 'ATS_SERVICE_UNAVAILABLE') {
            return res.status(503).json({ error: error.message, code: error.code });
        }
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
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
    try {
        const item = await atsHistoryService.getHistoryItemForUser(req.supabase, req.params.id, req.user.id);
        if (!item) {
            return res.status(404).json({ error: 'History item not found' });
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
