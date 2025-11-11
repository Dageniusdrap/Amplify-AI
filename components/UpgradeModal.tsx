import React from 'react';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md text-center p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <XIcon className="h-6 w-6" />
        </button>

        <SparklesIcon className="h-16 w-16 mx-auto text-indigo-500 mb-4" />

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">You've Reached Your Limit!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You've used all your free generations for this period. Upgrade your plan to continue creating amazing content.
        </p>

        <div className="space-y-3">
             <button
                onClick={onUpgrade}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                View Plans & Upgrade
            </button>
             <button
                onClick={onClose}
                className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
                Maybe Later
            </button>
        </div>
      </div>
    </div>
  );
};