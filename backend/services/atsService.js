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
        // Covers both "service unreachable" and the abort-on-timeout case.
        throw new Error('ATS analysis is temporarily unavailable.');
    } finally {
        clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error('ATS analysis is temporarily unavailable.');
    }

    return response.json();
}
