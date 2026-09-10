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
 * In-flight reservations (initial_score = -1) are excluded from completed count.
 */
export async function countImprovementsForUser(client, userId) {
    const { count, error } = await client
        .from('ats_improvements')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('initial_score', 0);

    if (error) throw error;
    return count ?? 0;
}

/**
 * Atomically reserves an improvement slot in PostgreSQL for a user.
 * Works across multiple backend processes/instances:
 * 1. Inserts a pending reservation row (initial_score = -1).
 * 2. Queries all rows for this user ordered chronologically.
 * 3. If the reservation's position is >= limit, the row is deleted and reservation fails.
 * 4. Otherwise, the slot is safely held.
 */
export async function reserveImprovementSlot(client, { userId, resumeId, jobDescription, limit }) {
    const reservationPayload = {
        user_id: userId,
        resume_id: resumeId,
        job_description: jobDescription,
        initial_score: -1,
        final_score: -1,
        iterations: 0,
    };

    let reservationId = null;
    const { data, error } = await client
        .from('ats_improvements')
        .insert(reservationPayload)
        .select('id')
        .single();

    if (error) {
        const admin = createAdminClient();
        const { data: adminData, error: adminError } = await admin
            .from('ats_improvements')
            .insert(reservationPayload)
            .select('id')
            .single();
        if (adminError) throw adminError;
        reservationId = adminData.id;
    } else {
        reservationId = data.id;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: allRows, error: queryError } = await client
        .from('ats_improvements')
        .select('id, initial_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (queryError) {
        await releaseImprovementSlot(client, reservationId);
        throw queryError;
    }

    const validRows = (allRows || []).filter(r =>
        r.initial_score >= 0 || (r.initial_score === -1 && r.created_at >= fiveMinutesAgo)
    );

    const rank = validRows.findIndex(r => r.id === reservationId);

    if (rank === -1 || rank >= limit) {
        await releaseImprovementSlot(client, reservationId);
        return { reserved: false, reservationId: null };
    }

    return { reserved: true, reservationId };
}

/**
 * Completes an existing improvement reservation slot with final scores.
 */
export async function completeImprovementSlot(client, reservationId, { initialScore, finalScore, iterations }) {
    const updatePayload = {
        initial_score: initialScore,
        final_score: finalScore,
        iterations,
    };

    const { data, error } = await client
        .from('ats_improvements')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (!error) {
        return fromDbRow(data);
    }

    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
        .from('ats_improvements')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (adminError) throw adminError;
    return fromDbRow(adminData);
}

/**
 * Releases/deletes an improvement reservation slot if an error occurs or request was aborted.
 */
export async function releaseImprovementSlot(client, reservationId) {
    if (!reservationId) return;
    try {
        const { error } = await client
            .from('ats_improvements')
            .delete()
            .eq('id', reservationId);
        if (error) {
            const admin = createAdminClient();
            await admin.from('ats_improvements').delete().eq('id', reservationId);
        }
    } catch (err) {
        console.warn('Failed to release improvement reservation:', reservationId, err.message);
    }
}
