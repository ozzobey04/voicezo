import type { VoicePreset } from '../voicePresets'

export interface VoiceFXResult {
  buildChain: (rawStream: MediaStream, preset?: VoicePreset) => Promise<{ processedStream: MediaStream; cleanup: () => void }>
}
