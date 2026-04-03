import React, { useState, useRef, useEffect } from 'react';

const Engine = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Simulate progress steps for a better UX during analysis
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + (Math.random() * 10) : prev));
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
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

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setProgress(0);
    setIsAnalyzing(false);
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Backend connection failed');

      const data = await response.json();
      setAnalysisResult(data);
      setProgress(100);
    } catch (error) {
      console.error('Error:', error);
      setAnalysisResult({
        prediction: 'Error',
        confidence: 0,
        explanation: 'Failed to connect to Sentinel Core backend.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // RENDER: SELECTION STATE (DRAG & DROP)
  if (!selectedFile) {
    return (
      <div className="p-8 h-[calc(100vh-8rem)] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/50">
              <span className="material-symbols-outlined text-3xl text-slate-600" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-2">Sentinel Deepfake Forensic Scan</h1>
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
              accept="image/*,video/*,audio/*"
            />
            
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
                <span className="material-symbols-outlined text-[14px]">smart_display</span> Video
              </span>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]">image</span> Image
              </span>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-widest flex items-center gap-1.5 border border-slate-200">
                <span className="material-symbols-outlined text-[14px]">graphic_eq</span> Audio
              </span>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
            <span className="material-symbols-outlined text-sm">lock</span>
            Sentinel Core v1.0 • Secure Local Detection active
          </div>
        </div>
      </div>
    );
  }

  // RENDER: ACTIVE ANALYSIS STATE
  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={handleReset} className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-colors text-slate-500 hover:text-slate-900 active:scale-95">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cancel & Reset Scan</span>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <nav className="flex gap-2 text-xs font-medium text-slate-400 mb-2">
            <span>Forensics</span>
            <span>/</span>
            <span className="text-slate-900">Active Analysis</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight">{selectedFile.name}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
             Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Format: {selectedFile.type}
          </p>
        </div>
        <div className="flex gap-3">
          {!isAnalyzing && !analysisResult && (
            <button 
              onClick={handleDetect}
              className="px-6 py-2 bg-primary-container text-white rounded-full text-xs font-bold tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
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

      <div className="grid grid-cols-12 gap-8">
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
          
          <div className="bg-surface-container-lowest rounded-xl p-8 flex items-center gap-12 border border-surface-container-high shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-manrope font-bold text-slate-900 uppercase tracking-widest text-xs">
                  {isAnalyzing ? "Processing neural layers 3/4" : analysisResult ? "Scan Report Ready" : "System Standby"}
                </h3>
                <span className="text-xs font-bold text-primary-container">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-primary-container rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-l border-surface-container-high pl-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">State</p>
                <p className="text-2xl font-extrabold text-slate-950">
                  {isAnalyzing ? "Active" : analysisResult ? "Done" : "Idle"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Confidence</p>
                <p className={`text-2xl font-extrabold ${analysisResult?.prediction === 'Fake' ? 'text-error' : 'text-tertiary-fixed'}`}>
                  {analysisResult ? `${(analysisResult.confidence * 100).toFixed(1)}%` : "--"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 h-[calc(100%-88px)] flex flex-col border border-surface-container-high shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-high">
              <h2 className="font-manrope font-extrabold text-slate-950 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">analytics</span>
                Detection Stream
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Output</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {isAnalyzing && (
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-slate-50 border border-slate-100 rounded-lg"></div>
                  <div className="h-24 bg-slate-50 border border-slate-100 rounded-lg"></div>
                </div>
              )}

              {analysisResult && (
                <>
                  <div className={`p-4 bg-surface-container-low rounded-lg border-l-4 shadow-sm ${analysisResult.prediction === 'Fake' ? 'border-error' : 'border-tertiary-fixed'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        analysisResult.prediction === 'Fake' 
                        ? 'text-error bg-error-container/50' 
                        : 'text-on-tertiary-container bg-tertiary-fixed/50'
                      }`}>
                        {analysisResult.prediction.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">JUDGMENT</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      Classification: {analysisResult.prediction}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                      {analysisResult.explanation}
                    </p>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-primary-container shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-white bg-primary-container px-1.5 py-0.5 rounded">FORENSIC_TAG</span>
                      <span className="text-[10px] font-mono text-slate-400">DETAIL</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Neural Synthesis Residuals</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
                      Analysis complete. Hybrid Trust Score: {(analysisResult.confidence * 100).toFixed(2)}%. 
                      Spectral Analysis (60%) combined with Spatial Xception features (40%).
                    </p>
                  </div>
                </>
              )}

              {!isAnalyzing && !analysisResult && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 py-12">
                  <span className="material-symbols-outlined text-5xl mb-3">mystery</span>
                  <p className="text-[10px] font-bold tracking-[0.2em] text-center">AWAITING NEURAL<br/>INITIATION</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-surface-container-high">
              <button disabled={!analysisResult} className="w-full py-3 bg-slate-900 text-white font-manrope font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-20 shadow-lg">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                Export Forensic Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4 border border-surface-container-high">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">camera</span>
            Spatial Accuracy
          </h4>
          <div className="space-y-3">
             <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Lighting Invariants</span>
              <span className={`font-semibold ${analysisResult ? (analysisResult.prediction === 'Fake' ? 'text-error' : 'text-tertiary-fixed') : 'text-slate-400'}`}>
                {analysisResult ? (analysisResult.prediction === 'Fake' ? 'Anomalous' : 'Nominal') : "--"}
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: analysisResult ? '75%' : '0%' }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4 border border-surface-container-high">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">memory</span>
            Spectral Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Fourier Residuals</span>
              <span className={`font-semibold ${analysisResult ? (analysisResult.prediction === 'Fake' ? 'text-error' : 'text-primary-container') : 'text-slate-400'}`}>
                 {analysisResult ? (analysisResult.prediction === 'Fake' ? 'High Cluster' : 'Baseline') : "--"}
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-400" style={{ width: analysisResult ? '92%' : '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4 border border-surface-container-high ring-1 ring-primary-container/10">
          <h2 className="font-manrope font-bold text-slate-950 flex items-center gap-2 uppercase text-xs tracking-widest">
            <span className="material-symbols-outlined text-primary-container">verified_user</span>
            System Trust Score
          </h2>
          <div className="space-y-3">
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden shadow-inner">
               <div className={`h-full transition-all duration-1000 ${analysisResult?.prediction === 'Fake' ? 'bg-error' : 'bg-primary-container'}`} 
                    style={{ width: analysisResult ? `${analysisResult.confidence * 100}%` : '0%' }}></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center tracking-[0.3em] font-mono">
              SENTINEL CORE v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Engine;
