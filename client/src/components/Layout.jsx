import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('ledger_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('ledger_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-bg text-ink antialiased overflow-x-hidden transition-colors">
      {/* Persistent Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className={`flex flex-1 flex-col ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      } min-h-screen transition-all duration-200 ease-in-out`}>
        {/* Navbar */}
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />

        {/* Content Outlet Box */}
        <main className="flex-1 p-6 md:p-8 bg-bg transition-colors">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
