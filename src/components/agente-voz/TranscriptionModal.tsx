'use client'

import Portal from '@/components/ui/Portal'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import type { CallRecord } from './voiceAgentTypes'
import { CALL_INTENT_LABELS } from './voiceAgentTypes'

type TranscriptionModalProps = {
  call: CallRecord
  onClose: () => void
}

// Mock transcription data
type TranscriptionMessage = {
  id: string
  sender: 'agent' | 'patient'
  text: string
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function safeJson(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : null
    } catch {
      return null
    }
  }
  return typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function extractTranscriptFromPayload(payload: Record<string, unknown> | null): string {
  const call = safeJson(payload?.call)
  const candidates = [
    asString(call?.transcript),
    asString(call?.full_transcript),
    asString(payload?.transcript)
  ]
    .map((value) => value.trim())
    .filter(Boolean)
  return candidates[0] || ''
}

function toMessages(
  transcriptText: string,
  fallbackSummary: string
): TranscriptionMessage[] {
  const fallbackMessages: TranscriptionMessage[] = [
    {
      id: 'fallback-agent',
      sender: 'agent',
      text: 'No hay transcripción completa disponible para esta llamada.'
    },
    {
      id: 'fallback-patient',
      sender: 'patient',
      text: fallbackSummary || 'Sin resumen de llamada.'
    }
  ]

  const normalized = transcriptText.trim()
  if (!normalized) return fallbackMessages

  const parsed = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const agentPrefix = /^(agent|ia|assistant|agente|operador)\s*:\s*/i
      const patientPrefix = /^(patient|paciente|user|usuario)\s*:\s*/i
      const isAgentLine = agentPrefix.test(line)
      const isPatientLine = patientPrefix.test(line)
      const cleanText = line.replace(agentPrefix, '').replace(patientPrefix, '').trim()
      return {
        id: `line-${index + 1}`,
        sender: (isAgentLine
          ? 'agent'
          : isPatientLine
            ? 'patient'
            : index % 2 === 0
              ? 'agent'
              : 'patient') as TranscriptionMessage['sender'],
        text: cleanText || line
      }
    })

  return parsed.length > 0 ? parsed : fallbackMessages
}

function parseDurationToSeconds(duration: string): number {
  const [mm, ss] = duration.split(':').map((value) => Number(value))
  if (!Number.isFinite(mm) || !Number.isFinite(ss)) return 0
  return Math.max(0, mm * 60 + ss)
}

// Waveform bar heights for visual representation
const WAVEFORM_HEIGHTS = [
  2, 8, 14, 4, 16, 14, 10, 10, 10, 10, 14, 10, 16, 10, 16, 16, 16, 10, 10, 16,
  16, 10, 16, 16, 16, 10, 4, 4, 2
]

/**
 * Transcription Modal
 * Figma: 517 × 759px = 32.3125rem × 47.4375rem
 * Shows call info, chat transcription, and audio player
 */
export default function TranscriptionModal({
  call,
  onClose
}: TranscriptionModalProps) {
  const supabase = useRef(createSupabaseBrowserClient())
  const modalRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [messages, setMessages] = useState<TranscriptionMessage[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const hasRecording = Boolean(call.recordingUrl)

  // Mock duration in seconds (from call.duration MM:SS format)
  const durationParts = call.duration.split(':')
  const fallbackDurationSeconds =
    parseInt(durationParts[0]) * 60 + parseInt(durationParts[1])
  const totalSeconds = audioDuration > 0 ? audioDuration : fallbackDurationSeconds

  useEffect(() => {
    let isMounted = true

    async function hydrateTranscript() {
      try {
        const callId = Number(call.id)
        const immediateTranscript = asString(call.transcript).trim()
        if (immediateTranscript) {
          if (isMounted) setMessages(toMessages(immediateTranscript, call.summary || ''))
          return
        }

        if (Number.isNaN(callId)) {
          if (isMounted) setMessages(toMessages('', call.summary || ''))
          return
        }

        const [{ data: logData, error: logError }, { data: webhookRows, error: webhookError }] =
          await Promise.all([
            supabase.current
              .from('call_logs')
              .select('transcript_text, call_summary')
              .eq('call_id', callId)
              .maybeSingle(),
            supabase.current
              .from('webhook_events')
              .select('payload, received_at')
              .eq('related_call_id', callId)
              .order('received_at', { ascending: false })
              .limit(1)
          ])

        if (logError) throw logError
        if (webhookError) throw webhookError

        const logTranscript = asString(logData?.transcript_text).trim()
        const webhookPayload = safeJson(webhookRows?.[0]?.payload)
        const webhookTranscript = extractTranscriptFromPayload(webhookPayload)
        const transcriptText = logTranscript || webhookTranscript

        if (!isMounted) return
        setMessages(toMessages(transcriptText, call.summary || ''))
      } catch (error) {
        console.warn('TranscriptionModal hydration failed', error)
        if (isMounted) {
          setMessages(toMessages('', call.summary || ''))
        }
      }
    }

    void hydrateTranscript()
    return () => {
      isMounted = false
    }
  }, [call.id, call.summary, call.transcript])

  // Handle escape key and click outside
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.playbackRate = playbackSpeed
  }, [playbackSpeed])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.muted = isMuted
  }, [isMuted])

  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setAudioDuration(0)
  }, [call.id, call.recordingUrl])

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Toggle play/pause
  const togglePlay = async () => {
    if (!audioRef.current || !hasRecording) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.warn('TranscriptionModal playback failed', error)
      setIsPlaying(false)
    }
  }

  // Cycle playback speed
  const cycleSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 1.5
      if (prev === 1.5) return 2
      return 1
    })
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Get call date formatted
  const callDate = call.startedAt ? new Date(call.startedAt) : new Date()
  const durationSeconds = parseDurationToSeconds(call.duration)
  const endDate = new Date(callDate.getTime() + durationSeconds * 1000)
  const startTimeLabel = call.startedAt
    ? callDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : call.time
  const endTimeLabel = endDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
  const dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ]
  const formattedDate = `${dayNames[callDate.getDay()]} ${callDate.getDate()}/${(
    callDate.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}`

  return (
    <Portal>
      {/* Backdrop */}
      <div className='fixed inset-0 z-[9998] bg-black/30' />

      {/* Modal */}
      <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
        <div
          ref={modalRef}
          className='relative w-[min(32.3125rem,95vw)] max-h-[min(47.4375rem,90vh)] bg-white rounded-lg overflow-hidden shadow-xl flex flex-col'
          role='dialog'
          aria-modal='true'
          aria-labelledby='transcription-title'
        >
          {/* Header */}
          <header className='flex items-center justify-between px-8 h-14 border-b border-neutral-300 shrink-0'>
            <h2
              id='transcription-title'
              className='text-title-md font-medium text-neutral-900'
            >
              Transcripción
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='p-1 text-neutral-600 hover:text-neutral-900 transition-colors rounded hover:bg-neutral-100'
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-xl'>close</span>
            </button>
          </header>

          {/* Info Card - Fixed */}
          <div className='px-8 pt-6 pb-4 shrink-0'>
            <div className='bg-white rounded-lg p-4 shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1),-2px_-2px_4px_0px_rgba(0,0,0,0.05)]'>
              {/* Fecha */}
              <div className='flex items-start gap-16 mb-4'>
                <span className='text-body-md text-neutral-700 w-16'>
                  Fecha
                </span>
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <span className='material-symbols-rounded text-base text-neutral-900'>
                      calendar_month
                    </span>
                    <span className='text-body-sm text-neutral-900'>
                      {formattedDate}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='material-symbols-rounded text-base text-neutral-900'>
                      more_time
                    </span>
                    <span className='text-body-sm text-neutral-900'>
                      {startTimeLabel} - {endTimeLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Paciente */}
              <div className='flex items-center gap-16 mb-4'>
                <span className='text-body-md text-neutral-700 w-16'>
                  Paciente
                </span>
                <span className='text-body-md text-neutral-900'>
                  {call.patient ?? 'Desconocido'}
                </span>
              </div>

              {/* Motivo */}
              <div className='flex items-start gap-16'>
                <span className='text-body-md text-neutral-700 w-16 shrink-0'>
                  Motivo
                </span>
                <span className='text-body-md text-neutral-900'>
                  {CALL_INTENT_LABELS[call.intent]}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Transcription - Scrollable */}
          <div className='flex-1 overflow-y-auto px-8 pb-4 min-h-0'>
            <div className='flex flex-col gap-4'>
              {messages.map((message, index) => {
                const isAgent = message.sender === 'agent'

                // Group consecutive messages from same sender
                const prevMessage = messages[index - 1]
                const showSenderLabel =
                  !prevMessage || prevMessage.sender !== message.sender

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${
                      isAgent ? 'items-start' : 'items-end'
                    }`}
                  >
                    {/* Sender label (only for first message in group) */}
                    {showSenderLabel && isAgent && (
                      <div className='flex items-center gap-2 mb-2'>
                        {/* KliniKOS Logo */}
                        <div className='w-[18px] h-[18px] relative'>
                          <div className='absolute left-0 top-[9px] w-[8px] h-[8px] border-[1.5px] border-neutral-900 rounded-tl-[4px] rounded-tr-[2px] rounded-bl-[2px]' />
                          <div className='absolute left-[10px] top-0 w-[8px] h-[8px] border-[1.5px] border-neutral-900 rounded-tl-[4px] rounded-tr-[2px] rounded-bl-[2px] rotate-180' />
                          <div className='absolute left-[10px] top-[10px] w-[8px] h-[8px] bg-brand-500 rounded-tr-[6px] rounded-br-[6px] rounded-bl-[6px]' />
                          <div className='absolute left-0 top-0 w-[8px] h-[8px] border-[1.5px] border-neutral-900 rounded-tl-[4px] rounded-tr-[2px] rounded-bl-[2px]' />
                        </div>
                        <span className='text-body-md text-neutral-700'>
                          kliniKOS
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`max-w-[16rem] px-2 py-2 rounded-lg ${
                        isAgent
                          ? 'bg-neutral-600 text-neutral-50'
                          : 'bg-brand-100 text-neutral-900'
                      }`}
                    >
                      <p className='text-label-sm'>{message.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Audio Player - Fixed at bottom */}
          <div className='px-8 pb-6 pt-2 shrink-0'>
            <div className='bg-neutral-100 rounded-3xl px-3 py-2 flex items-center gap-3'>
              <audio
                ref={audioRef}
                src={call.recordingUrl ?? undefined}
                preload='metadata'
                onTimeUpdate={() =>
                  setCurrentTime(audioRef.current?.currentTime || 0)
                }
                onLoadedMetadata={() =>
                  setAudioDuration(audioRef.current?.duration || 0)
                }
                onEnded={() => setIsPlaying(false)}
                className='hidden'
              />

              {/* Play/Pause Button */}
              <button
                type='button'
                onClick={togglePlay}
                disabled={!hasRecording}
                className='w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:cursor-not-allowed disabled:opacity-40'
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                <span className='material-symbols-rounded text-xl'>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              {/* Speed Button */}
              <button
                type='button'
                onClick={cycleSpeed}
                disabled={!hasRecording}
                className='w-[2.125rem] h-8 flex items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-black/60 hover:bg-brand-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40'
                aria-label={`Velocidad ${playbackSpeed}x`}
              >
                {playbackSpeed}x
              </button>

              {/* Waveform */}
              <div className='flex-1 flex items-center gap-1 h-8 px-2'>
                {WAVEFORM_HEIGHTS.map((height, index) => {
                  const progress =
                    totalSeconds > 0 ? currentTime / totalSeconds : 0
                  const barProgress = index / WAVEFORM_HEIGHTS.length
                  const isPlayed = barProgress <= progress

                  return (
                    <div
                      key={index}
                      className={`w-0.5 rounded-sm transition-colors ${
                        isPlayed ? 'bg-brand-500' : 'bg-black/40'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  )
                })}
              </div>

              {/* Current Time */}
              <span className='text-sm text-black/60 font-normal tabular-nums min-w-[2rem]'>
                {formatTime(currentTime)}
              </span>

              {/* Volume Button */}
              <button
                type='button'
                onClick={toggleMute}
                disabled={!hasRecording}
                className='w-6 h-6 flex items-center justify-center text-black/60 hover:text-black transition-colors disabled:cursor-not-allowed disabled:opacity-40'
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                <span className='material-symbols-rounded text-xl'>
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
            </div>
            {!hasRecording && (
              <p className='mt-2 text-label-sm text-neutral-500'>
                Esta llamada no tiene audio disponible.
              </p>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
