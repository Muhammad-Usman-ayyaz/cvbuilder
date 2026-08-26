import express from 'express';
import * as atsController from '../controllers/atsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/check', atsController.checkAts);

export default router;
