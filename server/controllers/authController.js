import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { seedDefaultCategories } from '../services/categoryService.js';
import { validatePassword } from '../utils/passwordPolicy.js';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Validate password policy
    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: pwdErrors.join(' ')
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in database (no verification token/expiry)
    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'local'
    });

    // Seed default Categories (Salary, Food, Transport etc) for this new User
    await seedDefaultCategories(user._id);

    // Issue JWT cookie
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'default_secret_key_for_expense_tracker_ai_2026',
      { expiresIn: '7d' }
    );

    // Set HTTP-only Cookie settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    // Return user (excluding password)
    res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          authProvider: user.authProvider,
          hasCompletedOnboarding: user.hasCompletedOnboarding
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user and return JWT token
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user (with explicit select of passwordHash due to select: false in schema option)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials'
      });
    }

    // Account check for third party auth
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please sign in via Google.'
      });
    }

    // Check credentials match
    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials'
      });
    }

    // Issue JWT cookie
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'default_secret_key_for_expense_tracker_ai_2026',
      { expiresIn: '7d' }
    );

    // Set HTTP-only Cookie settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          authProvider: user.authProvider,
          hasCompletedOnboarding: user.hasCompletedOnboarding
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Invalidates HTTP cookie session
// @route   POST /api/v1/auth/logout
// @access  Private (or Public)
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtain authentic context profile details
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No profile details exist for this session user identifier'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stub placeholders for Google Login integration
// @route   POST /api/v1/auth/google
// @access  Public
export const googleAuthStub = async (req, res, next) => {
  // Stub only, don't fully implement
  res.status(501).json({
    success: false,
    message: 'Google Sign-In integration placeholder stub. Coming soon!'
  });
};
