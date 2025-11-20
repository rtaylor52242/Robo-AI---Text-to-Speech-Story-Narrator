
export const audioBufferToBlob = (buffer: AudioBuffer): Blob => {
  return encodeWAV(buffer);
};

export const rawPcmToAudioBuffer = (
  pcmData: ArrayBuffer,
  audioCtx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  const int16Array = new Int16Array(pcmData);
  const audioBuffer = audioCtx.createBuffer(1, int16Array.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < int16Array.length; i++) {
    // Convert Int16 to Float32
    channelData[i] = int16Array[i] / 32768.0;
  }

  return audioBuffer;
};

const encodeWAV = (samples: AudioBuffer) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + samples.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true); 
  /* sample rate */
  view.setUint32(24, samples.sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, samples.sampleRate * 2, true); 
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, samples.length * 2, true);

  const data = new Float32Array(samples.length);
  samples.copyFromChannel(data, 0); 
  
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    let s = Math.max(-1, Math.min(1, data[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, s, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

export const mergeAudioBuffers = (
  ctx: AudioContext,
  buffers: AudioBuffer[],
  gaps: number = 0.5
): AudioBuffer => {
  if (buffers.length === 0) {
      return ctx.createBuffer(1, 0, 24000);
  }
  const totalDuration = buffers.reduce((acc, b) => acc + b.duration + gaps, 0);
  const outputInfo = buffers[0]; 
  const outputBuffer = ctx.createBuffer(
    outputInfo.numberOfChannels,
    Math.ceil(totalDuration * outputInfo.sampleRate),
    outputInfo.sampleRate
  );

  let offset = 0;
  for (const buf of buffers) {
    for (let channel = 0; channel < outputInfo.numberOfChannels; channel++) {
      const outputData = outputBuffer.getChannelData(channel);
      const inputData = buf.getChannelData(channel);
      outputData.set(inputData, offset);
    }
    offset += Math.floor(buf.length + (gaps * outputInfo.sampleRate));
  }
  return outputBuffer;
};
