import * as templateService from '../services/templateService.js';

/**
 * GET /api/templates — the user's imported ("Other") templates only. The
 * 3 built-in templates (classic/modern/minimal) are frontend constants
 * (templateMeta.js) and deliberately not duplicated here — the frontend
 * merges this list with that constant for display. See
 * templateService.js's module docstring for why "Other" is effectively
 * the only category this table ever contains.
 */
export async function listImportedTemplates(req, res) {
    try {
        const templates = await templateService.getImportedTemplatesForUser(req.supabase, req.user.id);
        res.status(200).json(templates);
    } catch (error) {
        // A missing `templates` table (migration not yet applied — see
        // templates_migration.sql) shouldn't 500 for what is, from the
        // user's perspective, just "no imported templates yet" — PostgREST
        // reports PGRST205 (not Postgres's own 42P01) for a table it can't
        // find in its schema cache. This list is supplementary display
        // data either way, so any failure degrades to an empty list rather
        // than blocking the page.
        if (error.code === 'PGRST205') {
            return res.status(200).json([]);
        }
        console.error('Failed to list imported templates:', error);
        res.status(500).json({ error: 'Failed to load templates.' });
    }
}

export async function getImportedTemplate(req, res) {
    try {
        const template = await templateService.getImportedTemplateByIdForUser(req.supabase, req.params.id, req.user.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.status(200).json(template);
    } catch (error) {
        // A missing table means this specific template certainly doesn't
        // exist either — 404 is the accurate response, not a 500, and
        // never leaks the underlying database error either way (this app
        // has an existing convention elsewhere of forwarding error.message
        // to the client; this is a new surface, so it doesn't inherit
        // that here).
        if (error.code === 'PGRST205') {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.status(500).json({ error: 'Failed to load this template.' });
    }
}

export async function deleteImportedTemplate(req, res) {
    try {
        const success = await templateService.removeImportedTemplateForUser(req.supabase, req.params.id, req.user.id);
        res.status(200).json({ success });
    } catch (error) {
        if (error.code === 'PGRST205') {
            return res.status(200).json({ success: false });
        }
        res.status(500).json({ error: 'Failed to remove this template.' });
    }
}
