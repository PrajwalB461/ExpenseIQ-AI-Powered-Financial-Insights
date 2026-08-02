import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { seedDefaultCategories } from '../services/categoryService.js';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate plain random verification token & set expiry to 24h
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    // Create user in database
    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'local',
      verificationToken: token,
      verificationTokenExpires: tokenExpiry
    });

    // Seed default Categories (Salary, Food, Transport etc) for this new User
    await seedDefaultCategories(user._id);

    // Build the verification link pointing to the server endpoint
    const verificationLink = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${token}`;

    // Call service to send email (safe fallback mode logs to console in dev)
    await sendVerificationEmail(email, verificationLink);

    // Return user (excluding verification token/password)
    res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful. Please verify your email.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify user email via activation link token
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  const { token } = req.params;

  try {
    // Find user by verification token that has not expired
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      // In web browser clicks, displaying a simple error page or redirecting with code is cleaner.
      // Redirect to client login with verification failure
      return res.redirect('http://localhost:5173/login?verified=false&reason=expired');
    }

    // Update email status
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Redirect to client login with successfully verified indicator
    res.redirect('http://localhost:5173/login?verified=true');

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
    // Find user (case-insensitive done via model middleware config, but regex/normal checks work)
    const user = await User.findOne({ email });
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
    const isMatch = await bcrypt.compare(password, user.passwordHash);
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
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider
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
    const user = await User.findById(req.user.id).select('-passwordHash -verificationToken -verificationTokenExpires');
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
  // POST /api/v1/auth/google
  // In a future phase:
  // 1. Fetch authorization code or idToken from req.body
  // 2. Query google-auth-library client.verifyIdToken(...) to fetch profile details
  // 3. Find user with email, fallback to creating account with provider: "google"
  // 4. Inject session JWT cookie and return credentials user profile
  res.status(501).json({
    success: false,
    message: 'Google Sign-In integration placeholder stub. Coming soon!'
  });
};
