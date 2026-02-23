import { useState } from 'react'
import s from './SettingsScreen.module.css'
import type { STSSettings } from '../hooks/useSTS'

interface Props {
  apiKey:            string
  onApiKey:          (k: string) => void
  stsSettings:       STSSettings
  onStsSettings:     (s: STSSettings) => void
  onClearRecordings?: () => void
  recordingCount:    number
}

const CHUNK_OPTIONS = [
  { label: 'Hızlı (1.5s)', value: 1500, desc: 'Daha az gecikme, daha düşük kalite' },
  { label: 'Dengeli (2.5s)', value: 2500, desc: 'Önerilen mod' },
  { label: 'Kaliteli (4s)', value: 4000, desc: 'Daha yüksek kalite, daha fazla gecikme' },
]

const MODEL_OPTIONS = [
  { value: 'eleven_multilingual_sts_v2',  label: 'Çok Dilli v2 (Önerilen)', desc: 'Türkçe dahil 29 dil — en doğal sonuç' },
  { value: 'eleven_english_sts_v2',       label: 'İngilizce v2',            desc: 'Sadece İngilizce, biraz daha hızlı' },
]

const LANG_OPTIONS = [
  { value: 'tr', label: '🇹🇷 Türkçe' },
  { value: 'en', label: '🇺🇸 İngilizce' },
  { value: 'de', label: '🇩🇪 Almanca' },
  { value: 'fr', label: '🇫🇷 Fransızca' },
  { value: 'es', label: '🇪🇸 İspanyolca' },
  { value: 'ar', label: '🇸🇦 Arapça' },
]

export default function SettingsScreen({
  apiKey, onApiKey, stsSettings, onStsSettings, onClearRecordings, recordingCount
}: Props) {
  const [showKey, setShowKey] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)

  const update = (patch: Partial<STSSettings>) => onStsSettings({ ...stsSettings, ...patch })

  return (
    <div className={s.screen}>

      {/* API KEY */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardIcon}>🔑</span>
          <div>
            <p className={s.cardTitle}>ElevenLabs API Anahtarı</p>
            <p className={s.cardDesc}>Ses dönüşümü ve klonlama için gerekli</p>
          </div>
        </div>
        <div className={s.inputRow}>
          <input
            className={s.input}
            type={showKey ? 'text' : 'password'}
            placeholder="sk_..."
            value={apiKey}
            onChange={e => onApiKey(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button className={s.eyeBtn} onClick={() => setShowKey(v => !v)}>
            {showKey ? '🙈' : '👁'}
          </button>
        </div>
        {apiKey
          ? <div className={s.badge} data-ok>✓ Anahtar aktif</div>
          : <a href="https://elevenlabs.io" target="_blank" rel="noreferrer" className={s.link}>
              elevenlabs.io → ücretsiz hesap aç →
            </a>
        }
      </div>

      {/* GECIKME MODU */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardIcon}>⚡</span>
          <div>
            <p className={s.cardTitle}>Gecikme Modu</p>
            <p className={s.cardDesc}>Ses chunk'larının ne kadar sık gönderileceği</p>
          </div>
        </div>
        <div className={s.optionGroup}>
          {CHUNK_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`${s.optionBtn} ${stsSettings.chunkMs === o.value ? s.optionActive : ''}`}
              onClick={() => update({ chunkMs: o.value })}
            >
              <span className={s.optionLabel}>{o.label}</span>
              <span className={s.optionDesc}>{o.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SES KALİTESİ */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardIcon}>🎚</span>
          <div>
            <p className={s.cardTitle}>Ses Kalitesi</p>
            <p className={s.cardDesc}>ElevenLabs ses dönüşüm parametreleri</p>
          </div>
        </div>

        <div className={s.sliderBlock}>
          <div className={s.sliderRow}>
            <span className={s.sliderLabel}>Kararlılık</span>
            <span className={s.sliderVal}>{Math.round(stsSettings.stability * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="100"
            value={Math.round(stsSettings.stability * 100)}
            onChange={e => update({ stability: Number(e.target.value) / 100 })}
            className={s.slider}
          />
          <p className={s.sliderHint}>Düşük = daha doğal ama tutarsız · Yüksek = tutarlı ama robotik</p>
        </div>

        <div className={s.sliderBlock}>
          <div className={s.sliderRow}>
            <span className={s.sliderLabel}>Benzerlik</span>
            <span className={s.sliderVal}>{Math.round(stsSettings.similarity * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="100"
            value={Math.round(stsSettings.similarity * 100)}
            onChange={e => update({ similarity: Number(e.target.value) / 100 })}
            className={s.slider}
          />
          <p className={s.sliderHint}>Seçilen sese ne kadar yakın dönüştürülsün</p>
        </div>
      </div>

      {/* MODEL */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardIcon}>🧠</span>
          <div>
            <p className={s.cardTitle}>AI Modeli & Dil</p>
            <p className={s.cardDesc}>Türkçe için Çok Dilli + Türkçe seçili olsun</p>
          </div>
        </div>
        <div className={s.optionGroup}>
          {MODEL_OPTIONS.map(o => (
            <button
              key={o.value}
              className={`${s.optionBtn} ${stsSettings.model === o.value ? s.optionActive : ''}`}
              onClick={() => update({ model: o.value })}
            >
              <span className={s.optionLabel}>{o.label}</span>
              <span className={s.optionDesc}>{o.desc}</span>
            </button>
          ))}
        </div>
        <p className={s.cardDesc} style={{ paddingTop: 4 }}>Konuşma Dili</p>
        <div className={s.langGrid}>
          {LANG_OPTIONS.map(l => (
            <button
              key={l.value}
              className={`${s.langBtn} ${stsSettings.languageCode === l.value ? s.langActive : ''}`}
              onClick={() => update({ languageCode: l.value })}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* VERİ YÖNETİMİ */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardIcon}>🗂</span>
          <div>
            <p className={s.cardTitle}>Veri Yönetimi</p>
            <p className={s.cardDesc}>Yerel kayıtlar ve önbellek</p>
          </div>
        </div>
        <div className={s.dataRow}>
          <div className={s.dataStat}>
            <span className={s.dataNum}>{recordingCount}</span>
            <span className={s.dataKey}>Kayıt</span>
          </div>
        </div>
        {!clearConfirm
          ? <button
              className={s.dangerBtn}
              onClick={() => setClearConfirm(true)}
              disabled={recordingCount === 0}
            >
              Tüm kayıtları sil
            </button>
          : <div className={s.confirmRow}>
              <p className={s.confirmText}>{recordingCount} kayıt silinecek. Emin misin?</p>
              <div className={s.confirmBtns}>
                <button className={s.cancelBtn} onClick={() => setClearConfirm(false)}>İptal</button>
                <button className={s.dangerBtnSm} onClick={() => { onClearRecordings?.(); setClearConfirm(false) }}>Evet, sil</button>
              </div>
            </div>
        }
      </div>

      {/* HAKKINDA */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardIcon}>ℹ</span>
          <div>
            <p className={s.cardTitle}>Hakkında</p>
          </div>
        </div>
        <div className={s.aboutGrid}>
          <div className={s.aboutItem}><span className={s.aboutKey}>Uygulama</span><span className={s.aboutVal}>VOICEZO v1.0</span></div>
          <div className={s.aboutItem}><span className={s.aboutKey}>Ses AI</span><span className={s.aboutVal}>ElevenLabs STS</span></div>
          <div className={s.aboutItem}><span className={s.aboutKey}>Klonlama</span><span className={s.aboutVal}>ElevenLabs IVC</span></div>
          <div className={s.aboutItem}><span className={s.aboutKey}>Arama</span><span className={s.aboutVal}>WebRTC / PeerJS</span></div>
        </div>
      </div>

    </div>
  )
}
