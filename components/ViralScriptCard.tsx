import React, { useState, useRef, useEffect } from 'react';
import type { ViralScript } from '../types';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ShareIcon } from './icons/ShareIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpeakerPhoneIcon } from './icons/SpeakerPhoneIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ImageIcon } from './icons/ImageIcon';
import { exportBlueprintAsTxt } from '../utils/export';

interface ViralScriptCardProps {
  scriptData: ViralScript;
  onGenerateVideoFromScript: (script: string) => void;
  onGenerateThumbnail: (concept: string) => void;
  onGenerateThumbnailFromHeader: () => void;
  onGenerateSocialPost: (script: string) => Promise<void>;
  isGeneratingSocialPost: boolean;
  onListenToScript: (script: string, voice: string, style: string) => Promise<void>;
  isGeneratingScriptAudio: boolean;
  scriptAudio: { url: string; blob: Blob } | null;
  onCancelScriptAudio: () => void;
}

const PROFESSIONAL_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
const VOICE_STYLES = ['Default', 'Cheerful', 'Animated', 'Energetic', 'Calm', 'Authoritative', 'Serious', 'Whispering', 'Storyteller', 'News Anchor'];

const AccordionSection: React.FC<{ title: string, children: React.ReactNode, actions?: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, actions, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">{title}</h4>
                <div className="flex items-center">
                    {actions && <div className="mr-4" onClick={e => e.stopPropagation()}>{actions}</div>}
                    <ChevronDownIcon className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export const ViralScriptCard: React.FC<ViralScriptCardProps> = ({ 
    scriptData, 
    onGenerateVideoFromScript,
    onGenerateThumbnail,
    onGenerateThumbnailFromHeader,
    onGenerateSocialPost,
    isGeneratingSocialPost,
    onListenToScript,
    isGeneratingScriptAudio,
    scriptAudio,
    onCancelScriptAudio,
}) => {
    const { titles, description, tags, thumbnailConcepts, script, storyboard, monetization, socialPost } = scriptData;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [deliveryVoice, setDeliveryVoice] = useState(PROFESSIONAL_VOICES[0]);
    const [voiceStyle, setVoiceStyle] = useState(VOICE_STYLES[0]);
    
    useEffect(() => {
        if (scriptAudio?.url && audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
        }
    }, [scriptAudio]);
    
    const handleListenClick = async () => {
        await onListenToScript(script, deliveryVoice, voiceStyle);
    };

    const handleDownloadBlueprint = () => {
        const content = exportBlueprintAsTxt(scriptData);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'viral_video_blueprint.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Viral Video Blueprint</h3>
                <div className="flex items-center space-x-2">
                    <button onClick={handleDownloadBlueprint} className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Blueprint
                    </button>
                    <button onClick={onGenerateThumbnailFromHeader} className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Thumbnail
                    </button>
                </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
                {titles.length > 0 && (
                    <AccordionSection title="Clickable Titles" defaultOpen>
                        <ul>{titles.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </AccordionSection>
                )}
                {description && (
                    <AccordionSection 
                        title="SEO Description" 
                        defaultOpen
                        actions={
                            <button 
                                onClick={() => onGenerateSocialPost(script)} 
                                disabled={isGeneratingSocialPost}
                                className="flex items-center px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-md hover:bg-green-200 dark:hover:bg-green-900 disabled:opacity-50"
                            >
                                <ShareIcon className="h-4 w-4 mr-2" />
                                {isGeneratingSocialPost ? 'Generating...' : 'Generate Post'}
                            </button>
                        }
                    >
                        <p>{description.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
                    </AccordionSection>
                )}
                 {socialPost && (
                    <AccordionSection title="Generated Social Post" defaultOpen>
                        <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                             <pre className="whitespace-pre-wrap font-sans">{socialPost}</pre>
                        </div>
                    </AccordionSection>
                )}
                {tags.length > 0 && (
                     <AccordionSection title="Discoverability Tags">
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </AccordionSection>
                )}
                {thumbnailConcepts.length > 0 && (
                    <AccordionSection title="Thumbnail Concepts">
                         <ul className="space-y-2">
                            {thumbnailConcepts.map((concept, i) => (
                                <li key={i} className="flex justify-between items-center">
                                    <span>{concept}</span>
                                    <button 
                                        onClick={() => onGenerateThumbnail(concept)}
                                        className="flex-shrink-0 ml-4 flex items-center px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200"
                                    >
                                        <SparklesIcon className="h-3 w-3 mr-1" />
                                        Generate
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </AccordionSection>
                )}
                 {script && (
                    <AccordionSection title="Engaging Video Script" defaultOpen>
                         <pre className="whitespace-pre-wrap font-sans">{script}</pre>
                    </AccordionSection>
                )}
                {script && (
                    <AccordionSection title="Voiceover Studio">
                        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">Listen to this Script</label>
                                {isGeneratingScriptAudio ? (
                                    <button onClick={onCancelScriptAudio} className="flex items-center px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900">
                                        <XCircleIcon className="h-4 w-4 mr-1" /> Cancel
                                    </button>
                                ) : (
                                    <button onClick={handleListenClick} className="flex items-center px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900" aria-label="Listen to script">
                                        <SpeakerPhoneIcon className="h-4 w-4 mr-1" /> Listen
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    value={deliveryVoice}
                                    onChange={(e) => setDeliveryVoice(e.target.value)}
                                    className="w-full p-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {PROFESSIONAL_VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                                </select>
                                <select 
                                    value={voiceStyle}
                                    onChange={(e) => setVoiceStyle(e.target.value)}
                                    className="w-full p-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {VOICE_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                                </select>
                            </div>
                            {scriptAudio?.url && (
                                <div className="pt-2 flex items-center gap-2">
                                    <audio ref={audioRef} src={scriptAudio.url} controls className="w-full" />
                                    <a href={scriptAudio.url} download="script_audio.mp3" className="flex-shrink-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Download audio">
                                        <DownloadIcon className="h-5 w-5" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </AccordionSection>
                )}
                 {storyboard && (
                    <AccordionSection title="Frame Flow / Storyboard">
                        <pre className="whitespace-pre-wrap font-sans">{storyboard}</pre>
                    </AccordionSection>
                )}
                 {monetization && (
                    <AccordionSection title="Monetization Strategy">
                        <pre className="whitespace-pre-wrap font-sans">{monetization}</pre>
                    </AccordionSection>
                )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => onGenerateVideoFromScript(script)}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                >
                    <VideoCameraIcon className="h-5 w-5 mr-3" />
                    Generate Video From This Script
                </button>
            </div>
        </div>
    );
};