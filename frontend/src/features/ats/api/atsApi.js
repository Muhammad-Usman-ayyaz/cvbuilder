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
