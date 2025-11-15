import React, { useRef, useState, useEffect } from 'react';
import type { TranscriptEntry } from '../types';
import { AudioPlayer, AudioPlayerRef } from './AudioPlayer';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { KeyDecisionIcon } from './icons/KeyDecisionIcon';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { SpeakerTimeline } from './SpeakerTimeline';

interface TranscriptProps {
  transcript: TranscriptEntry[];
  mediaUrl?: string | null;
  mediaFile?: File | null;
  highlightedTimeLabel?: string | null;
  isSalesCall?: boolean;
  speakerARole?: 'me' | 'client';
  speakerBRole?: 'me' | 'client';
  onSpeakerARoleChange?: (role: 'me' | 'client') => void;
  onSpeakerBRoleChange?: (role: 'me' | 'client') => void;
}

const formatTime = (seconds?: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const HandShakeIcon: React.FC<any> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);
const LightbulbIcon: React.FC<any> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a14.994 14.994 0 01-3.75 0M9.75 15.75A2.25 2.25 0 0112 13.5a2.25 2.25 0 012.25 2.25m-4.5 0V11.25A2.25 2.25 0 0112 9a2.25 2.25 0 012.25 2.25v.093m-4.5 0h4.5m-4.5 0a2.25 2.25 0 01-2.25-2.25V15m2.25-2.25a2.25 2.25 0 00-2.25-2.25V15m2.25-2.25V9.75A2.25 2.25 0 0112 7.5a2.25 2.25 0 012.25 2.25v.093" />
    </svg>
);

const TAG_CONFIG: { [key: string]: { icon: React.FC<any>, color: string, label: string } } = {
    'Action Item': { icon: ClipboardCheckIcon, color: 'blue', label: 'Action Item' },
    'Objection': { icon: ExclamationTriangleIcon, color: 'red', label: 'Objection' },
    'Viral Moment': { icon: SparklesIcon, color: 'yellow', label: 'Viral Moment' },
    'Key Decision': { icon: KeyDecisionIcon, color: 'purple', label: 'Key Decision' },
    'Positive Sentiment': { icon: ThumbsUpIcon, color: 'green', label: 'Positive' },
    'Negative Sentiment': { icon: ThumbsDownIcon, color: 'orange', label: 'Negative' },
    'Needs Discovery': { icon: LightbulbIcon, color: 'teal', label: 'Discovery' },
    'Rapport Building': { icon: HandShakeIcon, color: 'pink', label: 'Rapport' },
};

const TagBadge: React.FC<{ tag: string }> = ({ tag }) => {
    const config = Object.entries(TAG_CONFIG).find(([key]) => tag.toLowerCase().includes(key.toLowerCase()))?.[1];

    if (!config) {
        return <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 rounded-full">{tag}</span>;
    }

    const { icon: Icon, color, label } = config;
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
        pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    };
    
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
        </span>
    );
};

const parseTimeLabel = (label: string | null): [number, number] | null => {
    if (!label) return null;
    const match = label.match(/(\d+)-(\d+)s/);
    if (match) {
        return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }
    // Handle edge case for labels like "33-48s" where the start is inclusive of the previous end
     const singleMatch = label.match(/(\d+)s/);
     if(singleMatch) {
         return [parseInt(singleMatch[1], 10), parseInt(singleMatch[1], 10) + 15]; // Assume 15s block
     }
    return null;
};

const RoleSelector: React.FC<{ role: 'me' | 'client', onChange: (newRole: 'me' | 'client') => void }> = ({ role, onChange }) => (
    <select
        value={role}
        onChange={(e) => onChange(e.target.value as 'me' | 'client')}
        onClick={(e) => e.stopPropagation()}
        className="text-xs font-bold bg-transparent border-0 rounded-md focus:ring-0 p-0 pr-6"
    >
        <option value="me">Me</option>
        <option value="client">Client</option>
    </select>
);

export const Transcript: React.FC<TranscriptProps> = ({ transcript, mediaUrl, mediaFile, highlightedTimeLabel, isSalesCall, speakerARole, speakerBRole, onSpeakerARoleChange, onSpeakerBRoleChange }) => {
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasTimestamps = transcript.length > 0 && transcript[0].startTime !== undefined;
  const highlightedRange = parseTimeLabel(highlightedTimeLabel);

  useEffect(() => {
    if (activeIndex !== null && scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
      if (activeElement) {
        // Check if element is in view
        const parentRect = scrollContainerRef.current.getBoundingClientRect();
        const childRect = activeElement.getBoundingClientRect();
        if (childRect.top < parentRect.top || childRect.bottom > parentRect.bottom) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeIndex]);

  const getSpeakerName = (speaker: string) => {
    if (speaker.toUpperCase() === 'A') return speakerARole === 'me' ? 'Me' : 'Client';
    if (speaker.toUpperCase() === 'B') return speakerBRole === 'me' ? 'Me' : 'Client';
    return speaker.charAt(0).toUpperCase() + speaker.slice(1).toLowerCase();
  };
  
  const handleEntryClick = (startTime?: number) => {
    if (hasTimestamps && typeof startTime === 'number' && audioPlayerRef.current) {
      audioPlayerRef.current.seek(startTime);
    }
  };

  const handleTimeUpdate = (time: number) => {
    if (!hasTimestamps) return;
    const newIndex = transcript.findIndex(entry => 
      typeof entry.startTime === 'number' && typeof entry.endTime === 'number' &&
      time >= entry.startTime && time < entry.endTime
    );

    if (newIndex !== -1 && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  return (
    <div className="p-4 space-y-1">
      {mediaUrl && (
        <div className="mb-4">
          <AudioPlayer 
            ref={audioPlayerRef} 
            src={mediaUrl}
            file={mediaFile || undefined}
            onTimeUpdate={hasTimestamps ? handleTimeUpdate : undefined}
          />
        </div>
      )}
      {isSalesCall && hasTimestamps && (
          <div className="mb-4 px-4">
            <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Speaker Timeline</h4>
            <SpeakerTimeline transcript={transcript} speakerARole={speakerARole!} speakerBRole={speakerBRole!} />
          </div>
      )}
      <div ref={scrollContainerRef} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        {transcript.map((entry, index) => {
          const isActive = hasTimestamps && activeIndex === index;
          const isSpeakerA = entry.speaker === 'A';
          const interactionClasses = hasTimestamps && mediaUrl ? 'cursor-pointer' : '';
          
          const isHoverHighlighted = highlightedRange && 
            typeof entry.startTime === 'number' && 
            typeof entry.endTime === 'number' &&
            // Check for any overlap between the entry's time and the highlighted range
            Math.max(entry.startTime, highlightedRange[0]) < Math.min(entry.endTime, highlightedRange[1]);

          let backgroundClass = '';
          if (isActive) {
            backgroundClass = 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-400';
          } else if (isHoverHighlighted) {
            backgroundClass = 'bg-yellow-100 dark:bg-yellow-900/40';
          }

          return (
            <div
              key={index}
              data-index={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${interactionClasses} ${backgroundClass}`}
              onClick={() => handleEntryClick(entry.startTime)}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSpeakerA ? (speakerARole === 'me' ? 'bg-indigo-500 text-white' : 'bg-green-500 text-white') : (speakerBRole === 'me' ? 'bg-indigo-500 text-white' : 'bg-green-500 text-white')}`}>
                  {isSpeakerA ? (speakerARole === 'me' ? <UserCircleIcon className="w-5 h-5" /> : <BuildingOfficeIcon className="w-5 h-5" />) : (speakerBRole === 'me' ? <UserCircleIcon className="w-5 h-5" /> : <BuildingOfficeIcon className="w-5 h-5" />)}
              </div>

              {/* Content */}
              <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                           {isSalesCall && onSpeakerARoleChange && onSpeakerBRoleChange ? (
                              isSpeakerA ? 
                              <RoleSelector role={speakerARole!} onChange={(newRole) => {
                                  onSpeakerARoleChange(newRole);
                                  if(newRole === 'client') onSpeakerBRoleChange('me');
                              }} />
                              :
                              <RoleSelector role={speakerBRole!} onChange={(newRole) => {
                                  onSpeakerBRoleChange(newRole);
                                  if(newRole === 'me') onSpeakerARoleChange('client');
                              }} />
                           ) : getSpeakerName(entry.speaker)}
                      </p>
                      {hasTimestamps && (
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">
                              {formatTime(entry.startTime)}
                          </span>
                      )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.text}</p>
                  {entry.tags && entry.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                          {entry.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                      </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};