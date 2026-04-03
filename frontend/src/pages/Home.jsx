import React from 'react';
import { NavLink } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* TopAppBar Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-xl transition-all duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-4">
          <div className="text-xl font-bold tracking-tighter text-slate-950 font-headline flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">shield_person</span>
            V Auth
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-manrope font-medium tracking-tight">
            <a className="text-slate-950 font-semibold border-b-2 border-slate-950 pb-1" href="#">Platform</a>
            <a className="text-slate-500 hover:text-slate-900 transition-colors duration-200" href="#forensic-stack">Technology</a>
            <a className="text-slate-500 hover:text-slate-900 transition-colors duration-200" href="#visual-proof">Solutions</a>
          </div>

          <div className="flex items-center gap-4">
            <NavLink to="/login" className="text-slate-500 font-medium hover:text-slate-900">Register</NavLink>
            <NavLink 
              to="/login"
              className="bg-primary-container text-white text-sm px-6 py-2.5 rounded-xl font-semibold transition-all active:opacity-80 active:scale-95 shadow-[0_4px_12px_rgba(0,20,83,0.1)] hover:shadow-lg hover:shadow-primary-container/20"
            >
              Sign In
            </NavLink>
          </div>
        </div>
      </nav>

      <main className="pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/10">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim mr-2 animate-pulse"></span>
              <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant font-label">V.4.0 Engine Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-extrabold font-headline tracking-tight text-primary leading-[1.1]">
              Restoring <span className="text-on-primary-container">Digital Trust</span>.
            </h1>
            
            <p className="text-xl text-on-surface-variant max-w-xl font-body leading-relaxed">
              V Auth provides high-precision media verification. Detect deepfakes and synthetic manipulations at the speed of thought.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <NavLink 
                to="/login"
                className="bg-primary-container text-white px-10 py-5 rounded-2xl font-bold text-lg hover:shadow-[0_20px_40px_-5px_rgba(0,20,83,0.25)] hover:-translate-y-1 transition-all text-center"
              >
                Start Free Analysis
              </NavLink>
            </div>
          </div>

          <div className="lg:col-span-5 relative animate-in fade-in zoom-in duration-1000">
            <div className="aspect-square bg-surface-container-low rounded-[2.5rem] overflow-hidden relative border border-outline-variant/5 shadow-2xl">
              <img 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 cursor-crosshair scale-105" 
                alt="minimalist architectural photography with clean lines" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBd6uQJ7rGosKV7vtQ545Ees6dbfekmXg7WsM3KI9_fwcf1f59P_aOEythFb0lcEKOJXd_B_GpJr0f0e4syXD2Z_2P4dElAwi6ChNWEUKqTnH3r9ZVZjgaKNFtdYfM0IJrC39KkfbeMAELVRre58U6XLXZb47QaL4DCvuvQEV7JnxVLEyfQAaJo65qQ-dF_lPqvxnFs_q0rGmc-X7jlSrvSqKM-sm8P0OwxgPLCKq6G_P_tU83MUeuIYPs-udKV_M9OcaF-JkbaX_MO"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
              
              {/* Floating Data Card */}
              <div className="absolute bottom-10 right-6 left-6 glass-panel rounded-3xl p-8 shadow-[0_40px_80px_rgba(0,0,0,0.15)] border border-white/20">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label mb-2">Scan Probability</p>
                    <p className="text-5xl font-extrabold font-headline text-primary tracking-tighter">94.8%</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 rounded-full bg-on-tertiary-container text-white text-[10px] font-bold mb-4 tracking-widest">AUTHENTIC</span>
                    <div className="flex gap-1.5 h-12 items-end">
                      <div className="h-full w-1.5 bg-tertiary-fixed-dim rounded-full"></div>
                      <div className="h-2/3 w-1.5 bg-tertiary-fixed-dim/40 rounded-full"></div>
                      <div className="h-1/3 w-1.5 bg-tertiary-fixed-dim/20 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Visual Proof Section */}
        <section id="visual-proof" className="py-32 max-w-7xl mx-auto px-8 leading-tight">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 relative p-8 bg-surface-container-low rounded-[3rem] overflow-hidden group">
              <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
              </div>
              
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/10 group-hover:scale-[1.02] transition-transform duration-700">
                <div className="aspect-video bg-black flex items-center justify-center overflow-hidden relative">
                  <img 
                    className="w-full h-full object-cover opacity-80" 
                    alt="high-definition documentary interview still" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkN4iAJA7SwH7zpZOakdi_lg2X2af9Yg0JqHProtXOdqjR1sJTL-VpCIfdx75_4eSYNjwDQM_ULcQtz9hC4RAKZ6GX-Tkhmq2dL7z4HgcHW6dKV7Cw0pvCpNqyxRs8CyBzXLl9H436ukTJEjxTSuPSWYZdb2jpQT1Zmu0VgN53gi0_xWYPrjNXZOGz8F8-gdx0new3bCqPbvAGV1te4dQbrqVfr2EZiXvK7dEIv0Bw0FwUkITzHMvQPn3YI3WMolvKPDCgwoiik6OQ"
                  />
                  
                  {/* Verification Overlay */}
                  <div className="absolute inset-0 flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/80 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-error rounded-full animate-pulse shadow-[0_0_12px_#ba1a1a]"></div>
                        <span className="text-white text-[10px] font-bold font-label tracking-widest uppercase">Live Scan</span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg text-white text-[10px] font-mono">
                        FRAME 2,492 / 12,000
                      </div>
                    </div>
                    
                    {/* Targeting Reticle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-56 md:h-56">
                      <div className="absolute inset-0 border-2 border-tertiary-fixed-dim/40 rounded-full animate-[ping_3s_infinite]"></div>
                      <div className="absolute inset-2 border-2 border-tertiary-fixed-dim/60 rounded-full animate-[ping_2s_infinite]"></div>
                      <div className="absolute inset-0 border-t-2 border-l-2 border-tertiary-fixed-dim w-8 h-8 rounded-tl-xl translate-x-[-4px] translate-y-[-4px]"></div>
                      <div className="absolute bottom-0 right-0 border-b-2 border-r-2 border-tertiary-fixed-dim w-8 h-8 rounded-br-xl translate-x-[4px] translate-y-[4px]"></div>
                    </div>

                    <div className="bg-tertiary-container/90 backdrop-blur-xl p-5 rounded-2xl flex items-center gap-6 max-w-sm border border-tertiary-fixed/20 shadow-2xl">
                      <div className="h-16 w-16 rounded-full border-4 border-tertiary-fixed flex items-center justify-center text-on-tertiary-container font-black text-xl">
                        94%
                      </div>
                      <div>
                        <p className="text-[10px] text-tertiary-fixed/80 font-bold uppercase tracking-[0.2em] font-label mb-1">Integrity Status</p>
                        <p className="text-lg font-extrabold text-white">Confidence Verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-10">
              <h2 className="text-5xl font-extrabold font-headline text-primary tracking-tight leading-tight">
                Verification is an <span className="text-on-primary-container">Art Form</span>, Measured in Pixels.
              </h2>
              <p className="text-xl text-on-surface-variant font-body leading-relaxed max-w-lg">
                Our proprietary V4.0 engine looks beyond what is visible, identifying microscopic inconsistencies in facial muscular sync and environment lighting vectors.
              </p>
              <ul className="grid grid-cols-1 gap-6 pt-4">
                {[
                  "Artifact isolation in compressed media streams",
                  "Temporal consistency tracking across 60fps",
                  "Geometric landmark mesh analysis"
                ].map(item => (
                  <li key={item} className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary-fixed group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-xl">verified_user</span>
                    </div>
                    <span className="text-on-surface font-semibold text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Core Features: The Forensic Stack */}
        <section id="forensic-stack" className="bg-surface-container-low py-32">
          <div className="max-w-7xl mx-auto px-8">
            <div className="mb-24 text-center">
              <h2 className="text-5xl font-extrabold font-headline text-primary mb-6 tracking-tight">The Forensic Stack</h2>
              <p className="text-on-surface-variant max-w-3xl mx-auto text-xl font-medium leading-relaxed">
                Multi-layered security protocols designed for high-stakes digital environments requiring absolute verification.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { 
                  title: "Deep Image Forensics", 
                  desc: "Metadata and pixel-level analysis to uncover invisible editing traces and generative AI footprints.", 
                  icon: "image" 
                },
                { 
                  title: "Synthetic Voice Detection", 
                  desc: "Identifying vocoder artifacts and non-human harmonic structures in synthesized audio samples.", 
                  icon: "settings_voice" 
                },
                { 
                  title: "Video Inconsistency Scan", 
                  desc: "Facial muscle synchronization and light vector analysis to spot deepfake temporal flickering.", 
                  icon: "videocam" 
                }
              ].map((feat, idx) => (
                <div key={idx} className="bg-surface-container-lowest p-12 rounded-[2.5rem] transition-all group hover:-translate-y-3 hover:shadow-2xl border border-outline-variant/10 flex flex-col justify-between">
                  <div>
                    <div className="w-16 h-16 bg-primary-container/10 flex items-center justify-center rounded-2xl mb-10 group-hover:bg-primary-container group-hover:rotate-6 transition-all duration-500">
                      <span className="material-symbols-outlined text-4xl text-primary-container group-hover:text-white transition-colors">{feat.icon}</span>
                    </div>
                    <h3 className="text-2xl font-black font-headline mb-4 text-primary">{feat.title}</h3>
                    <p className="text-on-surface-variant leading-relaxed mb-10 font-medium">
                      {feat.desc}
                    </p>
                  </div>
                  <NavLink to="/login" className="text-sm font-bold text-primary-container flex items-center gap-2 group/link uppercase tracking-widest">
                    Request Module access 
                    <span className="material-symbols-outlined text-sm group-hover/link:translate-x-2 transition-transform">arrow_forward</span>
                  </NavLink>
                </div>
              ))}
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="w-full py-20 px-8 bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary-container text-white flex items-center justify-center rounded-2xl">
                <span className="material-symbols-outlined text-2xl">shield_person</span>
              </div>
              <span className="font-headline font-bold text-slate-900 text-2xl tracking-tighter">V Auth</span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed max-w-md text-lg">
              The industry standard for synthetic media detection and neural network forensics. Powered by the Sentinel AI ecosystem.
            </p>
          </div>
          
          <div className="md:col-span-7 grid grid-cols-2 lg:grid-cols-3 gap-12 text-sm font-manrope font-semibold">

            <div className="space-y-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal</div>
              <ul className="space-y-4 text-slate-600">
                <li><a className="hover:text-primary-container transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary-container transition-colors" href="#">Terms of Service</a></li>
                <li><a className="hover:text-primary-container transition-colors" href="#">Ethics Charter</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          <div>© 2026 V Auth Sentinel Framework. Verification as an Art Form.</div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></div>
            Node 07 Cluster Online
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
