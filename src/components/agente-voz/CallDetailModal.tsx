'use client'

import Portal from '@/components/ui/Portal'
import { useEffect, useMemo, useRef } from 'react'
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

type TimelineStep = {
  id: string
  label: string
  timestamp: string
  completed: boolean
}
type CommunicationItem = {
  id: string
  label: string
  timestamp: string
  checked: boolean
}

function addMinutes(time: string, deltaMinutes: number): string {
  const [h, m] = time.split(':').map((v) => Number(v))
  if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(deltaMinutes)) return time
  const total = h * 60 + deltaMinutes + m
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(normalized / 60)
  const mm = normalized % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

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
  const displayIntent = call.intentDisplay?.trim() || CALL_INTENT_LABELS[call.intent]

  // Determinar si la intención es de pedir cita (cita ya creada automáticamente por el agente)
  // - Si es true: intenciones pedir_cita_higiene, urgencia_dolor, consulta_general → mostrar "Ver en agenda"
  // - Si es false: intenciones cancelar_cita, confirmar_cita, consulta_financiacion → mostrar "Crear cita"
  // Only relevant in advanced mode
  const canCreateAppointment = !isBasicMode && isAppointmentIntent(call.intent)

  const timeline = useMemo<TimelineStep[]>(() => {
    const resolved = call.status === 'resuelta'
    const inProgress = call.status === 'en_curso'
    const appointmentCreated = Boolean(call.appointmentId)
    const hasPatient = Boolean(call.patient)
    const durationParts = call.duration.split(':')
    const durationMins = Number(durationParts[0] || 0)

    return [
      { id: '1', label: 'Llamada recibida', timestamp: call.time, completed: true },
      {
        id: '2',
        label: 'Intención detectada',
        timestamp: addMinutes(call.time, 1),
        completed: true
      },
      {
        id: '3',
        label: hasPatient ? 'Paciente identificado' : 'Paciente por identificar',
        timestamp: addMinutes(call.time, 2),
        completed: hasPatient
      },
      {
        id: '4',
        label: appointmentCreated ? 'Cita vinculada' : 'Gestión registrada',
        timestamp: addMinutes(call.time, 3),
        completed: appointmentCreated || resolved || inProgress
      },
      {
        id: '5',
        label: resolved ? 'Llamada finalizada' : 'Seguimiento pendiente',
        timestamp: addMinutes(call.time, Math.max(durationMins, 1)),
        completed: resolved
      }
    ]
  }, [call.appointmentId, call.duration, call.patient, call.status, call.time])

  const communications = useMemo<CommunicationItem[]>(() => {
    const resolved = call.status === 'resuelta'
    const urgent = call.status === 'urgente'
    const appointmentCreated = Boolean(call.appointmentId)
    return [
      {
        id: '1',
        label: 'Resumen de llamada generado',
        timestamp: addMinutes(call.time, 1),
        checked: Boolean(call.summary)
      },
      {
        id: '2',
        label: appointmentCreated ? 'Cita enviada a agenda' : 'Sin cita vinculada',
        timestamp: addMinutes(call.time, 3),
        checked: appointmentCreated
      },
      {
        id: '3',
        label: urgent ? 'Marcada como urgente' : 'Sin alerta urgente',
        timestamp: resolved ? addMinutes(call.time, 4) : 'Pendiente',
        checked: urgent
      }
    ]
  }, [call.appointmentId, call.status, call.summary, call.time])

  // Build reason/notes from call intent and summary
  const appointmentReason = `${displayIntent}${
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
          <header className='flex items-center justify-between px-8 h-16 border-b border-neutral-200 shrink-0 bg-gradient-to-r from-neutral-50 to-white'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center'>
                <span className='material-symbols-rounded text-xl text-brand-600'>
                  {isBasicMode ? 'call' : 'event_available'}
                </span>
              </div>
              <div>
                <h2
                  id='call-detail-title'
                  className='text-lg font-semibold text-neutral-900'
                >
                  {isBasicMode
                    ? 'Detalle de llamada'
                    : 'Detalle de cita agendada'}
                </h2>
                <p className='text-xs text-neutral-500'>
                  {formattedDate} · {call.time}
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100'
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-xl'>close</span>
            </button>
          </header>

          {/* Content */}
          <div className='flex-1 overflow-y-auto'>
            <div className='flex min-h-full'>
              {/* Left Column - Timeline */}
              <div className='w-[17rem] p-6 border-r border-neutral-200 shrink-0 bg-neutral-50/50'>
                <h4 className='text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4'>
                  Proceso de la llamada
                </h4>
                <div className='flex flex-col'>
                  {timeline.map((step, index) => (
                    <div key={step.id} className='flex gap-3'>
                      {/* Timeline indicator */}
                      <div className='flex flex-col items-center'>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
                            step.completed
                              ? 'bg-gradient-to-br from-brand-400 to-brand-500 text-white'
                              : 'bg-neutral-200 text-neutral-400'
                          }`}
                        >
                          <span className='material-symbols-rounded text-[1rem]'>
                            {step.completed ? 'check' : 'circle'}
                          </span>
                        </div>
                        {index < timeline.length - 1 && (
                          <div
                            className={`w-0.5 h-5 ${
                              step.completed ? 'bg-brand-300' : 'bg-neutral-300'
                            }`}
                          />
                        )}
                      </div>

                      {/* Step content */}
                      <div className='pb-4 pt-0.5'>
                        <p className='text-sm font-medium text-neutral-800 leading-tight'>
                          {step.label}
                        </p>
                        <p className='text-xs text-neutral-500 mt-0.5'>
                          {step.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Call stats */}
                <div className='mt-4 pt-4 border-t border-neutral-200 space-y-3'>
                  <div className='flex items-center justify-between p-2.5 bg-white rounded-lg border border-neutral-200'>
                    <div className='flex items-center gap-2'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        timer
                      </span>
                      <span className='text-sm text-neutral-600'>Duración</span>
                    </div>
                    <span className='text-sm font-semibold text-neutral-900'>
                      {call.duration}
                    </span>
                  </div>
                  <div className='flex items-center justify-between p-2.5 bg-white rounded-lg border border-neutral-200'>
                    <div className='flex items-center gap-2'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        sentiment_satisfied
                      </span>
                      <span className='text-sm text-neutral-600'>
                        Sentimiento
                      </span>
                    </div>
                    <span className='text-sm font-semibold text-neutral-900'>
                      {SENTIMENT_LABELS[call.sentiment]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className='flex-1 p-6'>
                {/* Patient Info Card */}
                <div className='flex gap-5 mb-6 p-4 bg-gradient-to-br from-neutral-50 to-white rounded-xl border border-neutral-200'>
                  {/* Avatar */}
                  <div className='w-20 h-20 rounded-2xl bg-gradient-to-br from-neutral-600 to-neutral-700 shrink-0 flex items-center justify-center shadow-lg'>
                    <span className='material-symbols-rounded text-3xl text-white'>
                      person
                    </span>
                  </div>

                  {/* Patient details */}
                  <div className='flex flex-col justify-center gap-1.5 min-w-0'>
                    <h3 className='text-xl font-semibold text-neutral-900 truncate'>
                      {call.patient ?? 'Paciente desconocido'}
                    </h3>
                    <div className='flex items-center gap-4'>
                      <div className='flex items-center gap-1.5 text-neutral-600'>
                        <span className='material-symbols-rounded text-lg'>
                          mail
                        </span>
                        <span className='text-sm'>ejemplo@gmail.com</span>
                      </div>
                      <div className='flex items-center gap-1.5 text-neutral-600'>
                        <span className='material-symbols-rounded text-lg'>
                          call
                        </span>
                        <span className='text-sm font-medium'>
                          {call.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment Info - Only shown in advanced mode */}
                {!isBasicMode && (
                  <div className='mb-5'>
                    <h4 className='text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3'>
                      Información de la cita
                    </h4>
                    <div className='bg-brand-50/50 rounded-xl p-4 border border-brand-100'>
                      <div className='grid grid-cols-2 gap-4'>
                        {/* Fecha y Hora */}
                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-xl text-brand-600'>
                              calendar_month
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>Fecha</p>
                            <p className='text-sm font-medium text-neutral-900'>
                              {formattedDate}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-xl text-brand-600'>
                              schedule
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>Hora</p>
                            <p className='text-sm font-medium text-neutral-900'>
                              {call.time} - {call.time.split(':')[0]}:
                              {(parseInt(call.time.split(':')[1]) + 30)
                                .toString()
                                .padStart(2, '0')}
                            </p>
                          </div>
                        </div>

                        {/* Duración */}
                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-xl text-brand-600'>
                              timer
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>Duración</p>
                            <p className='text-sm font-medium text-neutral-900'>
                              30 minutos
                            </p>
                          </div>
                        </div>

                        {/* Profesional */}
                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-xl text-brand-600'>
                              person
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>
                              Profesional
                            </p>
                            <p className='text-sm font-medium text-neutral-900'>
                              Carlos Martínez
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Call Info - Only shown in basic mode */}
                {isBasicMode && (
                  <div className='mb-5'>
                    <h4 className='text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3'>
                      Información de la llamada
                    </h4>
                    <div className='bg-neutral-50 rounded-xl p-4 border border-neutral-200'>
                      <div className='grid grid-cols-3 gap-3'>
                        {/* Hora */}
                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-lg text-neutral-600'>
                              schedule
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>Hora</p>
                            <p className='text-sm font-medium text-neutral-900'>
                              {call.time}
                            </p>
                          </div>
                        </div>

                        {/* Duración */}
                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-lg text-neutral-600'>
                              timer
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>Duración</p>
                            <p className='text-sm font-medium text-neutral-900'>
                              {call.duration}
                            </p>
                          </div>
                        </div>

                        {/* Teléfono */}
                        <div className='flex items-center gap-3 p-3 bg-white rounded-lg'>
                          <div className='w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center'>
                            <span className='material-symbols-rounded text-lg text-neutral-600'>
                              call
                            </span>
                          </div>
                          <div>
                            <p className='text-xs text-neutral-500'>Teléfono</p>
                            <p className='text-sm font-medium text-neutral-900'>
                              {call.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic mode info banner */}
                    <div className='mt-4 p-3.5 bg-gradient-to-r from-brand-50 to-brand-50/50 border border-brand-200 rounded-xl flex items-start gap-3'>
                      <div className='w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0'>
                        <span className='material-symbols-rounded text-lg text-brand-600'>
                          info
                        </span>
                      </div>
                      <p className='text-sm text-brand-800 leading-relaxed'>
                        Llama al paciente para agendar la cita manualmente. Una
                        vez gestionada, marca la llamada como resuelta.
                      </p>
                    </div>
                  </div>
                )}

                {/* Motivo */}
                <div className='mb-5'>
                  <h4 className='text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3'>
                    Motivo de la llamada
                  </h4>
                  <div className='p-4 bg-neutral-50 rounded-xl border border-neutral-200'>
                    <div className='flex items-start gap-3'>
                      <div className='w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0'>
                        <span className='material-symbols-rounded text-lg text-amber-600'>
                          lightbulb
                        </span>
                      </div>
                      <div>
                        <p className='text-sm font-medium text-neutral-900'>
                          {displayIntent}
                        </p>
                        {call.summary && (
                          <p className='text-sm text-neutral-600 mt-1'>
                            {call.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comunicaciones */}
                <div>
                  <h4 className='text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3'>
                    Comunicaciones enviadas
                  </h4>
                  <div className='space-y-2'>
                    {communications.map((comm) => (
                      <div
                        key={comm.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          comm.checked
                            ? 'bg-success-50/50 border-success-200'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            comm.checked
                              ? 'bg-success-500 text-white'
                              : 'bg-neutral-300 text-white'
                          }`}
                        >
                          <span className='material-symbols-rounded text-sm'>
                            {comm.checked ? 'check' : 'remove'}
                          </span>
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-neutral-900'>
                            {comm.label}
                          </p>
                        </div>
                        <span className='text-xs text-neutral-500 shrink-0'>
                          {comm.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50/50 shrink-0'>
            {isBasicMode ? (
              <>
                {/* Basic mode: Cerrar, Marcar como resuelta, Llamar */}
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors'
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
                  className='px-5 py-2.5 bg-success-50 border border-success-200 text-success-700 text-sm font-semibold rounded-xl hover:bg-success-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='material-symbols-rounded text-lg'>
                    check_circle
                  </span>
                  <span>Marcar como resuelta</span>
                </button>
                <button
                  type='button'
                  onClick={onCall}
                  className='px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 shadow-sm'
                >
                  <span className='material-symbols-rounded text-lg'>call</span>
                  <span>Llamar</span>
                </button>
              </>
            ) : canCreateAppointment ? (
              <>
                {/* Advanced mode: Intención de pedir cita = cita ya creada automáticamente por el agente */}
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors'
                >
                  Cerrar
                </button>
                <button
                  type='button'
                  onClick={handleViewAppointment}
                  className='px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 shadow-sm'
                >
                  <span className='material-symbols-rounded text-lg'>
                    calendar_month
                  </span>
                  <span>Ver en agenda</span>
                </button>
                <button
                  type='button'
                  onClick={onCall}
                  className='px-5 py-2.5 bg-white border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-2'
                >
                  <span className='material-symbols-rounded text-lg'>call</span>
                  <span>Llamar</span>
                </button>
              </>
            ) : (
              <>
                {/* Advanced mode: Otras intenciones = no hay cita, permite crear manualmente */}
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors'
                >
                  Cerrar
                </button>
                <button
                  type='button'
                  onClick={handleCreateAppointment}
                  disabled={!onCreateAppointment}
                  className='px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='material-symbols-rounded text-lg'>
                    add_circle
                  </span>
                  <span>Crear cita</span>
                </button>
                <button
                  type='button'
                  onClick={onCall}
                  className='px-5 py-2.5 bg-white border border-neutral-300 text-neutral-700 text-sm font-semibold rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-2'
                >
                  <span className='material-symbols-rounded text-lg'>call</span>
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
