import { useEffect, useState, useRef } from 'react'
import s from './LibraryScreen.module.css'
import type { ELVoice } from '../hooks/useElevenLabs'

interface Props {
  voices: ELVoice[]
  loading: boolean
  error: string | null
  onFetch: () => void
  onFetchShared: (q: string) => void
  hasKey: boolean
}

export default function LibraryScreen({ voices, loading, error, onFetch, onFetchShared, hasKey }: Props) {
  const [tab, setTab]     = useState<'mine' | 'shared'>('mine')
  const [query, setQuery] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    if (!hasKey) return
    if (tab === 'mine') onFetch(); else onFetchShared('')
  }, [tab, hasKey])

  const preview = (voice: ELVoice) => {
    if (!voice.preview_url) return
    if (playing === voice.voice_id) {
      audioRef.current?.pause(); setPlaying(null); return
    }
    if (audioRef.current) audioRef.current.pause()
    const a = new Audio(voice.preview_url)
    audioRef.current = a
    a.play(); setPlaying(voice.voice_id)
    a.onended = () => setPlaying(null)
  }

  return (
    <div className={s.screen}>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab === 'mine' ? s.tabActive : ''}`} onClick={() => setTab('mine')}>Seslerim</button>
        <button className={`${s.tab} ${tab === 'shared' ? s.tabActive : ''}`} onClick={() => setTab('shared')}>Keşfet</button>
      </div>
      {tab === 'shared' && (
        <div className={s.searchRow}>
          <input className={s.search} placeholder="Ses ara..." value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onFetchShared(query)}/>
          <button className={s.searchBtn} onClick={() => onFetchShared(query)}>Ara</button>
        </div>
      )}
      {!hasKey && <p className={s.warn}>Ayarlar'dan ElevenLabs API anahtarı gir</p>}
      {loading && <p className={s.msg}>Yükleniyor...</p>}
      {error   && <p className={s.err}>{error}</p>}
      <div className={s.list}>
        {voices.map(v => (
          <div key={v.voice_id} className={s.item}>
            <div className={s.itemLeft}>
              <div className={s.avatar}>{v.name.charAt(0).toUpperCase()}</div>
              <div>
                <p className={s.voiceName}>{v.name}</p>
                <p className={s.voiceMeta}>
                  {v.labels?.gender && <span>{v.labels.gender}</span>}
                  {v.labels?.accent && <span>{v.labels.accent}</span>}
                  {v.category && <span>{v.category}</span>}
                </p>
              </div>
            </div>
            {v.preview_url && (
              <button className={`${s.playBtn} ${playing === v.voice_id ? s.playing : ''}`}
                onClick={() => preview(v)}>
                {playing === v.voice_id ? '■' : '▶'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
