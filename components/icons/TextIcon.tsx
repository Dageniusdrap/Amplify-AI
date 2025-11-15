import React from 'react';

export const TextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
            d="M7.5 3v18M3 3h9M16.5 3h4.5M16.5 10.5h4.5M16.5 18h4.5M12 21V3" 
        />
    </svg>
);