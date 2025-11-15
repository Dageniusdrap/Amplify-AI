import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveSession, LiveServerMessage, Blob } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { XCircleIcon } from './icons/XCircleIcon';

type TranscriptEntry = {
    speaker: 'You' | 'Creators Edge AI';
    text: string;
};

type ConnectionStatus = 'disconnected' | 'connecting' | 'live' | 'error';

// This is a crucial helper function from the docs for streaming audio
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


export const LiveDebugger: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Device selection state
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');


    // Refs for accumulating transcription text within a turn
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    // Ref for managing gapless audio playback
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // Get media devices on component mount
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Get permissions first to ensure we get device labels
                const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                tempStream.getTracks().forEach(track => track.stop());

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audio = devices.filter(d => d.kind === 'audioinput');
                const video = devices.filter(d => d.kind === 'videoinput');
                setAudioDevices(audio);
                setVideoDevices(video);
                if (audio.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audio[0].deviceId);
                if (video.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(video[0].deviceId);
            } catch (err) {
                console.error("Could not enumerate devices:", err);
                setError("Could not access camera/microphone. Please check browser permissions.");
            }
        };
        getDevices();
    }, []);

    const stopSession = useCallback(() => {
        // Close Gemini session
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        // Stop media stream tracks
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        if(videoRef.current) videoRef.current.srcObject = null;


        // Disconnect and close audio processors/contexts
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close();
        outputAudioContextRef.current = null;
        
        // Stop any pending audio playback
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setStatus('disconnected');
    }, []);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);
    
    const handleStartSession = async () => {
        if (status !== 'disconnected' && status !== 'error') return;

        setStatus('connecting');
        setError(null);
        setTranscript([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            const constraints: MediaStreamConstraints = {
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
                video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            // Setup audio contexts
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'You are a helpful and friendly debugging assistant for content creators. Provide constructive feedback in real-time.'
                },
                callbacks: {
                    onopen: () => {
                        setStatus('live');
                        if (!inputAudioContextRef.current || !mediaStreamRef.current) return;
                        
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Transcription
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                            
                            setTranscript(prev => {
                                let newTranscript = [...prev];
                                if (fullInput) newTranscript.push({ speaker: 'You', text: fullInput });
                                if (fullOutput) newTranscript.push({ speaker: 'Creators Edge AI', text: fullOutput });
                                return newTranscript;
                            });

                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        // Handle Audio Playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setError(`Session error: ${e.message || 'An unknown error occurred.'}`);
                        setStatus('error');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        stopSession();
                    },
                }
            });

        } catch (err: any) {
            setError(`Failed to start session: ${err.message}`);
            setStatus('error');
            stopSession();
        }
    };
    
     return (
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Video and Controls */}
                <div className="md:col-span-2 bg-black flex flex-col items-center justify-center relative aspect-video">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
                    {status === 'disconnected' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                            <VideoCameraIcon className="h-16 w-16 mb-4" />
                            <h3 className="text-xl font-bold">Live Debugger</h3>
                            <p className="text-center">Practice your pitch or presentation and get real-time feedback.</p>
                        </div>
                    )}
                    <div className="absolute top-2 right-2">
                        {status === 'live' && (
                            <div className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
                                LIVE
                            </div>
                        )}
                        {status === 'connecting' && <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">CONNECTING</div>}
                    </div>
                </div>

                {/* Transcript */}
                <div className="md:col-span-1 h-96 md:h-auto flex flex-col bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="p-4 font-semibold border-b border-gray-200 dark:border-gray-700 flex-shrink-0">Transcript</h3>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {transcript.map((entry, index) => (
                            <div key={index} className={`flex flex-col ${entry.speaker === 'You' ? 'items-start' : 'items-end'}`}>
                                <div className={`p-3 rounded-lg max-w-xs ${entry.speaker === 'You' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-indigo-500 text-white'}`}>
                                    <p className="text-sm break-words">{entry.text}</p>
                                </div>
                                <span className="text-xs text-gray-400 mt-1">{entry.speaker}</span>
                            </div>
                        ))}
                         {transcript.length === 0 && (status === 'live' || status === 'connecting') && <p className="text-sm text-center text-gray-500">Listening...</p>}
                         <div ref={transcriptEndRef} />
                    </div>
                </div>
            </div>
            
            {/* Control Bar */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center space-y-4">
                {status === 'disconnected' || status === 'error' ? (
                     <>
                        <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="audio-device" className="sr-only">Microphone</label>
                                <select 
                                    id="audio-device"
                                    value={selectedAudioDevice} 
                                    onChange={e => setSelectedAudioDevice(e.target.value)}
                                    className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md"
                                >
                                    {audioDevices.length > 0 ? audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>) : <option>No microphones found</option>}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="video-device" className="sr-only">Camera</label>
                                <select 
                                    id="video-device"
                                    value={selectedVideoDevice} 
                                    onChange={e => setSelectedVideoDevice(e.target.value)}
                                    className="w-full p-2 text-sm bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md"
                                >
                                    {videoDevices.length > 0 ? videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>) : <option>No cameras found</option>}
                                </select>
                            </div>
                        </div>
                        <button onClick={handleStartSession} className="flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
                            <MicrophoneIcon className="h-5 w-5 mr-2" /> Start Session
                        </button>
                    </>
                ) : (
                    <button onClick={stopSession} className="flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors">
                        <XCircleIcon className="h-5 w-5 mr-2" /> Stop Session
                    </button>
                )}
                 {error && <div className="p-2 text-center text-sm text-red-700 dark:text-red-300">{error}</div>}
            </div>
        </div>
    );
};