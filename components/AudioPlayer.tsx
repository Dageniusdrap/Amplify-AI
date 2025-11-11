import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

export interface AudioPlayerRef {
  seek: (time: number) => void;
}

interface AudioPlayerProps {
  src: string;
  file?: File;
  onTimeUpdate?: (time: number) => void;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ src, file, onTimeUpdate }, ref) => {
  const mediaRef = useRef<HTMLAudioElement & HTMLVideoElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  
  const isVideo = file?.type.startsWith('video/');

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const setMediaData = () => {
      setDuration(media.duration);
      setCurrentTime(media.currentTime);
    };

    const setMediaTime = () => {
        const newTime = media.currentTime;
        setCurrentTime(newTime);
        if (onTimeUpdate) {
            onTimeUpdate(newTime);
        }
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener('loadeddata', setMediaData);
    media.addEventListener('timeupdate', setMediaTime);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('ended', handlePause);

    return () => {
      media.removeEventListener('loadeddata', setMediaData);
      media.removeEventListener('timeupdate', setMediaTime);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('ended', handlePause);
    };
  }, [onTimeUpdate]);
  
  useEffect(() => {
      if (mediaRef.current && src) {
        if(mediaRef.current.src !== src) {
          mediaRef.current.src = src;
          mediaRef.current.load();
        }
      }
  }, [src]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    // State is managed by event listeners
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Number(e.target.value);
      setCurrentTime(Number(e.target.value));
    }
  };

  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (mediaRef.current) {
        mediaRef.current.currentTime = time;
        setCurrentTime(time);
        if(!isPlaying){
            mediaRef.current.play();
        }
      }
    },
  }));
  
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="w-full">
       {isVideo ? (
        <video
          ref={mediaRef}
          src={src}
          className="w-full rounded-lg max-h-80 bg-black mb-2 cursor-pointer"
          playsInline
          onClick={togglePlayPause}
        />
      ) : (
        <audio ref={mediaRef} src={src} preload="metadata" />
      )}
      <div className="flex items-center w-full gap-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        <button
          onClick={togglePlayPause}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={!duration}
        >
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            disabled={!duration}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{formatTime(duration)}</span>
          <div className="relative" ref={speedMenuRef}>
            <button
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                className="text-xs font-mono w-14 text-center py-1 px-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                disabled={!duration}
            >
                {playbackRate}x
            </button>
            {isSpeedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-20 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-600 z-10 overflow-hidden">
                    {playbackRates.map(rate => (
                        <button
                            key={rate}
                            onClick={() => { setPlaybackRate(rate); setIsSpeedMenuOpen(false); }}
                            className={`w-full text-center px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${playbackRate === rate ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                            {rate}x
                        </button>
                    ))}
                </div>
            )}
        </div>
        </div>
      </div>
    </div>
  );
});
