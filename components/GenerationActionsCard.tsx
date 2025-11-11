import React, { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ShareIcon } from './icons/ShareIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { GeneratedContentCard } from './GeneratedContentCard';
import { KeyTakeawaysCard } from './KeyTakeawaysCard';
import { SocialPostCard } from './SocialPostCard';
import { ProductAdCard } from './ProductAdCard';

type GenerationTab = 'improve' | 'takeaways' | 'description' | 'social' | 'ad';

interface GenerationActionsCardProps {
    isGeneratingImproved: boolean;
    onGenerateImprovedContent: () => void;
    improvedContent: string | null;
    isGeneratingSocialPost: boolean;
    onGenerateSocialPost: () => void;
    socialPost: string | null;
    isGeneratingProductAd: boolean;
    onGenerateProductAd: () => void;
    productAd: string | null;
    isGeneratingKeyTakeaways: boolean;
    onGenerateKeyTakeaways: () => void;
    keyTakeaways: string[] | null;
    isGeneratingDescription: boolean;
    onGenerateDescription: () => void;
    generatedDescription: string | null;
    onCancel: () => void;
    hasContentToImprove: boolean;
    // Props for nested components
    onGenerateVideoFromScript: (script: string) => void;
    onListenToScript: (script: string, voice: string, style: string) => Promise<void>;
    isGeneratingScriptAudio: boolean;
    scriptAudio: { url: string; blob: Blob } | null;
}

const ActionButton: React.FC<{
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  onClick: () => void;
  isLoading: boolean;
  onCancel: () => void;
}> = ({ icon: Icon, title, description, onClick, isLoading, onCancel }) => {
  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Generating {title}...</p>
        <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
        >
            Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto">
            <Icon className="h-6 w-6 text-indigo-500" />
        </div>
        <h5 className="mt-4 font-semibold text-gray-800 dark:text-gray-200">{title}</h5>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        <button 
            onClick={onClick}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
            Generate
        </button>
    </div>
  );
};


export const GenerationActionsCard: React.FC<GenerationActionsCardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<GenerationTab>('improve');

    // FIX: Define the array with its type first to prevent TypeScript from widening the `id` property to `string`.
    const allTabs: { id: GenerationTab; label: string; icon: React.FC<any>; show: boolean }[] = [
        { id: 'improve', label: 'Improve', icon: SparklesIcon, show: props.hasContentToImprove },
        { id: 'takeaways', label: 'Takeaways', icon: ListBulletIcon, show: true },
        { id: 'description', label: 'Description', icon: DocumentDuplicateIcon, show: true },
        { id: 'social', label: 'Social Post', icon: ShareIcon, show: true },
        { id: 'ad', label: 'Product Ad', icon: MegaphoneIcon, show: true },
    ];
    
    const TABS = allTabs.filter(tab => tab.show);
    
    // Auto-switch to first available tab if current one is hidden
    if (!TABS.find(t => t.id === activeTab)) {
        if (TABS.length > 0) setActiveTab(TABS[0].id);
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case 'improve':
                return props.improvedContent ? (
                    <GeneratedContentCard 
                        content={props.improvedContent}
                        title="AI-Generated Improved Content"
                        onGenerateVideo={props.onGenerateVideoFromScript}
                        onListenToScript={props.onListenToScript}
                        isGeneratingAudio={props.isGeneratingScriptAudio}
                        audio={props.scriptAudio}
                        onCancel={props.onCancel}
                    />
                ) : (
                    <ActionButton
                        icon={SparklesIcon}
                        title="Improve Script"
                        description="Rewrite the original script based on AI feedback."
                        onClick={props.onGenerateImprovedContent}
                        isLoading={props.isGeneratingImproved}
                        onCancel={props.onCancel}
                    />
                );
            case 'takeaways':
                return props.keyTakeaways ? (
                    <KeyTakeawaysCard takeaways={props.keyTakeaways} />
                ) : (
                    <ActionButton
                        icon={ListBulletIcon}
                        title="Key Takeaways"
                        description="Distill the content into a concise list of main points."
                        onClick={props.onGenerateKeyTakeaways}
                        isLoading={props.isGeneratingKeyTakeaways}
                        onCancel={props.onCancel}
                    />
                );
            case 'description':
                return props.generatedDescription ? (
                     <GeneratedContentCard 
                        content={props.generatedDescription} 
                        title="AI-Generated Description"
                        titleIcon={DocumentDuplicateIcon}
                        onListenToScript={props.onListenToScript}
                        isGeneratingAudio={props.isGeneratingScriptAudio}
                        audio={props.scriptAudio}
                        onCancel={props.onCancel}
                    />
                ) : (
                    <ActionButton
                        icon={DocumentDuplicateIcon}
                        title="SEO Description"
                        description="Create a compelling summary for YouTube or podcasts."
                        onClick={props.onGenerateDescription}
                        isLoading={props.isGeneratingDescription}
                        onCancel={props.onCancel}
                    />
                );
            case 'social':
                return props.socialPost ? (
                    <SocialPostCard content={props.socialPost} />
                ) : (
                    <ActionButton
                        icon={ShareIcon}
                        title="Social Media Post"
                        description="Generate a short, engaging post for platforms like X or LinkedIn."
                        onClick={props.onGenerateSocialPost}
                        isLoading={props.isGeneratingSocialPost}
                        onCancel={props.onCancel}
                    />
                );
            case 'ad':
                return props.productAd ? (
                    <ProductAdCard content={props.productAd} />
                ) : (
                     <ActionButton
                        icon={MegaphoneIcon}
                        title="Product Ad Script"
                        description="Create a punchy, 30-second ad script from the content."
                        onClick={props.onGenerateProductAd}
                        isLoading={props.isGeneratingProductAd}
                        onCancel={props.onCancel}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Content Hub</h3>
            </div>
            
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-2 p-2" aria-label="Tabs">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center text-sm font-medium px-3 py-2 rounded-md ${
                                    activeTab === tab.id
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                               <Icon className="h-5 w-5 mr-2" />
                               {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>
            
            <div className="min-h-[200px]">
                {renderContent()}
            </div>
        </div>
    );
};