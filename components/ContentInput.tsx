import React, { useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import type { AnalysisType } from './AnalysisTypeSelector';

interface ContentInputProps {
  onInputsChange: (inputs: { script: string; description:string }) => void;
  onSubmit: () => void;
  isLoading: boolean;
  inputs: { script: string; description: string };
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  analysisType: AnalysisType;
}

export const ContentInput: React.FC<ContentInputProps> = ({ onInputsChange, onSubmit, isLoading, inputs, onFileSelect, selectedFile, analysisType }) => {
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

  const showUploader = analysisType === 'socialMedia' || analysisType === 'productAd' || analysisType === 'documentAnalysis';
  const isDocMode = analysisType === 'documentAnalysis';
  let buttonText = selectedFile && !isDocMode ? 'Transcribe & Analyze' : 'Analyze Content';
  if (isDocMode && selectedFile) buttonText = 'Analyze Document';

  const uploaderConfig = {
    socialMedia: { label: "Upload audio/video", types: "MP3, WAV, MP4, MOV, etc.", accept: "audio/*,video/*" },
    productAd: { label: "Upload audio/video", types: "MP3, WAV, MP4, MOV, etc.", accept: "audio/*,video/*" },
    documentAnalysis: { label: "Upload document", types: "TXT, MD, or paste content below", accept: ".txt,.md" },
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
                <div className="text-center text-sm text-gray-700 dark:text-gray-300 space-y-1 py-2">
                  <p>Selected: <span className="font-medium">{selectedFile.name}</span></p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {isDocMode ? 'File content has been loaded into the text area.' : 'The uploaded file will be transcribed as part of the analysis.'}
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
          {isDocMode ? 'Document Content' : 'Content Script / Text'}
        </label>
        <textarea
          id="content-script"
          rows={isDocMode ? 10 : 6}
          className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
          placeholder={selectedFile && showUploader && !isDocMode ? "Script will be transcribed from the uploaded file." : "Paste the transcript of your video, the text of your post, or the copy of your ad here..."}
          value={inputs.script}
          onChange={handleScriptChange}
          disabled={showUploader && !!selectedFile && !isDocMode}
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
