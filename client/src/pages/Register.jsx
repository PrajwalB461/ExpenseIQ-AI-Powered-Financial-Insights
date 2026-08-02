import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, UserPlus, AlertCircle } from 'lucide-react';
import OnboardingModal from '../components/OnboardingModal';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all standard credentials fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please review entry fields.');
      return;
    }

    setIsLoading(true);
    try {
      // Registers and triggers session login in the context
      await register(name, email, password);
      // Instead of navigating directly, activate the onboarding sequence
      setShowOnboarding(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please audit input credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-605/25 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyan-600/20 blur-3xl"></div>

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center">
          <Link to="/">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-650 text-white shadow-lg">
              <Wallet className="h-6 w-6" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white animate-pulse-subtle">
            Register Account
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-semibold">
            Create a secure financial tracking workspace
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-505 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="user-name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Full Name
              </label>
              <input
                id="user-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-700 font-semibold"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3.5 py-3 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-700 font-semibold"
                placeholder="you@domain.com"
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-700 font-semibold"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-3 text-xs text-white focus:border-violet-500 focus:outline-none transition-all placeholder-slate-700 font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Continue with Google button */}
          <div className="space-y-3 pt-2">
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

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-650 py-3 text-xs font-bold text-white shadow-lg hover:bg-violet-605 active:bg-violet-750 transition-all cursor-pointer bg-violet-600"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Register FinIntel Account
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 font-semibold">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-violet-405 hover:text-violet-305 transition-colors text-violet-400">
            Sign in now
          </Link>
        </p>
      </div>

      {/* Onboarding Dialog */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          navigate('/dashboard');
        }} 
      />
    </div>
  );
};

export default Register;
