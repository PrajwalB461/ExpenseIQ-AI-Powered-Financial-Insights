import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { validatePassword } from '../utils/passwordPolicy.js';

const router = Router();

// @route   PUT /api/v1/users/me
// @access  Private
router.put('/me', protect, async (req, res, next) => {
  const { name, password, currentPassword, monthlyIncome } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // If changing password, current password matching is required
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to request a security update.'
        });
      }

      // Check if user is third-party oauth
      if (user.authProvider === 'google') {
        return res.status(400).json({
          success: false,
          message: 'Google accounts cannot edit local credentials.'
        });
      }

      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Verify password policy
      const pwdErrors = validatePassword(password);
      if (pwdErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: pwdErrors.join(' ')
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(password, salt);
      user.passwordChangedAt = new Date(Date.now() - 1000);
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (monthlyIncome !== undefined) {
      user.monthlyIncome = parseFloat(monthlyIncome) || 0;
    }

    if (req.body.hasCompletedOnboarding !== undefined) {
      user.hasCompletedOnboarding = req.body.hasCompletedOnboarding === true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account details updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        monthlyIncome: user.monthlyIncome,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/users/complete-onboarding
// @access  Private
router.post('/complete-onboarding', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.hasCompletedOnboarding = true;
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Financial onboarding status marked as complete.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
