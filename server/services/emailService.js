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
<div style="margin:0;padding:40px 20px;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <div style="max-width:600px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:20px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:45px 40px;background:linear-gradient(135deg,#7c3aed,#4f46e5);text-align:center;">
      <div style="font-size:34px;margin-bottom:12px;">🚀</div>

      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
        Welcome to FinIntel AI
      </h1>

      <p style="margin:12px 0 0;color:#ede9fe;font-size:16px;">
        Intelligent Expense Tracking Powered by AI
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">

      <h2 style="margin:0 0 18px;color:#f8fafc;font-size:22px;">
        Verify your email
      </h2>

      <p style="margin:0 0 20px;color:#cbd5e1;font-size:15px;line-height:1.8;">
        Thanks for creating your <strong style="color:#ffffff;">FinIntel AI</strong> account.
        To activate your workspace and protect your account, please verify your email address.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:40px 0;">
        <a
          href="${verificationLink}"
          style="
            display:inline-block;
            background:linear-gradient(135deg,#8b5cf6,#6366f1);
            color:#ffffff;
            text-decoration:none;
            padding:16px 34px;
            border-radius:12px;
            font-size:16px;
            font-weight:700;
            box-shadow:0 10px 25px rgba(99,102,241,.35);
          ">
          Verify Email →
        </a>
      </div>

      <!-- Info Box -->
      <div style="background:#111827;border:1px solid #374151;border-radius:12px;padding:18px;margin-bottom:30px;">

        <div style="font-weight:600;color:#f8fafc;margin-bottom:10px;">
          🔒 Security Notice
        </div>

        <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.7;">
          This verification link is unique to your account and should not be shared with anyone.
          If you didn't create this account, you can safely ignore this email.
        </p>

      </div>

      <!-- Expiry -->
      <p style="margin:0;color:#94a3b8;font-size:14px;">
        ⏰ This verification link expires in
        <strong style="color:#ffffff;">24 hours</strong>.
      </p>

      <!-- Divider -->
      <div style="height:1px;background:#1e293b;margin:35px 0;"></div>

      <!-- Manual Link -->
      <p style="margin:0 0 12px;color:#94a3b8;font-size:13px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p style="
        margin:0;
        background:#020617;
        border:1px solid #1e293b;
        border-radius:10px;
        padding:14px;
        word-break:break-all;
        color:#60a5fa;
        font-size:13px;
      ">
        ${verificationLink}
      </p>

    </div>

    <!-- Footer -->
    <div style="padding:30px;background:#020617;border-top:1px solid #1e293b;text-align:center;">

      <div style="color:#f8fafc;font-size:16px;font-weight:600;">
        FinIntel AI
      </div>

      <p style="margin:10px 0 0;color:#64748b;font-size:13px;line-height:1.7;">
        AI-powered personal finance and expense management.<br>
        This is an automated email. Please do not reply.
      </p>

    </div>

  </div>

</div>
      `
    });
    console.log(`[Email Service] Verification mail dispatched successfully to ${toEmail}`);
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email to ${toEmail}: ${error.message}`);
    // We return without throwing to prevent registration from crashing the request flow
  }
};

/**
 * Sends a one-time numeric passcode email to the user for password reset.
 *
 * @param {string} toEmail - Recipient email Address
 * @param {string} otp - 6-digit numeric OTP code
 */
export const sendOtpEmail = async (toEmail, otp) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!resend) {
    if (isProd) {
      throw new Error('[SECURITY WARNING] Mail service bypassed! Email api key missing in production.');
    } else {
      console.log('\n--- [LOCAL EMAIL SERVICE FALLBACK] ---');
      console.log(`Sending password reset OTP mail to: ${toEmail}`);
      console.log(`Your 6-digit one-time passcode: ${otp}`);
      console.log('--------------------------------------\n');
      return;
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: "Your password reset code",
      html: `
<div style="margin:0;padding:40px 20px;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <div style="max-width:600px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:20px;overflow:hidden;">

    <!-- Header -->
    <div style="padding:45px 40px;background:linear-gradient(135deg,#dc2626,#7c3aed);text-align:center;">

      <div style="font-size:34px;margin-bottom:12px;">🔐</div>

      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
        Password Reset Request
      </h1>

      <p style="margin:12px 0 0;color:#f5d0fe;font-size:16px;">
        FinIntel AI Account Security
      </p>

    </div>

    <!-- Body -->
    <div style="padding:40px;">

      <h2 style="margin:0 0 18px;color:#f8fafc;font-size:22px;">
        Verify your identity
      </h2>

      <p style="margin:0 0 30px;color:#cbd5e1;font-size:15px;line-height:1.8;">
        We received a request to reset the password for your
        <strong style="color:#ffffff;">FinIntel AI</strong> account.
        Use the verification code below to continue with the password reset process.
      </p>

      <!-- OTP Card -->
      <div style="
          background:#020617;
          border:2px solid #7c3aed;
          border-radius:16px;
          padding:30px;
          text-align:center;
          margin:35px 0;
      ">

        <div style="
            color:#94a3b8;
            font-size:13px;
            text-transform:uppercase;
            letter-spacing:2px;
            margin-bottom:14px;
        ">
          One-Time Password
        </div>

        <div style="
            font-family:Consolas,Monaco,monospace;
            font-size:42px;
            font-weight:700;
            letter-spacing:12px;
            color:#60a5fa;
        ">
          ${otp}
        </div>

      </div>

      <!-- Expiry -->
      <div style="
          background:#1e1b4b;
          border:1px solid #4338ca;
          border-radius:12px;
          padding:18px;
          margin-bottom:30px;
      ">

        <div style="font-weight:600;color:#ffffff;margin-bottom:8px;">
          ⏰ Expires in 10 Minutes
        </div>

        <div style="color:#cbd5e1;font-size:14px;line-height:1.7;">
          Enter this code before it expires. Once expired, you'll need to request a new password reset code.
        </div>

      </div>

      <!-- Security Notice -->
      <div style="
          background:#111827;
          border:1px solid #374151;
          border-radius:12px;
          padding:20px;
      ">

        <div style="font-weight:600;color:#f8fafc;margin-bottom:12px;">
          🛡️ Didn't request this?
        </div>

        <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.8;">
          If you didn't request a password reset, you can safely ignore this email.
          Your password will remain unchanged unless this verification code is used.
        </p>

      </div>

      <div style="height:1px;background:#1e293b;margin:35px 0;"></div>

      <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.8;">
        For your security, never share this verification code with anyone.
        FinIntel AI will never ask for your OTP via email, phone, or chat.
      </p>

    </div>

    <!-- Footer -->
    <div style="padding:30px;background:#020617;border-top:1px solid #1e293b;text-align:center;">

      <div style="color:#f8fafc;font-size:16px;font-weight:600;">
        FinIntel AI
      </div>

      <p style="margin:10px 0 0;color:#64748b;font-size:13px;line-height:1.7;">
        AI-powered personal finance and expense management.<br>
        This is an automated security email. Please do not reply.
      </p>

    </div>

  </div>

</div>
      `
    });

    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }

    console.log(`[Email Service] OTP mail dispatched successfully to ${toEmail}`);
  } catch (error) {
    console.error(`[Email Service Error] Failed to send OTP email to ${toEmail}: ${error.message}`);
    throw error;
  }
};

