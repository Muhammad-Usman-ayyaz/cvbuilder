import * as resumeService from '../services/resumeService.js';
import * as atsHistoryService from '../services/atsHistoryService.js';
import * as atsImprovementService from '../services/atsImprovementService.js';
import { analyzeResume, checkAtsServiceHealth, improveResume } from '../services/atsService.js';

const ATS_CHECK_LIMIT = parseInt(process.env.ATS_CHECK_LIMIT, 10) || 20;

// "Improve This Resume" has its own, separate lifetime-per-user cap from
// ATS_CHECK_LIMIT — a single click can cost up to 6 Gemini calls (up to 3
// rounds of propose + rescore), so it would be unfair for one click to
// silently burn through a big chunk of a user's regular check budget.
const IMPROVE_LIFETIME_LIMIT = parseInt(process.env.IMPROVE_LIFETIME_LIMIT, 10) || 5;

// The Gemini API key backing this project is on the free tier — a shared,
// project-wide quota (observed directly: a 429 RESOURCE_EXHAUSTED error
// during development), NOT a per-user quota. A handful of Improve clicks
// from different users on the same day could exhaust the entire app's
// daily Gemini budget, breaking the regular ATS Checker for everyone. This
// is a coarse, in-memory, project-wide daily throttle on Improve specifically
// (the regular /check endpoint is left alone, since its own per-user
// lifetime cap already bounds its worst case more tightly).
//
// Deliberately in-memory rather than a DB counter: it only needs to survive
// within one server process's day, and resetting on a server restart (rare
// in practice, and "quota fully available again" is a safe failure mode) is
// fine for this project's current scale. Revisit if this ever runs across
// multiple backend instances, where an in-memory counter would under-count.
const IMPROVE_DAILY_GLOBAL_LIMIT = parseInt(process.env.IMPROVE_DAILY_GLOBAL_LIMIT, 10) || 8;
let improveDailyCount = 0;
let improveDailyCountDateKey = null;

function currentUtcDateKey() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Resets the in-memory daily counter when the UTC date rolls over. */
function rolloverImproveDailyCountIfNeeded() {
    const todayKey = currentUtcDateKey();
    if (improveDailyCountDateKey !== todayKey) {
        improveDailyCountDateKey = todayKey;
        improveDailyCount = 0;
    }
}

export async function checkAts(req, res) {
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

        // Project-wide daily throttle, since the Gemini quota backing this
        // is shared across every user, not per-user. Reserve the slot
        // before calling Gemini (so concurrent requests can't all slip
        // through under the limit), and release it if anything below fails
        // so a failed attempt doesn't permanently cost the daily budget.
        rolloverImproveDailyCountIfNeeded();
        if (improveDailyCount >= IMPROVE_DAILY_GLOBAL_LIMIT) {
            return res.status(503).json({
                error: 'Resume improvement is temporarily unavailable — the daily AI usage limit has been reached for all users. Please try again tomorrow.',
                code: 'IMPROVE_DAILY_LIMIT_REACHED',
            });
        }
        improveDailyCount += 1;
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
            improveDailyCount = Math.max(0, improveDailyCount - 1);
        }
        if (error.code === 'ATS_SERVICE_UNAVAILABLE') {
            return res.status(503).json({ error: error.message, code: error.code });
        }
        res.status(500).json({ error: error.message });
    }
}

export async function getImproveLimit(req, res) {
    try {
        rolloverImproveDailyCountIfNeeded();
        const count = await atsImprovementService.countImprovementsForUser(req.supabase, req.user.id);
        res.status(200).json({
            count,
            limit: IMPROVE_LIFETIME_LIMIT,
            dailyGlobalRemaining: Math.max(0, IMPROVE_DAILY_GLOBAL_LIMIT - improveDailyCount),
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
        res.status(200).json({ history, count, limit: ATS_CHECK_LIMIT });
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
