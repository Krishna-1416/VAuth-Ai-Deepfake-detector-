import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl flex justify-between items-center px-8 h-16 border-b border-slate-200/20">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-slate-950">V Auth</span>
          <nav className="hidden md:flex gap-6 items-center">
            <NavLink to="/engine" className={({ isActive }) => `font-manrope tracking-tight font-semibold ${isActive ? 'text-slate-950 border-b-2 border-slate-950 pb-1' : 'text-slate-500 hover:text-slate-900 transition-colors duration-200'}`}>
              Analysis
            </NavLink>
            <NavLink to="/archive" className={({ isActive }) => `font-manrope tracking-tight font-semibold ${isActive ? 'text-slate-950 border-b-2 border-slate-950 pb-1' : 'text-slate-500 hover:text-slate-900 transition-colors duration-200'}`}>
              Archive
            </NavLink>
            <NavLink to="/intelligence" className={({ isActive }) => `font-manrope tracking-tight font-semibold ${isActive ? 'text-slate-950 border-b-2 border-slate-950 pb-1' : 'text-slate-500 hover:text-slate-900 transition-colors duration-200'}`}>
              Intelligence
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `font-manrope tracking-tight font-semibold ${isActive ? 'text-slate-950 border-b-2 border-slate-950 pb-1' : 'text-slate-500 hover:text-slate-900 transition-colors duration-200'}`}>
              Settings
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100/50 rounded-full transition-colors duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 hover:bg-slate-100/50 rounded-full transition-colors duration-200">
            <span className="material-symbols-outlined">shield_person</span>
          </button>
          <div className="h-10 w-10 rounded-xl bg-surface-container-highest overflow-hidden border border-outline-variant/10 shadow-sm">
            <img alt="User forensic profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCi9nYMsTzpCsBvJB8OjK5XhzGsQUep9Pwow2iXOYabFal2wyFVpzKZFjl5L5rtxNg32saxl4-IjURufpqL19-MxTQ160I1QBvUF8jzz0C2tGGUtOtaqCwkEcPrJ8fU7lcH8I9bOo8dpR9a4mPk4x_Vb78cRIFDa0ujzNxSuqtlvj1cPom5rNqY6JeP2e6qE2oVpk31iTtonoYoWKRgiE6is0RwjCm02nk6R5uNG5o42qs_R-wJhi_0j2hZ6IdiKADIIbmoNLK-BOP"/>
          </div>
        </div>
      </header>
      
      <aside className="h-[calc(100vh-24px)] w-64 fixed left-3 top-3 bg-white/80 backdrop-blur-xl flex flex-col p-6 space-y-4 pt-20 border border-slate-200/50 rounded-[2rem] shadow-2xl z-40 hidden lg:flex">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim animate-pulse shadow-[0_0_8px_rgba(0,107,133,0.5)]"></div>
            <div>
              <p className="text-lg font-bold font-manrope text-primary leading-tight">Terminal 01</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Forensics Active</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2">
          <NavLink to="/engine" className={({ isActive }) => `flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20' : 'text-slate-600 hover:bg-slate-100'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-inter text-sm font-semibold">Dashboard</span>
          </NavLink>
          <a className="flex items-center gap-3 p-3.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-300" href="#">
            <span className="material-symbols-outlined">smart_card_reader</span>
            <span className="font-inter text-sm font-semibold">Live Stream</span>
          </a>
          <a className="flex items-center gap-3 p-3.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-300" href="#">
            <span className="material-symbols-outlined">policy</span>
            <span className="font-inter text-sm font-semibold">Deepfake Scan</span>
          </a>
          <a className="flex items-center gap-3 p-3.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-300" href="#">
            <span className="material-symbols-outlined">database</span>
            <span className="font-inter text-sm font-semibold">Metadata</span>
          </a>
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20' : 'text-slate-600 hover:bg-slate-100'}`}>
             <span className="material-symbols-outlined">history</span>
             <span className="font-inter text-sm font-semibold">Audit Log</span>
          </NavLink>
        </nav>
        <button className="w-full py-4 bg-primary-container text-white rounded-2xl font-manrope font-bold text-sm hover:bg-slate-900 transition-all shadow-xl shadow-primary-container/10 active:scale-95">
            New Investigation
        </button>
        <div className="pt-4 mt-auto border-t border-slate-100 space-y-1">
          <a className="flex items-center gap-3 p-2 text-slate-500 hover:text-slate-900 transition-colors" href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="text-xs font-medium">Support</span>
          </a>
          <NavLink to="/" className="flex items-center gap-3 p-2 text-slate-500 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-xs font-medium">Sign Out</span>
          </NavLink>
        </div>
      </aside>
      
      <main className="lg:pl-64 pt-16 min-h-screen">
        <Outlet />
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-50/90 backdrop-blur-lg flex justify-around items-center h-16 z-50 px-4 mt-16">
        <NavLink to="/engine" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-bold">DASHBOARD</span>
        </NavLink>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined">analytics</span>
          <span className="text-[10px] font-bold">ANALYSIS</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined">database</span>
          <span className="text-[10px] font-bold">ARCHIVE</span>
        </button>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-bold">SETTINGS</span>
        </NavLink>
      </footer>
    </>
  );
};

export default DashboardLayout;
