import React from 'react';

export const PiggyBankIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
            d="M5.25 8.25h13.5m-13.5 7.5h13.5m-1.31-4.18-3.08-3.08a.75.75 0 0 0-1.06 0l-3.08 3.08a.75.75 0 0 0 0 1.06l3.08 3.08a.75.75 0 0 0 1.06 0l3.08-3.08a.75.75 0 0 0 0-1.06Z" 
        />
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3a9 9 0 0 0-18 0" 
        />
    </svg>
);