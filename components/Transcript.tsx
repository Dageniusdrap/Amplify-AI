import React, { useRef, useState, useEffect } from 'react';
import type { TranscriptEntry } from '../types';
import { AudioPlayer, AudioPlayerRef } from './AudioPlayer';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface TranscriptProps {
  transcript: TranscriptEntry[];
  mediaUrl?: string | null;
  mediaFile?: File | null;
}

const formatTime = (seconds?: number) => {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const Transcript: React.FC<TranscriptProps> = ({ transcript, mediaUrl, mediaFile }) => {
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasTimestamps = transcript.length > 0 && transcript[0].startTime !== undefined;

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
    if (speaker.toUpperCase() === 'A') return 'Salesperson';
    if (speaker.toUpperCase() === 'B') return 'Client';
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
      time >= entry.startTime && time <= entry.endTime
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
      <div ref={scrollContainerRef} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        {transcript.map((entry, index) => {
          const isActive = hasTimestamps && activeIndex === index;
          const isSpeakerA = entry.speaker === 'A';
          const interactionClasses = hasTimestamps && mediaUrl ? 'cursor-pointer' : '';
          
          return (
            <div
              key={index}
              data-index={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${interactionClasses} ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-400' : ''}`}
              onClick={() => handleEntryClick(entry.startTime)}
            >
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSpeakerA ? 'bg-gray-700 dark:bg-gray-600 text-white' : 'bg-indigo-500 text-white'}`}>
                  {isSpeakerA ? <BuildingOfficeIcon className="w-5 h-5" /> : <UserCircleIcon className="w-5 h-5" />}
              </div>

              {/* Content */}
              <div className="flex-1">
                  <div className="flex justify-between items-baseline">
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                          {getSpeakerName(entry.speaker)}
                      </p>
                      {hasTimestamps && (
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4">
                              {formatTime(entry.startTime)}
                          </span>
                      )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{entry.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
