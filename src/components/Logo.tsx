import s from './Logo.module.css'

interface Props { size?: number }

export default function Logo({ size = 36 }: Props) {
  return (
    <div className={s.wrap}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="34" rx="22" ry="13" fill="url(#lg)" opacity="0.92"/>
        <ellipse cx="32" cy="34" rx="11" ry="5.5" fill="#0a0a0a"/>
        <rect   x="30.5" y="21" width="3" height="26" rx="1.5" fill="#0a0a0a"/>
        <rect   x="28.5" y="5"  width="7" height="27" rx="3.5" fill="url(#lg)"/>
        <ellipse cx="32"  cy="6"  rx="5"   ry="5.5"   fill="url(#lg)"/>
        <ellipse cx="28.8" cy="33.5" rx="3.6" ry="3"  fill="url(#lg)" opacity="0.65"/>
        <ellipse cx="35.2" cy="33.5" rx="3.6" ry="3"  fill="url(#lg)" opacity="0.65"/>
        <defs>
          <linearGradient id="lg" x1="10" y1="5" x2="54" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#9d55ff"/>
            <stop offset="100%" stopColor="#6c63ff"/>
          </linearGradient>
        </defs>
      </svg>
      <span className={s.word}>VOICEZO</span>
    </div>
  )
}
