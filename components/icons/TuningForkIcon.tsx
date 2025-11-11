import React from 'react';

export const TuningForkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
            d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5m-7.5 0-1.125 1.125a1.5 1.5 0 0 0 0 2.121l1.125 1.125m7.5-4.371-1.125 1.125a1.5 1.5 0 0 1 0 2.121l1.125 1.125M12 21v-8.25M12 12.75h-1.5M13.5 12.75H12" 
        />
    </svg>
);