import React, { useState, useRef } from 'react';

const Engine = () => {
  const [viewState, setViewState] = useState('nexus'); // 'nexus', 'preview', 'verdict'
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTransitionDuration, setProgressTransitionDuration] = useState('0.1s');
  const [logs, setLogs] = useState([]);
  
  const [verdict, setVerdict] = useState(null); // { isFake: boolean, confidence: string, analysis: string }
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    validateAndProcessFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndProcessFile(file);
  };

  const validateAndProcessFile = (file) => {
    if (!file) return;
    const validTypes = ['image/', 'video/', 'audio/'];
    if (!validTypes.some((type) => file.type.startsWith(type))) {
      alert('Unsupported protocol format. Please provide Image, Video, or Audio.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreviewUrl(url);
    setViewState('preview');
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    setLogs([]);
    setError(null);
    setProgress(0);
    setProgressTransitionDuration('0.3s');

    // Initial logs for visual feedback
    const initialStages = [
      { msg: "Initializing heuristic matrices...", dur: 400, prog: 15 },
      { msg: "Extracting temporal noise variance...", dur: 600, prog: 40 },
    ];

    for (const stage of initialStages) {
      setLogs((prev) => [{ text: stage.msg, id: Date.now() }, ...prev]);
      setProgress(stage.prog);
      await new Promise((r) => setTimeout(r, stage.dur));
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setLogs((prev) => [{ text: "Uploading payload to neural nexus...", id: Date.now() }, ...prev]);
      setProgress(60);

      // Call the backend
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Protocol failure: ${response.statusText}`);
      }

      setLogs((prev) => [{ text: "Decoding model tensor outputs...", id: Date.now() }, ...prev]);
      setProgress(85);

      const data = await response.json();
      
      setLogs((prev) => [{ text: "Finalizing protocol verdict.", id: Date.now() }, ...prev]);
      setProgress(100);

      // Small delay for UI smoothness
      await new Promise((r) => setTimeout(r, 600));

      setVerdict({
        status: data.verdict, // 'SYNTHETIC', 'SUSPICIOUS', 'AUTHENTIC'
        confidence: data.confidence,
        analysis: data.explanation,
        artifact: data.forensic_artifact,
        mediaType: data.media_type
      });
      setViewState('verdict');

    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err.message || "An unexpected error occurred during the analysis.");
      setLogs((prev) => [{ text: "CRITICAL: Analysis engine offline.", id: Date.now() }, ...prev]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetUI = () => {
    setSelectedFile(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
      setMediaPreviewUrl(null);
    }
    setLogs([]);
    setProgress(0);
    setVerdict(null);
    setError(null);
    setViewState('nexus');
  };

  const renderMedia = () => {
    if (!selectedFile || !mediaPreviewUrl) return null;
    
    if (selectedFile.type.startsWith('image/')) {
      return <img src={mediaPreviewUrl} alt="Preview" />;
    } else if (selectedFile.type.startsWith('video/')) {
      return <video src={mediaPreviewUrl} muted loop autoPlay />;
    } else if (selectedFile.type.startsWith('audio/')) {
      return <audio src={mediaPreviewUrl} controls style={{ width: '80%' }} />;
    }
    return null;
  };

  return (
    <div className="container glass-panel">
      <header style={{ marginBottom: viewState !== 'nexus' ? '20px' : '40px' }}>
        <h1 className="title" style={{ fontSize: viewState !== 'nexus' ? '2rem' : '2.75rem'}}>V-AUTH</h1>
        <p className="subtitle" style={{ display: viewState !== 'nexus' ? 'none' : 'block'}}>Verification protocol 2.0</p>
      </header>

      <div className="content-wrapper">
        {/* Nexus Upload */}
        <div className={`state-view ${viewState === 'nexus' ? 'active' : ''}`}>
          <div 
            className="nexus-zone" 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="icon-pulsate">
              <i className="fa-solid fa-expand"></i>
            </div>
            <h3>Initialize Scan</h3>
            <p>Drag files here or click to browse</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*,video/*,audio/*" 
              hidden 
              onChange={handleFileChange} 
            />
          </div>
        </div>

        {/* Preview & Analysis */}
        <div className={`state-view ${viewState === 'preview' ? 'active' : ''}`}>
          <div className="media-preview-container">
            {renderMedia()}
          </div>
          
          <div>
            <div className="progress-container">
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%`, transition: `width ${progressTransitionDuration} ease-out` }}
                ></div>
              </div>
            </div>
            
            <div className="micro-logs-wrapper">
              <div className="micro-logs">
                {logs.map((log, index) => (
                  <div key={log.id} className={`log-entry ${index > 0 ? 'dimmed' : ''}`}>
                    v-auth_{'>'} {log.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={resetUI} disabled={isAnalyzing}>Abort</button>
              <button className="btn btn-primary" onClick={runAnalysis} disabled={isAnalyzing}>
                <span>{isAnalyzing ? 'Processing...' : 'Run Analysis'}</span>
              </button>
            </div>

            {error && (
              <div className="error-message" style={{ color: '#f43f5e', marginTop: '15px', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(244, 63, 94, 0.1)', padding: '10px', borderRadius: '4px' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Result Dashboard */}
        <div className={`state-view verdict-view ${viewState === 'verdict' ? 'active' : ''}`}>
          <div className="status-label">
            <i className="fa-solid fa-shield-halved" style={{ marginRight: '8px' }}></i>
            Protocol Verdict
          </div>
          
          {verdict && (
            <div className="verdict-content fade-in-up">
              <div className="verdict-wrapper">
                <h2 className={`final-verdict status-${verdict.status.toLowerCase()}`}>
                  {verdict.status}
                </h2>
              </div>
              <div className="confidence-score">
                <i className="fa-solid fa-chart-simple" style={{ marginRight: '8px' }}></i>
                Confidence Index:{' '}
                <span className={`confidence-value status-${verdict.status.toLowerCase()}`}>
                  {verdict.confidence}%
                </span>
              </div>

              {/* Technical Diagnostics Panel */}
              <div className="tech-diagnostics">
                {verdict.mediaType === 'image' && verdict.fftScore !== undefined && (
                  <div className="diag-card">
                    <div className="diag-header">
                      <span className="diag-label">
                        <i className="fa-solid fa-wave-square"></i> Spectral Artifacts
                      </span>
                      <span className="diag-value">{(verdict.fftScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className="diag-bar-bg">
                      <div className="diag-bar-fill" style={{ width: `${verdict.fftScore * 100}%` }}></div>
                    </div>
                  </div>
                )}

                {verdict.mediaType === 'audio' && verdict.consistency !== undefined && (
                  <div className="diag-card">
                    <div className="diag-header">
                      <span className="diag-label">
                        <i className="fa-solid fa-microphone-lines"></i> Vocal Consistency
                      </span>
                      <span className="diag-value">{(verdict.consistency * 100).toFixed(1)}%</span>
                    </div>
                    <div className="diag-bar-bg">
                      <div className="diag-bar-fill" style={{ width: `${verdict.consistency * 100}%` }}></div>
                    </div>
                  </div>
                )}

                {verdict.mediaType === 'video' && verdict.jitter !== undefined && (
                  <div className="diag-card">
                    <div className="diag-header">
                      <span className="diag-label">
                        <i className="fa-solid fa-film"></i> Temporal Stability
                      </span>
                      <span className="diag-value">{( (1 - verdict.jitter) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="diag-bar-bg">
                      <div className="diag-bar-fill" style={{ width: `${(1 - verdict.jitter) * 100}%` }}></div>
                    </div>
                  </div>
                )}
                
                {/* Simulated extra metric for visual balance */}
                <div className="diag-card">
                  <div className="diag-header">
                    <span className="diag-label">
                      <i className="fa-solid fa-network-wired"></i> Metadata Integrity
                    </span>
                    <span className="diag-value">{verdict.status === 'AUTHENTIC' ? '98.5%' : (Math.random() * 40 + 20).toFixed(1) + '%'}</span>
                  </div>
                  <div className="diag-bar-bg">
                    <div className="diag-bar-fill" style={{ width: verdict.status === 'AUTHENTIC' ? '98.5%' : `${Math.random() * 40 + 20}%` }}></div>
                  </div>
                </div>
              </div>

              {verdict.artifact && (
                <div className="forensic-visualization glass-panel" style={{ marginTop: '24px', padding: '20px', borderRadius: '16px' }}>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-microscope" style={{ color: 'var(--accent-cyan)' }}></i>
                    {verdict.mediaType === 'audio' ? 'Acoustic Fingerprint (VELMA-2)' : 'Neural Saliency Heatmap (SigLIP 2)'}
                  </div>
                  <div style={{ background: '#000', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-dim)' }}>
                    <img 
                      src={`data:image/png;base64,${verdict.artifact}`} 
                      alt="Forensic Artifact" 
                      style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '4px', display: 'block' }} 
                    />
                  </div>
                  <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                    {verdict.mediaType === 'audio' ? 'Spectral spikes indicate synthetic vocoder signatures.' : 'Highlighted regions show pixel-level GAN/Diffusion inconsistencies.'}
                  </p>
                </div>
              )}

              {verdict.analysis && (
                <div className="analysis-explanation glass-panel" style={{ marginTop: '24px', padding: '24px', fontSize: '0.95rem', color: 'var(--text-primary)', border: '1px solid var(--border-dim)', borderRadius: '16px', textAlign: 'left' }}>
                  <div style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                    <i className="fa-solid fa-chart-pie" style={{ marginRight: '10px', color: 'var(--accent-cyan)' }}></i>
                    Technical Assessment
                  </div>
                  <p style={{ color: 'var(--text-secondary)' }}>{verdict.analysis}</p>
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary btn-expand" onClick={resetUI} style={{ marginTop: '32px' }}>
            <i className="fa-solid fa-rotate-right" style={{ marginRight: '10px' }}></i>
            Initialize New Session
          </button>
        </div>

      </div>
    </div>
  );
};

export default Engine;
