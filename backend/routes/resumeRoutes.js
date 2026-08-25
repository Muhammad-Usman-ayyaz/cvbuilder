import express from 'express';
import * as resumeController from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', resumeController.getAllResumes);
router.get('/:id', resumeController.getResume);
router.post('/', resumeController.upsertResume);
router.delete('/:id', resumeController.deleteResume);

export default router;
