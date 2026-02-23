import { useState, useCallback } from 'react'
import Logo from './components/Logo'
import BottomNav from './components/BottomNav'
import CallScreen from './components/CallScreen'
import VoiceScreen from './components/VoiceScreen'
import RecordScreen from './components/RecordScreen'
import LabScreen from './components/LabScreen'
import SettingsScreen from './components/SettingsScreen'
import IncomingCall from './components/IncomingCall'
import { useVoiceChat } from './hooks/useVoiceChat'
import { useElevenLabs } from './hooks/useElevenLabs'
import { useRecorder } from './hooks/useRecorder'
import { stsOnce, loadSTSSettings, saveSTSSettings } from './hooks/useSTS'
import type { STSSettings } from './hooks/useSTS'
import { VOICE_PRESETS } from './voicePresets'
import type { VoicePresetId } from './voicePresets'
import './App.css'

const DEFAULT_KEY = 'sk_e448dded4b4b84d602851bc889fb9537a28ac353f518e226'
type Tab = 'call' | 'voice' | 'record' | 'lab' | 'settings'

function initKey() {
  const stored = localStorage.getItem('el_key')
  if (!stored) { localStorage.setItem('el_key', DEFAULT_KEY); return DEFAULT_KEY }
  return stored
}

export default function App() {
  const [tab, setTab]                     = useState<Tab>('call')
  const [presetId, setPresetId]           = useState<VoicePresetId>('normal')
  const [customVoiceId, setCustomVoiceId] = useState<string | null>(null)
  const [customVoiceName, setCustomName]  = useState<string | null>(null)
  const [apiKey, setApiKey]               = useState<string>(initKey)
  const [stsSettings, setStsSettings]     = useState<STSSettings>(loadSTSSettings)

  const activePreset = VOICE_PRESETS.find(p => p.id === presetId)!

  const activeVoiceName = customVoiceName
    ?? `${activePreset.emoji} ${activePreset.label}`

  const {
    callState, myId, volume, remoteVolume,
    incomingCallerId, converting, call, answer, reject, hangUp,
  } = useVoiceChat(activePreset, apiKey, customVoiceId)

  const {
    voices, loading: elLoad, error: elErr,
    fetchVoices, cloneVoice,
  } = useElevenLabs(apiKey)

  const {
    recordings, isRecording, seconds,
    start: recStart, stop: recStop, save: recSave, remove: recRemove,
  } = useRecorder()

  const handleApiKey = (k: string) => {
    setApiKey(k); localStorage.setItem('el_key', k)
  }

  const handleSTSSettings = (s: STSSettings) => {
    setStsSettings(s); saveSTSSettings(s)
  }

  const handleSelectPreset = (id: VoicePresetId) => {
    setPresetId(id); setCustomVoiceId(null); setCustomName(null)
  }

  const handleSelectCustom = (voiceId: string, name: string) => {
    setCustomVoiceId(voiceId); setCustomName(name)
  }

  const handleCloneFromRecord = async (name: string, blob: Blob) => {
    await cloneVoice(name, [blob])
  }

  const handleTestVoice = useCallback(async (blob: Blob): Promise<string | null> => {
    const voiceId = customVoiceId ?? activePreset.elVoiceId
    if (!voiceId || !apiKey) return null
    const ab = await stsOnce(blob, voiceId, apiKey, stsSettings, activePreset.voiceSettings)
    if (!ab) return null
    return URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }))
  }, [customVoiceId, activePreset, apiKey, stsSettings])

  const handleLabTest = async (blob: Blob, voiceId: string): Promise<string | null> => {
    const preset = VOICE_PRESETS.find(p => p.elVoiceId === voiceId)
    const ab = await stsOnce(blob, voiceId, apiKey, stsSettings, preset?.voiceSettings ?? null)
    if (!ab) return null
    return URL.createObjectURL(new Blob([ab], { type: 'audio/mpeg' }))
  }

  return (
    <div className="app">
      {incomingCallerId && (
        <IncomingCall callerId={incomingCallerId} onAnswer={answer} onReject={reject} />
      )}

      <header className="header">
        <Logo />
        <div className="headerVoice">
          <span className="headerVoiceDot"/>
          <span className="headerVoiceText">
            {customVoiceName ?? `${activePreset.emoji} ${activePreset.label}`}
          </span>
        </div>
      </header>

      <div className="content">
        {tab === 'call' && (
          <CallScreen
            callState={callState}
            myId={myId}
            volume={volume}
            remoteVolume={remoteVolume}
            activePreset={activePreset}
            converting={converting}
            hasKey={!!apiKey}
            onCall={call}
            onHangUp={hangUp}
          />
        )}
        {tab === 'voice' && (
          <VoiceScreen
            activePresetId={presetId}
            activeCustomId={customVoiceId}
            activeCustomName={customVoiceName}
            onSelectPreset={handleSelectPreset}
            onSelectCustom={handleSelectCustom}
            elVoices={voices}
            elLoading={elLoad}
            elError={elErr}
            onFetchVoices={fetchVoices}
            hasKey={!!apiKey}
          />
        )}
        {tab === 'record' && (
          <RecordScreen
            recordings={recordings}
            isRecording={isRecording}
            seconds={seconds}
            onStart={recStart}
            onStop={recStop}
            onSave={recSave}
            onRemove={recRemove}
            onClone={handleCloneFromRecord}
            onTest={handleTestVoice}
            activeVoiceName={activeVoiceName}
            hasKey={!!apiKey}
            cloning={elLoad}
          />
        )}
        {tab === 'lab' && (
          <LabScreen
            apiKey={apiKey}
            elVoices={voices}
            onFetchVoices={fetchVoices}
            elLoading={elLoad}
            onTest={handleLabTest}
          />
        )}
        {tab === 'settings' && (
          <SettingsScreen
            apiKey={apiKey}
            onApiKey={handleApiKey}
            stsSettings={stsSettings}
            onStsSettings={handleSTSSettings}
            onClearRecordings={recRemove ? () => recordings.forEach(r => recRemove(r.id)) : undefined}
            recordingCount={recordings.length}
          />
        )}
      </div>

      <BottomNav active={tab} onChange={t => setTab(t as Tab)} />
    </div>
  )
}
