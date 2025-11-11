import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="amplifyGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#10b981' }} />
        <stop offset="100%" style={{ stopColor: '#4f46e5' }} />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g fill="url(#amplifyGradient)">
      {/* Hexagon Arrow */}
      <path d="M 50 55 l -10 5.77 v -11.54 l 10 -5.77 l 10 5.77 v 11.54 z" />
      <path d="M 50 45 l -10 5.77 v -11.54 l 10 -5.77 l 10 5.77 v 11.54 z" opacity="0.8" />
      <path d="M 50 35 l -10 5.77 v -11.54 l 10 -5.77 l 10 5.77 v 11.54 z" opacity="0.6" />
    </g>
    
    {/* Brain Icon */}
    <g transform="translate(38, 5)" filter="url(#glow)">
      <path d="M12 2a10 10 0 0 0-3.53 19.47c.79-1 .8-2.2-.3-3.47a6.5 6.5 0 0 1-1.17-5.47 6.5 6.5 0 0 1 6-6.47 6.5 6.5 0 0 1 6.5 6.5c0 1.9-1.2 4.2-2.3 5.47a4.5 4.5 0 0 0-.2 6.47A10 10 0 0 0 12 2Z" fill="#4f46e5" />
    </g>
    
    {/* 'G' in Brain */}
    <path d="M51 19.5 A 3.5 3.5 0 0 1 47.5 23 A 3.5 3.5 0 0 1 44 19.5 A 3.5 3.5 0 0 1 49 17.5 L 49 18.5 L 47 18.5" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.7" />

    {/* Text Elements */}
    <text x="50" y="85" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="url(#amplifyGradient)" textAnchor="middle">
      Amplify
    </text>
    <text x="50" y="100" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle">
      AI
    </text>
    <text x="50" y="112" fontFamily="sans-serif" fontSize="5" fill="#9CA3AF" textAnchor="middle">
      Powered by Google AI Code Assistant
    </text>
  </svg>
);