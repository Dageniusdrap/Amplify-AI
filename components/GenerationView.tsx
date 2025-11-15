import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon } from './icons/ImageIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import { Loader } from './Loader';
// FIX: Imported PromptHistoryItem type to resolve compilation errors.
import { PromptHistoryModal, type PromptHistoryItem } from './PromptHistoryModal';
import { PromptTemplatesModal } from './PromptTemplatesModal';
import { 
    generateViralScript, 
    generateImage, 
    generateVideo,
    generateSpeech,
    extendVideo,
    generateSocialPostFromScript,
    generateSpeechFromText,
    editImage,
    validateApiKey,
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
import { CheckIcon } from './icons/CheckIcon';
import { KeyIcon } from './icons/KeyIcon';
import { SparklesIcon } from './icons/SparklesIcon';


interface GenerationViewProps {
  brandVoice: string;
  onAttemptGenerate: () => boolean;
  onSuccessfulGeneration: () => void;
  initialScript?: string | null;
  onScriptConsumed: () => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

type GenerationType = 'script' | 'image' | 'video' | 'speech';
type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
type VideoAspectRatio = '16:9' | '9:16';
type VideoResolution = '720p' | '1080p';
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

const useSessionStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
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
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
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


const GenerationControls: React.FC<{
    activeTab: GenerationType;
    prompt: string;
    setPrompt: (p: string) => void;
    onOpenTemplates: () => void;
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
    videoDuration: number;
    setVideoDuration: (d: number) => void;
    videoStylePresets: string[];
    setVideoStylePresets: (ss: string[]) => void;
    referenceFrames: { file: File, preview: string }[];
    setReferenceFrames: (f: { file: File, preview: string }[]) => void;
    watermark: string;
    setWatermark: (w: string) => void;
    
    // API Key props
    inputApiKey: string;
    setInputApiKey: (k: string) => void;
    handleValidateKey: () => void;
    isKeyValidating: boolean;
    isKeyValid: boolean;
    keyValidationError: string | null;
    apiKeySet: boolean; // From AI Studio
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
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <strong>1 image:</strong> starting frame. <strong>2 images:</strong> start & end frames. <strong>3 images:</strong> reference assets (requires Veo HD).
                </p>
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

    const ApiKeyManager = () => {
        let statusMessage: string;
        let statusTextColor: string;
        let statusDotColor: string;
    
        if (props.isKeyValidating) {
            statusMessage = "Validating...";
            statusTextColor = "text-yellow-600 dark:text-yellow-400";
            statusDotColor = "bg-yellow-400 animate-pulse";
        } else if (props.isKeyValid) {
            statusMessage = "Manual Key Active";
            statusTextColor = "text-green-600 dark:text-green-400";
            statusDotColor = "bg-green-500";
        } else if (props.apiKeySet) {
            statusMessage = "AI Studio Key Active";
            statusTextColor = "text-green-600 dark:text-green-400";
            statusDotColor = "bg-green-500";
        } else {
            statusMessage = "Key Required";
            statusTextColor = "text-red-600 dark:text-red-400";
            statusDotColor = "bg-red-500";
        }
    
        return (
            <OptionGroup title="API Key">
                <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg space-y-3">
                     <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Status:</span>
                        <div className="flex items-center space-x-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${statusDotColor}`}></div>
                            <span className={`${statusTextColor}`}>{statusMessage}</span>
                        </div>
                    </div>

                    {props.keyValidationError && (
                        <p className="text-xs text-center text-red-500">{props.keyValidationError}</p>
                    )}
                    <div className="flex items-center space-x-2">
                        <input
                            type="password"
                            placeholder="Enter your API Key"
                            value={props.inputApiKey}
                            onChange={(e) => props.setInputApiKey(e.target.value)}
                            className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        />
                        <button 
                            onClick={props.handleValidateKey}
                            disabled={props.isKeyValidating || !props.inputApiKey}
                            className="px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                            {props.isKeyValidating ? '...' : 'Save'}
                        </button>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-400 dark:text-gray-500 text-xs">OR</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <button onClick={props.handleSelectKey} className="w-full p-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                        Select Key with AI Studio
                    </button>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-center block text-gray-400 hover:underline">A key with billing enabled is required. Learn more.</a>
                </div>
            </OptionGroup>
        );
    }


    return (
        <div id="generation-controls" className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-6">
            <OptionGroup title={
                <div className="flex justify-between items-center">
                    <span>Your Creative Prompt</span>
                    {props.activeTab !== 'video' && props.activeTab !== 'speech' && (
                        <button onClick={props.onOpenTemplates} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Templates
                        </button>
                    )}
                </div>
            }>
                <textarea
                    id="prompt-textarea"
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
                            <OptionGroup title={`Target Duration: ${props.videoDuration}s`}>
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    step="1"
                                    value={props.videoDuration}
                                    onChange={(e) => props.setVideoDuration(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                                    <span>5s</span>
                                    <span>60s</span>
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
                                        <button onClick={() => props.setResolution('720p')} className={`p-2 text-sm rounded-md ${props.resolution === '720p' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>HD (720p)</button>
                                        <button onClick={() => props.setResolution('1080p')} disabled={isMultiFrame} className={`p-2 text-sm rounded-md ${props.resolution === '1080p' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'} disabled:opacity-50`}>Full HD (1080p)</button>
                                    </div>
                                </OptionGroup>
                             </div>
                             <OptionGroup title="Watermark (Preview)">
                                <input
                                    type="text"
                                    value={props.watermark}
                                    onChange={(e) => props.setWatermark(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                                    placeholder="e.g., @YourBrand"
                                />
                            </OptionGroup>
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
                            <ApiKeyManager />
                        </div>
                    </details>
                    <details className="space-y-4" open>
                        <summary className="text-lg font-semibold cursor-pointer">Generate Voiceover</summary>
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
                                className="w-full flex items-center justify-center p-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900 disabled:opacity-50"
                            >
                                <PlusCircleIcon className="h-5 w-5 mr-2" />
                                Add Speaker (Max 2)
                            </button>
                         </div>
                    </details>
                </>
            )}

             {props.activeTab === 'speech' && (
                <>
                   <OptionGroup title="Voice Selection">
                        <select 
                            value={props.voiceoverScripts[0]?.voice || PROFESSIONAL_VOICES[0]}
                            onChange={e => props.setVoiceoverScripts([{ ...props.voiceoverScripts[0], id: 1, speaker: 'Speaker 1', voice: e.target.value, script: props.prompt }])}
                            className="w-full p-2 text-sm bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                        >
                            {PROFESSIONAL_VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </OptionGroup>
                </>
            )}
        </div>
    );
};


const ResultCard: React.FC<{ 
    title: string; 
    children: React.ReactNode;
    actions?: React.ReactNode;
}> = ({ title, children, actions }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
            {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
        <div className="p-4">{children}</div>
    </div>
);


const VideoResult: React.FC<{
    video: { url: string, payload: any };
    prompt: string;
    watermark: string;
    onExtend: (prompt: string, payload: any) => void;
    isExtending: boolean;
    onRemix: (remixPrompt: string) => void;
    isRemixing: boolean;
    onCancel: () => void;
    onExportSrt: (duration: number) => void;
    onExportFrame: (videoEl: HTMLVideoElement) => void;
    onUseFrameAsStart: (videoEl: HTMLVideoElement) => void;
    onRemixFromFrame: (videoEl: HTMLVideoElement) => void;
}> = ({ video, prompt, watermark, onExtend, isExtending, onRemix, isRemixing, onCancel, onExportSrt, onExportFrame, onUseFrameAsStart, onRemixFromFrame }) => {
    const [extendPrompt, setExtendPrompt] = useState('');
    const [remixPrompt, setRemixPrompt] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const handleExtend = () => {
        if (extendPrompt.trim()) {
            onExtend(extendPrompt, video.payload);
        }
    };

    const handleRemix = () => {
        if (remixPrompt.trim()) {
            onRemix(remixPrompt);
        }
    };
    
    const handleExportSrt = () => {
        if (videoRef.current) {
            onExportSrt(videoRef.current.duration);
        }
    };

    const handleExportFrame = () => {
        if (videoRef.current) {
            onExportFrame(videoRef.current);
        }
    };

    const handleUseFrameAsStart = () => {
        if (videoRef.current) {
            onUseFrameAsStart(videoRef.current);
        }
    };

    const handleRemixFromFrame = () => {
        if (videoRef.current) {
            onRemixFromFrame(videoRef.current);
        }
    };

    return (
         <div className="space-y-4">
            <div className="relative w-full">
                <video ref={videoRef} src={video.url} controls autoPlay loop className="w-full rounded-lg" />
                {watermark && (
                    <div className="absolute bottom-4 right-4 text-white text-lg font-bold opacity-70 pointer-events-none" style={{ textShadow: '0 0 5px black' }}>
                        {watermark}
                    </div>
                )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-4">
                <details>
                    <summary className="font-semibold cursor-pointer">Remix Video</summary>
                    <div className="mt-2 space-y-2">
                         <textarea
                            rows={2}
                            value={remixPrompt}
                            onChange={e => setRemixPrompt(e.target.value)}
                            className="w-full text-sm p-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                            placeholder="e.g., Make it black and white, add a vintage film grain."
                        />
                        <button 
                            onClick={handleRemix}
                            disabled={isRemixing || !remixPrompt.trim()}
                            className="w-full flex items-center justify-center p-2 text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                        >
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            {isRemixing ? 'Remixing...' : 'Remix Video'}
                        </button>
                    </div>
                </details>
                <details>
                    <summary className="font-semibold cursor-pointer">Extend Video</summary>
                    <div className="mt-2 space-y-2">
                         <textarea
                            rows={2}
                            value={extendPrompt}
                            onChange={e => setExtendPrompt(e.target.value)}
                            className="w-full text-sm p-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md"
                            placeholder="e.g., ...and then a spaceship flies by."
                        />
                        <button 
                            onClick={handleExtend}
                            disabled={isExtending || !extendPrompt.trim()}
                            className="w-full flex items-center justify-center p-2 text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400"
                        >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            {isExtending ? 'Extending...' : 'Extend Video (+7s)'}
                        </button>
                    </div>
                </details>
                 <details>
                    <summary className="font-semibold cursor-pointer">Export &amp; Frame Tools</summary>
                     <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button onClick={handleExportSrt} className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                           <ClosedCaptionIcon className="h-4 w-4 mr-2" /> Download SRT
                        </button>
                         <button onClick={handleExportFrame} className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                           <CameraIcon className="h-4 w-4 mr-2" /> Capture Frame
                        </button>
                        <button onClick={handleUseFrameAsStart} className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                           <ImageIcon className="h-4 w-4 mr-2" /> Use as Start
                        </button>
                         <button onClick={handleRemixFromFrame} className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                           <PencilIcon className="h-4 w-4 mr-2" /> Remix from Frame
                        </button>
                    </div>
                </details>
            </div>
        </div>
    );
};


export const GenerationView: React.FC<GenerationViewProps> = ({ brandVoice, onAttemptGenerate, onSuccessfulGeneration, initialScript, onScriptConsumed, addNotification }) => {
    // Shared State
    const [activeTab, setActiveTab] = useState<GenerationType>('script');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promptHistory, setPromptHistory] = useLocalStorage<PromptHistoryItem[]>('promptHistory', []);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

    // Script State
    const [link, setLink] = useState('');
    const [viralScript, setViralScript] = useState<ViralScript | null>(null);
    const [generatedSocialPost, setGeneratedSocialPost] = useState<string | null>(null);
    const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);
    const [scriptAudio, setScriptAudio] = useState<{ url: string; blob: Blob } | null>(null);
    const [isGeneratingScriptAudio, setIsGeneratingScriptAudio] = useState(false);


    // Image State
    const [imageModel, setImageModel] = useLocalStorage<ImageModel>('imageModel', 'imagen-4.0-generate-001');
    const [imageAspectRatio, setImageAspectRatio] = useLocalStorage<ImageAspectRatio>('imageAspectRatio', '1:1');
    const [imageStylePresets, setImageStylePresets] = useLocalStorage<string[]>('imageStylePresets', []);
    const [imageMimeType, setImageMimeType] = useLocalStorage<ImageMimeType>('imageMimeType', 'image/jpeg');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');
    
    // Video State
    const [videoModel, setVideoModel] = useLocalStorage<VideoModel>('videoModel', 'veo-3.1-fast-generate-preview');
    const [videoAspectRatio, setVideoAspectRatio] = useLocalStorage<VideoAspectRatio>('videoAspectRatio', '16:9');
    const [resolution, setResolution] = useLocalStorage<VideoResolution>('resolution', '1080p');
    const [videoDuration, setVideoDuration] = useLocalStorage<number>('videoDuration', 15);
    const [videoStylePresets, setVideoStylePresets] = useLocalStorage<string[]>('videoStylePresets', []);
    const [referenceFrames, setReferenceFrames] = useState<{ file: File, preview: string }[]>([]);
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string, payload: any } | null>(null);
    const [isExtendingVideo, setIsExtendingVideo] = useState(false);
    const [isRemixing, setIsRemixing] = useState(false);
    const [apiKeySet, setApiKeySet] = useState(false); // For AI Studio selection
    const [inputApiKey, setInputApiKey] = useState('');
    const [validatedApiKey, setValidatedApiKey] = useSessionStorage<string | null>('validatedApiKey', null);
    const [isKeyValidating, setIsKeyValidating] = useState(false);
    const [isKeyValid, setIsKeyValid] = useState(!!validatedApiKey);
    const [keyValidationError, setKeyValidationError] = useState<string | null>(null);
    const [watermark, setWatermark] = useState('');

    // Speech State
    const [voiceoverScripts, setVoiceoverScripts] = useLocalStorage<VoiceoverScript[]>('voiceoverScripts', [
        { id: 1, speaker: 'Speaker 1', script: '', voice: 'Kore' }
    ]);
    const [generatedSpeechUrl, setGeneratedSpeechUrl] = useState<string | null>(null);

    // Initial script from another view
    useEffect(() => {
        if (initialScript) {
            setPrompt(initialScript);
            setActiveTab('video');
            onScriptConsumed();
        }
    }, [initialScript, onScriptConsumed]);
    
    // Check for API key on mount
    useEffect(() => {
        if (activeTab === 'video') {
            window.aistudio?.hasSelectedApiKey().then(setApiKeySet);
        }
    }, [activeTab]);

    useEffect(() => {
      if (error) {
        addNotification(error, 'error');
        setError(null); // Clear local error after passing to global state
      }
    }, [error, addNotification]);

    const addToHistory = (item: Omit<PromptHistoryItem, 'timestamp'>) => {
        const newItem = { ...item, timestamp: new Date().toISOString() };
        setPromptHistory(prev => [newItem, ...prev.slice(0, 99)]); // Keep last 100
    };
    
    const handleSelectFromHistory = (item: PromptHistoryItem) => {
        setActiveTab(item.type);
        setPrompt(item.prompt);
        // Restore all settings from history
        if(item.link) setLink(item.link);
        if(item.imageModel) setImageModel(item.imageModel);
        if(item.aspectRatio) {
            if(item.type === 'image') setImageAspectRatio(item.aspectRatio as ImageAspectRatio);
            if(item.type === 'video') setVideoAspectRatio(item.aspectRatio as VideoAspectRatio);
        }
        if(item.imageStylePresets) setImageStylePresets(item.imageStylePresets);
        if(item.imageMimeType) setImageMimeType(item.imageMimeType);
        if(item.videoModel) setVideoModel(item.videoModel);
        if(item.resolution) setResolution(item.resolution as VideoResolution);
        if(item.videoDuration) setVideoDuration(item.videoDuration as number);
        if(item.videoStylePresets) setVideoStylePresets(item.videoStylePresets);
        if(item.voiceoverScripts) setVoiceoverScripts(item.voiceoverScripts);
        if(item.voice) setVoiceoverScripts([{ id: 1, speaker: 'Speaker 1', script: item.prompt, voice: item.voice }]);

        setIsHistoryOpen(false);
    };

    const resetResults = () => {
        setError(null);
        setViralScript(null);
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setGeneratedSpeechUrl(null);
        setGeneratedSocialPost(null);
        setScriptAudio(null);
    };
    
    const handleGenerate = async () => {
        if (!prompt.trim() && activeTab !== 'speech') {
            setError('Please enter a prompt.');
            return;
        }
        if (activeTab === 'speech' && voiceoverScripts.every(vs => !vs.script.trim()) && !prompt.trim()) {
            setError('Please enter some text for the speech generation.');
            return;
        }

        if (!onAttemptGenerate()) return;
        
        resetResults();
        setIsLoading(true);

        try {
            switch (activeTab) {
                case 'script':
                    const fullPrompt = `${prompt} ${link ? `(Inspired by: ${link})` : ''}`;
                    const scriptText = await generateViralScript(fullPrompt, link, brandVoice);
                    setViralScript(parseViralScript(scriptText));
                    addToHistory({ type: 'script', prompt, link });
                    break;
                case 'image':
                    const imagePrompt = `${prompt} ${imageStylePresets.join(', ')}`;
                    const imageUrl = await generateImage(imagePrompt, imageModel, imageAspectRatio, imageMimeType);
                    setGeneratedImage(imageUrl);
                    addToHistory({ type: 'image', prompt, imageModel, aspectRatio: imageAspectRatio, imageStylePresets, imageMimeType });
                    break;
                case 'video':
                    const apiKey = validatedApiKey || (apiKeySet ? process.env.API_KEY : null);
                    if (!apiKey) {
                        throw new Error("An API key is required for video generation. Please select or enter a valid key.");
                    }
                    const frameData = await Promise.all(referenceFrames.map(async f => {
                        const base64 = await new Promise<string>(resolve => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                            reader.readAsDataURL(f.file);
                        });
                        return { data: base64, mimeType: f.file.type };
                    }));
                    const videoPrompt = `${prompt} ${videoStylePresets.join(', ')}`;
                    const videoResult = await generateVideo(videoPrompt, videoModel, videoDuration, videoAspectRatio, resolution, frameData, apiKey);
                    setGeneratedVideo(videoResult);
                    addToHistory({ type: 'video', prompt, videoModel, aspectRatio: videoAspectRatio, resolution, videoDuration, videoStylePresets, referenceFrameCount: frameData.length });
                    break;
                case 'speech':
                    const scriptsToProcess = prompt.trim() ? [{ id: 1, speaker: 'Speaker 1', script: prompt, voice: voiceoverScripts[0]?.voice || 'Kore' }] : voiceoverScripts;
                    const speechBase64 = await generateSpeech(scriptsToProcess);
                    if(speechBase64) {
                        const audioBlob = pcmToMp3Blob(new Int16Array(decode(speechBase64).buffer), 24000, 1);
                        setGeneratedSpeechUrl(URL.createObjectURL(audioBlob));
                    }
                    addToHistory({ type: 'speech', prompt, voiceoverScripts: scriptsToProcess });
                    break;
            }
            onSuccessfulGeneration();
        } catch (err: any) {
             if (err.message?.includes('API Key validation failed')) {
                // Reset key state if it fails, forcing user to re-select
                setValidatedApiKey(null);
                setIsKeyValid(false);
                setApiKeySet(false);
                setError("Your API Key failed. Please select a valid key with billing enabled and try again.");
            } else {
                setError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGenerateSocialPost = async (script: string) => {
        if (!onAttemptGenerate()) return;
        setIsGeneratingSocialPost(true);
        try {
            const post = await generateSocialPostFromScript(script, brandVoice);
            setGeneratedSocialPost(post);
            onSuccessfulGeneration();
        } catch (err: any) {
             setError(err.message || 'Failed to generate social post.');
        } finally {
            setIsGeneratingSocialPost(false);
        }
    };
    
     const handleListenToScript = async (script: string, voice: string, style: string) => {
        if (!onAttemptGenerate()) return;
        if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
        setScriptAudio(null);
        setIsGeneratingScriptAudio(true);
        try {
            const audioBlob = await generateSpeechFromText(script, voice, style);
            setScriptAudio({ url: URL.createObjectURL(audioBlob), blob: audioBlob });
            onSuccessfulGeneration();
        } catch (err: any) {
            setError(err.message || 'Failed to generate audio for the script.');
        } finally {
            setIsGeneratingScriptAudio(false);
        }
    };
    
    const handleExtendVideo = async (newPrompt: string, payload: any) => {
        if (!onAttemptGenerate()) return;
        setIsExtendingVideo(true);
        setError(null);
        try {
             const apiKey = validatedApiKey || (apiKeySet ? process.env.API_KEY : null);
            if (!apiKey) {
                throw new Error("An API key is required for video generation. Please select or enter a valid key.");
            }
            const extendedVideo = await extendVideo(newPrompt, payload, apiKey);
            setGeneratedVideo(extendedVideo);
            onSuccessfulGeneration();
        } catch(err: any) {
            setError(err.message || 'Failed to extend video.');
        } finally {
            setIsExtendingVideo(false);
        }
    };

    const handleRemixVideo = async (remixPrompt: string) => {
        if (!remixPrompt.trim() || !onAttemptGenerate()) return;
    
        setIsRemixing(true);
        setError(null);
        try {
            const apiKey = validatedApiKey || (apiKeySet ? process.env.API_KEY : null);
            if (!apiKey) {
                throw new Error("An API key is required for video generation.");
            }
            
            // Use the original prompt and append the remix instructions
            const newPrompt = `${prompt}\n\nREMIX INSTRUCTION: ${remixPrompt}`;
            
            // Re-use existing reference frames for the remix
            const frameData = await Promise.all(referenceFrames.map(async f => {
                const base64 = await new Promise<string>(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(f.file);
                });
                return { data: base64, mimeType: f.file.type };
            }));

            const videoResult = await generateVideo(newPrompt, videoModel, videoDuration, videoAspectRatio, resolution, frameData, apiKey);
            
            setGeneratedVideo(videoResult);
            // We update the main prompt so the user can see what was used for the remix
            setPrompt(newPrompt); 
            addToHistory({ type: 'video', prompt: newPrompt, videoModel, aspectRatio: videoAspectRatio, resolution, videoDuration, videoStylePresets, referenceFrameCount: frameData.length });
            onSuccessfulGeneration();
        } catch (err: any) {
            if (err.message?.includes('API Key validation failed')) {
                setValidatedApiKey(null);
                setIsKeyValid(false);
                setApiKeySet(false);
                setError("Your API Key failed. Please select a valid key and try again.");
            } else {
                setError(err.message || 'An unexpected error occurred during remix.');
            }
        } finally {
            setIsRemixing(false);
        }
    };
    
    const handleEditImage = async () => {
        if (!editPrompt.trim() || !generatedImage || !onAttemptGenerate()) return;
        setIsLoading(true);
        setError(null);
        try {
            const [header, base64] = generatedImage.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            const newImageUrl = await editImage(base64, mimeType, editPrompt);
            setGeneratedImage(newImageUrl);
            setEditPrompt('');
            onSuccessfulGeneration();
        } catch(err: any) {
             setError(err.message || 'Failed to edit image.');
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleSelectKey = async () => {
        await window.aistudio?.openSelectKey();
        // Assume success and check again
        const hasKey = await window.aistudio?.hasSelectedApiKey();
        setApiKeySet(hasKey);
        if(hasKey) {
            // Clear manual key if studio key is selected
            setInputApiKey('');
            setValidatedApiKey(null);
            setIsKeyValid(false);
            setKeyValidationError(null);
            addNotification('AI Studio API Key selected.', 'success');
        }
    };

    const handleValidateKey = useCallback(async () => {
        if (!inputApiKey) return;
        setIsKeyValidating(true);
        setKeyValidationError(null);
        try {
            const isValid = await validateApiKey(inputApiKey);
            if (isValid) {
                setValidatedApiKey(inputApiKey);
                setIsKeyValid(true);
                setApiKeySet(false); // Prioritize manual key
                addNotification('Manual API Key is valid and active.', 'success');
            } else {
                setValidatedApiKey(null);
                setIsKeyValid(false);
                setKeyValidationError('This API key is invalid or lacks permissions.');
            }
        } catch(e) {
             setValidatedApiKey(null);
             setIsKeyValid(false);
             setKeyValidationError('Validation failed. Check your network and the key.');
        } finally {
            setIsKeyValidating(false);
        }
    }, [inputApiKey, setValidatedApiKey, addNotification]);
    
    const onExportSrt = (duration: number) => {
        if (!prompt) return;
        const srtContent = exportScriptAsSrt(prompt, duration);
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slugify(prompt)}_subtitles.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const captureFrameAsFile = (videoEl: HTMLVideoElement): Promise<File> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Could not get canvas context"));
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (blob) {
                    const file = new File([blob], `frame_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    resolve(file);
                } else {
                    reject(new Error("Failed to create blob from canvas"));
                }
            }, 'image/jpeg', 0.95);
        });
    };

    const onExportFrame = async (videoEl: HTMLVideoElement) => {
        try {
            const file = await captureFrameAsFile(videoEl);
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch(e) {
            setError((e as Error).message);
        }
    };
    
    const onUseFrameAsStart = async (videoEl: HTMLVideoElement) => {
        try {
            const file = await captureFrameAsFile(videoEl);
            // Revoke old URLs to prevent memory leaks
            referenceFrames.forEach(f => URL.revokeObjectURL(f.preview));
            const newFrame = { file, preview: URL.createObjectURL(file) };
            setReferenceFrames([newFrame]);
            addNotification('Frame set as starting image.', 'success');
        } catch(e) {
            setError((e as Error).message);
        }
    };

    const onRemixFromFrame = async (videoEl: HTMLVideoElement) => {
        try {
            const file = await captureFrameAsFile(videoEl);
            referenceFrames.forEach(f => URL.revokeObjectURL(f.preview));
            const newFrame = { file, preview: URL.createObjectURL(file) };
            setReferenceFrames([newFrame]);
            setPrompt('A new scene, continuing from this image: ');
            addNotification('Remixing from current frame. Describe the new scene!', 'info');
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const TABS: { id: GenerationType, label: string, icon: React.FC<any> }[] = [
        { id: 'script', label: 'Viral Script', icon: MagicWandIcon },
        { id: 'image', label: 'Image', icon: ImageIcon },
        { id: 'video', label: 'Video', icon: VideoCameraIcon },
        { id: 'speech', label: 'Speech', icon: SpeakerWaveIcon },
    ];

    const currentPrompt = activeTab === 'speech'
        ? (prompt.trim() || voiceoverScripts.map(vs => vs.script).join(' '))
        : prompt;

    return (
        <div className="space-y-8">
            {isTemplatesModalOpen && (
                <PromptTemplatesModal
                    onClose={() => setIsTemplatesModalOpen(false)}
                    onSelect={(template) => {
                        setPrompt(template);
                        setIsTemplatesModalOpen(false);
                    }}
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Left Column: Controls */}
                <div className="md:col-span-1 space-y-4">
                    <div id="generation-type-tabs" className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                        {TABS.map(({ id, label }) => (
                            <button key={id} onClick={() => setActiveTab(id)} className={`w-full py-2 text-sm font-semibold rounded-md ${activeTab === id ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>{label}</button>
                        ))}
                    </div>
                    
                    <GenerationControls
                        activeTab={activeTab}
                        prompt={prompt} setPrompt={setPrompt}
                        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
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
                        inputApiKey={inputApiKey} setInputApiKey={setInputApiKey}
                        isKeyValid={isKeyValid} isKeyValidating={isKeyValidating}
                        keyValidationError={keyValidationError} handleValidateKey={handleValidateKey}
                        voiceoverScripts={voiceoverScripts} setVoiceoverScripts={setVoiceoverScripts}
                        watermark={watermark} setWatermark={setWatermark}
                    />

                    <button 
                        id="generate-button"
                        onClick={handleGenerate} 
                        disabled={isLoading || isExtendingVideo || isRemixing}
                        className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-bold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {isLoading ? 'Generating...' : `Generate ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    </button>
                    
                    <button onClick={() => setIsHistoryOpen(true)} className="w-full flex items-center justify-center p-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        View Prompt History
                    </button>
                </div>
                {/* Right Column: Results */}
                <div id="generation-results-panel" className="md:col-span-2">
                    {(isLoading && !isExtendingVideo && !isRemixing) && <Loader message="Your content is being generated..." onCancel={() => setIsLoading(false)} />}
                    
                    {viralScript && <ViralScriptCard 
                        scriptData={{...viralScript, socialPost: generatedSocialPost || viralScript.socialPost}}
                        onGenerateVideoFromScript={(script) => { setPrompt(script); setActiveTab('video'); }}
                        onGenerateThumbnail={(concept) => { setActiveTab('image'); setPrompt(concept); }}
                        onGenerateThumbnailFromHeader={() => { setActiveTab('image'); setPrompt(viralScript.titles[0] || viralScript.description); }}
                        onGenerateSocialPost={handleGenerateSocialPost}
                        isGeneratingSocialPost={isGeneratingSocialPost}
                        onListenToScript={handleListenToScript}
                        isGeneratingScriptAudio={isGeneratingScriptAudio}
                        scriptAudio={scriptAudio}
                        onCancelScriptAudio={() => setIsGeneratingScriptAudio(false)}
                    />}
                    
                    {generatedImage && (
                        <ResultCard title="Generated Image">
                            <img src={generatedImage} alt={prompt} className="w-full rounded-lg" />
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-2">
                                <h4 className="font-semibold">Edit Image</h4>
                                <textarea rows={2} value={editPrompt} onChange={e => setEditPrompt(e.target.value)} className="w-full text-sm p-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md" placeholder="e.g., Now make it nighttime..." />
                                <button onClick={handleEditImage} className="w-full p-2 text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">Apply Edit</button>
                            </div>
                        </ResultCard>
                    )}

                    {generatedVideo && <ResultCard title="Generated Video" actions={
                        <a href={generatedVideo.url} download={`${slugify(prompt)}.mp4`} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Download</a>
                    }>
                        <VideoResult 
                            video={generatedVideo} 
                            prompt={prompt}
                            watermark={watermark}
                            onExtend={handleExtendVideo}
                            isExtending={isExtendingVideo}
                            onRemix={handleRemixVideo}
                            isRemixing={isRemixing}
                            onCancel={() => { setIsExtendingVideo(false); setIsRemixing(false); }}
                            onExportSrt={onExportSrt}
                            onExportFrame={onExportFrame}
                            onUseFrameAsStart={onUseFrameAsStart}
                            onRemixFromFrame={onRemixFromFrame}
                        />
                    </ResultCard>}
                    
                    {generatedSpeechUrl && (
                        <ResultCard title="Generated Speech" actions={
                             <a href={generatedSpeechUrl} download={`${slugify(currentPrompt)}.mp3`} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Download MP3</a>
                        }>
                            <audio src={generatedSpeechUrl} controls autoPlay className="w-full" />
                        </ResultCard>
                    )}

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