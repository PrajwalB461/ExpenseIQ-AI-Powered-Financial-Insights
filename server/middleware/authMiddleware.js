import jwt from 'jsonwebtoken';

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

    // Attach decoded user info to request.
    // For scaffolding, we check if details exist, otherwise attach the payload directly.
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      ...decoded
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or expired'
    });
  }
};
