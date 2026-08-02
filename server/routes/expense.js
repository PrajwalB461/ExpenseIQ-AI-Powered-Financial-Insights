import { Router } from 'express';
import { body } from 'express-validator';
import { 
  createExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense,
  getExpenseSummary
} from '../controllers/expenseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateInput } from '../middleware/validationMiddleware.js';

const router = Router();

const expenseValidationRules = [
  body('accountId')
    .notEmpty()
    .withMessage('Account ID is required'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than zero'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please specify a valid ISO8601 datetime format')
];

// Protect all routes
router.use(protect);

// Summary aggregate endpoint (registered before /:id)
router.get('/summary', getExpenseSummary);

router.route('/')
  .post(expenseValidationRules, validateInput, createExpense)
  .get(getExpenses);

router.route('/:id')
  .put(expenseValidationRules, validateInput, updateExpense)
  .delete(deleteExpense);

export default router;
