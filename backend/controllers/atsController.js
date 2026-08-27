import * as resumeService from '../services/resumeService.js';
import * as atsHistoryService from '../services/atsHistoryService.js';
import { analyzeResume } from '../services/atsService.js';

const ATS_CHECK_LIMIT = parseInt(process.env.ATS_CHECK_LIMIT, 10) || 20;

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
