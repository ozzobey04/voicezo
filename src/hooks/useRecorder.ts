import { useState, useRef, useCallback } from 'react'

export interface Recording {
  id: string
  name: string
  blob: Blob
  url: string
  duration: number
  createdAt: number
}

export function useRecorder() {
  const [recordings, setRecordings]   = useState<Recording[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [seconds, setSeconds]         = useState(0)

  const mrRef      = useRef<MediaRecorder | null>(null)
  const chunks     = useRef<Blob[]>([])
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTime  = useRef<number>(0)

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mrRef.current = mr; chunks.current = []; startTime.current = Date.now()
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)
      setIsRecording(false)
    }
    mr.start()
    setIsRecording(true)
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }, [])

  const stop = useCallback((): Promise<Blob> => {
    return new Promise(resolve => {
      if (!mrRef.current || mrRef.current.state === 'inactive') { resolve(new Blob()); return }
      mrRef.current.onstop = () => {
        mrRef.current?.stream.getTracks().forEach(t => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setIsRecording(false)
        resolve(blob)
      }
      mrRef.current.stop()
    })
  }, [])

  const save = useCallback((name: string, blob: Blob, duration: number) => {
    const rec: Recording = {
      id:        crypto.randomUUID(),
      name:      name.trim(),
      blob,
      url:       URL.createObjectURL(blob),
      duration,
      createdAt: Date.now(),
    }
    setRecordings(prev => [rec, ...prev])
    return rec
  }, [])

  const remove = useCallback((id: string) => {
    setRecordings(prev => {
      const r = prev.find(x => x.id === id)
      if (r) URL.revokeObjectURL(r.url)
      return prev.filter(x => x.id !== id)
    })
  }, [])

  return { recordings, isRecording, seconds, start, stop, save, remove }
}
