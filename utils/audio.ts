/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns The decoded byte array.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a Uint8Array into a base64 string.
 * @param bytes The byte array to encode.
 * @returns The base64 encoded string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes raw PCM audio data into an AudioBuffer for playback.
 * The Gemini Live API returns raw PCM data, not a standard audio file format.
 * @param data The raw PCM data as a Uint8Array.
 * @param ctx The AudioContext to use for creating the buffer.
 * @param sampleRate The sample rate of the audio (e.g., 24000 for TTS).
 * @param numChannels The number of audio channels (e.g., 1 for mono).
 * @returns A promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Creates a WAV file Blob from raw PCM data.
 * @param pcmData The Int16Array of raw PCM samples.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of channels.
 * @returns A Blob containing WAV data.
 */
export const pcmToWavBlob = (pcmData: Int16Array, sampleRate: number, numChannels: number): Blob => {
  const format = 1; // PCM
  const bitDepth = 16;
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = pcmData.length * (bitDepth / 8);
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    view.setInt16(offset, pcmData[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
};

// Add a declaration for the lamejs global object
declare const lamejs: any;

/**
 * Creates an MP3 file Blob from raw PCM data using lamejs.
 * @param pcmData The Int16Array of raw PCM samples.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of channels.
 * @returns A Blob containing MP3 data.
 */
export const pcmToMp3Blob = (pcmData: Int16Array, sampleRate: number, numChannels: number): Blob => {
    if (typeof lamejs === 'undefined') {
        console.error('lamejs library not found. Please include it in your HTML to enable MP3 export.');
        // Fallback to WAV if lamejs is not available
        return pcmToWavBlob(pcmData, sampleRate, numChannels);
    }

    const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128); // 128 kbps
    const mp3Data: Int8Array[] = [];

    const bufferSize = 1152 * numChannels; // one frame
    for (let i = 0; i < pcmData.length; i += bufferSize) {
        const chunk = pcmData.subarray(i, i + bufferSize);
        const mp3buf = mp3encoder.encodeBuffer(chunk);
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }
    }
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
};
