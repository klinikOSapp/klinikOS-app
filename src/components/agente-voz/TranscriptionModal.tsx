'use client'

import Portal from '@/components/ui/Portal'
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

const MOCK_TRANSCRIPTION: TranscriptionMessage[] = [
  { id: '1', sender: 'agent', text: 'Hola Buenos días, Clínica Belén.' },
  { id: '2', sender: 'agent', text: '¿En qué puedo ayudarle?' },
  {
    id: '3',
    sender: 'patient',
    text: 'Hola Buenos días, llamo porque desde hace unos días siento muchas molestias en la muela.'
  },
  { id: '4', sender: 'patient', text: 'Creo que puedo tenerlo infectado' },
  {
    id: '5',
    sender: 'agent',
    text: 'Entiendo, lamento escuchar eso. ¿Podría darme su nombre completo para buscar su historial?'
  },
  { id: '6', sender: 'patient', text: 'Sí, soy Carlos Martínez Pérez' },
  {
    id: '7',
    sender: 'agent',
    text: 'Perfecto, Carlos. He encontrado su historial. Veo que hace tiempo que no nos visita.'
  },
  {
    id: '8',
    sender: 'agent',
    text: '¿Le parece bien si le agendo una cita de urgencia para hoy a las 17:00?'
  },
  { id: '9', sender: 'patient', text: 'Sí, perfecto. Muchas gracias.' },
  {
    id: '10',
    sender: 'agent',
    text: 'Listo, le he agendado la cita. Le llegará un SMS de confirmación. ¡Que se mejore!'
  }
]

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
  const modalRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // Mock duration in seconds (from call.duration MM:SS format)
  const durationParts = call.duration.split(':')
  const totalSeconds =
    parseInt(durationParts[0]) * 60 + parseInt(durationParts[1])

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

  // Format time as M:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying)
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

  // Get current date formatted
  const today = new Date()
  const dayNames = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ]
  const formattedDate = `${dayNames[today.getDay()]} ${today.getDate()}/${(
    today.getMonth() + 1
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
                      {call.time} - {call.time.split(':')[0]}:
                      {(parseInt(call.time.split(':')[1]) + 30)
                        .toString()
                        .padStart(2, '0')}
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
              {MOCK_TRANSCRIPTION.map((message, index) => {
                const isAgent = message.sender === 'agent'

                // Group consecutive messages from same sender
                const prevMessage = MOCK_TRANSCRIPTION[index - 1]
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
              {/* Play/Pause Button */}
              <button
                type='button'
                onClick={togglePlay}
                className='w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-400 transition-colors'
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
                className='w-[2.125rem] h-8 flex items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-black/60 hover:bg-brand-200 transition-colors'
                aria-label={`Velocidad ${playbackSpeed}x`}
              >
                {playbackSpeed}x
              </button>

              {/* Waveform */}
              <div className='flex-1 flex items-center gap-1 h-8 px-2'>
                {WAVEFORM_HEIGHTS.map((height, index) => {
                  const progress = currentTime / totalSeconds
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
                className='w-6 h-6 flex items-center justify-center text-black/60 hover:text-black transition-colors'
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                <span className='material-symbols-rounded text-xl'>
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
