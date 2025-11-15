import type { AnalysisType } from './components/SidebarNav';

export interface TranscriptEntry {
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
  tags?: string[];
}

export interface PerformanceScore {
    metric: string;
    value: number;
}

export interface PerformanceMetricPoint {
    label: string;
    scores: PerformanceScore[];
}

export interface FeedbackCardData {
  strengths: string[];
  opportunities: string[];
}

export interface AudioAnalysis {
    qualityScore: number;
    qualityCritique: string;
    qualitySuggestion: string;
    pacingWPM: number;
    fillerWordCount: number;
    sentiment: string;
}

export interface SpeechAnalysis {
    pacingWPM: number;
    fillerWordCount: number;
    dominantTone: string;
}

export interface KeywordAnalysis {
    keywords: string[];
    topics: string[];
}

export interface MomentsSummary {
    objections: number;
    actionItems: number;
    keyDecisions: number;
}

export interface AudienceRetentionPredictionPoint {
    timeLabel: string;
    retentionPercent: number;
    reason: string;
}

export interface ViralityCurvePoint {
    timeLabel: string; // e.g., "1h", "6h", "24h", "3d", "7d"
    predictedViews: number;
}

export interface SalesCallAnalysis {
    summary: string;
    overallPerformance: string;
    rapportBuilding: string;
    needsDiscovery: string;
    productPresentation: string;
    objectionHandling: string;
    closingEffectiveness: string;
    clarityScore: number;
    confidenceScore: number;
    speechAnalyses?: { [speakerId: string]: SpeechAnalysis };
    strengths: string[];
    weaknesses: string[];
    areasOfImprovement: string[];
    momentsSummary?: MomentsSummary;
    brandVoiceAlignment?: {
        score: number;
        analysis: string;
    };
    talkTimeRatio?: { // Renamed for clarity and flexibility
        [speakerId: string]: number; // e.g., { 'A': 65, 'B': 35 }
    };
    talkToListenRatio?: { // Keep for backward compatibility if needed, but prefer talkTimeRatio
        salesperson: number;
        client: number;
        analysis: string;
    };
    viralitySuggestions: {
        title: string;
        description: string;
        hooks: string[];
        keyViralMoment?: string;
        viralityScore?: number;
        timeline: {
            hours: string;
            day: string;
            week: string;
        };
    };
    [key: string]: any;
}

export interface SocialMediaAnalysis {
    hookEffectiveness: {
        score: number;
        critique: string;
        suggestion: string;
    };
    visualAppeal: {
        score: number;
        critique: string;
        suggestion: string;
    };
    callToAction: {
        score: number;
        critique: string;
        suggestion: string;
    };
    brandConsistency: {
        score: number;
        critique: string;
    };
    overallScore: number;
    engagementPrediction: string;
    captionAndHashtags: {
        critique: string;
        suggestedCaption: string;
        suggestedHashtags: string[];
    };
    suggestedImprovements: string[];
    viralityScore: number;
    viralitySuggestions: {
        hooks: string[];
        strategies: string[];
        timeline: {
            hours: string;
            day: string;
            week: string;
        };
    };
    targetAudience: string;
    [key: string]: any;
}


export interface AdAnalysis {
    clarityOfMessage: string;
    targetAudienceAlignment: string;
    emotionalImpact: string;
    callToActionStrength: string;
    overallScore: number;
    [key: string]: string | number; // Index signature
}

export interface EditingSuggestion {
    timestamp: string;
    type: 'Cut' | 'Effect' | 'Text' | 'Audio';
    suggestion: string;
}

export interface VideoAnalysis {
    visualPacing: string;
    audioAnalysis?: AudioAnalysis;
    messageClarity: string;
    brandConsistency: string;
    engagementPotential: string;
    editingStyle: string;
    thumbnailSuggestion: {
        score: number;
        critique: string;
        suggestion: string;
    };
    captionQuality: {
        score: number;
        critique: string;
        suggestion: string;
    };
    viralityScore: number;
    overallScore: number;
    suggestedAudience: string;
    hookQuality: {
        score: number;
        critique: string;
        suggestion: string;
    };
    monetizationPotential: string;
    suggestedImprovements: string[];
    audienceRetentionPrediction?: AudienceRetentionPredictionPoint[];
    momentsSummary?: MomentsSummary;
    ctaEffectiveness?: {
        score: number;
        critique: string;
        suggestion: string;
        placementAnalysis: string;
        wordingAnalysis: string;
    };
    keyViralMoment?: string;
    viralityTimeline?: { hours: string; day: string; week: string; };
    viralityCurve?: ViralityCurvePoint[];
    technicalQuality?: {
        resolutionClarity: { score: number; critique: string; suggestion: string; };
        lighting: { score: number; critique: string; suggestion: string; };
        colorGrading: { score: number; critique: string; suggestion: string; };
    };
    viralitySuggestions?: {
        hooks: string[];
    };
    engagementStrategy?: string[];
    suggestedDescription?: string;
    suggestedTitles?: string[];
    suggestedTags?: string[];
    editingSuggestions?: EditingSuggestion[];
    [key: string]: any;
}

export interface LiveStreamAnalysis {
    peakEngagementMoments: string[];
    averageViewerSentiment: string;
    pacingAndFlow: string;
    audienceInteraction: string;
    keyTakeaways: string[];
    monetizationOpportunities: string[];
    overallScore: number;
    [key: string]: string | number | string[];
}


export interface DocumentAnalysis {
    summary: string;
    keyPoints: string[];
    tone: string;
    clarityScore: number;
    suggestedTitle: string;
    targetAudience: string;
    [key: string]: string | number | string[];
}

export interface FinancialReportAnalysis {
    summary: string;
    keyMetrics: {
        metric: string;
        value: string;
        analysis: string;
    }[];
    overallSentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
    sentimentAnalysis: string;
    keyRisks: string[];
    keyOpportunities: string[];
}

export interface AnalysisResult {
  transcript?: TranscriptEntry[];
  performanceMetrics?: PerformanceMetricPoint[];
  feedbackCard: FeedbackCardData;
  keywordAnalysis?: KeywordAnalysis;
  salesCallAnalysis?: SalesCallAnalysis;
  socialMediaAnalysis?: SocialMediaAnalysis;
  adAnalysis?: AdAnalysis;
  videoAnalysis?: VideoAnalysis;
  liveStreamAnalysis?: LiveStreamAnalysis;
  documentAnalysis?: DocumentAnalysis;
  financialReportAnalysis?: FinancialReportAnalysis;
  keyTakeaways?: string[];
}

export interface RetirementPhase {
    title: string;
    summary: string;
    recommendations: string[];
}

export interface RetirementProjectionPoint {
    year: number;
    value: number;
}

export interface RetirementPlan {
    isFeasible: boolean;
    summary: string;
    projectedNestEgg: number;
    projectedMonthlyIncome: number;
    recommendations: string[];
    accumulationPhase: RetirementPhase;
    decumulationPhase: RetirementPhase;
    projections: RetirementProjectionPoint[];
}


export interface VoiceoverScript {
    id: number;
    speaker: string;
    script: string;
    voice: string;
}

export interface ViralScript {
  titles: string[];
  description: string;
  tags: string[];
  thumbnailConcepts: string[];
  script: string;
  storyboard: string;
  monetization: string;
  socialPost?: string;
}

export interface User {
    email: string;
    name?: string;
    plan: 'Free' | 'Creator' | 'Pro';
    role: 'user' | 'owner';
    activated?: boolean;
}

export interface AnalysisHistoryItem {
  result: AnalysisResult;
  analysisType: 'salesCall' | 'socialMedia' | 'productAd' | 'videoAnalysis' | 'documentAnalysis' | 'liveStream' | 'liveDebugger' | 'financialReport' | 'videoToScript';
  timestamp: string;
  fileName?: string;
}

export interface PromptHistoryItem {
  prompt: string;
  timestamp: string;
  type: 'script' | 'image' | 'video' | 'speech';
  link?: string;
  imageModel?: 'imagen-4.0-generate-001' | 'gemini-2.5-flash-image';
  aspectRatio?: string;
  imageStylePresets?: string[];
  imageMimeType?: 'image/jpeg' | 'image/png';
  videoModel?: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
  resolution?: '720p' | '1080p';
  videoDuration?: number;
  videoStylePresets?: string[];
  referenceFrameCount?: number;
  voiceoverScripts?: VoiceoverScript[];
  voice?: string;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}