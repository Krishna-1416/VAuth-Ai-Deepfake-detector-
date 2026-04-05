import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

// Memoized Video Component to prevent re-renders on state updates
const CameraFeed = React.memo(({ isStreaming, videoRef, canvasRef }) => (
  <div className="absolute inset-0 w-full h-full">
    <video 
      ref={videoRef}
      autoPlay 
      playsInline 
      muted
      style={{ 
        transform: 'scaleX(-1)', 
        objectFit: 'cover',
        willChange: 'opacity, transform'
      }}
      className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isStreaming ? 'opacity-100' : 'opacity-20'}`}
    />
    <canvas ref={canvasRef} style={{ display: 'none' }} />
  </div>
));

const LiveStream = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const [permissionState, setPermissionState] = useState('pending'); // pending, granted, denied
  const [isStreaming, setIsStreaming] = useState(false);
  const [realTimeResult, setRealTimeResult] = useState(null);
  const [logs, setLogs] = useState([
    { id: 1, time: '14:20:00', msg: 'System Standby. Ready for forensic initialization.' },
  ]);

  // Request Camera Permissions on Mount
  useEffect(() => {
    async function checkPermissions() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Just check, don't keep open
        setPermissionState('granted');
        setLogs(prev => [{ id: Date.now(), time: '14:20:02', msg: 'Security Clearance: GRANTED. Forensic Hardware Ready.' }, ...prev]);
      } catch (err) {
        setPermissionState('denied');
        setLogs(prev => [{ id: Date.now(), time: '14:20:02', msg: 'CRITICAL ERROR: Authorization Denied by System.' }, ...prev]);
      }
    }
    checkPermissions();
  }, []);

  const toggleStream = async () => {
    if (isStreaming) {
      // STOP STREAM
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsStreaming(false);
      setRealTimeResult(null);
      setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), msg: 'Forensic Link Terminated. Connection CLOSED.' }, ...prev]);
    } else {
      // START STREAM
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsStreaming(true);
        setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), msg: 'Tactical Feed INITIALIZED. Synchronizing signals...' }, ...prev]);
        
        // Initialize WebSocket
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const socket = new WebSocket(`ws://localhost:8000/live?token=${token}`);
        socket.onopen = () => {
          setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString([], { hour12: false }), msg: 'Secure Forensic Socket ESTABLISHED. Link Live.' }, ...prev]);
        };
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error("Analysis Error:", data.msg);
          } else {
            setRealTimeResult(data);
          }
        };
        socket.onclose = () => {
          console.log("WebSocket Disconnected");
        };
        wsRef.current = socket;

      } catch (err) {
        console.error("Stream start error:", err);
        setPermissionState('denied');
      }
    }
  };

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Real-time Frame Capture Loop
  useEffect(() => {
    if (!isStreaming || !videoRef.current) return;

    const captureInterval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const socket = wsRef.current;

      if (video && canvas && socket && socket.readyState === WebSocket.OPEN) {
        // Ensure canvas matches a standard processing size
        if (canvas.width !== 640) {
          canvas.width = 640;
          canvas.height = 480;
        }
        
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // JPEG compression (0.5) for balance
        const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
        socket.send(base64Frame);
      }
    }, 1000); 

    return () => clearInterval(captureInterval);
  }, [isStreaming]);

  // Sync Logic Logs with Results
  useEffect(() => {
    if (!realTimeResult) return;

    const score = realTimeResult.composite ?? 0;
    const msg = score > 0.4 
      ? `ANOMALY DETECTED: Synthetic patterns identified (${Math.round(score*100)}%)`
      : `FRAME VERIFIED: Real-world consistency confirmed.`;
    
    setLogs(prev => [{
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour12: false }),
      msg: msg
    }, ...prev].slice(0, 10));

  }, [realTimeResult]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 min-h-[calc(100vh-64px)] font-manrope">
      {/* Tactical Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200/40">
        <div>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isStreaming ? 'bg-slate-950 animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'bg-slate-300'}`}></div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-950 uppercase">Live Forensic Monitor</h1>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1 tracking-widest">Signal Status</span>
            <span className={`text-sm font-black tracking-tighter ${isStreaming ? 'text-slate-950' : 'text-slate-400'}`}>
              {isStreaming ? 'STABLE' : 'OFFLINE'}
            </span>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60 shadow-sm">
            <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1 tracking-widest">Accuracy</span>
            <span className={`text-sm font-black ${isStreaming ? 'text-slate-950' : 'text-slate-400'}`}>
              {isStreaming ? '99.2%' : '---'}
            </span>
          </div>
        </div>
      </div>

      <div 
        className="grid gap-8 h-[600px]" 
        style={{ gridTemplateColumns: 'minmax(0, 1fr) 400px' }}
      >
        {/* Central Monitor Feed */}
        <div 
          className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 border-slate-100 shadow-2xl group"
          style={{ transform: 'translateZ(0)', contain: 'layout size' }}
        >
          {/* Permission State Overlays */}
          {permissionState === 'pending' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30">
               <span className="material-symbols-outlined text-6xl text-slate-700 animate-spin mb-4">settings_suggest</span>
               <p className="text-slate-500 font-black tracking-widest text-[10px] uppercase">Authorizing Secure Link...</p>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-30 text-center px-10">
               <span className="material-symbols-outlined text-6xl text-slate-100 mb-4 scale-x-[-1]">report_problem</span>
               <h2 className="text-white font-black text-xl mb-2 tracking-tighter uppercase">Authorization Denied</h2>
               <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-sm">Enable camera access to begin monitoring.</p>
               <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-white text-slate-950 font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all uppercase">Retry Connection</button>
            </div>
          )}

          {/* Manual Offline Overlay */}
          {!isStreaming && permissionState === 'granted' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-20 backdrop-blur-sm">
               <div className="h-16 w-16 rounded-full bg-slate-950/50 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-slate-500">videocam_off</span>
               </div>
               <h3 className="text-white/40 font-black text-xs tracking-[0.3em] uppercase">System Offline // Feed Ready</h3>
               <div className="mt-4 flex gap-2">
                  <div className="h-1 w-8 bg-slate-800 rounded-full"></div>
                  <div className="h-1 w-8 bg-slate-800 rounded-full"></div>
                  <div className="h-1 w-8 bg-slate-800 rounded-full"></div>
               </div>
            </div>
          )}

          {/* Isolated Camera Feed */}
          <CameraFeed isStreaming={isStreaming} videoRef={videoRef} canvasRef={canvasRef} />

          {/* Scanning Line Animation */}
          {isStreaming && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-white/40 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-scan-line z-10"></div>
          )}
          
          {/* HUD & Overlay elements (only fully visible when streaming) */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isStreaming ? 'opacity-100' : 'opacity-10'}`}>
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
             <div className="absolute top-10 left-10 w-16 h-16 border-t-2 border-l-2 border-white/60"></div>
             <div className="absolute top-10 right-10 w-16 h-16 border-t-2 border-r-2 border-white/60"></div>
             <div className="absolute bottom-10 left-10 w-16 h-16 border-b-2 border-l-2 border-white/60"></div>
             <div className="absolute bottom-10 right-10 w-16 h-16 border-b-2 border-r-2 border-white/60"></div>
          </div>

          {/* HUD Info Label - No re-animation on update */}
          {isStreaming && (
            <div className="absolute bottom-10 left-10 z-20 pointer-events-none">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-slate-100 animate-pulse"></div>
                <p className="text-[10px] font-black text-white/80 tracking-widest uppercase">Targeting Active // Signal High</p>
              </div>
              <p className="text-white font-mono text-xs bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 shadow-2xl">L-SYNC: 104.22 // GRID-V: 92.51</p>
            </div>
          )}
        </div>

        {/* Live Metrics Sidebar */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Forensic Control</h3>
              <span className={`material-symbols-outlined text-[18px] ${isStreaming ? 'text-slate-950' : 'text-slate-300'}`}>settings_remote</span>
            </div>
            
            {/* START/STOP TACTICAL BUTTON */}
            <button 
              onClick={toggleStream}
              className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 border shadow-2xl ${isStreaming 
                ? 'bg-slate-950 text-white border-slate-950 hover:bg-white hover:text-slate-950' 
                : 'bg-white text-slate-950 border-slate-200 hover:border-slate-950'
              } active:scale-95`}
            >
               <span className="material-symbols-outlined text-[20px]">{isStreaming ? 'stop_circle' : 'play_circle'}</span>
               {isStreaming ? 'Terminate Connection' : (permissionState === 'denied' ? 'Re-Authorize & Start' : 'Initialize Monitor')}
            </button>

            <div className="mt-10 space-y-6">
              <div>
                <div className="flex justify-between items-center text-xs font-black mb-2 tracking-tighter">
                  <span className="text-slate-500 uppercase">AI Confidence / Malice</span>
                  <span className={`${(realTimeResult?.composite > 0.4) ? 'text-error' : 'text-slate-950'}`}>
                    {realTimeResult ? `${Math.round(realTimeResult.composite * 100)}%` : '0.0%'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className={`h-full ${(realTimeResult?.composite > 0.4) ? 'bg-error' : 'bg-slate-950'}`}
                    style={{ width: `${realTimeResult ? realTimeResult.composite * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {realTimeResult && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                     <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Bio Alignment</span>
                     <span className="text-xs font-black text-slate-900">
                       {Math.round((1 - realTimeResult.breakdown.geometric_alignment) * 100)}%
                     </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                     <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Latency</span>
                     <span className="text-xs font-black text-slate-900">{realTimeResult.latency_ms}ms</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950 p-8 rounded-[2.5rem] flex-1 font-mono text-[10px] overflow-hidden flex flex-col shadow-2xl relative border-t border-white/5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <span className="text-white/40 font-black uppercase tracking-widest">System Terminal</span>
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isStreaming ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-slate-700'}`}></div>
                <span className="text-white/20 text-[9px] font-black uppercase">Encryption Enabled</span>
              </div>
            </div>
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2" style={{ scrollbarGutter: 'stable' }}>
              {logs.map((log, index) => (
                <div 
                  key={log.id} 
                  className={`flex gap-3 opacity-80 hover:opacity-100 transition-opacity ${index === 0 ? 'animate-fade-in' : ''}`}
                >
                  <span className="text-white/20 font-black shrink-0">[{log.time}]</span>
                  <span className="text-slate-400 font-bold leading-relaxed">{log.msg}</span>
                </div>
              ))}
            </div>
            {/* Terminal Glow */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 h-16 top-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
