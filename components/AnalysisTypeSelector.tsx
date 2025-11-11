import React from 'react';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TuningForkIcon } from './icons/TuningForkIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { PiggyBankIcon } from './icons/PiggyBankIcon';

export type AnalysisType = 'salesCall' | 'socialMedia' | 'productAd' | 'contentGeneration' | 'brandVoice' | 'pricing' | 'videoAnalysis' | 'documentAnalysis' | 'liveStream' | 'retirementPlanner';

interface AnalysisTypeSelectorProps {
  selectedType: AnalysisType;
  onTypeChange: (type: AnalysisType) => void;
}

const analysisTypesConfig = {
  contentGeneration: { label: 'Generate', icon: MagicWandIcon, description: 'Create brand-new content from scratch, from viral video scripts to professional voiceovers.' },
  videoAnalysis: { label: 'Video', icon: VideoCameraIcon, description: 'Get a deep analysis of your video content, including pacing, engagement, and virality scores.' },
  liveStream: { label: 'Live Stream', icon: BroadcastIcon, description: 'Analyze recorded live streams to find peak engagement moments and monetization opportunities.' },
  documentAnalysis: { label: 'Document', icon: DocumentTextIcon, description: 'Evaluate text documents for clarity, tone, and key takeaways. Perfect for refining articles or reports.' },
  socialMedia: { label: 'Social', icon: UsersIcon, description: 'Analyze the effectiveness of your social media posts, including hooks, visuals, and calls-to-action.' },
  salesCall: { label: 'Sales Call', icon: TrendingUpIcon, description: 'Transcribe and analyze sales calls to identify strengths, weaknesses, and coaching opportunities.' },
  productAd: { label: 'Product Ad', icon: SparklesIcon, description: 'Get feedback on your product ad scripts or videos to maximize clarity, impact, and conversions.' },
  retirementPlanner: { label: 'Retirement', icon: PiggyBankIcon, description: 'Plan your financial future with an AI-powered retirement calculator and strategy generator.' },
  brandVoice: { label: 'Brand Voice', icon: TuningForkIcon, description: 'Define and save your unique brand voice to ensure all AI-generated content is consistent and on-brand.' },
  pricing: { label: 'Pricing', icon: () => <span className="text-3xl font-bold">$</span>, description: 'View and manage your subscription plan to unlock more features and higher limits.' }
};

export const AnalysisTypeSelector: React.FC<AnalysisTypeSelectorProps> = ({ selectedType, onTypeChange }) => {
  const currentSelection = analysisTypesConfig[selectedType];
  const Icon = currentSelection.icon;

  return (
    <div id="analysis-type-selector" className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* Left Column: Tool List */}
        <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 p-2 space-y-1">
          {Object.entries(analysisTypesConfig).map(([id, config]) => {
            const CurrentIcon = config.icon;
            return (
              <button
                key={id}
                onClick={() => onTypeChange(id as AnalysisType)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                  selectedType === id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-pressed={selectedType === id}
              >
                <CurrentIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                <span className="font-semibold">{config.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right Column: Description */}
        <div className="md:col-span-2 p-8 flex flex-col items-center justify-center text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full mb-4">
                <Icon className="h-12 w-12 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentSelection.label}</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-sm">
                {currentSelection.description}
            </p>
        </div>
      </div>
    </div>
  );
};
