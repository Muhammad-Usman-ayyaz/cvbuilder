import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase env vars.');
}

/**
 * Shared client for STATELESS, unauthenticated operations only —
 * currently just auth.getUser(token) (token verification takes the token
 * as an explicit argument and doesn't touch client-side session state).
 *
 * Never call a session-mutating auth method (signUp, signInWithPassword,
 * signOut, setSession, refreshSession, etc.) on this instance — those
 * mutate the client's internally cached session, and since this client is
 * shared across every concurrent request on the server, one request's
 * signup/login would overwrite the session used by every other in-flight
 * request. Use createAuthClient() for anything stateful.
 *
 * Also don't run `.from()` data queries against RLS-protected tables on
 * this client — it carries no user JWT, so `auth.uid()` is null for every
 * such query and RLS will reject it. Use createRequestClient() instead,
 * which attaches the current request's own access token.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Creates a fresh, single-use Supabase client for session-mutating auth
 * calls (signUp, signInWithPassword, signOut). Callers should create one
 * of these per request, use it for that one call, and then discard it —
 * never store it or reuse it across requests, or this defeats the point.
 *
 * autoRefreshToken/persistSession are disabled: this client is meant to
 * live for a single call, not sit around holding a background refresh
 * timer (which would otherwise leak, since we never call close/dispose on
 * it) or touch browser-only storage that doesn't exist on the server.
 */
export function createAuthClient() {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

/**
 * Creates a request-scoped Supabase client with the given user's access
 * token attached to every request (via the Authorization header), so
 * Postgres RLS policies that check `auth.uid()` evaluate against *that*
 * user — not against whatever session happens to be cached elsewhere.
 *
 * Use this for any `.from()` data query made on behalf of a specific
 * authenticated request (resumes, profiles, etc). Build one per request
 * from the token requireAuth already validated, and discard it after the
 * request — never share or cache it across requests.
 */
export function createRequestClient(accessToken) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

/**
 * Creates a Supabase client authenticated with the SERVICE ROLE key,
 * which bypasses RLS entirely.
 *
 * TARGETED WORKAROUND — not a general-purpose client:
 * The `profiles` table is currently missing an INSERT policy for
 * authenticated users (dashboard access to add one isn't available right
 * now), so a brand-new user's first profile upsert fails RLS with "new
 * row violates row-level security policy for table profiles" even though
 * they're only ever inserting their own row. This client exists ONLY to
 * perform that one specific insert (see profileService.js) — every other
 * query in the app must keep using createRequestClient()/the shared
 * client so RLS still applies normally. Because this bypasses RLS, any
 * code using it MUST independently verify ownership in application code
 * (e.g. assert the row's id === req.user.id) before writing.
 *
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend, log it, or
 * return it in any response — it grants full unrestricted database
 * access. It's read here only from server-side env.
 *
 * TODO: remove this once an INSERT policy on `profiles` (e.g.
 * `WITH CHECK (auth.uid() = id)`) can be added directly in the Supabase
 * dashboard, and switch profileService's insert path back to the
 * request-scoped client.
 */
export function createAdminClient() {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY is not set — required for the profiles-insert RLS workaround. Add it to backend/.env.'
        );
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
