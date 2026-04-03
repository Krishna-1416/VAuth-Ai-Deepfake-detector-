import React, { useState, useRef, useEffect } from 'react';

const Engine = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Simulate progress steps
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
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
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

  return (
    <div className="p-8">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="image/*,video/*"
      />

      <div className="flex justify-between items-end mb-8">
        <div>
          <nav className="flex gap-2 text-xs font-medium text-slate-400 mb-2">
            <span>Analysis</span>
            <span>/</span>
            <span className="text-slate-900">Active Scan</span>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {selectedFile ? selectedFile.name : "Select Media for Analysis"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {selectedFile 
              ? `Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Format: ${selectedFile.type}`
              : "Sentinel Core Engine ready for input"}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current.click()}
            className="px-6 py-2 bg-slate-950 text-white rounded-full text-xs font-bold tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            UPLOAD SOURCE
          </button>
          {selectedFile && !isAnalyzing && !analysisResult && (
            <button 
              onClick={handleDetect}
              className="px-6 py-2 bg-primary-container text-white rounded-full text-xs font-bold tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 underline-offset-4"
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
              INITIATE SCAN
            </button>
          )}
          {isAnalyzing && (
            <span className="px-4 py-2 bg-tertiary-container text-tertiary-fixed rounded-full text-xs font-bold tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
              ANALYZING...
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl group flex items-center justify-center">
            {previewUrl ? (
              selectedFile.type.startsWith('video') ? (
                <video src={previewUrl} className="w-full h-full object-contain" controls />
              ) : (
                <img alt="Analysis Preview" className="w-full h-full object-contain" src={previewUrl} />
              )
            ) : (
              <div className="text-slate-600 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-6xl">cloud_upload</span>
                <p className="font-manrope font-bold tracking-widest text-xs">NO SOURCE LOADED</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_49%,rgba(111,251,190,0.1)_50%,rgba(0,0,0,0)_51%)] bg-[length:100%_4px] opacity-20"></div>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-xl p-8 flex items-center gap-12">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-manrope font-bold text-slate-900 uppercase tracking-widest text-xs">
                  {isAnalyzing ? "Scanning Neural Layers..." : analysisResult ? "Scan Report Ready" : "System Standby"}
                </h3>
                <span className="text-xs font-bold text-primary-container">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden p-0.5">
                <div className="h-full bg-primary-container rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 border-l border-surface-container-high pl-12">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
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
          <div className="bg-surface-container-lowest rounded-xl p-6 h-[calc(100%-88px)] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-high">
              <h2 className="font-manrope font-extrabold text-slate-950 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">analytics</span>
                Detection Stream
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Live Results</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {isAnalyzing && (
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-slate-100 rounded-lg"></div>
                  <div className="h-20 bg-slate-100 rounded-lg"></div>
                </div>
              )}

              {analysisResult && (
                <>
                  <div className={`p-4 bg-surface-container-low rounded-lg border-l-4 ${analysisResult.prediction === 'Fake' ? 'border-error' : 'border-tertiary-fixed'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        analysisResult.prediction === 'Fake' 
                        ? 'text-error bg-error-container' 
                        : 'text-on-tertiary-container bg-tertiary-fixed'
                      }`}>
                        {analysisResult.prediction.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">DECISION</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      Detection Result: {analysisResult.prediction}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {analysisResult.explanation}
                    </p>
                  </div>

                  <div className="p-4 bg-surface-container-low rounded-lg border-l-4 border-primary-container">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-white bg-primary-container px-1.5 py-0.5 rounded">SENTINEL_CORE</span>
                      <span className="text-[10px] font-mono text-slate-400">METRICS</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Combined Neural Score</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Deep analysis shows a {(analysisResult.confidence * 100).toFixed(2)}% probability. 
                      Weights: Spectral Analysis (60%), Spatial Analysis (40%).
                    </p>
                  </div>
                </>
              )}

              {!isAnalyzing && !analysisResult && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                  <span className="material-symbols-outlined text-4xl mb-2">history</span>
                  <p className="text-[10px] font-bold tracking-widest">AWAITING SOURCE</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-surface-container-high">
              <button disabled={!analysisResult} className="w-full py-3 bg-surface-container-highest text-on-surface font-manrope font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-30">
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
            Spatial Accuracy
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Subject Consistency</span>
              <span className="font-semibold text-slate-900">{analysisResult ? "Calculated" : "--"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Lighting Invariants</span>
              <span className={`font-semibold ${analysisResult ? 'text-slate-900' : 'text-slate-400'}`}>
                {analysisResult ? (analysisResult.prediction === 'Fake' ? 'Anomalous' : 'Nominal') : "--"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">memory</span>
            Spectral Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Fourier Residuals</span>
              <span className="font-semibold text-slate-900">{analysisResult ? "Analyzed" : "--"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Fingerprint Match</span>
              <span className={`font-semibold ${analysisResult ? 'text-slate-900' : 'text-slate-400'}`}>
                 {analysisResult ? (analysisResult.prediction === 'Fake' ? 'Detected' : 'Clear') : "--"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl space-y-4">
          <h4 className="font-manrope font-bold text-slate-950 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">security</span>
            Global Trust Score
          </h4>
          <div className="space-y-3">
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-1000 ${analysisResult?.prediction === 'Fake' ? 'bg-error' : 'bg-tertiary-fixed'}`} 
                    style={{ width: analysisResult ? `${analysisResult.confidence * 100}%` : '0%' }}></div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 text-center">
              CERTIFIED BY SENTINEL_CORE V1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Engine;
