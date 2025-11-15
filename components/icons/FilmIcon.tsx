import React from 'react';

export const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v18M3 3h3m12 0h3M3 21h3m12 0h3M3 6h18M3 18h18M9 6h6v12H9z" />
    </svg>
);