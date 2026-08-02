import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendVerificationEmail, sendOtpEmail } from '../services/emailService.js';
import { seedDefaultCategories } from '../services/categoryService.js';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
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
  res.status(501).json({
    success: false,
    message: 'Google Sign-In integration placeholder stub. Coming soon!'
  });
};

// Memory store for email-scoped Rate Limiting (Forgot Password)
const forgotPasswordRateLimit = new Map();

// @desc    Initiate forgot password OTP request
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Rate Limit check (max 3 times per email per hour)
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    let timestamps = forgotPasswordRateLimit.get(normalizedEmail) || [];
    // filter to timestamps in last hour
    timestamps = timestamps.filter(t => t > oneHourAgo);
    if (timestamps.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset requests. Please wait before trying again.'
      });
    }
    timestamps.push(now);
    forgotPasswordRateLimit.set(normalizedEmail, timestamps);

    // 2. Look up the user
    const user = await User.findOne({ email: normalizedEmail });
    
    // Always return success even if user not found (security practice: no account enumeration)
    const genericResponse = {
      success: true,
      message: 'If that email is registered, a code has been sent.'
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // 3. Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Hash code and save with expiration (10 min)
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.otpHash = hashedOtp;
    user.otpExpiresAt = new Date(now + 10 * 60 * 1000); // 10 minutes
    user.otpAttempts = 0;
    await user.save();

    // 5. Send OTP via Email
    await sendOtpEmail(normalizedEmail, otp);

    return res.status(200).json(genericResponse);

  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP code and return resetToken
// @route   POST /api/v1/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email and verification code are required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+otpHash +otpExpiresAt +otpAttempts');
    
    const rejectResponse = () => {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code'
      });
    };

    if (!user) {
      return rejectResponse();
    }

    // Reject if no OTP is defined, expired, or attempts locked (>= 5)
    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date() || user.otpAttempts >= 5) {
      return rejectResponse();
    }

    // Match OTP input
    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return rejectResponse();
    }

    // OTP matches cleanly! Clear OTP attributes (single-use)
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    // Generate short-lived reset token (10 minutes)
    const resetToken = jwt.sign(
      { purpose: 'password_reset', sub: user._id },
      process.env.JWT_SECRET || 'default_secret_key_for_expense_tracker_ai_2026',
      { expiresIn: '10m' }
    );

    return res.status(200).json({
      success: true,
      resetToken
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using valid resetToken
// @route   POST /api/v1/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Reset token and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  try {
    // Verify token identity & purpose
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'default_secret_key_for_expense_tracker_ai_2026');
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token purpose'
      });
    }

    // Find token subject
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Hash and update credentials
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.passwordChangedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please log in.'
    });

  } catch (error) {
    next(error);
  }
};
