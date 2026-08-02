import { Router } from 'express';
import { body } from 'express-validator';
import { 
  createIncome, 
  getIncomes, 
  updateIncome, 
  deleteIncome 
} from '../controllers/incomeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateInput } from '../middleware/validationMiddleware.js';

const router = Router();

const incomeValidationRules = [
  body('accountId')
    .notEmpty()
    .withMessage('Asset account ID is required'),
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

// Apply auth protection filter to all routes
router.use(protect);

router.route('/')
  .post(incomeValidationRules, validateInput, createIncome)
  .get(getIncomes);

router.route('/:id')
  .put(incomeValidationRules, validateInput, updateIncome)
  .delete(deleteIncome);

export default router;
