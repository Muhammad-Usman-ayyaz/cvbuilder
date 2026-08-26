import { fetchApi } from '../../../api/client.js';

export async function checkAts({ resumeId, jobDescription }) {
    return fetchApi('/ats/check', {
        method: 'POST',
        body: { resumeId, jobDescription },
    });
}
