import express from 'express';
import * as templateController from '../controllers/templateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', templateController.listImportedTemplates);
router.get('/:id', templateController.getImportedTemplate);
router.delete('/:id', templateController.deleteImportedTemplate);

export default router;
