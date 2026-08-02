import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  CreditCard, 
  Percent, 
  Sparkles, 
  User, 
  LogOut, 
  Wallet,
  Menu
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Income', path: '/income', icon: ArrowUpRight },
    { name: 'Expense', path: '/expense', icon: ArrowDownRight },
    { name: 'Budgeting', path: '/budgeting', icon: PieChart },
    { name: 'Accounts', path: '/accounts', icon: CreditCard },
    { name: 'EMI Calculator', path: '/emi', icon: Percent },
    { name: 'AI Space', path: '/ai-space', icon: Sparkles, premium: true },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-800 bg-slate-900 px-6 py-6 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-8">
          {/* Logo Heading */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-650 to-indigo-650 bg-violet-600 text-white shadow-md">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                FinIntel AI
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Autonomous Tracker
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)} // Close sidebar on mobile select
                className={({ isActive }) => 
                  `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group ${
                    isActive 
                      ? 'bg-violet-600/10 text-violet-400 border-l-4 border-violet-500' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-150'
                  } ${
                    item.premium 
                      ? 'text-cyan-400 hover:bg-cyan-950/20 active:text-cyan-300' 
                      : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                        item.premium 
                          ? 'text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                          : isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-350'
                      }`} />
                      <span>{item.name}</span>
                    </div>

                    {item.premium && (
                      <span className="flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 ring-1 ring-inset ring-cyan-450 border border-cyan-500/20 shadow-sm animate-pulse">
                        AI Space
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Profile Details */}
        <div className="flex flex-col gap-4 border-t border-slate-800 pt-6">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-850 font-bold border border-slate-700 text-slate-300">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-white">{user.name || 'Demo User'}</p>
                <p className="truncate text-xs text-slate-500">{user.email || 'demo@expensetracker.ai'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 hover:bg-red-950/20 hover:text-red-400 transition-all cursor-pointer border border-transparent hover:border-red-500/10"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
