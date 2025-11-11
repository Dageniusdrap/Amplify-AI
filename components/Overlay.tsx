import React from 'react';

interface OverlayProps {
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

export const Overlay: React.FC<OverlayProps> = ({ children, onClose, className = '' }) => {
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className={className}>
                {children}
            </div>
        </div>
    );
};
