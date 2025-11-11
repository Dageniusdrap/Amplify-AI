import React, { useState, useEffect, useMemo } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { PaletteIcon } from './icons/PaletteIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { InfoIcon } from './icons/InfoIcon';

interface BrandVoiceSetupProps {
  currentVoice: string;
  onSave: (voice: string) => void;
}

const PRESETS = [
    { name: 'Professional', tone: 'Clear, concise, authoritative, data-driven, trustworthy', audience: 'Business professionals, executives, industry experts', example: 'Our data-driven analysis indicates a 15% increase in market penetration year-over-year.' },
    { name: 'Witty & Engaging', tone: 'Playful, witty, engaging, humorous, clever', audience: 'Millennials, general consumers on social media', example: 'You thought your last phone was smart? This one went to grad school.' },
    { name: 'Inspirational', tone: 'Uplifting, motivational, positive, storytelling-focused', audience: 'Individuals seeking personal growth, creative professionals', example: 'Every challenge is just a new chapter waiting to be written. What will your story be?' },
    { name: 'Casual & Friendly', tone: 'Approachable, friendly, conversational, simple language', audience: 'General audience, customers seeking support or simple guides', example: 'Hey there! Just wanted to show you a quick trick to get this sorted in no time.' },
];

// Simple parser for the structured voice prompt
const parseVoice = (voiceString: string) => {
    const toneMatch = voiceString.match(/Tone and Style: (.*?)\. Target Audience:/);
    const audienceMatch = voiceString.match(/Target Audience: (.*?)\. Example:/);
    const exampleMatch = voiceString.match(/Example: "(.*?)"/);

    if (toneMatch && audienceMatch && exampleMatch) {
        return {
            tone: toneMatch[1],
            audience: audienceMatch[1],
            example: exampleMatch[1],
        };
    }
    // If it doesn't match, return the whole string as the tone
    return { tone: voiceString, audience: '', example: '' };
};

export const BrandVoiceSetup: React.FC<BrandVoiceSetupProps> = ({ currentVoice, onSave }) => {
  const [tone, setTone] = useState('');
  const [audience, setAudience] = useState('');
  const [example, setExample] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const { tone, audience, example } = parseVoice(currentVoice);
    setTone(tone);
    setAudience(audience);
    setExample(example);
  }, [currentVoice]);

  const constructedVoice = useMemo(() => {
    const parts = [];
    if (tone.trim()) parts.push(`Tone and Style: ${tone.trim()}.`);
    if (audience.trim()) parts.push(`Target Audience: ${audience.trim()}.`);
    if (example.trim()) parts.push(`Example: "${example.trim()}"`);
    return parts.join(' ');
  }, [tone, audience, example]);

  const handleSave = () => {
    onSave(constructedVoice);
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
    }, 2000);
  };
  
  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setTone(preset.tone);
    setAudience(preset.audience);
    setExample(preset.example);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      <div className="text-center">
        <PaletteIcon className="h-12 w-12 mx-auto text-indigo-500 mb-2" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Define Your Brand Voice</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Guide the AI by defining your content's tone, audience, and style. This voice will keep all generated content consistent and on-brand.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Start with a Preset</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
                <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset)}
                    className="p-3 text-center text-sm font-medium bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors border border-gray-200 dark:border-gray-700"
                >
                    {preset.name}
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
            <div className="flex items-center space-x-2 mb-1">
                <label htmlFor="brand-tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tone & Style Keywords
                </label>
                <div className="group relative">
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Comma-separated keywords defining the personality. e.g., "Playful, witty, humorous".
                    </div>
                </div>
            </div>
            <input
                id="brand-tone"
                type="text"
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                placeholder="e.g., Witty, engaging, humorous"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
            />
        </div>
        <div>
           <div className="flex items-center space-x-2 mb-1">
                <label htmlFor="brand-audience" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target Audience
                </label>
                <div className="group relative">
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Describe who the AI is talking to. e.g., "Tech-savvy millennials", "C-level executives".
                    </div>
                </div>
            </div>
            <input
                id="brand-audience"
                type="text"
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                placeholder="e.g., Tech-savvy millennials, C-level executives"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
            />
        </div>
        <div>
             <div className="flex items-center space-x-2 mb-1">
                <label htmlFor="brand-example" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Example of your brand voice
                </label>
                <div className="group relative">
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Provide a short sentence the AI should emulate. This is the most powerful way to guide the AI.
                    </div>
                </div>
            </div>
            <textarea
                id="brand-example"
                rows={3}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                placeholder="e.g., 'You thought your last phone was smart? This one went to grad school.'"
                value={example}
                onChange={(e) => setExample(e.target.value)}
            />
        </div>
      </div>
       
        <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 rounded-r-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                    <LightbulbIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Pro Tip</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Be specific! Instead of "friendly," try "like a helpful and patient older sibling." The more detailed you are, the better the AI will be at matching your style.</p>
                </div>
            </div>
        </div>
      
       <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-r-lg text-blue-800 dark:text-blue-200">
            <p className="text-sm font-semibold">AI Prompt Preview:</p>
            <p className="text-xs italic mt-1">{constructedVoice || "Your generated prompt will appear here..."}</p>
        </div>

      <button
        onClick={handleSave}
        disabled={!constructedVoice.trim()}
        className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-indigo-300 dark:disabled:bg-indigo-800"
      >
        {isSaved ? <CheckIcon className="h-5 w-5 mr-2" /> : null}
        {isSaved ? 'Brand Voice Saved!' : 'Save Brand Voice'}
      </button>
    </div>
  );
};