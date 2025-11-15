import React from 'react';

export const SoundBarsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        {...props}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        strokeWidth="1.5" 
        stroke="currentColor"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M3 10.5v3m3-6v9m3-12v15m3-18v21m3-18v15m3-12v9m3-6v3" 
        />
    </svg>
);