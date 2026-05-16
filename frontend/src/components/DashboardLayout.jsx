import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Logo from './Logo';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      <header className={`fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl h-16 border-b border-slate-200/20 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-28'}`}>
        <div className="flex justify-center items-center h-full gap-2">
          <Logo className="w-8 h-8" />
          <span className="text-xl font-black tracking-tighter text-slate-950 uppercase tracking-widest">V-Auth</span>
        </div>
      </header>
      
      <aside className={`h-[calc(100vh-48px)] fixed left-3 top-6 bg-white/80 backdrop-blur-xl flex flex-col pb-6 space-y-4 pt-6 border border-slate-200/50 rounded-[2rem] shadow-2xl z-[60] transition-all duration-300 hidden lg:flex overflow-hidden ${isSidebarOpen ? 'w-64 px-6' : 'w-[5.5rem] px-3'}`}>
        <div className={`mb-6 flex ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center bg-white shadow-sm"
          >
            <span className="material-symbols-outlined text-slate-800 text-[20px]">menu</span>
          </button>
        </div>

        <nav className="flex-1 flex flex-col items-center lg:items-stretch space-y-2">
          <NavLink to="/engine" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20' : 'text-slate-600 hover:bg-slate-100'} ${isSidebarOpen ? '' : 'justify-center w-12 h-12'}`}>
            <span className="material-symbols-outlined">policy</span>
            {isSidebarOpen && <span className="font-inter text-sm font-bold whitespace-nowrap uppercase tracking-widest">Deepfake Scan</span>}
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20' : 'text-slate-600 hover:bg-slate-100'} ${isSidebarOpen ? '' : 'justify-center w-12 h-12'}`}>
            <span className="material-symbols-outlined">smart_card_reader</span>
            {isSidebarOpen && <span className="font-inter text-sm font-bold whitespace-nowrap uppercase tracking-widest">Live Stream</span>}
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20' : 'text-slate-600 hover:bg-slate-100'} ${isSidebarOpen ? '' : 'justify-center w-12 h-12'}`}>
            <span className="material-symbols-outlined">dashboard</span>
            {isSidebarOpen && <span className="font-inter text-sm font-bold whitespace-nowrap uppercase tracking-widest">Dashboard</span>}
          </NavLink>
        </nav>

        <div className="pt-4 mt-auto border-t border-slate-100 space-y-1 flex flex-col items-stretch">
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-container text-white shadow-lg shadow-primary-container/20' : 'text-slate-600 hover:bg-slate-100'} ${isSidebarOpen ? '' : 'justify-center w-12 h-12'}`}>
             <span className="material-symbols-outlined">settings</span>
             {isSidebarOpen && <span className="font-inter text-sm font-bold whitespace-nowrap uppercase tracking-widest">Settings</span>}
          </NavLink>
          <button 
            onClick={handleSignOut}
            className={`flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 transition-colors ${isSidebarOpen ? '' : 'justify-center w-12 h-12 self-center'}`}
          >
            <span className="material-symbols-outlined">logout</span>
            {isSidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>
      
      <main className={`pt-16 pb-16 md:pb-0 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-28'}`}>
        <Outlet />
      </main>

      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg flex justify-around items-center h-16 z-50 px-4 border-t border-slate-100">
        <NavLink to="/engine" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-w-12 min-h-12 rounded-xl ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined text-[24px]">policy</span>
          <span className="text-[10px] font-bold">SCAN</span>
        </NavLink>
        <NavLink to="/live" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-w-12 min-h-12 rounded-xl ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined text-[24px]">smart_card_reader</span>
          <span className="text-[10px] font-bold">LIVE</span>
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-w-12 min-h-12 rounded-xl ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
          <span className="text-[10px] font-bold">INFO</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center gap-0.5 min-w-12 min-h-12 rounded-xl ${isActive ? 'text-slate-950' : 'text-slate-400'}`}>
          <span className="material-symbols-outlined text-[24px]">settings</span>
          <span className="text-[10px] font-bold">SETTINGS</span>
        </NavLink>
      </footer>
    </>
  );
};

export default DashboardLayout;
