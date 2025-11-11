

import type { TranscriptEntry } from './types';

// FIX: Added startTime and endTime to each entry to match the TranscriptEntry type.
export const MOCK_TRANSCRIPT: TranscriptEntry[] = [
  { speaker: 'A', text: "Hi, thanks for taking my call. I'm following up on the email I sent last week about our new project management tool, Synchro.", startTime: 0, endTime: 5 },
  { speaker: 'B', text: "Oh, right. I remember seeing that. To be honest, we're pretty happy with our current system. I'm not sure we're looking to make a change right now.", startTime: 5, endTime: 11 },
  { speaker: 'A', text: "I completely understand. A lot of our happiest customers said the exact same thing before they saw how Synchro could solve problems they didn't even realize were slowing them down. For example, do you ever have issues with cross-departmental project visibility?", startTime: 11, endTime: 20 },
  { speaker: 'B', text: "Yeah, that's a constant headache. Marketing never knows what Engineering is prioritizing, and it causes delays.", startTime: 20, endTime: 24 },
  { speaker: 'A', text: "That's a very common challenge. Synchro provides a unified dashboard that gives everyone a real-time view of project progress. It's helped companies like yours cut down project delays by up to 30%. Would a brief 15-minute demo next Tuesday be out of the question to show you how it works?", startTime: 24, endTime: 36 },
  { speaker: 'B', text: "Hmm, 30% is a significant number. I suppose I could find 15 minutes. How about 10 AM?", startTime: 36, endTime: 40 },
  { speaker: 'A', text: "10 AM on Tuesday works perfectly. I'll send over a calendar invite shortly. You won't be disappointed. I look forward to speaking then!", startTime: 40, endTime: 46 },
  { speaker: 'B', text: "Sounds good. Talk to you then.", startTime: 46, endTime: 48 }
];