// Single source of truth for auth cookie names/options. Previously
// authController.js and middleware/auth.js each hardcoded their own
// clearCookie() options — they drifted (middleware cleared with no
// options at all, while cookies were created with secure/sameSite:none),
// which meant a session invalidated by the middleware (e.g. an expired
// token) didn't reliably clear from the browser. Centralizing here makes
// that drift structurally impossible.
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
};

export function setAuthCookies(res, session) {
    if (!session) return;

    res.cookie('access_token', session.access_token, {
        ...COOKIE_OPTIONS,
        maxAge: session.expires_in * 1000,
    });

    res.cookie('refresh_token', session.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
}

export function clearAuthCookies(res) {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
}
