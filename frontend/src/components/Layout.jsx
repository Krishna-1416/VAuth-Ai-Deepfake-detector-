import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <NavLink to="/" className="font-headline font-bold text-xl tracking-tighter text-slate-950 flex items-center gap-2">
            V-AUTH
          </NavLink>
          <div className="flex items-center gap-6">
            <NavLink to="/" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}>Home</NavLink>
            <NavLink to="/engine" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}>Engine</NavLink>
            <NavLink to="/about" className={({ isActive }) => `text-sm font-semibold transition-colors ${isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'}`}>About</NavLink>
          </div>
        </div>
      </nav>

      <main className="pt-16 min-h-screen">
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
