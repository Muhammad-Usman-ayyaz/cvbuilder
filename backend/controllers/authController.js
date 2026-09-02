import * as authService from '../services/authService.js';
import { supabase, createRequestClient } from '../config/supabase.js';
import { setAuthCookies, clearAuthCookies } from '../config/cookies.js';

export async function signup(req, res) {
    try {
        const { email, password, fullName } = req.body;

        const data = await authService.signUpUser({
            email,
            password,
            fullName
        });

        let userWithProfile = null;

        if (data.session) {
            setAuthCookies(res, data.session);

            // Same DTO shape as login — without this, the raw Supabase
            // user object (no top-level `fullName`) was set directly into
            // auth state, so the sidebar/navbar showed "User"/"U" until a
            // reload triggered getMe(), which already built this DTO.
            const requestClient = createRequestClient(data.session.access_token);
            const profile = await authService.getUserProfile(requestClient, data.user.id);

            userWithProfile = {
                id: data.user.id,
                email: data.user.email,
                fullName:
                    profile?.full_name ||
                    data.user.user_metadata?.full_name ||
                    ''
            };
        } else if (data.user) {
            // No session yet (e.g. email confirmation required) — no access
            // token to query the profile table with, but the name supplied
            // at signup is already on the user's metadata, so use that.
            userWithProfile = {
                id: data.user.id,
                email: data.user.email,
                fullName: data.user.user_metadata?.full_name || fullName || ''
            };
        }

        res.status(200).json({
            success: true,
            user: userWithProfile,
            access_token: data.session?.access_token
        });

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const data = await authService.loginUser({
            email,
            password
        });

        setAuthCookies(res, data.session);

        const requestClient = createRequestClient(data.session.access_token);
        const profile = await authService.getUserProfile(requestClient, data.user.id);

        const userWithProfile = {
            id: data.user.id,
            email: data.user.email,
            fullName:
                profile?.full_name ||
                data.user.user_metadata?.full_name ||
                ''
        };

        res.status(200).json({
            success: true,
            user: userWithProfile,
            access_token: data.session?.access_token
        });

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}

export async function logout(req, res) {
    try {
        await authService.logoutUser();

        clearAuthCookies(res);

        res.status(200).json({
            success: true
        });

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}

export async function getMe(req, res) {
    try {
        let token = req.cookies.access_token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.substring(7);
        }

        if (!token) {
            return res.status(401).json({
                error: 'Not authenticated'
            });
        }

        const {
            data: { user },
            error
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            clearAuthCookies(res);

            return res.status(401).json({
                error: 'Invalid session'
            });
        }

        const requestClient = createRequestClient(token);
        const profile = await authService.getUserProfile(requestClient, user.id);

        const userWithProfile = {
            id: user.id,
            email: user.email,
            fullName:
                profile?.full_name ||
                user.user_metadata?.full_name ||
                ''
        };

        res.status(200).json({
            success: true,
            user: userWithProfile
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}

export async function updateProfile(req, res) {
    try {
        let token = req.cookies.access_token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.substring(7);
        }

        if (!token) {
            return res.status(401).json({
                error: 'Not authenticated'
            });
        }

        const {
            data: { user },
            error
        } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid session'
            });
        }

        const { fullName } = req.body;

        const requestClient = createRequestClient(token);
        await authService.updateUserProfile(requestClient, user.id, fullName);

        res.status(200).json({
            success: true
        });

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}
