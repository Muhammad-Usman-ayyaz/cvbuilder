import * as resumeService from '../services/resumeService.js';
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

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
