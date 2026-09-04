import * as resumeService from '../services/resumeService.js';
import { extractText, hasValidSignature, ExtractionError } from '../services/textExtractionService.js';
import { extractStructuredResume, lowConfidencePersonalFields } from '../services/uploadService.js';
import * as templateService from '../services/templateService.js';
import { ALLOWED_EXTENSIONS } from '../config/upload.js';
import { createDailyQuota } from '../services/dailyQuota.js';

// Upload extraction costs exactly one Gemini call per file (see
// ats-service/gemini_analyzer.py's extract_resume) — same shared
// project-wide free-tier budget documented in atsController.js
// (ATS_CHECK_DAILY_GLOBAL_LIMIT x 1 + IMPROVE_DAILY_GLOBAL_LIMIT x 6 = 18
// of the real 20/day ceiling). Budgeting 2 uploads/day here uses up the
// remaining buffer entirely (18 + 2 = 20) -- deliberately thin, but the
// alternative is silently competing with the other two features for the
// same quota with no cap of its own.
const UPLOAD_DAILY_GLOBAL_LIMIT = parseInt(process.env.UPLOAD_DAILY_GLOBAL_LIMIT, 10) || 2;
const uploadDailyQuota = createDailyQuota(UPLOAD_DAILY_GLOBAL_LIMIT);

const CONTROL_CHARS_PATTERN = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + String.fromCharCode(127) + ']', 'g');

/**
 * Strips path separators/control characters and the extension from an
 * uploaded filename, for safe use as a suggested resume title. Never used
 * to construct a filesystem path (the file is never written to disk), but
 * still sanitized before it's echoed back to the client / stored as a
 * resume title.
 */
function sanitizeFilenameForTitle(originalname) {
    const base = String(originalname || '')
        .replace(/[\\/]/g, ' ')
        .replace(CONTROL_CHARS_PATTERN, '')
        .replace(/\.(pdf|docx)$/i, '')
        .trim();
    return base.slice(0, 150) || 'Imported CV';
}

// A malformed id (not a valid UUID) or any other unexpected DB/PostgREST
// failure should never reach the client as raw driver text (e.g. Postgres's
// own "invalid input syntax for type uuid: ..." message, or a PGRST205/
// PGRST204 schema-cache error) — log it server-side for diagnostics and
// return a clean, generic message instead. Matches the pattern already used
// in this file's uploadResume handler and in templateController.js.
function genericServerError(res, error, context) {
    console.error(`${context}:`, error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

export async function getAllResumes(req, res) {
    try {
        const resumes = await resumeService.getAllResumes(req.supabase, req.user.id);
        res.status(200).json(resumes);
    } catch (error) {
        genericServerError(res, error, 'Failed to list resumes');
    }
}

export async function getResume(req, res) {
    try {
        const resume = await resumeService.getResumeByIdForUser(req.supabase, req.params.id, req.user.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.status(200).json(resume);
    } catch (error) {
        // A malformed (non-UUID) id is a 404, not a 500 — the resume
        // certainly doesn't exist under an id that isn't even valid.
        if (error.code === '22P02') {
            return res.status(404).json({ error: 'Resume not found' });
        }
        genericServerError(res, error, 'Failed to fetch resume');
    }
}

export async function upsertResume(req, res) {
    try {
        // req.body should contain the resume object
        const resume = await resumeService.upsertResume(req.supabase, req.body, req.user.id);
        res.status(200).json(resume);
    } catch (error) {
        genericServerError(res, error, 'Failed to save resume');
    }
}

export async function deleteResume(req, res) {
    try {
        const success = await resumeService.removeResumeForUser(req.supabase, req.params.id, req.user.id);
        res.status(200).json({ success });
    } catch (error) {
        if (error.code === '22P02') {
            return res.status(200).json({ success: false });
        }
        genericServerError(res, error, 'Failed to delete resume');
    }
}

/**
 * POST /api/resumes/upload — multer (memory storage, see resumeRoutes.js)
 * has already put the file on req.file by the time this runs. This handler
 * only ever produces a DRAFT for the review screen; nothing is written to
 * the database here (see upsertResume above, which the frontend calls
 * separately once the user confirms the reviewed draft on the "Import CV"
 * screen) — so there's no ownership check to perform beyond requireAuth
 * itself, since no resource is being read or written by id.
 */
export async function uploadResume(req, res) {
    let reservedDailySlot = false;
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file was uploaded.' });
        }
        if (!file.buffer || file.buffer.length === 0) {
            return res.status(422).json({ error: "We couldn't read this CV. Please try another file." });
        }

        // Extension decides which parser to use; the file's actual magic
        // bytes (not the client-supplied Content-Type, which is trivially
        // spoofable and which real browsers get wrong for .docx surprisingly
        // often) confirm the bytes are structurally what the extension
        // claims before anything tries to parse them — see
        // textExtractionService.hasValidSignature. Together these catch a
        // renamed file (e.g. some-payload.exe renamed to resume.pdf: right
        // extension, wrong bytes) without depending on an unreliable header.
        const extMatch = file.originalname.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0].toLowerCase() : '';
        const kindFromExt = ALLOWED_EXTENSIONS[ext];

        if (!kindFromExt || !hasValidSignature(file.buffer, kindFromExt)) {
            return res.status(415).json({
                error: 'Please upload a PDF or DOCX file.',
            });
        }

        // Reserved before the Gemini-consuming extraction step, same
        // principle as the ATS check/improve quotas — a capped day should
        // never cost an API call.
        if (!uploadDailyQuota.tryReserve()) {
            return res.status(503).json({
                error: 'CV upload is temporarily unavailable — the daily AI usage limit has been reached for all users. Please try again tomorrow.',
                code: 'UPLOAD_DAILY_LIMIT_REACHED',
            });
        }
        reservedDailySlot = true;

        let text, docMeta;
        try {
            ({ text, docMeta } = await extractText(file.buffer, kindFromExt));
        } catch (err) {
            if (err instanceof ExtractionError) {
                uploadDailyQuota.release();
                reservedDailySlot = false;
                return res.status(422).json({ error: "We couldn't read this CV. Please try another file." });
            }
            throw err;
        }

        const extracted = await extractStructuredResume(text);

        // Deterministic, zero extra Gemini calls — see templateService.js's
        // module docstring for exactly what this can/can't detect. Never
        // allowed to fail the whole upload: a missing `templates` table
        // (templates_migration.sql not yet applied) or any other detection
        // error degrades to "unknown, not registered" rather than losing
        // the extraction result the user is waiting on.
        let template = { isKnown: false, templateId: null, category: 'other', other: null };
        try {
            template = await templateService.detectAndRegisterTemplate(req.supabase, req.user.id, {
                kind: kindFromExt,
                docMeta,
                extracted,
            });
        } catch (templateError) {
            // PGRST205: PostgREST can't find the `templates` table —
            // templates_migration.sql hasn't been applied yet. Expected
            // until then, not worth logging as an error every upload.
            if (templateError.code !== 'PGRST205') {
                console.error('Template detection failed:', templateError);
            }
        }

        res.status(200).json({
            extracted,
            suggestedTitle: sanitizeFilenameForTitle(file.originalname),
            lowConfidenceFields: lowConfidencePersonalFields(extracted.personal),
            template,
        });
    } catch (error) {
        if (reservedDailySlot) {
            uploadDailyQuota.release();
        }
        if (error.code === 'ATS_SERVICE_UNAVAILABLE' || error.code === 'GEMINI_QUOTA_EXCEEDED') {
            return res.status(503).json({ error: error.message, code: error.code });
        }
        console.error('Upload failed:', error);
        // Never leak library/filesystem internals (stack traces, temp
        // paths) to the client — a generic message covers any extraction
        // or parsing failure not already handled above.
        res.status(500).json({ error: "We couldn't extract the information from this CV. Please try again." });
    }
}
