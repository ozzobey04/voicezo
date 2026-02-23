import s from './VoiceOrb.module.css'

interface Props {
  volume: number
  remoteVolume: number
  connected: boolean
  calling: boolean
}

export default function VoiceOrb({ volume, remoteVolume, connected, calling }: Props) {
  const localScale  = connected ? 1 + volume * 0.35 : 1
  const remoteScale = connected ? 1 + remoteVolume * 0.35 : 1

  return (
    <div className={s.scene}>
      <div className={`${s.node} ${connected ? s.nodeActive : ''}`}
           style={{ transform: `scale(${remoteScale})` }}>
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div className={`${s.line} ${connected ? s.lineActive : calling ? s.lineCalling : ''}`} />
      <div className={s.orbWrap}>
        {connected && [1, 2, 3].map(i => (
          <span key={i} className={s.ring}
            style={{ transform: `scale(${1 + volume * 0.5 * i * 0.4})`, opacity: 0.06 + 0.04 * (4 - i) }}/>
        ))}
        <div className={`${s.orb} ${connected ? s.orbActive : calling ? s.orbCalling : ''}`}
             style={{ transform: `scale(${localScale})` }}>
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="13" rx="3" fill="currentColor"/>
            <path d="M5 10a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
