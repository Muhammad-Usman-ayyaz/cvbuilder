/**
 * ATS scoring now delegates to a separate Python microservice (ats-service/)
 * that calls the Gemini API for AI-based analysis, instead of doing
 * rule-based keyword/formatting scoring locally. This file is just the
 * HTTP client for that service — see ats-service/gemini_analyzer.py for
 * the actual scoring logic and prompt.
 */

const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL || 'http://localhost:8001';
// gemini_analyzer.py caps each model attempt at 20s before failing over to
// the next one in FALLBACK_MODELS (1s pause between attempts) — a 30s
// timeout here could fire mid-fallback and surface a false "service
// unavailable" for a request that would have succeeded moments later.
// 60s covers two full attempts with margin. See uploadService.js's
// EXTRACT_SERVICE_TIMEOUT_MS for the same reasoning.
const ATS_SERVICE_TIMEOUT_MS = 60000;
// The improve loop chains up to 3 rounds of (propose + rescore) — up to 6
// Gemini calls in sequence — so it gets a much longer timeout than a
// single /analyze call.
const IMPROVE_SERVICE_TIMEOUT_MS = 150000;

/**
 * @param {object} resumeContent
 * @param {string} jobDescription
 * @returns {Promise<{
 *   overallScore: number,
 *   keywordMatch: { score: number, matched: string[], missing: string[] },
 *   formatting: { checks: Array<{label: string, passed: boolean, note: string}> },
 *   warnings: string[]
 * }>}
 */
export async function analyzeResume(resumeContent, jobDescription) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATS_SERVICE_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(`${ATS_SERVICE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeContent, jobDescription }),
            signal: controller.signal,
        });
    } catch (err) {
        // Covers both "service unreachable" (process not running/refused)
        // and the abort-on-timeout case — the request never got a response
        // at all, as opposed to the service being up but erroring below.
        throw serviceUnavailableError();
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        // The Python process IS reachable here — it returned an error (e.g.
        // the Gemini call itself failed). Distinct from "service is down".
        throw new Error('ATS analysis failed. Please try again.');
    }

    return response.json();
}

/**
 * @param {object} resumeContent
 * @param {string} jobDescription
 * @param {object|null} currentAnalysis - the most recent /analyze result for
 *   this resume+JD pair, if the caller already has one (skips a redundant
 *   Gemini call for the starting score).
 * @returns {Promise<{
 *   originalContent: object,
 *   proposedContent: object,
 *   initialScore: number,
 *   finalScore: number,
 *   iterations: number,
 *   scoreHistory: number[],
 *   finalAnalysis: object,
 *   changeNotes: string[],
 * }>}
 */
export async function improveResume(resumeContent, jobDescription, currentAnalysis) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMPROVE_SERVICE_TIMEOUT_MS);

    let response;
    try {
        response = await fetch(`${ATS_SERVICE_URL}/improve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resumeContent,
                jobDescription,
                currentAnalysis: currentAnalysis ?? null,
            }),
            signal: controller.signal,
        });
    } catch (err) {
        throw serviceUnavailableError();
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error('Resume improvement failed. Please try again.');
    }

    return response.json();
}

function serviceUnavailableError() {
    const err = new Error(
        'The ATS analysis service is currently unavailable. Your check did not run — please try again shortly.'
    );
    err.code = 'ATS_SERVICE_UNAVAILABLE';
    return err;
}

/**
 * Quick reachability check against the microservice's health route — used
 * by the Node backend's own startup log and by GET /api/ats/status so
 * "is it actually running" doesn't require digging through terminals.
 */
export async function checkAtsServiceHealth() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
        const response = await fetch(ATS_SERVICE_URL, { signal: controller.signal });
        return response.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
}
