import React from 'react';
import type { TranscriptEntry } from '../types';

interface SpeakerTimelineProps {
    transcript: TranscriptEntry[];
    speakerARole: 'me' | 'client';
    speakerBRole: 'me' | 'client';
}

export const SpeakerTimeline: React.FC<SpeakerTimelineProps> = ({ transcript, speakerARole, speakerBRole }) => {
    if (!transcript.length) return null;

    const totalDuration = transcript.reduce((max, entry) => Math.max(max, entry.endTime || 0), 0);
    if (totalDuration === 0) return null;

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden">
            {transcript.map((entry, index) => {
                const duration = (entry.endTime || 0) - (entry.startTime || 0);
                const width = (duration / totalDuration) * 100;
                
                const isSpeakerA = entry.speaker === 'A';
                let bgColor = 'bg-gray-400';
                let speakerName = 'Unknown';
                
                if (isSpeakerA) {
                    bgColor = speakerARole === 'me' ? 'bg-indigo-500' : 'bg-green-500';
                    speakerName = speakerARole === 'me' ? 'Me' : 'Client';
                } else {
                    bgColor = speakerBRole === 'me' ? 'bg-indigo-500' : 'bg-green-500';
                    speakerName = speakerBRole === 'me' ? 'Me' : 'Client';
                }

                return (
                    <div
                        key={index}
                        className={`h-4 transition-colors duration-300 ${bgColor}`}
                        style={{ width: `${width}%` }}
                        title={`${speakerName}: ${entry.text}`}
                    />
                );
            })}
        </div>
    );
};
