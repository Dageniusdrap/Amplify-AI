import React, { useState } from 'react';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';

interface KeyTakeawaysCardProps {
  takeaways: string[];
}

export const KeyTakeawaysCard: React.FC<KeyTakeawaysCardProps> = ({ takeaways }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const content = takeaways.map(t => `- ${t}`).join('\n');

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
    a.download = 'key_takeaways.txt';
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
          <ListBulletIcon className="h-6 w-6 mr-3 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI-Generated Key Takeaways</h3>
        </div>
        <div className="flex items-center space-x-2">
            <button
                onClick={handleShare}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                {shared ? <CheckIcon className="h-4 w-4 mr-2 text-green-500" /> : <ShareIcon className="h-4 w-4 mr-2" />}
                {shared ? 'Copied!' : 'Share'}
            </button>
            <button
                onClick={handleDownload}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {copied ? <CheckIcon className="h-4 w-4 mr-2 text-green-500" /> : <ClipboardIcon className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
            {takeaways.map((item, index) => (
                <li key={index} className="flex items-start">
                    <span className="text-amber-500 font-bold mr-3">✔</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};