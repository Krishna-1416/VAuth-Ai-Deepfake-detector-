import React from 'react';
import { NavLink } from 'react-router-dom';

const Dashboard = () => {
  const stats = [
    { label: 'MEDIA SCANNED', value: '14,204', icon: 'analytics', trend: '+12%' },
    { label: 'SYNTHETIC DETECTED', value: '841', icon: 'report_problem', trend: '+4%' },
    { label: 'ACTIVE MONITORS', value: '04', icon: 'visibility', trend: 'STABLE' },
    { label: 'SYSTEM ACCURACY', value: '99.4%', icon: 'verified', trend: 'HIGH' },
  ];

  const recentScans = [
    { id: 1, name: 'interview_01.mp4', time: '2m ago', result: 'Authentic', score: '98.2%' },
    { id: 2, name: 'voice_note_88.wav', time: '14m ago', result: 'Synthetic', score: '94.1%' },
    { id: 3, name: 'meeting_clip.mov', time: '1h ago', result: 'Authentic', score: '99.6%' },
    { id: 4, name: 'profile_shot.jpg', time: '3h ago', result: 'Authentic', score: '97.4%' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 min-h-[calc(100vh-64px)] font-manrope">
      {/* Welcome Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-slate-950 uppercase italic">Control Center</h1>
        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">System Status: Optimal // Operator: Guest</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-950 transition-colors">{stat.icon}</span>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{stat.label}</p>
            <h2 className="text-2xl font-black text-slate-950 italic tracking-tighter">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Recent Events Feed */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Forensic Activity Feed</h3>
              <button className="text-xs font-black text-slate-950 uppercase border-b-2 border-slate-950 italic hover:border-slate-400 transition-all">View All</button>
            </div>
            <div className="space-y-4">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${scan.result === 'Authentic' ? 'bg-slate-950 text-white' : 'bg-white text-slate-950 border border-slate-200'}`}>
                      <span className="material-symbols-outlined text-[20px]">{scan.result === 'Authentic' ? 'verified' : 'report'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-950 italic tracking-tight">{scan.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{scan.time} // Forensic ID: #{scan.id * 1234}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black italic tracking-tighter uppercase mb-0.5 ${scan.result === 'Authentic' ? 'text-slate-950' : 'text-slate-400'}`}>{scan.result}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conf: {scan.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <h3 className="text-xl font-black italic tracking-tighter mb-2 uppercase">Deepfake Forensic Scan</h3>
                <p className="text-xs font-bold text-white/50 mb-6 max-w-[200px] leading-relaxed">Secure multi-signal detection for images and videos.</p>
                <NavLink to="/engine" className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-xl font-black text-xs uppercase italic hover:scale-105 active:scale-95 transition-all">
                  Launch Engine
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </NavLink>
             </div>
             {/* Abstract Design Elements */}
             <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-8xl">policy</span>
             </div>
             <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-xl font-black italic tracking-tighter mb-4 text-slate-950 uppercase">Live Analysis</h3>
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">Monitor real-time feeds with AI-assisted verification.</p>
            <NavLink to="/live" className="inline-flex items-center gap-2 text-slate-950 font-black text-xs uppercase italic border-b-2 border-slate-950 pb-1 hover:text-slate-400 hover:border-slate-400 transition-all">
               Open Live Monitor
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
