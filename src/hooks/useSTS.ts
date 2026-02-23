import type { VoicePreset, VoicePresetSettings } from '../voicePresets'

const EL_BASE = 'https://api.elevenlabs.io/v1'

export interface STSSettings {
  stability:    number
  similarity:   number
  chunkMs:      number
  model:        string
}

export const DEFAULT_STS: STSSettings = {
  stability:    0.45,
  similarity:   0.80,
  chunkMs:      2500,
  model:        'eleven_multilingual_sts_v2',
}

export function loadSTSSettings(): STSSettings {
  try {
    const s = localStorage.getItem('sts_settings')
    if (!s) return DEFAULT_STS
    const parsed = JSON.parse(s)
    if (parsed.model === 'eleven_english_sts_v2') {
      parsed.model = 'eleven_multilingual_sts_v2'
    }
    return { ...DEFAULT_STS, ...parsed }
  } catch { return DEFAULT_STS }
}

export function saveSTSSettings(s: STSSettings) {
  localStorage.setItem('sts_settings', JSON.stringify(s))
}

// ── WAV dönüştürücü ──────────────────────────────────────────────────────────
// ElevenLabs STS; WebM/Opus'u dil korumasız çözdüğünden
// tüm sesi önce 16 kHz mono WAV'a dönüştürüyoruz.
async function toWav(blob: Blob): Promise<Blob> {
  try {
    const decodeCtx = new AudioContext({ sampleRate: 16000 })
    const ab        = await blob.arrayBuffer()
    const decoded   = await decodeCtx.decodeAudioData(ab)
    await decodeCtx.close()

    const sr     = decoded.sampleRate      // 16000
    const frames = decoded.length

    // Kanalları mono'ya karıştır
    const mono = new Float32Array(frames)
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      const data = decoded.getChannelData(ch)
      for (let i = 0; i < frames; i++) mono[i] += data[i] / decoded.numberOfChannels
    }

    // WAV başlığı + PCM verisi
    const wavLen = 44 + frames * 2
    const buf    = new ArrayBuffer(wavLen)
    const v      = new DataView(buf)
    const ws = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i))
    }

    ws(0,  'RIFF'); v.setUint32(4,  wavLen - 8, true)
    ws(8,  'WAVE'); ws(12, 'fmt ')
    v.setUint32(16, 16, true)   // fmt chunk size
    v.setUint16(20, 1,  true)   // PCM
    v.setUint16(22, 1,  true)   // mono
    v.setUint32(24, sr, true)   // sample rate
    v.setUint32(28, sr * 2, true) // byte rate
    v.setUint16(32, 2,  true)   // block align
    v.setUint16(34, 16, true)   // bits/sample
    ws(36, 'data'); v.setUint32(40, frames * 2, true)

    let off = 44
    for (let i = 0; i < frames; i++) {
      const s = Math.max(-1, Math.min(1, mono[i]))
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      off += 2
    }

    return new Blob([buf], { type: 'audio/wav' })
  } catch (e) {
    console.warn('WAV dönüşümü başarısız, orijinal gönderiliyor', e)
    return blob
  }
}

function buildVoiceSettings(
  cfg: STSSettings,
  override?: VoicePresetSettings | null
) {
  return JSON.stringify({
    stability:         override?.stability  ?? cfg.stability,
    similarity_boost:  override?.similarity ?? cfg.similarity,
    style:             override?.style      ?? 0,
    use_speaker_boost: true,
  })
}

// ── Tek seferlik dönüşüm (Lab) ───────────────────────────────────────────────
export async function stsOnce(
  blob: Blob,
  voiceId: string,
  apiKey: string,
  settings?: STSSettings,
  presetSettings?: VoicePresetSettings | null,
): Promise<ArrayBuffer | null> {
  const cfg = settings ?? loadSTSSettings()
  try {
    const wav  = await toWav(blob)
    const form = new FormData()
    form.append('audio', wav, 'audio.wav')
    form.append('model_id', cfg.model)
    form.append('voice_settings', buildVoiceSettings(cfg, presetSettings))
    form.append('output_format', 'mp3_44100_128')

    const res = await fetch(`${EL_BASE}/speech-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form,
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('STS error', res.status, errText)
      return null
    }
    return res.arrayBuffer()
  } catch (e) {
    console.error('STS exception', e)
    return null
  }
}

export interface STSResult {
  processedStream: MediaStream
  stop: () => void
}

// ── Canlı çağrı zinciri ──────────────────────────────────────────────────────
export async function buildSTSChain(
  rawStream: MediaStream,
  preset: VoicePreset,
  apiKey: string,
  settings?: STSSettings,
): Promise<STSResult> {
  const cfg  = settings ?? loadSTSSettings()
  const ctx  = new AudioContext({ sampleRate: 44100 })
  const dest = ctx.createMediaStreamDestination()

  if (!apiKey || !preset.elVoiceId) {
    const src = ctx.createMediaStreamSource(rawStream)
    src.connect(dest)
    return { processedStream: dest.stream, stop: () => ctx.close() }
  }

  let stopped  = false
  let playHead = ctx.currentTime + 0.3

  // Desteklenen mimeType'ı bul
  const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
    .find(m => MediaRecorder.isTypeSupported(m)) ?? ''

  const recorder = new MediaRecorder(rawStream, mime ? { mimeType: mime } : undefined)
  const chunks: Blob[] = []

  const scheduleNext = () => {
    if (stopped) return
    recorder.start()
    setTimeout(() => {
      if (!stopped && recorder.state !== 'inactive') recorder.stop()
    }, cfg.chunkMs)
  }

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.onstop = async () => {
    if (stopped || chunks.length === 0) {
      if (!stopped) scheduleNext()
      return
    }
    const rawBlob = new Blob(chunks.splice(0), { type: mime || 'audio/webm' })
    try {
      const wav  = await toWav(rawBlob)
      const form = new FormData()
      form.append('audio', wav, 'chunk.wav')
      form.append('model_id', cfg.model)
      form.append('voice_settings', buildVoiceSettings(cfg, preset.voiceSettings))
      form.append('output_format', 'mp3_44100_128')

      const res = await fetch(`${EL_BASE}/speech-to-speech/${preset.elVoiceId}/stream`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
      })

      if (res.ok && res.body) {
        const reader = res.body.getReader()
        const parts: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) parts.push(value)
        }
        const total  = parts.reduce((s, p) => s + p.byteLength, 0)
        const merged = new Uint8Array(total)
        let off = 0
        for (const p of parts) { merged.set(p, off); off += p.byteLength }

        const audioBuf = await ctx.decodeAudioData(merged.buffer)
        const srcNode  = ctx.createBufferSource()
        srcNode.buffer = audioBuf
        srcNode.connect(dest)
        const when = Math.max(ctx.currentTime + 0.05, playHead)
        srcNode.start(when)
        playHead = when + audioBuf.duration
      }
    } catch (e) { console.error('chain sts error', e) }

    if (!stopped) scheduleNext()
  }

  scheduleNext()

  return {
    processedStream: dest.stream,
    stop: () => {
      stopped = true
      if (recorder.state !== 'inactive') recorder.stop()
      ctx.close()
    },
  }
}
