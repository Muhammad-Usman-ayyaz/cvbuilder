/**
 * Uploaded-CV template detection and registration.
 *
 * WHAT THIS CAN AND CANNOT DO — read before changing the detection logic:
 * This pipeline extracts PLAIN TEXT from an uploaded PDF/DOCX (see
 * textExtractionService.js) and a SEMANTIC JSON structure from that text
 * (see uploadService.js -> ats-service/gemini_analyzer.py's
 * extract_resume). Neither step captures true visual/layout information —
 * fonts, column boundaries, exact spacing, colors, images. So "does this
 * uploaded CV visually match our Classic/Modern/Minimal React templates"
 * has NO reliable signal anywhere in this pipeline for a document authored
 * outside this app (Word, Canva, LaTeX, a recruiter's own template, ...).
 * Pretending otherwise — guessing a match from text content alone — would
 * be exactly the "naive/fake matching" this feature was explicitly told
 * not to do.
 *
 * What IS genuinely deterministic and reliable:
 *   1. A PDF previously EXPORTED BY THIS APP carries a literal marker this
 *      app itself wrote into the PDF's Subject field (see
 *      SelectablePdfTemplate.jsx's <Document subject=...> and
 *      templateFingerprint.js's detectSelfExportedTemplate) — if a user
 *      re-uploads their own previously-exported resume, we know EXACTLY
 *      which built-in template it used, because we wrote that fact into
 *      the file ourselves. This is the only "known template" match Phase
 *      2 implements.
 *   2. Everything else is classified "Other" and identified by a
 *      structural fingerprint (page count, authoring-tool metadata,
 *      section shape — see templateFingerprint.js) so the SAME uploaded
 *      design reuses the same "Other" record instead of creating
 *      duplicates, without ever claiming to know which built-in template
 *      it resembles.
 *
 * In short: real uploaded CVs from outside this app will essentially
 * always land in "Other" — that's the honest, correct outcome given what
 * this pipeline can actually observe, not a bug.
 */

import { detectSelfExportedTemplate, buildTemplateFingerprint } from './templateFingerprint.js';

function fromDbRow(row) {
    if (!row) return undefined;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        category: 'other', // every row in this table is category "Other" by construction
        source: row.source,
        isSystemTemplate: row.is_system_template,
        isImported: row.is_imported,
        createdAt: row.created_at,
    };
}

/**
 * Detects whether an uploaded document matches a known built-in template
 * or should be registered/reused under "Other". Never touches the
 * `resumes` table — this only ever reads/writes `templates`, so it's
 * equally safe to call from the My-Resumes upload flow and the ATS-only
 * temporary-upload flow (see resumeController.uploadResume, called from
 * both) without side-effecting resume persistence either way.
 *
 * @param {object} client - request-scoped Supabase client (see config/supabase.js)
 * @param {string} userId
 * @param {{
 *   kind: 'pdf'|'docx',
 *   docMeta: { pageCount: number|null, producer: string|null, creator: string|null, subject: string|null },
 *   extracted: object,
 * }} input
 * @returns {Promise<{
 *   isKnown: boolean,
 *   templateId: 'classic'|'modern'|'minimal'|null,
 *   category: 'built-in'|'other',
 *   other: { id: string, name: string, isNew: boolean } | null,
 * }>}
 */
export async function detectAndRegisterTemplate(client, userId, { kind, docMeta, extracted }) {
    const selfExportedId = kind === 'pdf' ? detectSelfExportedTemplate(docMeta) : null;
    if (selfExportedId) {
        return { isKnown: true, templateId: selfExportedId, category: 'built-in', other: null };
    }

    const { signature, fingerprint } = buildTemplateFingerprint({
        kind,
        pageCount: docMeta?.pageCount,
        producer: docMeta?.producer,
        creator: docMeta?.creator,
        extracted,
    });

    // Reuse an existing "Other" record for this exact structural shape
    // (scoped to this user — see the ownership note in templateService's
    // module docstring / templates_migration.sql) rather than creating a
    // duplicate every time the same design is uploaded again.
    const { data: existing, error: findError } = await client
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .eq('fingerprint', fingerprint)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) {
        return {
            isKnown: false,
            templateId: null,
            category: 'other',
            other: { id: existing.id, name: existing.name, isNew: false },
        };
    }

    const name = `Imported Template (${kind.toUpperCase()})`;
    const slug = `imported-${fingerprint.slice(0, 12)}`;

    const { data: inserted, error: insertError } = await client
        .from('templates')
        .insert({
            user_id: userId,
            name,
            slug,
            source: 'user_upload',
            fingerprint,
            is_system_template: false,
            is_imported: true,
            preview_meta: signature,
        })
        .select()
        .single();

    if (insertError) {
        // Unique-violation on (user_id, fingerprint): a near-simultaneous
        // second upload of the same design raced this insert and won —
        // re-fetch and reuse its row rather than surfacing a spurious
        // error for what is, from the user's perspective, just a normal
        // duplicate-upload case.
        if (insertError.code === '23505') {
            const { data: raced, error: refetchError } = await client
                .from('templates')
                .select('*')
                .eq('user_id', userId)
                .eq('fingerprint', fingerprint)
                .single();
            if (refetchError) throw refetchError;
            return {
                isKnown: false,
                templateId: null,
                category: 'other',
                other: { id: raced.id, name: raced.name, isNew: false },
            };
        }
        throw insertError;
    }

    return {
        isKnown: false,
        templateId: null,
        category: 'other',
        other: { id: inserted.id, name: inserted.name, isNew: true },
    };
}

/**
 * Lists a user's imported ("Other") templates — used by the Template
 * Gallery / template selectors to show the "Other" category alongside the
 * built-in TEMPLATES constant (frontend/src/features/resume/utils/
 * templateMeta.js), which this function deliberately never duplicates.
 */
export async function getImportedTemplatesForUser(client, userId) {
    const { data, error } = await client
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(fromDbRow);
}

/**
 * Fetches one imported template, scoped to the owning user — same
 * ownership-in-the-query-itself pattern as resumeService.getResumeByIdForUser.
 */
export async function getImportedTemplateByIdForUser(client, id, userId) {
    const { data, error } = await client
        .from('templates')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return fromDbRow(data);
}

/**
 * Deletes an imported template, scoped to the owning user — ownership is
 * enforced in the query itself (not by trusting the caller), same
 * pattern as resumeService.removeResumeForUser.
 */
export async function removeImportedTemplateForUser(client, id, userId) {
    const { error, count } = await client
        .from('templates')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) throw error;
    return (count ?? 0) > 0;
}
