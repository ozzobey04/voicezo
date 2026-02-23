import { useState, useRef } from 'react'
import s from './LabScreen.module.css'
import { VOICE_PRESETS } from '../voicePresets'
import type { ELVoice } from '../hooks/useElevenLabs'

interface VoiceResult {
  voiceId: string
  name:    string
  emoji:   string
  status:  'idle' | 'loading' | 'done' | 'error'
  url?:    string
}

interface Props {
  apiKey:         string
  elVoices:       ELVoice[]
  onFetchVoices:  () => void
  elLoading:      boolean
  onTest:         (blob: Blob, voiceId: string) => Promise<string | null>
}

function fmt(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2,'0')}:${String(n % 60).padStart(2,'0')}`
}

type Step = 'idle' | 'recording' | 'ready'

export default function LabScreen({ apiKey, elVoices, onFetchVoices, elLoading, onTest }: Props) {
  const [step, setStep]         = useState<Step>('idle')
  const [seconds, setSeconds]   = useState(0)
  const [blob, setBlob]         = useState<Blob | null>(null)
  const [results, setResults]   = useState<Record<string, VoiceResult>>({})
  const [playing, setPlaying]   = useState<string | null>(null)

  const recRef    = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<number | null>(null)
  const audioRef  = useRef<HTMLAudioElement | null>(null)

  const allVoices: { id: string; name: string; emoji: string; category: string }[] = [
    ...VOICE_PRESETS.filter(p => p.elVoiceId).map(p => ({
      id: p.elVoiceId!, name: p.label, emoji: p.emoji, category: 'Hazır'
    })),
    ...elVoices.map(v => ({
      id: v.voice_id, name: v.name, emoji: '✦', category: v.category ?? 'Klonlanmış'
    }))
  ]

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const b = new Blob(chunksRef.current, { type: 'audio/webm' })
        setBlob(b)
        setStep('ready')
        setResults({})
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      recRef.current = mr
      setSeconds(0)
      setStep('recording')
      timerRef.current = window.setInterval(() => setSeconds(s => s + 1), 1000)
    } catch { alert('Mikrofon izni gerekli') }
  }

  const stopRec = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    recRef.current?.stop()
  }

  const reset = () => {
    setBlob(null); setStep('idle'); setSeconds(0); setResults({})
  }

  const convertVoice = async (v: { id: string; name: string; emoji: string; category: string }) => {
    if (!blob || !apiKey) return
    setResults(p => ({ ...p, [v.id]: { voiceId: v.id, name: v.name, emoji: v.emoji, status: 'loading' } }))
    const url = await onTest(blob, v.id)
    setResults(p => ({ ...p, [v.id]: { voiceId: v.id, name: v.name, emoji: v.emoji, status: url ? 'done' : 'error', url: url ?? undefined } }))
  }

  const playResult = (voiceId: string, url: string) => {
    audioRef.current?.pause()
    const a = new Audio(url)
    audioRef.current = a
    setPlaying(voiceId)
    a.play()
    a.onended = () => setPlaying(null)
  }

  const convertAll = async () => {
    if (!blob || !apiKey) return
    for (const v of allVoices) {
      if (!results[v.id] || results[v.id].status === 'idle') {
        convertVoice(v)
      }
    }
  }

  return (
    <div className={s.screen}>
      <div className={s.header}>
        <p className={s.title}>Ses Laboratuvarı</p>
        <p className={s.subtitle}>Sesini kaydet, tüm AI seslere dönüştür</p>
      </div>

      {/* ── RECORD ZONE ── */}
      {step === 'idle' && (
        <div className={s.recZone}>
          <button className={s.recBtn} onClick={startRec} disabled={!apiKey}>
            <span className={s.recBtnIcon}>●</span>
            <span className={s.recBtnLabel}>Kaydı Başlat</span>
          </button>
          {!apiKey && <p className={s.warn}>⚠ Ayarlar'dan ElevenLabs API anahtarı ekle</p>}
        </div>
      )}

      {step === 'recording' && (
        <div className={s.recZone}>
          <button className={`${s.recBtn} ${s.recBtnActive}`} onClick={stopRec}>
            <span className={s.recBtnIcon}>■</span>
            <span className={s.recBtnLabel}>Durdur</span>
          </button>
          <div className={s.timer}>
            <span className={s.timerDot}/>
            {fmt(seconds)}
          </div>
          <p className={s.recTip}>Doğal konuş, 5-10 saniye yeterli</p>
        </div>
      )}

      {step === 'ready' && blob && (
        <div className={s.readyZone}>
          <div className={s.recPreview}>
            <div className={s.recPreviewInfo}>
              <span className={s.recPreviewIcon}>🎙</span>
              <div>
                <p className={s.recPreviewTitle}>Kayıt hazır — {fmt(seconds)}</p>
                <p className={s.recPreviewSub}>Aşağıdan ses seç veya tümünü dönüştür</p>
              </div>
            </div>
            <div className={s.recPreviewActions}>
              <audio controls src={URL.createObjectURL(blob)} className={s.miniAudio}/>
              <div className={s.recBtnRow}>
                <button className={s.convertAllBtn} onClick={convertAll} disabled={allVoices.length === 0 || elLoading}>
                  ⚡ Tümünü Dönüştür
                </button>
                <button className={s.resetBtn} onClick={reset}>Yeniden Kayıt</button>
              </div>
            </div>
          </div>

          {elVoices.length === 0 && (
            <button className={s.loadElBtn} onClick={onFetchVoices} disabled={elLoading}>
              {elLoading ? 'Yükleniyor...' : '+ ElevenLabs seslerini de yükle'}
            </button>
          )}

          {/* Voice grid */}
          <div className={s.grid}>
            {allVoices.map(v => {
              const r = results[v.id]
              return (
                <div key={v.id} className={`${s.voiceCard} ${r?.status === 'done' ? s.cardDone : ''}`}>
                  <div className={s.cardTop}>
                    <span className={s.cardEmoji}>{v.emoji}</span>
                    <div className={s.cardInfo}>
                      <p className={s.cardName}>{v.name}</p>
                      <p className={s.cardCat}>{v.category}</p>
                    </div>
                  </div>

                  {!r || r.status === 'idle' ? (
                    <button className={s.convertBtn} onClick={() => convertVoice(v)}>
                      Dönüştür →
                    </button>
                  ) : r.status === 'loading' ? (
                    <div className={s.loadingBar}>
                      <div className={s.loadingFill}/>
                      <span className={s.loadingText}>Dönüştürülüyor...</span>
                    </div>
                  ) : r.status === 'done' && r.url ? (
                    <button
                      className={`${s.playBtn} ${playing === v.id ? s.playBtnActive : ''}`}
                      onClick={() => playResult(v.id, r.url!)}
                    >
                      {playing === v.id ? '▶ Çalıyor...' : '▶ Dinle'}
                    </button>
                  ) : (
                    <button className={s.retryBtn} onClick={() => convertVoice(v)}>
                      ✕ Hata — Tekrar
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {allVoices.length === 0 && (
            <p className={s.empty}>Hazır sesler yükleniyor...<br/>EL seslerini yukarıdan yükle.</p>
          )}
        </div>
      )}
    </div>
  )
}
