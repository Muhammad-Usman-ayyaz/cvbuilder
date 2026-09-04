import crypto from 'crypto';

// This app's own PDF export (frontend/src/features/resume/components/
// templates/pdf/SelectablePdfTemplate.jsx) embeds this exact marker as the
// PDF's `Subject` Info field — see that file's <Document subject=...>.
// If a re-uploaded PDF carries it, we know with certainty (not a guess)
// which of the 3 built-in templates it was rendered with, because this
// app itself put that string there. This is the ONLY deterministic path
// to a "known template" match implemented in Phase 2 — see
// templateService.js's docstring for why matching an arbitrary
// externally-authored PDF/DOCX (Word, Canva, LaTeX, ...) against the 3
// built-in React rendering styles has no reliable signal available in
// this pipeline (no visual/layout data is extracted — see
// textExtractionService.js) and is intentionally NOT attempted; those
// documents are correctly classified "Other", not incorrectly guessed.
const SELF_EXPORT_SUBJECT_PATTERN = /^cvbuilder-template:(classic|modern|minimal)$/;

/**
 * @param {{ producer?: string, creator?: string, subject?: string } | null} pdfInfo
 * @returns {'classic'|'modern'|'minimal'|null} the matched built-in template id, or null
 */
export function detectSelfExportedTemplate(pdfInfo) {
    const subject = pdfInfo?.subject;
    if (!subject) return null;
    const match = SELF_EXPORT_SUBJECT_PATTERN.exec(String(subject).trim());
    return match ? match[1] : null;
}

/**
 * Buckets a count into a small number of stable classes, so two documents
 * with e.g. 4 vs 5 experience entries still fingerprint as "the same
 * shape" rather than manufacturing a distinct fingerprint per exact count.
 * @param {number} n
 */
function bucket(n) {
    if (n <= 0) return '0';
    if (n === 1) return '1';
    if (n === 2) return '2';
    return '3+';
}

/**
 * Strips version numbers / punctuation noise from a PDF producer/creator
 * string (e.g. "Microsoft® Word for Microsoft 365" vs "Microsoft® Word
 * 2019" should fingerprint the same tool) so minor version differences
 * don't fragment what is really the same authoring tool.
 * @param {string} raw
 */
function normalizeToolString(raw) {
    if (!raw) return '';
    return String(raw)
        .toLowerCase()
        .replace(/[\d.]+/g, '')
        .replace(/[^a-z]+/g, ' ')
        .trim();
}

/**
 * Builds the canonical, deterministic structural signature this
 * document's "Other" template identity is derived from. Deliberately
 * contains ONLY document-structure/authoring-tool signals — page count,
 * producer/creator tool name, which resume sections are present, and how
 * many entries each has (bucketed) — and never any of the person's actual
 * resume content (names, employers, dates, descriptions). Two different
 * people's CVs built from the same template/tool with a similar section
 * shape are EXPECTED to fingerprint identically; that's the point (the
 * fingerprint identifies the template, not the person).
 *
 * This is a document-structure fingerprint, not a true visual/typographic
 * one — see templateService.js's docstring for exactly what this can and
 * cannot distinguish.
 *
 * @param {{
 *   kind: 'pdf'|'docx',
 *   pageCount?: number,
 *   producer?: string,
 *   creator?: string,
 *   extracted: object,
 * }} input  extracted is the ExtractedResume-shaped object from
 *   uploadService.extractStructuredResume — only array lengths and the
 *   summary's presence are read from it, never its actual text.
 * @returns {{ signature: object, fingerprint: string }}
 */
export function buildTemplateFingerprint({ kind, pageCount, producer, creator, extracted }) {
    const signature = {
        kind,
        pageCount: kind === 'pdf' ? bucket(pageCount ?? 0) : 'n/a',
        producer: normalizeToolString(producer),
        creator: normalizeToolString(creator),
        hasSummary: Boolean(extracted?.personal?.summary?.trim()),
        experienceCount: bucket(extracted?.experience?.length ?? 0),
        educationCount: bucket(extracted?.education?.length ?? 0),
        projectsCount: bucket(extracted?.projects?.length ?? 0),
        skillGroupCount: bucket(extracted?.skills?.length ?? 0),
        certificationCount: bucket(extracted?.certifications?.length ?? 0),
    };

    // Key order above is fixed/hand-written (not derived from input key
    // order), so JSON.stringify is already canonical here.
    const fingerprint = crypto.createHash('sha256').update(JSON.stringify(signature)).digest('hex');

    return { signature, fingerprint };
}
