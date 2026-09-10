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
        .gte('overall_score', 0)
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
 * Counts how many completed checks a user has ever run.
 * In-flight reservations (overall_score = -1) are excluded from the completed count.
 */
export async function countChecksForUser(client, userId) {
    const { count, error } = await client
        .from('ats_checks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('overall_score', 0);

    if (error) throw error;
    return count ?? 0;
}

/**
 * Atomically reserves a check slot in PostgreSQL for a user.
 * Works across multiple backend processes/instances:
 * 1. Inserts a pending reservation row (overall_score = -1).
 * 2. Queries all rows for this user ordered chronologically.
 * 3. If the reservation's position is >= limit, the row is deleted and reservation fails.
 * 4. Otherwise, the slot is safely held.
 */
export async function reserveCheckSlot(client, { userId, resumeId, jobDescription, limit }) {
    const reservationPayload = {
        user_id: userId,
        resume_id: resumeId || null,
        job_description: jobDescription,
        overall_score: -1,
        result_json: { status: 'reserved', reserved_at: new Date().toISOString() },
    };

    let reservationId = null;
    const { data, error } = await client
        .from('ats_checks')
        .insert(reservationPayload)
        .select('id')
        .single();

    if (error) {
        const admin = createAdminClient();
        const { data: adminData, error: adminError } = await admin
            .from('ats_checks')
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
        .from('ats_checks')
        .select('id, overall_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (queryError) {
        await releaseCheckSlot(client, reservationId);
        throw queryError;
    }

    const validRows = (allRows || []).filter(r =>
        r.overall_score >= 0 || (r.overall_score === -1 && r.created_at >= fiveMinutesAgo)
    );

    const rank = validRows.findIndex(r => r.id === reservationId);

    if (rank === -1 || rank >= limit) {
        await releaseCheckSlot(client, reservationId);
        return { reserved: false, reservationId: null };
    }

    return { reserved: true, reservationId };
}

/**
 * Completes an existing reservation slot with final results.
 */
export async function completeCheckSlot(client, reservationId, { overallScore, resultJson }) {
    const updatePayload = {
        overall_score: overallScore,
        result_json: resultJson,
    };

    const { data, error } = await client
        .from('ats_checks')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (!error) {
        return fromDbRow(data);
    }

    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
        .from('ats_checks')
        .update(updatePayload)
        .eq('id', reservationId)
        .select()
        .single();

    if (adminError) throw adminError;
    return fromDbRow(adminData);
}

/**
 * Releases/deletes a reservation slot if an error occurs or request was aborted.
 */
export async function releaseCheckSlot(client, reservationId) {
    if (!reservationId) return;
    try {
        const { error } = await client
            .from('ats_checks')
            .delete()
            .eq('id', reservationId);
        if (error) {
            const admin = createAdminClient();
            await admin.from('ats_checks').delete().eq('id', reservationId);
        }
    } catch (err) {
        console.warn('Failed to release check reservation:', reservationId, err.message);
    }
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
