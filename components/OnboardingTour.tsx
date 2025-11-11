import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';

export interface OnboardingStep {
    selector: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: OnboardingStep[];
    onFinish: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [isVisible, setIsVisible] = useState(false);
    const step = steps[currentStep];

    useEffect(() => {
        const calculatePositions = () => {
            const element = document.querySelector(step.selector) as HTMLElement;
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const PADDING = 8;

            // Set highlight box
            setHighlightStyle({
                width: `${rect.width + PADDING * 2}px`,
                height: `${rect.height + PADDING * 2}px`,
                top: `${rect.top - PADDING}px`,
                left: `${rect.left - PADDING}px`,
            });
            
            // Set tooltip position
            const tooltipPosition = { top: 0, left: 0 };
            const position = step.position || 'bottom';

            if (position === 'bottom') {
                tooltipPosition.top = rect.bottom + PADDING;
                tooltipPosition.left = rect.left + rect.width / 2;
            } else if (position === 'top') {
                tooltipPosition.top = rect.top - PADDING;
                tooltipPosition.left = rect.left + rect.width / 2;
            }
            
            // Add more position logic here if needed (left, right)

            setTooltipStyle(tooltipPosition);
            setIsVisible(true);
        };
        
        // Timeout to allow the UI to render before calculating positions
        const timer = setTimeout(calculatePositions, 100);

        window.addEventListener('resize', calculatePositions);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculatePositions);
        };
    }, [currentStep, step]);

    const handleNext = () => {
        setIsVisible(false);
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const handleSkip = () => {
        setIsVisible(false);
        onFinish();
    };

    const tooltipPositionClass = step.position === 'top' ? 'bottom-full -translate-x-1/2 mb-2' : 'top-full -translate-x-1/2 mt-2';
    
    return (
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ clipPath: `path('${`M0,0H${window.innerWidth}V${window.innerHeight}H0V0Z `}${`M${highlightStyle.left || 0},${highlightStyle.top || 0} h${highlightStyle.width || 0} v${highlightStyle.height || 0} h-${highlightStyle.width || 0}Z`}')` }}></div>

            <div
                className="absolute border-2 border-indigo-500 rounded-lg shadow-2xl transition-all duration-300"
                style={{ ...highlightStyle, opacity: isVisible ? 1 : 0 }}
            ></div>
            
            <div
                className={`absolute w-72 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 transition-all duration-300 ${tooltipPositionClass}`}
                style={{ ...tooltipStyle, opacity: isVisible ? 1 : 0 }}
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{step.title}</h3>
                     <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5"/></button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{step.content}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">{currentStep + 1} / {steps.length}</span>
                    <button
                        onClick={handleNext}
                        className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    );
};
