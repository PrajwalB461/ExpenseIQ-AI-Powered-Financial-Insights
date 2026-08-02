import { Router } from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Apply protection middleware to all category routes
router.use(protect);

router.route('/')
  .get(getCategories)
  .post(createCategory);

export default router;
