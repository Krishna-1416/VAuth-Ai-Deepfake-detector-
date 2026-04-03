import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container glass-panel">
      <header>
        <h1 className="title">V-AUTH PROTOCOL</h1>
        <p className="subtitle">Identify Truth in a Synthetic World</p>
      </header>
      
      <div className="hero-content">
        <p>
          V-AUTH represents the next evolution in generative media analysis. Deploying state-of-the-art 
          biometric spatial tracking and deep algorithmic heuristics to definitively separate authentic media from deepfakes.
        </p>
        <div className="action-buttons" style={{ marginTop: '48px' }}>
            <Link to="/engine" className="btn btn-primary" style={{ flex: 1 }}>Launch Detection Engine</Link>
            <Link to="/about" className="btn btn-secondary" style={{ flex: 1 }}>Read the Whitepaper</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
