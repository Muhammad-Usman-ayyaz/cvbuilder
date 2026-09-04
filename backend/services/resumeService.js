function fromDbRow(row) {
    if (!row) return undefined;
    return {
        id: row.id,
        title: row.title,
        templateId: row.template_id,
        themeColor: row.theme_color,
        updatedAt: row.updated_at,
        content: row.content,
        // Provenance only — which "Other" templates row (if any) this
        // resume was imported from. Never affects which React component
        // renders the resume; that's still templateId above, since only
        // classic/modern/minimal actually have renderers (see
        // ResumeCanvas.jsx's TEMPLATE_COMPONENTS). undefined on rows saved
        // before this column existed, or before templates_migration.sql
        // has been applied — see the fallback in upsertResume below.
        importedTemplateId: row.imported_template_id ?? null,
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
    const row = toDbRow(resume, userId);
    // Only sent when the caller actually has one (e.g. saving a resume
    // detected as an "Other" template on import) — never required, so a
    // normal resume save is completely unaffected either way.
    if (resume.importedTemplateId) {
        row.imported_template_id = resume.importedTemplateId;
    }

    let { data, error } = await client.from('resumes').upsert(row).select().single();

    // PGRST204: PostgREST can't find this column in its schema cache —
    // templates_migration.sql (which adds it) hasn't been applied to this
    // database yet. Retry without it rather than failing the save
    // outright — this column is provenance-only, never required for a
    // resume to save/load/render correctly.
    if (error?.code === 'PGRST204' && 'imported_template_id' in row) {
        delete row.imported_template_id;
        ({ data, error } = await client.from('resumes').upsert(row).select().single());
    }

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
