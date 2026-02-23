import type { VoicePreset } from '../voicePresets'

const EL_BASE = 'https://api.elevenlabs.io/v1'
const CHUNK_MS = 2500

export interface STSResult {
  processedStream: MediaStream
  stop: () => void
}

export async function buildSTSChain(
  rawStream: MediaStream,
  preset: VoicePreset,
  apiKey: string,
): Promise<STSResult> {
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
    setTimeout(() => { if (!stopped && recorder.state !== 'inactive') recorder.stop() }, CHUNK_MS)
  }

  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

  recorder.onstop = async () => {
    if (stopped || chunks.length === 0) { if (!stopped) scheduleNext(); return }
    const blob = new Blob(chunks.splice(0), { type: 'audio/webm' })

    try {
      const form = new FormData()
      form.append('audio', blob, 'chunk.webm')
      form.append('model_id', 'eleven_english_sts_v2')
      form.append('voice_settings', JSON.stringify({ stability: 0.5, similarity_boost: 0.8 }))

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
