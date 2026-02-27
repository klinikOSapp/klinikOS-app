'use client'

import { useRef, useState } from 'react'
import AudioWaveform from './AudioWaveform'
import type { CallRecord, CallStatus, VoiceAgentTier } from './voiceAgentTypes'
import { SENTIMENT_LABELS, isAppointmentIntent } from './voiceAgentTypes'

function formatCardDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Hoy'
  if (date.getTime() === yesterday.getTime()) return 'Ayer'

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  })
}

type CallCardProps = {
  call: CallRecord
  onCall: () => void
  onMarkResolved: () => void
  onAddNote: () => void
  onShowDetail: () => void
  // Quick actions (advanced mode)
  onViewAppointment?: () => void
  onCreateAppointment?: () => void
  onListenCall?: () => void
  onViewTranscription?: () => void
  onAssignProfessional?: () => void
  voiceAgentTier?: VoiceAgentTier
}

// Status header background colors matching Figma
const STATUS_HEADER_COLORS: Record<CallStatus, string> = {
  nueva: 'bg-[#e2e7ea]', // Neutral/200
  urgente: 'bg-[#f7b7ba]', // Error/200
  resuelta: 'bg-[#a0e3c3]', // Success/200
  pendiente: 'bg-[#e2e7ea]', // Same as nueva
  en_curso: 'bg-brand-100'
}

// Status labels for display
const STATUS_LABELS: Record<CallStatus, string> = {
  nueva: 'Nueva',
  urgente: 'Urgente',
  resuelta: 'Resuelta',
  pendiente: 'Pendiente',
  en_curso: 'En curso'
}

// Quick action item type
type QuickActionItem = {
  id: string
  label: string
  icon: string
  onClick: () => void
}

/**
 * CallCard Component
 * Individual call card for the cards view - 4 per row
 */
export default function CallCard({
  call,
  onCall,
  onMarkResolved,
  onAddNote,
  onShowDetail,
  onViewAppointment,
  onCreateAppointment,
  onListenCall,
  onViewTranscription,
  onAssignProfessional,
  voiceAgentTier = 'advanced'
}: CallCardProps) {
  const dateLabel = formatCardDate(call.date)

  // Quick actions menu state
  const [showQuickActions, setShowQuickActions] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Build quick actions list
  const getQuickActions = (): QuickActionItem[] => {
    const actions: QuickActionItem[] = [
      { id: 'call', label: 'Llamar', icon: 'call', onClick: onCall }
    ]

    // Only show appointment actions in advanced mode
    if (voiceAgentTier === 'advanced') {
      const isCreatingIntent = isAppointmentIntent(call.intent)
      if (isCreatingIntent && onViewAppointment) {
        actions.push({
          id: 'view-appointment',
          label: 'Ver en agenda',
          icon: 'calendar_month',
          onClick: onViewAppointment
        })
      } else if (onCreateAppointment) {
        actions.push({
          id: 'create-appointment',
          label: 'Crear cita',
          icon: 'add_circle',
          onClick: onCreateAppointment
        })
      }
    }

    // Common actions
    actions.push({
      id: 'mark-resolved',
      label: 'Marcar resuelta',
      icon: 'check_box',
      onClick: onMarkResolved
    })

    if (onListenCall) {
      actions.push({
        id: 'listen-call',
        label: 'Escuchar llamada',
        icon: 'adaptive_audio_mic',
        onClick: onListenCall
      })
    }

    if (onViewTranscription) {
      actions.push({
        id: 'transcription',
        label: 'Transcripción',
        icon: 'dictionary',
        onClick: onViewTranscription
      })
    }

    if (onAssignProfessional) {
      actions.push({
        id: 'assign-professional',
        label: 'Asignar profesional',
        icon: 'person_add',
        onClick: onAssignProfessional
      })
    }

    actions.push({
      id: 'more-info',
      label: 'Más información',
      icon: 'info',
      onClick: onShowDetail
    })

    return actions
  }

  return (
    <div
      className='w-full h-[24.5rem] bg-white rounded-xl overflow-hidden relative cursor-pointer shadow-sm border border-neutral-200 hover:shadow-lg hover:border-neutral-300 transition-all duration-200 flex flex-col'
      onClick={onShowDetail}
    >
      {/* Header - 48px */}
      <div
        className={`h-12 px-4 flex items-center justify-between shrink-0 ${
          STATUS_HEADER_COLORS[call.status]
        }`}
      >
        {/* Left: Status + Timestamp */}
        <div className='flex items-baseline gap-2'>
          <span className='text-lg font-medium text-[#24282c]'>
            {STATUS_LABELS[call.status]}
          </span>
          <span className='text-xs text-[#24282c]/60'>
            {dateLabel} · {call.time}
          </span>
        </div>

        {/* Right: Duration + Quick Actions */}
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1.5 bg-white/50 rounded-full px-2.5 py-1'>
            <span className='material-symbols-rounded text-sm text-[#24282c]/80'>
              avg_pace
            </span>
            <span className='text-xs font-medium text-[#24282c]'>
              {call.duration}
            </span>
          </div>

          {/* Quick Actions Button */}
          <div className='relative'>
            <button
              ref={menuButtonRef}
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                setShowQuickActions(!showQuickActions)
              }}
              className='w-7 h-7 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors'
              aria-label='Acciones rápidas'
            >
              <span className='material-symbols-rounded text-lg text-[#24282c]'>
                more_vert
              </span>
            </button>

            {/* Quick Actions Menu */}
            {showQuickActions && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className='fixed inset-0 z-40'
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowQuickActions(false)
                  }}
                />
                <div
                  className='absolute right-0 top-full mt-1 z-50 min-w-[13rem] overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg'
                  onClick={(e) => e.stopPropagation()}
                >
                  {getQuickActions().map((action) => (
                    <button
                      key={action.id}
                      type='button'
                      onClick={() => {
                        action.onClick()
                        setShowQuickActions(false)
                      }}
                      className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-neutral-800 transition-colors hover:bg-neutral-100'
                    >
                      <span className='material-symbols-rounded text-xl text-neutral-600'>
                        {action.icon}
                      </span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content - Scrollable with visible scrollbar */}
      <div className='flex-1 min-h-0 overflow-y-auto px-4 pb-16 card-scrollbar'>
        {/* Info Row - 3 columns */}
        <div className='flex items-start justify-between pt-4 gap-2'>
          {/* Teléfono */}
          <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
            <div className='flex items-center gap-1'>
              <span className='material-symbols-rounded text-sm text-[#6d7783]'>
                call
              </span>
              <span className='text-xs text-[#6d7783]'>Teléfono</span>
            </div>
            <span className='text-sm font-medium text-[#24282c] truncate'>
              {call.phone.replace('+34 ', '')}
            </span>
          </div>

          {/* Nombre */}
          <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
            <div className='flex items-center gap-1'>
              <span className='material-symbols-rounded text-sm text-[#6d7783]'>
                person
              </span>
              <span className='text-xs text-[#6d7783]'>Nombre</span>
            </div>
            <span className='text-sm font-medium text-[#24282c] truncate'>
              {call.patient ?? 'Sin asignar'}
            </span>
          </div>

          {/* Valoración */}
          <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
            <div className='flex items-center gap-1'>
              <span className='material-symbols-rounded text-sm text-[#6d7783]'>
                sentiment_satisfied
              </span>
              <span className='text-xs text-[#6d7783]'>Valoración</span>
            </div>
            <span className='text-sm font-medium text-[#24282c] truncate'>
              {SENTIMENT_LABELS[call.sentiment]}
            </span>
          </div>
        </div>

        {/* Motivo de llamada */}
        <div className='flex flex-col gap-1.5 mt-5'>
          <span className='text-xs text-[#6d7783]'>Motivo de llamada</span>
          <p className='text-sm text-[#24282c] leading-relaxed'>
            {call.summary}
          </p>
        </div>

        {/* Nivel de urgencia */}
        <div className='flex flex-col gap-1.5 mt-4'>
          <span className='text-xs text-[#6d7783]'>Nivel de urgencia</span>
          <span
            className={`text-sm font-medium ${
              call.status === 'urgente' ? 'text-error-600' : 'text-[#24282c]'
            }`}
          >
            {call.status === 'urgente'
              ? 'Alta - Requiere llamada inmediata'
              : 'Normal'}
          </span>
        </div>

        {/* Audio Player */}
        <div className='mt-4' onClick={(e) => e.stopPropagation()}>
          <AudioWaveform duration={call.duration} />
        </div>

        {/* Transcript link */}
        {onViewTranscription && (
          <button
            type='button'
            className='mt-2 text-xs text-[#6d7783] underline underline-offset-2 hover:text-brand-600 transition-colors'
            onClick={(e) => {
              e.stopPropagation()
              onViewTranscription()
            }}
          >
            Mostrar transcripción completa
          </button>
        )}
      </div>

      {/* Footer Actions - Glassmorphism */}
      <div
        className='absolute bottom-0 left-0 right-0 px-3 py-3 flex items-center justify-between gap-2 backdrop-blur-md bg-white/80 border-t border-neutral-200'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resuelta toggle */}
        <button
          type='button'
          onClick={onMarkResolved}
          className={`text-sm font-medium transition-colors flex items-center gap-1 ${
            call.status === 'resuelta'
              ? 'text-success-600'
              : 'text-[#24282c] hover:text-success-600'
          }`}
        >
          <span className='material-symbols-rounded text-lg'>
            {call.status === 'resuelta'
              ? 'check_circle'
              : 'radio_button_unchecked'}
          </span>
          <span className='hidden xl:inline'>Resuelta</span>
        </button>

        {/* Añadir nota */}
        <button
          type='button'
          onClick={onAddNote}
          className='px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm font-medium text-[#24282c] transition-colors'
        >
          Añadir nota
        </button>

        {/* Llamar */}
        <button
          type='button'
          onClick={onCall}
          className='px-3 py-1.5 bg-brand-400 hover:bg-brand-500 rounded-full text-sm font-medium text-[#24282c] transition-colors flex items-center gap-1.5'
        >
          <span className='material-symbols-rounded text-lg'>call</span>
          <span>Llamar</span>
        </button>
      </div>
    </div>
  )
}
