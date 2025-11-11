import type { AnalysisType } from './components/AnalysisTypeSelector';

export interface TranscriptEntry {
  speaker: string;
  text: string;
  startTime?: number;
  endTime?: number;
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

export interface SocialMediaAnalysis {
    hookEffectiveness: string;
    visualAppeal: string;
    callToAction: string;
    brandConsistency: string;
    overallScore: number;
    [key: string]: string | number; // Index signature
}

export interface AdAnalysis {
    clarityOfMessage: string;
    targetAudienceAlignment: string;
    emotionalImpact: string;
    callToActionStrength: string;
    overallScore: number;
    [key: string]: string | number; // Index signature
}

export interface VideoAnalysis {
    visualPacing: string;
    audioQuality: string;
    messageClarity: string;
    brandConsistency: string;
    engagementPotential: string;
    editingStyle: string;
    thumbnailSuggestion: string;
    captionQuality: string;
    viralityScore: number;
    overallScore: number;
    suggestedAudience: string;
    hookQuality: string;
    monetizationPotential: string;
    [key: string]: string | number;
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

export interface AnalysisResult {
  transcript?: TranscriptEntry[];
  performanceMetrics?: PerformanceMetricPoint[];
  feedbackCard: FeedbackCardData;
  socialMediaAnalysis?: SocialMediaAnalysis;
  adAnalysis?: AdAnalysis;
  videoAnalysis?: VideoAnalysis;
  liveStreamAnalysis?: LiveStreamAnalysis;
  documentAnalysis?: DocumentAnalysis;
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
  analysisType: 'salesCall' | 'socialMedia' | 'productAd' | 'videoAnalysis' | 'documentAnalysis' | 'liveStream';
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
  videoDuration?: 'short' | 'medium' | 'long';
  videoStylePresets?: string[];
  referenceFrameCount?: number;
  voiceoverScripts?: VoiceoverScript[];
  voice?: string;
}