'use client'

import Portal from '@/components/ui/Portal'
import { useEffect, useRef, useState } from 'react'
import CallStatusBadge from './CallStatusBadge'
import type { CallRecord } from './voiceAgentTypes'
import { CALL_INTENT_LABELS } from './voiceAgentTypes'

type ListenCallModalProps = {
  call: CallRecord
  onClose: () => void
}

// Waveform bar heights for visual representation
const WAVEFORM_HEIGHTS = [
  2, 8, 14, 4, 16, 14, 10, 10, 10, 10, 14, 10, 16, 10, 16, 16, 16, 10, 10, 16,
  16, 10, 16, 16, 16, 10, 4, 4, 2
]

/**
 * Listen Call Modal
 * Figma: 517 × 401px = 32.3125rem × 25.0625rem
 * Shows call details and audio player
 */
export default function ListenCallModal({
  call,
  onClose
}: ListenCallModalProps) {
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
    // TODO: Implement actual audio playback
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

  return (
    <Portal>
      {/* Backdrop */}
      <div className='fixed inset-0 z-[9998] bg-black/30' />

      {/* Modal */}
      <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
        <div
          ref={modalRef}
          className='relative w-[min(32.3125rem,95vw)] bg-white rounded-lg overflow-hidden shadow-xl'
          role='dialog'
          aria-modal='true'
          aria-labelledby='listen-call-title'
        >
          {/* Header */}
          <header className='flex items-center justify-between px-8 h-14 border-b border-neutral-300'>
            <h2
              id='listen-call-title'
              className='text-title-md font-medium text-neutral-900'
            >
              Llamada de {call.patient ?? 'Desconocido'}
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

          {/* Content */}
          <div className='px-8 py-6'>
            {/* Info Card */}
            <div className='bg-white rounded-lg p-4 shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1),-2px_-2px_4px_0px_rgba(0,0,0,0.05)]'>
              {/* Estado */}
              <div className='flex items-center justify-between mb-4'>
                <span className='text-body-md text-neutral-700'>Estado</span>
                <CallStatusBadge status={call.status} />
              </div>

              {/* Details */}
              <div className='flex flex-col gap-2'>
                {/* Hora */}
                <div className='flex items-center gap-16'>
                  <span className='text-body-md text-neutral-700 w-16'>
                    Hora
                  </span>
                  <span className='text-body-md text-neutral-900'>
                    {call.time}
                  </span>
                </div>

                {/* Paciente */}
                <div className='flex items-center gap-16'>
                  <span className='text-body-md text-neutral-700 w-16'>
                    Paciente
                  </span>
                  <span className='text-body-md text-neutral-900'>
                    {call.patient ?? 'Pendiente de asignar'}
                  </span>
                </div>

                {/* Teléfono */}
                <div className='flex items-center gap-16'>
                  <span className='text-body-md text-neutral-700 w-16'>
                    Teléfono
                  </span>
                  <span className='text-body-md text-neutral-900'>
                    {call.phone}
                  </span>
                </div>

                {/* Motivo/Intención */}
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

            {/* Audio Player */}
            <div className='mt-6 bg-neutral-100 rounded-3xl px-3 py-2 flex items-center gap-3'>
              {/* Play/Pause Button */}
              <button
                type='button'
                onClick={togglePlay}
                className='w-8 h-8 flex items-center justify-center rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors'
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
                  // Calculate if this bar should be "played"
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
