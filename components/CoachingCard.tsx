import React, { useState, useEffect, useRef } from 'react';
import type { FeedbackCardData } from '../types';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { BrainIcon } from './icons/BrainIcon';
import type { AnalysisType } from './SidebarNav';
import { ScoreGauge } from './ScoreGauge';
import { XCircleIcon } from './icons/XCircleIcon';
import { SpeakerPhoneIcon } from './icons/SpeakerPhoneIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ShareIcon } from './icons/ShareIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { GeneratedContentCard } from './GeneratedContentCard';
import { KeyTakeawaysCard } from './KeyTakeawaysCard';


const PROFESSIONAL_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
const VOICE_STYLES = ['Default', 'Cheerful', 'Animated', 'Energetic', 'Calm', 'Authoritative', 'Serious', 'Whispering', 'Storyteller', 'News Anchor'];

type GenerationType = 'improve' | 'takeaways' | 'description' | 'social' | 'ad';
type SocialPlatform = 'X' | 'LinkedIn' | 'Instagram';

interface CoachingCardProps {
  data: FeedbackCardData;
  analysisType: AnalysisType;
  scoreData?: { score: number; label:string };
  onListenToFeedback: (voice: string, style: string) => Promise<void>;
  isGeneratingAudio: boolean;
  feedbackAudio: { url: string; blob: Blob } | null;
  onCancel: () => void;
  // Generation Props
  isGeneratingImproved: boolean;
  onGenerateImprovedContent: () => void;
  improvedContent: string | null;
  isGeneratingSocialPost: boolean;
  onGenerateSocialPost: (platform: SocialPlatform) => void;
  socialPost: { platform: SocialPlatform; content: string } | null;
  isGeneratingProductAd: boolean;
  onGenerateProductAd: () => void;
  productAd: string | null;
  isGeneratingKeyTakeaways: boolean;
  onGenerateKeyTakeaways: () => void;
  keyTakeaways: string[] | null;
  isGeneratingDescription: boolean;
  onGenerateDescription: () => void;
  generatedDescription: string | null;
  hasContentToImprove: boolean;
  onGenerateVideoFromScript: (script: string) => void;
  onListenToScript: (script: string, voice: string, style: string) => Promise<void>;
  isGeneratingScriptAudio: boolean;
  scriptAudio: { url: string; blob: Blob } | null;
  originalScript: string;
}

const ActionButton: React.FC<{
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
  onClick: () => void;
  isActive: boolean;
}> = ({ icon: Icon, title, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200 dark:border-gray-600'}`}
    >
        <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-indigo-500' : 'text-gray-500 dark:text-gray-400'}`} />
        <span className={`font-semibold text-xs ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>{title}</span>
    </button>
);


export const CoachingCard: React.FC<CoachingCardProps> = (props) => { 
  const { data, scoreData, onListenToFeedback, isGeneratingAudio, feedbackAudio, onCancel, hasContentToImprove } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [feedbackVoice, setFeedbackVoice] = useState(PROFESSIONAL_VOICES[0]);
  const [voiceStyle, setVoiceStyle] = useState(VOICE_STYLES[0]);
  const [activeTab, setActiveTab] = useState<'strengths' | 'opportunities'>('strengths');
  const [activeGeneration, setActiveGeneration] = useState<GenerationType | null>(null);
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>('X');
  const [showSocialOptions, setShowSocialOptions] = useState(false);

  useEffect(() => {
    if (feedbackAudio?.url && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
    }
  }, [feedbackAudio]);

  const handleListenClick = async () => {
    await onListenToFeedback(feedbackVoice, voiceStyle);
  };
  
  const handleActionClick = (action: GenerationType) => {
      setActiveGeneration(action);
      switch(action) {
          case 'improve': props.onGenerateImprovedContent(); break;
          case 'takeaways': props.onGenerateKeyTakeaways(); break;
          case 'description': props.onGenerateDescription(); break;
          case 'social': props.onGenerateSocialPost(socialPlatform); break;
          case 'ad': props.onGenerateProductAd(); break;
      }
  };
  
  const handleSocialPlatformSelect = (platform: SocialPlatform) => {
    setSocialPlatform(platform);
    setActiveGeneration('social');
    props.onGenerateSocialPost(platform);
    setShowSocialOptions(false);
  }

  const GENERATION_ACTIONS = [
    ...(hasContentToImprove ? [{ id: 'improve', title: 'Improve', icon: SparklesIcon, onClick: () => handleActionClick('improve') }] : []),
    { id: 'takeaways', title: 'Takeaways', icon: ListBulletIcon, onClick: () => handleActionClick('takeaways') },
    { id: 'description', title: 'Description', icon: DocumentDuplicateIcon, onClick: () => handleActionClick('description') },
    // Social Post is handled separately
    { id: 'ad', title: 'Product Ad', icon: MegaphoneIcon, onClick: () => handleActionClick('ad') },
  ];

  const renderGeneratedContent = () => {
    if (!activeGeneration) {
        return <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">Select an action above to begin.</div>;
    }

    const isLoading = 
        (activeGeneration === 'improve' && props.isGeneratingImproved) ||
        (activeGeneration === 'takeaways' && props.isGeneratingKeyTakeaways) ||
        (activeGeneration === 'description' && props.isGeneratingDescription) ||
        (activeGeneration === 'social' && props.isGeneratingSocialPost) ||
        (activeGeneration === 'ad' && props.isGeneratingProductAd);

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-dashed rounded-full animate-spin border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Generating...</p>
                <button onClick={onCancel} className="mt-2 text-xs text-red-500 hover:underline">Cancel</button>
            </div>
        );
    }
    
    const generatedContentCardProps = {
        onGenerateVideoFromScript: props.onGenerateVideoFromScript,
        onListenToScript: props.onListenToScript,
        isGeneratingScriptAudio: props.isGeneratingScriptAudio,
        scriptAudio: props.scriptAudio,
        onCancel: props.onCancel,
    };

    switch (activeGeneration) {
        case 'improve':
            return props.improvedContent && <GeneratedContentCard content={props.improvedContent} title="AI-Generated Improved Content" titleIcon={SparklesIcon} videoGenerationScript={props.improvedContent} {...generatedContentCardProps} />;
        case 'takeaways':
            return props.keyTakeaways && <KeyTakeawaysCard takeaways={props.keyTakeaways} />;
        case 'description':
            return props.generatedDescription && <GeneratedContentCard content={props.generatedDescription} title="AI-Generated Description" titleIcon={DocumentDuplicateIcon} videoGenerationScript={props.originalScript} {...generatedContentCardProps} />;
        case 'social':
            return props.socialPost && <GeneratedContentCard content={props.socialPost.content} title={`AI-Generated ${props.socialPost.platform} Post`} titleIcon={ShareIcon} videoGenerationScript={props.originalScript} {...generatedContentCardProps} />;
        case 'ad':
            return props.productAd && <GeneratedContentCard content={props.productAd} title="AI-Generated Product Ad" titleIcon={MegaphoneIcon} videoGenerationScript={props.productAd} {...generatedContentCardProps} />;
        default:
            return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <BrainIcon className="h-6 w-6 mr-3 text-indigo-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI Coaching</h3>
            </div>
            {isGeneratingAudio ? (
              <button onClick={onCancel} className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-100 rounded-md">
                  <XCircleIcon className="h-4 w-4 mr-2" /> Cancel
              </button>
            ) : (
              <button onClick={handleListenClick} className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md">
                  <SpeakerPhoneIcon className="h-4 w-4 mr-2" /> Listen
              </button>
            )}
        </div>
        
        <div className="mb-4 grid grid-cols-2 gap-2">
            <select value={feedbackVoice} onChange={(e) => setFeedbackVoice(e.target.value)} className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md">
                {PROFESSIONAL_VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
            </select>
            <select value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)} className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md">
                {VOICE_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
            </select>
        </div>

        {feedbackAudio?.url && (
          <div className="mb-4 flex items-center gap-2">
              <audio ref={audioRef} src={feedbackAudio.url} controls className="w-full" />
              <a href={feedbackAudio.url} download="feedback.mp3" className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"><DownloadIcon className="h-5 w-5" /></a>
          </div>
        )}
        
        {scoreData && <div className="mb-6 flex justify-center"><ScoreGauge score={scoreData.score} label={scoreData.label} /></div>}

        <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button onClick={() => setActiveTab('strengths')} className={`flex-1 p-3 text-sm font-semibold ${activeTab === 'strengths' ? 'text-green-600 border-b-2 border-green-500' : 'text-gray-500'}`}>
                    <ThumbsUpIcon className="h-5 w-5 mx-auto mb-1" />Strengths
                </button>
                <button onClick={() => setActiveTab('opportunities')} className={`flex-1 p-3 text-sm font-semibold ${activeTab === 'opportunities' ? 'text-amber-600 border-b-2 border-amber-500' : 'text-gray-500'}`}>
                     <LightbulbIcon className="h-5 w-5 mx-auto mb-1" />Opportunities
                </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
              {activeTab === 'strengths' && <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">{data.strengths.map((item, index) => (<li key={index}>{item}</li>))}</ul>}
              {activeTab === 'opportunities' && <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">{data.opportunities.map((item, index) => (<li key={index}>{item}</li>))}</ul>}
            </div>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Create from this Analysis</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select an action to generate new content based on the analysis.</p>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
            {GENERATION_ACTIONS.map(action => (
                <ActionButton 
                    key={action.id}
                    icon={action.icon}
                    title={action.title}
                    onClick={action.onClick}
                    isActive={activeGeneration === action.id}
                />
            ))}
             <div className="relative">
                <ActionButton 
                    icon={ShareIcon}
                    title="Social Post"
                    onClick={() => setShowSocialOptions(!showSocialOptions)}
                    isActive={activeGeneration === 'social'}
                />
                {showSocialOptions && (
                    <div className="absolute bottom-full mb-2 w-32 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-lg z-10">
                        {(['X', 'LinkedIn', 'Instagram'] as SocialPlatform[]).map(platform => (
                            <button key={platform} onClick={() => handleSocialPlatformSelect(platform)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">{platform}</button>
                        ))}
                    </div>
                )}
            </div>
        </div>
        <div className="mt-4 -mx-2">{renderGeneratedContent()}</div>
      </div>
    </div>
  );
};