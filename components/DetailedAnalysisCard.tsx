import React from 'react';
import { ScoreGauge } from './ScoreGauge';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import type { VideoAnalysis, AudioAnalysis, FinancialReportAnalysis, DocumentAnalysis, SalesCallAnalysis, MomentsSummary, AudienceRetentionPredictionPoint, ViralityCurvePoint, SpeechAnalysis, SocialMediaAnalysis } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { TuningForkIcon } from './icons/TuningForkIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { KeyDecisionIcon } from './icons/KeyDecisionIcon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { ImageIcon } from './icons/ImageIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClosedCaptionIcon } from './icons/ClosedCaptionIcon';
import { FilmStripIcon } from './icons/FilmStripIcon';
import { SoundBarsIcon } from './icons/SoundBarsIcon';


interface DetailedAnalysisCardProps {
  title: string;
  data: Record<string, any>;
}

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-lg font-semibold text-gray-800 dark:text-white">{value}</p>
  </div>
);

// --- Shared Report Components ---

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3 pb-2 border-b-2 border-indigo-500/50">{title}</h4>
    <div className="space-y-4">{children}</div>
  </div>
);

const DataItem: React.FC<{ label: string; content: string | string[]; isHighlight?: boolean }> = ({ label, content, isHighlight }) => {
  if (!content || (Array.isArray(content) && content.length === 0)) return null;
  
  if (isHighlight) {
    return (
        <div>
            <h5 className="font-semibold text-gray-700 dark:text-gray-300">{label}</h5>
            <div className="mt-1 p-3 bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500 rounded-r-lg">
                <p className="text-sm italic text-indigo-800 dark:text-indigo-200">"{content as string}"</p>
            </div>
        </div>
    );
  }

  return (
    <div>
        <h5 className="font-semibold text-gray-700 dark:text-gray-300">{label}</h5>
        {Array.isArray(content) ? (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                {content.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{content}</p>
        )}
    </div>
  );
};

const HighlightMetricCard: React.FC<{
    icon: React.FC<any>;
    iconColor: string;
    title: string;
    score?: number;
    scoreLabel?: string;
    analysis: string;
    suggestion?: string;
}> = ({ icon: Icon, iconColor, title, score, scoreLabel, analysis, suggestion }) => (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4" style={{ borderColor: iconColor }}>
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
                <Icon className={`h-8 w-8`} style={{ color: iconColor }} />
            </div>
            <div className="flex-grow">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{analysis}</p>
                {suggestion && (
                     <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 rounded-r-lg">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">Suggestion:</p>
                        <p className="text-sm italic text-green-700 dark:text-green-300">"{suggestion}"</p>
                    </div>
                )}
            </div>
            {score !== undefined && scoreLabel && (
                <div className="flex-shrink-0">
                    <ScoreGauge score={score} label={scoreLabel} />
                </div>
            )}
        </div>
    </div>
);

const ViralityTimeline: React.FC<{ timeline: { hours: string; day: string; week: string; } }> = ({ timeline }) => (
    <div>
        <h5 className="font-semibold text-gray-700 dark:text-gray-300">Predicted Virality Timeline</h5>
        <div className="mt-2 space-y-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex items-start">
            <span className="text-xs font-bold uppercase text-gray-500 w-16 flex-shrink-0">Hours</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-4">{timeline.hours}</p>
          </div>
          <div className="flex items-start">
            <span className="text-xs font-bold uppercase text-gray-500 w-16 flex-shrink-0">Day</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-4">{timeline.day}</p>
          </div>
          <div className="flex items-start">
            <span className="text-xs font-bold uppercase text-gray-500 w-16 flex-shrink-0">Week</span>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-4">{timeline.week}</p>
          </div>
        </div>
    </div>
);

const MomentsSummarySection: React.FC<{ summary: MomentsSummary }> = ({ summary }) => (
    <Section title="Key Moments Summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Objections Raised" value={summary.objections} />
            <StatCard label="Action Items" value={summary.actionItems} />
            <StatCard label="Key Decisions" value={summary.keyDecisions} />
        </div>
    </Section>
);

// --- Sales Call Analysis Report ---
const SalesCallAnalysisReport: React.FC<{ data: SalesCallAnalysis & { speakerARole: 'me' | 'client', speakerBRole: 'me' | 'client' } }> = ({ data }) => {
    const meSpeakerId = data.speakerARole === 'me' ? 'A' : 'B';
    const clientSpeakerId = data.speakerBRole === 'client' ? 'B' : 'A';

    const salespersonAnalysis = data.speechAnalyses?.[meSpeakerId];
    const talkRatio = data.talkTimeRatio;

    return (
        <div className="p-6 space-y-8">
            <Section title="Overall Performance & Coaching">
                <p className="text-sm text-gray-600 dark:text-gray-400">{data.overallPerformance}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div>
                        <h5 className="font-semibold text-green-600 dark:text-green-400 mb-2">Strengths</h5>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {data.strengths.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Weaknesses</h5>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {data.weaknesses.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Areas for Improvement</h5>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {data.areasOfImprovement.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            </Section>

            {data.momentsSummary && <MomentsSummarySection summary={data.momentsSummary} />}

            <Section title="Key Metrics & Speech Patterns">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex justify-around items-center flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg h-full">
                        <ScoreGauge score={data.clarityScore} label="Clarity Score" />
                        <ScoreGauge score={data.confidenceScore} label="Confidence Score" />
                    </div>
                    <div className="space-y-4">
                        {data.brandVoiceAlignment && (
                            <HighlightMetricCard
                                icon={TuningForkIcon}
                                iconColor="#4f46e5"
                                title="Brand Voice Alignment"
                                score={data.brandVoiceAlignment.score}
                                scoreLabel="Alignment"
                                analysis={data.brandVoiceAlignment.analysis}
                            />
                        )}
                    </div>
                </div>
                 {talkRatio && (
                    <div className="mt-6">
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Talk-to-Listen Ratio</h5>
                         <div className="space-y-3">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden">
                                <div className="bg-indigo-500 h-4" style={{ width: `${talkRatio[meSpeakerId]}%` }} title={`Me: ${talkRatio[meSpeakerId]}%`}></div>
                                <div className="bg-green-500 h-4" style={{ width: `${talkRatio[clientSpeakerId]}%` }} title={`Client: ${talkRatio[clientSpeakerId]}%`}></div>
                            </div>
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-indigo-600 dark:text-indigo-300">Me: {talkRatio[meSpeakerId]}%</span>
                                <span className="text-green-600 dark:text-green-300">Client: {talkRatio[clientSpeakerId]}%</span>
                            </div>
                            {data.talkToListenRatio?.analysis && <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{data.talkToListenRatio.analysis}"</p>}
                        </div>
                    </div>
                )}
                 {salespersonAnalysis && (
                    <div className="mt-6">
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Speech Patterns</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <StatCard label="Pacing" value={`${salespersonAnalysis.pacingWPM} WPM`} />
                             <StatCard label="Filler Words" value={`${salespersonAnalysis.fillerWordCount} found`} />
                             <StatCard label="Dominant Tone" value={salespersonAnalysis.dominantTone} />
                        </div>
                    </div>
                )}
            </Section>

            <Section title="Call Breakdown (Phase-by-Phase)">
                <DataItem label="Rapport Building" content={data.rapportBuilding} />
                <DataItem label="Needs Discovery" content={data.needsDiscovery} />
                <DataItem label="Product Presentation" content={data.productPresentation} />
                <DataItem label="Objection Handling" content={data.objectionHandling} />
                <DataItem label="Closing Effectiveness" content={data.closingEffectiveness} />
            </Section>

            {data.viralitySuggestions && (
                <Section title="Virality Suggestions">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        {data.viralitySuggestions.viralityScore !== undefined && (
                            <div className="flex justify-center">
                                <ScoreGauge score={data.viralitySuggestions.viralityScore} label="Virality Score" />
                            </div>
                        )}
                        {data.viralitySuggestions.keyViralMoment && (
                            <HighlightMetricCard
                                icon={SparklesIcon}
                                iconColor="#f59e0b"
                                title="Key Viral Moment"
                                analysis={data.viralitySuggestions.keyViralMoment}
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                            <DataItem label="Suggested Title" content={data.viralitySuggestions.title} isHighlight />
                            <DataItem label="Hook Suggestions" content={data.viralitySuggestions.hooks} />
                        </div>
                        <div>
                            <ViralityTimeline timeline={data.viralitySuggestions.timeline} />
                        </div>
                    </div>
                </Section>
            )}
        </div>
    );
};


// --- Video Analysis Report ---

const ViralityCurveChart: React.FC<{ data: ViralityCurvePoint[] }> = ({ data }) => {
    const formatViews = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
        return value.toString();
    };

    return (
        <div>
            <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Predicted Virality Curve</h5>
            <div className="h-64 pr-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="viralityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                        <XAxis dataKey="timeLabel" />
                        <YAxis tickFormatter={formatViews} />
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), 'Views']}
                            contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="predictedViews" stroke="none" fill="url(#viralityGradient)" />
                        <Line type="monotone" dataKey="predictedViews" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const AudioAnalysisDetails: React.FC<{ analysis: AudioAnalysis }> = ({ analysis }) => (
    <div className="space-y-4">
        <h5 className="font-semibold text-gray-700 dark:text-gray-300">Audio &amp; Speech Analysis</h5>
        <HighlightMetricCard
            icon={SoundBarsIcon}
            iconColor="#a855f7" // purple-500
            title="Audio Quality"
            score={analysis.qualityScore}
            scoreLabel="Score"
            analysis={analysis.qualityCritique}
            suggestion={analysis.qualitySuggestion}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Pacing" value={`${analysis.pacingWPM} WPM`} />
            <StatCard label="Filler Words" value={`${analysis.fillerWordCount} found`} />
            <StatCard label="Sentiment" value={analysis.sentiment} />
        </div>
    </div>
);

const AudienceRetentionSection: React.FC<{ prediction: AudienceRetentionPredictionPoint[] }> = ({ prediction }) => (
    <Section title="Audience Retention Prediction">
        <div className="space-y-4">
            {prediction.map((point, index) => (
                <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex-shrink-0 w-24 text-center">
                        <p className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{point.retentionPercent}%</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${point.retentionPercent}%` }}></div>
                        </div>
                        <p className="text-xs font-mono text-gray-500 mt-1">{point.timeLabel}</p>
                    </div>
                    <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{point.reason}</p>
                    </div>
                </div>
            ))}
        </div>
    </Section>
);

const TechnicalQualityDetails: React.FC<{ analysis: VideoAnalysis['technicalQuality'] }> = ({ analysis }) => {
    if (!analysis) return null;
    return (
        <div className="space-y-4">
            {analysis.resolutionClarity && (
                <HighlightMetricCard
                    icon={FilmStripIcon}
                    iconColor="#0ea5e9" // sky-500
                    title="Resolution & Clarity"
                    score={analysis.resolutionClarity.score}
                    scoreLabel="Score"
                    analysis={analysis.resolutionClarity.critique}
                    suggestion={analysis.resolutionClarity.suggestion}
                />
            )}
            {analysis.lighting && (
                <HighlightMetricCard
                    icon={LightbulbIcon}
                    iconColor="#f59e0b" // amber-500
                    title="Lighting"
                    score={analysis.lighting.score}
                    scoreLabel="Score"
                    analysis={analysis.lighting.critique}
                    suggestion={analysis.lighting.suggestion}
                />
            )}
            {analysis.colorGrading && (
                <HighlightMetricCard
                    icon={PaletteIcon}
                    iconColor="#ec4899" // pink-500
                    title="Color Grading"
                    score={analysis.colorGrading.score}
                    scoreLabel="Score"
                    analysis={analysis.colorGrading.critique}
                    suggestion={analysis.colorGrading.suggestion}
                />
            )}
        </div>
    );
};

const VideoAnalysisReport: React.FC<{ data: VideoAnalysis }> = ({ data }) => {
    return (
        <div className="p-6 space-y-8">
            <Section title="Core Scores">
                 <div className="flex justify-around items-center flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg h-full">
                    <ScoreGauge score={data.overallScore} label="Overall Score" />
                    <ScoreGauge score={data.viralityScore} label="Virality Score" />
                </div>
            </Section>

            <Section title="Virality & SEO Blueprint">
                <div className="space-y-6">
                    {data.viralityCurve && <ViralityCurveChart data={data.viralityCurve} />}
                    {data.keyViralMoment && (
                        <HighlightMetricCard
                            icon={SparklesIcon}
                            iconColor="#f59e0b"
                            title="Key Viral Moment"
                            analysis={data.keyViralMoment}
                        />
                    )}
                    {data.viralitySuggestions?.hooks && (
                        <DataItem label="Suggested Viral Hooks" content={data.viralitySuggestions.hooks} />
                    )}
                    {data.suggestedTitles && <DataItem label="Suggested Titles" content={data.suggestedTitles} />}
                    {data.suggestedDescription && <DataItem label="Suggested Description" content={data.suggestedDescription} />}
                    {data.suggestedTags && (
                        <div>
                            <h5 className="font-semibold text-gray-700 dark:text-gray-300">Suggested Tags</h5>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {data.suggestedTags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Section>

            <Section title="Creator's Craft">
                <div className="space-y-6">
                    {data.hookQuality && (
                        <HighlightMetricCard
                            icon={MegaphoneIcon}
                            iconColor="#ec4899"
                            title="Hook Quality"
                            score={data.hookQuality.score}
                            scoreLabel="Effectiveness"
                            analysis={data.hookQuality.critique}
                            suggestion={data.hookQuality.suggestion}
                        />
                    )}
                    {data.thumbnailSuggestion && (
                        <HighlightMetricCard
                            icon={ImageIcon}
                            iconColor="#3b82f6"
                            title="Thumbnail Suggestion"
                            score={data.thumbnailSuggestion.score}
                            scoreLabel="Potential"
                            analysis={data.thumbnailSuggestion.critique}
                            suggestion={data.thumbnailSuggestion.suggestion}
                        />
                    )}
                    {data.ctaEffectiveness && (
                         <HighlightMetricCard
                            icon={ClipboardCheckIcon}
                            iconColor="#10b981"
                            title="Call-to-Action"
                            score={data.ctaEffectiveness.score}
                            scoreLabel="Effectiveness"
                            analysis={data.ctaEffectiveness.critique}
                            suggestion={data.ctaEffectiveness.suggestion}
                        />
                    )}
                     {data.engagementStrategy && (
                        <DataItem label="Engagement Strategy" content={data.engagementStrategy} />
                    )}
                </div>
            </Section>
            
            {data.audienceRetentionPrediction && <AudienceRetentionSection prediction={data.audienceRetentionPrediction} />}

            <Section title="Production Quality">
                <div className="space-y-6">
                    {data.technicalQuality && <TechnicalQualityDetails analysis={data.technicalQuality} />}
                    {data.audioAnalysis && <AudioAnalysisDetails analysis={data.audioAnalysis} />}
                    <DataItem label="Visual Pacing" content={data.visualPacing} />
                    <DataItem label="Editing Style" content={data.editingStyle} />
                    {data.captionQuality && (
                        <HighlightMetricCard
                            icon={ClosedCaptionIcon}
                            iconColor="#8b5cf6"
                            title="Caption Quality"
                            score={data.captionQuality.score}
                            scoreLabel="Quality"
                            analysis={data.captionQuality.critique}
                            suggestion={data.captionQuality.suggestion}
                        />
                    )}
                </div>
            </Section>

            <Section title="Final Recommendations">
                <DataItem label="Suggested Improvements" content={data.suggestedImprovements} />
            </Section>
        </div>
    );
};

const SocialMediaAnalysisReport: React.FC<{ data: SocialMediaAnalysis }> = ({ data }) => {
    return (
        <div className="p-6 space-y-8">
            <Section title="Core Scores">
                 <div className="flex justify-around items-center flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg h-full">
                    <ScoreGauge score={data.overallScore} label="Overall Score" />
                    <ScoreGauge score={data.hookEffectiveness.score} label="Hook Score" />
                    <ScoreGauge score={data.visualAppeal.score} label="Visual Score" />
                </div>
            </Section>

            <Section title="Audience Engagement">
                <div className="space-y-6">
                     <HighlightMetricCard
                        icon={MegaphoneIcon}
                        iconColor="#ec4899"
                        title="Hook Effectiveness"
                        score={data.hookEffectiveness.score}
                        scoreLabel="Effectiveness"
                        analysis={data.hookEffectiveness.critique}
                        suggestion={data.hookEffectiveness.suggestion}
                    />
                     <HighlightMetricCard
                        icon={ClipboardCheckIcon}
                        iconColor="#10b981"
                        title="Call-to-Action"
                        score={data.callToAction.score}
                        scoreLabel="Strength"
                        analysis={data.callToAction.critique}
                        suggestion={data.callToAction.suggestion}
                    />
                    <DataItem label="Predicted Engagement" content={data.engagementPrediction} isHighlight />
                </div>
            </Section>

            {data.viralitySuggestions && (
                <Section title="Virality Blueprint">
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <ScoreGauge score={data.viralityScore} label="Virality Score" />
                        </div>
                        <DataItem label="Suggested Viral Hooks" content={data.viralitySuggestions.hooks} />
                        <DataItem label="Virality Strategies" content={data.viralitySuggestions.strategies} />
                        <ViralityTimeline timeline={data.viralitySuggestions.timeline} />
                    </div>
                </Section>
            )}
            
            <Section title="Content & SEO">
                 <div className="space-y-6">
                    <HighlightMetricCard
                        icon={SparklesIcon}
                        iconColor="#8b5cf6"
                        title="Caption & Hashtags"
                        analysis={data.captionAndHashtags.critique}
                    />
                     <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300">Suggested Caption</h5>
                        <div className="mt-1 p-3 bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500 rounded-r-lg">
                            <pre className="text-sm whitespace-pre-wrap font-sans text-indigo-800 dark:text-indigo-200">{data.captionAndHashtags.suggestedCaption}</pre>
                        </div>
                    </div>
                     <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-300">Suggested Hashtags</h5>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {data.captionAndHashtags.suggestedHashtags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                 </div>
            </Section>
            
            <Section title="Production & Branding">
                <div className="space-y-6">
                    <HighlightMetricCard
                        icon={PaletteIcon}
                        iconColor="#3b82f6"
                        title="Visual Appeal"
                        score={data.visualAppeal.score}
                        scoreLabel="Appeal"
                        analysis={data.visualAppeal.critique}
                        suggestion={data.visualAppeal.suggestion}
                    />
                    <HighlightMetricCard
                        icon={TuningForkIcon}
                        iconColor="#f59e0b"
                        title="Brand Consistency"
                        score={data.brandConsistency.score}
                        scoreLabel="Alignment"
                        analysis={data.brandConsistency.critique}
                    />
                </div>
            </Section>
            
            <Section title="Final Recommendations">
                <DataItem label="Target Audience" content={data.targetAudience} />
                <DataItem label="Suggested Improvements" content={data.suggestedImprovements} />
            </Section>
        </div>
    );
};


// --- Financial Report ---

const FinancialReportAnalysisReport: React.FC<{ data: FinancialReportAnalysis }> = ({ data }) => {
    const sentimentConfig = {
        Positive: { color: 'green', icon: CheckIcon },
        Negative: { color: 'red', icon: XIcon },
        Neutral: { color: 'gray', icon: () => <span className="font-bold">-</span> },
        Mixed: { color: 'yellow', icon: () => <span className="font-bold">~</span> },
    };
    const currentSentiment = sentimentConfig[data.overallSentiment];
    const SentimentIcon = currentSentiment.icon;
    
    return (
        <div className="p-6 space-y-6">
             <Section title="Executive Summary">
                <p className="text-sm text-gray-600 dark:text-gray-400">{data.summary}</p>
            </Section>

            <Section title="Key Metrics">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.keyMetrics.map(metric => (
                        <div key={metric.metric} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.metric}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">{metric.value}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{metric.analysis}</p>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Sentiment Analysis">
                <div className={`p-4 rounded-lg bg-${currentSentiment.color}-50 dark:bg-${currentSentiment.color}-900/30 border-l-4 border-${currentSentiment.color}-500`}>
                    <div className="flex items-center">
                        <div className={`mr-3 flex-shrink-0 h-6 w-6 rounded-full bg-${currentSentiment.color}-500 flex items-center justify-center`}>
                            <SentimentIcon className="h-4 w-4 text-white" />
                        </div>
                        <h5 className={`font-semibold text-lg text-${currentSentiment.color}-800 dark:text-${currentSentiment.color}-200`}>{data.overallSentiment}</h5>
                    </div>
                    <p className={`mt-2 text-sm text-${currentSentiment.color}-700 dark:text-${currentSentiment.color}-300`}>{data.sentimentAnalysis}</p>
                </div>
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Section title="Key Risks">
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {data.keyRisks.map((risk, i) => <li key={i}>{risk}</li>)}
                    </ul>
                </Section>
                 <Section title="Key Opportunities">
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        {data.keyOpportunities.map((opp, i) => <li key={i}>{opp}</li>)}
                    </ul>
                </Section>
            </div>
        </div>
    );
};

// --- Document Analysis Report ---
const DocumentAnalysisReport: React.FC<{ data: DocumentAnalysis }> = ({ data }) => {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Section title="Executive Summary">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{data.summary}</p>
                    </Section>
                    <Section title="Key Points">
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {data.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    </Section>
                </div>
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex flex-col items-center">
                        <ScoreGauge score={data.clarityScore} label="Clarity Score" />
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <StatCard label="Tone Analysis" value={data.tone} />
                    </div>
                </div>
            </div>
             <Section title="Strategic Suggestions">
                <DataItem label="Suggested Title" content={data.suggestedTitle} isHighlight />
                <DataItem label="Target Audience" content={data.targetAudience} />
             </Section>
        </div>
    );
};


export const DetailedAnalysisCard: React.FC<DetailedAnalysisCardProps> = ({ title, data }) => {
    const renderContent = () => {
        switch(title) {
            case 'Sales Call Analysis':
                return <SalesCallAnalysisReport data={data as SalesCallAnalysis & { speakerARole: 'me' | 'client', speakerBRole: 'me' | 'client' }} />;
            case 'Video Analysis':
                return <VideoAnalysisReport data={data as VideoAnalysis} />;
            case 'Social Media Analysis':
                return <SocialMediaAnalysisReport data={data as SocialMediaAnalysis} />;
            case 'Document Analysis':
                return <DocumentAnalysisReport data={data as DocumentAnalysis} />;
            case 'Financial Report Analysis':
                return <FinancialReportAnalysisReport data={data as FinancialReportAnalysis} />;
            default:
                // Fallback for other analysis types (Social Media, Product Ad, etc.)
                const { viralityTimeline, viralitySuggestions, audioAnalysis, speechAnalysis, talkToListenRatio, ...restOfData } = data;
                const scores = Object.entries(restOfData).filter(([key, value]) => typeof value === 'number' && (key.toLowerCase().includes('score') || key.toLowerCase().includes('rating')));
                const textData = Object.entries(restOfData).filter(([key, value]) => !scores.some(s => s[0] === key));
                return (
                    <div className="p-4 space-y-4">
                        {scores.length > 0 && (
                            <div className="flex justify-around items-center flex-wrap gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                {scores.map(([key, value]) => (
                                <ScoreGauge key={key} score={value as number} label={formatKey(key)} />
                                ))}
                            </div>
                        )}
                        {textData.map(([key, value]) => (
                            <div key={key}>
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300">{formatKey(key)}</h4>
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                        {value.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-gray-600 dark:text-gray-400">{String(value)}</p>
                                )}
                            </div>
                        ))}
                    </div>
                );
        }
    };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      </div>
      {renderContent()}
    </div>
  );
};