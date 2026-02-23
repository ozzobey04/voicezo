import { useState } from 'react'
import styles from './CallPanel.module.css'

interface Props {
  myId: string
  onCall: (id: string) => void
  onHangUp: () => void
  connected: boolean
  calling: boolean
}

export default function CallPanel({ myId, onCall, onHangUp, connected, calling }: Props) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const copyId = () => {
    navigator.clipboard.writeText(myId).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleCall = () => {
    const id = input.trim()
    if (id && id !== myId) onCall(id)
  }

  if (connected || calling) {
    return (
      <div className={styles.wrap}>
        <button className={styles.hangup} onClick={onHangUp}>
          Aramayı Bitir
        </button>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      {/* Kendi ID */}
      <button className={styles.idBox} onClick={copyId}>
        <span className={styles.idVal}>{myId || '...'}</span>
        <span className={styles.idHint}>{copied ? 'kopyalandı' : 'kodun — tıkla kopyala'}</span>
      </button>

      {/* Ayraç */}
      <div className={styles.divider}><span>veya ara</span></div>

      {/* Arama alanı */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="kod gir"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCall()}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className={styles.callBtn}
          onClick={handleCall}
          disabled={!input.trim() || input.trim() === myId}
        >
          Ara
        </button>
      </div>
    </div>
  )
}
