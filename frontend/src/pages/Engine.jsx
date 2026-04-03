import React from 'react';

const Engine = () => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <nav className="flex gap-2 text-xs font-medium text-slate-400 mb-2">
            <span>Analysis</span>
            <span>/</span>
            <span className="text-slate-900">Active Scan</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight">Deep_Archive_Scan_X.mp4</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Processing hash: 8f2c...4e1a • Source: Secure Uplink 04</p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 bg-tertiary-container text-tertiary-fixed rounded-full text-xs font-bold tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
            LIVE PROCESSING
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl group">
            <img alt="Analysis Video Stream" className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdZcrtY8GQe9P-Vm0D26a_JH1_bm4bKZx7O5cFN3NX_-dmTAtD-Vuf12hy5q-VWkKDGfzvBiQvjDLHGgpQbP9Xo0DaD9khv8Ig9jugFXNYZjPqv5rfhO9B9afLqyuufJ79-LmUQfr5NNqXNpFdjhEXWj1WsCdki81yHBlRArHFIhn5XzQAd_glkpJ1aBu_M_shBbI2KWqiOqdjJl86RDudjyYVXP0dmaJ_bLJDNLeXJjYWILjZ0B5HQhKGH9W4tWCTQESKOun_R_o5" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-tertiary-fixed/50 rounded-lg">
                <div className="absolute -top-6 left-0 bg-tertiary-fixed text-tertiary-container text-[10px] px-1.5 py-0.5 font-bold rounded">SUBJECT_ALPHA: 98.4% AUTHENTIC</div>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tertiary-fixed"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tertiary-fixed"></div>
              </div>
              <div className="absolute top-1/2 right-1/3 w-24 h-24 border-2 border-error/50 rounded-lg">
                <div className="absolute -top-6 left-0 bg-error text-white text-[10px] px-1.5 py-0.5 font-bold rounded">INCONSISTENCY_DETECTOR</div>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-error"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-error"></div>
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_49%,rgba(111,251,190,0.1)_50%,rgba(0,0,0,0)_51%)] bg-[length:100%_4px] opacity-20"></div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-6">
                <button className="text-white hover:text-tertiary-fixed transition-colors">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
                <div className="flex-1 space-y-2">
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary-fixed w-3/4"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold tracking-widest text-white/60">
                    <span>02:14 / 03:00</span>
                    <span>75% ANALYZED</span>
                  </div>
                </div>
                <div className="flex gap-4 text-white/80">
                  <span className="material-symbols-outlined cursor-pointer hover:text-white">settings_cinematic_blur</span>
                  <span className="material-symbols-outlined cursor-pointer hover:text-white">fullscreen</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-8 flex items-center gap-12">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-manrope font-bold text-slate-900 uppercase tracking-widest text-xs">Scanning Phase 3/4: Neural Layer Analysis</h3>
                <span className="text-xs font-bold text-primary-container">74% COMPLETE</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-primary-container rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-l border-surface-container-high pl-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Pings</p>
                <p className="text-2xl font-extrabold text-slate-950">1,402</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Anomalies</p>
                <p className="text-2xl font-extrabold text-error">03</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 h-[calc(100%-88px)] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-high">
              <h2 className="font-manrope font-extrabold text-slate-950 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">analytics</span>
                Detection Stream
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Buffer</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-error">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-error bg-error-container px-1.5 py-0.5 rounded">CRITICAL ANOMALY</span>
                  <span className="text-[10px] font-mono text-slate-400">02:14:12</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Inconsistent Light Vector detected</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Ray tracing analysis shows shadow-to-source mismatch on Subject_Alpha's nasal ridge.</p>
              </div>
              
              <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-tertiary-fixed">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded">METADATA EXTRACTED</span>
                  <span className="text-[10px] font-mono text-slate-400">02:13:58</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">GPS Header: [51.5074° N, 0.1278° W]</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Origin confirmed as Greater London area. Timestamp aligns with file creation date.</p>
              </div>
              
              <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-primary-container">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-white bg-primary-container px-1.5 py-0.5 rounded">NEURAL SCAN</span>
                  <span className="text-[10px] font-mono text-slate-400">02:13:45</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Frequency Analysis: Stable</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">No high-frequency compression artifacts found in background texture layers.</p>
              </div>
              
              <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-error">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-error bg-error-container px-1.5 py-0.5 rounded">WARNING</span>
                  <span className="text-[10px] font-mono text-slate-400">02:12:10</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Non-Uniform Noise Distribution</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Frame jitter detected in blue channel; possible GAN-based reconstruction.</p>
              </div>
              
              <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-tertiary-fixed">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-on-tertiary-container bg-tertiary-fixed px-1.5 py-0.5 rounded">VERIFICATION</span>
                  <span className="text-[10px] font-mono text-slate-400">02:11:04</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Audio Sync: Validated</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Micro-expression matching suggests 99.2% probability of genuine vocalization.</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-surface-container-high">
              <button className="w-full py-3 bg-surface-container-highest text-on-surface font-manrope font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">download</span>
                Export Forensic Report
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">camera</span>
            Camera Fingerprint
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Sensor Type</span>
              <span className="font-semibold text-slate-900">CMOS Full Frame</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">PRNU Match</span>
              <span className="font-semibold text-tertiary-fixed-dim">94% Confidence</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">ISO Variance</span>
              <span className="font-semibold text-slate-900">Nominal</span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">view_in_ar</span>
            Geometry Audit
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Perspective Alignment</span>
              <span className="font-semibold text-slate-900">Pass</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Reflection Consistency</span>
              <span className="font-semibold text-error">Warning</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Vanishing Point</span>
              <span className="font-semibold text-slate-900">Coherent</span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">memory</span>
            AI Signal Detection
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Diffusion Residuals</span>
              <span className="font-semibold text-slate-900">0.02% detected</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Up-sampling Artifacts</span>
              <span className="font-semibold text-slate-900">None</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Neural Synthesis Score</span>
              <span className="font-semibold text-tertiary-fixed-dim">Very Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Engine;
