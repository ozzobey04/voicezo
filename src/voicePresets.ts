export type VoicePresetId =
  | 'normal'
  | 'rachel' | 'bella' | 'elli' | 'dorothy' | 'charlotte'
  | 'adam' | 'derin'
  | 'cocuk'

export interface VoicePreset {
  id:        VoicePresetId
  label:     string
  emoji:     string
  desc:      string
  category:  'female' | 'male' | 'special'
  color:     string
  elVoiceId: string | null
  pitch:     number
  robot:     boolean
  ringFreq:  number
}

export const VOICE_PRESETS: VoicePreset[] = [
  // ── KADIN SESLERİ ──────────────────────────────────────────────────
  {
    id: 'rachel', label: 'Rachel', emoji: '👩', desc: 'Sakin & profesyonel',
    category: 'female', color: '#e879f9',
    elVoiceId: '21m00Tcm4TlvDq8ikWAM', pitch: 1.55, robot: false, ringFreq: 0,
  },
  {
    id: 'bella', label: 'Bella', emoji: '🌸', desc: 'Yumuşak & genç',
    category: 'female', color: '#f472b6',
    elVoiceId: 'EXAVITQu4vr4xnSDxMaL', pitch: 1.6, robot: false, ringFreq: 0,
  },
  {
    id: 'elli', label: 'Elli', emoji: '✨', desc: 'Parlak & duygusal',
    category: 'female', color: '#fb923c',
    elVoiceId: 'MF3mGyEYCl7XYWbV9V6O', pitch: 1.7, robot: false, ringFreq: 0,
  },
  {
    id: 'dorothy', label: 'Dorothy', emoji: '🌷', desc: 'Sıcak & olgun',
    category: 'female', color: '#f59e0b',
    elVoiceId: 'ThT5KcBeYPX3keUQqHPh', pitch: 1.45, robot: false, ringFreq: 0,
  },
  {
    id: 'charlotte', label: 'Charlotte', emoji: '👑', desc: 'İngiliz & güçlü',
    category: 'female', color: '#a78bfa',
    elVoiceId: 'XB0fDUnXU5powFXDhCwa', pitch: 1.5, robot: false, ringFreq: 0,
  },
  // ── ERKEK SESLERİ ──────────────────────────────────────────────────
  {
    id: 'adam', label: 'Adam', emoji: '👨', desc: 'Klasik & derin',
    category: 'male', color: '#38bdf8',
    elVoiceId: 'pNInz6obpgDQGcFmaJgB', pitch: 0.72, robot: false, ringFreq: 0,
  },
  {
    id: 'derin', label: 'Derin', emoji: '🌑', desc: 'Bas & güçlü',
    category: 'male', color: '#475569',
    elVoiceId: 'VR6AewLTigWG4xSOukaG', pitch: 0.58, robot: false, ringFreq: 0,
  },
  // ── ÖZEL ──────────────────────────────────────────────────────────
  {
    id: 'cocuk', label: 'Çocuk', emoji: '🧒', desc: 'Tiz & eğlenceli',
    category: 'special', color: '#4ade80',
    elVoiceId: 'AZnzlk1XvdvUeBnXmlld', pitch: 1.85, robot: false, ringFreq: 0,
  },
  {
    id: 'normal', label: 'Ham Ses', emoji: '🎙', desc: 'Dönüşüm yok',
    category: 'special', color: '#64748b',
    elVoiceId: null, pitch: 1.0, robot: false, ringFreq: 0,
  },
]
