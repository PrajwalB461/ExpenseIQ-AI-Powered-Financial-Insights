import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { ArrowLeft, BookOpen, AlertCircle, ShieldAlert, KeyRound } from 'lucide-react';
import LedgerCard from '../components/LedgerCard';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes OTP valid
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef([]);

  const email = location.state?.email;

  // Gracefully handle flow abandonment
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  // Timers for OTP validity slot and Resend cooldown
  useEffect(() => {
    if (!email) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const cooldownTimer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(cooldownTimer);
    };
  }, [email]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return; // Allow numeric values only

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Clamp to last digit
    setOtp(newOtp);

    // Auto-advance focus to next slot
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!newOtp[index] && index > 0) {
        // Clear previous input slot and shift focus backward
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setCooldown(60);
      setTimeLeft(600);
      // Reset otp boxes
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please fill in all 6 code digits.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const response = await API.post('/auth/verify-otp', {
        email,
        otp: otpCode
      });

      const { resetToken } = response.data;
      
      // Navigate to reset password page carrying the resetToken in component/router state only
      navigate('/reset-password', { 
        state: { email, resetToken },
        replace: true 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
      // Reset otp slots on wrong entry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!email) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg text-ink px-4 py-12 transition-colors">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded bg-brand text-white shadow-sm mb-4">
            <BookOpen className="h-5.5 w-5.5 text-white" />
          </div>
          <h2 className="font-serif font-display text-3xl font-bold tracking-tight text-ink">
            FinIntel
          </h2>
          <p className="mt-1 text-xs text-ink-muted font-bold uppercase tracking-widest leading-none">
            Intelligent Financial Console
          </p>
        </div>

        <LedgerCard title="Verify FinIntel Token" subtitle={`One-Time Passcode sent for ${email}`}>
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-danger/20 bg-danger/5 p-3.5 text-xs text-ink-red">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-2">
                Enter Verification Code
              </span>
              <div className="flex justify-between gap-2.5 w-full max-w-xs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    placeholder="-"
                    className="h-12 w-10 text-center text-xl font-bold font-mono rounded border border-rule bg-bg text-ink focus:border-brand focus:outline-none transition-all placeholder:text-ink-muted/30"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <div className="flex items-center gap-1.5 text-ink-muted">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Code valid for:</span>
                <span className="font-mono text-ink text-xs tabular-nums">{formatTime(timeLeft)}</span>
              </div>

              <div>
                {cooldown > 0 ? (
                  <span className="text-ink-muted/65 text-[10px] uppercase font-bold tracking-wider">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-accent-brass hover:text-amber-600 transition-colors uppercase text-[10px] font-bold tracking-wider cursor-pointer decoration-dotted underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || timeLeft === 0}
                className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-[#17392B] active:bg-[#0E251C] py-3 text-xs font-bold text-white transition-colors cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    Verify & Reset Password
                  </>
                )}
              </button>
            </div>
          </form>
        </LedgerCard>

        <p className="text-center text-xs font-bold text-ink-muted">
          <button 
            onClick={() => navigate('/forgot-password', { replace: true })} 
            className="inline-flex items-center gap-1.5 text-accent-brass hover:text-amber-600 transition-colors uppercase tracking-wider bg-transparent border-0 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            Enter different email
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
