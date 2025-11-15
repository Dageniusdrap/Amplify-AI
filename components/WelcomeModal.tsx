import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

interface WelcomeModalProps {
  onStartTour: () => void;
  onSkip: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStartTour, onSkip }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md text-center p-8" onClick={e => e.stopPropagation()}>
      <LogoIcon className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Welcome to Creators Edge AI!</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your AI co-pilot for creating and analyzing high-impact content. Let's take a quick tour to see how you can get started.
      </p>
      <div className="space-y-3">
        <button
            onClick={onStartTour}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            Start the Tour
        </button>
        <button
            onClick={onSkip}
            className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
        >
            Skip for now
        </button>
      </div>
    </div>
  );
};