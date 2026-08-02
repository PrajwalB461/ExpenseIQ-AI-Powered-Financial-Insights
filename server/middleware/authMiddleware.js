import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Read access token from HTTP-only cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Alternately check Authorization header
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token missing'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key_for_expense_tracker_ai_2026');

    // Fetch the user from database to check password status
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user profile not found'
      });
    }

    // Reject tokens issued before last password change
    if (user.passwordChangedAt && decoded.iat) {
      const changedSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedSeconds) {
        return res.status(401).json({
          success: false,
          message: 'Session closed because password was reset. Please log in again.'
        });
      }
    }

    req.user = user; // Attach mongoose model document to request scope

    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired'
    });
  }
};
