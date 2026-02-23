import { useState, useRef } from 'react'
import s from './RecordScreen.module.css'
import type { Recording } from '../hooks/useRecorder'

interface Props {
  recordings:       Recording[]
  isRecording:      boolean
  seconds:          number
  onStart:          () => void
  onStop:           () => Promise<Blob>
  onSave:           (name: string, blob: Blob, duration: number) => Recording
  onRemove:         (id: string) => void
  onClone:          (name: string, blob: Blob) => Promise<void>
  onTest:           (blob: Blob) => Promise<string | null>
  activeVoiceName:  string
  hasKey:           boolean
  cloning:          boolean
}

type RecStep = 'idle' | 'recording' | 'preview' | 'naming' | 'saved'

function fmt(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2,'0')}:${String(n % 60).padStart(2,'0')}`
}

export default function RecordScreen({
  recordings, isRecording: _isRecording, seconds, onStart, onStop, onSave, onRemove, onClone,
  onTest, activeVoiceName, hasKey, cloning
}: Props) {
  const [step, setStep]               = useState<RecStep>('idle')
  const [pendingBlob, setPending]     = useState<Blob | null>(null)
  const [pendingSec, setPendSec]      = useState(0)
  const [name, setName]               = useState('')
  const [savedRec, setSavedRec]       = useState<Recording | null>(null)
  const [testAudio, setTestAudio]     = useState<string | null>(null)
  const [testing, setTesting]         = useState(false)
  const [cloningId, setCloningId]     = useState<string | null>(null)
  const [testingId, setTestingId]     = useState<string | null>(null)
  const [listTestAudio, setListAudio] = useState<Record<string, string>>({})
  const secRef = useRef(0)
  secRef.current = seconds

  const startRec = () => { onStart(); setStep('recording'); setTestAudio(null) }

  const stopRec = async () => {
    const blob = await onStop()
    if (blob.size > 0) { setPending(blob); setPendSec(secRef.current); setStep('preview') }
    else setStep('idle')
  }

  const discard = () => { setPending(null); setStep('idle'); setTestAudio(null) }

  const testCurrent = async () => {
    if (!pendingBlob) return
    setTesting(true); setTestAudio(null)
    const url = await onTest(pendingBlob)
    setTestAudio(url)
    setTesting(false)
  }

  const saveCurrent = () => { setStep('naming') }

  const confirmSave = () => {
    if (!pendingBlob || !name.trim()) return
    const rec = onSave(name.trim(), pendingBlob, pendingSec)
    setSavedRec(rec)
    setName(''); setStep('saved')
  }

  const newRecording = () => { setPending(null); setSavedRec(null); setStep('idle'); setTestAudio(null) }

  const handleCloneRec = async (rec: Recording) => {
    setCloningId(rec.id)
    await onClone(rec.name, rec.blob)
    setCloningId(null)
  }

  const handleTestRec = async (rec: Recording) => {
    setTestingId(rec.id)
    const url = await onTest(rec.blob)
    if (url) setListAudio(p => ({ ...p, [rec.id]: url }))
    setTestingId(null)
  }

  return (
    <div className={s.screen}>

      {/* ── STEP INDICATOR ── */}
      <div className={s.steps}>
        {(['recording', 'preview', 'naming', 'saved'] as const).map((st, i) => {
          const labels = ['Kaydet', 'Önizle', 'İsimlendir', 'Kullan']
          const idx = ['idle','recording','preview','naming','saved'].indexOf(step)
          const done = idx > i + 1
          const active = idx === i + 1
          return (
            <div key={st} className={`${s.stepItem} ${active ? s.stepActive : ''} ${done ? s.stepDone : ''}`}>
              <div className={s.stepDot}>{done ? '✓' : i + 1}</div>
              <span className={s.stepLabel}>{labels[i]}</span>
              {i < 3 && <div className={s.stepLine} />}
            </div>
          )
        })}
      </div>

      {/* ── IDLE / RECORDING ── */}
      {(step === 'idle' || step === 'recording') && (
        <div className={s.recArea}>
          <button
            className={`${s.bigBtn} ${step === 'recording' ? s.recording : ''}`}
            onClick={step === 'recording' ? stopRec : startRec}
          >
            <span className={s.bigBtnIcon}>{step === 'recording' ? '■' : '●'}</span>
            <span className={s.bigBtnLabel}>{step === 'recording' ? 'Kaydı Durdur' : 'Kayıt Başlat'}</span>
          </button>
          {step === 'recording' && (
            <div className={s.timer}>
              <span className={s.timerDot}/>
              {fmt(seconds)}
            </div>
          )}
          {step === 'idle' && (
            <p className={s.hint}>En az 2 cümle konuş.<br/>Ardından klonlayıp aramalarında kullanabilirsin.</p>
          )}
        </div>
      )}

      {/* ── PREVIEW ── */}
      {step === 'preview' && pendingBlob && (
        <div className={s.card}>
          <p className={s.cardLabel}>Kaydın hazır — {fmt(pendingSec)}</p>
          <audio controls src={URL.createObjectURL(pendingBlob)} className={s.audio}/>

          {hasKey && (
            <div className={s.infoBox}>
              <span className={s.infoIcon}>🎙</span>
              <span className={s.infoText}>Aktif ses: <strong>{activeVoiceName}</strong></span>
            </div>
          )}

          <button className={s.testBtn} onClick={testCurrent} disabled={testing || !hasKey}>
            {!hasKey ? '⚠ API anahtarı gerekli' : testing ? 'Dönüştürülüyor...' : `▶ "${activeVoiceName}" sesiyle test et`}
          </button>

          {testAudio && (
            <div className={s.testResult}>
              <p className={s.testLabel}>Dönüştürülmüş ses:</p>
              <audio controls src={testAudio} className={s.audio} autoPlay/>
            </div>
          )}

          <div className={s.actionRow}>
            <button className={s.ghostBtn} onClick={discard}>✕ Sil</button>
            <button className={s.primaryBtn} onClick={saveCurrent}>İsim ver & Kaydet →</button>
          </div>
        </div>
      )}

      {/* ── NAMING ── */}
      {step === 'naming' && pendingBlob && (
        <div className={s.card}>
          <p className={s.cardLabel}>Kayda bir isim ver</p>
          <input
            className={s.nameInput}
            placeholder="örn. Fatih'in sesi"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirmSave()}
            autoFocus
          />
          <p className={s.hint2}>Bu isimle kayıtlar listesinde görünecek.<br/>ElevenLabs'a klonlayınca bu isim kullanılır.</p>
          <div className={s.actionRow}>
            <button className={s.ghostBtn} onClick={() => setStep('preview')}>← Geri</button>
            <button className={s.primaryBtn} disabled={!name.trim()} onClick={confirmSave}>Kaydet ✓</button>
          </div>
        </div>
      )}

      {/* ── SAVED ── */}
      {step === 'saved' && savedRec && (
        <div className={s.card}>
          <div className={s.savedHeader}>
            <span className={s.savedIcon}>✓</span>
            <div>
              <p className={s.savedTitle}>"{savedRec.name}" kaydedildi!</p>
              <p className={s.savedMeta}>{fmt(savedRec.duration)} · aşağıda listelendi</p>
            </div>
          </div>

          <div className={s.flowBox}>
            <p className={s.flowTitle}>Sıradaki adım — sesi nasıl kullanacaksın?</p>
            <div className={s.flowSteps}>
              <div className={s.flowStep}>
                <span className={s.flowNum}>1</span>
                <div>
                  <p className={s.flowStepTitle}>ElevenLabs'a Klonla</p>
                  <p className={s.flowStepDesc}>Aşağıdaki kaydında "✦ Klonla" butonuna bas. Sesin EL hesabına yüklenir ve bir voice_id alır.</p>
                </div>
              </div>
              <div className={s.flowStep}>
                <span className={s.flowNum}>2</span>
                <div>
                  <p className={s.flowStepTitle}>Sesler → EL Sesleri sekmesi</p>
                  <p className={s.flowStepDesc}>Alt navda "🎙 Ses" sekmesine git → "EL Sesleri" → "Yükle" → klonladığın sesi bul → "Seç"</p>
                </div>
              </div>
              <div className={s.flowStep}>
                <span className={s.flowNum}>3</span>
                <div>
                  <p className={s.flowStepTitle}>Aramada kullan</p>
                  <p className={s.flowStepDesc}>Artık o sesle arama yapabilirsin. Karşıya tam o ses gider.</p>
                </div>
              </div>
            </div>
          </div>

          <button className={s.primaryBtn} onClick={newRecording}>+ Yeni Kayıt</button>
        </div>
      )}

      {/* ── KAYIT LİSTESİ ── */}
      {recordings.length > 0 && (
        <div className={s.list}>
          <p className={s.listTitle}>Kayıtlar ({recordings.length})</p>
          {recordings.map(r => (
            <div key={r.id} className={s.item}>
              <div className={s.itemTop}>
                <div className={s.itemAvatar}>{r.name.charAt(0)}</div>
                <div className={s.itemInfo}>
                  <p className={s.itemName}>{r.name}</p>
                  <p className={s.itemMeta}>{fmt(r.duration)} · {new Date(r.createdAt).toLocaleDateString('tr')}</p>
                </div>
                <button className={s.deleteBtn} onClick={() => onRemove(r.id)}>✕</button>
              </div>
              <audio controls src={r.url} className={s.audio}/>
              {hasKey && (
                <div className={s.itemActions}>
                  <button
                    className={s.testBtnSm}
                    disabled={testingId === r.id}
                    onClick={() => handleTestRec(r)}
                  >
                    {testingId === r.id ? '...' : `▶ Test`}
                  </button>
                  <button
                    className={s.cloneBtn}
                    disabled={cloning || cloningId === r.id}
                    onClick={() => handleCloneRec(r)}
                  >
                    {cloningId === r.id ? 'Klonlanıyor...' : '✦ EL\'a Klonla'}
                  </button>
                </div>
              )}
              {listTestAudio[r.id] && (
                <div className={s.testResult}>
                  <p className={s.testLabel}>Dönüştürülmüş:</p>
                  <audio controls src={listTestAudio[r.id]} className={s.audio} autoPlay/>
                </div>
              )}
              {!hasKey && <p className={s.noKey}>API anahtarı ekle → Test & Klonla aktif olur</p>}
            </div>
          ))}
        </div>
      )}

      {recordings.length === 0 && step === 'idle' && (
        <p className={s.empty}>Henüz kayıt yok.<br/>Yukarıdaki butona bas ve konuşmaya başla.</p>
      )}
    </div>
  )
}
