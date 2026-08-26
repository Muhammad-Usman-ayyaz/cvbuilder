import { createAdminClient } from '../config/supabase.js';

/**
 * Both functions take `client` as their first argument — a request-scoped
 * Supabase client (see config/supabase.js's createRequestClient) carrying
 * the calling user's own access token, so RLS evaluates `auth.uid()`
 * against that specific user.
 */

export async function getProfile(client, userId) {
    if (!userId) return null;

    const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function upsertProfile(client, profileData, userId) {
    if (!userId) throw new Error("User ID is required");

    // Supabase profiles table uses 'id' as the foreign key to auth.users
    const dbPayload = {
        id: userId,
        full_name: profileData.fullName !== undefined ? profileData.fullName : undefined,
        professional_title: profileData.professionalTitle,
        email: profileData.email,
        phone: profileData.phone,
        city: profileData.city,
        country: profileData.country,
        linkedin_url: profileData.linkedinUrl,
        github_url: profileData.githubUrl,
        portfolio_url: profileData.portfolioUrl,
        education: profileData.education || [],
        experience: profileData.experience || [],
        skills: profileData.skills || [],
        projects: profileData.projects || [],
        certifications: profileData.certifications || [],
        achievements: profileData.achievements || [],
        languages: profileData.languages || [],
        updated_at: new Date().toISOString()
    };

    // Remove undefined fields to prevent overwriting with null unintentionally if partial update
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    // Find out whether this user already has a profile row, using the
    // normal user-scoped client (RLS-safe — this is just a SELECT).
    const { data: existing, error: selectError } = await client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (selectError) throw selectError;

    if (existing) {
        // Row already exists — a plain UPDATE is allowed by the existing
        // RLS policy, so keep using the normal per-request client.
        const { data, error } = await client
            .from('profiles')
            .update(dbPayload)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // No row yet — inserting requires bypassing RLS, since `profiles` has
    // no INSERT policy for authenticated users right now (see
    // createAdminClient's doc comment for why). Because the admin client
    // bypasses RLS entirely, we must enforce ownership ourselves here:
    // the row being inserted must belong to the authenticated caller.
    if (dbPayload.id !== userId) {
        throw new Error('Profile id does not match the authenticated user.');
    }

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('profiles')
        .insert(dbPayload)
        .select()
        .single();

    if (error) throw error;
    return data;
}
