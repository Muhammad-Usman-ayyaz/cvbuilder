import express from 'express';
import { getProfile, upsertProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All profile routes require authentication
router.use(requireAuth);

router.get('/', getProfile);
router.post('/', upsertProfile); // Upsert handles both creation and updates

export default router;
