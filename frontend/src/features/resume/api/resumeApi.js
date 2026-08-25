import { fetchApi } from '../../../api/client.js';

export async function getAllResumes() {
    return fetchApi('/resumes', {
        method: 'GET',
    });
}

export async function getResumeById(id) {
    return fetchApi(`/resumes/${id}`, {
        method: 'GET',
    });
}

export async function upsertResume(resume) {
    return fetchApi('/resumes', {
        method: 'POST',
        body: resume,
    });
}

export async function removeResume(id) {
    const response = await fetchApi(`/resumes/${id}`, {
        method: 'DELETE',
    });
    return response.success;
}
