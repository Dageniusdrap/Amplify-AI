import React, { useState, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { ContentInput } from './components/ContentInput';
import { Dashboard } from './components/Dashboard';
import { Loader } from './components/Loader';
import { SidebarNav, AnalysisType } from './components/SidebarNav';
import {
  analyzeSalesCall,
  analyzeSocialMediaContent,
  analyzeProductAd,
  analyzeVideoContent,
  analyzeDocument,
  analyzeLiveStream,
  analyzeFinancialReport,
  transcribeVideo,
  generateImprovedContent,
  generateSocialPost,
  generateProductAd,
  generateSpeechFromText,
  generateKeyTakeaways,
  generateDescription,
  generateRetirementPlan,
} from './services/geminiService';
import type { AnalysisResult, AnalysisHistoryItem, User, RetirementPlan, Notification } from './types';
import { MOCK_ANALYSIS_RESULT } from './constants';
import { GenerationView } from './components/GenerationView';
import { BrandVoiceSetup } from './components/BrandVoiceSetup';
import { PricingView } from './components/PricingView';
import { AuthView } from './components/AuthView';
import { ActivationView } from './components/ActivationView';
import { UpgradeModal } from './components/UpgradeModal';
import { AnalysisHistoryModal } from './components/AnalysisHistoryModal';
import { LogoutIcon } from './components/icons/LogoutIcon';
import { HistoryIcon } from './components/icons/HistoryIcon';
import { OnboardingTour, OnboardingStep } from './components/OnboardingTour';
import { Overlay } from './components/Overlay';
import { RetirementPlanner } from './components/RetirementPlanner';
import { LiveDebugger } from './components/LiveDebugger';
import { WelcomeModal } from './components/WelcomeModal';
import { NotificationContainer } from './components/Notification';
import { QuestionMarkCircleIcon } from './components/icons/QuestionMarkCircleIcon';

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

const ANALYSIS_ONBOARDING_STEPS: OnboardingStep[] = [
    { selector: '#analysis-type-selector', title: '1. Select Your Analysis Tool', content: 'Welcome to Creators Edge AI! Start by choosing what you want to analyze. From a viral video to a sales call or a new blog post, we have a specialized tool for it.' },
    { selector: '#analysis-input-area', title: '2. Upload Your Content', content: 'Next, provide your content. You can upload a video or document, or simply paste in your text. The AI will handle the rest, including transcription.' },
    { selector: '#analysis-submit-button', title: '3. Run the AI Analysis', content: 'Click here to let our AI co-pilot work its magic. It will perform a deep dive into your content to uncover actionable insights.' },
    { selector: '#analysis-report-area', title: '4. Get Your Expert Report', content: 'Your comprehensive report appears here. It includes everything from performance graphs and scores to a full transcript of your media.' },
    { selector: '#feedback-card-area', title: '5. Turn Insights into Action', content: 'The AI Coaching Card is your creative partner. It provides clear feedback and lets you instantly generate improved scripts, social posts, and more, all based on the analysis.' },
    { selector: '#user-menu-area', title: '6. Manage Your Creative Hub', content: 'Your account menu lets you view past analyses, manage your brand voice, and check your plan details. Everything you need is right here.' },
];

const GENERATION_ONBOARDING_STEPS: OnboardingStep[] = [
    { selector: '#generation-type-tabs', title: 'Choose Your Creation Tool', content: 'Start by selecting what you want to create, from a viral script to a full video.' },
    { selector: '#prompt-textarea', title: 'Craft Your Prompt', content: 'This is where the magic begins. Describe your idea in detail. The more specific you are, the better the result!' },
    { selector: '#generation-controls', title: 'Fine-Tune Your Creation', content: 'Each tool has powerful options. Adjust aspect ratios for images, select models for video, or choose a voice for speech generation.' },
    { selector: '#generate-button', title: 'Bring Your Idea to Life', content: "When you're ready, click here to let the AI work its magic." },
    { selector: '#generation-results-panel', title: 'Your Creation is Ready!', content: 'Your generated content will appear here. You can download it, edit it further, or use it as a base for another creation.' },
    { selector: '#user-menu-area', title: 'Manage Your Account', content: 'You can also access your generation history, plan details, and brand voice from this menu.' },
];


const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('contentGeneration');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [contentInputs, setContentInputs] = useState({ script: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generated Content State
  const [improvedContent, setImprovedContent] = useState<string | null>(null);
  const [isGeneratingImproved, setIsGeneratingImproved] = useState(false);
  const [socialPost, setSocialPost] = useState<{ platform: 'X' | 'LinkedIn' | 'Instagram'; content: string } | null>(null);
  const [isGeneratingSocialPost, setIsGeneratingSocialPost] = useState(false);
  const [productAd, setProductAd] = useState<string | null>(null);
  const [isGeneratingProductAd, setIsGeneratingProductAd] = useState(false);
  const [keyTakeaways, setKeyTakeaways] = useState<string[] | null>(null);
  const [isGeneratingKeyTakeaways, setIsGeneratingKeyTakeaways] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [feedbackAudio, setFeedbackAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [scriptAudio, setScriptAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [isGeneratingScriptAudio, setIsGeneratingScriptAudio] = useState(false);
  const [initialGenerationScript, setInitialGenerationScript] = useState<string | null>(null);
  const [retirementPlan, setRetirementPlan] = useState<RetirementPlan | null>(null);
  
  // App-level state
  const [brandVoice, setBrandVoice] = useLocalStorage('brandVoice', 'Professional, engaging, and slightly witty.');
  const [analysisHistory, setAnalysisHistory] = useLocalStorage<AnalysisHistoryItem[]>('analysisHistory', []);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage('hasCompletedTour', false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [overlayContent, setOverlayContent] = useState<React.ReactNode | null>(null);
  const [highlightedTimeLabel, setHighlightedTimeLabel] = useState<string | null>(null);
  
  // Sales call speaker roles
  const [speakerARole, setSpeakerARole] = useState<'me' | 'client'>('me');
  const [speakerBRole, setSpeakerBRole] = useState<'me' | 'client'>('client');

  // Auth State
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!currentUser);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [generationCount, setGenerationCount] = useLocalStorage('generationCount', 0);
  const MAX_FREE_GENERATIONS = 5;

  // Cancellation logic
  const cancelRequestRef = useRef(false);

  useEffect(() => {
    if (currentUser) {
      setIsAuthenticated(true);
    }
  }, [currentUser]);
  
  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      if (feedbackAudio) URL.revokeObjectURL(feedbackAudio.url);
      if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
    };
  }, [fileUrl, feedbackAudio, scriptAudio]);
  
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    // Prevent duplicate error messages
    if (type === 'error' && notifications.some(n => n.message === message)) return;
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const resetState = (newType?: AnalysisType) => {
    setSelectedFile(null);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    if (feedbackAudio) URL.revokeObjectURL(feedbackAudio.url);
    setFeedbackAudio(null);
    if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
    setScriptAudio(null);
    setContentInputs({ script: '', description: '' });
    setAnalysisResult(null);
    setImprovedContent(null);
    setSocialPost(null);
    setProductAd(null);
    setKeyTakeaways(null);
    setGeneratedDescription(null);
    setRetirementPlan(null);
    setHighlightedTimeLabel(null);
    // Reset speaker roles to default
    setSpeakerARole('me');
    setSpeakerBRole('client');
    if(newType) setAnalysisType(newType);
  };
  
  const handleTypeChange = (type: AnalysisType) => {
    if (type !== analysisType) {
       resetState(type);
    }
  };
  
  const handleFileSelect = async (file: File) => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    const validFileTypes: Record<AnalysisType, string[]> = {
        salesCall: ['audio/', 'video/', 'text/plain', 'text/markdown'],
        videoAnalysis: ['video/'],
        videoToScript: ['video/'],
        liveStream: ['video/'],
        socialMedia: ['audio/', 'video/', 'image/'],
        productAd: ['audio/', 'video/', 'image/'],
        documentAnalysis: ['text/plain', 'application/pdf', 'text/markdown'],
        financialReport: ['text/plain', 'application/pdf', 'text/markdown'],
        contentGeneration: [],
        brandVoice: [],
        pricing: [],
        retirementPlanner: [],
        liveDebugger: [],
    };

    const isFileTypeValid = validFileTypes[analysisType]?.some(type => file.type.startsWith(type));

    if (!isFileTypeValid) {
        addNotification('Invalid file type for this analysis mode.', 'error');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        addNotification(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 50MB.`, 'error');
        return;
    }

    setSelectedFile(file);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(URL.createObjectURL(file));

    // For document analysis, read the file content into the script input
    if ((analysisType === 'documentAnalysis' || analysisType === 'salesCall' || analysisType === 'financialReport') && file.type.startsWith('text/')) {
        const text = await file.text();
        setContentInputs(prev => ({ ...prev, script: text }));
    }
  };

  const handleClearFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setSelectedFile(null);
    setFileUrl(null);
  };

  const handleCancel = () => {
    cancelRequestRef.current = true;
    setIsLoading(false);
    setIsGeneratingImproved(false);
    setIsGeneratingSocialPost(false);
    setIsGeneratingProductAd(false);
    setIsGeneratingKeyTakeaways(false);
    setIsGeneratingDescription(false);
    setIsGeneratingAudio(false);
    setIsGeneratingScriptAudio(false);
    setUploadProgress(null);
    addNotification("Operation cancelled by user.", "info");
  };

  const handleAnalysisSubmit = async () => {
    const hasFile = !!selectedFile;
    const hasText = !!contentInputs.script.trim() || !!contentInputs.description.trim();

    if (!hasFile && !hasText) {
        addNotification('Please provide a file or some content to analyze.', 'error');
        return;
    }
    
    if(!attemptGeneration()) return;
    
    cancelRequestRef.current = false;
    setIsLoading(true);
    setUploadProgress(selectedFile ? 0 : null);
    setAnalysisResult(null);
    setImprovedContent(null);
    setSocialPost(null);
    setProductAd(null);
    setKeyTakeaways(null);
    setGeneratedDescription(null);
    if (feedbackAudio) {
        URL.revokeObjectURL(feedbackAudio.url);
        setFeedbackAudio(null);
    }
     if (scriptAudio) {
        URL.revokeObjectURL(scriptAudio.url);
        setScriptAudio(null);
    }

    try {
      let result: AnalysisResult;
      const file = selectedFile ?? undefined;
      const progressCallback = (progress: number) => {
        setUploadProgress(progress);
      };

      switch (analysisType) {
        case 'salesCall':
          if (!file && !contentInputs.script.trim()) throw new Error("A file or script is required for Sales Call analysis.");
          result = await analyzeSalesCall(contentInputs.script, brandVoice, file, progressCallback);
          break;
        case 'socialMedia':
          result = await analyzeSocialMediaContent(contentInputs.script, contentInputs.description, file, progressCallback);
          break;
        case 'productAd':
          result = await analyzeProductAd(contentInputs.script, contentInputs.description, file, progressCallback);
          break;
        case 'videoAnalysis':
            if (!file) throw new Error("A video file is required for Video analysis.");
            result = await analyzeVideoContent(file, progressCallback);
            break;
        case 'videoToScript':
            if (!file) throw new Error("A video file is required for Video to Script conversion.");
            result = await transcribeVideo(file, progressCallback);
            break;
        case 'liveStream':
            if (!file) throw new Error("A video file is required for Live Stream analysis.");
            result = await analyzeLiveStream(file, progressCallback);
            break;
        case 'documentAnalysis':
            if (!file && !contentInputs.script.trim()) throw new Error("A file or text content is required for Document analysis.");
            result = await analyzeDocument(contentInputs.script, contentInputs.description, file, progressCallback);
            break;
        case 'financialReport':
            if (!file && !contentInputs.script.trim()) throw new Error("A file or text content is required for Financial Report analysis.");
            result = await analyzeFinancialReport(contentInputs.script, contentInputs.description, file, progressCallback);
            break;
        default:
          throw new Error("Invalid analysis type for submission.");
      }
      if (cancelRequestRef.current) return;

      setAnalysisResult(result);
      addToHistory({
        result,
        analysisType,
        timestamp: new Date().toISOString(),
        fileName: selectedFile?.name,
      });
      onSuccessfulGeneration();
    } catch (err: any) {
      if (cancelRequestRef.current) return;
      addNotification(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleGenerateRetirementPlan = async (inputs: any) => {
    if (!attemptGeneration()) return;
    
    cancelRequestRef.current = false;
    setIsLoading(true);
    setRetirementPlan(null);

    try {
        const plan = await generateRetirementPlan(inputs);
        if (cancelRequestRef.current) return;
        setRetirementPlan(plan);
        onSuccessfulGeneration();
    } catch (err: any) {
        if (cancelRequestRef.current) return;
        addNotification(err.message || 'An unexpected error occurred during plan generation.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateImprovedContent = async () => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingImproved(true);
    try {
      const content = await generateImprovedContent(analysisResult, brandVoice);
      if (cancelRequestRef.current) return;
      setImprovedContent(content);
      onSuccessfulGeneration();
    } catch (err: any) {
      if (cancelRequestRef.current) return;
      addNotification(err.message || 'An unexpected error occurred during content generation.', 'error');
    } finally {
      setIsGeneratingImproved(false);
    }
  };
  
  const handleGenerateSocialPost = async (platform: 'X' | 'LinkedIn' | 'Instagram') => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingSocialPost(true);
    try {
        const post = await generateSocialPost(analysisResult, platform);
        if (cancelRequestRef.current) return;
        setSocialPost({ platform, content: post });
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        addNotification(err.message || 'An unexpected error occurred while generating the social post.', 'error');
    } finally {
        setIsGeneratingSocialPost(false);
    }
  };

  const handleGenerateProductAd = async () => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;
    
    cancelRequestRef.current = false;
    setIsGeneratingProductAd(true);
    try {
        const ad = await generateProductAd(analysisResult);
        if (cancelRequestRef.current) return;
        setProductAd(ad);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        addNotification(err.message || 'An unexpected error occurred while generating the product ad.', 'error');
    } finally {
        setIsGeneratingProductAd(false);
    }
  };

  const handleGenerateKeyTakeaways = async () => {
    if (!analysisResult) return;
    if (!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingKeyTakeaways(true);
    try {
        const takeaways = await generateKeyTakeaways(analysisResult);
        if (cancelRequestRef.current) return;
        setKeyTakeaways(takeaways);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        addNotification(err.message || 'An unexpected error occurred while generating key takeaways.', 'error');
    } finally {
        setIsGeneratingKeyTakeaways(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!analysisResult) return;
    if (!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingDescription(true);
    try {
        const description = await generateDescription(analysisResult, brandVoice);
        if (cancelRequestRef.current) return;
        setGeneratedDescription(description);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        addNotification(err.message || 'An unexpected error occurred while generating the description.', 'error');
    } finally {
        setIsGeneratingDescription(false);
    }
  };

  const handleListenToFeedback = async (voice: string, style: string): Promise<void> => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;
    
    if (feedbackAudio) {
        URL.revokeObjectURL(feedbackAudio.url);
        setFeedbackAudio(null);
    }

    const feedbackText = `
      Here is your feedback summary.
      Strengths: ${analysisResult.feedbackCard.strengths.join('. ')}.
      Opportunities: ${analysisResult.feedbackCard.opportunities.join('. ')}.
    `;
    
    cancelRequestRef.current = false;
    setIsGeneratingAudio(true);
    try {
      const audioBlob = await generateSpeechFromText(feedbackText, voice, style);
      if (cancelRequestRef.current) return;

      const url = URL.createObjectURL(audioBlob);
      setFeedbackAudio({ url, blob: audioBlob });
      onSuccessfulGeneration();
    } catch (err: any) {
      if (cancelRequestRef.current) return;
      addNotification(err.message || 'Failed to generate audio feedback.', 'error');
    } finally {
        setIsGeneratingAudio(false);
    }
  };
  
  const handleListenToScript = async (script: string, voice: string, style: string): Promise<void> => {
    if (!script) return;
    if(!attemptGeneration()) return;
    
    if (scriptAudio) {
        URL.revokeObjectURL(scriptAudio.url);
        setScriptAudio(null);
    }
    
    cancelRequestRef.current = false;
    setIsGeneratingScriptAudio(true);
    try {
      const audioBlob = await generateSpeechFromText(script, voice, style);
      if (cancelRequestRef.current) return;

      const url = URL.createObjectURL(audioBlob);
      setScriptAudio({ url, blob: audioBlob });
      onSuccessfulGeneration();
    } catch (err: any) {
      if (cancelRequestRef.current) return;
      addNotification(err.message || 'Failed to generate audio for the script.', 'error');
    } finally {
        setIsGeneratingScriptAudio(false);
    }
  };


  const handleGenerateVideoFromScript = (script: string) => {
    setInitialGenerationScript(script);
    handleTypeChange('contentGeneration');
  };

  const attemptGeneration = (): boolean => {
    if (currentUser?.plan === 'Free' && generationCount >= MAX_FREE_GENERATIONS) {
      setOverlayContent(
        <UpgradeModal 
          isOpen={true}
          onClose={() => setOverlayContent(null)}
          onUpgrade={() => {
            setAnalysisType('pricing');
            setOverlayContent(null);
          }}
        />
      );
      return false;
    }
    return true;
  };

  const onSuccessfulGeneration = () => {
    if (currentUser?.plan === 'Free') {
      setGenerationCount(prev => prev + 1);
    }
  };
  
  const addToHistory = (item: AnalysisHistoryItem) => {
    setAnalysisHistory(prev => [item, ...prev.slice(0, 49)]); // Keep last 50
  };

  const handleSelectFromHistory = (item: AnalysisHistoryItem) => {
    resetState();
    setAnalysisType(item.analysisType);
    setAnalysisResult(item.result);
    setIsHistoryOpen(false);
  };
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setHasCompletedTour(false); // Reset tour for new user
  };
  
  const handleSignup = (user: User) => {
    setCurrentUser(user);
  };

  const handleActivation = (user: User) => {
      const activatedUser = { ...user, activated: true };
      setCurrentUser(activatedUser);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    resetState('contentGeneration');
  };
  
  // --- Onboarding Handlers ---
  const handleStartTour = () => {
    setOverlayContent(null);
    setShowOnboarding(true);
  };

  const handleSkipOnboarding = () => {
    setOverlayContent(null);
    setHasCompletedTour(true);
  };
  
  const handleOnboardingFinish = () => {
    setHasCompletedTour(true);
    setShowOnboarding(false);
  };

  // Set initial view and trigger onboarding
  useEffect(() => {
    if (isAuthenticated) {
      if (!hasCompletedTour && !showOnboarding) {
        // Show Welcome Modal before the tour
        setOverlayContent(
          <WelcomeModal 
            onStartTour={handleStartTour} 
            onSkip={handleSkipOnboarding}
          />);
      }
    } else {
      resetState('contentGeneration');
      // Clear welcome modal if user logs out
      if (overlayContent?.type === WelcomeModal) {
          setOverlayContent(null);
      }
    }
  }, [isAuthenticated, hasCompletedTour]);


  
  const renderContent = () => {
    if (!isAuthenticated) {
        return (
          <div className="flex items-center justify-center min-h-full">
            <AuthView onLogin={handleLogin} onSignup={handleSignup} />
          </div>
        );
    }
    if (!currentUser?.activated) {
        return (
          <div className="flex items-center justify-center min-h-full">
            <ActivationView user={currentUser} onActivationSuccess={handleActivation} />
          </div>
        );
    }
    
    const analysisInputView = () => {
        const fileUploadTypes: AnalysisType[] = ['videoAnalysis', 'liveStream', 'videoToScript'];
        const contentInputTypes: AnalysisType[] = ['salesCall', 'socialMedia', 'productAd', 'documentAnalysis', 'financialReport'];

        if (fileUploadTypes.includes(analysisType)) {
            return (
                <div id="analysis-input-area" className="w-full max-w-lg mx-auto">
                    <FileUpload
                        onFileSelect={handleFileSelect}
                        onClearFile={handleClearFile}
                        onSubmit={handleAnalysisSubmit}
                        isLoading={isLoading}
                        selectedFile={selectedFile}
                        fileUrl={fileUrl}
                        analysisType={analysisType}
                    />
                </div>
            );
        }
        if (contentInputTypes.includes(analysisType)) {
            return (
                 <div id="analysis-input-area" className="w-full max-w-lg mx-auto">
                     <ContentInput
                        onInputsChange={setContentInputs}
                        onSubmit={handleAnalysisSubmit}
                        isLoading={isLoading}
                        inputs={contentInputs}
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        analysisType={analysisType}
                        onClearFile={handleClearFile}
                     />
                 </div>
            );
        }
        return null;
    };
    
    if (analysisType === 'contentGeneration') {
      return <div id="analysis-input-area" className="w-full"><GenerationView brandVoice={brandVoice} onAttemptGenerate={attemptGeneration} onSuccessfulGeneration={onSuccessfulGeneration} initialScript={initialGenerationScript} onScriptConsumed={() => setInitialGenerationScript(null)} addNotification={addNotification} /></div>;
    }
    if (analysisType === 'brandVoice') {
      return <div id="analysis-input-area" className="w-full max-w-lg mx-auto"><BrandVoiceSetup currentVoice={brandVoice} onSave={setBrandVoice} /></div>;
    }
    if (analysisType === 'pricing') {
      return <div id="analysis-input-area" className="w-full"><PricingView currentPlan={currentUser!.plan} onApplyPromoCode={(code) => console.log(code)} /></div>;
    }
     if (analysisType === 'retirementPlanner') {
      return <div id="analysis-input-area" className="w-full"><RetirementPlanner onGenerate={handleGenerateRetirementPlan} isLoading={isLoading} plan={retirementPlan} onCancel={handleCancel} /></div>;
    }
    if (analysisType === 'liveDebugger') {
        return <div id="analysis-input-area" className="w-full"><LiveDebugger /></div>;
    }

    return (
      <div className="w-full">
        {analysisResult ? (
          <Dashboard
            result={analysisResult}
            isGeneratingImproved={isGeneratingImproved}
            improvedContent={improvedContent}
            onGenerateImprovedContent={handleGenerateImprovedContent}
            file={selectedFile}
            fileUrl={fileUrl}
            analysisType={analysisType}
            socialPost={socialPost}
            isGeneratingSocialPost={isGeneratingSocialPost}
            onGenerateSocialPost={handleGenerateSocialPost}
            productAd={productAd}
            isGeneratingProductAd={isGeneratingProductAd}
            onGenerateProductAd={handleGenerateProductAd}
            keyTakeaways={keyTakeaways}
            isGeneratingKeyTakeaways={isGeneratingKeyTakeaways}
            onGenerateKeyTakeaways={handleGenerateKeyTakeaways}
            generatedDescription={generatedDescription}
            isGeneratingDescription={isGeneratingDescription}
            onGenerateDescription={handleGenerateDescription}
            onListenToFeedback={handleListenToFeedback}
            onGenerateVideoFromScript={handleGenerateVideoFromScript}
            isGeneratingAudio={isGeneratingAudio}
            feedbackAudio={feedbackAudio}
            onListenToScript={handleListenToScript}
            isGeneratingScriptAudio={isGeneratingScriptAudio}
            scriptAudio={scriptAudio}
            onCancel={handleCancel}
            highlightedTimeLabel={highlightedTimeLabel}
            onTimeSegmentHover={setHighlightedTimeLabel}
            speakerARole={speakerARole}
            speakerBRole={speakerBRole}
            onSpeakerARoleChange={setSpeakerARole}
            onSpeakerBRoleChange={setSpeakerBRole}
          />
        ) : (
          <div className="flex items-center justify-center min-h-full pt-16">
            {analysisInputView()}
          </div>
        )}
      </div>
    );
  };
  
  const isGenerationView = analysisType === 'contentGeneration';
  const tourSteps = isGenerationView ? GENERATION_ONBOARDING_STEPS : ANALYSIS_ONBOARDING_STEPS;
  
  const currentToolConfig = SidebarNav.toolConfig[analysisType];
  const loaderMessage = "Analyzing your content...";

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 font-sans flex">
        <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
        {isLoading && (
            <Overlay>
                <Loader message={loaderMessage} onCancel={handleCancel} progress={uploadProgress} />
            </Overlay>
        )}
        {overlayContent && <Overlay>{overlayContent}</Overlay>}
        {isAuthenticated && showOnboarding && (
            <OnboardingTour steps={tourSteps} onFinish={handleOnboardingFinish} />
        )}
        
        {isAuthenticated && (
            <SidebarNav selectedType={analysisType} onTypeChange={handleTypeChange} />
        )}
        
        <div className="flex-1 flex flex-col">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {!isAuthenticated ? (
                  renderContent()
                ) : (
                  <>
                    <header className="flex justify-between items-center mb-8 p-4 bg-black/10 backdrop-blur-lg rounded-xl border border-white/10">
                       <div>
                         {currentToolConfig && (
                           <>
                             <h1 className="text-2xl font-bold text-white">{currentToolConfig.label}</h1>
                             <p className="text-sm text-gray-300 mt-1">{currentToolConfig.description}</p>
                           </>
                         )}
                       </div>
                       {currentUser && (
                         <div id="user-menu-area" className="flex items-center space-x-2 sm:space-x-4">
                            <span className="text-sm font-medium hidden sm:inline text-white">
                                {currentUser.name || currentUser.email.split('@')[0]}
                            </span>
                             <button
                                onClick={() => setShowOnboarding(true)}
                                className="p-2 rounded-full text-white hover:bg-white/20"
                                aria-label="Start tour"
                            >
                                <QuestionMarkCircleIcon className="h-6 w-6" />
                            </button>
                             <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="p-2 rounded-full text-white hover:bg-white/20"
                                aria-label="View history"
                            >
                                <HistoryIcon className="h-6 w-6" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full text-white hover:bg-white/20"
                                aria-label="Logout"
                            >
                                <LogoutIcon className="h-6 w-6" />
                            </button>
                        </div>
                       )}
                    </header>
                    {renderContent()}
                  </>
                )}
            </main>
        </div>
        
        <AnalysisHistoryModal 
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={analysisHistory}
            onSelect={handleSelectFromHistory}
            onClear={() => setAnalysisHistory([])}
            onDelete={(timestamp) => setAnalysisHistory(prev => prev.filter(item => item.timestamp !== timestamp))}
        />
    </div>
  );
};

export default App;