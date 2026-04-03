import React from 'react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto px-8 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
      <section className="w-full space-y-12">
        <div className="bg-white p-10 rounded-3xl border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-8 text-slate-950 text-center">
              Profile Information
            </h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">FIRST NAME</label>
                  <input 
                    className="bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 p-4 text-slate-950 font-medium transition-all outline-none" 
                    type="text" 
                    defaultValue="Guest" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">LAST NAME</label>
                  <input 
                    className="bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 p-4 text-slate-950 font-medium transition-all outline-none" 
                    type="text" 
                    placeholder="Enter last name" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">EMAIL</label>
                <div className="relative">
                  <input 
                    className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 text-slate-400 font-medium transition-all outline-none cursor-not-allowed" 
                    type="email" 
                    disabled
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium ml-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Email cannot be changed
                </p>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 pt-10">
              <button className="px-12 py-3.5 text-sm font-bold bg-slate-950 text-white rounded-2xl shadow-lg shadow-slate-950/20 hover:bg-slate-800 transition-all active:scale-[0.98]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
