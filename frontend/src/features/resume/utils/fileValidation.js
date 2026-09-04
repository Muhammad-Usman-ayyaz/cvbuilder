/**
 * Client-side CV file validation — shared by both upload entry points
 * (My Resumes' UploadCvPage.jsx and the ATS Checker's inline upload) so
 * the rules can't drift apart. This is a first-pass UX check only; the
 * backend (backend/config/upload.js + services/textExtractionService.js's
 * magic-byte check) is the actual security boundary and re-validates
 * everything independently.
 */

export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];
export const ACCEPTED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — must match backend/config/upload.js

export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * @param {File} file
 * @returns {string} an error message, or '' if the file passes.
 */
export function validateCvFile(file) {
    if (!file) return 'No file selected.';
    if (file.size === 0) return 'This file is empty.';
    if (file.size > MAX_FILE_SIZE_BYTES) return 'Your CV must be smaller than 5 MB.';

    const name = file.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const hasValidMime = !file.type || ACCEPTED_MIME_TYPES.includes(file.type);
    if (!hasValidExtension || !hasValidMime) {
        return 'Please upload a PDF or DOCX file.';
    }
    return '';
}
