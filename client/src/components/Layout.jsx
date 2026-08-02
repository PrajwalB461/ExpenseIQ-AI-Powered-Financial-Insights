import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100 antialiased overflow-x-hidden">
      {/* Persistent Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-72 min-h-screen">
        {/* Navbar */}
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />

        {/* Content Outlet Box */}
        <main className="flex-1 p-6 md:p-8 bg-slate-950">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
