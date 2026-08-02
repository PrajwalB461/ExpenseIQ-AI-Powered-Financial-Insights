import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Activity, ShieldAlert, Cpu } from 'lucide-react';
import API from '../api';

const Navbar = ({ setIsSidebarOpen }) => {
  const location = useLocation();
  const [serverHealth, setServerHealth] = useState({ status: 'CHECKING', original: null });

  // Map route paths to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard Overview';
    if (path === '/income') return 'Income Streams';
    if (path === '/expense') return 'Expense Logs';
    if (path === '/budgeting') return 'Budget Planner';
    if (path === '/accounts') return 'Financial Accounts';
    if (path === '/emi') return 'EMI Analytics';
    if (path === '/ai-space') return 'FinAI Processing Space';
    if (path === '/profile') return 'System & Profile Config';
    return 'Finance Management';
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
        console.error('Navbar health check failed:', err.message);
        setServerHealth({ status: 'OFFLINE', original: null });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-md">
      {/* Page Title & Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white lg:hidden transition-all pointer-events-auto cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Network / AI Status Panel */}
      <div className="flex items-center gap-3">
        {/* API Gateway Status Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
          {serverHealth.status === 'CHECKING' && (
            <>
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
              <span className="text-slate-400 hidden sm:inline">Checking Node API...</span>
            </>
          )}
          {serverHealth.status === 'ONLINE' && (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
              <span className="text-slate-350 hidden sm:inline">API: Online</span>
              <span className="text-[10px] text-slate-500 px-1 border-l border-slate-800">
                v1
              </span>
            </>
          )}
          {serverHealth.status === 'DEGRADED' && (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-orange-400 hidden sm:inline">API: Degraded</span>
            </>
          )}
          {serverHealth.status === 'OFFLINE' && (
            <>
              <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-ping"></div>
              <span className="text-rose-400 font-semibold">API: Offline</span>
            </>
          )}
        </div>

        {/* AI Engine Status Badge */}
        {serverHealth.status === 'ONLINE' && (
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400 hidden md:inline">Processor: </span>
            <span className={serverHealth.original?.features?.groqAiSpace === 'available' ? 'text-cyan-400 font-bold' : 'text-slate-500 font-medium'}>
              {serverHealth.original?.features?.groqAiSpace === 'available' ? 'Llama-Groq' : 'Local-Mock'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
