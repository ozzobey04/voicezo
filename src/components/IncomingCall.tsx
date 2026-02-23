import s from './IncomingCall.module.css'

interface Props {
  callerId: string
  onAnswer: () => void
  onReject: () => void
}

export default function IncomingCall({ callerId, onAnswer, onReject }: Props) {
  return (
    <div className={s.overlay}>
      <div className={s.sheet}>
        <div className={s.indicator} />
        <p className={s.label}>Gelen Arama</p>
        <p className={s.id}>{callerId}</p>
        <div className={s.actions}>
          <button className={s.reject} onClick={onReject}>Reddet</button>
          <button className={s.answer} onClick={onAnswer}>Kabul Et</button>
        </div>
      </div>
    </div>
  )
}
