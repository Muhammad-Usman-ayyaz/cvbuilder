import { supabase, createRequestClient } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
    let token = req.cookies.access_token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
    }
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
            return res.status(401).json({ error: 'Invalid session' });
        }

        req.user = user;
        // Data queries must run through a client carrying this request's
        // own token, not the shared anon client — see config/supabase.js.
        req.supabase = createRequestClient(token);
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error during authentication' });
    }
}
