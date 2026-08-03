import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  logout, 
  getMe, 
  googleAuthStub
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateInput } from '../middleware/validationMiddleware.js';

const router = Router();

// Validation schemas
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/v1/auth/register
router.post('/register', registerValidation, validateInput, register);

// @route   POST /api/v1/auth/login
router.post('/login', loginValidation, validateInput, login);

// @route   POST /api/v1/auth/logout
router.post('/logout', logout);

// @route   GET /api/v1/auth/me
router.get('/me', protect, getMe);

// @route   POST /api/v1/auth/google (Stub Placeholder)
router.post('/google', googleAuthStub);

export default router;
