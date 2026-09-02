import { createAdminClient } from '../config/supabase.js';

function fromDbRow(row) {
    if (!row) return undefined;
    return {
        id: row.id,
        resumeId: row.resume_id,
        jobDescription: row.job_description,
        initialScore: row.initial_score,
        finalScore: row.final_score,
        iterations: row.iterations,
        createdAt: row.created_at,
    };
}

/**
 * Records one completed "Improve This Resume" run (not one row per internal
 * iteration — a run costs 1-3 iterations internally but always logs exactly
 * one row here once it finishes). This table is never shown in the ATS
 * history UI or Dashboard activity feed; it exists solely so
 * countImprovementsForUser can enforce IMPROVE_LIFETIME_LIMIT independently
 * of ATS_CHECK_LIMIT. Same request-scoped-client-first, admin-fallback
 * pattern as atsHistoryService.saveAtsCheck.
 */
export async function saveImprovement(client, { userId, resumeId, jobDescription, initialScore, finalScore, iterations }) {
    const dbPayload = {
        user_id: userId,
        resume_id: resumeId,
        job_description: jobDescription,
        initial_score: initialScore,
        final_score: finalScore,
        iterations,
    };

    const { data, error } = await client
        .from('ats_improvements')
        .insert(dbPayload)
        .select()
        .single();

    if (!error) {
        return fromDbRow(data);
    }

    if (dbPayload.user_id !== userId) {
        throw new Error('ATS improvement user_id does not match the authenticated user.');
    }

    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
        .from('ats_improvements')
        .insert(dbPayload)
        .select()
        .single();

    if (adminError) throw adminError;
    return fromDbRow(adminData);
}

/**
 * Counts how many Improve runs a user has ever completed — used to enforce
 * the lifetime cap, mirroring atsHistoryService.countChecksForUser.
 */
export async function countImprovementsForUser(client, userId) {
    const { count, error } = await client
        .from('ats_improvements')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) throw error;
    return count ?? 0;
}
