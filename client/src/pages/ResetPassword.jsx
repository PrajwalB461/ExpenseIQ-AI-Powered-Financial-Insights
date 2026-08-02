import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { ArrowLeft, BookOpen, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import LedgerCard from '../components/LedgerCard';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  // Gracefully handle flow abandonment
  useEffect(() => {
    if (!resetToken) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all credential fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify your typing.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await API.post('/auth/reset-password', {
        resetToken,
        newPassword
      });

      setSuccess(response.data.message || 'Password was successfully reset.');
      
      // Delay redirect slightly for visual feedback success
      setTimeout(() => {
        navigate('/login?verified=true&reset=success', { replace: true });
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Token expired or verification failed. Please start over.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!resetToken) return null;

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

        <LedgerCard title="Establish Key Identity" subtitle={`Assign new passcode for ${email}`}>
          {success && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-ink-green/20 bg-ink-green/5 p-3.5 text-xs text-ink-green">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-danger/20 bg-danger/5 p-3.5 text-xs text-ink-red">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-xs text-slate-350">
            <div>
              <label htmlFor="new-password" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                placeholder="•••••••• (min 6 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-[#17392B] active:bg-[#0E251C] py-3 text-xs font-bold text-white transition-colors cursor-pointer outline-none"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Commit New Password
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
            Start reset process over
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
