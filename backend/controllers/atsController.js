import * as resumeService from '../services/resumeService.js';
import * as atsHistoryService from '../services/atsHistoryService.js';
import { analyzeResume } from '../services/atsService.js';

export async function checkAts(req, res) {
    try {
        const { resumeId, jobDescription } = req.body;

        if (!resumeId || !jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ error: 'resumeId and jobDescription are required' });
        }

        const resume = await resumeService.getResumeByIdForUser(req.supabase, resumeId, req.user.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const result = analyzeResume(resume.content, jobDescription);

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
        const history = await atsHistoryService.getHistoryForUser(req.supabase, req.user.id);
        res.status(200).json(history);
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
