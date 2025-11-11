import React from 'react';
import { AudioPlayer } from './AudioPlayer';
import { DownloadIcon } from './icons/DownloadIcon';

interface MediaPreviewCardProps {
  file: File;
  fileUrl: string;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({ file, fileUrl }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Media Preview</h3>
            <a href={fileUrl} download={file.name} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" aria-label={`Download ${file.name}`}>
                <DownloadIcon className="h-4 w-4 mr-2" /> Download Media
            </a>
        </div>
        <div className="p-4">
            <AudioPlayer src={fileUrl} file={file} />
        </div>
    </div>
  );
};