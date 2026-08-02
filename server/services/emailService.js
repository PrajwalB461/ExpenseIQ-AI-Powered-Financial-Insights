import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const isProd = process.env.NODE_ENV === 'production';

// Startup check: fail fast in production if key is missing
if (isProd && !apiKey) {
  console.error('==================================================================');
  console.error('[CRITICAL CONFIG ERROR] RESEND_API_KEY is not set in production!');
  console.error('The server will refuse to start to avoid silent email failures.');
  console.error('==================================================================');
  process.exit(1);
}

// Instantiate resend if apiKey exists
const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Sends a verification email to the user.
 * Handles fallbacks based on environment configuration.
 *
 * @param {string} toEmail - Receipient email Address
 * @param {string} verificationLink - Link to verify the email
 */
export const sendVerificationEmail = async (toEmail, verificationLink) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  if (!resend) {
    if (isProd) {
      // Defense-in-depth: If startup check was somehow bypassed
      console.warn('[SECURITY WARNING] Mail service bypassed! Email api key missing: Link omitted in prod logs.');
      return;
    } else {
      // Local development fallback: Log the link to the console for testing
      console.log('\n--- [LOCAL EMAIL SERVICE FALLBACK] ---');
      console.log(`Sending verification mail to: ${toEmail}`);
      console.log(`Verification URL: ${verificationLink}`);
      console.log('--------------------------------------\n');
      return;
    }
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Verify Your Email - FinIntel AI',
      html: `
        <div style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
          <h2 style="color: #a78bfa; margin-bottom: 16px;">Welcome to FinIntel AI</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #cbd5e1;">Please verify your email address to complete your registration and secure your automated expense tracker workspace.</p>
          <div style="margin: 24px 0;">
            <a href="${verificationLink}" style="background-color: #8b5cf6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">Verify Email Address</a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="font-size: 12px; color: #38bdf8; word-break: break-all;">${verificationLink}</p>
        </div>
      `
    });
    console.log(`[Email Service] Verification mail dispatched successfully to ${toEmail}`);
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${toEmail}: ${error.message}`);
    // We return without throwing to prevent registration from crashing the request flow
  }
};
