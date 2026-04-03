import React from 'react';

const About = () => {
  return (
    <div className="container glass-panel">
      <header>
        <h1 className="title">ABOUT US</h1>
        <p className="subtitle">Ignition Hackverse Implementation</p>
      </header>
      
      <div className="hero-content" style={{ textAlign: 'left' }}>
        <p>
          <strong>V-AUTH</strong> was developed rapidly as part of the <em>Ignition Hackverse</em> to address 
          the escalating crisis of artificial and synthetic media manipulation in our digital ecosystem. 
        </p>
        <p>
          By leveraging sub-pixel anomaly detection, lighting consistency evaluation algorithms, and 
          metadata footprint tracing, V-AUTH aims to provide a reliable, rapid verdict on any uploaded 
          video or image asset within seconds.
        </p>
        <div style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-secondary)'}}>
            <p>Version: 2.1.0-alpha</p>
            <p>Built exclusively for Hackverse 2026</p>
        </div>
      </div>
    </div>
  );
};

export default About;
