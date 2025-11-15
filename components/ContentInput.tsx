import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import type { AnalysisType } from './SidebarNav';

interface ContentInputProps {
  onInputsChange: (inputs: { script: string; description:string }) => void;
  onSubmit: () => void;
  isLoading: boolean;
  inputs: { script: string; description: string };
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
  selectedFile: File | null;
  analysisType: AnalysisType;
}

export const ContentInput: React.FC<ContentInputProps> = ({ onInputsChange, onSubmit, isLoading, inputs, onFileSelect, onClearFile, selectedFile, analysisType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileSelect(event.target.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onFileSelect(event.dataTransfer.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputsChange({ ...inputs, script: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputsChange({ ...inputs, description: e.target.value });
  };

  const showUploader = ['salesCall', 'socialMedia', 'productAd', 'documentAnalysis', 'financialReport'].includes(analysisType);
  const isDocMode = analysisType === 'documentAnalysis' || analysisType === 'financialReport';
  const isCallMode = analysisType === 'salesCall';
  
  let buttonText = 'Analyze Content';
  if (selectedFile) {
    if (isDocMode) buttonText = 'Analyze Document';
    else if (isCallMode) buttonText = 'Transcribe & Analyze Call';
    else buttonText = 'Transcribe & Analyze';
  } else if (isCallMode) {
    buttonText = 'Analyze Call Script';
  } else if (isDocMode) {
    buttonText = 'Analyze Document';
  }


  const uploaderConfig = {
    salesCall: { label: "Upload call recording or transcript", types: "MP3, MP4, TXT, etc.", accept: "audio/*,video/*,.txt,.md" },
    socialMedia: { label: "Upload audio/video", types: "MP3, WAV, MP4, MOV, etc.", accept: "audio/*,video/*" },
    productAd: { label: "Upload audio/video", types: "MP3, WAV, MP4, MOV, etc.", accept: "audio/*,video/*" },
    documentAnalysis: { label: "Upload document", types: "TXT, MD, or paste content below", accept: ".txt,.md" },
    financialReport: { label: "Upload financial report", types: "TXT, MD, PDF, or paste content", accept: ".txt,.md,.pdf" },
  };
  const currentUploaderConfig = uploaderConfig[analysisType as keyof typeof uploaderConfig];


  return (
    <div className="flex flex-col w-full space-y-4">
      {showUploader && (
        <>
            <label
                htmlFor="media-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <div className="flex flex-col items-center justify-center">
                <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{currentUploaderConfig.label}</span> or drop file
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUploaderConfig.types}</p>
                </div>
                <input
                id="media-upload"
                type="file"
                className="hidden"
                accept={currentUploaderConfig.accept}
                onChange={handleFileChange}
                ref={fileInputRef}
                />
            </label>
            {selectedFile && (
                <div className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-center">
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
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                        {isDocMode || (isCallMode && selectedFile.type.startsWith('text/')) ? 'File content has been loaded into the text area.' : 'The uploaded file will be transcribed as part of the analysis.'}
                    </p>
                </div>
            )}
            <div className="flex items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm font-semibold">OR</span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
        </>
      )}

      <div>
        <label htmlFor="content-script" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {isDocMode ? 'Document Content' : (isCallMode ? 'Call Transcript' : 'Content Script / Text')}
        </label>
        <textarea
          id="content-script"
          rows={isDocMode ? 10 : 6}
          className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          placeholder={selectedFile && showUploader && !isDocMode && !isCallMode ? "Script will be transcribed from the uploaded file." : "Paste the transcript of your call, the text of your post, or the copy of your ad here..."}
          value={inputs.script}
          onChange={handleScriptChange}
          disabled={showUploader && !!selectedFile && !isDocMode && !(isCallMode && selectedFile.type.startsWith('text/'))}
        />
      </div>
      <div>
        <label htmlFor="content-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {isDocMode ? 'Context & Goals (Optional)' : 'Visual Description & Goals'}
        </label>
        <textarea
          id="content-description"
          rows={4}
          className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={isDocMode ? "Provide any context about this document, its audience, or your goal (e.g., 'This is a marketing email to existing customers to announce a new feature')." : "Describe the visuals (e.g., 'fast-paced editing, bright colors'), the target audience, and the primary goal of this content (e.g., 'drive website clicks')."}
          value={inputs.description}
          onChange={handleDescriptionChange}
        />
      </div>
      <button
        id="analysis-submit-button"
        onClick={onSubmit}
        disabled={isLoading || (!inputs.script && !selectedFile && !inputs.description)}
        className="mt-2 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isLoading ? 'Analyzing...' : buttonText}
      </button>
    </div>
  );
};