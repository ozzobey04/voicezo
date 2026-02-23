import type { VoicePreset } from '../voicePresets'

const EL_BASE = 'https://api.elevenlabs.io/v1'

export interface STSSettings {
  stability:   number
  similarity:  number
  chunkMs:     number
  model:       string
}

export const DEFAULT_STS: STSSettings = {
  stability:  0.5,
  similarity: 0.8,
  chunkMs:    2500,
  model:      'eleven_english_sts_v2',
}

export function loadSTSSettings(): STSSettings {
  try {
    const s = localStorage.getItem('sts_settings')
    return s ? { ...DEFAULT_STS, ...JSON.parse(s) } : DEFAULT_STS
  } catch { return DEFAULT_STS }
}

export function saveSTSSettings(s: STSSettings) {
  localStorage.setItem('sts_settings', JSON.stringify(s))
}

export async function stsOnce(
  blob: Blob, voiceId: string, apiKey: string, settings?: STSSettings
): Promise<ArrayBuffer | null> {
  const cfg = settings ?? loadSTSSettings()
  try {
    const form = new FormData()
    form.append('audio', blob, 'sample.webm')
    form.append('model_id', cfg.model)
    form.append('voice_settings', JSON.stringify({ stability: cfg.stability, similarity_boost: cfg.similarity }))
    const res = await fetch(`${EL_BASE}/speech-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: form,
    })
    if (!res.ok) return null
    return res.arrayBuffer()
  } catch { return null }
}

export interface STSResult {
  processedStream: MediaStream
  stop: () => void
}

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
    if (preset.robot) {
      const osc = ctx.createOscillator()
      osc.frequency.value = preset.ringFreq
      const ring = ctx.createGain()
      osc.connect(ring.gain)
      osc.start()
      src.connect(ring)
      ring.connect(dest)
    } else {
      src.connect(dest)
    }
    return { processedStream: dest.stream, stop: () => ctx.close() }
  }

  let stopped = false
  let playHead = ctx.currentTime + 0.5
  const recorder = new MediaRecorder(rawStream, { mimeType: 'audio/webm' })
  const chunks: Blob[] = []

  const scheduleNext = () => {
    if (stopped) return
    recorder.start()
    setTimeout(() => { if (!stopped && recorder.state !== 'inactive') recorder.stop() }, cfg.chunkMs)
  }

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.onstop = async () => {
    if (stopped || chunks.length === 0) { if (!stopped) scheduleNext(); return }
    const blob = new Blob(chunks.splice(0), { type: 'audio/webm' })

    try {
      const form = new FormData()
      form.append('audio', blob, 'chunk.webm')
      form.append('model_id', cfg.model)
      form.append('voice_settings', JSON.stringify({ stability: cfg.stability, similarity_boost: cfg.similarity }))

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
        const total = parts.reduce((s, p) => s + p.byteLength, 0)
        const buf = new Uint8Array(total)
        let off = 0
        for (const p of parts) { buf.set(p, off); off += p.byteLength }

        const audioBuf = await ctx.decodeAudioData(buf.buffer)
        const srcNode = ctx.createBufferSource()
        srcNode.buffer = audioBuf
        srcNode.connect(dest)
        const when = Math.max(ctx.currentTime + 0.05, playHead)
        srcNode.start(when)
        playHead = when + audioBuf.duration
      }
    } catch (_) { /* sessizce geç */ }

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
