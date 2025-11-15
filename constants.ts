import type { TranscriptEntry, AnalysisResult, PerformanceMetricPoint, FeedbackCardData, SalesCallAnalysis, VideoAnalysis, SocialMediaAnalysis } from './types';

export const MOCK_TRANSCRIPT: TranscriptEntry[] = [
  { speaker: 'A', text: "Hi, thanks for taking my call. I'm following up on the email I sent last week about our new project management tool, Synchro.", startTime: 0, endTime: 5, tags: ['Rapport Building'] },
  { speaker: 'B', text: "Oh, right. I remember seeing that. To be honest, we're pretty happy with our current system. I'm not sure we're looking to make a change right now.", startTime: 5, endTime: 11, tags: ['Objection'] },
  { speaker: 'A', text: "I completely understand. A lot of our happiest customers said the exact same thing before they saw how Synchro could solve problems they didn't even realize were slowing them down. For example, do you ever have issues with cross-departmental project visibility?", startTime: 11, endTime: 20, tags: ['Needs Discovery', 'Viral Moment'] },
  { speaker: 'B', text: "Yeah, that's a constant headache. Marketing never knows what Engineering is prioritizing, and it causes delays.", startTime: 20, endTime: 24, tags: ['Negative Sentiment'] },
  { speaker: 'A', text: "That's a very common challenge. Synchro provides a unified dashboard that gives everyone a real-time view of project progress. It's helped companies like yours cut down project delays by up to 30%. Would a brief 15-minute demo next Tuesday be out of the question to show you how it works?", startTime: 24, endTime: 36, tags: ['Action Item'] },
  { speaker: 'B', text: "Hmm, 30% is a significant number. I suppose I could find 15 minutes. How about 10 AM?", startTime: 36, endTime: 40, tags: ['Positive Sentiment'] },
  { speaker: 'A', text: "10 AM on Tuesday works perfectly. I'll send over a calendar invite shortly. You won't be disappointed. I look forward to speaking then!", startTime: 40, endTime: 46, tags: ['Key Decision'] },
  { speaker: 'B', text: "Sounds good. Talk to you then.", startTime: 46, endTime: 48 }
];

export const MOCK_PERFORMANCE_METRICS: PerformanceMetricPoint[] = [
    { label: "0-16s", scores: [{ metric: 'Clarity', value: 8.5 }, { metric: 'Confidence', value: 8.2 }, { metric: 'Client Engagement', value: 5.0 }, { metric: 'Sentiment', value: 4.0 }] },
    { label: "17-32s", scores: [{ metric: 'Clarity', value: 9.2 }, { metric: 'Confidence', value: 9.5 }, { metric: 'Client Engagement', value: 8.0 }, { metric: 'Sentiment', value: 6.5 }] },
    { label: "33-48s", scores: [{ metric: 'Clarity', value: 9.0 }, { metric: 'Confidence', value: 9.3 }, { metric: 'Client Engagement', value: 8.5 }, { metric: 'Sentiment', value: 9.0 }] },
];

export const MOCK_FEEDBACK_CARD: FeedbackCardData = {
  strengths: ["Effectively overcame initial objections by pivoting to a relevant pain point (project visibility).", "Used a powerful data point (30% delay reduction) to build value.", "Maintained a confident and positive tone throughout the call."],
  opportunities: ["Could have tried to discover more about the client's current system and its specific shortcomings earlier.", "The closing could be slightly stronger by confirming the value proposition one last time."]
};

export const MOCK_VIDEO_ANALYSIS: VideoAnalysis = {
    visualPacing: "The pacing is generally good, with quick cuts in the first 10 seconds to maintain interest. It slows down appropriately during the main explanation, which is effective.",
    messageClarity: "The core message is clear and well-articulated. Viewers will understand the main value proposition without confusion.",
    brandConsistency: "The visual style and tone are consistent with a modern tech brand. The color palette aligns well with professional branding.",
    engagementPotential: "High potential for engagement, especially in the comments section, due to the direct question asked at the midpoint.",
    editingStyle: "The use of J-cuts and L-cuts is professional. Suggestion: Incorporate more B-roll footage to visually illustrate the points being made.",
    thumbnailSuggestion: {
        score: 8.5,
        critique: "The current concept is good, but the text is a bit small and the expression could be more dramatic.",
        suggestion: "A thumbnail with a surprised facial expression next to a bold, three-word title like 'THIS CHANGES EVERYTHING' would have a high CTR."
    },
    captionQuality: {
        score: 7.0,
        critique: "Captions are accurate but static. They lack styling to hold viewer attention during key moments.",
        suggestion: "Use dynamic, animated captions that highlight keywords as they are spoken. Tools like Captions.ai or Veed.io can automate this and significantly boost visual engagement and retention."
    },
    audioAnalysis: {
        qualityScore: 8.0,
        qualityCritique: "The audio is clear, but there's a slight background hiss. The volume level is inconsistent between 0:30 and 0:45.",
        qualitySuggestion: "Apply a noise reduction filter to remove the hiss. Use a compressor to even out the volume levels throughout the video for a more professional listening experience.",
        pacingWPM: 150,
        fillerWordCount: 4,
        sentiment: 'Energetic',
    },
    viralityScore: 7.8,
    overallScore: 8.2,
    suggestedAudience: "Aspiring entrepreneurs and marketing professionals aged 22-35.",
    hookQuality: {
        score: 9.0,
        critique: "The hook is strong, starting with a controversial statement that immediately grabs attention. It could be made even stronger by shortening the first sentence.",
        suggestion: "Instead of 'A lot of people think X is true, but they're wrong', try 'Everyone is wrong about X. Here's why.'"
    },
    monetizationPotential: "Good potential for affiliate marketing of the products mentioned. A sponsored segment could also be integrated seamlessly at the 2-minute mark.",
    suggestedImprovements: ["Add more B-roll footage.", "Use dynamic, animated captions.", "Shorten the first sentence of the hook."],
    audienceRetentionPrediction: [
        { timeLabel: "0-5s", retentionPercent: 95, reason: "Strong hook grabs attention." },
        { timeLabel: "30s", retentionPercent: 70, reason: "Potential drop-off as the main explanation begins. The visuals become static here." },
        { timeLabel: "1m 15s", retentionPercent: 55, reason: "Longest talking segment. Add a pattern interrupt (e.g., a visual gag or a quick poll) to re-engage viewers." }
    ],
    viralityCurve: [
        { timeLabel: "1h", predictedViews: 1500 },
        { timeLabel: "6h", predictedViews: 7000 },
        { timeLabel: "24h", predictedViews: 25000 },
        { timeLabel: "3d", predictedViews: 80000 },
        { timeLabel: "7d", predictedViews: 200000 },
    ],
    viralitySuggestions: {
        hooks: [
            "You've been doing [Activity] wrong your whole life.",
            "This one secret about [Topic] will blow your mind.",
            "POV: You just discovered the biggest mistake in [Industry]."
        ]
    },
    engagementStrategy: [
        "At 0:45, add a visual poll card asking viewers which point they agree with most.",
        "Pin a comment asking 'What's the one thing you learned from this video?' to spark discussion.",
        "End the video with a direct question to the audience and tell them to leave their answer in the comments.",
    ],
    momentsSummary: {
        objections: 0,
        actionItems: 1,
        keyDecisions: 0,
    },
    ctaEffectiveness: {
        score: 6.5,
        critique: "The call to action ('Check out the link in the description') is generic and lacks urgency.",
        suggestion: "Try a more specific and benefit-driven CTA, such as 'Click the link in the description to get your free marketing checklist and start saving 10 hours a week.'",
        placementAnalysis: "The CTA is placed only at the end of the video. Consider adding a mid-roll verbal CTA and a visual pop-up to increase effectiveness.",
        wordingAnalysis: "The wording is passive. Using active, benefit-driven language will improve click-through rates."
    },
    technicalQuality: {
        resolutionClarity: {
            score: 9.5,
            critique: "Video is sharp 1080p. No issues with clarity.",
            suggestion: "Maintain this resolution for all future content. If uploading to platforms that support it, consider exporting in 4K for better downsampling."
        },
        lighting: {
            score: 7.5,
            critique: "Main subject is well-lit with a key light. The background is a bit dark, causing a 'flat' look.",
            suggestion: "Add a simple hair light (rim light) behind the subject and a small light for the background to create more depth and separation."
        },
        colorGrading: {
            score: 7.0,
            critique: "Standard color correction applied, but the colors lack a distinct style or mood.",
            suggestion: "Apply a stylized LUT (Look-Up Table) like a teal & orange grade to create a more professional, cinematic look that aligns with your brand."
        }
    },
    editingSuggestions: [
        { timestamp: "0:08", type: 'Cut', suggestion: "J-cut to the next scene's audio before the visual cut to create a smoother transition." },
        { timestamp: "0:15", type: 'Text', suggestion: "Add a text overlay: 'Key Mistake #1' to emphasize the point." },
        { timestamp: "0:22", type: 'Effect', suggestion: "Apply a subtle zoom-in effect to build intensity as you reveal the solution." },
        { timestamp: "0:35", type: 'Audio', suggestion: "Add a 'swoosh' sound effect here to emphasize the transition between points." }
    ],
    suggestedDescription: "In this video, we break down the ONE mistake almost every new content creator makes that's killing their channel growth. If you want to grow your YouTube channel in 2024, you need to avoid this common pitfall. We'll cover content strategy, audience growth, and video marketing tips that actually work. \n\n#creator #youtubetips #videomarketing",
    suggestedTitles: [
        "The BIGGEST Mistake New Creators Make",
        "STOP Doing This If You Want to Grow Your Channel",
        "How I Grew My Channel by 300% (By Fixing This One Thing)"
    ],
    suggestedTags: [
        "content creator tips", "youtube growth", "video marketing", "creator economy", "social media strategy", "audience growth", "video SEO", "making better videos", "editing tips", "content strategy 2024"
    ],
};

export const MOCK_SOCIAL_MEDIA_ANALYSIS: SocialMediaAnalysis = {
    overallScore: 7.2,
    hookEffectiveness: {
        score: 6.5,
        critique: "The hook starts with a question, which is good, but it's a bit too generic and doesn't create enough curiosity.",
        suggestion: "Instead of 'Do you want to grow your business?', try 'This is the biggest mistake businesses make on social media.'"
    },
    visualAppeal: {
        score: 7.0,
        critique: "The visuals are clean, but the static background can get boring. The text overlays are clear but lack dynamic animation.",
        suggestion: "Incorporate short B-roll clips that visually represent the topic. Use animated text that appears word-by-word to keep viewers engaged."
    },
    callToAction: {
        score: 5.0,
        critique: "The CTA 'learn more in my bio' is passive and lacks a clear benefit for the user.",
        suggestion: "Make the CTA more specific and benefit-driven, like 'Tap the link in my bio to get my free 5-step growth checklist.'"
    },
    brandConsistency: {
        score: 8.0,
        critique: "The color scheme and logo usage are consistent with a professional brand. The tone is informative but could be more engaging to match a 'witty' brand voice."
    },
    engagementPrediction: "Medium shares, low comments. The content is valuable and shareable, but it doesn't prompt a direct response from the audience, leading to fewer comments.",
    captionAndHashtags: {
        critique: "The caption is a bit long and not easily scannable. The hashtags are too broad and competitive.",
        suggestedCaption: "STOP making this mistake on social media! 🛑\n\nMost businesses focus on the wrong metrics. Here’s what to focus on instead to ACTUALLY grow. 👇\n\nWant my free checklist? Link in bio! 🚀",
        suggestedHashtags: ["#socialmediamarketing", "#digitalmarketingtips", "#smallbusinesstips", "#marketingstrategy", "#creatorgrowth"]
    },
    suggestedImprovements: [
        "Shorten the first sentence of the hook to be more punchy.",
        "Add dynamic captions to highlight keywords.",
        "End the video with a direct question to encourage comments."
    ],
    viralityScore: 7.5,
    viralitySuggestions: {
        hooks: [
            "Stop posting on social media until you know this secret.",
            "Your content is failing because you're missing this key ingredient.",
            "I analyzed 100 viral posts, and they all do this one thing."
        ],
        strategies: [
            "Create a controversial 'duet' or 'stitch' with a larger creator in your niche to tap into their audience.",
            "Turn the main point into a 3-part series to encourage followers for part 2.",
            "Use a 'text on screen' poll halfway through the video to drive immediate engagement and algorithm boosts."
        ],
        timeline: {
            hours: "Initial views will be slow, driven by existing followers.",
            day: "If the hook is improved, it may get picked up by the algorithm and see a spike in shares.",
            week: "Potential to reach a wider audience if engagement rate is high enough in the first 24 hours."
        }
    },
    targetAudience: "Small business owners and aspiring content creators aged 25-40 who are looking for actionable marketing advice."
};


export const MOCK_SALES_CALL_ANALYSIS: SalesCallAnalysis = {
    summary: "The salesperson successfully converted a skeptical client by identifying a key pain point and demonstrating clear value, ultimately securing a demo.",
    overallPerformance: "A strong call that successfully overcame initial objections and secured a demo. The salesperson demonstrated good value propositioning but could improve on initial discovery.",
    rapportBuilding: "Rapport was built quickly by acknowledging the client's current satisfaction and showing understanding, which lowered their guard.",
    needsDiscovery: "Could have been more thorough. The salesperson correctly identified a pain point (cross-departmental visibility) but missed an opportunity to ask more probing questions about the client's current system and its specific failures.",
    productPresentation: "Excellent. The presentation of Synchro was directly tied to the client's stated pain point and supported by a powerful data point (30% delay reduction), making it highly relevant and impactful.",
    objectionHandling: "Top-tier. The initial 'we're happy with our current system' objection was handled perfectly by not being defensive and instead pivoting to a common, high-value problem.",
    closingEffectiveness: "Good and effective. The salesperson proposed a clear, low-commitment next step (a 15-minute demo) and created a sense of urgency and value. It was a successful close for a next step.",
    clarityScore: 9.5,
    confidenceScore: 9.0,
    speechAnalyses: {
        'A': { pacingWPM: 155, fillerWordCount: 2, dominantTone: 'Confident' },
        'B': { pacingWPM: 140, fillerWordCount: 5, dominantTone: 'Skeptical' },
    },
    momentsSummary: {
        objections: 1,
        actionItems: 1,
        keyDecisions: 1,
    },
    brandVoiceAlignment: {
        score: 8.5,
        analysis: "The salesperson did a great job of matching the 'Professional and Engaging' brand voice. The tone was confident and the use of data points aligned well. To improve, a touch more wit could be used in the opening to fully capture the brand personality."
    },
    talkTimeRatio: {
        'A': 65,
        'B': 35,
    },
    strengths: [
        "Effectively overcame initial objections by pivoting to a relevant pain point (project visibility).",
        "Used a powerful data point (30% delay reduction) to build value.",
        "Maintained a confident and positive tone throughout the call."
    ],
    weaknesses: [
        "Could have tried to discover more about the client's current system and its specific shortcomings earlier.",
        "The closing could be slightly stronger by confirming the value proposition one last time."
    ],
    areasOfImprovement: [
        "In the beginning, ask more open-ended questions like 'What's one thing you wish your current system did better?' to uncover more pain points.",
        "When confirming the demo, briefly reiterate the main value proposition, e.g., 'Great, I look forward to showing you how to cut those project delays.'",
        "Try to quantify the impact of the problem for the client, for example, by asking 'How many hours a week would you say your team loses to these visibility issues?'"
    ],
    viralitySuggestions: {
        title: "How I turned a 'No' into a 'Yes' in 30 seconds",
        description: "Watch this salesperson handle a tough objection like a pro! #sales #salestips #objectionhandling",
        keyViralMoment: "The key moment is the pivot: 'I completely understand. A lot of our happiest customers said the exact same thing before they saw how Synchro could solve problems they didn't even realize were slowing them down.' This is a masterclass in objection handling.",
        viralityScore: 8.8,
        hooks: [
            "They said they were happy with their current system...",
            "The one question that changes a client's mind.",
            "POV: You're about to lose a deal, but then..."
        ],
        timeline: {
            hours: "Initial spike in views from sales professionals on LinkedIn and TikTok.",
            day: "Shares within sales teams, discussions in comments about the technique.",
            week: "Wider audience reach, potentially featured by sales influencers or marketing pages."
        }
    }
};

export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
    transcript: MOCK_TRANSCRIPT,
    performanceMetrics: MOCK_PERFORMANCE_METRICS,
    feedbackCard: MOCK_FEEDBACK_CARD,
    salesCallAnalysis: MOCK_SALES_CALL_ANALYSIS,
    videoAnalysis: MOCK_VIDEO_ANALYSIS,
    socialMediaAnalysis: MOCK_SOCIAL_MEDIA_ANALYSIS,
};