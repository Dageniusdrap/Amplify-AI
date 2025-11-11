import type { TranscriptEntry, ViralScript } from '../types';

const formatSrtTime = (seconds: number): string => {
  if (isNaN(seconds)) return '00:00:00,000';
  const date = new Date(0);
  date.setSeconds(seconds);
  const time = date.toISOString().substr(11, 12);
  return time.replace('.', ',');
};

export const exportTranscriptAsSrt = (transcript: TranscriptEntry[]): string => {
  return transcript
    .map((entry, index) => {
      const startTime = entry.startTime ?? 0;
      const endTime = entry.endTime ?? (entry.startTime ?? 0) + 2; // Default to 2 seconds if no end time
      return `${index + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${entry.text}`;
    })
    .join('\n\n');
};

export const exportScriptAsSrt = (script: string, durationInSeconds: number): string => {
  const lines = script.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return '';
  
  const timePerLine = durationInSeconds / lines.length;
  
  return lines
    .map((line, index) => {
      const startTime = index * timePerLine;
      const endTime = (index + 1) * timePerLine;
      return `${index + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${line}`;
    })
    .join('\n\n');
};

export const exportBlueprintAsTxt = (scriptData: ViralScript): string => {
  let content = `YOUTUBE VIDEO BLUEPRINT\n`;
  content += `=========================\n\n`;

  if (scriptData.titles?.length > 0) {
    content += `## CLICKABLE TITLES ##\n`;
    scriptData.titles.forEach(t => content += `- ${t}\n`);
    content += `\n`;
  }

  if (scriptData.description) {
    content += `## SEO DESCRIPTION ##\n${scriptData.description}\n\n`;
  }

  if (scriptData.tags?.length > 0) {
    content += `## DISCOVERABILITY TAGS ##\n${scriptData.tags.join(', ')}\n\n`;
  }

  if (scriptData.thumbnailConcepts?.length > 0) {
    content += `## THUMBNAIL CONCEPTS ##\n`;
    scriptData.thumbnailConcepts.forEach(t => content += `- ${t}\n`);
    content += `\n`;
  }

  if (scriptData.script) {
    content += `## ENGAGING VIDEO SCRIPT ##\n${scriptData.script}\n\n`;
  }
  
  if (scriptData.storyboard) {
    content += `## FRAME FLOW / STORYBOARD ##\n${scriptData.storyboard}\n\n`;
  }
  
  if (scriptData.monetization) {
    content += `## MONETIZATION STRATEGY ##\n${scriptData.monetization}\n\n`;
  }

  return content;
};