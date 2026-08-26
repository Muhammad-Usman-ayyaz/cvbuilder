import { createAuthClient } from '../config/supabase.js';

export async function signUpUser({ email, password, fullName }) {
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
}

export async function loginUser({ email, password }) {
    const authClient = createAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function logoutUser() {
    const authClient = createAuthClient();
    const { error } = await authClient.auth.signOut();
    if (error) throw error;
}

/**
 * `client` is a request-scoped Supabase client carrying the calling
 * user's own access token (see config/supabase.js's createRequestClient),
 * so RLS evaluates `auth.uid()` against that specific user.
 */
export async function getUserProfile(client, userId) {
    const { data: profile } = await client
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

    return profile;
}

export async function updateUserProfile(client, userId, fullName) {
    const { error } = await client
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);
    if (error) throw error;
}
