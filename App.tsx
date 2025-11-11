import React, { useState, useEffect, useRef } from 'react';
import { FileUpload } from './components/FileUpload';
import { ContentInput } from './components/ContentInput';
import { Dashboard } from './components/Dashboard';
import { Loader } from './components/Loader';
import { AnalysisTypeSelector, AnalysisType } from './components/AnalysisTypeSelector';
import { LogoIcon } from './components/icons/LogoIcon';
import {
  analyzeSalesCall,
  analyzeSocialMediaContent,
  analyzeProductAd,
  analyzeVideoContent,
  analyzeDocument,
  analyzeLiveStream,
  generateImprovedContent,
  generateSocialPost,
  generateProductAd,
  generateSpeechFromText,
  generateKeyTakeaways,
  generateDescription,
  generateRetirementPlan,
} from './services/geminiService';
import type { AnalysisResult, AnalysisHistoryItem, User, RetirementPlan } from './types';
import { MOCK_TRANSCRIPT } from './constants';
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

const ONBOARDING_STEPS: OnboardingStep[] = [
    { selector: '#analysis-type-selector', title: 'Choose Your Tool', content: 'Start by selecting what you want to do, from generating new content to analyzing existing sales calls, videos, and more.' },
    { selector: '#analysis-input-area', title: 'Provide Your Content', content: 'Next, upload your file or paste your text here. This is the content Amplify AI will work with.' },
    { selector: '#analysis-submit-button', title: 'Start the Magic', content: 'Click here to run the analysis or generation. The AI will process your content and provide actionable insights.' },
    { selector: '#analysis-report-area', title: 'Review Your Results', content: 'Your detailed report will appear here, with feedback, transcripts, and performance metrics.' },
    { selector: '#feedback-card-area', title: 'Get Actionable Feedback', content: 'The AI Feedback Card gives you clear strengths and opportunities. You can even generate new content based on this feedback!' },
    { selector: '#user-menu-area', title: 'Manage Your Account', content: 'Access your analysis history, see your plan details, and manage your brand voice from this menu.' },
];


const App: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('contentGeneration');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [contentInputs, setContentInputs] = useState({ script: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Generated Content State
  const [improvedContent, setImprovedContent] = useState<string | null>(null);
  const [isGeneratingImproved, setIsGeneratingImproved] = useState(false);
  const [socialPost, setSocialPost] = useState<string | null>(null);
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
      if (!hasCompletedTour) {
        setShowOnboarding(true);
      }
    }
  }, [currentUser, hasCompletedTour]);
  
  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      if (feedbackAudio) URL.revokeObjectURL(feedbackAudio.url);
      if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
    };
  }, [fileUrl, feedbackAudio, scriptAudio]);
  
  const resetState = (newType?: AnalysisType) => {
    setSelectedFile(null);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    if (feedbackAudio) URL.revokeObjectURL(feedbackAudio.url);
    setFeedbackAudio(null);
    if (scriptAudio) URL.revokeObjectURL(scriptAudio.url);
    setScriptAudio(null);
    setContentInputs({ script: '', description: '' });
    setError(null);
    setUploadError(null);
    setAnalysisResult(null);
    setImprovedContent(null);
    setSocialPost(null);
    setProductAd(null);
    setKeyTakeaways(null);
    setGeneratedDescription(null);
    setRetirementPlan(null);
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
        salesCall: ['audio/', 'video/'],
        videoAnalysis: ['video/'],
        liveStream: ['video/'],
        socialMedia: ['audio/', 'video/', 'image/'],
        productAd: ['audio/', 'video/', 'image/'],
        documentAnalysis: ['text/plain', 'application/pdf', 'text/markdown'],
        contentGeneration: [],
        brandVoice: [],
        pricing: [],
        retirementPlanner: [],
    };

    const isFileTypeValid = validFileTypes[analysisType]?.some(type => file.type.startsWith(type));

    if (!isFileTypeValid) {
        setUploadError('Invalid file type for this analysis mode.');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 50MB.`);
        return;
    }

    setUploadError(null);
    setSelectedFile(file);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl(URL.createObjectURL(file));

    // For document analysis, read the file content into the script input
    if (analysisType === 'documentAnalysis' && file.type.startsWith('text/')) {
        const text = await file.text();
        setContentInputs(prev => ({ ...prev, script: text }));
    }
  };

  const handleClearFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setSelectedFile(null);
    setFileUrl(null);
    setUploadError(null);
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
    setError("Operation cancelled by user.");
  };

  const handleAnalysisSubmit = async () => {
    setUploadError(null);
    const hasFile = !!selectedFile;
    const hasText = !!contentInputs.script.trim() || !!contentInputs.description.trim();

    if (!hasFile && !hasText) {
        setError('Please provide a file or some content to analyze.');
        return;
    }
    
    if(!attemptGeneration()) return;
    
    cancelRequestRef.current = false;
    setIsLoading(true);
    setError(null);
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

      switch (analysisType) {
        case 'salesCall':
          if (!file) throw new Error("A file is required for Sales Call analysis.");
          result = await analyzeSalesCall(file);
          break;
        case 'socialMedia':
          result = await analyzeSocialMediaContent(contentInputs.script, contentInputs.description, file);
          break;
        case 'productAd':
          result = await analyzeProductAd(contentInputs.script, contentInputs.description, file);
          break;
        case 'videoAnalysis':
            if (!file) throw new Error("A video file is required for Video analysis.");
            result = await analyzeVideoContent(file);
            break;
        case 'liveStream':
            if (!file) throw new Error("A video file is required for Live Stream analysis.");
            result = await analyzeLiveStream(file);
            break;
        case 'documentAnalysis':
            if (!hasText) throw new Error("Text content is required for Document analysis.");
            result = await analyzeDocument(contentInputs.script, contentInputs.description);
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
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRetirementPlan = async (inputs: any) => {
    if (!attemptGeneration()) return;
    
    cancelRequestRef.current = false;
    setIsLoading(true);
    setError(null);
    setRetirementPlan(null);

    try {
        const plan = await generateRetirementPlan(inputs);
        if (cancelRequestRef.current) return;
        setRetirementPlan(plan);
        onSuccessfulGeneration();
    } catch (err: any) {
        if (cancelRequestRef.current) return;
        setError(err.message || 'An unexpected error occurred during plan generation.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateImprovedContent = async () => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingImproved(true);
    setError(null);
    try {
      const content = await generateImprovedContent(analysisResult, brandVoice);
      if (cancelRequestRef.current) return;
      setImprovedContent(content);
      onSuccessfulGeneration();
    } catch (err: any) {
      if (cancelRequestRef.current) return;
      setError(err.message || 'An unexpected error occurred during content generation.');
    } finally {
      setIsGeneratingImproved(false);
    }
  };
  
  const handleGenerateSocialPost = async () => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingSocialPost(true);
    setError(null);
    try {
        const post = await generateSocialPost(analysisResult);
        if (cancelRequestRef.current) return;
        setSocialPost(post);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        setError(err.message || 'An unexpected error occurred while generating the social post.');
    } finally {
        setIsGeneratingSocialPost(false);
    }
  };

  const handleGenerateProductAd = async () => {
    if (!analysisResult) return;
    if(!attemptGeneration()) return;
    
    cancelRequestRef.current = false;
    setIsGeneratingProductAd(true);
    setError(null);
    try {
        const ad = await generateProductAd(analysisResult);
        if (cancelRequestRef.current) return;
        setProductAd(ad);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        setError(err.message || 'An unexpected error occurred while generating the product ad.');
    } finally {
        setIsGeneratingProductAd(false);
    }
  };

  const handleGenerateKeyTakeaways = async () => {
    if (!analysisResult) return;
    if (!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingKeyTakeaways(true);
    setError(null);
    try {
        const takeaways = await generateKeyTakeaways(analysisResult);
        if (cancelRequestRef.current) return;
        setKeyTakeaways(takeaways);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        setError(err.message || 'An unexpected error occurred while generating key takeaways.');
    } finally {
        setIsGeneratingKeyTakeaways(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!analysisResult) return;
    if (!attemptGeneration()) return;

    cancelRequestRef.current = false;
    setIsGeneratingDescription(true);
    setError(null);
    try {
        const description = await generateDescription(analysisResult, brandVoice);
        if (cancelRequestRef.current) return;
        setGeneratedDescription(description);
        onSuccessfulGeneration();
    } catch(err: any) {
        if (cancelRequestRef.current) return;
        setError(err.message || 'An unexpected error occurred while generating the description.');
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
      setError(err.message || 'Failed to generate audio feedback.');
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
      setError(err.message || 'Failed to generate audio for the script.');
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
    setShowOnboarding(true);
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

  // MOCK: Load initial data for demo purposes
  useEffect(() => {
    if (isAuthenticated && isInitialLoad && analysisHistory.length === 0) {
      setAnalysisResult({
        transcript: MOCK_TRANSCRIPT,
        performanceMetrics: [
            { label: "Turn 1", scores: [{ metric: 'engagement', value: 6 }, { metric: 'clarity', value: 9 }, { metric: 'pacing', value: 7.5 }] },
            { label: "Turn 2", scores: [{ metric: 'engagement', value: 2.5 }, { metric: 'clarity', value: 8.5 }, { metric: 'pacing', value: 8 }] },
            { label: "Turn 3", scores: [{ metric: 'engagement', value: 8.5 }, { metric: 'clarity', value: 9.5 }, { metric: 'pacing', value: 7 }] },
            { label: "Turn 4", scores: [{ metric: 'engagement', value: 9 }, { metric: 'clarity', value: 8 }, { metric: 'pacing', value: 8.5 }] },
            { label: "Turn 5", scores: [{ metric: 'engagement', value: 9.5 }, { metric: 'clarity', value: 9.5 }, { metric: 'pacing', value: 7.5 }] }
        ],
        feedbackCard: {
          strengths: ["Effectively overcame initial objections by pivoting to a relevant pain point (project visibility).", "Used a powerful data point (30% delay reduction) to build value.", "Maintained a confident and positive tone throughout the call."],
          opportunities: ["Could have tried to discover more about the client's current system and its specific shortcomings earlier.", "The closing could be slightly stronger by confirming the value proposition one last time."]
        }
      });
      setAnalysisType('salesCall');
      setIsInitialLoad(false);
    } else {
        setIsInitialLoad(false);
    }
  }, [isInitialLoad, analysisHistory, isAuthenticated]);

  const handleOnboardingFinish = () => {
    setHasCompletedTour(true);
    setShowOnboarding(false);
  };
  
  const renderContent = () => {
    if (!isAuthenticated) {
        return <AuthView onLogin={handleLogin} onSignup={handleSignup} />;
    }
    if (!currentUser?.activated) {
        return <ActivationView user={currentUser} onActivationSuccess={handleActivation} />;
    }
    
    const analysisInputView = () => {
        const fileUploadTypes: AnalysisType[] = ['salesCall', 'videoAnalysis', 'liveStream'];
        const contentInputTypes: AnalysisType[] = ['socialMedia', 'productAd', 'documentAnalysis'];

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
                        error={uploadError}
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
                     />
                 </div>
            );
        }
        return null;
    };
    
    if (analysisType === 'contentGeneration') {
      return <div id="analysis-input-area"><GenerationView brandVoice={brandVoice} onAttemptGenerate={attemptGeneration} onSuccessfulGeneration={onSuccessfulGeneration} initialScript={initialGenerationScript} onScriptConsumed={() => setInitialGenerationScript(null)} /></div>;
    }
    if (analysisType === 'brandVoice') {
      return <div id="analysis-input-area" className="max-w-lg mx-auto"><BrandVoiceSetup currentVoice={brandVoice} onSave={setBrandVoice} /></div>;
    }
    if (analysisType === 'pricing') {
      return <div id="analysis-input-area"><PricingView currentPlan={currentUser!.plan} onApplyPromoCode={(code) => console.log(code)} /></div>;
    }
     if (analysisType === 'retirementPlanner') {
      return <div id="analysis-input-area" className="max-w-7xl mx-auto"><RetirementPlanner onGenerate={handleGenerateRetirementPlan} isLoading={isLoading} error={error} plan={retirementPlan} onCancel={handleCancel} /></div>;
    }

    return (
      <>
        {error ? (
          <div className="text-center p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>
        ) : analysisResult ? (
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
          />
        ) : (
          analysisInputView()
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
        {isLoading && (
            <Overlay>
                <Loader message="Analyzing your content..." onCancel={handleCancel} />
            </Overlay>
        )}
        {overlayContent && <Overlay>{overlayContent}</Overlay>}
        {isAuthenticated && showOnboarding && (
            <OnboardingTour steps={ONBOARDING_STEPS} onFinish={handleOnboardingFinish} />
        )}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <LogoIcon className="h-8 w-8 text-indigo-500" />
                        <span className="ml-3 text-xl font-bold">Amplify AI</span>
                    </div>
                    {isAuthenticated && currentUser && (
                         <div id="user-menu-area" className="flex items-center space-x-4">
                            <span className="text-sm font-medium hidden sm:inline">
                                Welcome, {currentUser.name || currentUser.email.split('@')[0]}!
                            </span>
                             <button
                                onClick={() => setIsHistoryOpen(true)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                aria-label="View history"
                            >
                                <HistoryIcon className="h-6 w-6" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                aria-label="Logout"
                            >
                                <LogoutIcon className="h-6 w-6" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             {isAuthenticated && <AnalysisTypeSelector selectedType={analysisType} onTypeChange={handleTypeChange} />}
            {renderContent()}
        </main>
        
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
