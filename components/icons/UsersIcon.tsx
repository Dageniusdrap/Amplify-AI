import React from 'react';

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962c.57-1.023.99-2.13.99-3.232 0-1.42-.31-2.734-.834-3.957m-2.512 7.653A3.75 3.75 0 0 1 8.25 19.5m-2.512-7.653.012-.012a3.75 3.75 0 0 1 3.728 0m-3.74 0-1.483-2.135A3.75 3.75 0 0 0 1.5 9.75v.001c0 .983.356 1.87.96 2.598m-1.2-5.042A9.022 9.022 0 0 1 7.5 4.5m8.25-3.75a9.022 9.022 0 0 0-8.25 3.75M3 15.75a9.022 9.022 0 0 0 8.25 3.75m8.25-3.75a9.022 9.022 0 0 1-8.25 3.75M3 15.75a9.022 9.022 0 0 1 8.25-3.75m-8.25 3.75a9.022 9.022 0 0 0 8.25-3.75" 
        />
    </svg>
);