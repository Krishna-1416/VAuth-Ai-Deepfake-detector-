import React from 'react';

const Logo = ({ className = "w-10 h-10", glowColor = "#00FF88", white = false }) => {
  const color = white ? "#FFFFFF" : "#001453";
  
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feFlood floodColor={glowColor} floodOpacity="0.8" result="glowColor" />
          <feComposite in="glowColor" in2="blur" operator="in" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Split Shield Design */}
      <path 
        d="M45 15L18 27V50C18 68 29 85 45 91" 
        stroke={color} 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M55 15L82 27V50C82 68 71 85 55 91" 
        stroke={color} 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Signature Glow Dot */}
      <circle 
        cx="72" 
        cy="32" 
        r="10" 
        fill={glowColor} 
        filter="url(#logo-glow)" 
      />
    </svg>
  );
};

export default Logo;
