function fromDbRow(row) {
    if (!row) return undefined;
    return {
        id: row.id,
        title: row.title,
        templateId: row.template_id,
        themeColor: row.theme_color,
        updatedAt: row.updated_at,
        content: row.content,
    };
}

function toDbRow(resume, userId) {
    return {
        id: resume.id,
        user_id: userId,
        title: resume.title,
        template_id: resume.templateId,
        theme_color: resume.themeColor,
        content: resume.content,
    };
}

/**
 * Every function below takes `client` as its first argument — a
 * request-scoped Supabase client (see config/supabase.js's
 * createRequestClient) carrying the calling user's own access token, so
 * RLS evaluates `auth.uid()` against that specific user rather than
 * whatever session happens to be cached on a shared client.
 */

export async function getAllResumes(client, userId) {
    if (!userId) return [];

    const { data, error } = await client
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data.map(fromDbRow);
}

/**
 * Fetches a resume by id, scoped to the owning user — always use this
 * (never fetch by id alone) so ownership is enforced in the query itself
 * instead of relying solely on Supabase RLS.
 */
export async function getResumeByIdForUser(client, id, userId) {
    const { data, error } = await client
        .from('resumes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return fromDbRow(data);
}

export async function upsertResume(client, resume, userId) {
    const { data, error } = await client
        .from('resumes')
        .upsert(toDbRow(resume, userId))
        .select()
        .single();

    if (error) throw error;
    return fromDbRow(data);
}

/**
 * Deletes a resume by id, scoped to the owning user — always use this
 * (never delete by id alone) so ownership is enforced in the query itself
 * instead of relying solely on Supabase RLS.
 */
export async function removeResumeForUser(client, id, userId) {
    const { error, count } = await client
        .from('resumes')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
    return (count ?? 0) > 0;
}
