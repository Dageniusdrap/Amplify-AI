import React from 'react';
import type { KeywordAnalysis } from '../types';
import { TagIcon } from './icons/TagIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface KeywordAnalysisCardProps {
  data: KeywordAnalysis;
}

export const KeywordAnalysisCard: React.FC<KeywordAnalysisCardProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <TagIcon className="h-6 w-6 mr-3 text-cyan-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Keyword & Topic Analysis</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
            Key Topics
          </h4>
          <ul className="space-y-2">
            {data.topics.map((topic, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="text-cyan-500 font-bold mr-3">✔</span>
                <span className="text-gray-700 dark:text-gray-300">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Top Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, index) => (
              <span key={index} className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};