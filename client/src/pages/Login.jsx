import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, CheckCircle2, Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LedgerCard from '../components/LedgerCard';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifiedMsg, setVerifiedMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifiedParam = searchParams.get('verified');
    const reasonParam = searchParams.get('reason');

    if (verifiedParam === 'true') {
      setVerifiedMsg('Email address verified successfully! You can now access full system operations.');
    } else if (verifiedParam === 'false' && reasonParam === 'expired') {
      setError('Verification token has expired or is invalid. Please request a new token.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password credentials.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      await login('demo@expensetracker.ai', 'demo123');
      navigate('/dashboard');
    } catch (err) {
      setError('Demo session connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg text-ink px-4 py-12 transition-colors">
      
      {/* Floating Theme Selector button in top-right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="flex h-9 w-9 items-center justify-center rounded border border-rule bg-surface text-ink-muted hover:text-ink transition-all cursor-pointer outline-none"
        >
          {theme === 'ledger-day' ? (
            <Moon className="h-4.5 w-4.5 text-accent-brass" />
          ) : (
            <Sun className="h-4.5 w-4.5 text-accent-brass" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded bg-brand text-white shadow-sm mb-4">
            <BookOpen className="h-5.5 w-5.5 text-white" />
          </div>
          <h2 className="font-serif font-display text-3xl font-bold tracking-tight text-ink">
            Ledger
          </h2>
          <p className="mt-1 text-xs text-ink-muted font-bold uppercase tracking-widest leading-none">
            Double-Entry Console
          </p>
        </div>

        <LedgerCard className="p-6">
          {verifiedMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-ink-green/20 bg-ink-green/5 p-3.5 text-xs text-ink-green">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-semibold">{verifiedMsg}</span>
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
              <label htmlFor="email-address" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                placeholder="you@domain.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                placeholder="••••••••"
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded bg-brand hover:bg-[#17392B] active:bg-[#0E251C] py-3 text-xs font-bold text-white transition-colors cursor-pointer outline-none"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Open Ledger (Sign In)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded border border-rule bg-surface py-3 text-xs font-bold text-ink hover:bg-bg transition-colors cursor-pointer outline-none"
              >
                Log In with Sandbox Demo
              </button>
            </div>
          </form>
        </LedgerCard>

        <p className="text-center text-xs text-ink-muted font-bold">
          First-time balancing?{' '}
          <Link to="/register" className="text-accent-brass hover:text-amber-600 transition-colors uppercase tracking-wider">
            Register Book
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
