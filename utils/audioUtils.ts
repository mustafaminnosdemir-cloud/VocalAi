
// Decodes a base64 string into a Uint8Array.
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Converts a raw PCM Uint8Array into a playable AudioBuffer.
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
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


// Encodes an AudioBuffer into a WAV file (as a Blob).
export function bufferToWave(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels,
    len = buffer.length * numOfChan * 2,
    totalLen = len + 44,
    wavBuffer = new ArrayBuffer(totalLen),
    view = new DataView(wavBuffer),
    channels = [],
    sampleRate = buffer.sampleRate;

  let offset = 0,
    pos = 0;

  // Helper function to write strings
  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(view, offset, 'RIFF');
  offset += 4;
  view.setUint32(offset, totalLen - 8, true);
  offset += 4;
  writeString(view, offset, 'WAVE');
  offset += 4;

  // FMT sub-chunk
  writeString(view, offset, 'fmt ');
  offset += 4;
  view.setUint32(offset, 16, true);
  offset += 4; // Subchunk1Size
  view.setUint16(offset, 1, true);
  offset += 2; // AudioFormat
  view.setUint16(offset, numOfChan, true);
  offset += 2; // NumChannels
  view.setUint32(offset, sampleRate, true);
  offset += 4; // SampleRate
  view.setUint32(offset, sampleRate * 2 * numOfChan, true);
  offset += 4; // ByteRate
  view.setUint16(offset, numOfChan * 2, true);
  offset += 2; // BlockAlign
  view.setUint16(offset, 16, true);
  offset += 2; // BitsPerSample

  // Data sub-chunk
  writeString(view, offset, 'data');
  offset += 4;
  view.setUint32(offset, len, true);
  offset += 4;

  // Write the PCM data
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < len) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos / (2 * numOfChan)]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos += 2 * numOfChan;
  }

  return new Blob([view], { type: 'audio/wav' });
}
