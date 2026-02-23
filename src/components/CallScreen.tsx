import { useState } from 'react'
import s from './CallScreen.module.css'
import type { CallState } from '../hooks/useVoiceChat'
import type { VoicePreset } from '../voicePresets'

interface Props {
  callState:    CallState
  myId:         string
  volume:       number
  remoteVolume: number
  activePreset: VoicePreset
  converting:   boolean
  hasKey:       boolean
  onCall:       (id: string) => void
  onHangUp:     () => void
}

export default function CallScreen({
  callState, myId, volume, remoteVolume, activePreset, converting, hasKey, onCall, onHangUp
}: Props) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(myId).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const connected = callState === 'connected'
  const calling   = callState === 'calling'
  const lScale    = connected ? 1 + volume * 0.45 : 1
  const rScale    = connected ? 1 + remoteVolume * 0.45 : 1
  const useAI     = !!activePreset.elVoiceId && hasKey

  return (
    <div className={s.screen}>
      <div className={s.orbArea}>
        <div className={s.node} style={{ transform: `scale(${rScale})`, opacity: connected ? 1 : 0.25 }}>
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {connected && <span className={s.nodeLabel}>Karşı taraf</span>}
        </div>

        <div className={`${s.line} ${connected ? s.lineOn : calling ? s.linePulse : ''}`} />

        <div className={s.orbWrap}>
          {connected && [1,2,3].map(i => (
            <span key={i} className={s.ring} style={{
              transform: `scale(${1 + volume * 0.5 * i * 0.3})`,
              opacity: 0.05 + 0.03 * (4 - i),
            }}/>
          ))}
          <div className={`${s.orb} ${connected ? s.orbOn : calling ? s.orbCalling : ''} ${converting ? s.orbConverting : ''}`}
               style={{ transform: `scale(${lScale})` }}>
            <span className={s.presetEmoji}>{activePreset.emoji}</span>
            <span className={s.presetLabel}>{activePreset.label}</span>
            {converting && <span className={s.converting}>dönüştürülüyor</span>}
          </div>
        </div>
      </div>

      {(connected || calling) && (
        <div className={`${s.badge} ${useAI ? s.badgeAI : s.badgeFallback}`}>
          {useAI ? '✦ ElevenLabs AI Ses' : '⚡ Pitch Shift'}
        </div>
      )}

      <div className={s.status}>
        <span className={`${s.dot} ${s[callState]}`}/>
        <span className={s.statusText}>
          {callState === 'idle'      && 'Bağlanıyor...'}
          {callState === 'ready'     && 'Hazır'}
          {callState === 'calling'   && 'Aranıyor...'}
          {callState === 'connected' && 'Bağlı'}
          {callState === 'error'     && 'Hata'}
        </span>
      </div>

      {(connected || calling) ? (
        <button className={s.hangup} onClick={onHangUp}>Aramayı Bitir</button>
      ) : callState === 'ready' && (
        <div className={s.panel}>
          {!hasKey && activePreset.elVoiceId && (
            <p className={s.noKey}>⚠ API anahtarı yok — ses efekti pitch shift ile çalışacak</p>
          )}
          <button className={s.idBox} onClick={copy}>
            <span className={s.idVal}>{myId || '...'}</span>
            <span className={s.idHint}>{copied ? 'Kopyalandı!' : 'Kodun — dokunarak kopyala'}</span>
          </button>
          <div className={s.row}>
            <input className={s.input} placeholder="Kod gir..." value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input.trim() && onCall(input.trim())}
              autoComplete="off" spellCheck={false}/>
            <button className={s.callBtn} disabled={!input.trim()}
              onClick={() => onCall(input.trim())}>Ara</button>
          </div>
        </div>
      )}
    </div>
  )
}
