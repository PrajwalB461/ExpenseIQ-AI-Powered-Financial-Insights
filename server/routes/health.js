import { Router } from 'express';

const router = Router();

// @route   GET /api/v1/health
// @desc    Health check route
// @access  Public
router.get('/', (req, res) => {
  // Check optional config variables to detail the health response
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasResend = !!process.env.RESEND_API_KEY;
  
  res.status(200).json({
    success: true,
    data: {
      status: 'UP',
      timestamp: new Date(),
      uptime: process.uptime(),
      features: {
        groqAiSpace: hasGroq ? 'available' : 'disabled (missing GROQ_API_KEY)',
        resendEmails: hasResend ? 'available' : 'disabled (missing RESEND_API_KEY)'
      }
    }
  });
});

export default router;
