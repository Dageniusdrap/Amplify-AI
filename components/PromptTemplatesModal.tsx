import React from 'react';
import { XIcon } from './icons/XIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface PromptTemplatesModalProps {
    onClose: () => void;
    onSelect: (template: string) => void;
}

const TEMPLATES = {
    "Video Generation": [
        { name: 'Cinematic Drone Shot', template: 'An epic, cinematic 4K drone shot of [Location or Subject], sweeping over the landscape, golden hour lighting, hyper-realistic, professional color grade.' },
        { name: 'Hyper-realistic Slow Motion', template: 'A hyper-realistic, ultra slow-motion video of [Action, e.g., a drop of water hitting a surface], macro lens, studio lighting, dramatic and detailed.' },
        { name: 'Claymation Animation', template: 'A charming claymation-style animation of a [Character] doing [Activity]. The scene should be whimsical and full of handmade detail.' },
        { name: 'Documentary Style Clip', template: 'A documentary style video of [Subject], natural lighting, handheld camera feel, intimate and authentic.' },
    ],
    "Video Scripts": [
        { name: 'YouTube Explainer', template: 'Create a YouTube script for a 5-minute explainer video about [Topic]. Start with a strong hook, use simple analogies, cover 3 key points, and end with a call to action to subscribe.' },
        { name: 'TikTok/Shorts Idea', template: 'Generate 3 ideas for a viral TikTok/Reel about [Product or Topic]. For each idea, provide a hook, visual concept, and trending audio suggestion.' },
        { name: 'Product Review', template: 'Write a script reviewing [Product Name]. Cover unboxing, key features (list 3-5), performance, pros and cons, and a final verdict for [Target Audience].' },
        { name: 'UGC Style Ad', template: 'Write a user-generated content (UGC) style script for [Product/Service]. The tone should be authentic and relatable, starting with "I was skeptical at first, but..."' },
    ],
    "Image Prompts": [
        { name: 'Cinematic Photo', template: 'A cinematic, photorealistic shot of [Subject], golden hour lighting, shallow depth of field, captured with a 35mm lens, 8k, hyper-detailed.' },
        { name: 'Fantasy Art', template: 'Digital fantasy art of a [Character/Creature] in an enchanted forest, glowing mushrooms, volumetric lighting, epic and detailed, style of ArtStation.' },
        { name: '3D Character', template: 'A 3D rendered character of a [Character Description], Pixar style, expressive, smiling, on a simple background.' },
        { name: 'Logo Concept', template: 'Minimalist logo design for a company named "[Company Name]" in the [Industry] industry. The logo should be a clean, vector icon that represents [Core Concept].' },
    ],
    "Social Media": [
        { name: 'Twitter Thread', template: 'Write a 5-tweet thread about [Topic]. The first tweet should be a strong hook, and the last tweet should have a call to action.' },
        { name: 'LinkedIn Post', template: 'Draft a LinkedIn post about a recent achievement: [Describe achievement]. Structure it with a hook, a short story, a key takeaway, and 3 relevant hashtags.' },
        { name: 'Instagram Caption', template: 'Write an engaging Instagram caption for a photo of [Photo Description]. Ask a question to encourage comments and include 5 relevant hashtags.' },
    ],
    "Audio & Speech": [
        { name: 'Podcast Intro', template: 'Write a 30-second intro script for a podcast called "[Podcast Name]" about [Topic]. The tone should be [e.g., energetic and exciting].' },
        { name: 'Ad Read', template: 'Create a 60-second mid-roll ad read script for [Product/Service]. Highlight the main problem it solves and offer a special discount code for listeners.' },
    ]
};

export const PromptTemplatesModal: React.FC<PromptTemplatesModalProps> = ({ onClose, onSelect }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                        <LightbulbIcon className="h-6 w-6 mr-2 text-yellow-500" />
                        Prompt Templates
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">
                    {Object.entries(TEMPLATES).map(([category, templates]) => (
                        <div key={category}>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{category}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {templates.map(template => (
                                    <button
                                        key={template.name}
                                        onClick={() => onSelect(template.template)}
                                        className="p-4 text-left bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 transition-all"
                                    >
                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{template.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate">"{template.template}"</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};