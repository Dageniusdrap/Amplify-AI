import React, { useState, useMemo } from 'react';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ClockIcon } from './icons/ClockIcon';
import type { VoiceoverScript } from '../types';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ImageIcon } from './icons/ImageIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';

export interface PromptHistoryItem {
  prompt: string;
  timestamp: string;
  type: 'script' | 'image' | 'video' | 'speech';
  link?: string;
  imageModel?: 'imagen-4.0-generate-001' | 'gemini-2.5-flash-image';
  aspectRatio?: string;
  imageStylePresets?: string[];
  imageMimeType?: 'image/jpeg' | 'image/png';
  videoModel?: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
  resolution?: '720p' | '1080p';
  videoDuration?: 'short' | 'medium' | 'long';
  videoStylePresets?: string[];
  referenceFrameCount?: number;
  voiceoverScripts?: VoiceoverScript[];
  voice?: string;
}

interface PromptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: PromptHistoryItem[];
  onSelect: (item: PromptHistoryItem) => void;
  onClear: () => void;
  onDelete: (timestamp: string) => void;
}

const modelLabels: Record<string, string> = {
  'imagen-4.0-generate-001': 'Imagen 4.0',
  'gemini-2.5-flash-image': 'Nano Banana',
  'veo-3.1-fast-generate-preview': 'Veo Fast',
  'veo-3.1-generate-preview': 'Veo HD',
};

const typeDetails: Record<string, { icon: React.FC<any>, color: string, label: string }> = {
    script: { icon: MagicWandIcon, color: 'text-purple-500', label: 'Viral Script' },
    image: { icon: ImageIcon, color: 'text-blue-500', label: 'Image' },
    video: { icon: VideoCameraIcon, color: 'text-red-500', label: 'Video' },
    speech: { icon: SpeakerWaveIcon, color: 'text-green-500', label: 'Speech' },
};


const HistoryTag: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <span className={`px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full ${className}`}>
        {children}
    </span>
);

export const PromptHistoryModal: React.FC<PromptHistoryModalProps> = ({ isOpen, onClose, history, onSelect, onClear, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return history;
    const lowercasedQuery = searchQuery.toLowerCase();
    return history.filter(item =>
      item.prompt.toLowerCase().includes(lowercasedQuery) ||
      (item.link && item.link.toLowerCase().includes(lowercasedQuery))
    );
  }, [history, searchQuery]);

  if (!isOpen) return null;
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Generation History</h2>
          <div className="flex items-center space-x-4">
              {history.length > 0 && (
                  <button onClick={onClear} className="flex items-center text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium">
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Clear All
                  </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <XIcon className="h-6 w-6" />
              </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search prompt history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="font-semibold">{searchQuery ? 'No Results Found' : 'No Prompt History'}</p>
              <p className="text-sm">{searchQuery ? `Your search for "${searchQuery}" did not match any prompts.` : 'Your used prompts will appear here.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => {
                const DetailsIcon = typeDetails[item.type].icon;
                const iconColor = typeDetails[item.type].color;
                const typeLabel = typeDetails[item.type].label;
                return (
                    <div key={item.timestamp} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden group">
                        <div className="p-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                           <div className="flex items-center space-x-2">
                                <DetailsIcon className={`h-5 w-5 ${iconColor}`} />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{typeLabel}</span>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.timestamp)}</span>
                        </div>
                        <div className="p-4 flex-grow cursor-pointer" onClick={() => onSelect(item)}>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">"{item.prompt}"</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex flex-wrap gap-2 items-center">
                                {item.imageModel && <HistoryTag>{modelLabels[item.imageModel]}</HistoryTag>}
                                {item.videoModel && <HistoryTag>{modelLabels[item.videoModel]}</HistoryTag>}
                                {item.voice && <HistoryTag>{item.voice}</HistoryTag>}
                                {item.aspectRatio && <HistoryTag>{item.aspectRatio}</HistoryTag>}
                                {item.resolution && <HistoryTag>{item.resolution}</HistoryTag>}
                                {item.videoDuration && <HistoryTag className="capitalize">{item.videoDuration}</HistoryTag>}
                                {item.referenceFrameCount && item.referenceFrameCount > 0 && <HistoryTag>{item.referenceFrameCount} Ref Img</HistoryTag>}
                                {item.imageStylePresets && item.imageStylePresets.length > 0 && <HistoryTag className="truncate max-w-[200px]">{item.imageStylePresets.join(', ')}</HistoryTag>}
                                {item.videoStylePresets && item.videoStylePresets.length > 0 && <HistoryTag className="truncate max-w-[200px]">{item.videoStylePresets.join(', ')}</HistoryTag>}
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(item.timestamp); }} 
                                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                title="Delete item"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};