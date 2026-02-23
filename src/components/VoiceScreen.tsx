import { useState, useRef } from 'react'
import s from './VoiceScreen.module.css'
import { VOICE_PRESETS } from '../voicePresets'
import type { VoicePresetId } from '../voicePresets'
import type { ELVoice } from '../hooks/useElevenLabs'

interface Props {
  activePresetId:   VoicePresetId
  activeCustomId:   string | null
  activeCustomName: string | null
  onSelectPreset:   (id: VoicePresetId) => void
  onSelectCustom:   (voiceId: string, name: string) => void
  elVoices:         ELVoice[]
  elLoading:        boolean
  elError:          string | null
  onFetchVoices:    () => void
  hasKey:           boolean
}

export default function VoiceScreen({
  activePresetId, activeCustomId, activeCustomName,
  onSelectPreset, onSelectCustom,
  elVoices, elLoading, elError, onFetchVoices, hasKey,
}: Props) {
  const [tab,    setTab]    = useState<'preset' | 'el'>('preset')
  const [search, setSearch] = useState('')
  const previewRef = useRef<HTMLAudioElement | null>(null)

  const femaleVoices  = VOICE_PRESETS.filter(p => p.category === 'female')
  const otherVoices   = VOICE_PRESETS.filter(p => p.category !== 'female')
  const filteredVoices = elVoices.filter(v => v.name.toLowerCase().includes(search.toLowerCase()))

  const playPreview = (url: string | null) => {
    if (!url) return
    previewRef.current?.pause()
    previewRef.current = new Audio(url)
    previewRef.current.play()
  }

  const activePreset = VOICE_PRESETS.find(p => p.id === activePresetId)!
  const activeLabel  = activeCustomId
    ? `${activeCustomName ?? 'Özel ses'}`
    : `${activePreset.emoji} ${activePreset.label}`

  return (
    <div className={s.screen}>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'preset' ? s.activeTab : ''}`} onClick={() => setTab('preset')}>
          AI Sesler
        </button>
        <button className={`${s.tab} ${tab === 'el' ? s.activeTab : ''}`} onClick={() => setTab('el')}>
          Hesabım
        </button>
      </div>

      <div className={s.body}>
        <div className={s.activeVoiceBanner}>
          <span className={s.bannerDot}/>
          <p className={s.bannerText}>Aktif ses: <strong>{activeLabel}</strong></p>
        </div>

        {!hasKey && tab === 'preset' && (
          <p className={s.warn}>⚠ Ayarlar'dan ElevenLabs API anahtarı ekle → Gerçek AI dönüşüm aktif olur</p>
        )}

        {tab === 'preset' && (
          <>
            <div className={s.section}>
              <p className={s.sectionLabel}>Kadın Sesleri</p>
              <div className={s.femaleGrid}>
                {femaleVoices.map(p => {
                  const isActive = !activeCustomId && activePresetId === p.id
                  return (
                    <button
                      key={p.id}
                      className={`${s.femaleCard} ${isActive ? s.active : ''}`}
                      style={{
                        background: `${p.color}10`,
                        borderColor: isActive ? p.color : 'rgba(255,255,255,0.07)',
                        ['--card-color' as string]: p.color,
                        ['--card-gradient' as string]: `linear-gradient(135deg, ${p.color}, transparent)`,
                      }}
                      onClick={() => onSelectPreset(p.id)}
                    >
                      <div className={s.cardGlow}/>
                      <span className={s.cardEmoji}>{p.emoji}</span>
                      <div className={s.cardBottom}>
                        <p className={s.cardName}>{p.label}</p>
                        <p className={s.cardDesc}>{p.desc}</p>
                      </div>
                      {isActive && <span className={s.activeCheck} style={{ background: p.color }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className={s.section}>
              <p className={s.sectionLabel}>Diğer Sesler</p>
              <div className={s.smallGrid}>
                {otherVoices.map(p => {
                  const isActive = !activeCustomId && activePresetId === p.id
                  return (
                    <button
                      key={p.id}
                      className={`${s.smallCard} ${isActive ? s.active : ''}`}
                      style={{ ['--card-color' as string]: p.color }}
                      onClick={() => onSelectPreset(p.id)}
                    >
                      <span className={s.smallEmoji}>{p.emoji}</span>
                      <span className={s.smallName}>{p.label}</span>
                      <span className={s.smallDesc}>{p.desc}</span>
                      {isActive && <span className={s.smallCheck}>✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {tab === 'el' && (
          <>
            <div className={s.searchRow}>
              <input
                className={s.searchInput}
                placeholder="Ses ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className={s.fetchBtn} onClick={onFetchVoices} disabled={elLoading || !hasKey}>
                {elLoading ? '...' : 'Yükle'}
              </button>
            </div>

            {elError && <p className={s.errorMsg}>{elError}</p>}

            {!hasKey && <p className={s.empty}>API anahtarı gerekli.<br/>Ayarlar → ElevenLabs Key</p>}

            {hasKey && elVoices.length === 0 && !elLoading && (
              <p className={s.empty}>Sesler yüklenmedi.<br/>"Yükle" butonuna bas.</p>
            )}

            {filteredVoices.length > 0 && (
              <div className={s.voiceList}>
                {filteredVoices.map(v => {
                  const isActive = activeCustomId === v.voice_id
                  return (
                    <div key={v.voice_id} className={`${s.voiceItem} ${isActive ? s.active : ''}`}>
                      <div className={s.voiceAvatar}>{v.name.charAt(0).toUpperCase()}</div>
                      <div className={s.voiceInfo}>
                        <p className={s.voiceName}>{v.name}</p>
                        <p className={s.voiceMeta}>{v.category}</p>
                      </div>
                      <div className={s.voiceActions}>
                        {v.preview_url && (
                          <button className={s.previewBtn} onClick={() => playPreview(v.preview_url)}>▶</button>
                        )}
                        {isActive
                          ? <span className={s.selectedBadge}>✓ Seçili</span>
                          : <button className={s.selectBtn} onClick={() => onSelectCustom(v.voice_id, v.name)}>Seç</button>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
