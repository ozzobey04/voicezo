import s from './VoiceScreen.module.css'
import { VOICE_PRESETS } from '../voicePresets'
import type { VoicePresetId } from '../voicePresets'

interface Props {
  activeId: VoicePresetId
  onChange: (id: VoicePresetId) => void
  hasKey:   boolean
}

export default function VoiceScreen({ activeId, onChange, hasKey }: Props) {
  return (
    <div className={s.screen}>
      <h2 className={s.title}>Ses Efekti Seç</h2>
      {!hasKey && (
        <p className={s.warn}>⚠ Ayarlar'dan ElevenLabs API anahtarı ekle → Gerçek AI sesi aktif olur</p>
      )}
      <div className={s.grid}>
        {VOICE_PRESETS.map(p => (
          <button
            key={p.id}
            className={`${s.card} ${activeId === p.id ? s.active : ''}`}
            onClick={() => onChange(p.id)}
          >
            <span className={s.emoji}>{p.emoji}</span>
            <span className={s.name}>{p.label}</span>
            <span className={s.mode}>{p.elVoiceId && hasKey ? 'AI' : p.robot ? 'FX' : p.pitch !== 1 ? 'Pitch' : 'Ham'}</span>
            {activeId === p.id && <span className={s.check}>✓</span>}
          </button>
        ))}
      </div>

      <div className={s.infoCard}>
        <p className={s.infoTitle}>Nasıl çalışır?</p>
        <p className={s.infoText}>API anahtarı varsa sesin <strong>ElevenLabs Speech-to-Speech</strong> ile dönüştürülür — gerçek bir AI sesi olarak karşıya gider.</p>
        <p className={s.infoText}>Yoksa otomatik olarak pitch shift moduna geçer.</p>
      </div>
    </div>
  )
}
