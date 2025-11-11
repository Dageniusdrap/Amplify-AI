import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon } from './icons/ImageIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import { Loader } from './Loader';
import { PromptHistoryModal, PromptHistoryItem } from './PromptHistoryModal';
import { 
    generateViralScript, 
    generateImage, 
    generateVideo,
    generateSpeech,
    extendVideo,
    generateSocialPostFromScript,
    generateSpeechFromText,
    editImage,
} from '../services/geminiService';
import { pcmToMp3Blob, decode } from '../utils/audio';
import { exportScriptAsSrt } from '../utils/export';
import { parseViralScript } from '../utils/parsing';
import type { VoiceoverScript, ViralScript } from '../types';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { InfoIcon } from './icons/InfoIcon';
import { ViralScriptCard } from './ViralScriptCard';
import { ClosedCaptionIcon } from './icons/ClosedCaptionIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CameraIcon } from './icons/CameraIcon';


interface GenerationViewProps {
  brandVoice: string;
  onAttemptGenerate: () => boolean;
  onSuccessfulGeneration: () => void;
  initialScript?: string | null;
  onScriptConsumed: () => void;
}

type GenerationType = 'script' | 'image' | 'video' | 'speech';
type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type VideoAspectRatio = '16:9' | '9:16';
type VideoResolution = '720p' | '1080p';
type VideoDuration = 'short' | 'medium' | 'long';
type ImageModel = 'imagen-4.0-generate-001' | 'gemini-2.5-flash-image';
type VideoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
type ImageMimeType = 'image/jpeg' | 'image/png';

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .substring(0, 50); // Truncate to 50 chars
};


const OptionGroup: React.FC<{ title: string | React.ReactNode; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{title}</h4>
        {children}
    </div>
);

const PROMPT_TEMPLATES = [
    { name: 'Product Review Script', template: 'Create a YouTube script reviewing [Product Name]. Start with a strong hook, cover 3 key features, discuss pros and cons, and end with a clear recommendation for [Target Audience].' },
    { name: 'Explainer Video Concept', template: 'Develop a concept for a short explainer video about [Topic]. The style should be simple and animated. Break down the topic into 3 simple steps.' },
    { name: 'Cinematic B-Roll Shot', template: 'A cinematic, slow-motion shot of [Subject], with dramatic lighting and a shallow depth of field.' },
    { name: 'Podcast Intro TTS', template: 'Welcome to the [Podcast Name] show, where we explore [Topic]. In today\'s episode, we\'re diving deep into [Episode Subject]. Let\'s get started.' },
];


const GenerationControls: React.FC<{
    activeTab: GenerationType;
    prompt: string;
    setPrompt: (p: string) => void;
    link: string;
    setLink: (l: string) => void;
    imageModel: ImageModel;
    setImageModel: (m: ImageModel) => void;
    imageAspectRatio: ImageAspectRatio;
    setImageAspectRatio: (ar: ImageAspectRatio) => void;
    imageStylePresets: string[];
    setImageStylePresets: (ss: string[]) => void;
    imageMimeType: ImageMimeType;
    setImageMimeType: (mt: ImageMimeType) => void;
    videoModel: VideoModel;
    setVideoModel: (vm: VideoModel) => void;
    videoAspectRatio: VideoAspectRatio;
    setVideoAspectRatio: (ar: VideoAspectRatio) => void;
    resolution: VideoResolution;
    setResolution: (r: VideoResolution) => void;
    videoDuration: VideoDuration;
    setVideoDuration: (d: VideoDuration) => void;
    videoStylePresets: string[];
    setVideoStylePresets: (ss: string[]) => void;
    referenceFrames: { file: File, preview: string }[];
    setReferenceFrames: (f: { file: File, preview: string }[]) => void;
    apiKeySet: boolean;
    handleSelectKey: () => void;
    voiceoverScripts: VoiceoverScript[];
    setVoiceoverScripts: (vs: VoiceoverScript[]) => void;
}> = (props) => {
    
    const IMAGE_STYLE_PRESETS = ['Photorealistic', 'Cinematic', 'Anime', 'Fantasy', 'Digital Art', '3D Render', 'Watercolor', 'Sketch', 'Pixel Art', 'Low Poly', 'Cyberpunk', 'Steampunk', 'Vintage', 'Minimalist'];
    const VIDEO_STYLE_PRESETS = ['Cinematic', 'Drone Shot', 'Time-lapse', 'Black and White', 'Hyper-realistic', 'Animated', 'Documentary', 'Vaporwave', 'Claymation'];
    const PROFESSIONAL_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
    
    const toggleStylePreset = (
        preset: string, 
        currentStyles: string[], 
        setter: (styles: string[]) => void
    ) => {
        const newStyles = currentStyles.includes(preset)
            ? currentStyles.filter(s => s !== preset)
            : [...currentStyles, preset];
        setter(newStyles);
    };

    const addVoiceoverScript = () => {
        if (props.voiceoverScripts.length >= 2) return;
        const newId = (props.voiceoverScripts.reduce((maxId, item) => Math.max(item.id, maxId), 0) || 0) + 1;
        const nextVoice = PROFESSIONAL_VOICES[props.voiceoverScripts.length % PROFESSIONAL_VOICES.length];
        props.setVoiceoverScripts([
            ...props.voiceoverScripts,
            { id: newId, speaker: `Speaker ${newId}`, script: '', voice: nextVoice }
        ]);
    };

    const removeVoiceoverScript = (id: number) => {
        props.setVoiceoverScripts(props.voiceoverScripts.filter(vs => vs.id !== id));
    };

    const updateVoiceoverScript = (id: number, updated: Partial<VoiceoverScript>) => {
        props.setVoiceoverScripts(props.voiceoverScripts.map(vs =>
            vs.id === id ? { ...vs, ...updated } : vs
        ));
    };
    
    const handleAddReferenceFrame = (file: File | null) => {
        if (file && props.referenceFrames.length < 3) {
            const newFrame = { file, preview: URL.createObjectURL(file) };
            props.setReferenceFrames([...props.referenceFrames, newFrame]);
        }
    };

    const handleRemoveReferenceFrame = (index: number) => {
        const frameToRemove = props.referenceFrames[index];
        URL.revokeObjectURL(frameToRemove.preview);
        props.setReferenceFrames(props.referenceFrames.filter((_, i) => i !== index));
    };

    const ReferenceImageUploader: React.FC = () => {
        const inputRef = useRef<HTMLInputElement>(null);

        const getFrameLabel = (index: number, count: number) => {
            if (count === 1) return 'Start Image';
            if (count === 2) return index === 0 ? 'Start Image' : 'End Image';
            if (count >= 3) return `Asset ${index + 1}`;
            return '';
        };
    
        return (
            <div>
                 <div className="grid grid-cols-3 gap-2 mb-2">
                    {props.referenceFrames.map((frame, index) => (
                        <div key={index} className="relative h-20">
                            <img src={frame.preview} alt={`Reference ${index+1}`} className="w-full h-full object-cover rounded-md" />
                             <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-white text-center text-[10px] font-semibold">{getFrameLabel(index, props.referenceFrames.length)}</div>
                            <button
                                onClick={() => handleRemoveReferenceFrame(index)}
                                className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white shadow-md"
                            >
                                <XIcon className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
                {props.referenceFrames.length < 3 && (
                    <button 
                        className="w-full flex flex-col items-center justify-center px-6 py-4 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:border-indigo-500"
                        onClick={() => inputRef.current?.click()}
                    >
                        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleAddReferenceFrame(e.target.files?.[0] ?? null)} />
                        <UploadIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-xs text-gray-500">Add Reference Image ({props.referenceFrames.length}/3)</p>
                    </button>
                )}
            </div>
        );
    };

    const isMultiFrame = props.referenceFrames.length > 1;

    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-6">
            <OptionGroup title="Your Creative Prompt">
                <textarea
                    rows={props.activeTab === 'script' ? 8 : (props.activeTab === 'speech' ? 8 : 4)}
                    value={props.prompt}
                    onChange={(e) => props.setPrompt(e.target.value)}
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                    placeholder={
                        props.activeTab === 'speech' 
                        ? "Enter the text you want to convert to speech..."
                        : "e.g., A futuristic cityscape at sunset, synthwave style..."
                    }
                />
            </OptionGroup>
            
             {props.activeTab === 'script' && (
                <OptionGroup title="Inspiration Link (Optional)">
                    <div className="relative">
                        <input
                            type="text"
                            value={props.link}
                            onChange={(e) => props.setLink(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                            placeholder="e.g., https://youtube.com/watch?v=..."
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center group cursor-pointer">
                            <InfoIcon className="h-5 w-5 text-gray-400" />
                             <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                The AI uses this link for context but can't access it directly. For best results, paste key text from the link into your main prompt!
                            </div>
                        </div>
                    </div>
                </OptionGroup>
            )}

            {props.activeTab !== 'video' && props.activeTab !== 'speech' && (
                <details className="space-y-2">
                    <summary className="text-sm font-semibold cursor-pointer text-gray-600 dark:text-gray-400">Prompt Helper</summary>
                    <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-2">
                        <p className="text-xs text-gray-500">Get started with a template:</p>
                        <div className="flex flex-wrap gap-2">
                            {PROMPT_TEMPLATES.map(template => (
                                <button
                                    key={template.name}
                                    onClick={() => props.setPrompt(template.template)}
                                    className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-700 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </details>
            )}

            {props.activeTab === 'image' && (
                <>
                    <OptionGroup title="Image Model">
                        <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => props.setImageModel('imagen-4.0-generate-001')} className={`p-2 text-sm rounded-md ${props.imageModel === 'imagen-4.0-generate-001' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Imagen 4.0 (HD)</button>
                           <button onClick={() => props.setImageModel('gemini-2.5-flash-image')} className={`p-2 text-sm rounded-md ${props.imageModel === 'gemini-2.5-flash-image' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Nano Banana (Fast)</button>
                        </div>
                    </OptionGroup>
                    <OptionGroup title="Aspect Ratio">
                        <div className="grid grid-cols-5 gap-2 text-xs">
                            {(['1:1', '16:9', '9:16', '4:3', '3:4'] as ImageAspectRatio[]).map(ar => (
                                <button key={ar} onClick={() => props.setImageAspectRatio(ar)} className={`p-2 rounded-md ${props.imageAspectRatio === ar ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{ar}</button>
                            ))}
                        </div>
                    </OptionGroup>
                    <OptionGroup title={
                        <div className="flex justify-between items-center">
                            <span>Style Presets</span>
                            {props.imageStylePresets.length > 0 && 
                                <button onClick={() => props.setImageStylePresets([])} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Clear</button>
                            }
                        </div>
                    }>
                         <div className="flex flex-wrap gap-2">
                            {IMAGE_STYLE_PRESETS.map(preset => (
                                 <button key={preset} onClick={() => toggleStylePreset(preset, props.imageStylePresets, props.setImageStylePresets)} className={`px-3 py-1 text-xs rounded-full ${props.imageStylePresets.includes(preset) ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{preset}</button>
                            ))}
                        </div>
                    </OptionGroup>
                     <OptionGroup title="Export Format">
                        <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => props.setImageMimeType('image/jpeg')} className={`p-2 text-sm rounded-md ${props.imageMimeType === 'image/jpeg' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>JPEG</button>
                           <button onClick={() => props.setImageMimeType('image/png')} className={`p-2 text-sm rounded-md ${props.imageMimeType === 'image/png' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>PNG</button>
                        </div>
                    </OptionGroup>
                </>
            )}

            {props.activeTab === 'video' && (
                 <>
                    <details className="space-y-4" open>
                       <summary className="text-lg font-semibold cursor-pointer">Director's Toolkit</summary>
                       <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-6">
                            <OptionGroup title="Reference Images">
                               <ReferenceImageUploader />
                            </OptionGroup>
                            {isMultiFrame && (
                                <div className="p-3 text-xs text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-lg">
                                    Multi-frame generation requires <strong>Veo HD</strong>, <strong>16:9</strong> aspect ratio, and <strong>720p</strong> quality. These settings have been automatically applied.
                                </div>
                            )}
                            <OptionGroup title="Video Model">
                                <div className="grid grid-cols-2 gap-2">
                                   <button onClick={() => props.setVideoModel('veo-3.1-fast-generate-preview')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.videoModel === 'veo-3.1-fast-generate-preview' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>Veo 3.1 Fast</button>
                                   <button onClick={() => props.setVideoModel('veo-3.1-generate-preview')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.videoModel === 'veo-3.1-generate-preview' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>Veo 3.1 HD</button>
                                </div>
                            </OptionGroup>
                            <OptionGroup title="Target Duration">
                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={() => props.setVideoDuration('short')} className={`p-2 text-sm rounded-md ${props.videoDuration === 'short' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Short (~15s)</button>
                                    <button onClick={() => props.setVideoDuration('medium')} className={`p-2 text-sm rounded-md ${props.videoDuration === 'medium' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Medium (~30s)</button>
                                    <button onClick={() => props.setVideoDuration('long')} className={`p-2 text-sm rounded-md ${props.videoDuration === 'long' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Long (~60s)</button>
                                </div>
                            </OptionGroup>
                             <div className="grid grid-cols-2 gap-4">
                                 <OptionGroup title="Aspect Ratio">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => props.setVideoAspectRatio('16:9')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.videoAspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>16:9</button>
                                        <button onClick={() => props.setVideoAspectRatio('9:16')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.videoAspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>9:16</button>
                                    </div>
                                </OptionGroup>
                                <OptionGroup title="Quality">
                                    <div className="grid grid-cols-1 gap-2">
                                        <button onClick={() => props.setResolution('720p')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.resolution === '720p' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>HD (720p)</button>
                                        <button onClick={() => props.setResolution('1080p')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.resolution === '1080p' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>Full HD (1080p)</button>
                                    </div>
                                </OptionGroup>
                             </div>
                            <OptionGroup title={
                                <div className="flex justify-between items-center">
                                    <span>Style Presets</span>
                                    {props.videoStylePresets.length > 0 && 
                                        <button onClick={() => props.setVideoStylePresets([])} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Clear</button>
                                    }
                                </div>
                            }>
                                <div className="flex flex-wrap gap-2">
                                    {VIDEO_STYLE_PRESETS.map(preset => (
                                        <button key={preset} onClick={() => toggleStylePreset(preset, props.videoStylePresets, props.setVideoStylePresets)} className={`px-3 py-1 text-xs rounded-full ${props.videoStylePresets.includes(preset) ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{preset}</button>
                                    ))}
                                </div>
                            </OptionGroup>
                            <OptionGroup title="API Key">
                               <button onClick={props.handleSelectKey} className={`w-full p-2 text-sm rounded-md ${props.apiKeySet ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                   {props.apiKeySet ? 'API Key Selected' : 'Select API Key'}
                               </button>
                           </OptionGroup>
                        </div>
                    </details>
                    <details className="space-y-4" open>
                        <summary className="text-lg font-semibold cursor-pointer">Voiceover Settings</summary>
                         <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                            {props.voiceoverScripts.map((vs) => (
                                <div key={vs.id} className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <input 
                                            type="text" 
                                            value={vs.speaker} 
                                            onChange={e => updateVoiceoverScript(vs.id, { speaker: e.target.value })} 
                                            className="text-sm font-semibold bg-transparent"
                                        />
                                        <button onClick={() => removeVoiceoverScript(vs.id)}><XIcon className="h-4 w-4 text-gray-500"/></button>
                                    </div>
                                    <textarea 
                                        rows={2} 
                                        value={vs.script}
                                        onChange={e => updateVoiceoverScript(vs.id, { script: e.target.value })}
                                        className="w-full text-sm p-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                                        placeholder={`Script for ${vs.speaker}...`}
                                    />
                                     <select
                                        value={vs.voice}
                                        onChange={e => updateVoiceoverScript(vs.id, { voice: e.target.value })}
                                        className="w-full mt-2 p-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                                    >
                                        {PROFESSIONAL_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            ))}
                            <button 
                                onClick={addVoiceoverScript} 
                                disabled={props.voiceoverScripts.length >= 2}
                                className="w-full p-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                            >
                                Add Speaker
                            </button>
                            {props.voiceoverScripts.length >= 2 && <p className="text-xs text-center text-gray-500">Multi-speaker supports a maximum of two voices.</p>}
                         </div>
                    </details>
                 </>
            )}

             {props.activeTab === 'speech' && (
                <OptionGroup title="Voice Selection">
                     <select
                        value={props.voiceoverScripts[0]?.voice || PROFESSIONAL_VOICES[0]}
                        onChange={e => props.setVoiceoverScripts([{...props.voiceoverScripts[0], id: 1, speaker: 'Speaker 1', script: props.prompt, voice: e.target.value}])}
                        className="w-full mt-2 p-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                    >
                        {PROFESSIONAL_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </OptionGroup>
            )}
        </div>
    );
};

const GenerationCanvas: React.FC<{
    activeTab: GenerationType,
    isLoading: boolean,
    error: string | null,
    generationWarning: string | null,
    generatedContent: any | null,
    parsedScript: ViralScript | null,
    generatedAudio: { url: string, blob: Blob, format: 'mp3' | 'wav' } | null,
    generatedVideo: string | null,
    prompt: string,
    videoDuration: VideoDuration,
    voiceoverScripts: VoiceoverScript[],
    onGenerateVideoFromScript: (script: string) => void,
    onGenerateThumbnail: (concept: string) => void;
    onGenerateThumbnailFromHeader: () => void;
    onGenerateSocialPost: (script: string) => Promise<void>,
    isGeneratingSocialPost: boolean,
    previousVideoPayload: any | null,
    onExtendVideo: () => Promise<void>,
    isExtending: boolean,
    extendPrompt: string,
    setExtendPrompt: (prompt: string) => void,
    onListenToScript: (script: string, voice: string, style: string) => Promise<void>,
    isGeneratingScriptAudio: boolean,
    scriptAudio: { url: string; blob: Blob } | null,
    onCancelScriptAudio: () => void,
    onStartEdit: (imageDataUrl: string) => void,
    onExportFrame: (videoEl: HTMLVideoElement | null, fileName: string) => void,
}> = ({ 
    activeTab, 
    isLoading, 
    error, 
    generationWarning, 
    generatedContent,
    parsedScript,
    generatedAudio, 
    generatedVideo, 
    prompt, 
    videoDuration, 
    voiceoverScripts,
    onGenerateVideoFromScript,
    onGenerateThumbnail,
    onGenerateThumbnailFromHeader,
    onGenerateSocialPost,
    isGeneratingSocialPost,
    previousVideoPayload,
    onExtendVideo,
    isExtending,
    extendPrompt,
    setExtendPrompt,
    onListenToScript,
    isGeneratingScriptAudio,
    scriptAudio,
    onCancelScriptAudio,
    onStartEdit,
    onExportFrame,
}) => {
    
    const slug = slugify(prompt || 'generated-content');
    const videoScript = voiceoverScripts.map(vs => vs.script).join('\n\n');
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleDownloadSrt = () => {
        if (!videoScript) return;

        const durationMap: Record<VideoDuration, number> = {
            short: 15,
            medium: 30,
            long: 60,
        };
        const duration = durationMap[videoDuration];
        const srtContent = exportScriptAsSrt(videoScript, duration);
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}_script.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader message="Your content is being generated..." /></div>;
    }
    if (error) {
        return (
             <div className="h-full flex items-center justify-center p-4">
                <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center" role="alert">
                    <strong className="font-bold">Generation Failed</strong>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }
     if (generationWarning) {
        return (
             <div className="h-full flex items-center justify-center p-4">
                <div className="w-full bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg text-center" role="alert">
                    <strong className="font-bold">Generation Notice</strong>
                    <p className="text-sm">{generationWarning}</p>
                </div>
            </div>
        );
    }
    if (parsedScript) {
        return (
            <div className="p-4 h-full overflow-y-auto">
                <ViralScriptCard 
                    scriptData={parsedScript} 
                    onGenerateVideoFromScript={onGenerateVideoFromScript}
                    onGenerateThumbnail={onGenerateThumbnail}
                    onGenerateThumbnailFromHeader={onGenerateThumbnailFromHeader}
                    onGenerateSocialPost={onGenerateSocialPost}
                    isGeneratingSocialPost={isGeneratingSocialPost}
                    onListenToScript={onListenToScript}
                    isGeneratingScriptAudio={isGeneratingScriptAudio}
                    scriptAudio={scriptAudio}
                    onCancelScriptAudio={onCancelScriptAudio}
                />
            </div>
        )
    }
    if (generatedContent && activeTab === 'image') {
        return (
            <div className="p-4 h-full overflow-y-auto">
                <div className="space-y-4">
                    <img src={generatedContent as string} alt="Generated" className="rounded-lg shadow-lg w-full" />
                    <div className="grid grid-cols-2 gap-2">
                        <a href={generatedContent as string} download={`${slug}_image.png`} className="w-full block text-center p-2 bg-indigo-600 text-white rounded-md">Download Image</a>
                        <button onClick={() => onStartEdit(generatedContent as string)} className="w-full flex items-center justify-center text-center p-2 bg-purple-600 text-white rounded-md">
                            <PencilIcon className="h-4 w-4 mr-2" /> Edit This Image
                        </button>
                    </div>
                </div>
            </div>
        )
    }
     if (generatedVideo) {
         return (
             <div className="p-4 h-full overflow-y-auto">
                <div className="space-y-4">
                    <video ref={videoRef} src={generatedVideo} controls className="rounded-lg shadow-lg w-full" />
                    <div className="grid grid-cols-3 gap-2">
                        <a href={generatedVideo} download={`${slug}_video.mp4`} className="w-full block text-center p-2 bg-indigo-600 text-white rounded-md text-sm">Download Video</a>
                        <button onClick={() => onExportFrame(videoRef.current, slug)} className="w-full flex items-center justify-center text-center p-2 bg-gray-600 text-white rounded-md text-sm">
                            <CameraIcon className="h-4 w-4 mr-2" /> Export Frame
                        </button>
                        <button onClick={handleDownloadSrt} disabled={!videoScript} className="w-full flex items-center justify-center text-center p-2 bg-gray-600 text-white rounded-md disabled:opacity-50 text-sm">
                            <ClosedCaptionIcon className="h-4 w-4 mr-2" /> Download SRT
                        </button>
                    </div>
                </div>
                 {generatedAudio && (
                     <div className="mt-6 space-y-4">
                         <h4 className="font-semibold text-center">Generated Voiceover</h4>
                         <audio src={generatedAudio.url} controls className="w-full" />
                         <a href={generatedAudio.url} download={`${slug}_voiceover.${generatedAudio.format}`} className="w-full block text-center p-2 bg-green-600 text-white rounded-md">Download Voiceover</a>
                     </div>
                 )}
                 {previousVideoPayload && (
                    <div className="mt-6 p-4 bg-gray-200 dark:bg-gray-800/50 rounded-lg space-y-3">
                        <h4 className="font-semibold text-center text-lg">Extend Your Video</h4>
                        <p className="text-xs text-center text-gray-500">Describe the next scene to add ~7 seconds. Extension requires the Veo HD model and 720p resolution.</p>
                        <textarea
                            rows={2}
                            value={extendPrompt}
                            onChange={(e) => setExtendPrompt(e.target.value)}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                            placeholder="e.g., A close up of the cat's face as it smiles."
                        />
                        <button 
                            onClick={onExtendVideo}
                            disabled={isExtending || !extendPrompt}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400"
                        >
                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                            {isExtending ? 'Extending...' : 'Generate Extension'}
                        </button>
                    </div>
                 )}
            </div>
         );
    }

     if (generatedAudio) {
         return (
             <div className="p-4 h-full flex flex-col items-center justify-center">
                 <div className="space-y-4 w-full max-w-sm">
                     <h4 className="font-semibold text-center">Generated Speech</h4>
                     <audio src={generatedAudio.url} controls className="w-full" />
                     <a href={generatedAudio.url} download={`${slug}_speech.${generatedAudio.format}`} className="w-full block text-center p-2 bg-indigo-600 text-white rounded-md">Download Audio (MP3)</a>
                 </div>
            </div>
         );
    }
    
    return (
        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-8">
            <MagicWandIcon className="h-16 w-16 mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold">Your creations will appear here</h3>
            <p className="text-sm">Configure your options on the left and click "Generate" to start.</p>
        </div>
    );
}

export const GenerationView: React.FC<GenerationViewProps> = ({ brandVoice, onAttemptGenerate, onSuccessfulGeneration, initialScript, onScriptConsumed }) => {
  const [activeTab, setActiveTab] = useState<GenerationType>('script');
  const [prompt, setPrompt] = useState('');
  const [link, setLink] = useState('');
  
  // Image State
  const [imageModel, setImageModel] = useState<ImageModel>('imagen-4.0-generate-001');
  const [imageAspectRatio, setImageAspectRatio] = useState<ImageAspectRatio>('1:1');
  const [imageStylePresets, setImageStylePresets] = useState<string[]>([]);
  const [imageMimeType, setImageMimeType] = useState<ImageMimeType>('image/png');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  // Video State
  const [videoModel, setVideoModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [videoDuration, setVideoDuration] = useState<VideoDuration>('medium');
  const [videoStylePresets, setVideoStylePresets] = useState<string[]>([]);
  const [referenceFrames, setReferenceFrames] = useState<{ file: File, preview: string }[]>([]);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [previousVideoPayload, setPreviousVideoPayload] = useState<any | null>(null);
  const [extendPrompt, setExtendPrompt] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  // Speech State
  const [voiceoverScripts, setVoiceoverScripts] = useState<VoiceoverScript[]>([]);
  
  // General State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationWarning, setGenerationWarning] = useState<string | null>(null);
  const cancelRequestRef = useRef(false);
  
  // Results
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [parsedScript, setParsedScript] = useState<ViralScript | null>(null);
  const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string, blob: Blob, format: 'wav' | 'mp3' } | null>(null);
  const [scriptAudio, setScriptAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [isGeneratingScriptAudio, setIsGeneratingScriptAudio] = useState(false);
  
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [promptHistory, setPromptHistory] = useLocalStorage<PromptHistoryItem[]>('generationPromptHistoryV3', []);
  const [isFromScript, setIsFromScript] = useState(false);
  
  useEffect(() => {
    return () => {
      referenceFrames.forEach(f => URL.revokeObjectURL(f.preview));
      if (generatedVideo) URL.revokeObjectURL(generatedVideo);
      if (generatedAudio) URL.revokeObjectURL(generatedAudio.url);
      if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
    }
  }, [referenceFrames, generatedVideo, generatedAudio, scriptAudio]);
  
  useEffect(() => {
    if (initialScript) {
        // Pre-fill state for video generation
        setActiveTab('video');
        setPrompt(initialScript);
        // Set the script as the first voiceover line
        setVoiceoverScripts([{ id: 1, speaker: 'Narrator', script: initialScript, voice: 'Kore' }]);
        onScriptConsumed(); // Clear the script from parent state so it's not reused on re-renders
        setIsFromScript(true);
    }
  }, [initialScript, onScriptConsumed]);

  const resetGenerationState = () => {
    setError(null);
    setGenerationWarning(null);
    setGeneratedContent(null);
    setParsedScript(null);
    setGeneratedVideo(null);
    if (generatedAudio) URL.revokeObjectURL(generatedAudio.url);
    setGeneratedAudio(null);
    if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
    setScriptAudio(null);
    setPreviousVideoPayload(null);
    setExtendPrompt('');
    setIsEditingImage(false);
    setImageToEdit(null);
    setEditPrompt('');
  };

  const resetForNewTab = (tab: GenerationType) => {
    setPrompt('');
    setLink('');
    setImageStylePresets([]);
    setVideoStylePresets([]);
    setReferenceFrames([]);
    setVoiceoverScripts(tab === 'speech' ? [{ id: 1, speaker: 'Speaker 1', script: '', voice: 'Kore' }] : []);
    setIsLoading(false);
    setIsExtending(false);
    setIsGeneratingScriptAudio(false);
    setActiveTab(tab);
    resetGenerationState();
    setIsFromScript(false);
  };

  const handleSelectKey = async () => {
      if ((window as any).aistudio) {
          await (window as any).aistudio.openSelectKey();
          setApiKeySet(true); // Assume success to avoid race conditions
      }
  };

  const fileToBase64 = (file: File) => new Promise<{ data: string, mimeType: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve({ data: result.split(',')[1], mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
  
  const handleGenerateVideoFromScript = (script: string) => {
    resetForNewTab('video');
    setPrompt(script);
    setVoiceoverScripts([{ id: 1, speaker: 'Narrator', script: script, voice: 'Kore' }]);
    setIsFromScript(true);
  };

  const handleGenerateThumbnail = (concept: string) => {
    resetForNewTab('image');
    setPrompt(concept);
    setImageAspectRatio('16:9'); // Default to a good thumbnail ratio
  };
  
  const handleGenerateThumbnailFromHeader = () => {
    if (parsedScript?.thumbnailConcepts?.[0]) {
      handleGenerateThumbnail(parsedScript.thumbnailConcepts[0]);
    } else {
      setError("No thumbnail concepts were found in the generated script.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleGenerateSocialPostFromScript = async (script: string) => {
    if (!script || isGeneratingSocialPost) return;
    if (!onAttemptGenerate()) return;

    setIsGeneratingSocialPost(true);
    try {
        const post = await generateSocialPostFromScript(script, brandVoice);
        setParsedScript(prev => prev ? { ...prev, socialPost: post } : null);
        onSuccessfulGeneration();
    } catch (err: any) {
        setError(err.message || 'Failed to generate social post.');
    } finally {
        setIsGeneratingSocialPost(false);
    }
  };

  const handleListenToScript = async (script: string, voice: string, style: string) => {
    if (!script) return;
    if (!onAttemptGenerate()) return;

    if (scriptAudio) {
        URL.revokeObjectURL(scriptAudio.url);
        setScriptAudio(null);
    }
    
    cancelRequestRef.current = false;
    setIsGeneratingScriptAudio(true);
    setError(null);
    
    try {
        const audioBlob = await generateSpeechFromText(script, voice, style);
        if (cancelRequestRef.current) return;
        
        const url = URL.createObjectURL(audioBlob);
        setScriptAudio({ url, blob: audioBlob });
        onSuccessfulGeneration();

    } catch (err: any) {
        if (cancelRequestRef.current) return;
        setError(err.message || 'Failed to generate audio for the script.');
    } finally {
        setIsGeneratingScriptAudio(false);
    }
  };

  const handleCancelScriptAudio = () => {
    cancelRequestRef.current = true;
    setIsGeneratingScriptAudio(false);
  };
  
  const handleStartEdit = (imageDataUrl: string) => {
      setIsEditingImage(true);
      setImageToEdit(imageDataUrl);
      setGeneratedContent(imageDataUrl);
  };
  
  const handleCancelEdit = () => {
      setIsEditingImage(false);
      setImageToEdit(null);
      setEditPrompt('');
  };
  
  const handleExportFrame = (videoEl: HTMLVideoElement | null, fileName: string) => {
      if (!videoEl) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${fileName}_frame_at_${Math.floor(videoEl.currentTime)}s.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };


  const handleGenerate = async () => {
    if (isEditingImage) {
        if (!editPrompt.trim() || !imageToEdit) {
            setError("Please enter an edit prompt.");
            return;
        }
    } else {
        const promptToUse = activeTab === 'speech' ? voiceoverScripts[0]?.script || '' : prompt;
        if (!promptToUse.trim() && activeTab !== 'video' && voiceoverScripts.every(vs => !vs.script.trim())) {
            setError('Please enter a prompt or script.');
            return;
        }
    }

    if (!onAttemptGenerate()) return;

    if (activeTab === 'video') {
        const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
        if (!hasKey) {
            await handleSelectKey();
             const hasKeyAfter = await (window as any).aistudio?.hasSelectedApiKey();
             if(!hasKeyAfter) {
                setError("An API key is required for video generation.");
                return;
             }
        }
        setApiKeySet(true);
    }

    setIsLoading(true);
    if (!isEditingImage) {
        resetGenerationState();
    } else {
        setError(null);
        setGenerationWarning(null);
    }

    try {
      let result: any = null;
      let historyItem: Partial<PromptHistoryItem> = { prompt, timestamp: new Date().toISOString() };
      
      if (isEditingImage && imageToEdit) {
          const [header, base64Data] = imageToEdit.split(',');
          const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
          result = await editImage(base64Data, mimeType, editPrompt);
          setGeneratedContent(result);
          setImageToEdit(result);
          setEditPrompt('');
          historyItem = { prompt: `Original: "${prompt}". Edit: "${editPrompt}"`, type: 'image' };
      } else {
          const combinedImageStyles = imageStylePresets.join(', ');
          const imagePrompt = `${prompt}${combinedImageStyles ? `. Style: ${combinedImageStyles}` : ''}`;
          
          const combinedVideoStyles = videoStylePresets.join(', ');
          const durationTextMap: Record<VideoDuration, string> = { short: 'approximately 15 seconds long', medium: 'approximately 30 seconds long', long: 'approximately 60 seconds long' };
          const durationText = durationTextMap[videoDuration];
          const videoPrompt = `A high-quality video of: ${prompt}${combinedVideoStyles ? `. Style: ${combinedVideoStyles}` : ''}. The video should be ${durationText}. Aspect ratio should be ${videoAspectRatio}.`;

          switch (activeTab) {
            case 'script':
              result = await generateViralScript(prompt, link, brandVoice);
              setGeneratedContent(result);
              setParsedScript(parseViralScript(result));
              historyItem = { ...historyItem, type: 'script', link };
              break;
            case 'image':
              result = await generateImage(imagePrompt, imageModel, imageAspectRatio, imageMimeType);
              setGeneratedContent(result);
              historyItem = { ...historyItem, type: 'image', imageModel, aspectRatio: imageAspectRatio, imageStylePresets, imageMimeType };
              break;
            case 'video':
                const isMultiFrame = referenceFrames.length > 1;
                const finalVideoModel = isMultiFrame ? 'veo-3.1-generate-preview' : videoModel;
                const finalAspectRatio = isMultiFrame ? '16:9' : videoAspectRatio;
                const finalResolution = isMultiFrame ? '720p' : resolution;
                
                const referenceFramesData = await Promise.all(referenceFrames.map(f => fileToBase64(f.file)));
                const videoPromise = generateVideo(videoPrompt, finalVideoModel, finalAspectRatio, finalResolution, referenceFramesData);
                
                const validVoiceoverScripts = voiceoverScripts.filter(vs => vs.script.trim());
                const audioPromise = validVoiceoverScripts.length > 0 ? generateSpeech(validVoiceoverScripts) : Promise.resolve(null);
                
                const [{url: videoResult, videoPayload}, audioResult] = await Promise.all([videoPromise, audioPromise]);
                
                setGeneratedVideo(videoResult);
                setPreviousVideoPayload(videoPayload);

                if(audioResult) {
                    const audioPcm = new Int16Array(decode(audioResult).buffer);
                    const audioBlob = pcmToMp3Blob(audioPcm, 24000, 1);
                    setGeneratedAudio({ url: URL.createObjectURL(audioBlob), blob: audioBlob, format: 'mp3' });
                }

                historyItem = { ...historyItem, type: 'video', videoModel, resolution, videoDuration, aspectRatio: videoAspectRatio, videoStylePresets, referenceFrameCount: referenceFrames.length, voiceoverScripts };
                break;
            case 'speech':
                const speechScript = { id: 1, speaker: 'Speaker 1', script: prompt, voice: voiceoverScripts[0]?.voice || 'Kore' };
                result = await generateSpeech([speechScript]);
                const speechPcm = new Int16Array(decode(result).buffer);
                const audioBlob = pcmToMp3Blob(speechPcm, 24000, 1);
                setGeneratedAudio({ url: URL.createObjectURL(audioBlob), blob: audioBlob, format: 'mp3' });
                historyItem = { ...historyItem, type: 'speech', voice: speechScript.voice };
                break;
          }
      }
      setPromptHistory(prev => [historyItem as PromptHistoryItem, ...prev.slice(0, 99)]);
      onSuccessfulGeneration();
      setIsFromScript(false);
    } catch (err: any) {
        if (err.name === 'ModerationError') {
             setGenerationWarning(err.message);
        } else {
             setError(err.message || 'An unexpected error occurred during generation.');
             if (err.message.includes("API Key validation failed")) {
                setApiKeySet(false);
             }
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleExtendVideo = async () => {
    if (!extendPrompt || !previousVideoPayload) return;
    if (!onAttemptGenerate()) return;

    setIsExtending(true);
    setError(null);
    setGenerationWarning(null);

    try {
        const { url: newVideoUrl, videoPayload: newVideoPayload } = await extendVideo(extendPrompt, previousVideoPayload);
        
        if (generatedVideo) URL.revokeObjectURL(generatedVideo); // Clean up old video object URL
        
        setGeneratedVideo(newVideoUrl);
        setPreviousVideoPayload(newVideoPayload); // The new video can also be extended
        setExtendPrompt('');
        onSuccessfulGeneration();

    } catch (err: any) {
         if (err.name === 'ModerationError') {
             setGenerationWarning(err.message);
        } else {
             setError(err.message || 'An unexpected error occurred during extension.');
        }
    } finally {
        setIsExtending(false);
    }
  };

  const handleSelectFromHistory = (item: PromptHistoryItem) => {
    resetForNewTab(item.type);
    setPrompt(item.prompt);
    if(item.type === 'script') setLink(item.link || '');
    if(item.type === 'image') {
        setImageModel(item.imageModel || 'imagen-4.0-generate-001');
        setImageAspectRatio((item.aspectRatio || '1:1') as ImageAspectRatio);
        setImageStylePresets(item.imageStylePresets || []);
        setImageMimeType(item.imageMimeType || 'image/png');
    }
    if(item.type === 'video') {
        setVideoModel(item.videoModel || 'veo-3.1-fast-generate-preview');
        setResolution(item.resolution || '720p');
        setVideoDuration(item.videoDuration || 'medium');
        setVideoAspectRatio((item.aspectRatio || '16:9') as VideoAspectRatio);
        setVideoStylePresets(item.videoStylePresets || []);
        setVoiceoverScripts(item.voiceoverScripts?.map((vs, i) => ({ ...vs, id: i + 1 })) || []);
        // Note: we don't restore reference frames or previous videos from history
    }
    if(item.type === 'speech') {
        setVoiceoverScripts([{ id: 1, speaker: 'Speaker 1', script: item.prompt, voice: item.voice || 'Kore' }]);
    }
    setIsHistoryOpen(false);
  };
  

  const generationTabs = [
    { id: 'script', label: 'Viral Script', icon: MagicWandIcon },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'video', label: 'Video', icon: VideoCameraIcon },
    { id: 'speech', label: 'Text-to-Speech', icon: SpeakerWaveIcon },
  ];

  return (
    <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6">
            {generationTabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => resetForNewTab(tab.id as GenerationType)}
                className={`w-full flex items-center justify-center px-2 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 ${
                activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-pressed={activeTab === tab.id}
            >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
            </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold">Creative Controls</h3>
                     <button onClick={() => setIsHistoryOpen(true)} className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                        <ClockIcon className="h-5 w-5 mr-1" />
                        History
                    </button>
                </div>
                {isFromScript && (
                    <div className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/50 border-l-4 border-indigo-500 rounded-r-lg text-indigo-800 dark:text-indigo-200 flex justify-between items-center">
                        <p className="text-sm">
                            <span className="font-semibold">Script Loaded:</span> Ready for video generation.
                        </p>
                        <button onClick={() => setIsFromScript(false)} className="p-1 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <GenerationControls 
                    activeTab={activeTab}
                    prompt={prompt} setPrompt={setPrompt}
                    link={link} setLink={setLink}
                    imageModel={imageModel} setImageModel={setImageModel}
                    imageAspectRatio={imageAspectRatio} setImageAspectRatio={setImageAspectRatio}
                    imageStylePresets={imageStylePresets} setImageStylePresets={setImageStylePresets}
                    imageMimeType={imageMimeType} setImageMimeType={setImageMimeType}
                    videoModel={videoModel} setVideoModel={setVideoModel}
                    videoAspectRatio={videoAspectRatio} setVideoAspectRatio={setVideoAspectRatio}
                    resolution={resolution} setResolution={setResolution}
                    videoDuration={videoDuration} setVideoDuration={setVideoDuration}
                    videoStylePresets={videoStylePresets} setVideoStylePresets={setVideoStylePresets}
                    referenceFrames={referenceFrames} setReferenceFrames={setReferenceFrames}
                    apiKeySet={apiKeySet} handleSelectKey={handleSelectKey}
                    voiceoverScripts={voiceoverScripts} setVoiceoverScripts={setVoiceoverScripts}
                />
                 {isEditingImage && (
                    <div className="mt-4 p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg space-y-2 border border-purple-300 dark:border-purple-700">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-purple-800 dark:text-purple-200 flex items-center">
                                <PencilIcon className="h-5 w-5 mr-2"/>
                                Image Edit Mode
                            </h4>
                            <button onClick={handleCancelEdit} className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline">Cancel</button>
                        </div>
                        <textarea 
                            rows={2}
                            value={editPrompt}
                            onChange={e => setEditPrompt(e.target.value)}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                            placeholder="e.g., Make the sky night time, add a cat..."
                        />
                    </div>
                )}
                 <button onClick={handleGenerate} disabled={isLoading} className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed">
                    {isLoading ? 'Generating...' : (isEditingImage ? 'Generate Edit' : 'Generate')}
                </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-lg min-h-[500px]">
               <GenerationCanvas 
                    activeTab={activeTab}
                    isLoading={isLoading}
                    error={error}
                    generationWarning={generationWarning}
                    generatedContent={generatedContent}
                    parsedScript={parsedScript}
                    generatedAudio={generatedAudio}
                    generatedVideo={generatedVideo}
                    prompt={prompt}
                    videoDuration={videoDuration}
                    voiceoverScripts={voiceoverScripts}
                    onGenerateVideoFromScript={handleGenerateVideoFromScript}
                    onGenerateThumbnail={handleGenerateThumbnail}
                    onGenerateThumbnailFromHeader={handleGenerateThumbnailFromHeader}
                    onGenerateSocialPost={handleGenerateSocialPostFromScript}
                    isGeneratingSocialPost={isGeneratingSocialPost}
                    previousVideoPayload={previousVideoPayload}
                    onExtendVideo={handleExtendVideo}
                    isExtending={isExtending}
                    extendPrompt={extendPrompt}
                    setExtendPrompt={setExtendPrompt}
                    onListenToScript={handleListenToScript}
                    isGeneratingScriptAudio={isGeneratingScriptAudio}
                    scriptAudio={scriptAudio}
                    onCancelScriptAudio={handleCancelScriptAudio}
                    onStartEdit={handleStartEdit}
                    onExportFrame={handleExportFrame}
               />
            </div>
        </div>

        <PromptHistoryModal 
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={promptHistory}
            onSelect={handleSelectFromHistory}
            onClear={() => setPromptHistory([])}
            onDelete={(timestamp) => setPromptHistory(prev => prev.filter(item => item.timestamp !== timestamp))}
        />
    </div>
  );
};
