import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(location.state?.mode === 'register');
  const [statusMsg, setStatusMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard');
    });
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMsg('');

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          setStatusMsg('CLEARANCE REQUESTED. PLEASE VERIFY YOUR EMAIL TO INITIALIZE ACCESS.');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.session) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row items-stretch selection:bg-tertiary-fixed selection:text-on-tertiary-container">
      {/* Branding Side - Asymmetric Editorial */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-container p-16 text-white flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-white rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>
        </div>

        <NavLink to="/" className="flex items-center gap-3 relative z-10 group">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-lg group-hover:bg-white/20 transition-all">
            <span className="material-symbols-outlined text-white text-2xl">shield_person</span>
          </div>
          <span className="font-headline font-extrabold text-2xl tracking-tighter">V Auth</span>
        </NavLink>

        <div className="flex-1 flex flex-col justify-center relative z-10 space-y-12">
          <div className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 font-label">Digital Integrity Terminal</p>
            <h2 className="text-8xl font-black font-headline tracking-tighter leading-none uppercase">V-Auth</h2>
          </div>
          <p className="text-2xl text-on-primary-container font-medium max-w-md leading-relaxed border-l-4 border-tertiary-fixed pl-8">
            The industry standard for synthetic media detection and neural network forensics.
          </p>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 bg-surface py-20 relative">
        <div className="lg:hidden absolute top-10 left-10">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-primary-container text-white flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-xl">shield_person</span>
            </div>
            <span className="font-headline font-extrabold text-xl tracking-tighter text-primary">V Auth</span>
          </NavLink>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center">
            {/* Capsule Toggle */}
            <div className="inline-flex p-1.5 bg-surface-container-low rounded-2xl border border-outline-variant/10 mb-10 relative">
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary-container rounded-xl transition-all duration-300 ease-out shadow-lg ${isRegistering ? 'translate-x-full left-1.5' : 'left-1.5'}`}
              ></div>
              <button
                onClick={() => setIsRegistering(false)}
                className={`relative z-10 px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${!isRegistering ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                className={`relative z-10 px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${isRegistering ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Register
              </button>
            </div>

            <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-primary mb-3">
              {isRegistering ? 'Clearance Request' : 'Access Terminal'}
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              {isRegistering ? 'Initialize credentials for neural forensics.' : 'Authenticate to access the investigation archive.'}
            </p>
            
            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[10px] font-bold uppercase tracking-tight animate-fade-in shadow-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {statusMsg && (
              <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-[10px] font-bold uppercase tracking-tight animate-fade-in shadow-sm">
                {statusMsg}
              </div>
            )}
          </div>

          <form onSubmit={handleAuth} className="space-y-8">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 group-focus-within:text-primary transition-colors px-1">
                  Agent Identity
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@v-auth.ai"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl px-6 py-4 text-primary font-medium placeholder:text-slate-300 outline-none transition-all focus:border-primary-container focus:bg-white shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="group relative">
                <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 group-focus-within:text-primary transition-colors px-1">
                  Security Token
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl px-6 py-4 text-primary font-medium placeholder:text-slate-300 outline-none transition-all focus:border-primary-container focus:bg-white shadow-sm pr-14"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-2"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 border-2 border-slate-200 rounded-lg flex items-center justify-center group-hover:border-primary transition-colors overflow-hidden">
                  <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
                <span className="text-xs font-bold tracking-tight text-slate-500 group-hover:text-primary transition-colors uppercase">Stay Authenticated</span>
              </label>
              {!isRegistering && (
                <button type="button" className="text-xs font-bold tracking-tight text-primary hover:underline decoration-2 underline-offset-4 uppercase">
                  Reset Token
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary-container text-white font-bold rounded-2xl hover:bg-primary-container/90 transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,20,83,0.25)] flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {loading ? (isRegistering ? 'INITIALIZING...' : 'AUTHENTICATING...') : (isRegistering ? 'Request Clearance' : 'Authorized Access')}
              {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{isRegistering ? 'person_add' : 'login'}</span>}
              {loading && <span className="material-symbols-outlined animate-spin text-xl">sync</span>}
            </button>
          </form>

          <p className="mt-12 text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase text-center">
            V-Auth Protocol Beta v0.4 
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
