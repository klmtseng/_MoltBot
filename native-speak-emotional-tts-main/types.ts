export interface VoiceOption {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
  voiceURI: string;
}

export interface TTSSettings {
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentWord: string;
  charIndex: number;
}
