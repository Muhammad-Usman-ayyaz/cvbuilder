import express from 'express';
import multer from 'multer';
import * as resumeController from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/auth.js';
import { MAX_FILE_SIZE_BYTES } from '../config/upload.js';

const router = express.Router();

// Memory storage only — the uploaded file is never written to disk, so
// there is no temp file to clean up and no filesystem path a client could
// ever be exposed to. multer's own fileSize limit is the first line of
// defense against oversized uploads (rejected before the handler even
// runs); resumeController.uploadResume does its own MIME/extension check
// since multer's fileFilter can't easily produce a clean 415 JSON error.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

router.use(requireAuth);

router.get('/', resumeController.getAllResumes);
router.get('/:id', resumeController.getResume);
router.post('/', resumeController.upsertResume);
router.delete('/:id', resumeController.deleteResume);

router.post('/upload', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: 'File is too large. Maximum size is 5MB.' });
            }
            return res.status(400).json({ error: 'Invalid file upload.' });
        }
        if (err) return next(err);
        next();
    });
}, resumeController.uploadResume);

export default router;
