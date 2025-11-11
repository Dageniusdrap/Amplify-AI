import React, { useState } from 'react';
import { ShareIcon } from './icons/ShareIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface SocialPostCardProps {
  content: string;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = ({ content }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'social_post.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(content);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mt-8">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <ShareIcon className="h-6 w-6 mr-3 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI-Generated Social Post</h3>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={handleShare}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
                {shared ? <CheckIcon className="h-4 w-4 mr-2 text-green-500" /> : <ShareIcon className="h-4 w-4 mr-2" />}
                {shared ? 'Copied!' : 'Share'}
            </button>
            <button
                onClick={handleDownload}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              {copied ? <CheckIcon className="h-4 w-4 mr-2 text-green-500" /> : <ClipboardIcon className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
      </div>
      <div className="p-6">
        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{content}</pre>
      </div>
    </div>
  );
};