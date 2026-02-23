import { useState, useRef, useCallback, useEffect } from 'react'
import Peer from 'peerjs'
import type { VoicePreset } from '../voicePresets'
import { buildSTSChain } from './useSTS'

export type CallState = 'idle' | 'ready' | 'calling' | 'incoming' | 'connected' | 'error'

export function useVoiceChat(activePreset: VoicePreset, apiKey: string) {
  const [callState, setCallState]               = useState<CallState>('idle')
  const [myId, setMyId]                         = useState('')
  const [volume, setVolume]                     = useState(0)
  const [remoteVolume, setRemoteVolume]         = useState(0)
  const [error, setError]                       = useState<string | null>(null)
  const [incomingCallerId, setIncomingCallerId] = useState<string | null>(null)
  const [converting, setConverting]             = useState(false)

  const peerRef        = useRef<Peer | null>(null)
  const callRef        = useRef<ReturnType<InstanceType<typeof Peer>['call']> | null>(null)
  const rawStreamRef   = useRef<MediaStream | null>(null)
  const stsStopRef     = useRef<(() => void) | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const animRef        = useRef<number>(0)

  const meterStream = useCallback((stream: MediaStream, setter: (v: number) => void) => {
    const ctx = new AudioContext()
    const src = ctx.createMediaStreamSource(stream)
    const an  = ctx.createAnalyser()
    an.fftSize = 256
    src.connect(an)
    const tick = () => {
      const d = new Uint8Array(an.frequencyBinCount)
      an.getByteFrequencyData(d)
      setter(d.reduce((a, b) => a + b, 0) / d.length / 128)
      animRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const buildFX = useCallback(async (raw: MediaStream): Promise<MediaStream> => {
    const result = await buildSTSChain(raw, activePreset, apiKey)
    stsStopRef.current = result.stop
    return result.processedStream
  }, [activePreset, apiKey])

  const stopCall = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    callRef.current?.close()
    rawStreamRef.current?.getTracks().forEach(t => t.stop())
    stsStopRef.current?.()
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
    callRef.current = null
    rawStreamRef.current = null
    stsStopRef.current = null
    setVolume(0); setRemoteVolume(0); setConverting(false)
  }, [])

  const handleRemoteStream = useCallback((remoteStream: MediaStream) => {
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = new Audio()
      remoteAudioRef.current.autoplay = true
    }
    remoteAudioRef.current.srcObject = remoteStream
    meterStream(remoteStream, setRemoteVolume)
    setCallState('connected')
    setConverting(false)
  }, [meterStream])

  useEffect(() => {
    const peer = new Peer({ debug: 0 })
    peerRef.current = peer
    peer.on('open',  id  => { setMyId(id); setCallState('ready') })
    peer.on('call',  inc => { callRef.current = inc; setIncomingCallerId(inc.peer); setCallState('incoming') })
    peer.on('error', e   => { setError(e.message); setCallState('error') })
    return () => { stopCall(); peer.destroy() }
  }, [])

  const call = useCallback(async (peerId: string) => {
    if (!peerRef.current) return
    setError(null); setCallState('calling'); setConverting(true)
    try {
      const raw = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      rawStreamRef.current = raw
      meterStream(raw, setVolume)
      const fx = await buildFX(raw)
      const c = peerRef.current.call(peerId, fx)
      callRef.current = c
      c.on('stream', handleRemoteStream)
      c.on('close',  () => { stopCall(); setCallState('ready') })
      c.on('error',  (e: any) => { setError(e.message); setCallState('error') })
    } catch { setError('Mikrofon erişimi reddedildi'); setCallState('error'); setConverting(false) }
  }, [buildFX, meterStream, handleRemoteStream, stopCall])

  const answer = useCallback(async () => {
    if (!callRef.current) return
    setConverting(true)
    try {
      const raw = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      rawStreamRef.current = raw
      meterStream(raw, setVolume)
      const fx = await buildFX(raw)
      callRef.current.answer(fx)
      callRef.current.on('stream', handleRemoteStream)
      callRef.current.on('close',  () => { stopCall(); setCallState('ready') })
      setIncomingCallerId(null)
    } catch { setError('Mikrofon erişimi reddedildi'); setCallState('error'); setConverting(false) }
  }, [buildFX, meterStream, handleRemoteStream, stopCall])

  const reject = useCallback(() => {
    callRef.current?.close(); callRef.current = null
    setIncomingCallerId(null); setCallState('ready')
  }, [])

  const hangUp = useCallback(() => { stopCall(); setCallState('ready') }, [stopCall])

  return { callState, myId, volume, remoteVolume, error, incomingCallerId, converting, call, answer, reject, hangUp }
}
