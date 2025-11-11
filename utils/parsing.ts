import type { ViralScript } from '../types';

export const parseViralScript = (markdownText: string): ViralScript => {
  const sections: { [key: string]: string } = {};
  const lines = markdownText.split('\n');
  let currentKey = '';
  let currentContent: string[] = [];

  const keyMap: { [key: string]: keyof ViralScript } = {
    'title options': 'titles',
    'description': 'description',
    'tags': 'tags',
    'thumbnail concepts': 'thumbnailConcepts',
    'script': 'script',
    'storyboard': 'storyboard',
    'monetization': 'monetization',
  };

  const finalizeSection = () => {
    if (currentKey) {
      sections[currentKey] = currentContent.join('\n').trim();
    }
  };

  for (const line of lines) {
    const match = line.match(/^##\s*(?:\d+\.\s*)?(.+)/);
    if (match) {
      finalizeSection();
      const header = match[1].toLowerCase();
      currentKey = Object.keys(keyMap).find(k => header.includes(k)) || '';
      currentContent = [match[1]]; // Keep the header in the content
    } else {
      currentContent.push(line);
    }
  }
  finalizeSection();
  
  return {
    titles: (sections[keyMap['title options']] || '').split('\n').slice(1).filter(t => t.trim().length > 2),
    description: (sections[keyMap['description']] || '').split('\n').slice(1).join('\n'),
    tags: (sections[keyMap['tags']] || '').split('\n').slice(1).join('').split(',').map(t => t.trim()).filter(Boolean),
    thumbnailConcepts: (sections[keyMap['thumbnail concepts']] || '').split('\n').slice(1).filter(t => t.trim().length > 2),
    script: (sections[keyMap['script']] || '').split('\n').slice(1).join('\n'),
    storyboard: (sections[keyMap['storyboard']] || '').split('\n').slice(1).join('\n'),
    monetization: (sections[keyMap['monetization']] || '').split('\n').slice(1).join('\n'),
  };
};
