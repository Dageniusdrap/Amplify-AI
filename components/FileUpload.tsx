import React, { useRef, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import type { AnalysisType } from './AnalysisTypeSelector';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedFile: File | null;
  fileUrl: string | null;
  error: string | null;
  analysisType: AnalysisType;
}

// FIX: Added 'retirementPlanner' to satisfy the Record type.
const config: Record<AnalysisType, { title: string, description: string, accept: string }> = {
    salesCall: {
        title: 'Analyze Call',
        description: 'MP3, WAV, MP4, MOV, etc. (Max. 50MB)',
        accept: 'audio/*,video/*',
    },
    videoAnalysis: {
        title: 'Analyze Video',
        description: 'MP4, MOV, or WEBM (Max. 50MB)',
        accept: 'video/mp4, video/quicktime, video/webm',
    },
    liveStream: {
        title: 'Analyze Stream',
        description: 'MP4, MOV, or WEBM (Max. 50MB)',
        accept: 'video/mp4, video/quicktime, video/webm',
    },
    // Other types are handled by ContentInput, but we provide fallbacks
    socialMedia: { title: 'Analyze', description: 'Audio or Video File', accept: 'audio/*,video/*' },
    productAd: { title: 'Analyze', description: 'Audio or Video File', accept: 'audio/*,video/*' },
    documentAnalysis: { title: 'Analyze', description: 'Text File', accept: '.txt,.md,.pdf' },
    contentGeneration: { title: 'Generate', description: '', accept: '' },
    brandVoice: { title: 'Save', description: '', accept: '' },
    pricing: { title: 'Select', description: '', accept: '' },
    retirementPlanner: { title: 'Generate', description: '', accept: '' },
};

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFileSelect, 
    onClearFile, 
    onSubmit, 
    isLoading, 
    selectedFile,
    fileUrl,
    error,
    analysisType,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const currentConfig = config[analysisType];
  const isVideo = selectedFile?.type.startsWith('video/');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
    if(event.target) event.target.value = '';
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center w-full">
      {!selectedFile ? (
        <>
            <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isDraggingOver 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' 
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentConfig.description}</p>
                </div>
                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept={currentConfig.accept}
                    onChange={handleFileChange}
                    ref={fileInputRef}
                />
            </label>
            {error && (
                <div className="mt-4 w-full text-center text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                    {error}
                </div>
            )}
        </>
      ) : (
        <div className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{selectedFile.name}</p>
                <button 
                    onClick={onClearFile}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Remove file"
                >
                    <XIcon className="h-5 w-5" />
                </button>
            </div>
            {fileUrl && (
                isVideo 
                ? <video src={fileUrl} controls className="w-full rounded-md max-h-60" />
                : <audio controls src={fileUrl} className="w-full" />
            )}
        </div>
      )}

      <button
        id="analysis-submit-button"
        onClick={onSubmit}
        disabled={isLoading || !selectedFile}
        className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? 'Analyzing...' : currentConfig.title}
      </button>
    </div>
  );
};