import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertCircle, Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import LedgerCard from '../components/LedgerCard';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please audit input credentials.');
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
            FinIntel
          </h2>
          <p className="mt-1 text-xs text-ink-muted font-bold uppercase tracking-widest leading-none">
            Register New Account
          </p>
        </div>

        <LedgerCard className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded border border-danger/20 bg-danger/5 p-3.5 text-xs text-ink-red">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-xs text-slate-350">
            <div>
              <label htmlFor="user-name" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                Full Name
              </label>
              <input
                id="user-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                placeholder="John Doe"
              />
            </div>

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
            
            <div className="grid gap-4 grid-cols-2">
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

              <div>
                <label htmlFor="confirmPassword" className="text-ink-muted uppercase tracking-wider block mb-1.5 font-bold">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded border border-rule bg-bg px-3 py-2.5 text-xs text-ink focus:border-brand focus:outline-none transition-colors font-semibold"
                  placeholder="••••••••"
                />
              </div>
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
                    <UserPlus className="h-4 w-4" />
                    Register Book
                  </>
                )}
              </button>
            </div>
          </form>
        </LedgerCard>

        <p className="text-center text-xs text-ink-muted font-bold">
          Already maintaining books?{' '}
          <Link to="/login" className="text-accent-brass hover:text-amber-600 transition-colors uppercase tracking-wider">
            Sign in now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
