import React from 'react';

interface LoaderProps {
    message?: string;
    onCancel?: () => void;
    progress?: number | null;
}

export const Loader: React.FC<LoaderProps> = ({ message, onCancel, progress }) => {
  const displayProgress = progress !== null && progress >= 0;
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 flex flex-col justify-center items-center text-center w-80">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
      {message && <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">{message}</p>}
      
      {displayProgress && (
          <div className="w-full mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-linear" 
                      style={{ width: `${progress}%` }}
                  ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{progress}% complete</p>
          </div>
      )}
      
      {onCancel && (
        <button 
            onClick={onCancel}
            className="mt-6 px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            Cancel
        </button>
      )}
    </div>
  );
};