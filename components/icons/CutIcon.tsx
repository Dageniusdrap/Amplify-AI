import React from 'react';

export const CutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
            d="M7.848 8.25l-2.355 2.355m0 0a3 3 0 1 0 4.243 4.243l2.355-2.355m-4.243-4.243L12 3.75l2.355 2.355m0 0a3 3 0 1 1 4.243 4.243l-2.355 2.355m-4.243-4.243-4.243 4.243" 
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 12a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
        />
    </svg>
);