import { fetchApi } from '../../../api/client.js';

export async function checkAts({ resumeId, jobDescription }) {
    return fetchApi('/ats/check', {
        method: 'POST',
        body: { resumeId, jobDescription },
    });
}

/**
 * @returns {Promise<{ history: Array<object>, count: number, limit: number }>}
 */
export async function getAtsHistory() {
    return fetchApi('/ats/history', {
        method: 'GET',
    });
}

/**
 * @param {{ resumeId: string, jobDescription: string, currentAnalysis?: object }} params
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
export async function improveResume({ resumeId, jobDescription, currentAnalysis }) {
    return fetchApi('/ats/improve', {
        method: 'POST',
        body: { resumeId, jobDescription, currentAnalysis },
    });
}

/**
 * @returns {Promise<{ count: number, limit: number, dailyGlobalRemaining: number }>}
 */
export async function getImproveLimitStatus() {
    return fetchApi('/ats/improve/limit', {
        method: 'GET',
    });
}

export async function getAtsHistoryItem(id) {
    return fetchApi(`/ats/history/${id}`, {
        method: 'GET',
    });
}

/**
 * @returns {Promise<{ available: boolean }>}
 */
export async function getAtsServiceStatus() {
    return fetchApi('/ats/status', {
        method: 'GET',
    });
}
