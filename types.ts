export interface ScriptSegment {
  id: string;
  speaker: string;
  text: string;
  audioUrl?: string;
  duration?: number; // in seconds
  isGenerating?: boolean;
}

export interface VoiceConfig {
  voiceName: string; // Prebuilt name (Puck, Kore, etc.)
  pitch: number; // 0.5 to 2.0 (multiplier)
  speed: number; // 0.5 to 2.0 (multiplier)
  volume: number; // 0 to 1.0
  isCloned?: boolean;
  cloneSampleName?: string; // Just for UI display
}

export interface SpeakerMap {
  [speakerName: string]: VoiceConfig;
}

export interface ClonedVoice {
  id: string;
  name: string;
  baseVoice: string; // The real underlying model used
  createdAt: number;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
