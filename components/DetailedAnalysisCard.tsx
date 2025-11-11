import React from 'react';
import { ScoreGauge } from './ScoreGauge';

interface DetailedAnalysisCardProps {
  title: string;
  data: Record<string, string | number | string[]>;
}

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

export const DetailedAnalysisCard: React.FC<DetailedAnalysisCardProps> = ({ title, data }) => {
  const scores = Object.entries(data).filter(([key, value]) => typeof value === 'number' && (key.toLowerCase().includes('score') || key.toLowerCase().includes('rating')));
  const textData = Object.entries(data).filter(([key, value]) => !scores.some(s => s[0] === key));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      <div className="p-4 space-y-4">
        {scores.length > 0 && (
          <div className="flex justify-around items-center flex-wrap gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {scores.map(([key, value]) => (
              <ScoreGauge key={key} score={value as number} label={formatKey(key)} />
            ))}
          </div>
        )}

        {textData.map(([key, value]) => (
          <div key={key}>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">{formatKey(key)}</h4>
            {key === 'thumbnailSuggestion' ? (
                <div className="mt-1 p-3 bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500 rounded-r-lg">
                    <p className="text-sm italic text-indigo-800 dark:text-indigo-200">{value as string}</p>
                </div>
            ) : Array.isArray(value) ? (
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    {value.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
            ) : (
                <p className="text-gray-600 dark:text-gray-400">{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};