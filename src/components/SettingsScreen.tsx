import s from './SettingsScreen.module.css'

interface Props {
  apiKey: string
  onChange: (k: string) => void
}

export default function SettingsScreen({ apiKey, onChange }: Props) {
  return (
    <div className={s.screen}>
      <h2 className={s.title}>Ayarlar</h2>
      <div className={s.section}>
        <p className={s.label}>ElevenLabs API Anahtarı</p>
        <p className={s.desc}>Ses klonlama ve kütüphane için gerekli. <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className={s.link}>elevenlabs.io</a>'dan ücretsiz al.</p>
        <input
          className={s.input}
          type="password"
          placeholder="xi_..."
          value={apiKey}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        {apiKey && <p className={s.ok}>Anahtar kaydedildi</p>}
      </div>
      <div className={s.section}>
        <p className={s.label}>Hakkında</p>
        <div className={s.about}>
          <p className={s.aboutText}><strong>VOICEZO</strong> — Gerçek zamanlı ses dönüştürücü + P2P sesli arama</p>
          <p className={s.aboutText}>Ses efektleri: ElevenLabs Speech-to-Speech AI</p>
          <p className={s.aboutText}>Ses klonlama: ElevenLabs Instant Voice Clone</p>
          <p className={s.aboutText}>Arama: WebRTC / PeerJS</p>
        </div>
      </div>
    </div>
  )
}
