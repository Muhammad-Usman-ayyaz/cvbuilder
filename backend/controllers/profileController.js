import * as profileService from '../services/profileService.js';

export async function getProfile(req, res) {
    try {
        const profile = await profileService.getProfile(req.user.id);
        if (!profile) {
            // Return empty profile layout if not found rather than 404
            return res.status(200).json({});
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function upsertProfile(req, res) {
    try {
        const profileData = req.body;
        const profile = await profileService.upsertProfile(profileData, req.user.id);
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
