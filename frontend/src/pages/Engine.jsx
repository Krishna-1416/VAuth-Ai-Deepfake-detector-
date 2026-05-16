import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getApiUrl } from '../lib/constants';

const Engine = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const fileInputRef = useRef(null);

  // SSE Listener for real-time logs
  useEffect(() => {
    if (!taskId) return;

    const eventSource = new EventSource(`${getApiUrl()}/events/${taskId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'failed') {
        setLogs(prev => [...prev, { status: 'Error', message: data.error, type: 'error' }]);
        setIsAnalyzing(false);
        eventSource.close();
      } else if (data.status === 'Complete') {
        setAnalysisResult(data.result);
        setLogs(prev => [...prev, { status: 'Complete', message: 'Forensic report generated.', type: 'success' }]);
        setIsAnalyzing(false);
        setProgress(100);
        eventSource.close();
      } else {
        // Log update
        setLogs(prev => [...prev, { status: data.status, message: data.message || data.thought || '', type: 'log' }]);
        // Update progress based on status
        if (data.status.includes('Visual')) setProgress(40);
        if (data.status.includes('Fact')) setProgress(70);
      }
    };

    eventSource.onerror = () => {
      console.error("SSE connection failed");
      eventSource.close();
    };

    return () => eventSource.close();
  }, [taskId]);

  const normalizeImage = (file) => {
    return new Promise((resolve) => {
      // Only normalize images
      if (!file.type.startsWith('image/')) return resolve(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max 2000px for forensic performance balance
          const MAX_SIZE = 2000;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const normalizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(normalizedFile);
          }, 'image/jpeg', 0.92);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsDownloading(true);
      const normalized = await normalizeImage(file);
      setSelectedFile(normalized);
      setPreviewUrl(URL.createObjectURL(normalized));
      setAnalysisResult(null);
      setIsDownloading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // 1. Handle local files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setIsDownloading(true);
      const normalized = await normalizeImage(file);
      setSelectedFile(normalized);
      setPreviewUrl(URL.createObjectURL(normalized));
      setAnalysisResult(null);
      setIsDownloading(false);
      return;
    }

    // 2. Handle remote URLs (e.g. dragged from Unsplash/other tabs)
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('URL');
    if (url) {
      setIsDownloading(true);
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Extract filename from URL or default
        const filename = url.split('/').pop().split('?')[0] || 'remote-image.jpg';
        const rawFile = new File([blob], filename, { type: blob.type });
        
        // Normalize to JPEG for max compatibility
        const normalized = await normalizeImage(rawFile);
        setSelectedFile(normalized);
        setPreviewUrl(URL.createObjectURL(normalized));
        setAnalysisResult(null);
      } catch (err) {
        console.error("Failed to download dropped image:", err);
        alert("Could not load image from this URL. Try saving it first.");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setProgress(0);
    setIsAnalyzing(false);
    setLogs([]);
    setTaskId(null);
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setLogs([]);
    setTaskId(null);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('query', 'Perform a deepfake forensic analysis on this media.');

    try {
      const isVideo = selectedFile.type.startsWith('video');
      const endpoint = isVideo ? '/analyze/video' : '/analyze';
      
      // Get session for Auth
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Backend connection failed');
      }

      const data = await response.json();
      setTaskId(data.task_id);
      setLogs([{ status: 'Queued', message: 'Task initialized. Dispatched forensic agents.', type: 'log' }]);
    } catch (error) {
      console.error('Error:', error);
      setIsAnalyzing(false);
      alert('Failed to initiate scan. Is the backend running?');
    }
  };

  // RENDER: SELECTION STATE (DRAG & DROP)
  if (!selectedFile) {
    return (
      <div className="p-8 h-[calc(100vh-8rem)] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-2">V-AUTH Deepfake Forensic Scan</h1>
            <p className="text-slate-500 font-medium">Upload media for AI spectral & spatial analysis.</p>
          </div>
          
          <div 
            className={`relative border-2 border-dashed rounded-[2rem] p-16 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group overflow-hidden ${
              isDragOver 
                ? 'border-primary-container bg-primary-container/5 shadow-[0_0_30px_rgba(0,107,133,0.15)] scale-[1.02]' 
                : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/*,video/*"
            />
            
             {isDownloading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Bridging remote media...</p>
              </div>
            )}
            
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
              isDragOver ? 'bg-primary-container text-white scale-110' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 shadow-sm'
            }`}>
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isDragOver ? 'file_download' : 'cloud_upload'}
              </span>
            </div>
            
            <h3 className={`text-xl font-bold mb-2 transition-colors ${isDragOver ? 'text-primary' : 'text-slate-900'}`}>
              {isDragOver ? 'Drop media to scan' : 'Drag & drop media here'}
            </h3>
            <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm">
              or click to browse your encrypted file system
            </p>
            
            <div className="flex gap-4 opacity-70">
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_display</span> Video
              </span>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>image</span> Image
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER: ACTIVE ANALYSIS STATE
  return (
    <div className="p-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={handleReset} className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-colors text-slate-500 hover:text-slate-900 active:scale-95">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>close</span>
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cancel & Reset Scan</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-4">
        <div className="min-w-0">
          <nav className="flex gap-2 text-xs font-medium text-slate-400 mb-2">
            <span>Forensics</span>
            <span>/</span>
            <span className="text-slate-900">Active Analysis</span>
          </nav>
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight truncate">{selectedFile.name}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
             Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Format: {selectedFile.type}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {!isAnalyzing && !analysisResult && (
            <button 
              onClick={handleDetect}
              className="px-6 py-2 bg-primary-container text-white rounded-full text-xs font-bold tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              INITIATE SCAN
            </button>
          )}
          {isAnalyzing && (
            <span className="px-4 py-2 bg-tertiary-container text-tertiary-fixed rounded-full text-xs font-bold tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
              ANALYZING NEURAL LAYERS...
            </span>
          )}
          {analysisResult && (
             <button 
                onClick={handleReset}
                className="px-6 py-2 bg-slate-950 text-white rounded-full text-xs font-bold tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                NEW SCAN
              </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl group flex items-center justify-center ring-1 ring-white/10">
            {previewUrl && (
              selectedFile.type.startsWith('video') ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <img alt="Analysis Preview" className="w-full h-full object-contain" src={previewUrl} />
              )
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
                <div className="w-64 space-y-4">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-white text-center tracking-widest opacity-80 animate-pulse">EXTRACTING SPECTRAL FINGERPRINTS</p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_49%,rgba(111,251,190,0.1)_50%,rgba(0,0,0,0)_51%)] bg-[length:100%_4px] opacity-10"></div>
            </div>
          </div>

          {analysisResult && (
            <div className="p-5 rounded-2xl border bg-white shadow-lg animate-in slide-in-from-bottom-3 duration-500">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-lg font-black uppercase tracking-wider ${
                  analysisResult.prediction?.toLowerCase().includes('fake')
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}>
                  <span className="material-symbols-outlined text-lg align-text-bottom mr-1.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {analysisResult.prediction?.toLowerCase().includes('fake')
                      ? 'dangerous'
                      : 'verified_user'}
                  </span>
                  {analysisResult.prediction?.toLowerCase().includes('fake')
                    ? 'FAKE'
                    : 'REAL'}
                </span>
                <span className="font-mono text-xl font-black tracking-tighter text-slate-900">
                  {(analysisResult.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    analysisResult.prediction?.toLowerCase().includes('fake')
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.round(analysisResult.confidence * 100)}%` }}
                />
              </div>
            </div>
          )}
          
        </div>
        
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-white/60 backdrop-blur-2xl rounded-3xl p-6 h-[calc(107vh-14rem)] flex flex-col border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="font-manrope font-black text-slate-900 flex items-center gap-3 text-sm tracking-tight">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
                </div>
                DETECTION_STREAM
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {isAnalyzing && logs.length === 0 && (
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-slate-50 border border-slate-100 rounded-lg"></div>
                  <div className="h-24 bg-slate-50 border border-slate-100 rounded-lg"></div>
                </div>
              )}

              {logs.map((log, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-2 text-[11px] font-medium leading-relaxed animate-in slide-in-from-left-2 duration-300 ${
                  log.type === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                  log.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                  'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black uppercase tracking-tighter opacity-50">{log.status}</span>
                    <span className="text-[9px] opacity-40">Just now</span>
                  </div>
                  {log.message}
                </div>
              ))}

              {analysisResult && (
                <>
                  {/* ── Verdict card with confidence bar ── */}
                  <div className={`p-5 rounded-2xl border border-white shadow-xl animate-in zoom-in-95 duration-500 ${
                      analysisResult.prediction?.toLowerCase().includes('fake')
                        ? 'bg-gradient-to-br from-red-50 to-rose-50/30'
                        : 'bg-gradient-to-br from-emerald-50 to-teal-50/30'
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[20px] ${
                            analysisResult.prediction?.toLowerCase().includes('fake') ? 'text-red-600' : 'text-emerald-600'
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {analysisResult.prediction?.toLowerCase().includes('fake') ? 'dangerous' : 'verified_user'}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            analysisResult.prediction?.toLowerCase().includes('fake')
                              ? 'text-red-700'
                              : 'text-emerald-700'
                          }`}>
                            FORENSIC_VERDICT
                          </span>
                        </div>
                        <span className="font-mono text-xs font-black opacity-40">
                          LOG_ID: {taskId?.slice(0, 8)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 leading-relaxed font-medium mb-4 bg-white/40 p-4 rounded-xl border border-white/60">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-900/5">
                          <span className="font-black text-slate-900 uppercase tracking-tight">VERDICT</span>
                          <span className="text-slate-300">|</span>
                          <span className="font-bold text-slate-500 uppercase tracking-tight">FORENSIC REPORT</span>
                        </div>
                        {analysisResult.explanation.replace(/\*\*/g, '')}
                      </div>

                      <div className="flex items-center justify-between gap-4">
                         <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                analysisResult.prediction?.toLowerCase().includes('fake') ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.round(analysisResult.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm font-black text-slate-900">
                             {(analysisResult.confidence * 100).toFixed(1)}%
                          </span>
                      </div>
                    </div>


                </>
              )}

              {!isAnalyzing && !analysisResult && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                   <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                      <span className="material-symbols-outlined text-3xl text-slate-300">visibility_lock</span>
                   </div>
                  <p className="text-[10px] font-black tracking-[0.3em] text-center text-slate-400">AWAITING_INPUT_STREAM</p>
                </div>
              )}
            </div>
            

          </div>
        </div>
      </div>
      
      {/* FORENSIC PARAMETER GRID */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { key: 'diffusion_score',    label: 'DIFFUSION',      icon: 'magic_button', weight: 'ML_CORE' },
          { key: 'manipulation_score', label: 'GEOMETRY',       icon: 'masks',        weight: 'CV_NODE' },
          { key: 'fourier_spectral',   label: 'FFT_SCAN',       icon: 'graphic_eq',   weight: 'SPECTRAL' },
          { key: 'ela_score',          label: 'ELA_MAP',        icon: 'layers',       weight: 'JPEG_FS' },
          { key: 'texture_score',      label: 'LBP_TEX',        icon: 'texture',      weight: 'TEXTURE' },
          { key: 'noise_score',        label: 'SRM_NOISE',      icon: 'grain',        weight: 'NOISE_FS' },
          { key: 'geometric_alignment',label: 'ALIGNMENT',      icon: 'face',         weight: 'BIOMETRIC' },
          { key: 'wavelet_sig',        label: 'WAVELET',        icon: 'waves',        weight: 'DWT_CORE' },
        ].map(({ key, label, icon, weight }) => {
          const val = analysisResult?.breakdown?.[key];
          const pct = val !== undefined ? Math.round(val * 100) : null;
          const isFake = pct !== null && pct >= 40;
          return (
            <div key={key} className="bg-slate-900/5 backdrop-blur-md p-4 rounded-[2rem] space-y-4 border border-white/40 transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1 duration-500">
              <div className="flex justify-between items-center">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors duration-500 ${isFake ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg tracking-[0.1em]">{weight}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <h4 className="font-manrope font-black text-slate-900 text-[10px] uppercase tracking-[0.1em] mb-1">{label}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`font-mono text-2xl font-black tracking-tighter ${pct !== null ? (isFake ? 'text-red-500' : 'text-emerald-500') : 'text-slate-200'}`}>
                      {pct !== null ? `${pct}%` : '--'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ANOMALY</span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isFake ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : 'bg-emerald-500'}`}
                    style={{ width: pct !== null ? `${pct}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Engine;
