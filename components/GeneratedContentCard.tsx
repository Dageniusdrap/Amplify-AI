import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { SpeakerPhoneIcon } from './icons/SpeakerPhoneIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ShareIcon } from './icons/ShareIcon';

const PROFESSIONAL_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
const VOICE_STYLES = ['Default', 'Cheerful', 'Animated', 'Energetic', 'Calm', 'Authoritative', 'Serious', 'Whispering', 'Storyteller', 'News Anchor'];

interface GeneratedContentCardProps {
  content: string;
  title?: string;
  titleIcon?: React.FC<React.SVGProps<SVGSVGElement>>;
  onGenerateVideoFromScript: (script: string) => void;
  onListenToScript: (script: string, voice: string, style: string) => Promise<void>;
  isGeneratingScriptAudio: boolean;
  scriptAudio: { url: string; blob: Blob } | null;
  onCancel: () => void;
  videoGenerationScript?: string;
}

export const GeneratedContentCard: React.FC<GeneratedContentCardProps> = ({ 
  content, 
  title = "AI-Generated Content",
  titleIcon: TitleIcon = SparklesIcon,
  onGenerateVideoFromScript,
  onListenToScript,
  isGeneratingScriptAudio,
  scriptAudio,
  onCancel,
  videoGenerationScript,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [deliveryVoice, setDeliveryVoice] = useState(PROFESSIONAL_VOICES[0]);
  const [voiceStyle, setVoiceStyle] = useState(VOICE_STYLES[0]);

  useEffect(() => {
    if (scriptAudio?.url && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
    }
  }, [scriptAudio]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(content);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleListenClick = async () => {
    await onListenToScript(content, deliveryVoice, voiceStyle);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <TitleIcon className="h-5 w-5 mr-3 text-indigo-500" />
          <h4 className="text-md font-semibold text-gray-800 dark:text-white">{title}</h4>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Copy"
            >
              {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Download"
            >
              <DownloadIcon className="h-4 w-4" />
            </button>
        </div>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 max-h-60 overflow-y-auto">
        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">{content}</pre>
      </div>
      <div className="p-4 bg-gray-100 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
             <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Audio Generation</label>
                 {isGeneratingScriptAudio ? (
                    <button onClick={onCancel} className="flex items-center px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900">
                        <XCircleIcon className="h-4 w-4 mr-1" /> Cancel
                    </button>
                ) : (
                    <button onClick={handleListenClick} className="flex items-center px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900" aria-label="Listen to script">
                        <SpeakerPhoneIcon className="h-4 w-4 mr-1" /> Listen
                    </button>
                )}
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="script-voice-select" className="sr-only">Select Voice</label>
                  <select 
                      id="script-voice-select"
                      value={deliveryVoice}
                      onChange={(e) => setDeliveryVoice(e.target.value)}
                      className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                      {PROFESSIONAL_VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="script-style-select" className="sr-only">Select Voice Style</label>
                  <select 
                      id="script-style-select"
                      value={voiceStyle}
                      onChange={(e) => setVoiceStyle(e.target.value)}
                      className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                      {VOICE_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                  </select>
                </div>
             </div>
          </div>
          <div className="flex flex-col justify-end">
              <button
                  onClick={() => onGenerateVideoFromScript(videoGenerationScript || content)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
              >
                  <VideoCameraIcon className="h-5 w-5 mr-2" />
                  Generate Video
              </button>
          </div>
        </div>
        {scriptAudio?.url && (
            <div className="pt-2 flex items-center gap-2">
                <audio ref={audioRef} src={scriptAudio.url} controls className="w-full" />
                <a href={scriptAudio.url} download={`${title.toLowerCase().replace(/\s+/g, '_')}_audio.mp3`} className="flex-shrink-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Download audio">
                    <DownloadIcon className="h-5 w-5" />
                </a>
            </div>
        )}
      </div>
    </div>
  );
};
