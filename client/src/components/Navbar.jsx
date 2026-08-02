import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, ShieldAlert, Cpu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import API from '../api';

const Navbar = ({ setIsSidebarOpen }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [serverHealth, setServerHealth] = useState({ status: 'CHECKING', original: null });

  // Bookkeeping title tags mapped in Fraunces font
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'General Ledger Summary';
    if (path === '/income') return 'Income Ledger';
    if (path === '/expense') return 'Expense Ledger';
    if (path === '/budgeting') return 'Budgets Ledger';
    if (path === '/accounts') return 'Financial Accounts';
    if (path === '/emi') return 'EMI Ledger & Calculator';
    if (path === '/ai-space') return 'AI Space Ledger Processor';
    if (path === '/profile') return 'System & Profile Console';
    return 'Ledger Balance';
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await API.get('/health');
        if (res.data && res.data.success) {
          setServerHealth({
            status: 'ONLINE',
            original: res.data.data
          });
        } else {
          setServerHealth({ status: 'DEGRADED', original: null });
        }
      } catch (err) {
        setServerHealth({ status: 'OFFLINE', original: null });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-rule bg-surface/90 px-6 backdrop-blur-xs transition-colors">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded border border-rule bg-surface text-ink-muted hover:text-ink lg:hidden transition-all cursor-pointer outline-none"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h2 className="font-serif font-display text-base font-bold text-ink leading-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Network / AI / Theme States */}
      <div className="flex items-center gap-3">
        {/* Sun / Moon Theme Switcher */}
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

        {/* API Health */}
        <div className="flex items-center gap-2 rounded border border-rule bg-surface px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase">
          {serverHealth.status === 'CHECKING' && (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse"></div>
              <span className="text-ink-muted hidden sm:inline">Audit API...</span>
            </>
          )}
          {serverHealth.status === 'ONLINE' && (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-ink-green shadow-[0_0_4px_currentColor]"></div>
              <span className="text-ink-muted hidden sm:inline">Live Engine</span>
            </>
          )}
          {serverHealth.status === 'DEGRADED' && (
            <>
              <ShieldAlert className="h-3 w-3 text-warning shrink-0" />
              <span className="text-[#C97F1E] hidden sm:inline">Degraded</span>
            </>
          )}
          {serverHealth.status === 'OFFLINE' && (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-danger animate-ping"></div>
              <span className="text-ink-red font-bold">Offline</span>
            </>
          )}
        </div>

        {/* AI Processor State */}
        {serverHealth.status === 'ONLINE' && (
          <div className="flex items-center gap-1.5 rounded border border-rule bg-surface px-3 py-1.5 text-[10px] font-bold uppercase">
            <Cpu className="h-3.5 w-3.5 text-accent-brass" />
            <span className="text-ink-muted hidden md:inline">Brain:</span>
            <span className={serverHealth.original?.features?.groqAiSpace === 'available' ? 'text-ink-green font-bold' : 'text-ink-muted font-medium'}>
              {serverHealth.original?.features?.groqAiSpace === 'available' ? 'Llama-Groq' : 'Local-Mock'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
