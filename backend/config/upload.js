/**
 * Shared constants for the CV upload feature — kept in one place so the
 * multer config (routes/resumeRoutes.js) and the validation in
 * controllers/resumeController.js can't drift apart.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_MIME_TYPES = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export const ALLOWED_EXTENSIONS = {
    '.pdf': 'pdf',
    '.docx': 'docx',
};
