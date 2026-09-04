import * as profileService from '../services/profileService.js';

// Never forward a raw DB/PostgREST error to the client — log it for
// diagnostics and return a clean, generic message instead.
function genericServerError(res, error, context) {
    console.error(`${context}:`, error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

export async function getProfile(req, res) {
    try {
        const profile = await profileService.getProfile(req.supabase, req.user.id);
        if (!profile) {
            // Return empty profile layout if not found rather than 404
            return res.status(200).json({});
        }
        res.status(200).json(profile);
    } catch (error) {
        genericServerError(res, error, 'Failed to fetch profile');
    }
}

export async function upsertProfile(req, res) {
    try {
        const profileData = req.body;
        const profile = await profileService.upsertProfile(req.supabase, profileData, req.user.id);
        res.status(200).json(profile);
    } catch (error) {
        genericServerError(res, error, 'Failed to save profile');
    }
}
