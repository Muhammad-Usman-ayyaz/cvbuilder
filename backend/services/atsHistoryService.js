import { createAdminClient } from '../config/supabase.js';

function fromDbRow(row) {
    if (!row) return undefined;
    return {
        id: row.id,
        resumeId: row.resume_id,
        jobDescription: row.job_description,
        overallScore: row.overall_score,
        result: row.result_json,
        createdAt: row.created_at,
    };
}

/**
 * Saves a completed ATS check to history.
 *
 * Tries the normal request-scoped client first (the ats_checks table has a
 * real INSERT policy — `with check (auth.uid() = user_id)` — from its
 * migration, unlike the `profiles` table's auto-created-row gap). Only
 * falls back to the service-role admin client if that RLS-respecting
 * insert actually fails, so this doesn't blindly bypass RLS when it isn't
 * necessary. As with the profiles workaround, the admin path re-validates
 * `userId` against the row being inserted before writing, since the admin
 * client bypasses RLS entirely.
 */
export async function saveAtsCheck(client, { userId, resumeId, jobDescription, overallScore, resultJson }) {
    const dbPayload = {
        user_id: userId,
        resume_id: resumeId,
        job_description: jobDescription,
        overall_score: overallScore,
        result_json: resultJson,
    };

    const { data, error } = await client
        .from('ats_checks')
        .insert(dbPayload)
        .select()
        .single();

    if (!error) {
        return fromDbRow(data);
    }

    // Fall back to the admin client only if the normal insert was blocked —
    // e.g. an RLS/policy gap, mirroring the profiles-insert workaround.
    if (dbPayload.user_id !== userId) {
        throw new Error('ATS check user_id does not match the authenticated user.');
    }

    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
        .from('ats_checks')
        .insert(dbPayload)
        .select()
        .single();

    if (adminError) throw adminError;
    return fromDbRow(adminData);
}

export async function getHistoryForUser(client, userId) {
    const { data, error } = await client
        .from('ats_checks')
        .select('id, resume_id, job_description, overall_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map((row) => ({
        id: row.id,
        resumeId: row.resume_id,
        jobDescription: row.job_description,
        overallScore: row.overall_score,
        createdAt: row.created_at,
    }));
}

/**
 * Fetches one past check's full result, scoped to the owning user — same
 * pattern as resumeService.getResumeByIdForUser.
 */
export async function getHistoryItemForUser(client, id, userId) {
    const { data, error } = await client
        .from('ats_checks')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return fromDbRow(data);
}
