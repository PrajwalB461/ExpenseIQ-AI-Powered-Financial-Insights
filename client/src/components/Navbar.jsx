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
    if (path === '/dashboard') return 'General Financial Summary';
    if (path === '/income') return 'Income Ledger';
    if (path === '/expense') return 'Expense Ledger';
    if (path === '/budgeting') return 'Budgets Ledger';
    if (path === '/accounts') return 'Financial Accounts';
    if (path === '/emi') return 'EMI Ledger & Calculator';
    if (path === '/ai-space') return 'AI Space Processor';
    if (path === '/profile') return 'System & Profile Console';
    return 'Financial Balance';
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

      {/* Theme Switcher Only */}
      <div className="flex items-center">
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
    </header>
  );
};

export default Navbar;
