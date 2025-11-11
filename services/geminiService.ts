import { GoogleGenAI, Type, Modality } from "@google/genai";
import { pcmToMp3Blob, decode } from '../utils/audio';
import type {
  AnalysisResult,
  PromptHistoryItem,
  VoiceoverScript,
  ViralScript,
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

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
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
                    speaker: { type: Type.STRING, description: "Speaker identifier (e.g., 'A' for salesperson, 'B' for client)." },
                    text: { type: Type.STRING, description: "The transcribed text of what the speaker said." },
                    startTime: { type: Type.NUMBER, description: "Start time of the speech in seconds." },
                    endTime: { type: Type.NUMBER, description: "End time of the speech in seconds." },
                },
                required: ["speaker", "text", "startTime", "endTime"],
            },
        },
        performanceMetrics: {
            type: Type.ARRAY,
            description: "A breakdown of performance metrics over segments of the content, suitable for graphing.",
            items: {
                type: Type.OBJECT,
                properties: {
                    label: { type: Type.STRING, description: "The segment identifier (e.g., 'First 15s', 'Conclusion', 'Verse 1')." },
                    scores: {
                        type: Type.ARRAY,
                        description: "An array of metric scores for this segment.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                metric: { type: Type.STRING, description: "The name of the metric (e.g., 'engagement', 'clarity')." },
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
                strengths: {
                    type: Type.ARRAY,
                    description: "A list of key strengths observed in the content.",
                    items: { type: Type.STRING },
                },
                opportunities: {
                    type: Type.ARRAY,
                    description: "A list of areas for improvement.",
                    items: { type: Type.STRING },
                },
            },
            required: ["strengths", "opportunities"],
        },
        socialMediaAnalysis: {
            type: Type.OBJECT,
            description: "Analysis specific to social media content.",
            properties: {
                hookEffectiveness: { type: Type.STRING },
                visualAppeal: { type: Type.STRING },
                callToAction: { type: Type.STRING },
                brandConsistency: { type: Type.STRING },
                overallScore: { type: Type.NUMBER, description: "A score from 1 to 10." },
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
                overallScore: { type: Type.NUMBER, description: "A score from 1 to 10." },
            },
        },
        videoAnalysis: {
            type: Type.OBJECT,
            description: "Analysis specific to video content.",
            properties: {
                visualPacing: { type: Type.STRING, description: "e.g., 'Well-paced', 'Too slow'" },
                audioQuality: { type: Type.STRING, description: "e.g., 'Clear', 'Muffled'" },
                messageClarity: { type: Type.STRING },
                brandConsistency: { type: Type.STRING },
                engagementPotential: { type: Type.STRING, description: "Assessment of the video's potential to engage viewers." },
                editingStyle: { type: Type.STRING, description: "Comments on the editing style (e.g., 'Dynamic', 'Smooth')." },
                thumbnailSuggestion: { type: Type.STRING, description: "A concise, compelling suggestion for a video thumbnail, describing visual elements and text." },
                captionQuality: { type: Type.STRING, description: "Analysis of the video's captions if present, or potential for captions." },
                hookQuality: { type: Type.STRING, description: "Specific feedback on the effectiveness of the video's first 3-5 seconds." },
                viralityScore: { type: Type.NUMBER, description: "A score from 1 to 10 indicating the video's potential to go viral." },
                overallScore: { type: Type.NUMBER, description: "A score from 1 to 10." },
                suggestedAudience: { type: Type.STRING, description: "A description of the ideal target audience for this video." },
                monetizationPotential: { type: Type.STRING, description: "Suggestions on how the video could be monetized (e.g., sponsorships, affiliate marketing)." },
            },
        },
        liveStreamAnalysis: {
            type: Type.OBJECT,
            description: "Analysis specific to a live stream video.",
            properties: {
                peakEngagementMoments: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Timestamps or descriptions of high-engagement moments." },
                averageViewerSentiment: { type: Type.STRING, description: "e.g., 'Highly Positive', 'Neutral', 'Mixed'" },
                pacingAndFlow: { type: Type.STRING, description: "Feedback on the stream's pacing." },
                audienceInteraction: { type: Type.STRING, description: "Analysis of how well the streamer interacted with the audience." },
                keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Main points or takeaways from the stream." },
                monetizationOpportunities: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggestions for monetization based on the content." },
                overallScore: { type: Type.NUMBER, description: "A score from 1 to 10." },
            },
        },
        documentAnalysis: {
             type: Type.OBJECT,
             description: "Analysis of a text document.",
             properties: {
                summary: { type: Type.STRING, description: "A concise summary of the document." },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the main takeaways." },
                tone: { type: Type.STRING, description: "e.g., 'Formal', 'Casual', 'Persuasive'" },
                clarityScore: { type: Type.NUMBER, description: "A score from 1 to 10 on how clear and understandable the document is." },
                suggestedTitle: { type: Type.STRING, description: "An AI-suggested title for the document." },
                targetAudience: { type: Type.STRING, description: "The likely target audience for this document." },
             },
        },
    },
    required: ["feedbackCard"],
};

const sanitizeResult = (result: Partial<AnalysisResult>): AnalysisResult => {
    if (!result.feedbackCard) {
        result.feedbackCard = { strengths: [], opportunities: [] };
    }
    return result as AnalysisResult;
};

export const analyzeSalesCall = async (file: File): Promise<AnalysisResult> => {
 try {
    const mediaPart = await fileToGenerativePart(file);
    const prompt = `Analyze the provided sales call audio or video. Provide a full transcript, and a feedback card with strengths and opportunities. Speaker A is the salesperson, and Speaker B is the client. Also, create a 'performanceMetrics' array. The metrics should be 'engagement', 'clarity', and 'pacing' with a score from 0-10. The label for each metric point should correspond to a turn in the conversation (e.g., "Turn 1").`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, mediaPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: analysisResultSchema,
            maxOutputTokens: 8192,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return sanitizeResult(result);
  } catch (error: any) {
    throw new Error(handleApiError(error));
  }
};

export const analyzeSocialMediaContent = async (script: string, description: string, file?: File): Promise<AnalysisResult> => {
    try {
        const parts: any[] = [];
        const prompt = `Analyze the provided social media content.
        - Script: "${script}"
        - Visuals/Goals Description: "${description}"
        
        Provide a detailed analysis covering:
        1. A full transcript (if applicable).
        2. A social media analysis card with: hookEffectiveness, visualAppeal, callToAction, brandConsistency, and an overallScore (1-10).
        3. A general feedback card with overall strengths and opportunities.
        4. A 'performanceMetrics' array. Break the content into 4-5 logical segments (e.g., 'Hook', 'Problem', 'Solution', 'CTA'). For each segment, provide a 'scores' array of objects, where each object has a 'metric' (string) and 'value' (number from 0-10). The metrics should be 'engagement' and 'brandClarity'.
        `;
        parts.push({ text: prompt });

        if (file) {
            parts.push(await fileToGenerativePart(file));
        }
        
        const model = file ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
        
        const config: any = {
            responseMimeType: 'application/json',
            responseSchema: analysisResultSchema,
            maxOutputTokens: 8192,
        };
        if (file) {
            config.thinkingConfig = { thinkingBudget: 4096 };
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: config,
        });

        const jsonText = response.text.trim();
        return sanitizeResult(JSON.parse(jsonText));
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const analyzeProductAd = async (script: string, description: string, file?: File): Promise<AnalysisResult> => {
    try {
        const parts: any[] = [];
        const prompt = `Analyze the provided product advertisement content.
        - Script: "${script}"
        - Visuals/Goals Description: "${description}"
        
        Provide a detailed analysis covering:
        1. A full transcript (if applicable).
        2. A product ad analysis card with: clarityOfMessage, targetAudienceAlignment, emotionalImpact, callToActionStrength, and an overallScore (1-10).
        3. A general feedback card with overall strengths and opportunities.
        4. A 'performanceMetrics' array. Break the ad into 4-5 logical segments (e.g., 'Opening', 'Value Prop', 'Demo', 'Closing CTA'). For each segment, provide a 'scores' array of objects, where each object has a 'metric' (string) and a 'value' (number from 0-10). The metrics should be 'persuasiveness' and 'clarity'.
        `;
        parts.push({ text: prompt });

        if (file) {
            parts.push(await fileToGenerativePart(file));
        }
        
        const model = file ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

        const config: any = {
            responseMimeType: 'application/json',
            responseSchema: analysisResultSchema,
            maxOutputTokens: 8192,
        };
        if (file) {
            config.thinkingConfig = { thinkingBudget: 4096 };
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: config,
        });

        const jsonText = response.text.trim();
        return sanitizeResult(JSON.parse(jsonText));
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const analyzeVideoContent = async (file: File): Promise<AnalysisResult> => {
    try {
        const videoPart = await fileToGenerativePart(file);
        const prompt = `Analyze the provided video. Provide a detailed analysis covering:
        1. A full transcript of any spoken words.
        2. A video analysis card with all relevant fields, including a detailed 'hookQuality' analysis of the first 3-5 seconds, an overallScore (1-10), and a suggestedAudience.
        3. A general feedback card with overall strengths and opportunities.
        4. A 'performanceMetrics' array. Break the video into 4-6 chronological segments (e.g., '0-10s', '10-30s', etc.). For each segment, provide a 'scores' array of objects, where each object has a 'metric' (string) and a 'value' (number from 0-10). The metrics should be 'visualPacing' and 'engagement'.
        5. Monetization potential, suggesting specific opportunities like brand sponsorships or affiliate products relevant to the content.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ text: prompt }, videoPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisResultSchema,
                maxOutputTokens: 8192,
            },
        });

        const jsonText = response.text.trim();
        return sanitizeResult(JSON.parse(jsonText));
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const analyzeLiveStream = async (file: File): Promise<AnalysisResult> => {
    try {
        const videoPart = await fileToGenerativePart(file);
        const prompt = `Analyze the provided live stream video recording. Provide a detailed analysis covering:
        1. A full transcript of any spoken words.
        2. A live stream analysis card with all relevant fields, including an overallScore (1-10).
        3. A general feedback card with overall strengths and opportunities.
        4. A 'performanceMetrics' array. Break the stream into 4-6 chronological segments. For each segment, provide a 'scores' array of objects, where each object has a 'metric' (string) and a 'value' (number from 0-10). The metrics should be 'audienceInteraction' and 'energyLevel'.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [{ text: prompt }, videoPart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisResultSchema,
                maxOutputTokens: 8192,
            },
        });

        const jsonText = response.text.trim();
        return sanitizeResult(JSON.parse(jsonText));
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const analyzeDocument = async (script: string, description: string): Promise<AnalysisResult> => {
    try {
        const prompt = `Analyze the provided document.
        - Document Text: "${script}"
        - Context/Goal: "${description}"
        
        Provide a detailed analysis covering:
        1. A document analysis card with all relevant fields, including a clarityScore (1-10).
        2. A general feedback card with overall strengths and opportunities.
        3. A 'performanceMetrics' array. Break the document into 4-6 logical sections (e.g., 'Introduction', 'Body Paragraph 1', etc.). For each section, provide a 'scores' array of objects, where each object has a 'metric' (string) and a 'value' (number from 0-10). The metrics should be 'clarity' and 'persuasiveness'.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisResultSchema,
                maxOutputTokens: 8192,
            },
        });

        const jsonText = response.text.trim();
        return sanitizeResult(JSON.parse(jsonText));
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};


export const generateImprovedContent = async (analysisResult: AnalysisResult, brandVoice: string): Promise<string> => {
    try {
        const originalContent = analysisResult.transcript?.map(t => `${t.speaker}: ${t.text}`).join('\n') || '';
        const feedback = `Strengths to keep: ${analysisResult.feedbackCard.strengths.join(', ')}. Opportunities to address: ${analysisResult.feedbackCard.opportunities.join(', ')}`;

        const prompt = `
        Based on the following original content, feedback, and brand voice, please generate an improved version of the content script.

        **Brand Voice:** ${brandVoice}

        **Original Content:**
        ---
        ${originalContent}
        ---

        **Feedback on Original Content:**
        ---
        ${feedback}
        ---

        **Your Task:**
        Rewrite the script to incorporate the feedback while adhering to the specified brand voice. The output should be the improved script only, without any extra commentary.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });

        return response.text;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const generateKeyTakeaways = async (analysisResult: AnalysisResult): Promise<string[]> => {
    try {
        const contentSummary = analysisResult.transcript?.map(t => t.text).join(' ') 
            || analysisResult.documentAnalysis?.summary 
            || JSON.stringify(analysisResult.feedbackCard);

        const prompt = `
        Act as a strategic analyst. Your goal is to distill the provided content into its most critical, actionable insights.

        **Content Summary & Feedback:**
        ---
        ${contentSummary}
        ---
        
        **Your Task:**
        Analyze the content and generate a list of 3-5 key takeaways. Each takeaway must be:
        - **Concise:** A single, powerful sentence.
        - **Actionable:** The user should know what to do with the information.
        - **Insightful:** It should reveal something important about the content.

        Return a valid JSON array of strings, where each string is a key takeaway. Do not include any other text or markdown.
        Example format: ["This is the first actionable takeaway.", "This is the second insightful point."]
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });
        
        // Attempt to parse the response as JSON
        try {
            return JSON.parse(response.text);
        } catch {
            // Fallback for non-JSON response: split by newline
            return response.text.split('\n').map(s => s.replace(/^- /, '')).filter(s => s.trim() !== '');
        }

    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const generateDescription = async (analysisResult: AnalysisResult, brandVoice: string): Promise<string> => {
    try {
        const contentSummary = analysisResult.transcript?.map(t => t.text).join(' ') 
            || analysisResult.documentAnalysis?.summary 
            || JSON.stringify(analysisResult.feedbackCard);

        const prompt = `
        Based on the following content summary and brand voice, generate a compelling and SEO-friendly description suitable for a platform like YouTube or a podcast.

        **Brand Voice:** ${brandVoice}

        **Content Summary & Feedback:**
        ---
        ${contentSummary}
        ---
        
        **Your Task:**
        Write a 3-4 sentence description that hooks the reader, summarizes the key value, and encourages them to engage. Include 3-5 relevant hashtags at the end.
        Output only the description and hashtags.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
        });
        
        return response.text;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};


export const generateSocialPost = async (analysisResult: AnalysisResult): Promise<string> => {
    try {
        const contentSummary = 
            analysisResult.videoAnalysis 
                ? `A video was analyzed with the following feedback: Engagement Potential - ${analysisResult.videoAnalysis.engagementPotential}. Message - ${analysisResult.videoAnalysis.messageClarity}. Virality Score: ${analysisResult.videoAnalysis.viralityScore}/10. The transcript is: ${analysisResult.transcript?.map(t => t.text).join(' ') || ''}`
                : analysisResult.transcript?.map(t => t.text).join(' ') || 
                  analysisResult.documentAnalysis?.summary || 
                  '';

        const prompt = `
        Act as a professional social media manager. Your task is to generate a compelling social media post (for platforms like LinkedIn, X, or Instagram) based on the provided content analysis.

        **Content Analysis Summary:**
        ---
        ${contentSummary}
        ---

        **Key Strengths to Highlight:** ${analysisResult.feedbackCard.strengths.join(', ')}

        **Your Task:**
        Write a short, engaging social media post with the following structure:
        1.  **Hook:** An attention-grabbing first sentence that makes people stop scrolling.
        2.  **Value:** Briefly explain what the content is about and why it's valuable to the audience.
        3.  **Call-to-Action (CTA):** Encourage users to engage (e.g., "Watch the full video," "Read the full analysis," "What are your thoughts?").
        4.  **Hashtags:** Include 3-5 relevant and trending hashtags.

        The tone should be engaging and professional. Output only the post text.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const generateSocialPostFromScript = async (script: string, brandVoice: string): Promise<string> => {
    try {
        const prompt = `
        You are a social media manager. Your brand voice is: **${brandVoice}**.
        Based on the following video script, generate a short, compelling social media post (e.g., for Twitter or LinkedIn) to promote the video.
        - Summarize the core message.
        - Create a strong hook.
        - Include a call-to-action to watch the full video.
        - Add 3-5 relevant hashtags.
        
        **Video Script:**
        ---
        ${script}
        ---

        **Your Task:**
        Write the social media post. Output only the text of the post.
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;

    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};


export const generateProductAd = async (analysisResult: AnalysisResult): Promise<string> => {
    try {
        const contentSummary = analysisResult.transcript?.map(t => t.text).join(' ') || '';
        const prompt = `
        Act as a creative director for an advertising agency. Your task is to write a script for a high-impact, 30-second product advertisement based on the provided content analysis.

        **Source Content Summary:**
        ---
        ${contentSummary}
        ---

        **Key Strengths to Emphasize:** ${analysisResult.feedbackCard.strengths.join(', ')}

        **Your Task:**
        Write a complete ad script that follows the AIDA model (Attention, Interest, Desire, Action). The script should be formatted clearly with scene descriptions, dialogue/voiceover, and sound effects.

        **Format:**
        [SCENE: A brief description of the visual setting and action.]
        [SOUND: Description of music or sound effects.]
        VOICEOVER: The spoken words for the ad.
        ON-SCREEN TEXT: Any text that should appear on screen.

        **Example:**
        [SCENE: A frustrated user tapping furiously at a slow computer.]
        [SOUND: Upbeat, modern electronic music starts.]
        VOICEOVER: Tired of waiting?
        ON-SCREEN TEXT: There's a better way.

        Ensure the script builds to a clear call-to-action at the end. The output should be the ad script only.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const generateViralScript = async (prompt: string, link: string, brandVoice: string): Promise<string> => {
    try {
        const fullPrompt = `
        **Objective:** Deliver a masterclass in YouTube strategy by creating a complete Video Blueprint designed for virality.

        **Your Role:** You are a world-renowned YouTube strategist and scriptwriter. Your analysis is sharp, creative, and backed by data on what makes content successful. Frame your output as an exclusive strategy document for a high-profile client.
    
        **Brand Voice:** ${brandVoice}
    
        **Core Topic/Idea:** ${prompt}
    
        **Inspiration Link (for context and competitive analysis):** ${link || 'N/A'}
        
        **Your Task:**
        Analyze my topic and the inspiration link (if provided) to understand the niche, audience, and successful formats. Then, generate the following comprehensive blueprint. You cannot access the link directly, so rely on my prompt and any context provided about the link to inform your deep analysis.
    
        **Blueprint Components (Use these exact markdown headers):**
    
        ## 1. 5 High-CTR Title Options
        *   Generate 5 clickable, SEO-friendly titles. Use proven formulas (e.g., questions, lists, strong claims).
    
        ## 2. SEO-Optimized Description
        *   Write a 3-5 paragraph description. The first two sentences must hook the reader and contain the primary keywords. Include timestamps for key sections.
    
        ## 3. Discoverability Tags
        *   Provide a comma-separated list of 10-15 relevant tags, including broad and specific keywords.
    
        ## 4. 3 Thumbnail Concepts
        *   Describe 3 distinct, high-contrast thumbnail ideas. Mention text, imagery, and emotional expression.
    
        ## 5. Engaging Video Script
        *   **Hook (First 15 seconds):** Start with a powerful question, a bold statement, or a preview of the final result.
        *   **Body:** Structure the content logically. Use storytelling techniques. Keep paragraphs short and punchy.
        *   **Call-to-Action (CTA):** End with a clear CTA (e.g., subscribe, watch another video, comment below).
            
        ## 6. Frame Flow / Storyboard
        *   Break the script down shot-by-shot.
        *   For each key scene, describe the visuals, b-roll, camera angles (e.g., "Dynamic close-up"), pacing ("Fast-paced montage"), and any on-screen text or graphics.
        
        ## 7. Monetization Strategy
        * Suggest 1-2 natural placements for a sponsor segment within the script.
        * Propose 1-2 relevant affiliate product ideas or merchandise concepts.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: fullPrompt,
            config: {
                maxOutputTokens: 8192,
            }
        });

        return response.text;
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};

export const generateImage = async (
    prompt: string,
    modelName: 'imagen-4.0-generate-001' | 'gemini-2.5-flash-image',
    aspectRatio: string,
    mimeType: 'image/jpeg' | 'image/png'
): Promise<string> => {
    try {
        let base64ImageBytes: string | undefined;

        if (modelName === 'imagen-4.0-generate-001') {
            const response = await ai.models.generateImages({
                model: modelName,
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: mimeType,
                    aspectRatio: aspectRatio as any,
                },
            });
            base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        } else { // nano-banana
            const response = await ai.models.generateContent({
                model: modelName,
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            base64ImageBytes = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        }
        
        if (!base64ImageBytes) {
            throw new ModerationError("Image generation succeeded but returned no image. This can happen if the prompt violates safety policies. Please try a different prompt.");
        }
        return `data:${mimeType};base64,${base64ImageBytes}`;

    } catch (error: any) {
        if (error instanceof ModerationError) throw error;
        throw new Error(handleApiError(error));
    }
};

export const editImage = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: prompt
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const base64ImageBytes = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64ImageBytes) {
            throw new ModerationError("Image editing succeeded but returned no image. The prompt may have violated safety policies.");
        }
        
        const newMimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'image/png';
        return `data:${newMimeType};base64,${base64ImageBytes}`;

    } catch (error: any) {
        if (error instanceof ModerationError) throw error;
        throw new Error(handleApiError(error));
    }
};


export const generateVideo = async (
    prompt: string,
    modelName: 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview',
    aspectRatio: string,
    resolution: '720p' | '1080p',
    referenceFrames: { data: string, mimeType: string }[]
): Promise<{ url: string, videoPayload: any }> => {
    try {
        const videoGenAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const payload: any = {
            model: modelName,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution,
                aspectRatio: aspectRatio as any,
            }
        };

        if (referenceFrames.length === 1) {
            payload.image = { imageBytes: referenceFrames[0].data, mimeType: referenceFrames[0].mimeType };
        } else if (referenceFrames.length === 2) {
            payload.image = { imageBytes: referenceFrames[0].data, mimeType: referenceFrames[0].mimeType };
            payload.config.lastFrame = { imageBytes: referenceFrames[1].data, mimeType: referenceFrames[1].mimeType };
        } else if (referenceFrames.length === 3) {
            payload.config.referenceImages = referenceFrames.map(frame => ({
                image: { imageBytes: frame.data, mimeType: frame.mimeType },
                referenceType: 'ASSET'
            }));
        }

        let operation = await videoGenAi.models.generateVideos(payload);

        const MAX_POLLS = 36; // 36 polls * 5 seconds = 3 minute timeout
        let pollCount = 0;
        while (!operation.done && pollCount < MAX_POLLS) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
            operation = await videoGenAi.operations.getVideosOperation({ operation: operation });
            pollCount++;
        }
        
        if (!operation.done) {
            throw new Error("Video generation timed out after 3 minutes. Please try again.");
        }

        if (operation.error) {
           throw new Error(`Video generation failed: ${operation.error.message}`);
        }
        
        const videoObject = operation.response?.generatedVideos?.[0]?.video;
        const downloadLink = videoObject?.uri;

        if (!downloadLink) {
            throw new ModerationError("Video generation completed, but no download link was provided. This can happen if the prompt violates safety policies. Please try a different prompt.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        return { url: blobUrl, videoPayload: videoObject };

    } catch (error: any) {
        if (error instanceof ModerationError) throw error;
        throw new Error(handleApiError(error));
    }
};

export const extendVideo = async (
    prompt: string,
    previousVideo: any,
): Promise<{ url: string, videoPayload: any }> => {
    try {
        const videoGenAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const payload: any = {
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            video: previousVideo,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: previousVideo.aspectRatio,
            }
        };

        let operation = await videoGenAi.models.generateVideos(payload);
        
        const MAX_POLLS = 36; // 3 minute timeout
        let pollCount = 0;
        while (!operation.done && pollCount < MAX_POLLS) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await videoGenAi.operations.getVideosOperation({ operation: operation });
            pollCount++;
        }
        
        if (!operation.done) {
            throw new Error("Video extension timed out after 3 minutes.");
        }
        
        if (operation.error) {
           throw new Error(`Video extension failed: ${operation.error.message}`);
        }

        const videoObject = operation.response?.generatedVideos?.[0]?.video;
        const downloadLink = videoObject?.uri;

        if (!downloadLink) {
            throw new ModerationError("Video extension completed, but no download link was provided.");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        return { url: blobUrl, videoPayload: videoObject };

    } catch (error: any) {
        if (error instanceof ModerationError) throw error;
        throw new Error(handleApiError(error));
    }
};

export const generateSpeech = async (
    scripts: VoiceoverScript[]
): Promise<string> => {
    try {
        if (scripts.length === 0) {
            throw new Error("No script provided for speech generation.");
        }

        if (scripts.length > 2) {
            throw new Error("Multi-speaker generation requires exactly two speakers. Please remove extra speakers.");
        }

        let response;
        if (scripts.length === 1) {
            // Single speaker
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: scripts[0].script }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: scripts[0].voice },
                        },
                    },
                },
            });
        } else {
            // Multi-speaker (exactly 2)
            const prompt = `TTS the following conversation between ${scripts[0].speaker} and ${scripts[1].speaker}:\n${scripts.map(s => `${s.speaker}: ${s.script}`).join('\n')}`;
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        multiSpeakerVoiceConfig: {
                            speakerVoiceConfigs: scripts.map(s => ({
                                speaker: s.speaker,
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: s.voice }
                                }
                            }))
                        }
                    }
                }
            });
        }
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new ModerationError("Speech generation succeeded but returned no audio. The text may have been blocked for safety reasons.");
        }
        return base64Audio;
    } catch (error: any) {
         if (error instanceof ModerationError) throw error;
        throw new Error(handleApiError(error));
    }
};

export const generateSpeechFromText = async (text: string, voiceName: string = 'Kore', style: string = 'Default'): Promise<Blob> => {
    try {
        let finalText = text;
        if (style && style.toLowerCase() !== 'default') {
            finalText = `Say cheerfully: ${text}`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: finalText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new ModerationError("Speech generation succeeded but returned no audio. The text may have been blocked for safety reasons.");
        }
        const pcmData = new Int16Array(decode(base64Audio).buffer);
        return pcmToMp3Blob(pcmData, 24000, 1);
    } catch (error: any) {
        if (error instanceof ModerationError) throw error;
        throw new Error(handleApiError(error));
    }
};


export const generateRetirementPlan = async (inputs: any): Promise<RetirementPlan> => {
    try {
        const prompt = `
        Act as a certified financial planner. Based on the user's data, create a comprehensive retirement plan.

        **User Data:**
        - Current Age: ${inputs.currentAge}
        - Target Retirement Age: ${inputs.retirementAge}
        - Current Savings: $${inputs.currentSavings}
        - Monthly Contribution: $${inputs.monthlyContribution}
        - Investment Style: ${inputs.investmentStyle} (Conservative: 4% avg annual return, Moderate: 7% avg annual return, Aggressive: 10% avg annual return)
        - Desired Monthly Retirement Income: $${inputs.retirementIncome}

        **Assumptions:**
        - Inflation: 2.5% per year.
        - Safe Withdrawal Rate (SWR) in retirement: 4% of the nest egg per year.
        - All monetary values are in today's dollars. Adjust projections for inflation.

        **Your Task:**
        Generate a detailed retirement plan in the specified JSON format. The plan should include:
        1.  **isFeasible**: A boolean indicating if the desired income is achievable with the current plan.
        2.  **summary**: A short, encouraging summary of the plan's outcome.
        3.  **projectedNestEgg**: The total estimated value of the portfolio at the target retirement age, in today's dollars.
        4.  **projectedMonthlyIncome**: The projected monthly income in retirement based on the 4% SWR, in today's dollars.
        5.  **recommendations**: A list of 3-5 actionable recommendations to improve the plan.
        6.  **accumulationPhase**: Advice for the years leading up to retirement.
        7.  **decumulationPhase**: Advice for managing funds during retirement.
        8.  **projections**: An array of data points for a graph, showing the projected savings value every 5 years from the current age to retirement age.

        The final JSON output must conform to the provided schema.
        `;

        const retirementPlanSchema = {
            type: Type.OBJECT,
            properties: {
                isFeasible: { type: Type.BOOLEAN },
                summary: { type: Type.STRING },
                projectedNestEgg: { type: Type.NUMBER },
                projectedMonthlyIncome: { type: Type.NUMBER },
                recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                accumulationPhase: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "summary", "recommendations"]
                },
                decumulationPhase: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["title", "summary", "recommendations"]
                },
                projections: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            year: { type: Type.NUMBER },
                            value: { type: Type.NUMBER }
                        },
                        required: ["year", "value"]
                    }
                }
            },
            required: ["isFeasible", "summary", "projectedNestEgg", "projectedMonthlyIncome", "recommendations", "accumulationPhase", "decumulationPhase", "projections"]
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: retirementPlanSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error: any) {
        throw new Error(handleApiError(error));
    }
};