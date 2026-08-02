import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, LogIn, AlertCircle, ChevronsRight, CheckCircle2 } from 'lucide-react';
import API from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifiedMsg, setVerifiedMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyan-600/20 blur-3xl"></div>

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center">
          <Link to="/">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-650 text-white shadow-lg">
              <Wallet className="h-6 w-6" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white animate-pulse-subtle">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-semibold">
            Access secure FinIntel AI analytics console
          </p>
        </div>

        {/* Verification Success Message */}
        {verifiedMsg && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <span>{verifiedMsg}</span>
          </div>
        )}

        {/* Error warnings container */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-455 text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="text-xs font-semibold text-slate-405 uppercase tracking-wider block text-slate-400">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-650"
                placeholder="you@domain.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-semibold text-slate-450 uppercase tracking-wider block text-slate-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-650"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Social Sign-In buttons */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={true}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/20 py-2.5 text-xs text-slate-500 opacity-60 font-semibold cursor-not-allowed"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8S7.91 2 12.24 2c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C18.155.577 15.42 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
              </svg>
              Continue with Google (Soon)
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-650 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-600 transition-all cursor-pointer bg-violet-600"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In to Control Workspace
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-800/40 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700/50 transition-all cursor-pointer"
            >
              Log in with Sandbox Demo Account
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 font-semibold">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-violet-405 hover:text-violet-305 transition-colors text-violet-400">
            Sign up now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
