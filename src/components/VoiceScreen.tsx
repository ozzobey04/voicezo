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
  elVoices, elLoading, elError, onFetchVoices,
  hasKey,
}: Props) {
  const [tab,    setTab]    = useState<'preset' | 'el'>('preset')
  const [search, setSearch] = useState('')
  const previewRef = useRef<HTMLAudioElement | null>(null)

  const filteredVoices = elVoices.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  )

  const playPreview = (url: string | null) => {
    if (!url) return
    if (previewRef.current) { previewRef.current.pause() }
    previewRef.current = new Audio(url)
    previewRef.current.play()
  }

  const activeLabel = activeCustomId
    ? `✦ ${activeCustomName ?? 'Özel ses'}`
    : `${VOICE_PRESETS.find(p => p.id === activePresetId)?.emoji} ${VOICE_PRESETS.find(p => p.id === activePresetId)?.label}`

  return (
    <div className={s.screen}>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'preset' ? s.activeTab : ''}`} onClick={() => setTab('preset')}>
          Hazır Sesler
        </button>
        <button className={`${s.tab} ${tab === 'el' ? s.activeTab : ''}`} onClick={() => setTab('el')}>
          EL Sesleri
        </button>
      </div>

      <div className={s.body}>
        <div className={s.activeVoiceBanner}>
          <span>🎙</span>
          <span>Aktif: <strong>{activeLabel}</strong></span>
        </div>

        {!hasKey && (
          <p className={s.warn}>⚠ Ayarlar'dan ElevenLabs API anahtarı ekle → Gerçek AI ses aktif olur</p>
        )}

        {tab === 'preset' && (
          <>
            <p className={s.sectionLabel}>Hazır AI Sesleri</p>
            <div className={s.grid}>
              {VOICE_PRESETS.map(p => {
                const isActive = !activeCustomId && activePresetId === p.id
                return (
                  <button
                    key={p.id}
                    className={`${s.card} ${isActive ? s.active : ''}`}
                    onClick={() => onSelectPreset(p.id)}
                  >
                    <span className={s.emoji}>{p.emoji}</span>
                    <span className={s.name}>{p.label}</span>
                    <span className={s.mode}>{p.elVoiceId && hasKey ? 'AI' : p.robot ? 'FX' : p.pitch !== 1 ? 'Pitch' : 'Ham'}</span>
                    {isActive && <span className={s.check}>✓</span>}
                  </button>
                )
              })}
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

            {!hasKey && (
              <p className={s.empty}>API anahtarı gerekli.<br/>Ayarlar → ElevenLabs Key</p>
            )}

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
