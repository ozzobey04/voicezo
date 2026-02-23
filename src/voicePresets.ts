export type VoicePresetId =
  | 'normal'
  | 'rachel' | 'bella' | 'elli' | 'dorothy' | 'charlotte'
  | 'adam' | 'derin'
  | 'cocuk'

export interface VoicePresetSettings {
  stability:   number
  similarity:  number
  style:       number
}

export interface VoicePreset {
  id:            VoicePresetId
  label:         string
  emoji:         string
  desc:          string
  category:      'female' | 'male' | 'special'
  color:         string
  elVoiceId:     string | null
  voiceSettings: VoicePresetSettings | null
  pitch:         number
  robot:         boolean
  ringFreq:      number
}

export const VOICE_PRESETS: VoicePreset[] = [
  // ── KADIN SESLERİ ─────────────────────────────────────────────────────────
  // WAV formatıyla gönderilince Türkçe korunuyor.
  // similarity 0.75-0.80 → artifact azaltır; style 0.25-0.35 → doğal ifade
  {
    id: 'rachel', label: 'Rachel', emoji: '👩', desc: 'Sakin & profesyonel',
    category: 'female', color: '#e879f9',
    elVoiceId: '21m00Tcm4TlvDq8ikWAM',
    voiceSettings: { stability: 0.45, similarity: 0.78, style: 0.25 },
    pitch: 1.55, robot: false, ringFreq: 0,
  },
  {
    id: 'bella', label: 'Bella', emoji: '🌸', desc: 'Yumuşak & genç',
    category: 'female', color: '#f472b6',
    elVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    voiceSettings: { stability: 0.42, similarity: 0.75, style: 0.22 },
    pitch: 1.6, robot: false, ringFreq: 0,
  },
  {
    id: 'elli', label: 'Elli', emoji: '✨', desc: 'Canlı & duygusal',
    category: 'female', color: '#fb923c',
    elVoiceId: 'MF3mGyEYCl7XYWbV9V6O',
    voiceSettings: { stability: 0.38, similarity: 0.73, style: 0.35 },
    pitch: 1.7, robot: false, ringFreq: 0,
  },
  {
    id: 'dorothy', label: 'Dorothy', emoji: '🌷', desc: 'Sıcak & olgun',
    category: 'female', color: '#f59e0b',
    elVoiceId: 'ThT5KcBeYPX3keUQqHPh',
    voiceSettings: { stability: 0.50, similarity: 0.78, style: 0.18 },
    pitch: 1.45, robot: false, ringFreq: 0,
  },
  {
    id: 'charlotte', label: 'Charlotte', emoji: '👑', desc: 'Güçlü & etkileyici',
    category: 'female', color: '#a78bfa',
    elVoiceId: 'XB0fDUnXU5powFXDhCwa',
    voiceSettings: { stability: 0.45, similarity: 0.80, style: 0.22 },
    pitch: 1.5, robot: false, ringFreq: 0,
  },
  // ── ERKEK SESLERİ ─────────────────────────────────────────────────────────
  {
    id: 'adam', label: 'Adam', emoji: '👨', desc: 'Klasik & güvenilir',
    category: 'male', color: '#38bdf8',
    elVoiceId: 'pNInz6obpgDQGcFmaJgB',
    voiceSettings: { stability: 0.45, similarity: 0.80, style: 0.15 },
    pitch: 0.72, robot: false, ringFreq: 0,
  },
  {
    id: 'derin', label: 'Derin', emoji: '🌑', desc: 'Bas & güçlü',
    category: 'male', color: '#475569',
    elVoiceId: 'VR6AewLTigWG4xSOukaG',
    voiceSettings: { stability: 0.50, similarity: 0.80, style: 0.10 },
    pitch: 0.58, robot: false, ringFreq: 0,
  },
  // ── ÖZEL ──────────────────────────────────────────────────────────────────
  {
    id: 'cocuk', label: 'Çocuk', emoji: '🧒', desc: 'Tiz & eğlenceli',
    category: 'special', color: '#4ade80',
    elVoiceId: 'AZnzlk1XvdvUeBnXmlld',
    voiceSettings: { stability: 0.35, similarity: 0.78, style: 0.35 },
    pitch: 1.85, robot: false, ringFreq: 0,
  },
  {
    id: 'normal', label: 'Ham Ses', emoji: '🎙', desc: 'Dönüşüm yok',
    category: 'special', color: '#64748b',
    elVoiceId: null, voiceSettings: null,
    pitch: 1.0, robot: false, ringFreq: 0,
  },
]
