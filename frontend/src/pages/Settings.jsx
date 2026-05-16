import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'ADMINISTRATOR'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const emailPrefix = user.email ? user.email.split('@')[0] : 'AGENT';
          const autoFirstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          
          setProfile({
            firstName: user.user_metadata?.first_name || autoFirstName,
            lastName: user.user_metadata?.last_name || 'OPERATOR',
            email: user.email || '',
            role: 'ADMINISTRATOR'
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
        }
      });

      if (error) throw error;
      setSuccessMsg('IDENTITY UPDATE SUCCESSFUL. CLEARANCE LEVEL MAINTAINED.');
      
      // Auto-clear success message after 3s
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">sync</span>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Profile Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-12 min-h-[calc(100vh-64px)] animate-fade-in">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-slate-950">Identity Management</h1>
          <p className="text-slate-500 font-medium mt-2">Configure your agent field profile and operational preferences.</p>
        </div>
        
        {/* Administrator Badge */}
        <div className="flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-xl shadow-slate-950/10 border border-white/5">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary-fixed text-2xl">verified_user</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Clearance Level</p>
            <p className="text-sm font-black tracking-tight">{profile.role}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-8xl">fingerprint</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-primary-container/20 ring-4 ring-white border-2 border-primary-container">
                <span className="text-3xl font-black text-white">{profile.firstName?.[0] || profile.email?.[0]?.toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-950">{profile.firstName} {profile.lastName}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{profile.email}</p>
              
              <div className="mt-8 pt-8 border-t border-slate-100 w-full grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
                  <p className="text-lg font-bold text-slate-950">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption</p>
                  <p className="text-lg font-bold text-slate-950">AES-256</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
            <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
              <span className="font-bold text-slate-600">NOTICE:</span> Your profile data is secured according to V-Auth neural-privacy standards. All updates are logged for integrity audit.
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="lg:col-span-8">
          <div className="bg-white p-10 rounded-3xl border border-slate-200/60 shadow-sm">
            {successMsg && (
              <div className="mb-8 p-4 bg-tertiary-fixed/10 border-l-4 border-tertiary-fixed text-tertiary-fixed-dim text-[11px] font-black uppercase tracking-tight animate-fade-in flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">check_circle</span>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-10">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  Personal Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="flex flex-col gap-3 group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 group-focus-within:text-primary transition-colors">FIRST NAME</label>
                    <input 
                      className="bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary p-4 text-slate-950 font-medium transition-all outline-none" 
                      type="text" 
                      value={profile.firstName}
                      onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      placeholder="Agent First Name"
                    />
                  </div>
                  <div className="flex flex-col gap-3 group">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 group-focus-within:text-primary transition-colors">LAST NAME</label>
                    <input 
                      className="bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary p-4 text-slate-950 font-medium transition-all outline-none" 
                      type="text" 
                      value={profile.lastName}
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      placeholder="Agent Last Name"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  Authentication Link
                </h2>
                
                <div className="flex flex-col gap-3 opacity-60">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">SYSTEM EMAIL</label>
                  <div className="relative">
                    <input 
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-4 pr-12 text-slate-500 font-medium cursor-not-allowed outline-none" 
                      type="email" 
                      value={profile.email}
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none rounded-r-xl"></div>
                    <div className="absolute right-4 inset-y-0 flex items-center">
                      <span className="material-symbols-outlined text-slate-400 text-lg">lock</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold ml-1 flex items-center gap-1.5 uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Email verification required for security rotation
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  disabled={saveLoading}
                  className="px-12 py-4 bg-primary text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 group"
                >
                  {saveLoading ? 'Storing Data...' : 'Save Configuration'}
                  {!saveLoading && <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">cloud_upload</span>}
                  {saveLoading && <span className="material-symbols-outlined animate-spin text-lg">sync</span>}
                </button>
              </div>
            </form>

            {/* Sign Out - Mobile only */}
            <div className="mt-12 pt-8 border-t border-slate-100 lg:hidden">
              <button 
                onClick={handleSignOut}
                className="w-full py-4 bg-red-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-red-600/20 hover:bg-red-700"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
