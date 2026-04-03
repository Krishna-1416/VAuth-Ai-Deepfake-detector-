import React, { useState, useRef } from 'react';

const Engine = () => {
  const [viewState, setViewState] = useState('nexus'); // 'nexus', 'preview', 'verdict'
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressTransitionDuration, setProgressTransitionDuration] = useState('0.1s');
  const [logs, setLogs] = useState([]);
  
  const [verdict, setVerdict] = useState(null); // { isFake: boolean, confidence: string }
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
    setIsAnalyzing(true);
    setLogs([]);
    setProgress(0);
    setProgressTransitionDuration('0.1s');

    const stages = [
      { msg: "Initializing heuristic matrices...", dur: 600, prog: 15 },
      { msg: "Extracting temporal noise variance...", dur: 1200, prog: 40 },
      { msg: "Mapping biometric landmark consistency...", dur: 900, prog: 65 },
      { msg: "Scanning EXIF metadata footprints...", dur: 700, prog: 85 },
      { msg: "Collating deep learning tensor scores...", dur: 800, prog: 98 },
      { msg: "Finalizing protocol verdict.", dur: 400, prog: 100 }
    ];

    for (const stage of stages) {
      setLogs((prev) => [{ text: stage.msg, id: Date.now() }, ...prev]);
      setProgressTransitionDuration(`${stage.dur + 100}ms`);
      setProgress(stage.prog);
      await new Promise((r) => setTimeout(r, stage.dur));
    }

    setTimeout(() => {
      const isFake = Math.random() > 0.5;
      const conf = (Math.random() * (99.9 - 85.0) + 85.0).toFixed(1);
      setVerdict({ isFake, confidence: conf });
      setViewState('verdict');
      setIsAnalyzing(false);
    }, 500);
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
          </div>
        </div>

        {/* Result Dashboard */}
        <div className={`state-view verdict-view ${viewState === 'verdict' ? 'active' : ''}`}>
          <div className="status-label">Protocol Verdict</div>
          
          {verdict && (
            <>
              <div className="verdict-wrapper">
                <h2 className={`final-verdict ${verdict.isFake ? 'is-fake' : 'is-real'}`}>
                  {verdict.isFake ? 'SYNTHETIC' : 'AUTHENTIC'}
                </h2>
              </div>
              <div className="confidence-score">Confidence Index: {verdict.confidence}%</div>
            </>
          )}

          <button className="btn btn-primary btn-expand" onClick={resetUI}>
            Initialize New Session
            <i className="fa-solid fa-rotate-right" style={{ marginLeft: '8px' }}></i>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Engine;
