export type VoicePresetId = 'normal' | 'kadin' | 'erkek' | 'cocuk' | 'derin' | 'robot'

export interface VoicePreset {
  id:       VoicePresetId
  label:    string
  emoji:    string
  elVoiceId: string | null   // ElevenLabs voice ID — null = raw/pitch only
  pitch:    number            // fallback pitch multiplier (no API key)
  robot:    boolean
  ringFreq: number
}

// ElevenLabs built-in voice IDs
export const VOICE_PRESETS: VoicePreset[] = [
  { id: 'normal', label: 'Normal',  emoji: '🎙',  elVoiceId: null,                     pitch: 1.0,  robot: false, ringFreq: 0  },
  { id: 'kadin',  label: 'Kadın',   emoji: '👩',  elVoiceId: '21m00Tcm4TlvDq8ikWAM',   pitch: 1.55, robot: false, ringFreq: 0  }, // Rachel
  { id: 'erkek',  label: 'Erkek',   emoji: '👨',  elVoiceId: 'pNInz6obpgDQGcFmaJgB',   pitch: 0.72, robot: false, ringFreq: 0  }, // Adam
  { id: 'cocuk',  label: 'Çocuk',   emoji: '🧒',  elVoiceId: 'AZnzlk1XvdvUeBnXmlld',   pitch: 1.85, robot: false, ringFreq: 0  }, // Domi
  { id: 'derin',  label: 'Derin',   emoji: '🌑',  elVoiceId: 'VR6AewLTigWG4xSOukaG',   pitch: 0.58, robot: false, ringFreq: 0  }, // Arnold
  { id: 'robot',  label: 'Robot',   emoji: '🤖',  elVoiceId: null,                     pitch: 1.0,  robot: true,  ringFreq: 80 },
]
