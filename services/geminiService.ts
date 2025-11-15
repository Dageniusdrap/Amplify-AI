import { GoogleGenAI, Type, Modality } from "@google/genai";
import { pcmToMp3Blob, decode } from '../utils/audio';
import type {
  AnalysisResult,
  VoiceoverScript,
  RetirementPlan,
} from "../types";

class ModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModerationError";
  }
}

const handleApiError = (error: any) => {
    console.error("Gemini API call failed:", error);
    if (error.message) {
        // Check for safety policy violations first
        if (error.message.includes('SAFETY')) {
             return "The request was blocked due to safety policies. Please modify your prompt and try again.";
        }
        if (error.message.includes('Requested entity was not found.')) {
            return "API Key validation failed. Please re-select your API key and ensure it has access to the Veo model.";
        }
        try {
            // The error message from the API is often a JSON string itself.
            const errorJson = JSON.parse(error.message);
            if (errorJson.error && errorJson.error.message) {
                const message = errorJson.error.message;
                if (message.includes('RESOURCE_EXHAUSTED') || errorJson.error.code === 429) {
                     return "You've exceeded your current quota. Please check your plan and billing details or try again later.";
                }
                if (message.includes("API key not valid")) {
                    return "The provided API key is not valid. Please check your key and try again.";
                }
                if (message.includes("billing account")) {
                    return "This action failed. Please ensure you have a billing account enabled on your Google Cloud project.";
                }
                 if (errorJson.error.code === 500) {
                    return "The server encountered an internal error. This may be due to a complex request. Please try simplifying your prompt or try again later.";
                }
                // Return the specific error message from the API
                return message;
            }
        } catch (e) {
            // Not a JSON error message, return the original message.
            return error.message;
        }
    }
    return "An unknown error occurred with the Gemini API.";
};


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = async (file: File, onProgress?: (progress: number) => void) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    if (onProgress) {
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      };
    }
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

const audioAnalysisSchema = {
    type: Type.OBJECT,
    description: "In-depth analysis of the audio and speech quality.",
    properties: {
        qualityScore: { type: Type.NUMBER, description: "A score from 1-10 for overall audio quality (clarity, noise, consistency)." },
        qualityCritique: { type: Type.STRING, description: "Specific critique of the audio quality." },
        qualitySuggestion: { type: Type.STRING, description: "A specific, actionable suggestion for improving the audio quality (e.g., 'Use a low-pass filter to reduce hiss')." },
        pacingWPM: { type: Type.NUMBER, description: "The speaker's average words per minute." },
        fillerWordCount: { type: Type.NUMBER, description: "An estimated count of filler words like 'um', 'ah', 'like'." },
        sentiment: { type: Type.STRING, description: "The dominant sentiment of the speech (e.g., 'Positive', 'Energetic', 'Neutral')." },
    },
    required: ["qualityScore", "qualityCritique", "qualitySuggestion", "pacingWPM", "fillerWordCount", "sentiment"],
};

const speechAnalysisSchema = {
    type: Type.OBJECT,
    description: "Analysis of a speaker's speech patterns.",
    properties: {
        pacingWPM: { type: Type.NUMBER, description: "The speaker's average words per minute." },
        fillerWordCount: { type: Type.NUMBER, description: "An estimated count of filler words used by the speaker." },
        dominantTone: { type: Type.STRING, description: "The speaker's dominant tone (e.g., 'Confident', 'Empathetic', 'Hesitant')." },
    },
    required: ["pacingWPM", "fillerWordCount", "dominantTone"],
};

const financialReportAnalysisSchema = {
    type: Type.OBJECT,
    description: "Expert analysis of a financial document.",
    properties: {
        summary: { type: Type.STRING, description: "A concise executive summary of the financial report." },
        keyMetrics: {
            type: Type.ARRAY,
            description: "A list of the 3-5 most important financial metrics from the document.",
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING, description: "The name of the metric (e.g., 'Revenue', 'Net Income')." },
                    value: { type: Type.STRING, description: "The value of the metric, including units (e.g., '$1.2B', '5.3%')." },
                    analysis: { type: Type.STRING, description: "A brief, one-sentence analysis of this metric's significance." },
                },
                required: ["metric", "value", "analysis"],
            },
        },
        overallSentiment: {
            type: Type.STRING,
            description: "The overall sentiment of the report.",
            enum: ['Positive', 'Negative', 'Neutral', 'Mixed'],
        },
        sentimentAnalysis: { type: Type.STRING, description: "A brief explanation for the determined overall sentiment." },
        keyRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of key risks mentioned or implied in the report." },
        keyOpportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of key opportunities mentioned or implied." },
    },
    required: ["summary", "keyMetrics", "overallSentiment", "sentimentAnalysis", "keyRisks", "keyOpportunities"],
};

const momentsSummarySchema = {
    type: Type.OBJECT,
    description: "A summary count of key moments identified in the transcript.",
    properties: {
        objections: { type: Type.NUMBER, description: "Total count of 'Objection' tags." },
        actionItems: { type: Type.NUMBER, description: "Total count of 'Action Item' tags." },
        keyDecisions: { type: Type.NUMBER, description: "Total count of 'Key Decision' tags." },
    },
    required: ["objections", "actionItems", "keyDecisions"],
};

const scoreCritiqueSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "A score from 1-10 for this category's effectiveness." },
        critique: { type: Type.STRING, description: "A brief critique of this category." },
        suggestion: { type: Type.STRING, description: "A specific, rewritten suggestion for improvement." },
    },
    required: ["score", "critique", "suggestion"],
};

const technicalQualityDetailSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.NUMBER, description: "A score from 1-10 for this technical aspect." },
        critique: { type: Type.STRING, description: "A brief critique of this aspect." },
        suggestion: { type: Type.STRING, description: "A specific, actionable suggestion for improvement." },
    },
    required: ["score", "critique", "suggestion"],
};

const analysisResultSchema = {
    type: Type.OBJECT,
    properties: {
        transcript: {
            type: Type.ARRAY,
            description: "A transcript of the conversation, with speaker labels, text, and timestamps.",
            items: {
                type: Type.OBJECT,
                properties: {
                    speaker: { type: Type.STRING, description: "Speaker identifier (e.g., 'A', 'B')." },
                    text: { type: Type.STRING, description: "The transcribed text of what the speaker said." },
                    startTime: { type: Type.NUMBER, description: "Start time of the speech in seconds." },
                    endTime: { type: Type.NUMBER, description: "End time of the speech in seconds." },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of tags identifying the nature of this transcript entry, e.g., 'Action Item', 'Objection', 'Viral Moment'." },
                },
                required: ["speaker", "text", "startTime", "endTime"],
            },
        },
        performanceMetrics: {
            type: Type.ARRAY,
            description: "A breakdown of performance metrics over time-based segments of the content (e.g., '0-15s', '16-30s'). Segments should be roughly 15-30 seconds long.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: "The time-based segment identifier (e.g., '0-15s', '16-30s')." },
                    scores: {
                        type: Type.ARRAY,
                        description: "An array of metric scores for this segment.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                metric: { type: Type.STRING, description: "The name of the metric (e.g., 'Clarity', 'Confidence')." },
                                value: { type: Type.NUMBER, description: "The score for the metric (0-10)." },
                            },
                             required: ["metric", "value"],
                        }
                    }
                },
                required: ["label", "scores"]
            }
        },
        feedbackCard: {
            type: Type.OBJECT,
            description: "Actionable feedback based on the analysis.",
            properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key strengths of the content." },
                opportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Areas for improvement." },
            },
            required: ["strengths", "opportunities"],
        },
        keywordAnalysis: {
            type: Type.OBJECT,
            description: "Analysis of keywords and topics from the transcript.",
            properties: {
                keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of the top 5-7 most important keywords or short phrases." },
                topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of the 3-4 main topics or themes discussed." },
            },
            required: ["keywords", "topics"],
        },
        salesCallAnalysis: {
            type: Type.OBJECT,
            description: "Comprehensive analysis of a sales call's effectiveness, including sales coaching and virality potential.",
            properties: {
                summary: { type: Type.STRING, description: "A one-sentence executive summary of the call's outcome and key dynamics." },
                overallPerformance: { type: Type.STRING, description: "A summary of the call's effectiveness." },
                rapportBuilding: { type: Type.STRING, description: "Analysis of how well the salesperson built rapport." },
                needsDiscovery: { type: Type.STRING, description: "Evaluation of the needs discovery process." },
                productPresentation: { type: Type.STRING, description: "Critique of the product pitch." },
                objectionHandling: { type: Type.STRING, description: "Assessment of how objections were handled." },
                closingEffectiveness: { type: Type.STRING, description: "Analysis of the closing technique." },
                clarityScore: { type: Type.NUMBER, description: "A score from 1-10 for the salesperson's message clarity." },
                confidenceScore: { type: Type.NUMBER, description: "A score from 1-10 for the salesperson's perceived confidence." },
                speechAnalyses: {
                    type: Type.OBJECT,
                    description: "An object containing speech analysis for each speaker, keyed by their ID (e.g., 'A', 'B').",
                    properties: {
                        A: speechAnalysisSchema,
                        B: speechAnalysisSchema,
                    }
                },
                momentsSummary: momentsSummarySchema,
                brandVoiceAlignment: {
                    type: Type.OBJECT,
                    description: "Analysis of how well the salesperson's language matched the company's brand voice.",
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1-10 for brand voice alignment." },
                        analysis: { type: Type.STRING, description: "A brief analysis of the alignment, with suggestions." },
                    },
                    required: ["score", "analysis"],
                },
                talkTimeRatio: {
                    type: Type.OBJECT,
                    description: "The percentage of time each speaker spoke, keyed by their ID.",
                    properties: {
                        A: { type: Type.NUMBER },
                        B: { type: Type.NUMBER },
                    },
                },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the key strengths demonstrated in the call." },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the main weaknesses or missed opportunities in the call." },
                areasOfImprovement: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of specific, actionable suggestions for the salesperson." },
                viralitySuggestions: {
                    type: Type.OBJECT,
                    description: "Suggestions for turning moments from this call into viral content.",
                    properties: {
                        title: { type: Type.STRING, description: "A catchy title for a short video based on the call." },
                        description: { type: Type.STRING, description: "A description for the social media post." },
                        keyViralMoment: { type: Type.STRING, description: "A quote or description of the single most powerful, shareable moment from the call." },
                        viralityScore: { type: Type.NUMBER, description: "A score from 1-10 indicating the viral potential of the key moment." },
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 potential opening hooks for a short video." },
                        timeline: {
                            type: Type.OBJECT,
                            description: "A prediction of the content's viral potential.",
                            properties: {
                                hours: { type: Type.STRING, description: "Performance prediction for the first few hours." },
                                day: { type: Type.STRING, description: "Performance prediction for the first 24 hours." },
                                week: { type: Type.STRING, description: "Performance prediction for the first week." },
                            },
                            required: ["hours", "day", "week"],
                        }
                    },
                     required: ["title", "description", "hooks", "timeline", "keyViralMoment", "viralityScore"],
                },
            },
        },
        socialMediaAnalysis: {
            type: Type.OBJECT,
            description: "Expert-level analysis of social media content.",
            properties: {
                hookEffectiveness: { ...scoreCritiqueSuggestionSchema, description: "Analysis of the content's hook (first 3 seconds)." },
                visualAppeal: { ...scoreCritiqueSuggestionSchema, description: "Assessment of visual appeal, editing, and aesthetics." },
                callToAction: { ...scoreCritiqueSuggestionSchema, description: "Evaluation of the call-to-action's clarity and strength." },
                brandConsistency: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1-10 for brand alignment." },
                        critique: { type: Type.STRING, description: "Analysis of how well the content aligns with a professional brand." },
                    },
                    required: ["score", "critique"],
                },
                overallScore: { type: Type.NUMBER, description: "An expert rating from 1 to 10 for the content's overall potential success." },
                engagementPrediction: { type: Type.STRING, description: "A specific prediction of likely engagement (e.g., 'Low comments, high shares') with justification." },
                captionAndHashtags: {
                    type: Type.OBJECT,
                    properties: {
                        critique: { type: Type.STRING, description: "A critique of the current caption and hashtag strategy." },
                        suggestedCaption: { type: Type.STRING, description: "A rewritten, high-impact caption, using emojis where appropriate." },
                        suggestedHashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 optimized hashtags (e.g., 2 broad, 3 niche, 1-2 community-specific)." },
                    },
                    required: ["critique", "suggestedCaption", "suggestedHashtags"],
                },
                suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 high-impact, actionable improvements." },
                viralityScore: { type: Type.NUMBER, description: "A score from 1-10 for virality potential, with a brief justification." },
                viralitySuggestions: {
                    type: Type.OBJECT,
                    description: "Suggestions for making the content go viral.",
                    properties: {
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 alternative viral hooks (short, punchy sentences)." },
                        strategies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 specific, creative strategies to boost virality (e.g., 'Collaborate with a creator in X niche', 'Use this trending sound but with a twist')." },
                        timeline: {
                            type: Type.OBJECT,
                            description: "A prediction of the content's viral potential over different timeframes.",
                            properties: {
                                hours: { type: Type.STRING, description: "Performance prediction for the first few hours." },
                                day: { type: Type.STRING, description: "Performance prediction for the first 24 hours." },
                                week: { type: Type.STRING, description: "Performance prediction for the first week." },
                            },
                            required: ["hours", "day", "week"],
                        }
                    },
                    required: ["hooks", "strategies", "timeline"]
                },
                targetAudience: { type: Type.STRING, description: "A description of the ideal target audience for this content." },
            },
        },
        adAnalysis: {
            type: Type.OBJECT,
            description: "Analysis specific to a product advertisement.",
            properties: {
                clarityOfMessage: { type: Type.STRING },
                targetAudienceAlignment: { type: Type.STRING },
                emotionalImpact: { type: Type.STRING },
                callToActionStrength: { type: Type.STRING },
                overallScore: { type: Type.NUMBER },
            },
        },
        videoAnalysis: {
            type: Type.OBJECT,
            description: "Expert-level analysis of video content.",
            properties: {
                visualPacing: { type: Type.STRING, description: "Analysis of the video's pacing." },
                audioAnalysis: audioAnalysisSchema,
                messageClarity: { type: Type.STRING, description: "Clarity of the core message." },
                brandConsistency: { type: Type.STRING, description: "Consistency with brand identity." },
                engagementPotential: { type: Type.STRING, description: "Potential to engage viewers." },
                editingStyle: { type: Type.STRING, description: "Critique of the editing style and suggestions." },
                thumbnailSuggestion: {
                    type: Type.OBJECT,
                    description: "A detailed analysis of the video's thumbnail potential.",
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1-10 for the thumbnail's potential effectiveness." },
                        critique: { type: Type.STRING, description: "A brief critique of the current or implied thumbnail." },
                        suggestion: { type: Type.STRING, description: "A specific, rewritten thumbnail concept describing visuals, text placement, and emotional expression." },
                    },
                    required: ["score", "critique", "suggestion"],
                },
                captionQuality: {
                    type: Type.OBJECT,
                    description: "Evaluation of captions for accuracy, readability, and styling. Provide suggestions for dynamic/animated captions.",
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1-10 for overall caption quality and effectiveness." },
                        critique: { type: Type.STRING, description: "A brief critique of the current captions (or lack thereof)." },
                        suggestion: { type: Type.STRING, description: "Specific suggestions for improvement, including styling and dynamic effects." },
                    },
                    required: ["score", "critique", "suggestion"],
                },
                hookQuality: {
                    type: Type.OBJECT,
                    description: "A detailed analysis of the video's hook (first 3-5 seconds).",
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1-10 for the hook's scroll-stopping power." },
                        critique: { type: Type.STRING, description: "A brief critique of the current hook." },
                        suggestion: { type: Type.STRING, description: "A specific, rewritten hook suggestion for a more powerful hook." },
                    },
                    required: ["score", "critique", "suggestion"],
                },
                viralitySuggestions: {
                    type: Type.OBJECT,
                    description: "Suggestions for making the content go viral.",
                    properties: {
                        hooks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 alternative viral hooks (short, punchy sentences)." },
                    },
                    required: ["hooks"],
                },
                viralityScore: { type: Type.NUMBER, description: "A score from 1 to 10 indicating virality potential." },
                overallScore: { type: Type.NUMBER, description: "An overall score from 1 to 10." },
                suggestedAudience: { type: Type.STRING, description: "The ideal target audience for this video." },
                monetizationPotential: { type: Type.STRING, description: "Suggestions for monetizing the content." },
                suggestedImprovements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the 3-5 most impactful, actionable improvements the creator should make." },
                momentsSummary: momentsSummarySchema,
                audienceRetentionPrediction: {
                    type: Type.ARRAY,
                    description: "A timeline of predicted audience retention, highlighting key drop-off points.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            timeLabel: { type: Type.STRING, description: "Timestamp for the prediction point (e.g., '0:15', '1:30')." },
                            retentionPercent: { type: Type.NUMBER, description: "Predicted percentage of viewers still watching." },
                            reason: { type: Type.STRING, description: "The likely reason for the retention level or drop-off at this point." },
                        },
                        required: ["timeLabel", "retentionPercent", "reason"],
                    }
                },
                ctaEffectiveness: {
                    type: Type.OBJECT,
                    description: "Analysis of the video's call to action.",
                    properties: {
                        score: { type: Type.NUMBER, description: "A score from 1-10 for CTA effectiveness." },
                        critique: { type: Type.STRING, description: "A brief critique of the current CTA." },
                        suggestion: { type: Type.STRING, description: "A specific, rewritten CTA suggestion that uses strong psychological triggers (e.g., urgency, scarcity, social proof)." },
                        placementAnalysis: { type: Type.STRING, description: "Analysis of where the CTA is placed in the video." },
                        wordingAnalysis: { type: Type.STRING, description: "Analysis of the specific language used in the CTA." },
                    },
                    required: ["score", "critique", "suggestion", "placementAnalysis", "wordingAnalysis"],
                },
                keyViralMoment: { type: Type.STRING, description: "A quote or description of the single most powerful, shareable moment from the video." },
                viralityTimeline: {
                    type: Type.OBJECT,
                    description: "A prediction of the content's viral potential over different timeframes.",
                    properties: {
                        hours: { type: Type.STRING, description: "Performance prediction for the first few hours." },
                        day: { type: Type.STRING, description: "Performance prediction for the first 24 hours." },
                        week: { type: Type.STRING, description: "Performance prediction for the first week." },
                    },
                    required: ["hours", "day", "week"],
                },
                viralityCurve: {
                    type: Type.ARRAY,
                    description: "An array of data points for plotting a virality curve, predicting view counts over time.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            timeLabel: { type: Type.STRING, description: "The time interval label (e.g., '1h', '6h', '24h', '3d', '7d')." },
                            predictedViews: { type: Type.NUMBER, description: "The predicted number of views at this time interval." },
                        },
                        required: ["timeLabel", "predictedViews"],
                    }
                },
                technicalQuality: {
                    type: Type.OBJECT,
                    description: "Analysis of the video's technical production quality.",
                    properties: {
                        resolutionClarity: { ...technicalQualityDetailSchema, description: "Critique of the video's resolution and sharpness." },
                        lighting: { ...technicalQualityDetailSchema, description: "Analysis of the lighting setup and effectiveness." },
                        colorGrading: { ...technicalQualityDetailSchema, description: "Evaluation of the video's color grading and mood." },
                    },
                     required: ["resolutionClarity", "lighting", "colorGrading"],
                },
                 editingSuggestions: {
                    type: Type.ARRAY,
                    description: "A list of timestamped editing suggestions to improve pacing and engagement.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            timestamp: { type: Type.STRING, description: "Timestamp for the suggestion (e.g., '0:15')." },
                            type: { type: Type.STRING, description: "Type of suggestion.", enum: ['Cut', 'Effect', 'Text', 'Audio'] },
                            suggestion: { type: Type.STRING, description: "The specific editing suggestion." },
                        },
                        required: ["timestamp", "type", "suggestion"],
                    }
                },
                engagementStrategy: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A bulleted list of 3-5 specific, creative strategies to boost audience engagement for this video (e.g., 'At 1:15, add a poll card asking X', 'Pin a comment that asks viewers to share their own experiences with Y')."
                },
                suggestedDescription: {
                    type: Type.STRING,
                    description: "A compelling, SEO-friendly description for the video (e.g., for YouTube), including relevant hashtags."
                },
                suggestedTitles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 3-5 alternative, highly clickable, SEO-friendly titles for the video."
                },
                suggestedTags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 10-15 relevant tags/keywords for YouTube/social media discoverability, optimized for search."
                },
            },
        },
        liveStreamAnalysis: {
            type: Type.OBJECT,
            description: "Analysis specific to a live stream video.",
            properties: {
                peakEngagementMoments: { type: Type.ARRAY, items: { type: Type.STRING, description: "Timestamps or descriptions of high-engagement moments." } },
                averageViewerSentiment: { type: Type.STRING, description: "Overall audience sentiment (e.g., Positive, Neutral, Mixed)." },
                pacingAndFlow: { type: Type.STRING, description: "Critique of the stream's pacing and flow." },
                audienceInteraction: { type: Type.STRING, description: "Evaluation of how well the streamer interacted with the audience." },
                keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Main points or highlights from the stream." },
                monetizationOpportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific suggestions for monetization." },
                overallScore: { type: Type.NUMBER, description: "An overall score from 1 to 10." },
            },
        },
        documentAnalysis: {
            type: Type.OBJECT,
            description: "Analysis specific to a text document.",
            properties: {
                summary: { type: Type.STRING, description: "A concise executive summary of the document." },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bulleted list of the most critical points." },
                tone: { type: Type.STRING, description: "Analysis of the document's tone (e.g., Formal, Casual, Persuasive)." },
                clarityScore: { type: Type.NUMBER, description: "A score from 1 to 10 for clarity and readability." },
                suggestedTitle: { type: Type.STRING, description: "A more impactful or clearer title suggestion." },
                targetAudience: { type: Type.STRING, description: "The perceived target audience for the document." },
            },
        },
        financialReportAnalysis: financialReportAnalysisSchema,
    },
    required: ["feedbackCard"],
};

const retirementPlanSchema = {
    type: Type.OBJECT,
    properties: {
        isFeasible: { type: Type.BOOLEAN, description: "Whether the retirement plan is feasible based on the inputs." },
        summary: { type: Type.STRING, description: "A concise summary of the retirement outlook." },
        projectedNestEgg: { type: Type.NUMBER, description: "The total estimated savings at the specified retirement age." },
        projectedMonthlyIncome: { type: Type.NUMBER, description: "The projected sustainable monthly income during retirement from the nest egg." },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-5 actionable recommendations to improve the plan." },
        accumulationPhase: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, default: "Accumulation Phase (Now until Retirement)" },
                summary: { type: Type.STRING, description: "Summary of the strategy during the savings phase." },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific recommendations for the accumulation phase." }
            },
            required: ["title", "summary", "recommendations"]
        },
        decumulationPhase: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, default: "Decumulation Phase (During Retirement)" },
                summary: { type: Type.STRING, description: "Summary of the strategy for spending during retirement." },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific recommendations for the decumulation phase." }
            },
             required: ["title", "summary", "recommendations"]
        },
        projections: {
            type: Type.ARRAY,
            description: "An array of projected savings values over time, in 5-year increments until retirement.",
            items: {
                type: Type.OBJECT,
                properties: {
                    year: { type: Type.NUMBER, description: "The year of the projection." },
                    value: { type: Type.NUMBER, description: "The projected total savings value for that year." }
                },
                required: ["year", "value"]
            }
        }
    },
    required: ["isFeasible", "summary", "projectedNestEgg", "projectedMonthlyIncome", "recommendations", "accumulationPhase", "decumulationPhase", "projections"]
};


const callApi = async (prompt: string, file?: File, onProgress?: (progress: number) => void) => {
    console.log("Calling Gemini with prompt:", prompt.substring(0, 100) + '...');
    try {
        const parts: any[] = [{ text: prompt }];
        if (file) {
            parts.unshift(await fileToGenerativePart(file, onProgress));
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisResultSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const analyzeSalesCall = (script: string, brandVoice: string, file?: File, onProgress?: (progress: number) => void) => {
    console.log("Performing Sales Call analysis with brand voice...");
    let prompt: string;
    const basePrompt = `
        Act as a dual-expert: a world-class sales coach and a viral marketing strategist. Your entire response must be a single, valid JSON object that conforms to the provided schema. Assume Speaker 'A' is the salesperson and Speaker 'B' is the client.

        **CRITICAL: Your feedback must be brutally honest and expert-level. Avoid generic advice. Focus on the most impactful changes.**
        
        **Provided Brand Voice:** "${brandVoice}"

        - First, if a media file is provided, provide a complete and extremely accurate transcript with speaker labels 'A' and 'B'. If only text is provided, parse it.
        - While generating the transcript, you MUST analyze each entry and add relevant tags to a 'tags' array. Possible tags are: 'Rapport Building', 'Needs Discovery', 'Objection', 'Action Item', 'Key Decision', 'Positive Sentiment', 'Negative Sentiment', 'Viral Moment'. An entry can have multiple tags.
        - After generating the transcript, create a 'momentsSummary' object by counting the total number of 'Objection', 'Action Item', and 'Key Decision' tags.
        - Based on the transcript, perform a 'keywordAnalysis'.
        - Generate 'performanceMetrics' by breaking the content into roughly 15-30 second intervals. The label for each metric point must be a time range string (e.g., '0-15s', '16-30s'). Score 'Clarity', 'Confidence', 'Client Engagement', and 'Sentiment' (0-10) for each interval.
        
        PART 1: SALES COACHING
        - **Provide a one-sentence executive 'summary' of the call's outcome and key dynamics.**
        - Fill out the rest of the 'salesCallAnalysis' object.
        - **Perform a separate, detailed 'speechAnalysis' for BOTH Speaker A and Speaker B. Populate the 'speechAnalyses' object with the results, keyed by 'A' and 'B'.**
        - Analyze how well the salesperson's language (Speaker A) matched the provided **Brand Voice**. Populate the 'brandVoiceAlignment' object with a score (1-10) and a brief, actionable analysis.
        - **Calculate the percentage of talk time for each speaker and populate the 'talkTimeRatio' object (e.g., { "A": 65, "B": 35 }).**
        - Populate the 'strengths', 'weaknesses', and 'areasOfImprovement' arrays with specific, actionable feedback for the salesperson (Speaker A).
        - Populate 'feedbackCard' with the top strengths and opportunities for the salesperson.
        
        PART 2: VIRAL MARKETING
        - Analyze the call for a "golden nugget" for social media.
        - Populate the 'viralitySuggestions' object.
        - Identify the 'keyViralMoment'. This should be a direct quote or a specific description of the single most compelling, shareable moment from the call.
        - Provide a 'viralityScore' (1-10) for this key moment, with a brief justification.
        - Create a catchy 'title', 'description', and 3 powerful 'hooks'.
        - Provide the 'timeline' virality prediction.
    `;

    if (file) {
        prompt = `Transcribe the provided audio/video of a sales call with high accuracy, then provide a comprehensive analysis. ${basePrompt}`;
    } else {
        prompt = `Analyze the following sales call transcript. The provided text is already a transcript, so you must parse it and populate the 'transcript' field. Then, provide the comprehensive analysis.
        ${basePrompt}
        
        Transcript to Analyze:
        ---
        ${script}
        ---
        `;
    }
    return callApi(prompt, file, onProgress);
};

export const analyzeSocialMediaContent = async (script: string, description: string, file?: File, onProgress?: (progress: number) => void): Promise<AnalysisResult> => {
    console.log("Performing Social Media analysis...");
    const prompt = `
    Act as a world-class viral marketing strategist providing a brutally honest, expert-level critique of the provided social media content. Avoid generic advice and focus on the most impactful changes. Your entire response must be a single, valid JSON object that conforms to the provided schema.

    ${file ? 'First, provide a highly accurate transcription of the attached media file and include the full transcript in the response. Then, based on the transcript, perform a `keywordAnalysis`, extracting top keywords and topics.' : ''}
    
    Content Details:
    - Script: ${script || 'Not provided.'}
    - Visuals/Goals Description: ${description || 'Not provided.'}
    - Attached Media: ${file ? 'Yes' : 'No'}

    **For your analysis, follow these expert instructions for each field in the 'socialMediaAnalysis' object:**
    - **overallScore**: Your expert rating from 1 to 10 for the content's overall potential for success.
    - **hookEffectiveness**: Provide a 'score' for the hook's scroll-stopping power (first 3 seconds). Justify it in 'critique'. Provide a rewritten, more powerful hook in 'suggestion'.
    - **visualAppeal**: Provide a 'score' for aesthetics. In 'critique', comment on composition, lighting, and editing. In 'suggestion', offer a concrete improvement (e.g., 'apply a specific color grade,' 'use a faster J-cut at 0:02').
    - **callToAction**: Provide a 'score' for the CTA's strength. In 'critique', state if it is weak, strong, or non-existent. In 'suggestion', provide a psychologically compelling, revised CTA that drives action.
    - **brandConsistency**: Give a 'score' for brand alignment. In 'critique', point out any inconsistencies with a professional brand tone and suggest how to improve it.
    - **engagementPrediction**: Provide a specific prediction (e.g., 'Low comments, high shares') and justify it with principles of social psychology.
    - **captionAndHashtags**: In 'critique', analyze the current caption and hashtag strategy. Then provide a 'suggestedCaption' that is rewritten for maximum impact and scannability (use emojis). Also provide a 'suggestedHashtags' array with 5-7 optimized hashtags (mix of broad, niche, and community-specific).
    - **suggestedImprovements**: List the 3-5 most high-impact, actionable improvements that could realistically double the content's performance. Frame them as 'Instead of X, do Y because Z.'
    - **viralityScore**: A score from 1-10 indicating virality potential. Justify this score based on psychological triggers (e.g., curiosity, controversy, social proof).
    - **viralitySuggestions**: Provide a 'viralitySuggestions' object.
        - 'hooks': A list of 3 alternative, high-impact hooks.
        - 'strategies': A list of 3 creative, actionable strategies to boost the video's virality.
        - 'timeline': A specific prediction for performance in the first few hours, first day, and first week, with justifications for each stage.
    - **targetAudience**: Describe the ideal viewer for this content in detail (e.g., 'Marketing managers in the B2B SaaS industry, aged 25-40').
  `;
    return callApi(prompt, file, onProgress);
};

export const analyzeProductAd = (script: string, description: string, file?: File, onProgress?: (progress: number) => void) => {
    console.log("Performing Product Ad analysis...");
    const prompt = `Analyze this product ad. ${file ? 'First, create a highly accurate transcript of the attached media file, include the full transcript in the JSON response, and perform a `keywordAnalysis` on the transcript.' : ''} Focus on message clarity, audience alignment, emotional impact, and CTA strength based on all provided materials. Provide an overall score and a feedback card.
    - Script: ${script || 'Not provided.'}
    - Visuals/Goals Description: ${description || 'Not provided.'}`;
    return callApi(prompt, file, onProgress);
};

export const analyzeVideoContent = async (file: File, onProgress?: (progress: number) => void): Promise<AnalysisResult> => {
  console.log("Performing Video analysis...");
  const prompt = `
    First, fully transcribe the provided video file with extremely high accuracy and include the complete, timestamped transcript in the JSON response.
    Then, act as a top-tier YouTube strategist and professional video editor, providing a brutally honest, expert-level critique. Your feedback must be professional, insightful, and ruthlessly focused on maximizing performance (views, retention, CTR). Avoid generic advice.
    Your entire response must be a single, valid JSON object that conforms to the provided schema.
    
    Follow these expert-level instructions for each field:
    - While generating the transcript, analyze each entry and add relevant tags: 'Hook', 'Call to Action', 'Main Point', 'Positive Sentiment', 'Negative Sentiment', 'Viral Moment'.
    - After the transcript, create a 'momentsSummary' object.
    - As a professional video editor, provide a detailed 'editingSuggestions' array. These should be timestamped, actionable suggestions on cuts, effects, text overlays, and audio cues to improve pacing and engagement (e.g., 'At 0:15, add a text overlay: "Key Mistake #1"').
    - Generate 'performanceMetrics' in ~15-30 second intervals, scoring 'Hook Strength', 'Visual Pacing', 'Message Clarity', and 'Sentiment' from 0-10.
    - Predict the video's view count growth: populate the 'viralityCurve' array with data points for '1h', '6h', '24h', '3d', and '7d'.
    - Predict audience retention: populate 'audienceRetentionPrediction' with 3-4 key points, providing 'timeLabel', 'retentionPercent', and a specific 'reason' for any drop-off.
    - engagementStrategy: Provide a bulleted list of 3-5 specific, creative strategies to boost audience engagement for this video (e.g., 'At 1:15, add a poll card asking X', 'Pin a comment that asks viewers to share their own experiences with Y', 'Create a short challenge related to the video's topic').
    - Based on the transcript, perform a 'keywordAnalysis'.
    - **CRITICAL**: Populate the 'audioAnalysis' object. Analyze the audio for clarity, background noise, and mixing. Provide a 'qualityScore', a 'qualityCritique', and a specific, actionable 'qualitySuggestion' (e.g., 'Use a low-pass filter to reduce hiss', 'Add background music at -18db'). Also analyze speech for pacing, filler words, and sentiment.
    - ctaEffectiveness: Perform a deep analysis of the call-to-action. Populate the 'ctaEffectiveness' object with a score, a critique, a specific rewritten 'suggestion' that uses strong psychological triggers (e.g., urgency, scarcity, social proof), a detailed 'placementAnalysis', and a 'wordingAnalysis'.
    - thumbnailSuggestion: Provide a specific, rewritten thumbnail concept for high CTR, describing visuals, text placement, and emotional expression based on psychological principles like curiosity gaps or social proof.
    - **CRITICAL**: Analyze the video's technical production quality. Populate the 'technicalQuality' object. For each property ('resolutionClarity', 'lighting', 'colorGrading'), provide a score from 1-10, a detailed critique, and a specific, actionable suggestion for improvement (e.g., for lighting suggestion: 'Lighting is flat; add a key light at a 45-degree angle to create more depth').
    - Identify the 'keyViralMoment'.
    - hookQuality: Provide a detailed analysis of the video's hook (the first 3-5 seconds). Populate 'hookQuality' with a score (1-10), a 'critique' of its scroll-stopping power, and a specific, rewritten 'suggestion' for a more powerful hook that uses psychological triggers like curiosity, controversy, or urgency.
    - viralitySuggestions: Based on the content, provide a list of 3-5 alternative viral 'hooks' (short, punchy sentences for social media) and populate them in the viralitySuggestions object.
    - viralityScore: Justify your 1-10 score by referencing specific psychological triggers (e.g., curiosity, controversy, social proof).
    - captionQuality: Evaluate the video's captions. Populate the 'captionQuality' object with a score, a critique of their effectiveness (accuracy, readability, styling), and a specific 'suggestion' for using dynamic or animated captions to increase visual interest.
    - suggestedDescription: Write a compelling, SEO-friendly description for the video, including 2-3 relevant hashtags at the end.
    - suggestedTitles: Provide 3-5 alternative, highly clickable, SEO-friendly titles for the video.
    - suggestedTags: Provide a list of 10-15 relevant tags/keywords for YouTube/social media discoverability, optimized for search.
    - visualPacing & editingStyle: Provide a refined, professional-level critique of the video's pacing and editing. Mention specific timestamps if possible. Give actionable advice.
    - viralityTimeline: Predict performance over hours, a day, and a week, with justifications.
    - suggestedImprovements: List the top 3-5 most impactful, actionable improvements.
    - Fill out the rest of the fields with your expert analysis.
  `;
  return callApi(prompt, file, onProgress);
};

export const transcribeVideo = async (file: File, onProgress?: (progress: number) => void): Promise<AnalysisResult> => {
  console.log("Performing Video to Script conversion...");
  const prompt = `
    Act as an expert transcriber and summarizer.
    First, provide a complete and highly accurate transcript of the provided video file, including timestamps (startTime, endTime in seconds) and speaker labels if possible (use 'A', 'B', etc. for different speakers). Ensure timestamps are precise.
    Then, based on the transcript, provide a concise 'summary' of the video's content and a bulleted list of 'keyPoints'.
    Your entire response must be a single, valid JSON object that conforms to the provided schema. You must populate the 'transcript' field, and the 'documentAnalysis' field with 'summary' and 'keyPoints'. Do not populate any other fields.
  `;
  return callApi(prompt, file, onProgress);
};

export const analyzeDocument = (script: string, description: string, file?: File, onProgress?: (progress: number) => void) => {
    console.log("Performing Document analysis...");
    const prompt = `
    Analyze the following document as an expert editor and strategist. Provide a brutally honest, expert-level critique. Avoid generic advice.
    Your entire response must be a single, valid JSON object conforming to the schema.
    
    ${script ? `Document Content: """${script}"""` : ''}
    Context/Goals: ${description || 'Not provided.'}

    Follow these expert instructions for each field:
    - summary: Provide a one-paragraph executive summary that captures the core message and purpose.
    - keyPoints: Extract the 3-5 most critical, standalone points as a list of strings.
    - tone: Describe the tone in 2-3 words (e.g., 'Formal and Persuasive', 'Casual and Informative').
    - clarityScore: Give a score from 1-10 on how clear and easy to understand the document is for its target audience.
    - suggestedTitle: Propose a more compelling and SEO-friendly title.
    - targetAudience: Describe the ideal reader for this document in detail (e.g., 'Marketing managers in the B2B SaaS industry').
    - feedbackCard: Provide 2-3 specific strengths and 2-3 actionable opportunities for improvement, focusing on structure, argumentation, and impact.
    `;
    return callApi(prompt, file, onProgress);
};

export const analyzeFinancialReport = (script: string, description: string, file?: File, onProgress?: (progress: number) => void) => {
    console.log("Performing Financial Report analysis...");
    const prompt = `
    Act as a senior financial analyst. Analyze the provided financial document (e.g., earnings report, market analysis).
    Your entire response must be a single, valid JSON object conforming to the schema.

    ${script ? `Document Content: """${script}"""` : ''}
    Context/Goals: ${description || 'Not provided.'}

    Follow these expert instructions:
    - summary: Write a concise, one-paragraph executive summary of the document's key findings.
    - keyMetrics: Identify the 3-5 most important financial metrics. For each, provide the metric name, its value (including units), and a brief analysis of its significance.
    - overallSentiment: Determine the overall sentiment ('Positive', 'Negative', 'Neutral', 'Mixed').
    - sentimentAnalysis: Justify the sentiment rating with specific examples from the text.
    - keyRisks: Extract a bulleted list of the most significant risks identified or implied.
    - keyOpportunities: Extract a bulleted list of the most significant opportunities.
    - feedbackCard: Populate with the most critical strength and opportunity from your analysis.
    `;
    return callApi(prompt, file, onProgress);
};

export const analyzeLiveStream = (file: File, onProgress?: (progress: number) => void) => {
    console.log("Performing Live Stream analysis...");
    const prompt = `
    First, create a highly accurate transcript of the provided recorded live stream video file and include it in the JSON response.
    Then, analyze this recorded live stream as a professional stream analyst and growth consultant.
    Your entire response must be a single, valid JSON object conforming to the schema.

    Follow these expert instructions for each field:
    - Based on the full transcript, perform a 'keywordAnalysis'. Extract the top 5-7 most important keywords and the 3-4 main topics discussed.
    - peakEngagementMoments: Identify 2-3 moments of high engagement. Provide timestamps and a brief description of what was happening and why it was engaging (e.g., '[01:15:32] Q&A session started, chat velocity increased due to direct audience interaction.').
    - averageViewerSentiment: Summarize the overall audience mood with examples. (e.g., 'Largely positive and supportive, especially during the unboxing segment. Some confusion noted around the 30-minute mark when the audio dropped.').
    - pacingAndFlow: Critique the stream's structure and energy levels. Was it engaging throughout, or were there slow parts? Suggest specific structural changes for next time.
    - audienceInteraction: How well did the host engage with the chat, answer questions, and acknowledge viewers by name? Give a score out of 10.
    - keyTakeaways: List the main highlights or conclusions from the stream that a viewer would remember.
    - monetizationOpportunities: Suggest specific, actionable ways the stream could have been better monetized (e.g., 'Create a Super Chat goal for a specific outcome,' 'Announce a limited-time merch discount during the peak viewer moment.').
    - overallScore: Provide a score from 1-10, justifying it with a single sentence.
    - feedbackCard: Offer specific strengths and opportunities for the next stream.
    `;
    return callApi(prompt, file, onProgress);
};

export const generateImprovedContent = async (result: AnalysisResult, brandVoice: string): Promise<string> => {
    console.log("Generating improved content based on brand voice:", brandVoice);
    const originalContent = result.transcript?.map(t => t.text).join('\n') || result.documentAnalysis?.summary || '';
    const feedback = `Strengths: ${result.feedbackCard.strengths.join('. ')}. Opportunities: ${result.feedbackCard.opportunities.join('. ')}.`;
    try {
        const prompt = `
            Rewrite the following content based on the provided feedback, ensuring it matches the specified brand voice.

            **Brand Voice:** ${brandVoice}
            
            **AI Feedback:** ${feedback}

            **Original Content:**
            ---
            ${originalContent}
            ---

            **Task:** Provide only the rewritten, improved content.
        `;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateSocialPost = async (result: AnalysisResult, platform: 'X' | 'LinkedIn' | 'Instagram'): Promise<string> => {
    console.log(`Generating social post for ${platform}`);
    const content = result.transcript?.map(t => t.text).join('\n') || result.documentAnalysis?.summary || '';
    try {
        const prompt = `
        Based on the following content, create an engaging social media post for ${platform}. 
        Adapt the tone, length, and format appropriately for that platform. 
        - For X (formerly Twitter), be concise and punchy, use 2-3 relevant hashtags, and include a strong call-to-action.
        - For LinkedIn, be professional and insightful, structure with bullet points or a short story, use 3-5 professional hashtags, and pose a question to the audience.
        - For Instagram, write a visually descriptive and engaging caption, include a mix of 5-10 popular and niche hashtags, and encourage sharing or saving.

        Content:\n${content}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateProductAd = async (result: AnalysisResult): Promise<string> => {
    console.log("Generating product ad script");
    const content = result.transcript?.map(t => t.text).join('\n') || result.documentAnalysis?.summary || '';
    try {
        const prompt = `Turn the key ideas from the following content into a script for a 30-second product advertisement video.\n\nContent:\n${content}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};
export const generateKeyTakeaways = async (result: AnalysisResult): Promise<string[]> => {
    console.log("Generating key takeaways");
    const content = result.transcript?.map(t => t.text).join('\n') || result.documentAnalysis?.summary || '';
     try {
        const prompt = `Extract the 3-5 most important key takeaways from the following content. Respond with a JSON array of strings.\n\nContent:\n${content}`;
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
        });
        return JSON.parse(response.text);
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateDescription = async (result: AnalysisResult, brandVoice: string): Promise<string> => {
    console.log("Generating SEO description");
    const content = result.transcript?.map(t => t.text).join('\n') || result.documentAnalysis?.summary || '';
    try {
        const prompt = `Write a compelling, SEO-friendly description for a YouTube video or podcast episode based on the following content. Match the specified brand voice.\n\n**Brand Voice:** ${brandVoice}\n\n**Content:**\n${content}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateSpeechFromText = async (text: string, voice: string, style: string): Promise<Blob> => {
    console.log(`Generating speech for: "${text.substring(0, 30)}..." with voice: ${voice}, style: ${style}`);
    try {
        const prompt = style === 'Default' ? text : `Say in a ${style.toLowerCase()} style: ${text}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("API did not return audio data.");
        }
        
        const audioBytes = decode(base64Audio);
        const pcmData = new Int16Array(audioBytes.buffer);
        return pcmToMp3Blob(pcmData, 24000, 1);
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateRetirementPlan = async (inputs: any): Promise<RetirementPlan> => {
    console.log("Generating retirement plan with inputs:", inputs);
    const { currentAge, retirementAge, currentSavings, monthlyContribution, investmentStyle, retirementIncome } = inputs;
    
    const growthRates = { 'Conservative': 0.04, 'Moderate': 0.07, 'Aggressive': 0.10 };
    const inflationRate = 0.03;
    const safeWithdrawalRate = 0.04;
    
    const prompt = `
        Act as a certified financial planner. Based on the user's inputs and standard financial assumptions, generate a comprehensive retirement plan.
        Your entire response must be a single, valid JSON object that conforms to the provided schema. Do not include any text before or after the JSON object.

        **User Inputs:**
        - Current Age: ${currentAge}
        - Desired Retirement Age: ${retirementAge}
        - Current Savings: $${currentSavings}
        - Monthly Contribution: $${monthlyContribution}
        - Investment Style: ${investmentStyle}
        - Desired Monthly Retirement Income: $${retirementIncome}

        **Assumptions to use for your calculations:**
        - Annual Growth Rate based on Investment Style: ${growthRates[investmentStyle as keyof typeof growthRates] * 100}%
        - Average Annual Inflation: ${inflationRate * 100}%
        - Safe Withdrawal Rate (SWR) during retirement: ${safeWithdrawalRate * 100}%

        **Instructions:**
        1.  **Calculate Projections:** Project the growth of the user's savings from their current age to retirement age in 5-year increments. Use a standard compound interest formula. The final projection point should be at the retirement age.
        2.  **Calculate Projected Nest Egg:** This is the final value from your projections at the retirement age.
        3.  **Calculate Projected Monthly Income:** Based on the projected nest egg, calculate the sustainable monthly income using the 4% safe withdrawal rate.
        4.  **Determine Feasibility:** Compare the projected monthly income to the desired monthly income.
        5.  **Write Summary & Recommendations:** Based on the feasibility, write a concise summary and provide 3-5 actionable recommendations.
        6.  **Detail Phases:** Provide specific summaries and recommendations for both the Accumulation (saving) and Decumulation (spending) phases.
        7.  **Format Output:** Ensure the entire response is a single JSON object matching the provided schema. Round all monetary values to the nearest whole number.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: retirementPlanSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateViralScript = async (prompt: string, link: string, brandVoice: string): Promise<string> => {
    console.log("Generating viral script with prompt:", prompt);
    const fullPrompt = `
        As a viral marketing expert, create a script for a short, engaging video based on the following prompt.
        The script should have a strong hook, be highly shareable, and align with the brand voice.
        
        Brand Voice: "${brandVoice}"
        Prompt: "${prompt}"
        ${link ? `Inspiration Link for context: ${link}`: ''}

        Your output should be a markdown-formatted script including these sections:
        - ## 1. Clickable Titles (3 options)
        - ## 2. SEO Description
        - ## 3. Discoverability Tags
        - ## 4. Thumbnail Concepts (2-3 ideas)
        - ## 5. Engaging Video Script (with scene descriptions)
        - ## 6. Frame Flow / Storyboard
        - ## 7. Monetization Strategy
    `;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: fullPrompt });
        return response.text;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateImage = async (prompt: string, model: 'imagen-4.0-generate-001' | 'gemini-2.5-flash-image', aspectRatio: string, mimeType: 'image/jpeg' | 'image/png'): Promise<string> => {
    console.log(`Generating image with model ${model}`);
    try {
        if (model === 'imagen-4.0-generate-001') {
            const response = await ai.models.generateImages({
                model,
                prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: mimeType,
                  aspectRatio: aspectRatio,
                },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else { // gemini-2.5-flash-image
            const response = await ai.models.generateContent({
                model,
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("No image data returned from gemini-2.5-flash-image");
        }
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateVideo = async (
    prompt: string,
    model: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview',
    duration: number,
    aspectRatio: '16:9' | '9:16',
    resolution: '720p' | '1080p',
    frameData: { data: string, mimeType: string }[],
    apiKey: string
): Promise<{ url: string, payload: any }> => {
    console.log(`Generating video with model ${model}`);
    const localAi = new GoogleGenAI({ apiKey });

    try {
        let request: any = {
            model,
            prompt: `${prompt}. The target duration is ${duration} seconds.`,
            config: {
                numberOfVideos: 1,
                resolution,
                aspectRatio,
            }
        };

        if (frameData.length >= 3 && request.model === 'veo-3.1-generate-preview') {
             request.config.referenceImages = frameData.map(img => ({
                image: { imageBytes: img.data, mimeType: img.mimeType },
                referenceType: 'ASSET',
            }));
        } else if (frameData.length === 2) {
             request.image = { imageBytes: frameData[0].data, mimeType: frameData[0].mimeType };
             request.config.lastFrame = { imageBytes: frameData[1].data, mimeType: frameData[1].mimeType };
        } else if (frameData.length === 1) {
            request.image = { imageBytes: frameData[0].data, mimeType: frameData[0].mimeType };
        }

        let operation = await localAi.models.generateVideos(request);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation did not return a download link.');
        }

        const finalUrl = `${downloadLink}&key=${apiKey}`;
        const videoResponse = await fetch(finalUrl);
        if (!videoResponse.ok) {
            const errorBody = await videoResponse.text();
            console.error("Video download error:", errorBody);
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return { url: videoUrl, payload: operation };
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateSpeech = async (scripts: VoiceoverScript[]): Promise<string | null> => {
    console.log("Generating speech from scripts:", scripts);
    try {
        let response;
        if (scripts.length === 1) {
            const { script, voice } = scripts[0];
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: script }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                    },
                },
            });
        } else if (scripts.length === 2) {
            const prompt = `TTS the following conversation between ${scripts[0].speaker} and ${scripts[1].speaker}:\n${scripts[0].speaker}: ${scripts[0].script}\n${scripts[1].speaker}: ${scripts[1].script}`;
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        multiSpeakerVoiceConfig: {
                            speakerVoiceConfigs: scripts.map(s => ({
                                speaker: s.speaker,
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: s.voice } }
                            }))
                        }
                    }
                }
            });
        } else {
            throw new Error("Speech generation supports 1 or 2 speakers only.");
        }

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            return null;
        }
        return base64Audio;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const extendVideo = async (prompt: string, previousOperation: any, apiKey: string): Promise<{ url: string, payload: any }> => {
    console.log("Extending video...");
    const localAi = new GoogleGenAI({ apiKey });
    try {
        const previousVideo = previousOperation.response?.generatedVideos?.[0]?.video;
        if (!previousVideo) {
            throw new Error("Previous video data not found in payload.");
        }
        
        let operation = await localAi.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt,
            video: previousVideo,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: previousVideo.aspectRatio,
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await localAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video extension did not return a download link.');
        }

        const finalUrl = `${downloadLink}&key=${apiKey}`;
        const videoResponse = await fetch(finalUrl);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download extended video: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        return { url: videoUrl, payload: operation };
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const generateSocialPostFromScript = async (script: string, brandVoice: string): Promise<string> => {
    console.log("Generating social post from script...");
    try {
        const prompt = `
            Based on the following video script, write an engaging social media post (e.g., for X/Twitter or LinkedIn) to promote it.
            The post should be concise, include a hook, and a few relevant hashtags.
            It must match the specified brand voice.

            **Brand Voice:** ${brandVoice}

            **Video Script:**
            ---
            ${script}
            ---

            **Task:** Provide only the social media post text.
        `;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (e: any) {
        throw new Error(handleApiError(e));
    }
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    console.log("Editing image with prompt:", prompt);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType: mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No edited image data returned from model.");
    } catch(e: any) {
        throw new Error(handleApiError(e));
    }
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    console.log("Validating API Key...");
    if (!apiKey) return false;
    try {
        const localAi = new GoogleGenAI({ apiKey });
        await localAi.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
            config: { maxOutputTokens: 1 }
        });
        return true;
    } catch (error: any) {
        console.error("API Key validation failed:", error.message);
        return false;
    }
};