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
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, toggleCollapse }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Income Ledger', path: '/income', icon: ArrowUpRight, ariaLabel: 'Income (debit)', titleAttr: 'Income (debit)' },
    { name: 'Expense Ledger', path: '/expense', icon: ArrowDownRight, ariaLabel: 'Expense (credit)', titleAttr: 'Expense (credit)' },
    { name: 'Budgets Ledger', path: '/budgeting', icon: PieChart },
    { name: 'Accounts Ledger', path: '/accounts', icon: CreditCard },
    { name: 'EMI Ledger Calc', path: '/emi', icon: Percent },
    { name: 'AI Ledger Space', path: '/ai-space', icon: Sparkles, premium: true },
    { name: 'Account Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 lg:hidden transition-all"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Spine: Persistent Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-[#17392B] bg-[#1F4D3A] py-6 transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isCollapsed ? 'w-72 lg:w-20 px-3 lg:px-2' : 'w-72 px-6'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'} overflow-hidden`}
      >
        {/* Brass Rivets along the Left Edge (strictly contained, programmatic vertical rhythm) */}
        <div className="absolute left-2.5 top-0 bottom-0 flex flex-col items-center justify-start gap-12 py-8 pointer-events-none w-1 select-none overflow-hidden opacity-30">
          {[...Array(30)].map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-[#A8863C] shadow-xs shrink-0" />
          ))}
        </div>

        <div className={`flex flex-col gap-8 ${isCollapsed ? 'lg:ml-0' : 'ml-2'}`}>
          {/* Header Zone with Logo & Toggle Button */}
          <div className={`flex items-center justify-between gap-2 ${isCollapsed ? 'lg:flex-col lg:gap-4' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#A8863C] text-white shadow" title="FinIntel Console">
                <BookOpen className="h-5 w-5 text-[#1F4D3A]" />
              </div>
              {!isCollapsed && (
                <div className="transition-opacity duration-200">
                  <h1 className="font-serif font-display text-lg font-bold text-white tracking-wide">
                    FinIntel
                  </h1>
                  <p className="text-[9px] text-[#A8863C] font-bold uppercase tracking-widest leading-none">
                    Intelligent Financial Console
                  </p>
                </div>
              )}
            </div>

            {/* Collapse/Expand Toggle chevron button */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[#17392B] bg-[#17392B]/50 hover:bg-[#17392B] text-[#9AAA9F] hover:text-white transition-all cursor-pointer outline-none"
              title={isCollapsed ? "Expand Console" : "Collapse Console"}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Navigation Spine Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) => 
                  `flex items-center justify-between px-3 py-2.5 text-xs font-semibold tracking-wide transition-all border-l-2 outline-none ${
                    isActive 
                      ? 'border-[#A8863C] text-white bg-[#17392B]' 
                      : 'border-transparent text-[#9AAA9F] hover:text-white hover:bg-[#17392B]/50'
                  } ${isCollapsed ? 'lg:justify-center' : ''}`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon 
                    className="h-4 w-4 shrink-0" 
                    aria-label={item.ariaLabel} 
                    title={item.titleAttr} 
                  />
                  <span className={`font-sans whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                    {item.name}
                  </span>
                </div>

                {item.premium && !isCollapsed && (
                  <span className="rounded bg-[#A8863C]/20 border border-[#A8863C]/35 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#A8863C] shrink-0">
                    AI Node
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Details */}
        <div className={`flex flex-col gap-4 border-t border-[#17392B] pt-6 ${isCollapsed ? 'lg:ml-0 lg:items-center' : 'ml-2'}`}>
          {user && (
            <div className="flex items-center gap-3 w-full">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#17392B] border border-[#17392B] text-white font-bold text-xs select-none">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className={`overflow-hidden transition-all duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <p className="truncate text-xs font-bold text-white leading-tight">{user.name || 'FinIntel User'}</p>
                <p className="truncate text-[10px] text-[#9AAA9F]">{user.email || 'user@finintel.com'}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`flex w-full items-center gap-3 rounded bg-transparent px-3 py-2 text-xs font-bold text-[#D2665A] hover:bg-[#8C2F22]/20 transition-all border border-transparent hover:border-[#8C2F22]/30 cursor-pointer outline-none ${
              isCollapsed ? 'lg:justify-center' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`font-sans whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              Close Book (Sign Out)
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
