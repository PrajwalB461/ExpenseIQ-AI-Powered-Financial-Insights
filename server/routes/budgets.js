import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetSuggestions
} from '../controllers/budgetController.js';

const router = Router();

// Protect all budgeting endpoints
router.use(protect);

router.post('/', createBudget);
router.get('/', getBudgets);
router.get('/suggestions', getBudgetSuggestions);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;
