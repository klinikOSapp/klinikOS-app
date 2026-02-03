'use client'

import Portal from '@/components/ui/Portal'
import { useEffect, useRef } from 'react'
import type { CallRecord, VoiceAgentTier } from './voiceAgentTypes'
import {
  CALL_INTENT_LABELS,
  SENTIMENT_LABELS,
  isAppointmentIntent
} from './voiceAgentTypes'

type CallDetailModalProps = {
  call: CallRecord
  onClose: () => void
  onCall?: () => void
  /** Callback to create a new appointment with pre-filled data from the call */
  onCreateAppointment?: (prefill: {
    paciente?: string
    pacientePhone?: string
    observaciones?: string
    createdByVoiceAgent?: boolean
    voiceAgentCallId?: string
  }) => void
  /** Callback to view the linked appointment in the agenda */
  onViewAppointment?: (appointmentId: string) => void
  /** Voice agent tier - determines which actions/sections are shown */
  voiceAgentTier?: VoiceAgentTier
  /** Callback to mark call as resolved (for basic mode) */
  onMarkResolved?: () => void
}

// Timeline steps for the call process
type TimelineStep = {
  id: string
  label: string
  timestamp: string
  completed: boolean
}

const MOCK_TIMELINE: TimelineStep[] = [
  { id: '1', label: 'Llamada recibida', timestamp: '21:00', completed: true },
  {
    id: '2',
    label: 'Intención detectada',
    timestamp: '21:03',
    completed: true
  },
  {
    id: '3',
    label: 'Paciente identificado',
    timestamp: '21:04',
    completed: true
  },
  {
    id: '4',
    label: 'Preferencias capturadas',
    timestamp: '21:05',
    completed: true
  },
  { id: '5', label: 'Huecos verificados', timestamp: '21:06', completed: true },
  {
    id: '6',
    label: 'Cita propuesta y aceptada',
    timestamp: '21:08',
    completed: true
  },
  {
    id: '7',
    label: 'Confirmación enviada',
    timestamp: '21:09',
    completed: true
  },
  { id: '8', label: 'Llamada finalizada', timestamp: '21:12', completed: true }
]

// Communication checkboxes
type CommunicationItem = {
  id: string
  label: string
  timestamp: string
  checked: boolean
}

const MOCK_COMMUNICATIONS: CommunicationItem[] = [
  {
    id: '1',
    label: 'SMS confirmación enviado',
    timestamp: '21:10',
    checked: true
  },
  {
    id: '2',
    label: 'Email confirmación enviado',
    timestamp: '21:10',
    checked: true
  },
  {
    id: '3',
    label: 'SMS recordatorio programado',
    timestamp: 'Mañana 9:00',
    checked: true
  }
]

/**
 * Call Detail Modal
 * Figma: 874 × 802px = 54.625rem × 50.125rem
 * Shows complete call details with timeline, patient info, and actions
 *
 * Supports two tiers:
 * - basic: Receptionist mode - no appointment sections, simpler footer
 * - advanced: Full mode - appointment info, create/view appointment buttons
 */
export default function CallDetailModal({
  call,
  onClose,
  onCall,
  onCreateAppointment,
  onViewAppointment,
  voiceAgentTier = 'advanced',
  onMarkResolved
}: CallDetailModalProps) {
  // Check if we're in basic mode (receptionist - no auto appointments)
  const isBasicMode = voiceAgentTier === 'basic'

  // Determinar si la intención es de pedir cita (cita ya creada automáticamente por el agente)
  // - Si es true: intenciones pedir_cita_higiene, urgencia_dolor, consulta_general → mostrar "Ver en agenda"
  // - Si es false: intenciones cancelar_cita, confirmar_cita, consulta_financiacion → mostrar "Crear cita"
  // Only relevant in advanced mode
  const canCreateAppointment = !isBasicMode && isAppointmentIntent(call.intent)

  // Build reason/notes from call intent and summary
  const appointmentReason = `${CALL_INTENT_LABELS[call.intent]}${
    call.summary ? ` - ${call.summary}` : ''
  }`

  // Handler to create appointment with pre-filled data
  const handleCreateAppointment = () => {
    if (onCreateAppointment) {
      onCreateAppointment({
        paciente: call.patient ?? undefined,
        pacientePhone: call.phone,
        observaciones: appointmentReason,
        createdByVoiceAgent: true,
        voiceAgentCallId: call.id
      })
      onClose() // Close modal after triggering creation
    }
  }

  // Handler to view linked appointment
  const handleViewAppointment = () => {
    if (call.appointmentId && onViewAppointment) {
      onViewAppointment(call.appointmentId)
      onClose()
    }
  }
  const modalRef = useRef<HTMLDivElement>(null)

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

  // Get formatted date
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
          className='relative w-[min(54.625rem,95vw)] max-h-[min(50.125rem,90vh)] bg-white rounded-lg overflow-hidden shadow-xl flex flex-col'
          role='dialog'
          aria-modal='true'
          aria-labelledby='call-detail-title'
        >
          {/* Header */}
          <header className='flex items-center justify-between px-8 h-14 border-b border-neutral-300 shrink-0'>
            <h2
              id='call-detail-title'
              className='text-title-md font-medium text-neutral-900'
            >
              {isBasicMode ? 'Detalle de llamada' : 'Detalle de cita agendada'}
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
          <div className='flex-1 overflow-y-auto'>
            <div className='flex min-h-full'>
              {/* Left Column - Timeline */}
              <div className='w-[17rem] p-8 border-r border-neutral-300 shrink-0'>
                <div className='flex flex-col'>
                  {MOCK_TIMELINE.map((step, index) => (
                    <div key={step.id} className='flex gap-3'>
                      {/* Timeline indicator */}
                      <div className='flex flex-col items-center'>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            step.completed
                              ? 'bg-brand-500 text-white'
                              : 'bg-neutral-200 text-neutral-500'
                          }`}
                        >
                          <span className='material-symbols-rounded text-base'>
                            {step.completed ? 'check_circle' : 'circle'}
                          </span>
                        </div>
                        {index < MOCK_TIMELINE.length - 1 && (
                          <div className='w-0.5 h-6 bg-neutral-300' />
                        )}
                      </div>

                      {/* Step content */}
                      <div className='pb-6'>
                        <p className='text-title-sm font-medium text-neutral-900'>
                          {step.label}
                        </p>
                        <p className='text-label-sm text-neutral-900'>
                          {step.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Call stats */}
                <div className='mt-4 pt-4 border-t border-neutral-200'>
                  <div className='mb-4'>
                    <p className='text-body-md text-neutral-700'>Duración</p>
                    <p className='text-body-md text-neutral-900'>
                      {call.duration}
                    </p>
                  </div>
                  <div>
                    <p className='text-body-md text-neutral-700'>Sentimiento</p>
                    <p className='text-body-md text-neutral-900'>
                      {SENTIMENT_LABELS[call.sentiment]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className='flex-1 p-8'>
                {/* Patient Info */}
                <div className='flex gap-6 mb-8'>
                  {/* Avatar placeholder */}
                  <div className='w-24 h-24 rounded-full bg-neutral-600 shrink-0 flex items-center justify-center'>
                    <span className='material-symbols-rounded text-4xl text-white'>
                      person
                    </span>
                  </div>

                  {/* Patient details */}
                  <div className='flex flex-col gap-2'>
                    <h3 className='text-2xl font-medium text-neutral-900'>
                      {call.patient ?? 'Paciente desconocido'}
                    </h3>
                    <div className='flex items-center gap-2'>
                      <span className='material-symbols-rounded text-xl text-neutral-600'>
                        mail
                      </span>
                      <span className='text-body-md text-neutral-900'>
                        ejemplo@gmail.com
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='material-symbols-rounded text-xl text-neutral-600'>
                        call
                      </span>
                      <span className='text-body-md text-neutral-900'>
                        {call.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Appointment Info - Only shown in advanced mode */}
                {!isBasicMode && (
                  <div className='mb-6'>
                    <h4 className='text-title-sm font-medium text-neutral-900 mb-4'>
                      Información de la cita
                    </h4>
                    <div className='bg-white rounded-lg p-4'>
                      {/* Fecha */}
                      <div className='flex items-center gap-10 mb-4'>
                        <span className='text-body-md text-neutral-700 w-24'>
                          Fecha
                        </span>
                        <div className='flex items-center gap-8'>
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

                      {/* Duración */}
                      <div className='flex items-center gap-10 mb-4'>
                        <span className='text-body-md text-neutral-700 w-24'>
                          Duración
                        </span>
                        <span className='text-body-md text-neutral-900'>
                          30 minutos
                        </span>
                      </div>

                      {/* Profesional */}
                      <div className='flex items-center gap-10'>
                        <span className='text-body-md text-neutral-700 w-24'>
                          Profesional
                        </span>
                        <span className='text-body-md text-neutral-900'>
                          Carlos Martínez - odontólogo
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Call Info - Only shown in basic mode */}
                {isBasicMode && (
                  <div className='mb-6'>
                    <h4 className='text-title-sm font-medium text-neutral-900 mb-4'>
                      Información de la llamada
                    </h4>
                    <div className='bg-neutral-50 rounded-lg p-4'>
                      {/* Hora de llamada */}
                      <div className='flex items-center gap-10 mb-4'>
                        <span className='text-body-md text-neutral-700 w-24'>
                          Hora
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='material-symbols-rounded text-base text-neutral-900'>
                            schedule
                          </span>
                          <span className='text-body-sm text-neutral-900'>
                            {call.time}
                          </span>
                        </div>
                      </div>

                      {/* Duración de la llamada */}
                      <div className='flex items-center gap-10 mb-4'>
                        <span className='text-body-md text-neutral-700 w-24'>
                          Duración
                        </span>
                        <span className='text-body-md text-neutral-900'>
                          {call.duration}
                        </span>
                      </div>

                      {/* Teléfono */}
                      <div className='flex items-center gap-10'>
                        <span className='text-body-md text-neutral-700 w-24'>
                          Teléfono
                        </span>
                        <span className='text-body-md text-neutral-900'>
                          {call.phone}
                        </span>
                      </div>
                    </div>

                    {/* Basic mode info banner */}
                    <div className='mt-4 p-3 bg-brand-50 border border-brand-200 rounded-lg flex items-start gap-3'>
                      <span className='material-symbols-rounded text-lg text-brand-600 shrink-0 mt-0.5'>
                        info
                      </span>
                      <p className='text-body-sm text-brand-800'>
                        Llama al paciente para agendar la cita manualmente. Una
                        vez gestionada, marca la llamada como resuelta.
                      </p>
                    </div>
                  </div>
                )}

                {/* Motivo */}
                <div className='mb-6'>
                  <h4 className='text-title-sm font-medium text-neutral-900 mb-4'>
                    Motivo
                  </h4>
                  <p className='text-body-md text-neutral-900'>
                    {CALL_INTENT_LABELS[call.intent]}
                    {call.summary && ` - ${call.summary}`}
                  </p>
                </div>

                {/* Comunicaciones */}
                <div>
                  <h4 className='text-title-sm font-medium text-neutral-900 mb-4'>
                    Comunicaciones
                  </h4>
                  <div className='flex flex-col gap-3'>
                    {MOCK_COMMUNICATIONS.map((comm) => (
                      <div key={comm.id} className='flex items-start gap-3'>
                        <span
                          className={`material-symbols-rounded text-xl ${
                            comm.checked ? 'text-brand-500' : 'text-neutral-400'
                          }`}
                        >
                          {comm.checked
                            ? 'check_box'
                            : 'check_box_outline_blank'}
                        </span>
                        <div>
                          <p className='text-body-md text-neutral-900'>
                            {comm.label}
                          </p>
                          <p className='text-xs font-medium text-neutral-600'>
                            {comm.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className='flex items-center justify-end gap-4 px-8 py-4 border-t border-neutral-300 shrink-0'>
            {isBasicMode ? (
              <>
                {/* Basic mode: Cerrar, Marcar como resuelta, Llamar */}
                <button
                  type='button'
                  onClick={onClose}
                  className='text-title-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors'
                >
                  Cerrar
                </button>
                <button
                  type='button'
                  onClick={() => {
                    onMarkResolved?.()
                    onClose()
                  }}
                  disabled={call.status === 'resuelta'}
                  className='px-4 py-2 bg-success-100 border border-success-300 text-success-800 font-medium rounded-full hover:bg-success-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='material-symbols-rounded text-xl'>
                    check_circle
                  </span>
                  <span>Marcar como resuelta</span>
                </button>
                <button
                  type='button'
                  onClick={onCall}
                  className='px-4 py-2 bg-brand-400 border border-neutral-300 text-neutral-900 font-medium rounded-full hover:bg-brand-500 transition-colors flex items-center gap-2'
                >
                  <span className='material-symbols-rounded text-xl'>call</span>
                  <span>Llamar</span>
                </button>
              </>
            ) : canCreateAppointment ? (
              <>
                {/* Advanced mode: Intención de pedir cita = cita ya creada automáticamente por el agente */}
                <button
                  type='button'
                  onClick={onClose}
                  className='text-title-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors'
                >
                  Cerrar
                </button>
                <button
                  type='button'
                  onClick={handleViewAppointment}
                  className='px-4 py-2 bg-brand-400 border border-neutral-300 text-neutral-900 font-medium rounded-full hover:bg-brand-500 transition-colors flex items-center gap-2'
                >
                  <span className='material-symbols-rounded text-xl'>
                    calendar_month
                  </span>
                  <span>Ver en agenda</span>
                </button>
                <button
                  type='button'
                  onClick={onCall}
                  className='px-4 py-2 bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium rounded-full hover:bg-neutral-100 transition-colors flex items-center gap-2'
                >
                  <span className='material-symbols-rounded text-xl'>call</span>
                  <span>Llamar</span>
                </button>
              </>
            ) : (
              <>
                {/* Advanced mode: Otras intenciones = no hay cita, permite crear manualmente */}
                <button
                  type='button'
                  onClick={onClose}
                  className='text-title-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors'
                >
                  Cerrar
                </button>
                <button
                  type='button'
                  onClick={handleCreateAppointment}
                  disabled={!onCreateAppointment}
                  className='px-4 py-2 bg-brand-400 border border-neutral-300 text-neutral-900 font-medium rounded-full hover:bg-brand-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='material-symbols-rounded text-xl'>
                    add_circle
                  </span>
                  <span>Crear cita</span>
                </button>
                <button
                  type='button'
                  onClick={onCall}
                  className='px-4 py-2 bg-neutral-50 border border-neutral-300 text-neutral-900 font-medium rounded-full hover:bg-neutral-100 transition-colors flex items-center gap-2'
                >
                  <span className='material-symbols-rounded text-xl'>call</span>
                  <span>Llamar</span>
                </button>
              </>
            )}
          </footer>
        </div>
      </div>
    </Portal>
  )
}
