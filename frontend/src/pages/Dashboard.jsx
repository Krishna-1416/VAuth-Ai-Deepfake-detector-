import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState('Guest');

  const normalizeLabel = (label) => {
    const lower = (label || '').toLowerCase();
    if (lower.includes('synthetic') || lower.includes('deepfake') || lower.includes('fake')) return 'Fake';
    return 'Real';
  };
  const [stats, setStats] = useState([
    { label: 'MEDIA SCANNED', value: '...', icon: 'analytics', trend: 'LIVE' },
    { label: 'SYNTHETIC DETECTED', value: '...', icon: 'report_problem', trend: 'LIVE' },
    { label: 'ACTIVE MONITORS', value: '04', icon: 'visibility', trend: 'STABLE' },
    { label: 'SYSTEM ACCURACY', value: '99.4%', icon: 'verified', trend: 'HIGH' },
  ]);
  const [recentScans, setRecentScans] = useState([]);
  const [allScans, setAllScans] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get Auth Session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Use part of email as operator name
        setOperator(user.email.split('@')[0].toUpperCase());
      }

      // 2. Fetch Forensic Scans
      const { data: scans, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Update Stats
      const totalStr = scans.length.toLocaleString();
      const syntheticStr = scans.filter(s => normalizeLabel(s.prediction) === 'Fake').length.toLocaleString();

      setStats(prev => [
        { ...prev[0], value: totalStr },
        { ...prev[1], value: syntheticStr },
        prev[2],
        prev[3]
      ]);

      // 4. Update Recent Activity Feed
      const mapped = scans.map(s => ({
        id: s.id,
        rawId: s.id.slice(0, 8),
        name: s.file_name,
        time: formatRelativeTime(s.created_at),
        result: normalizeLabel(s.prediction),
        score: `${(s.confidence * 100).toFixed(1)}%`
      }));
      setAllScans(mapped);
      setRecentScans(mapped.slice(0, 4));

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return past.toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 min-h-[calc(100dvh-64px)] font-manrope">
      {/* Welcome Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter text-slate-950 uppercase">Control Center</h1>
      </div>

        {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-950 transition-colors">{stat.icon}</span>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{stat.trend}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h2 className="text-2xl font-black text-slate-950 tracking-tighter">{stat.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Recent Events Feed */}
        <div className="col-span-12">
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Forensic Activity Feed</h3>
              <button onClick={() => setShowAll(!showAll)} className="text-xs font-black text-slate-950 uppercase border-b-2 border-slate-950 hover:border-slate-400 transition-all">{showAll ? 'Show Less' : 'View All'}</button>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4">settings_suggest</span>
                <p className="text-xs font-black uppercase tracking-widest">Syncing control center...</p>
              </div>
            ) : (showAll ? allScans : recentScans).length > 0 ? (
              <div className="space-y-4">
                {(showAll ? allScans : recentScans).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all group min-w-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${scan.result === 'Real' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        <span className="material-symbols-outlined text-[20px]">{scan.result === 'Real' ? 'verified' : 'report'}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950 tracking-tight truncate">{scan.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{scan.time} // Forensic Hash: {scan.rawId}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`text-xs font-black tracking-tighter uppercase mb-0.5 ${scan.result === 'Real' ? 'text-emerald-600' : 'text-red-600'}`}>{scan.result}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conf: {scan.score}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-xs font-black uppercase text-slate-300 tracking-widest">No forensic data found in system history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
