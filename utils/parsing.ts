import type { ViralScript } from '../types';

export const parseViralScript = (markdownText: string): ViralScript => {
  const sections: { [key: string]: string[] } = {};
  const lines = markdownText.split('\n');
  let currentKey: keyof ViralScript | null = null;

  // More flexible keys to match potential AI outputs
  const keyMap: { [key: string]: keyof ViralScript } = {
    'title': 'titles',
    'seo description': 'description',
    'description': 'description',
    'discoverability tags': 'tags',
    'tags': 'tags',
    'thumbnail concepts': 'thumbnailConcepts',
    'thumbnail': 'thumbnailConcepts',
    'engaging video script': 'script',
    'video script': 'script',
    'script': 'script',
    'frame flow': 'storyboard',
    'storyboard': 'storyboard',
    'monetization strategy': 'monetization',
    'monetization': 'monetization',
  };
  
  lines.forEach(line => {
    const match = line.match(/^#+\s*(?:\d+\.\s*)?(.+)/); // Match any header level (#, ##, ###) with optional numbering
    if (match) {
      const header = match[1].toLowerCase().trim().replace(/:$/, ''); // Normalize header
      
      // Find the best matching key
      const mappedKey = Object.entries(keyMap).find(([k]) => header.includes(k))?.[1];
      
      if (mappedKey) {
        currentKey = mappedKey;
        if (!sections[currentKey]) {
            sections[currentKey] = [];
        }
      } else {
        currentKey = null; // Unrecognized header, stop capturing until the next valid one
      }
    } else if (currentKey && line.trim()) { // Only push non-empty lines
      sections[currentKey]?.push(line);
    }
  });

  const getList = (key: keyof ViralScript): string[] => (sections[key] || []).map(s => s.replace(/^[-*]\s*/, '').trim()).filter(Boolean);
  const getText = (key: keyof ViralScript): string => (sections[key] || []).join('\n').trim();

  return {
    titles: getList('titles'),
    description: getText('description'),
    tags: getText('tags').split(/[,;\n]/).map(t => t.trim()).filter(Boolean),
    thumbnailConcepts: getList('thumbnailConcepts'),
    script: getText('script'),
    storyboard: getText('storyboard'),
    monetization: getText('monetization'),
  };
};