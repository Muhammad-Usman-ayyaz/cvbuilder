/**
 * ATS scoring now delegates to a separate Python microservice (ats-service/)
 * that calls the Gemini API for AI-based analysis, instead of doing
 * rule-based keyword/formatting scoring locally. This file is just the
 * HTTP client for that service — see ats-service/gemini_analyzer.py for
 * the actual scoring logic and prompt.
 */

const ATS_SERVICE_URL = process.env.ATS_SERVICE_URL || 'http://localhost:8001';
const ATS_SERVICE_TIMEOUT_MS = 30000;

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
