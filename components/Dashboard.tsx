import React, { useState, useRef, useEffect } from 'react';
import type { AnalysisResult } from '../types';
import { Transcript } from './Transcript';
import { PerformanceGraph } from './PerformanceGraph';
import { FeedbackCard } from './CoachingCard';
import { DetailedAnalysisCard } from './DetailedAnalysisCard';
import { GeneratedContentCard } from './GeneratedContentCard';
import type { AnalysisType } from './AnalysisTypeSelector';
import { MediaPreviewCard } from './MediaPreviewCard';
import { ExportIcon } from './icons/ExportIcon';
import { SocialPostCard } from './SocialPostCard';
import { ProductAdCard } from './ProductAdCard';
import { KeyTakeawaysCard } from './KeyTakeawaysCard';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { exportTranscriptAsSrt } from '../utils/export';
import { ClosedCaptionIcon } from './icons/ClosedCaptionIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { GenerationActionsCard } from './GenerationActionsCard';
import { AmplifyBanner } from './AmplifyBanner';

interface DashboardProps {
  result: AnalysisResult;
  isGeneratingImproved?: boolean;
  improvedContent?: string | null;
  onGenerateImprovedContent?: () => void;
  file?: File | null;
  fileUrl?: string | null;
  analysisType: AnalysisType;
  socialPost?: string | null;
  isGeneratingSocialPost?: boolean;
  onGenerateSocialPost?: () => void;
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
    if (speaker.toUpperCase() === 'A') return 'Salesperson';
    if (speaker.toUpperCase() === 'B') return 'Client';
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
    const formattedTranscript = props.result.transcript.map(entry => entry.text).join('\n\n');
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

  const formatAnalysisAsText = (analysis: AnalysisResult): string => {
    let report = 'Content Analysis Report\n';
    report += '=========================\n\n';

    const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    // Feedback Card
    report += '--- AI Feedback Card ---\n';
    report += 'Strengths:\n';
    analysis.feedbackCard.strengths.forEach(s => report += `- ${s}\n`);
    report += '\nOpportunities:\n';
    analysis.feedbackCard.opportunities.forEach(o => report += `- ${o}\n`);
    report += '\n';

    // Detailed Analysis
    if (analysis.socialMediaAnalysis) {
        report += '--- Social Media Analysis ---\n';
        Object.entries(analysis.socialMediaAnalysis).forEach(([key, value]) => report += `${formatKey(key)}: ${value}\n`);
        report += '\n';
    }
    if (analysis.adAnalysis) {
        report += '--- Product Ad Analysis ---\n';
        Object.entries(analysis.adAnalysis).forEach(([key, value]) => report += `${formatKey(key)}: ${value}\n`);
        report += '\n';
    }
    if (analysis.videoAnalysis) {
        report += '--- Video Analysis ---\n';
        Object.entries(analysis.videoAnalysis).forEach(([key, value]) => report += `${formatKey(key)}: ${value}\n`);
        report += '\n';
    }
     if (analysis.documentAnalysis) {
        report += '--- Document Analysis ---\n';
        Object.entries(analysis.documentAnalysis).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                report += `${formatKey(key)}:\n`;
                value.forEach(p => report += `- ${p}\n`);
            } else {
                report += `${formatKey(key)}: ${value}\n`;
            }
        });
        report += '\n';
    }
    
    // Transcript
    if (analysis.transcript && analysis.transcript.length > 0) {
        report += '--- Content Transcript ---\n\n';
        analysis.transcript.forEach(entry => {
            const speakerName = getSpeakerName(entry.speaker);
            report += `${speakerName}: ${entry.text}\n\n`;
        });
    }

    return report;
  }

  const handleExport = (format: 'json' | 'txt') => {
    const fileName = `${getBaseFileName()}_report.${format}`;
    let blob: Blob;

    if (format === 'json') {
      const jsonString = JSON.stringify(props.result, null, 2);
      blob = new Blob([jsonString], { type: 'application/json' });
    } else {
      const textContent = formatAnalysisAsText(props.result);
      blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
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
      score: props.result.socialMediaAnalysis?.overallScore ??
             props.result.adAnalysis?.overallScore ??
             props.result.videoAnalysis?.overallScore ??
             props.result.liveStreamAnalysis?.overallScore ??
             props.result.documentAnalysis?.clarityScore,
      label: props.result.documentAnalysis ? "Clarity Score" : "Overall Score"
  };

  const generationProps = {
    onGenerateImprovedContent: props.onGenerateImprovedContent!,
    isGeneratingImproved: props.isGeneratingImproved || false,
    onGenerateKeyTakeaways: props.onGenerateKeyTakeaways!,
    isGeneratingKeyTakeaways: props.isGeneratingKeyTakeaways || false,
    onGenerateDescription: props.onGenerateDescription!,
    isGeneratingDescription: props.isGeneratingDescription || false,
    onGenerateSocialPost: props.onGenerateSocialPost!,
    isGeneratingSocialPost: props.isGeneratingSocialPost || false,
    onGenerateProductAd: props.onGenerateProductAd!,
    isGeneratingProductAd: props.isGeneratingProductAd || false,
    onCancel: props.onCancel,
    hasContentToImprove: !!(props.result.transcript || props.result.documentAnalysis) && !!props.onGenerateImprovedContent,
  };


  return (
    <div className="space-y-8" id="analysis-report-area">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Analysis Report</h2>
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
            aria-haspopup="true"
            aria-expanded={isExportMenuOpen}
          >
            <ExportIcon className="h-5 w-5 mr-2" />
            Export Analysis
          </button>
          {isExportMenuOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
              <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button onClick={() => handleExport('json')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Download as JSON</button>
                <button onClick={() => handleExport('txt')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">Download as TXT</button>
                {props.result.transcript && (
                   <button onClick={handleExportSrt} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" role="menuitem">
                       <ClosedCaptionIcon className="h-4 w-4 mr-2" />
                       Download Subtitles (.srt)
                   </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AmplifyBanner {...generationProps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {props.file && props.fileUrl && (
            <MediaPreviewCard file={props.file} fileUrl={props.fileUrl} />
          )}
          {props.result.performanceMetrics && props.result.performanceMetrics.length > 0 && (
             <Card>
                <CardHeader title="Performance Analysis" />
                <div className="h-96"><PerformanceGraph metrics={props.result.performanceMetrics} /></div>
              </Card>
          )}
          {props.result.socialMediaAnalysis && <DetailedAnalysisCard title="Social Media Analysis" data={props.result.socialMediaAnalysis} />}
          {props.result.adAnalysis && <DetailedAnalysisCard title="Product Ad Analysis" data={props.result.adAnalysis} />}
          {props.result.videoAnalysis && <DetailedAnalysisCard title="Video Analysis" data={props.result.videoAnalysis} />}
          {props.result.liveStreamAnalysis && <DetailedAnalysisCard title="Live Stream Analysis" data={props.result.liveStreamAnalysis} />}
          {props.result.documentAnalysis && <DetailedAnalysisCard title="Document Analysis" data={props.result.documentAnalysis} />}
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
                <Transcript transcript={props.result.transcript} mediaUrl={props.fileUrl} mediaFile={props.file} />
              </Card>
          )}
        </div>
        <div id="feedback-card-area" className="lg:col-span-1 space-y-8 sticky top-24">
            <FeedbackCard 
                data={props.result.feedbackCard} 
                analysisType={props.analysisType}
                scoreData={scoreData.score !== undefined ? scoreData : undefined}
                onListenToFeedback={props.onListenToFeedback}
                isGeneratingAudio={props.isGeneratingAudio}
                feedbackAudio={props.feedbackAudio}
                onCancel={props.onCancel}
            />
            <GenerationActionsCard {...props} />
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