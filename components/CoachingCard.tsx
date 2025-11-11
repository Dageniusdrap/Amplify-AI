import React, { useState, useEffect, useRef } from 'react';
import type { FeedbackCardData } from '../types';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { BrainIcon } from './icons/BrainIcon';
import type { AnalysisType } from './AnalysisTypeSelector';
import { ScoreGauge } from './ScoreGauge';
import { XCircleIcon } from './icons/XCircleIcon';
import { SpeakerPhoneIcon } from './icons/SpeakerPhoneIcon';
import { DownloadIcon } from './icons/DownloadIcon';

const PROFESSIONAL_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
const VOICE_STYLES = ['Default', 'Cheerful', 'Animated', 'Energetic', 'Calm', 'Authoritative', 'Serious', 'Whispering', 'Storyteller', 'News Anchor'];

interface FeedbackCardProps {
  data: FeedbackCardData;
  analysisType: AnalysisType;
  scoreData?: { score: number; label: string };
  onListenToFeedback: (voice: string, style: string) => Promise<void>;
  isGeneratingAudio: boolean;
  feedbackAudio: { url: string; blob: Blob } | null;
  onCancel?: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ 
  data, 
  analysisType, 
  scoreData,
  onListenToFeedback,
  isGeneratingAudio,
  feedbackAudio,
  onCancel,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [feedbackVoice, setFeedbackVoice] = useState(PROFESSIONAL_VOICES[0]);
  const [voiceStyle, setVoiceStyle] = useState(VOICE_STYLES[0]);

  useEffect(() => {
    // Autoplay when audio URL is set
    if (feedbackAudio?.url && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
    }
  }, [feedbackAudio]);

  const handleListenClick = async () => {
    await onListenToFeedback(feedbackVoice, voiceStyle);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
       <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <BrainIcon className="h-6 w-6 mr-3 text-indigo-500" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI Feedback Card</h3>
          </div>
          {onCancel && isGeneratingAudio ? (
            <button onClick={onCancel} className="flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900">
                <XCircleIcon className="h-4 w-4 mr-2" /> Cancel
            </button>
        ) : (
            <button onClick={handleListenClick} className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900" aria-label="Listen to feedback">
                <SpeakerPhoneIcon className="h-4 w-4 mr-2" /> Listen
            </button>
        )}
      </div>
      
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="voice-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Voice</label>
          <select 
              id="voice-select"
              value={feedbackVoice}
              onChange={(e) => setFeedbackVoice(e.target.value)}
              className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
              {PROFESSIONAL_VOICES.map(voice => <option key={voice} value={voice}>{voice}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="style-select" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Voice Style</label>
          <select 
              id="style-select"
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
              {VOICE_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
          </select>
        </div>
      </div>

       {feedbackAudio?.url && (
         <div className="mb-4 flex items-center gap-2">
            <audio ref={audioRef} src={feedbackAudio.url} controls className="w-full" />
            <a href={feedbackAudio.url} download="feedback_audio.mp3" className="flex-shrink-0 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Download audio feedback">
                <DownloadIcon className="h-5 w-5" />
            </a>
         </div>
       )}
      
      {scoreData && (
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 flex justify-center">
            <ScoreGauge score={scoreData.score} label={scoreData.label} />
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h4 className="flex items-center text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
            <ThumbsUpIcon className="h-5 w-5 mr-2" />
            Key Strengths
          </h4>
          {data.strengths && data.strengths.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              {data.strengths.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific strengths were identified in this analysis.</p>
          )}
        </div>

        <div>
          <h4 className="flex items-center text-lg font-semibold text-amber-600 dark:text-amber-400 mb-2">
            <LightbulbIcon className="h-5 w-5 mr-2" />
            Improvement Opportunities
          </h4>
          {data.opportunities && data.opportunities.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
              {data.opportunities.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No specific improvement opportunities were identified.</p>
          )}
        </div>
      </div>
    </div>
  );
};