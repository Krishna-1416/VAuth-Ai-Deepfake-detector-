import React from 'react';

const Settings = () => {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row gap-12">
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Settings</h1>
          <p className="text-sm text-secondary font-medium">Manage your terminal configuration and security protocols.</p>
        </div>
        <nav className="flex flex-col space-y-1">
          <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-surface-container-low text-primary transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]" data-icon="person">person</span>
            Profile
          </button>
          <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-secondary hover:bg-surface-container-low transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]" data-icon="security">security</span>
            Security
          </button>

          <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-secondary hover:bg-surface-container-low transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]" data-icon="notifications">notifications</span>
            Notifications
          </button>
        </nav>
        
        <div className="mt-12 p-6 rounded-xl bg-surface-container-low border-none relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">System Status</span>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-tertiary-fixed-dim"></div>
              <span className="text-xs font-semibold">Terminal 01 Active</span>
            </div>
            <p className="text-[11px] text-secondary">Verification engine running at 98.4% accuracy.</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-6xl" data-icon="biometric_viewer">smart_card_reader</span>
          </div>
        </div>
      </aside>
      
      <section className="flex-grow space-y-12">
        <div className="bg-surface-container-lowest p-10 rounded-none md:rounded-xl relative">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
              Profile Information
            </h2>
            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-secondary uppercase tracking-wider">Analyst Name</label>
                <input className="bg-surface-container-low border-b border-outline-variant/20 border-x-0 border-t-0 focus:ring-0 focus:border-primary-container p-3 text-on-surface font-medium transition-all" type="text" defaultValue="Dr. Julian Vane" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-secondary uppercase tracking-wider">Organization Email</label>
                <input className="bg-surface-container-low border-b border-outline-variant/20 border-x-0 border-t-0 focus:ring-0 focus:border-primary-container p-3 text-on-surface font-medium transition-all" type="email" defaultValue="j.vane@forensic-intel.ia" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-secondary uppercase tracking-wider">Role</label>
                  <div className="p-3 bg-surface-container-high rounded text-sm font-semibold">Senior Verification Lead</div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-secondary uppercase tracking-wider">Access Tier</label>
                  <div className="p-3 bg-surface-container-high rounded text-sm font-semibold">Level 4 - Forensic Archive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-10 rounded-xl">
            <h2 className="text-xl font-bold mb-6">Security Protocols</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Biometric 2FA</p>
                  <p className="text-xs text-secondary mt-1">Requires fingerprint or face scan for archive access.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Session Hardening</p>
                  <p className="text-xs text-secondary mt-1">Auto-terminate session after 15m of inactivity.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>
              
              <button className="mt-4 text-sm font-bold text-primary-container flex items-center gap-2 hover:underline">
                Update Security Credentials
                <span className="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
              </button>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-10 rounded-xl">
            <h2 className="text-xl font-bold mb-6">Intelligence Feeds</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Live Stream Alerts</p>
                  <p className="text-xs text-secondary mt-1">Desktop push for synthetic content detection.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">Report Digest</p>
                  <p className="text-xs text-secondary mt-1">Weekly analysis of regional deepfake trends.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        

        
        <div className="flex justify-end gap-4 pt-8">
          <button className="px-8 py-3 text-sm font-bold text-secondary hover:bg-surface-container-low rounded-lg transition-colors">Discard Changes</button>
          <button className="px-8 py-3 text-sm font-bold bg-primary-container text-on-primary-container rounded shadow-lg shadow-primary-container/10 hover:opacity-90 transition-all">Save Terminal Configuration</button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
