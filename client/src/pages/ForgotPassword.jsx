import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { Mail, ArrowLeft, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import LedgerCard from '../components/LedgerCard';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await API.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'If that email is registered, a code has been sent.');
      
      // Delay navigation slightly so the user can read the success message
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

        <LedgerCard title="Reset Access Key" subtitle="Initiate OTP Code Request">
          {message && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-ink-green/20 bg-ink-green/5 p-3.5 text-xs text-ink-green">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-semibold">{message}</span>
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
              <label htmlFor="email" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                placeholder="you@domain.com"
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
                    <Mail className="h-4 w-4" />
                    Request Recovery Code
                  </>
                )}
              </button>
            </div>
          </form>
        </LedgerCard>

        <p className="text-center text-xs font-bold text-ink-muted">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-accent-brass hover:text-amber-600 transition-colors uppercase tracking-wider">
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
