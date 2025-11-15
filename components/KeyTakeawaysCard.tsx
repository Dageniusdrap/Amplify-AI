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
  

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <ListBulletIcon className="h-5 w-5 mr-3 text-amber-500" />
          <h4 className="text-md font-semibold text-gray-800 dark:text-white">Key Takeaways</h4>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Copy"
            >
              {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <ul className="space-y-3">
            {takeaways.map((item, index) => (
                <li key={index} className="flex items-start text-sm">
                    <span className="text-amber-500 font-bold mr-3">✔</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};
