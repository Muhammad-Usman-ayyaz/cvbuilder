import * as authService from '../services/authService.js';
import { supabase } from '../config/supabase.js';

function setAuthCookies(res, session) {
    if (!session) return;

    // Access token cookie
    res.cookie('access_token', session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: session.expires_in * 1000
    });

    // Refresh token cookie
    res.cookie('refresh_token', session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
}

function clearAuthCookies(res) {
    res.clearCookie('access_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });

    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
}

export async function signup(req, res) {
    try {
        const { email, password, fullName } = req.body;

        const data = await authService.signUpUser({
            email,
            password,
            fullName
        });

        if (data.session) {
            setAuthCookies(res, data.session);
        }

        res.status(200).json({
            success: true,
            user: data.user,
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

        const profile = await authService.getUserProfile(data.user.id);

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

        const profile = await authService.getUserProfile(user.id);

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

        await authService.updateUserProfile(user.id, fullName);

        res.status(200).json({
            success: true
        });

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
}