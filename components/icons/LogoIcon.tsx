import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="viral-arrow-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E11D48" /> {/* Rose */}
        <stop offset="50%" stopColor="#EC4899" /> {/* Pink */}
        <stop offset="100%" stopColor="#D946EF" /> {/* Fuchsia */}
      </linearGradient>
      <filter id="arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Icon */}
    <g transform="translate(30, 30)" style={{ filter: 'url(#arrow-glow)' }}>
      {/* Main Arrowhead Shape */}
      <path 
        d="M 0 -25 L 20 0 L 0 10 L -20 0 Z" 
        fill="url(#viral-arrow-gradient)" 
      />
      {/* Inner Chevrons */}
      <path 
        d="M 0 -15 L 12 -6 L 0 0 L -12 -6 Z" 
        fill="white" 
        opacity="0.6"
      />
      <path 
        d="M 0 -8 L 8 -2 L 0 2 L -8 -2 Z" 
        fill="white" 
        opacity="0.8"
      />
    </g>

    {/* Text */}
    <text x="65" y="35" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="currentColor" className="text-gray-800 dark:text-white">
      Creators Edge
      <tspan fontWeight="normal"> AI</tspan>
    </text>
  </svg>
);