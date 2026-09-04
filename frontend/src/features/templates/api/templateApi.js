import { fetchApi } from '../../../api/client.js';

/**
 * The 3 built-in templates never live here — they're the TEMPLATES
 * constant in features/resume/utils/templateMeta.js. This only ever
 * returns the signed-in user's imported ("Other") templates; the
 * frontend merges both lists for display (see TemplateGalleryPage.jsx).
 */
export async function getImportedTemplates() {
    return fetchApi('/templates', { method: 'GET' });
}

export async function getImportedTemplate(id) {
    return fetchApi(`/templates/${id}`, { method: 'GET' });
}

export async function deleteImportedTemplate(id) {
    const response = await fetchApi(`/templates/${id}`, { method: 'DELETE' });
    return response.success;
}
