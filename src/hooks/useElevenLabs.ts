import { useState, useCallback } from 'react'

export interface ELVoice {
  voice_id: string
  name: string
  category: string
  labels: Record<string, string>
  preview_url: string | null
}

export interface ClonedVoice {
  voice_id: string
  name: string
}

const BASE = 'https://api.elevenlabs.io/v1'

export function useElevenLabs(apiKey: string) {
  const [voices, setVoices]       = useState<ELVoice[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const headers = () => ({
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
  })

  const fetchVoices = useCallback(async () => {
    if (!apiKey) { setError('API anahtarı gerekli'); return }
    setLoading(true); setError(null)
    try {
      const r = await fetch(`${BASE}/voices`, { headers: headers() })
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
      const data = await r.json()
      setVoices(data.voices ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  const fetchSharedVoices = useCallback(async (query = '') => {
    if (!apiKey) { setError('API anahtarı gerekli'); return }
    setLoading(true); setError(null)
    try {
      const qs = new URLSearchParams({ page_size: '24', ...(query ? { search: query } : {}) })
      const r = await fetch(`${BASE}/shared-voices?${qs}`, { headers: headers() })
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
      const data = await r.json()
      setVoices(data.voices ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  const cloneVoice = useCallback(async (
    name: string,
    audioBlobs: Blob[]
  ): Promise<ClonedVoice | null> => {
    if (!apiKey) { setError('API anahtarı gerekli'); return null }
    setLoading(true); setError(null)
    try {
      const form = new FormData()
      form.append('name', name)
      form.append('description', 'Voicezo ile klonlandı')
      audioBlobs.forEach((b, i) => form.append('files', b, `sample_${i + 1}.webm`))

      const r = await fetch(`${BASE}/voices/add`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
      })
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
      const data = await r.json()
      return { voice_id: data.voice_id, name }
    } catch (e: any) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  const tts = useCallback(async (voiceId: string, text: string): Promise<ArrayBuffer | null> => {
    if (!apiKey) return null
    try {
      const r = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ text, model_id: 'eleven_turbo_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      })
      if (!r.ok) throw new Error(`${r.status}`)
      return r.arrayBuffer()
    } catch {
      return null
    }
  }, [apiKey])

  return { voices, loading, error, fetchVoices, fetchSharedVoices, cloneVoice, tts }
}
