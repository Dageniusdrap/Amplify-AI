import React, { useState, useRef, useEffect } from 'react';
import type { AnalysisResult } from '../types';
import { Transcript } from './Transcript';
import { PerformanceGraph } from './PerformanceGraph';
import { CoachingCard } from './CoachingCard';
import { DetailedAnalysisCard } from './DetailedAnalysisCard';
import type { AnalysisType } from './SidebarNav';
import { MediaPreviewCard } from './MediaPreviewCard';
import { ExportIcon } from './icons/ExportIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { exportTranscriptAsSrt, exportAnalysisAsTxt, exportCoachingAsTxt, exportViralityAsTxt } from '../utils/export';
import { ClosedCaptionIcon } from './icons/ClosedCaptionIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { KeywordAnalysisCard } from './KeywordAnalysisCard';

interface DashboardProps {
  result: AnalysisResult;
  isGeneratingImproved?: boolean;
  improvedContent?: string | null;
  onGenerateImprovedContent?: () => void;
  file?: File | null;
  fileUrl?: string | null;
  analysisType: AnalysisType;
  socialPost?: { platform: 'X' | 'LinkedIn' | 'Instagram'; content: string } | null;
  isGeneratingSocialPost?: boolean;
  onGenerateSocialPost?: (platform: 'X' | 'LinkedIn' | 'Instagram') => void;
  productAd?: string | null;
  isGeneratingProductAd?: boolean;
  onGenerateProductAd?: () => void;
  keyTakeaways?: string[] | null;
  isGeneratingKeyTakeaways?: boolean;
  onGenerateKeyTakeaways?: () => void;
  generatedDescription?: string | null;
  isGeneratingDescription?: boolean;
  onGenerateDescription?: () => void;
  onListenToFeedback: (voice: string, style: string) => Promise<void>;
  onGenerateVideoFromScript: (script: string) => void;
  isGeneratingAudio: boolean;
  feedbackAudio: { url: string; blob: Blob } | null;
  onListenToScript: (script: string, voice: string, style: string) => Promise<void>;
  isGeneratingScriptAudio: boolean;
  scriptAudio: { url: string; blob: Blob } | null;
  onCancel: () => void;
  highlightedTimeLabel: string | null;
  onTimeSegmentHover: (label: string | null) => void;
  speakerARole: 'me' | 'client';
  speakerBRole: 'me' | 'client';
  onSpeakerARoleChange: (role: 'me' | 'client') => void;
  onSpeakerBRoleChange: (role: 'me' | 'client') => void;
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isTranscriptCopied, setIsTranscriptCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSpeakerName = (speaker: string) => {
    if (speaker.toUpperCase() === 'A') return props.speakerARole === 'me' ? 'Me' : 'Client';
    if (speaker.toUpperCase() === 'B') return props.speakerBRole === 'me' ? 'Me' : 'Client';
    return speaker.charAt(0).toUpperCase() + speaker.slice(1).toLowerCase();
  };
  
  const getBaseFileName = () => {
    if (props.file) {
      return props.file.name.substring(0, props.file.name.lastIndexOf('.')) || 'analysis';
    }
    return 'analysis_report';
  };

  const handleCopyTranscript = () => {
    if (!props.result.transcript) return;
    const formattedTranscript = props.result.transcript.map(entry => `${getSpeakerName(entry.speaker)}: ${entry.text}`).join('\n\n');
    navigator.clipboard.writeText(formattedTranscript);
    setIsTranscriptCopied(true);
    setTimeout(() => setIsTranscriptCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    if (!props.result.transcript) return;
    
    const formatTime = (seconds: number) => {
      if (isNaN(seconds)) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formattedTranscript = props.result.transcript
      .map(entry => {
        let prefix = '';
        if (typeof entry.startTime === 'number' && typeof entry.endTime === 'number') {
          prefix = `[${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}] `;
        }
        return `${prefix}${getSpeakerName(entry.speaker)}: ${entry.text}`;
      })
      .join('\n\n');

    const blob = new Blob([formattedTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getBaseFileName()}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: 'json' | 'txt' | 'coaching' | 'virality') => {
    let fileName: string;
    let blob: Blob;

    switch (format) {
        case 'json':
            fileName = `${getBaseFileName()}_report.json`;
            blob = new Blob([JSON.stringify(props.result, null, 2)], { type: 'application/json' });
            break;
        case 'coaching':
            fileName = `${getBaseFileName()}_coaching.txt`;
            blob = new Blob([exportCoachingAsTxt(props.result)], { type: 'text/plain;charset=utf-8' });
            break;
        case 'virality':
            fileName = `${getBaseFileName()}_virality_blueprint.txt`;
            blob = new Blob([exportViralityAsTxt(props.result)], { type: 'text/plain;charset=utf-8' });
            break;
        case 'txt':
        default:
            fileName = `${getBaseFileName()}_report.txt`;
            blob = new Blob([exportAnalysisAsTxt(props.result, getSpeakerName)], { type: 'text/plain;charset=utf-8' });
            break;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExportMenuOpen(false);
  };
  
  const handleExportSrt = () => {
    if (!props.result.transcript) return;
    const srtContent = exportTranscriptAsSrt(props.result.transcript);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getBaseFileName()}_transcript.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  const scoreData = {
      score: props.result.salesCallAnalysis?.clarityScore ??
             props.result.socialMediaAnalysis?.overallScore ??
             props.result.adAnalysis?.overallScore ??
             props.result.videoAnalysis?.overallScore ??
             props.result.liveStreamAnalysis?.overallScore ??
             props.result.documentAnalysis?.clarityScore,
      label: props.result.salesCallAnalysis ? "Clarity Score" : 
             (props.result.documentAnalysis ? "Clarity Score" : "Overall Score")
  };

  const originalScriptForVideo = props.result.transcript?.map(t => t.text).join('\n\n') 
    || (props.result.documentAnalysis ? props.result.documentAnalysis.summary + '\n\n' + props.result.documentAnalysis.keyPoints.join('\n') : '')
    || '';
    
  // If there's a transcript, we show the player inside the transcript component.
  // Otherwise, if there's a file but no transcript yet, show the preview player.
  const shouldShowMediaPreview = props.file && props.fileUrl && !props.result.transcript;
  const isVideoAnalysis = props.analysisType === 'videoAnalysis';

  return (
    <div id="analysis-report-area">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analysis Report</h2>
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
            aria-haspopup="true"
            aria-expanded={isExportMenuOpen}
          >
            <ExportIcon className="h-5 w-5 mr-2" />
            Export
          </button>
          {isExportMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button onClick={() => handleExport('txt')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Full Report (.txt)</button>
                {isVideoAnalysis && (
                    <>
                         <button onClick={() => handleExport('coaching')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Coaching Suggestions (.txt)</button>
                         <button onClick={() => handleExport('virality')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Virality Blueprint (.txt)</button>
                    </>
                )}
                <button onClick={() => handleExport('json')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Raw Data (.json)</button>
                <div className="border-t my-1 border-gray-200 dark:border-gray-700"></div>
                {props.result.transcript && (
                   <button onClick={handleExportSrt} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                       <ClosedCaptionIcon className="h-4 w-4 mr-2" />
                       Subtitles (.srt)
                   </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {shouldShowMediaPreview && (
            <MediaPreviewCard file={props.file!} fileUrl={props.fileUrl!} />
          )}
          {props.result.performanceMetrics && props.result.performanceMetrics.length > 0 && (
             <Card>
                <CardHeader title="Performance Analysis" />
                <div className="h-96"><PerformanceGraph metrics={props.result.performanceMetrics} onTimeSegmentHover={props.onTimeSegmentHover} /></div>
              </Card>
          )}
          {props.result.keywordAnalysis && (
            <KeywordAnalysisCard data={props.result.keywordAnalysis} />
          )}
          {props.result.salesCallAnalysis && <DetailedAnalysisCard title="Sales Call Analysis" data={{ ...props.result.salesCallAnalysis, speakerARole: props.speakerARole, speakerBRole: props.speakerBRole }} />}
          {props.result.socialMediaAnalysis && <DetailedAnalysisCard title="Social Media Analysis" data={props.result.socialMediaAnalysis} />}
          {props.result.adAnalysis && <DetailedAnalysisCard title="Product Ad Analysis" data={props.result.adAnalysis} />}
          {props.result.videoAnalysis && <DetailedAnalysisCard title="Video Analysis" data={props.result.videoAnalysis} />}
          {props.result.liveStreamAnalysis && <DetailedAnalysisCard title="Live Stream Analysis" data={props.result.liveStreamAnalysis} />}
          {props.result.documentAnalysis && <DetailedAnalysisCard title="Document Analysis" data={props.result.documentAnalysis} />}
          {props.result.financialReportAnalysis && <DetailedAnalysisCard title="Financial Report Analysis" data={props.result.financialReportAnalysis} />}
          {props.result.transcript && (
             <Card>
                <CardHeader title="Content Transcript" actions={
                    <div className="flex items-center space-x-2">
                        <button onClick={handleCopyTranscript} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Copy transcript">
                          {isTranscriptCopied ? <CheckIcon className="h-4 w-4 mr-2 text-green-500" /> : <ClipboardIcon className="h-4 w-4 mr-2" />}
                          {isTranscriptCopied ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={handleDownloadTranscript} className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Download transcript">
                          <DownloadIcon className="h-4 w-4 mr-2" /> Transcript
                        </button>
                    </div>
                }/>
                <Transcript 
                    transcript={props.result.transcript} 
                    mediaUrl={props.fileUrl} 
                    mediaFile={props.file} 
                    highlightedTimeLabel={props.highlightedTimeLabel}
                    speakerARole={props.speakerARole}
                    speakerBRole={props.speakerBRole}
                    onSpeakerARoleChange={props.onSpeakerARoleChange}
                    onSpeakerBRoleChange={props.onSpeakerBRoleChange}
                    isSalesCall={props.analysisType === 'salesCall'}
                />
              </Card>
          )}
        </div>
        <div id="feedback-card-area" className="lg:col-span-1 space-y-8 sticky top-24">
            <CoachingCard
                data={props.result.feedbackCard}
                analysisType={props.analysisType}
                scoreData={scoreData.score !== undefined ? scoreData : undefined}
                onListenToFeedback={props.onListenToFeedback}
                isGeneratingAudio={props.isGeneratingAudio}
                feedbackAudio={props.feedbackAudio}
                onCancel={props.onCancel}
                // Generation Props
                isGeneratingImproved={props.isGeneratingImproved!}
                onGenerateImprovedContent={props.onGenerateImprovedContent!}
                improvedContent={props.improvedContent!}
                isGeneratingSocialPost={props.isGeneratingSocialPost!}
                onGenerateSocialPost={props.onGenerateSocialPost!}
                socialPost={props.socialPost!}
                isGeneratingProductAd={props.isGeneratingProductAd!}
                onGenerateProductAd={props.onGenerateProductAd!}
                productAd={props.productAd!}
                isGeneratingKeyTakeaways={props.isGeneratingKeyTakeaways!}
                onGenerateKeyTakeaways={props.onGenerateKeyTakeaways!}
                keyTakeaways={props.keyTakeaways!}
                isGeneratingDescription={props.isGeneratingDescription!}
                onGenerateDescription={props.onGenerateDescription!}
                generatedDescription={props.generatedDescription!}
                onGenerateVideoFromScript={props.onGenerateVideoFromScript}
                onListenToScript={props.onListenToScript}
                isGeneratingScriptAudio={props.isGeneratingScriptAudio!}
                scriptAudio={props.scriptAudio}
                originalScript={originalScriptForVideo}
                hasContentToImprove={!!originalScriptForVideo}
            />
        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    {children}
  </div>
);

const CardHeader: React.FC<{ title: string; actions?: React.ReactNode }> = ({ title, actions }) => (
  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
    {actions && <div>{actions}</div>}
  </div>
);