import { useState, useRef, useEffect } from 'react'
import s from './LabScreen.module.css'
import { VOICE_PRESETS } from '../voicePresets'
import type { VoicePresetSettings } from '../voicePresets'

interface SavedRecording {
  id:          string
  name:        string
  timestamp:   number
  durationSec: number
  audioBase64: string
}

type VoiceSliders = VoicePresetSettings

interface Props {
  apiKey: string
  onTest: (blob: Blob, voiceId: string, settings?: VoicePresetSettings | null) => Promise<string | null>
}

const ST = {
  ids:     'lab_rec_ids',
  rec:     (id: string) => `lab_rec_${id}`,
  sliders: (vid: string) => `lab_vs_${vid}`,
}

function loadIds(): string[] {
  try { return JSON.parse(localStorage.getItem(ST.ids) || '[]') } catch { return [] }
}
function loadRec(id: string): SavedRecording | null {
  try { const v = localStorage.getItem(ST.rec(id)); return v ? JSON.parse(v) : null } catch { return null }
}
function persistRec(r: SavedRecording): boolean {
  try {
    const ids = loadIds()
    if (!ids.includes(r.id)) { ids.unshift(r.id); localStorage.setItem(ST.ids, JSON.stringify(ids)) }
    localStorage.setItem(ST.rec(r.id), JSON.stringify(r))
    return true
  } catch { return false }
}
function removeRec(id: string) {
  const ids = loadIds().filter(i => i !== id)
  localStorage.setItem(ST.ids, JSON.stringify(ids))
  localStorage.removeItem(ST.rec(id))
}
function loadSliders(vid: string, def: VoiceSliders): VoiceSliders {
  try { const v = localStorage.getItem(ST.sliders(vid)); return v ? { ...def, ...JSON.parse(v) } : def } catch { return def }
}
function saveSliders(vid: string, vs: VoiceSliders) {
  try { localStorage.setItem(ST.sliders(vid), JSON.stringify(vs)) } catch {}
}
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}
function base64ToBlob(data: string): Blob {
  const [head, body] = data.split(',')
  const mime = head.match(/:(.*?);/)?.[1] ?? 'audio/webm'
  const bin  = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
function fmt(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2,'0')}:${String(n % 60).padStart(2,'0')}`
}

function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export default function LabScreen({ apiKey, onTest }: Props) {
  const [recordings, setRecordings] = useState<SavedRecording[]>([])
  const [selId, setSelId]           = useState<string | null>(null)
  const [recStep, setRecStep]       = useState<'idle' | 'rec' | 'naming'>('idle')
  const [seconds, setSeconds]       = useState(0)
  const [draftName, setDraftName]   = useState('')
  const [pendingB64, setPendingB64] = useState<string | null>(null)
  const [sliders, setSliders]       = useState<Record<string, VoiceSliders>>({})
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [results, setResults]       = useState<Record<string, { status: 'loading' | 'done' | 'error'; url?: string }>>({})
  const [playing, setPlaying]       = useState<string | null>(null)

  const recRef    = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<number | null>(null)
  const audioRef  = useRef<HTMLAudioElement | null>(null)
  const nameRef   = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const ids  = loadIds()
    const recs = ids.map(loadRec).filter(Boolean) as SavedRecording[]
    setRecordings(recs)
    if (recs.length > 0) setSelId(recs[0].id)
  }, [])

  useEffect(() => {
    const init: Record<string, VoiceSliders> = {}
    VOICE_PRESETS.forEach(p => {
      if (!p.elVoiceId) return
      init[p.elVoiceId] = loadSliders(p.elVoiceId, p.voiceSettings ?? { stability: 0.35, similarity: 0.85, style: 0.15 })
    })
    setSliders(init)
  }, [])

  useEffect(() => { setResults({}); setPlaying(null) }, [selId])

  const selRec = recordings.find(r => r.id === selId) ?? null

  const startRec = async () => {
    if (!apiKey) { alert("Önce Ayarlar'dan API anahtarını ekle"); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const b64  = await blobToBase64(blob)
        setPendingB64(b64)
        setRecStep('naming')
        stream.getTracks().forEach(t => t.stop())
        setTimeout(() => nameRef.current?.focus(), 100)
      }
      mr.start()
      recRef.current = mr
      setSeconds(0)
      setRecStep('rec')
      timerRef.current = window.setInterval(() => setSeconds(n => n + 1), 1000)
    } catch { alert('Mikrofon izni gerekli') }
  }

  const stopRec = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    recRef.current?.stop()
  }

  const saveRec = () => {
    if (!pendingB64) return
    const name = draftName.trim() || `Kayıt ${recordings.length + 1}`
    const rec: SavedRecording = {
      id: Date.now().toString(), name,
      timestamp: Date.now(), durationSec: seconds, audioBase64: pendingB64,
    }
    const ok = persistRec(rec)
    if (!ok) { alert('Depolama dolu. Eski kayıtları sil.'); return }
    setRecordings(prev => [rec, ...prev])
    setSelId(rec.id)
    setDraftName('')
    setPendingB64(null)
    setRecStep('idle')
  }

  const deleteRec = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Bu kaydı sil?')) return
    removeRec(id)
    setRecordings(prev => prev.filter(r => r.id !== id))
    if (selId === id) {
      const rem = recordings.filter(r => r.id !== id)
      setSelId(rem[0]?.id ?? null)
    }
  }

  const convert = async (voiceId: string) => {
    if (!selRec || !apiKey) return
    const blob = base64ToBlob(selRec.audioBase64)
    const vs   = sliders[voiceId]
    setResults(p => ({ ...p, [voiceId]: { status: 'loading' } }))
    const url = await onTest(blob, voiceId, vs ?? null)
    setResults(p => ({ ...p, [voiceId]: url ? { status: 'done', url } : { status: 'error' } }))
  }

  const playResult = (voiceId: string, url: string) => {
    audioRef.current?.pause()
    const a = new Audio(url)
    audioRef.current = a
    setPlaying(voiceId)
    a.play()
    a.onended = () => setPlaying(null)
  }

  const updateSlider = (vid: string, key: keyof VoiceSliders, val: number) => {
    setSliders(prev => {
      const next = { ...prev, [vid]: { ...(prev[vid] ?? {}), [key]: val } }
      saveSliders(vid, next[vid])
      return next
    })
  }

  const resetSliders = (vid: string) => {
    const p = VOICE_PRESETS.find(p => p.elVoiceId === vid)
    if (!p?.voiceSettings) return
    setSliders(prev => {
      const next = { ...prev, [vid]: { ...p.voiceSettings! } }
      saveSliders(vid, next[vid])
      return next
    })
  }

  const voices = VOICE_PRESETS.filter(p => p.elVoiceId)

  return (
    <div className={s.screen}>
      <div className={s.header}>
        <p className={s.title}>Ses Laboratuvarı</p>
        <p className={s.subtitle}>Kayıt yap · parametreleri ayarla · en iyi sesi bul</p>
      </div>

      {/* ── Recordings section ── */}
      <section className={s.section}>
        <div className={s.sectionHead}>
          <span className={s.sectionTitle}>Kayıtlar</span>
          {recStep === 'idle' && (
            <button className={s.newBtn} onClick={startRec}>+ Yeni Kayıt</button>
          )}
        </div>

        {recStep === 'rec' && (
          <div className={s.activeRec}>
            <div className={s.recIndicator}>
              <span className={s.recDot}/>
              <span className={s.recTime}>{fmt(seconds)}</span>
              <span className={s.recHint}>Doğal konuş — Türkçe destekleniyor</span>
            </div>
            <button className={s.stopBtn} onClick={stopRec}>■ Durdur</button>
          </div>
        )}

        {recStep === 'naming' && pendingB64 && (
          <div className={s.namingBox}>
            <audio controls src={pendingB64} className={s.miniAudio}/>
            <input
              ref={nameRef}
              className={s.nameInput}
              placeholder="Kayıt adı (ör. Ozan sesi)"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveRec()}
            />
            <div className={s.namingRow}>
              <button className={s.saveBtn} onClick={saveRec}>Kaydet ✓</button>
              <button className={s.cancelBtn} onClick={() => { setPendingB64(null); setRecStep('idle') }}>İptal</button>
            </div>
          </div>
        )}

        {recordings.length === 0 && recStep === 'idle' && (
          <p className={s.emptyHint}>Henüz kayıt yok. "+ Yeni Kayıt" butonuna bas.</p>
        )}

        {recordings.length > 0 && (
          <div className={s.recList}>
            {recordings.map(r => (
              <div
                key={r.id}
                className={`${s.recRow} ${r.id === selId ? s.recRowSel : ''}`}
                onClick={() => setSelId(r.id)}
              >
                <div className={s.recRowLeft}>
                  <span className={s.recIcon}>🎙</span>
                  <div>
                    <p className={s.recName}>{r.name}</p>
                    <p className={s.recMeta}>{fmt(r.durationSec)} · {new Date(r.timestamp).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <div className={s.recRowRight} onClick={e => e.stopPropagation()}>
                  <audio controls src={r.audioBase64} className={s.recAudio}/>
                  <button
                    className={s.dlBtn}
                    onClick={() => downloadFile(r.audioBase64, `${r.name}.webm`)}
                    title="İndir"
                  >↓</button>
                  <button className={s.delBtn} onClick={e => deleteRec(r.id, e)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Voice conversion section ── */}
      {selRec ? (
        <section className={s.section}>
          <div className={s.sectionHead}>
            <span className={s.sectionTitle}>Dönüşüm</span>
            <span className={s.sectionSub}>"{selRec.name}"</span>
          </div>

          {!apiKey && (
            <div className={s.warnBox}>⚠ Ayarlar → API anahtarı ekle</div>
          )}

          <div className={s.grid}>
            {voices.map(p => {
              const vid = p.elVoiceId!
              const r   = results[vid]
              const vs  = sliders[vid] ?? p.voiceSettings ?? { stability: 0.35, similarity: 0.85, style: 0.15 }
              const exp = expanded === vid

              return (
                <div
                  key={vid}
                  className={`${s.card} ${r?.status === 'done' ? s.cardOk : r?.status === 'error' ? s.cardErr : ''}`}
                  style={{ '--c': p.color } as React.CSSProperties}
                >
                  <div className={s.cardHead}>
                    <span className={s.cardEmoji}>{p.emoji}</span>
                    <div className={s.cardInfo}>
                      <p className={s.cardName}>{p.label}</p>
                      <p className={s.cardDesc}>{p.desc}</p>
                    </div>
                    <button
                      className={`${s.gearBtn} ${exp ? s.gearOpen : ''}`}
                      onClick={() => setExpanded(exp ? null : vid)}
                      title="Parametreler"
                    >⚙</button>
                  </div>

                  {exp && (
                    <div className={s.sliders}>
                      {([
                        ['Kararlılık', 'stability',  0.10, 0.90],
                        ['Benzerlik',  'similarity', 0.50, 1.00],
                        ['İfade',      'style',      0.00, 0.50],
                      ] as [string, keyof VoiceSliders, number, number][]).map(([label, key, min, max]) => (
                        <div key={key} className={s.slRow}>
                          <div className={s.slLabel}>
                            <span>{label}</span>
                            <span className={s.slVal}>{vs[key].toFixed(2)}</span>
                          </div>
                          <input
                            type="range" min={min} max={max} step="0.01"
                            value={vs[key]}
                            className={s.range}
                            onChange={e => updateSlider(vid, key, Number(e.target.value))}
                          />
                        </div>
                      ))}
                      <button className={s.resetBtn} onClick={() => resetSliders(vid)}>↺ Varsayılana döndür</button>
                    </div>
                  )}

                  <div className={s.cardActions}>
                    {(!r || r.status === 'error') && (
                      <button
                        className={`${s.convertBtn} ${r?.status === 'error' ? s.convertBtnErr : ''}`}
                        onClick={() => convert(vid)}
                        disabled={!apiKey}
                      >
                        {r?.status === 'error' ? '↺ Tekrar dene' : 'Dönüştür →'}
                      </button>
                    )}
                    {r?.status === 'loading' && (
                      <div className={s.loadingBar}>
                        <div className={s.loadingFill}/>
                        <span className={s.loadingTxt}>İşleniyor...</span>
                      </div>
                    )}
                    {r?.status === 'done' && r.url && (
                      <div className={s.doneRow}>
                        <button
                          className={`${s.playBtn} ${playing === vid ? s.playingBtn : ''}`}
                          onClick={() => playResult(vid, r.url!)}
                        >
                          {playing === vid ? '▶ Çalıyor...' : '▶ Dinle'}
                        </button>
                        <button
                          className={s.dlBtn}
                          onClick={() => downloadFile(r.url!, `${selRec?.name ?? 'kayit'}_${p.label}.mp3`)}
                          title="İndir"
                        >↓</button>
                        <button className={s.reBtn} onClick={() => convert(vid)} disabled={!apiKey} title="Yeniden dönüştür">↺</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        recordings.length === 0 && recStep === 'idle' && (
          <div className={s.bigHint}>
            <span className={s.bigHintIcon}>🎙</span>
            <p className={s.bigHintTitle}>Lab'a hoş geldin</p>
            <p className={s.bigHintSub}>
              Ses kaydet, farklı AI seslere dönüştür<br/>
              ⚙ ile parametreleri ayarla · en doğal sesi bul
            </p>
          </div>
        )
      )}
    </div>
  )
}
