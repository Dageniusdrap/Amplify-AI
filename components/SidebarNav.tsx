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
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { LogoIcon } from './icons/LogoIcon';
import { FilmIcon } from './icons/FilmIcon';

export type AnalysisType = 'salesCall' | 'socialMedia' | 'productAd' | 'contentGeneration' | 'brandVoice' | 'pricing' | 'videoAnalysis' | 'documentAnalysis' | 'liveStream' | 'retirementPlanner' | 'liveDebugger' | 'financialReport' | 'videoToScript';

interface SidebarNavProps {
  selectedType: AnalysisType;
  onTypeChange: (type: AnalysisType) => void;
}

const toolConfig = {
  contentGeneration: { label: 'Generate', icon: MagicWandIcon, description: 'Create brand-new content from scratch, from viral video scripts to professional voiceovers.', category: 'main' },
  liveDebugger: { label: 'Live Debug', icon: MicrophoneIcon, description: 'Get real-time feedback and transcription with a live conversational AI session.', category: 'main' },
  videoAnalysis: { label: 'Video', icon: VideoCameraIcon, description: "Get an expert analysis of your video, including hook quality, editing suggestions, and refined captions to boost performance.", category: 'main' },
  videoToScript: { label: 'Video to Script', icon: FilmIcon, description: 'Extract a full transcript and key takeaways from any video file.', category: 'main' },
  liveStream: { label: 'Live Stream', icon: BroadcastIcon, description: 'Analyze recorded live streams to find peak engagement moments and monetization opportunities.', category: 'main' },
  documentAnalysis: { label: 'Document', icon: DocumentTextIcon, description: 'Evaluate text documents for clarity, tone, and key takeaways. Perfect for refining articles or reports.', category: 'main' },
  financialReport: { label: 'Financial Report', icon: CurrencyDollarIcon, description: 'Analyze financial documents like earnings reports or market analyses. Extract key metrics, summarize findings, and assess sentiment.', category: 'main' },
  socialMedia: { label: 'Social', icon: UsersIcon, description: 'Analyze the effectiveness of your social media posts, including hooks, visuals, and calls-to-action.', category: 'main' },
  salesCall: { label: 'Sales Call', icon: TrendingUpIcon, description: "Get expert sales coaching and viral marketing ideas from your calls. The AI analyzes sales techniques and identifies content moments that could go viral, complete with performance predictions.", category: 'main' },
  productAd: { label: 'Product Ad', icon: SparklesIcon, description: 'Get feedback on your product ad scripts or videos to maximize clarity, impact, and conversions.', category: 'main' },
  retirementPlanner: { label: 'Retirement', icon: PiggyBankIcon, description: 'Plan your financial future with an AI-powered retirement calculator and strategy generator.', category: 'other' },
  brandVoice: { label: 'Brand Voice', icon: TuningForkIcon, description: 'Define and save your unique brand voice to ensure all AI-generated content is consistent and on-brand.', category: 'settings' },
  pricing: { label: 'Pricing', icon: () => <span className="text-2xl font-bold">$</span>, description: 'View and manage your subscription plan to unlock more features and higher limits.', category: 'settings' }
};

const SidebarButton: React.FC<{
    onClick: () => void;
    isSelected: boolean;
    icon: React.FC<any>;
    label: string;
}> = ({ onClick, isSelected, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
        isSelected
            ? 'bg-indigo-600 text-white shadow'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
        aria-pressed={isSelected}
    >
        <Icon className="h-6 w-6 mr-3 flex-shrink-0" />
        <span className="font-semibold">{label}</span>
    </button>
);

export const SidebarNav: React.FC<SidebarNavProps> = ({ selectedType, onTypeChange }) => {
    const mainTools = Object.entries(toolConfig).filter(([, config]) => config.category === 'main');
    const otherTools = Object.entries(toolConfig).filter(([, config]) => config.category === 'other');
    const settingsTools = Object.entries(toolConfig).filter(([, config]) => config.category === 'settings');

    return (
        <nav id="analysis-type-selector" className="w-64 bg-black/20 text-white flex flex-col p-4 border-r border-white/10 backdrop-blur-lg">
            <div className="mb-8 pl-2">
                <LogoIcon className="h-12 w-auto" />
            </div>

            <div className="flex-grow space-y-1">
                 {mainTools.map(([id, config]) => (
                    <SidebarButton 
                        key={id}
                        onClick={() => onTypeChange(id as AnalysisType)}
                        isSelected={selectedType === id}
                        icon={config.icon}
                        label={config.label}
                    />
                ))}
            </div>

            <div className="flex-shrink-0">
                 {otherTools.map(([id, config]) => (
                    <SidebarButton 
                        key={id}
                        onClick={() => onTypeChange(id as AnalysisType)}
                        isSelected={selectedType === id}
                        icon={config.icon}
                        label={config.label}
                    />
                ))}
                <div className="my-4 border-t border-white/20"></div>
                 {settingsTools.map(([id, config]) => (
                    <SidebarButton 
                        key={id}
                        onClick={() => onTypeChange(id as AnalysisType)}
                        isSelected={selectedType === id}
                        icon={config.icon}
                        label={config.label}
                    />
                ))}
            </div>
        </nav>
    );
};

SidebarNav.toolConfig = toolConfig;