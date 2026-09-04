const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Uploads a CV file for extraction. Deliberately bypasses the shared
 * fetchApi() helper (src/api/client.js) — that helper always sets
 * Content-Type: application/json and JSON.stringifies the body, which is
 * wrong for a multipart file upload (the browser must set its own
 * Content-Type with the multipart boundary). Auth is sent the same way
 * fetchApi does it (cookie + bearer fallback) so requireAuth on the
 * backend sees an identical request shape either way.
 *
 * @param {File} file
 * @returns {Promise<{
 *   extracted: object,
 *   suggestedTitle: string,
 *   lowConfidenceFields: string[],
 * }>}
 */
export async function uploadCv(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/resumes/upload`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
    });

    let data;
    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const error = new Error((data && data.error) || response.statusText || 'CV upload failed.');
        if (data && data.code) error.code = data.code;
        throw error;
    }

    return data;
}
