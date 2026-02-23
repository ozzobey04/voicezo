import { useState, useRef } from 'react'
import s from './RecordScreen.module.css'
import type { Recording } from '../hooks/useRecorder'

interface Props {
  recordings:  Recording[]
  isRecording: boolean
  seconds:     number
  onStart:     () => void
  onStop:      () => Promise<Blob>
  onSave:      (name: string, blob: Blob, duration: number) => Recording
  onRemove:    (id: string) => void
  onClone:     (name: string, blob: Blob) => Promise<void>
  hasKey:      boolean
  cloning:     boolean
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
}

export default function RecordScreen({
  recordings, isRecording, seconds, onStart, onStop, onSave, onRemove, onClone, hasKey, cloning
}: Props) {
  const [name, setName]           = useState('')
  const [pendingBlob, setPending] = useState<Blob | null>(null)
  const [pendingSec, setPendSec]  = useState(0)
  const [cloningId, setCloningId] = useState<string | null>(null)
  const secRef = useRef(0)
  secRef.current = seconds

  const handleStop = async () => {
    const blob = await onStop()
    if (blob.size > 0) {
      setPending(blob)
      setPendSec(secRef.current)
    }
  }

  const handleSave = () => {
    if (!pendingBlob || !name.trim()) return
    onSave(name.trim(), pendingBlob, pendingSec)
    setName('')
    setPending(null)
    setPendSec(0)
  }

  const handleClone = async (rec: Recording) => {
    setCloningId(rec.id)
    await onClone(rec.name, rec.blob)
    setCloningId(null)
  }

  return (
    <div className={s.screen}>
      {/* Kayıt butonu */}
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

      {/* Kayıt bitti — isimlendir */}
      {pendingBlob && !isRecording && (
        <div className={s.nameCard}>
          <p className={s.nameTitle}>Kayda isim ver</p>
          <audio controls src={URL.createObjectURL(pendingBlob)} className={s.audio}/>
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

      {/* Kayıt listesi */}
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
                <button
                  className={s.cloneBtn}
                  disabled={cloning || cloningId === r.id}
                  onClick={() => handleClone(r)}
                >
                  {cloningId === r.id ? 'Klonlanıyor...' : '✦ ElevenLabs\'a klonla'}
                </button>
              )}
              {!hasKey && (
                <p className={s.noKey}>API anahtarı ekle → Klonla özelliği aktif olur</p>
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
