import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAISummary, postAIChat } from '../controllers/aiController.js';

const router = Router();

// Protect all AI Space query lines
router.use(protect);

router.get('/summary', getAISummary);
router.post('/chat', postAIChat);

export default router;
