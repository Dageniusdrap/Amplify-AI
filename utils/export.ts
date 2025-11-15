import type { AnalysisResult, TranscriptEntry, ViralScript } from '../types';

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

const formatKey = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

const renderAnalysisSection = (title: string, data: any): string => {
    if (!data) return '';
    let section = `--- ${title.toUpperCase()} ---\n\n`;
    for (const [key, value] of Object.entries(data)) {
        if (key === 'speakerARole' || key === 'speakerBRole') continue; // Skip helper props
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
             section += `${formatKey(key)}:\n`;
             for(const [subKey, subValue] of Object.entries(value as object)) {
                  section += `  - ${formatKey(subKey)}: ${JSON.stringify(subValue)}\n`;
             }
        } else if (Array.isArray(value)) {
            section += `${formatKey(key)}:\n`;
            value.forEach(p => section += `- ${p}\n`);
        } else if (value) {
            section += `${formatKey(key)}: ${value}\n`;
        }
    }
    return section + '\n';
};


export const exportAnalysisAsTxt = (analysis: AnalysisResult, getSpeakerName: (speaker: string) => string): string => {
    let report = 'CREATORS EDGE AI - ANALYSIS REPORT\n';
    report += '=====================================\n\n';

    // Summary/Coaching Card
    report += '--- EXECUTIVE SUMMARY & COACHING ---\n';
    if(analysis.salesCallAnalysis?.summary) {
        report += `Summary: ${analysis.salesCallAnalysis.summary}\n\n`;
    } else if (analysis.documentAnalysis?.summary) {
        report += `Summary: ${analysis.documentAnalysis.summary}\n\n`;
    }
    report += 'Strengths:\n';
    analysis.feedbackCard.strengths.forEach(s => report += `- ${s}\n`);
    report += '\nOpportunities for Improvement:\n';
    analysis.feedbackCard.opportunities.forEach(o => report += `- ${o}\n`);
    report += '\n';

    // Detailed Analysis Sections
    report += renderAnalysisSection('Sales Call Analysis', analysis.salesCallAnalysis);
    report += renderAnalysisSection('Video Analysis', analysis.videoAnalysis);
    report += renderAnalysisSection('Social Media Analysis', analysis.socialMediaAnalysis);
    report += renderAnalysisSection('Product Ad Analysis', analysis.adAnalysis);
    report += renderAnalysisSection('Document Analysis', analysis.documentAnalysis);
    report += renderAnalysisSection('Financial Report Analysis', analysis.financialReportAnalysis);
    
    // Transcript
    if (analysis.transcript && analysis.transcript.length > 0) {
        report += '--- CONTENT TRANSCRIPT ---\n\n';
        analysis.transcript.forEach(entry => {
            const speakerName = getSpeakerName(entry.speaker);
            const time = (typeof entry.startTime === 'number') ? `[${new Date(entry.startTime * 1000).toISOString().substr(14, 5)}] ` : '';
            report += `${time}${speakerName}: ${entry.text}\n\n`;
        });
    }

    return report;
}


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

export const exportCoachingAsTxt = (analysis: AnalysisResult): string => {
    if (!analysis.videoAnalysis?.suggestedImprovements) return "No coaching suggestions available.";
    
    let content = 'AI COACHING SUGGESTIONS\n';
    content += '=========================\n\n';
    
    content += '### KEY IMPROVEMENTS ###\n';
    analysis.videoAnalysis.suggestedImprovements.forEach(item => {
        content += `- ${item}\n`;
    });
    content += '\n';

    const { ctaEffectiveness, technicalQuality } = analysis.videoAnalysis;

    if (ctaEffectiveness) {
        content += `### CALL-TO-ACTION FEEDBACK ###\n`;
        content += `Critique: ${ctaEffectiveness.critique}\n`;
        content += `Suggestion: "${ctaEffectiveness.suggestion}"\n\n`;
    }

    if (technicalQuality) {
        content += `### TECHNICAL QUALITY FEEDBACK ###\n`;
        content += `Lighting: ${technicalQuality.lighting}\n`;
        content += `Resolution: ${technicalQuality.resolutionClarity}\n`;
        content += `Color Grading: ${technicalQuality.colorGrading}\n\n`;
    }
    
    return content;
};

export const exportViralityAsTxt = (analysis: AnalysisResult): string => {
    if (!analysis.videoAnalysis) return "No virality analysis available.";
    const { thumbnailSuggestion, hookQuality, keyViralMoment, viralitySuggestions } = analysis.videoAnalysis;
    
    let content = 'VIRALITY BLUEPRINT\n';
    content += '====================\n\n';
    
    if (hookQuality) {
        content += `--- HOOK ANALYSIS ---\nCritique: ${hookQuality.critique}\nSuggestion: "${hookQuality.suggestion}" (Score: ${hookQuality.score}/10)\n\n`;
    }
    if (thumbnailSuggestion) {
        content += `--- THUMBNAIL SUGGESTION ---\nCritique: ${thumbnailSuggestion.critique}\nSuggestion: "${thumbnailSuggestion.suggestion}" (Score: ${thumbnailSuggestion.score}/10)\n\n`;
    }
    if (keyViralMoment) {
        content += `--- KEY VIRAL MOMENT ---\n${keyViralMoment}\n\n`;
    }
    if (viralitySuggestions?.hooks) {
        content += `--- ALTERNATIVE HOOK IDEAS ---\n`;
        viralitySuggestions.hooks.forEach(hook => content += `- ${hook}\n`);
        content += `\n`;
    }

    return content;
};