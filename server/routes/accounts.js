import { Router } from 'express';
import { body } from 'express-validator';
import { 
  createAccount, 
  getAccounts, 
  getAccountById, 
  updateAccount, 
  deleteAccount 
} from '../controllers/accountController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateInput } from '../middleware/validationMiddleware.js';

const router = Router();

// Validation checks
const accountCreationValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Account name is required'),
  body('type')
    .isIn(['bank', 'cash', 'wallet', 'credit_card'])
    .withMessage('Account type must be one of bank, cash, wallet, or credit_card'),
  body('balance')
    .optional()
    .isFloat()
    .withMessage('Balance must be a valid number'),
  body('creditLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Credit limit must be a positive number')
    .custom((val, { req }) => {
      if (req.body.type === 'credit_card' && (val === undefined || val === null)) {
        throw new Error('Credit limit is required for credit cards');
      }
      return true;
    })
];

const accountUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Account name cannot be empty')
  // Balance is explicitly dropped in the controller to prevent direct edits
];

// Apply protection middleware to all account router paths
router.use(protect);

router.route('/')
  .post(accountCreationValidation, validateInput, createAccount)
  .get(getAccounts);

router.route('/:id')
  .get(getAccountById)
  .put(accountUpdateValidation, validateInput, updateAccount)
  .delete(deleteAccount);

export default router;
