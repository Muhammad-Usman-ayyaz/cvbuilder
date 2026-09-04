/**
 * CV upload — file -> text (textExtractionService.js) -> structured draft.
 * The structured step delegates to the same Python ats-service that
 * already owns all Gemini access (model fallback, prompt conventions) —
 * see ats-service/gemini_analyzer.py's extract_resume(). This file is just
 * the HTTP client for that service's /extract route, mirroring the
 * conventions in atsService.js (analyzeResume/improveResume).
 */

const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL || 'http://localhost:8001';
// gemini_analyzer.py caps each model attempt at 20s (client-side timeout)
// before failing over to the next one in FALLBACK_MODELS, with a 1s pause
// between attempts. Observed in testing: a 30s timeout here was too tight
// — it could fire mid-fallback (after the primary model used its full 20s
// and the second attempt was still in flight), surfacing as a false
// "service unavailable" for a request that would have succeeded a few
// seconds later. 60s comfortably covers two full attempts (2 × 20s + 1s)
// with margin, without being unreasonably long for a single request.
const EXTRACT_SERVICE_TIMEOUT_MS = 60000;

/**
 * @param {string} text
 * @returns {Promise<{
 *   personal: object,
 *   experience: object[],
 *   education: object[],
 *   projects: object[],
 *   skills: object[],
 *   certifications: object[],
 * }>}
 */
export async function extractStructuredResume(text) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EXTRACT_SERVICE_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(`${ATS_SERVICE_URL}/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            signal: controller.signal,
        });
    } catch (err) {
        throw extractionServiceUnavailableError();
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        if (response.status === 429) {
            const err = new Error('AI processing is temporarily unavailable. Please try again later.');
            err.code = 'GEMINI_QUOTA_EXCEEDED';
            throw err;
        }
        throw new Error("We couldn't extract the information from this CV. Please try again.");
    }

    return response.json();
}

function extractionServiceUnavailableError() {
    const err = new Error(
        'AI processing is temporarily unavailable. Please try again later.'
    );
    err.code = 'ATS_SERVICE_UNAVAILABLE';
    return err;
}

/**
 * Every field the extraction step left empty is a field that couldn't be
 * confidently pulled from the document — this is the "highlight low-
 * confidence fields" signal for the review screen. Deliberately dumb
 * (empty === not-extracted) rather than a second AI-generated confidence
 * score, since a self-reported confidence value is itself something
 * Gemini could get wrong/inflate.
 *
 * @param {object} personal
 * @returns {string[]} personal field names that came back empty
 */
export function lowConfidencePersonalFields(personal) {
    const fields = ['fullName', 'email', 'phone', 'location', 'linkedin', 'github', 'portfolio', 'summary'];
    return fields.filter((f) => !personal?.[f] || !String(personal[f]).trim());
}
