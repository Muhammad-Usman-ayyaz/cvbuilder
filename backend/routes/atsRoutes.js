import express from 'express';
import * as atsController from '../controllers/atsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/check', atsController.checkAts);
router.post('/improve', atsController.improveResumeHandler);
router.get('/improve/limit', atsController.getImproveLimit);
router.get('/history', atsController.getHistory);
router.get('/history/:id', atsController.getHistoryItem);
router.get('/status', atsController.getStatus);

export default router;
