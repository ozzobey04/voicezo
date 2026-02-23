import s from './StatusBar.module.css'
import type { CallState } from '../hooks/useVoiceChat'

const labels: Record<CallState, string> = {
  idle:      'bağlanıyor',
  ready:     'hazır',
  calling:   'aranıyor...',
  incoming:  'gelen arama',
  connected: 'bağlı',
  error:     'hata',
}

interface Props {
  state: CallState
  error?: string | null
}

export default function StatusBar({ state, error }: Props) {
  return (
    <div className={`${s.bar} ${s[state]}`}>
      <span className={s.dot} />
      <span className={s.label}>{error && state === 'error' ? error : labels[state]}</span>
    </div>
  )
}
