import React from 'react';

export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
            d="M4.098 11.902a3.75 3.75 0 0 0-2.25 3.39V19.5a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25v-4.208a3.75 3.75 0 0 0-2.25-3.39l-7.5-3.75-7.5 3.75Z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 8.25V19.5M8.25 12l-2.25-1.125M15.75 12l2.25-1.125M12 3.75a3.75 3.75 0 0 1 3.75 3.75v.375m-7.5 0V7.5A3.75 3.75 0 0 1 12 3.75Z" 
        />
    </svg>
);