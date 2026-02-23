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

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function RecordScreen({
  recordings, isRecording, seconds, onStart, onStop, onSave, onRemove, onClone,
  onTest, activeVoiceName, hasKey, cloning
}: Props) {
  const [name, setName]               = useState('')
  const [pendingBlob, setPending]     = useState<Blob | null>(null)
  const [pendingSec, setPendSec]      = useState(0)
  const [cloningId, setCloningId]     = useState<string | null>(null)
  const [testingId, setTestingId]     = useState<string | null>(null)
  const [testAudio, setTestAudio]     = useState<string | null>(null)
  const [testPendAud, setTestPendAud] = useState<string | null>(null)
  const [testingPend, setTestingPend] = useState(false)
  const secRef = useRef(0)
  secRef.current = seconds

  const handleStop = async () => {
    const blob = await onStop()
    if (blob.size > 0) { setPending(blob); setPendSec(secRef.current) }
  }

  const handleSave = () => {
    if (!pendingBlob || !name.trim()) return
    onSave(name.trim(), pendingBlob, pendingSec)
    setName(''); setPending(null); setPendSec(0); setTestPendAud(null)
  }

  const handleClone = async (rec: Recording) => {
    setCloningId(rec.id)
    await onClone(rec.name, rec.blob)
    setCloningId(null)
  }

  const handleTestPending = async () => {
    if (!pendingBlob) return
    setTestingPend(true); setTestPendAud(null)
    const url = await onTest(pendingBlob)
    setTestPendAud(url)
    setTestingPend(false)
  }

  const handleTestSaved = async (rec: Recording) => {
    setTestingId(rec.id); setTestAudio(null)
    const url = await onTest(rec.blob)
    setTestAudio(url)
    setTestingId(null)
  }

  return (
    <div className={s.screen}>
      <div className={s.recArea}>
        <button
          className={`${s.bigBtn} ${isRecording ? s.recording : ''}`}
          onClick={isRecording ? handleStop : onStart}
          disabled={!!pendingBlob && !isRecording}
        >
          <span className={s.bigBtnIcon}>{isRecording ? '■' : '●'}</span>
          <span className={s.bigBtnLabel}>{isRecording ? 'Dur' : 'Kayıt Başlat'}</span>
        </button>
        {isRecording && (
          <div className={s.timer}>
            <span className={s.timerDot}/>
            {fmt(seconds)}
          </div>
        )}
      </div>

      {pendingBlob && !isRecording && (
        <div className={s.nameCard}>
          <p className={s.nameTitle}>Kayda isim ver</p>
          <audio controls src={URL.createObjectURL(pendingBlob)} className={s.audio}/>

          {hasKey && (
            <div className={s.testRow}>
              <button
                className={s.testBtn}
                onClick={handleTestPending}
                disabled={testingPend}
              >
                {testingPend ? 'Dönüştürülüyor...' : `▶ "${activeVoiceName}" sesiyle test et`}
              </button>
            </div>
          )}
          {testPendAud && (
            <div className={s.testResult}>
              <p className={s.testLabel}>Dönüştürülmüş ses:</p>
              <audio controls src={testPendAud} className={s.audio} autoPlay/>
            </div>
          )}

          <div className={s.nameRow}>
            <input
              className={s.nameInput}
              placeholder="örn. Fatih'in sesi"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <button className={s.saveBtn} disabled={!name.trim()} onClick={handleSave}>Kaydet</button>
          </div>
        </div>
      )}

      {recordings.length > 0 && (
        <div className={s.list}>
          <p className={s.listTitle}>Kayıtlar</p>
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
                    className={s.testBtn}
                    disabled={testingId === r.id}
                    onClick={() => handleTestSaved(r)}
                  >
                    {testingId === r.id ? 'Dönüştürülüyor...' : `▶ "${activeVoiceName}" test`}
                  </button>
                  <button
                    className={s.cloneBtn}
                    disabled={cloning || cloningId === r.id}
                    onClick={() => handleClone(r)}
                  >
                    {cloningId === r.id ? 'Klonlanıyor...' : '✦ Klonla'}
                  </button>
                </div>
              )}
              {testingId === r.id && (
                <p className={s.testLabel}>ElevenLabs'a gönderiliyor...</p>
              )}
              {testAudio && testingId === null && (
                <div className={s.testResult}>
                  <p className={s.testLabel}>Dönüştürülmüş:</p>
                  <audio controls src={testAudio} className={s.audio} autoPlay/>
                </div>
              )}
              {!hasKey && (
                <p className={s.noKey}>API anahtarı ekle → Test & Klonla aktif olur</p>
              )}
            </div>
          ))}
        </div>
      )}

      {recordings.length === 0 && !isRecording && !pendingBlob && (
        <p className={s.empty}>Henüz kayıt yok.<br/>Kayıt başlat → Bitir → İsim ver → Kaydet</p>
      )}
    </div>
  )
}
