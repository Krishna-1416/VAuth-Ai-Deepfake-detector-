import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const ResetPassword = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);

  // Supabase sends the user back with a session after they click the email link.
  // onAuthStateChange fires a PASSWORD_RECOVERY event — listen for it.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    // Also check if we already have an active session (page refresh case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsValidSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setStatusMsg('');

    if (password !== confirmPassword) {
      setError('SECURITY TOKENS DO NOT MATCH. PLEASE RETRY.');
      return;
    }
    if (password.length < 6) {
      setError('SECURITY TOKEN MUST BE AT LEAST 6 CHARACTERS.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setStatusMsg('SECURITY TOKEN UPDATED SUCCESSFULLY. REDIRECTING...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row items-stretch selection:bg-tertiary-fixed selection:text-on-tertiary-container">
      {/* Branding Side */}
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
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50 font-label">Credential Recovery</p>
            <h2 className="text-8xl font-black font-headline tracking-tighter leading-none uppercase">Token Reset</h2>
          </div>
          <p className="text-2xl text-on-primary-container font-medium max-w-md leading-relaxed border-l-4 border-tertiary-fixed pl-8">
            Update your security token to regain access to the investigation archive.
          </p>
        </div>
      </div>

      {/* Form Side */}
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
            {/* Lock icon badge */}
            <div className="inline-flex w-16 h-16 bg-primary-container/10 rounded-2xl items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-4xl">lock_reset</span>
            </div>

            <h1 className="font-headline font-extrabold text-4xl tracking-tighter text-primary mb-3">
              New Security Token
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              {isValidSession
                ? 'Choose a strong new security token for your account.'
                : 'Verifying your recovery link...'}
            </p>

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[10px] font-bold uppercase tracking-tight animate-fade-in shadow-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {statusMsg && (
              <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-[10px] font-bold uppercase tracking-tight animate-fade-in shadow-sm">
                {statusMsg}
              </div>
            )}
          </div>

          {!isValidSession ? (
            /* Invalid / expired link state */
            <div className="text-center space-y-6">
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="material-symbols-outlined text-amber-500 text-4xl mb-3 block">link_off</span>
                <p className="text-amber-700 font-bold text-sm uppercase tracking-wide">
                  Recovery link invalid or expired
                </p>
                <p className="text-amber-600 text-xs mt-2">
                  Please request a new reset link from the login page.
                </p>
              </div>
              <NavLink
                to="/login"
                className="inline-flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest hover:underline"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Return to Access Terminal
              </NavLink>
            </div>
          ) : (
            /* Reset form */
            <form onSubmit={handleReset} className="space-y-8">
              <div className="space-y-6">
                {/* New password */}
                <div className="group">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 group-focus-within:text-primary transition-colors px-1">
                    New Security Token
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl px-6 py-4 text-primary font-medium placeholder:text-slate-300 outline-none transition-all focus:border-primary-container focus:bg-white shadow-sm pr-14"
                      required
                      minLength={6}
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

                {/* Confirm password */}
                <div className="group">
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 group-focus-within:text-primary transition-colors px-1">
                    Confirm Security Token
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat token"
                      className={`w-full bg-surface-container-lowest border rounded-xl px-6 py-4 text-primary font-medium placeholder:text-slate-300 outline-none transition-all focus:bg-white shadow-sm ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-outline-variant/10 focus:border-primary-container'
                      }`}
                      required
                    />
                    {/* Match indicator */}
                    {confirmPassword && (
                      <span className={`absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-xl ${
                        password === confirmPassword ? 'text-green-500' : 'text-red-400'
                      }`}>
                        {password === confirmPassword ? 'check_circle' : 'cancel'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex gap-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= (i + 1) * 3
                          ? i < 1 ? 'bg-red-400' : i < 2 ? 'bg-amber-400' : i < 3 ? 'bg-yellow-400' : 'bg-green-400'
                          : 'bg-slate-100'
                      }`}
                    />
                  ))}
                  <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 ml-2">
                    {password.length < 3 ? 'Weak' : password.length < 6 ? 'Fair' : password.length < 9 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full py-5 bg-primary-container text-white font-bold rounded-2xl hover:bg-primary-container/90 transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,20,83,0.25)] flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {loading ? 'UPDATING TOKEN...' : 'Confirm New Token'}
                {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">lock</span>}
                {loading && <span className="material-symbols-outlined animate-spin text-xl">sync</span>}
              </button>

              <NavLink
                to="/login"
                className="block w-full text-center text-xs font-bold tracking-widest uppercase text-slate-400 hover:text-primary transition-colors py-2"
              >
                ← Back to Access Terminal
              </NavLink>
            </form>
          )}

          <p className="mt-12 text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase text-center">
            V-Auth Protocol Beta v0.4
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
