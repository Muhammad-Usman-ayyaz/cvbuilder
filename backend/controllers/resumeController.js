import * as resumeService from '../services/resumeService.js';

export async function getAllResumes(req, res) {
    try {
        const resumes = await resumeService.getAllResumes(req.supabase, req.user.id);
        res.status(200).json(resumes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getResume(req, res) {
    try {
        const resume = await resumeService.getResumeByIdForUser(req.supabase, req.params.id, req.user.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.status(200).json(resume);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function upsertResume(req, res) {
    try {
        // req.body should contain the resume object
        const resume = await resumeService.upsertResume(req.supabase, req.body, req.user.id);
        res.status(200).json(resume);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function deleteResume(req, res) {
    try {
        const success = await resumeService.removeResumeForUser(req.supabase, req.params.id, req.user.id);
        res.status(200).json({ success });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
