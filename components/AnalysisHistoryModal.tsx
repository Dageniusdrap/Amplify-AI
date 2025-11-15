import React, { useState, useMemo } from 'react';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SearchIcon } from './icons/SearchIcon';
import type { AnalysisHistoryItem } from '../types';
import { ChatBubbleBottomCenterTextIcon } from './icons/ChatBubbleBottomCenterTextIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { FilmIcon } from './icons/FilmIcon';

interface AnalysisHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AnalysisHistoryItem[];
  onSelect: (item: AnalysisHistoryItem) => void;
  onClear: () => void;
  onDelete: (timestamp: string) => void;
}

// FIX: Added 'financialReport' to satisfy the type.
const analysisTypeDetails: { [key in AnalysisHistoryItem['analysisType']]: { label: string, icon: React.FC<any>, color: string } } = {
    salesCall: { label: 'Sales Call', icon: TrendingUpIcon, color: 'text-green-500' },
    socialMedia: { label: 'Social Media', icon: UsersIcon, color: 'text-blue-500' },
    productAd: { label: 'Product Ad', icon: SparklesIcon, color: 'text-yellow-500' },
    videoAnalysis: { label: 'Video Analysis', icon: VideoCameraIcon, color: 'text-red-500' },
    videoToScript: { label: 'Video to Script', icon: FilmIcon, color: 'text-orange-500' },
    documentAnalysis: { label: 'Document', icon: DocumentTextIcon, color: 'text-purple-500' },
    financialReport: { label: 'Financial Report', icon: CurrencyDollarIcon, color: 'text-teal-500' },
    liveStream: { label: 'Live Stream', icon: BroadcastIcon, color: 'text-cyan-500' },
    liveDebugger: { label: 'Live Debug', icon: MicrophoneIcon, color: 'text-gray-500' },
};


export const AnalysisHistoryModal: React.FC<AnalysisHistoryModalProps> = ({ isOpen, onClose, history, onSelect, onClear, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<AnalysisHistoryItem['analysisType'] | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredHistory = useMemo(() => {
    let items = [...history]; // Create a copy to sort

    // Sort items
    items.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    if (filter !== 'all') {
        items = items.filter(item => item.analysisType === filter);
    }

    if (!searchQuery) return items;
    
    const lowercasedQuery = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.fileName && item.fileName.toLowerCase().includes(lowercasedQuery)) ||
      (item.result.transcript && item.result.transcript.some(t => t.text.toLowerCase().includes(lowercasedQuery)))
    );
  }, [history, searchQuery, filter, sortOrder]);
  
  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableFilters = useMemo(() => Array.from(new Set(history.map(item => item.analysisType))), [history]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Analysis History</h2>
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
              placeholder="Search by filename or transcript content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          {availableFilters.length > 0 && (
            <div className="flex justify-between items-center mt-3">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
                    >
                        All
                    </button>
                    {availableFilters.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${filter === type ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
                        >
                            {analysisTypeDetails[type]?.label || type}
                        </button>
                    ))}
                </div>
                 <div className="relative">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        className="text-xs font-medium appearance-none bg-gray-200 dark:bg-gray-700 border-none rounded-full py-1 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <ChevronDownIcon className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400" />
                </div>
            </div>
        )}
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ChatBubbleBottomCenterTextIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="font-semibold">{searchQuery ? 'No Results Found' : 'No Analysis History Yet'}</p>
              <p className="text-sm">{searchQuery ? `Your search for "${searchQuery}" did not match any items.` : 'Completed analyses will appear here.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => {
                const details = analysisTypeDetails[item.analysisType];
                const DetailsIcon = details.icon;
                return (
                    <div key={item.timestamp} className="bg-white dark:bg-gray-800/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden group">
                        <div className="p-3 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                           <div className="flex items-center space-x-2">
                                <DetailsIcon className={`h-5 w-5 ${details.color}`} />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{details.label}</span>
                            </div>
                        </div>
                        <div className="p-4 flex-grow cursor-pointer" onClick={() => onSelect(item)}>
                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium break-words group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                {item.fileName || 'Text/Script Analysis'}
                            </p>
                            {item.result.transcript && item.result.transcript.length > 0 && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic truncate">
                                    "{item.result.transcript[0].text}"
                                </p>
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.timestamp)}</span>
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