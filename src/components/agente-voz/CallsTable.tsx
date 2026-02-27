'use client'

import Portal from '@/components/ui/Portal'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import AssignProfessionalModal from './AssignProfessionalModal'
import CallCardsView from './CallCardsView'
import CallDetailModal from './CallDetailModal'
import CallModal from './CallModal'
import CallStatusBadge from './CallStatusBadge'
import ListenCallModal from './ListenCallModal'
import TranscriptionModal from './TranscriptionModal'
import type { CallFilter, CallRecord, VoiceAgentTier } from './voiceAgentTypes'
import {
  AUTO_PENDING_HOURS,
  CALL_INTENT_LABELS,
  SENTIMENT_LABELS,
  isAppointmentIntent
} from './voiceAgentTypes'

type CallsTableProps = {
  data?: CallRecord[]
  /** Voice agent tier - determines available actions */
  voiceAgentTier?: VoiceAgentTier
}

// Mock data from Figma design - vinculado con citas en la agenda
const MOCK_DATA: CallRecord[] = [
  {
    id: '1',
    status: 'nueva',
    date: '2026-02-24',
    time: '09:00',
    patient: 'Carlos Martínez Pérez',
    phone: '+34 667 890 111',
    intent: 'pedir_cita_higiene',
    duration: '12:42',
    summary:
      'Paciente solicita cita para limpieza dental rutinaria. Última limpieza hace 8 meses.',
    sentiment: 'aliviado',
    appointmentId: 'apt-ai-001'
  },
  {
    id: '2',
    status: 'nueva',
    date: '2026-02-24',
    time: '09:30',
    patient: 'Nacho Nieto Iniesta',
    phone: '+34 658 478 512',
    intent: 'consulta_financiacion',
    duration: '09:12',
    summary:
      'Paciente consulta opciones de financiación para tratamiento de ortodoncia. Interesado en conocer cuotas.',
    sentiment: 'nervioso'
    // Sin appointmentId - consulta_financiacion no crea cita automáticamente
  },
  {
    id: '3',
    status: 'pendiente',
    date: '2026-02-23',
    time: '10:00',
    patient: 'Sofia Rodríguez López',
    phone: '+34 667 890 111',
    intent: 'urgencia_dolor',
    duration: '02:32',
    summary:
      'Paciente reporta dolor intenso en molar inferior derecho desde ayer. Posible infección urgente.',
    sentiment: 'enfadado',
    appointmentId: 'apt-ai-003'
  },
  {
    id: '4',
    status: 'en_curso',
    date: '2026-02-24',
    time: '10:30',
    patient: null,
    phone: '+34 658 478 512',
    intent: 'consulta_financiacion',
    duration: '05:47',
    summary:
      'Paciente nuevo interesado en consulta de ortodoncia. No proporcionó todos los datos personales.',
    sentiment: 'contento'
    // Sin appointmentId - consulta_financiacion no crea cita automáticamente
  },
  {
    id: '5',
    status: 'resuelta',
    date: '2026-02-21',
    time: '11:00',
    patient: 'Javier Fernández Torres',
    phone: '+34 658 478 512',
    intent: 'pedir_cita_higiene',
    duration: '03:52',
    summary:
      'Paciente solicita cita de revisión semestral. Paciente habitual, sin problemas reportados.',
    sentiment: 'preocupado',
    appointmentId: 'apt-ai-005'
  },
  {
    id: '6',
    status: 'resuelta',
    date: '2026-02-20',
    time: '11:30',
    patient: 'Lucía Pérez Gómez',
    phone: '+34 667 890 111',
    intent: 'consulta_general',
    duration: '03:12',
    summary:
      'Paciente interesada en tratamiento de blanqueamiento dental. Solicita presupuesto previo.',
    sentiment: 'contento',
    appointmentId: 'apt-ai-006'
  },
  {
    id: '7',
    status: 'pendiente',
    date: '2026-02-23',
    time: '12:00',
    patient: null,
    phone: '+34 658 478 512',
    intent: 'consulta_financiacion',
    duration: '05:47',
    summary:
      'Consulta sobre opciones de financiación para implantes dentales. Paciente nuevo pendiente ficha.',
    sentiment: 'aliviado'
    // Sin appointmentId - consulta_financiacion no crea cita automáticamente
  },
  {
    id: '8',
    status: 'en_curso',
    date: '2026-02-24',
    time: '12:30',
    patient: null,
    phone: '+34 667 890 111',
    intent: 'consulta_financiacion',
    duration: '09:12',
    summary:
      'Llamada en curso - paciente consultando información general sobre tratamientos estéticos.',
    sentiment: 'nervioso'
  },
  {
    id: '9',
    status: 'urgente',
    date: '2026-02-22',
    time: '13:00',
    patient: 'Pablo Sánchez Delgado',
    phone: '+34 667 890 111',
    intent: 'pedir_cita_higiene',
    duration: '05:47',
    summary:
      'Paciente reporta molestia en prótesis dental. Necesita ajuste urgente. Dolor al masticar.',
    sentiment: 'contento',
    appointmentId: 'apt-ai-008'
  }
]

function formatCallDate(dateStr: string): string {
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

const ITEMS_PER_PAGE = 9

// Quick Actions Menu Item
type QuickActionItem = {
  id: string
  label: string
  icon: string
  onClick: () => void
}

// Quick Actions Menu Component (following parte diario pattern)
function CallQuickActionsMenu({
  row,
  onClose,
  triggerRect,
  onCall,
  onViewAppointment,
  onCreateAppointment,
  onMarkResolved,
  onListenCall,
  onViewTranscription,
  onAssignProfessional,
  onMoreInfo,
  voiceAgentTier = 'advanced'
}: {
  row: CallRecord
  onClose: () => void
  triggerRect?: DOMRect
  onCall: () => void
  onViewAppointment: () => void
  onCreateAppointment: () => void
  onMarkResolved: () => void
  onListenCall: () => void
  onViewTranscription: () => void
  onAssignProfessional: () => void
  onMoreInfo: () => void
  voiceAgentTier?: VoiceAgentTier
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    right?: number
  }>({})

  // Calculate optimal menu position
  useEffect(() => {
    if (!menuRef.current || !triggerRect) return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const margin = 8

    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    if (spaceBelow >= menuRect.height + margin) {
      setPosition({
        top: triggerRect.bottom + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else if (spaceAbove >= menuRect.height + margin) {
      setPosition({
        bottom: viewportHeight - triggerRect.top + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else {
      const centeredTop = Math.max(
        margin,
        Math.min(
          viewportHeight - menuRect.height - margin,
          triggerRect.top + triggerRect.height / 2 - menuRect.height / 2
        )
      )
      setPosition({
        top: centeredTop,
        right: window.innerWidth - triggerRect.right
      })
    }
  }, [triggerRect])

  // Handle click outside and escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Determinar si la intención es de pedir cita (cita ya creada automáticamente)
  const isCreatingIntent = isAppointmentIntent(row.intent)

  // Build actions list based on voice agent tier
  const actions: QuickActionItem[] = [
    { id: 'call', label: 'Llamar', icon: 'call', onClick: onCall }
  ]

  // Only show appointment actions in advanced mode
  if (voiceAgentTier === 'advanced') {
    // Mostrar "Ver en agenda" si la intención creó cita automáticamente, sino "Crear cita"
    if (isCreatingIntent) {
      actions.push({
        id: 'view-appointment',
        label: 'Ver en agenda',
        icon: 'calendar_month',
        onClick: onViewAppointment
      })
    } else {
      actions.push({
        id: 'create-appointment',
        label: 'Crear cita',
        icon: 'add_circle',
        onClick: onCreateAppointment
      })
    }
  }

  // Common actions for both tiers
  actions.push(
    {
      id: 'mark-resolved',
      label: 'Marcar resuelta',
      icon: 'check_box',
      onClick: onMarkResolved
    },
    {
      id: 'listen-call',
      label: 'Escuchar llamada',
      icon: 'adaptive_audio_mic',
      onClick: onListenCall
    },
    {
      id: 'transcription',
      label: 'Transcripción',
      icon: 'dictionary',
      onClick: onViewTranscription
    },
    {
      id: 'assign-professional',
      label: 'Asignar profesional',
      icon: 'person_add',
      onClick: onAssignProfessional
    },
    {
      id: 'more-info',
      label: 'Más información',
      icon: 'info',
      onClick: onMoreInfo
    }
  )

  return (
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[13rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={{
        top: position.top,
        bottom: position.bottom,
        right: position.right
      }}
      role='menu'
      aria-label='Acciones rápidas'
    >
      <div className='py-1'>
        {actions.map((action) => (
          <button
            key={action.id}
            type='button'
            role='menuitem'
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
          >
            <span className='material-symbols-rounded text-xl text-[var(--color-neutral-600)]'>
              {action.icon}
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Calls Table
 * Figma: 1616 × 440px = 101rem × 27.5rem
 * Columns: Estado, Hora, Paciente, Teléfono, Intención, Duración, Resumen, Sentimiento
 *
 * Supports two tiers:
 * - basic: Receptionist mode - no appointment actions, manual status management
 * - advanced: Full mode - appointment sync, automatic status updates
 */
export type ViewMode = 'table' | 'cards'

export default function CallsTable({
  data = MOCK_DATA,
  voiceAgentTier = 'advanced'
}: CallsTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState<CallFilter>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Local state for call records (to allow status updates from appointment sync)
  const [localCalls, setLocalCalls] = useState<CallRecord[]>(data)

  // Sync local calls when data prop changes
  useEffect(() => {
    setLocalCalls(data)
  }, [data])

  // Listen for appointment status changes to sync call status (ADVANCED MODE ONLY)
  useEffect(() => {
    // Only sync with appointments in advanced mode
    if (voiceAgentTier !== 'advanced') return

    const handleAppointmentStatusChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        appointmentId: string
        voiceAgentCallId: string
        oldStatus: string
        newStatus: string
      }

      // Map appointment status to call status
      const statusMap: Record<string, CallRecord['status']> = {
        Confirmada: 'resuelta',
        'No confirmada': 'pendiente',
        Reagendar: 'pendiente',
        'Pendiente IA': 'nueva'
      }

      const newCallStatus = statusMap[detail.newStatus]
      if (!newCallStatus) return

      // Update the call status
      setLocalCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === detail.voiceAgentCallId
            ? { ...call, status: newCallStatus }
            : call
        )
      )

      console.log(
        `🔄 Voice Agent [Advanced]: Call ${detail.voiceAgentCallId} status updated to ${newCallStatus} (from appointment ${detail.appointmentId})`
      )
    }

    const handleAppointmentVisitStatusChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        appointmentId: string
        voiceAgentCallId: string
        oldVisitStatus: string
        newVisitStatus: string
      }

      // If appointment is completed, mark call as resolved
      if (detail.newVisitStatus === 'completed') {
        setLocalCalls((prevCalls) =>
          prevCalls.map((call) =>
            call.id === detail.voiceAgentCallId
              ? { ...call, status: 'resuelta' }
              : call
          )
        )

        console.log(
          `🔄 Voice Agent [Advanced]: Call ${detail.voiceAgentCallId} marked as resolved (appointment completed)`
        )
      }
    }

    window.addEventListener(
      'appointment:status-change',
      handleAppointmentStatusChange
    )
    window.addEventListener(
      'appointment:visit-status-change',
      handleAppointmentVisitStatusChange
    )

    return () => {
      window.removeEventListener(
        'appointment:status-change',
        handleAppointmentStatusChange
      )
      window.removeEventListener(
        'appointment:visit-status-change',
        handleAppointmentVisitStatusChange
      )
    }
  }, [voiceAgentTier])

  // Auto-transition from 'nueva' to 'pendiente' after X hours (BASIC MODE ONLY)
  // In basic mode, calls don't auto-create appointments, so we use time-based transitions
  useEffect(() => {
    // Only apply auto-pending in basic mode
    if (voiceAgentTier !== 'basic') return

    // Check every minute for calls that should transition
    const checkInterval = setInterval(() => {
      const now = new Date()

      setLocalCalls((prevCalls) =>
        prevCalls.map((call) => {
          // Only transition 'nueva' calls
          if (call.status !== 'nueva') return call

          // Parse call time (assuming today's date for mock data)
          // In production, CallRecord should include a full timestamp
          const [hours, minutes] = call.time.split(':').map(Number)
          const callTime = new Date()
          callTime.setHours(hours, minutes, 0, 0)

          // Calculate hours since call
          const hoursSinceCall =
            (now.getTime() - callTime.getTime()) / (1000 * 60 * 60)

          // Transition to 'pendiente' if enough time has passed
          if (hoursSinceCall >= AUTO_PENDING_HOURS) {
            console.log(
              `🔄 Voice Agent [Basic]: Call ${
                call.id
              } auto-transitioned from 'nueva' to 'pendiente' (${hoursSinceCall.toFixed(
                1
              )}h elapsed)`
            )
            return { ...call, status: 'pendiente' }
          }

          return call
        })
      )
    }, 60000) // Check every minute

    // Also run once immediately
    const immediateCheck = setTimeout(() => {
      const now = new Date()

      setLocalCalls((prevCalls) =>
        prevCalls.map((call) => {
          if (call.status !== 'nueva') return call

          const [hours, minutes] = call.time.split(':').map(Number)
          const callTime = new Date()
          callTime.setHours(hours, minutes, 0, 0)

          const hoursSinceCall =
            (now.getTime() - callTime.getTime()) / (1000 * 60 * 60)

          if (hoursSinceCall >= AUTO_PENDING_HOURS) {
            console.log(
              `🔄 Voice Agent [Basic]: Call ${
                call.id
              } auto-transitioned from 'nueva' to 'pendiente' (${hoursSinceCall.toFixed(
                1
              )}h elapsed)`
            )
            return { ...call, status: 'pendiente' }
          }

          return call
        })
      )
    }, 0)

    return () => {
      clearInterval(checkInterval)
      clearTimeout(immediateCheck)
    }
  }, [voiceAgentTier])

  // State for quick actions menu
  const [activeMenuRow, setActiveMenuRow] = useState<CallRecord | null>(null)
  const [menuTriggerRect, setMenuTriggerRect] = useState<DOMRect | undefined>()

  // State for listen call modal
  const [listenCallRow, setListenCallRow] = useState<CallRecord | null>(null)

  // State for assign professional modal
  const [assignProfessionalRow, setAssignProfessionalRow] =
    useState<CallRecord | null>(null)

  // State for transcription modal
  const [transcriptionRow, setTranscriptionRow] = useState<CallRecord | null>(
    null
  )

  // State for call detail modal
  const [detailRow, setDetailRow] = useState<CallRecord | null>(null)

  // State for call modal (devolver llamada)
  const [callModalRow, setCallModalRow] = useState<CallRecord | null>(null)

  // State for summary tooltip
  const [summaryTooltip, setSummaryTooltip] = useState<{
    text: string
    rect: DOMRect
  } | null>(null)

  // State for search input visibility
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Handle callId from URL (coming from Agenda "Ver llamada IA" action)
  useEffect(() => {
    const callId = searchParams.get('callId')
    if (!callId) return

    // Find the call record with this ID (using localCalls for synced state)
    const call = localCalls.find((c) => c.id === callId)
    if (call) {
      // Open the call detail modal
      setDetailRow(call)
      // Clear the URL parameter to prevent re-triggering
      router.replace('/agente-voz', { scroll: false })
      console.log(`✅ Llamada ${callId} encontrada y mostrando detalles`)
    } else {
      console.log(`⚠️ Llamada ${callId} no encontrada en los datos`)
    }
  }, [searchParams, localCalls, router])

  // Handle search toggle
  const handleSearchToggle = () => {
    if (isSearchOpen && searchQuery) {
      // If closing with text, clear the search
      setSearchQuery('')
      setCurrentPage(1)
    }
    setIsSearchOpen(!isSearchOpen)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchQuery('')
    setCurrentPage(1)
    searchInputRef.current?.focus()
  }

  // Filtered data (using localCalls for synced state)
  const filteredData = useMemo(() => {
    let result = localCalls

    // Apply status filter
    if (filter === 'pendientes') {
      result = result.filter(
        (r) => r.status === 'pendiente' || r.status === 'nueva'
      )
    } else if (filter === 'urgentes') {
      result = result.filter((r) => r.status === 'urgente')
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.patient?.toLowerCase().includes(query) ||
          r.phone.toLowerCase().includes(query) ||
          CALL_INTENT_LABELS[r.intent].toLowerCase().includes(query)
      )
    }

    return result
  }, [localCalls, filter, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredData.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredData, currentPage])

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: CallFilter) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  // Handle opening quick actions menu
  const handleOpenMenu = (
    row: CallRecord,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuTriggerRect(rect)
    setActiveMenuRow(row)
  }

  // Quick action handlers
  const handleCall = (row: CallRecord) => {
    setCallModalRow(row)
  }

  // Handler para marcar llamada como resuelta (desde el modal de devolver llamada)
  const handleCallModalResolved = (row: CallRecord) => {
    setLocalCalls((prevCalls) =>
      prevCalls.map((call) =>
        call.id === row.id ? { ...call, status: 'resuelta' } : call
      )
    )
    setCallModalRow(null)
    console.log(
      `📞 Voice Agent [${voiceAgentTier}]: Call ${row.id} marked as resolved after callback`
    )
  }

  const handleViewAppointment = (row: CallRecord) => {
    if (row.appointmentId) {
      // Navigate to agenda with the appointment highlighted
      router.push(`/agenda?appointmentId=${row.appointmentId}`)
    } else {
      // No appointment linked - show alert
      alert('Esta llamada no tiene una cita vinculada en la agenda.')
    }
  }

  // Handler para crear cita manualmente (intenciones que no crean cita automáticamente)
  const handleCreateAppointment = (row: CallRecord) => {
    // Navegar a la agenda con datos prellenados para crear cita
    const params = new URLSearchParams({
      action: 'create',
      paciente: row.patient || '',
      pacientePhone: row.phone,
      observaciones: `${CALL_INTENT_LABELS[row.intent]} - ${row.summary}`,
      createdByVoiceAgent: 'true',
      voiceAgentCallId: row.id
    })
    router.push(`/agenda?${params.toString()}`)
  }

  const handleMarkResolved = (row: CallRecord) => {
    // Update status to resolved
    setLocalCalls((prevCalls) =>
      prevCalls.map((call) =>
        call.id === row.id ? { ...call, status: 'resuelta' } : call
      )
    )
    console.log(
      `✅ Voice Agent [${voiceAgentTier}]: Call ${row.id} marked as resolved manually`
    )
  }

  const handleListenCall = (row: CallRecord) => {
    setListenCallRow(row)
  }

  const handleViewTranscription = (row: CallRecord) => {
    setTranscriptionRow(row)
  }

  const handleAssignProfessional = (row: CallRecord) => {
    setAssignProfessionalRow(row)
  }

  const handleMoreInfo = (row: CallRecord) => {
    setDetailRow(row)
  }

  return (
    <div className='flex flex-col w-full h-full'>
      {/* Toolbar - Fixed */}
      <div className='flex items-center justify-between gap-4 pb-4 shrink-0 bg-surface-app'>
        {/* View toggle icons */}
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setViewMode('table')}
            className={`p-1 transition-colors rounded ${
              viewMode === 'table'
                ? 'text-brand-600 bg-brand-50'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label='Vista de tabla'
            aria-pressed={viewMode === 'table'}
          >
            <span className='material-symbols-rounded text-2xl'>reorder</span>
          </button>
          <button
            type='button'
            onClick={() => setViewMode('cards')}
            className={`p-1 transition-colors rounded ${
              viewMode === 'cards'
                ? 'text-brand-600 bg-brand-50'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
            aria-label='Vista de tarjetas'
            aria-pressed={viewMode === 'cards'}
          >
            <span className='material-symbols-rounded text-2xl -rotate-90'>
              splitscreen
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className='flex items-center gap-2'>
          {/* Search - Expandable */}
          <div className='flex items-center'>
            {isSearchOpen && (
              <div className='flex items-center gap-1 mr-1'>
                <div className='relative'>
                  <input
                    ref={searchInputRef}
                    type='text'
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder='Buscar paciente, teléfono...'
                    className='w-[14rem] pl-3 pr-8 py-1.5 text-body-sm border border-neutral-300 rounded-full focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors'
                  />
                  {searchQuery && (
                    <button
                      type='button'
                      onClick={handleSearchClear}
                      className='absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-600 transition-colors'
                    >
                      <span className='material-symbols-rounded text-lg'>
                        close
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
            <button
              type='button'
              onClick={handleSearchToggle}
              className={`p-2 rounded-full transition-colors ${
                isSearchOpen || searchQuery
                  ? 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
              aria-label={isSearchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
            >
              <span className='material-symbols-rounded text-2xl'>
                {isSearchOpen ? 'search_off' : 'search'}
              </span>
            </button>
          </div>

          {/* Filter: Todos */}
          <button
            type='button'
            onClick={() => handleFilterChange('todos')}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border text-body-sm transition-colors ${
              filter === 'todos'
                ? 'border-brand-500 text-brand-500 bg-brand-50'
                : 'border-neutral-700 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span className='material-symbols-rounded text-lg'>filter_alt</span>
            <span>Todos</span>
          </button>

          {/* Filter: Pendientes */}
          <button
            type='button'
            onClick={() => handleFilterChange('pendientes')}
            className={`flex items-center px-2 py-1 rounded-full border text-body-sm transition-colors ${
              filter === 'pendientes'
                ? 'border-brand-500 text-brand-500 bg-brand-50'
                : 'border-neutral-700 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>Pendientes</span>
          </button>

          {/* Filter: Urgentes */}
          <button
            type='button'
            onClick={() => handleFilterChange('urgentes')}
            className={`flex items-center px-2 py-1 rounded-full border text-body-sm transition-colors ${
              filter === 'urgentes'
                ? 'border-error-600 text-error-600 bg-error-50'
                : 'border-error-600 text-error-600 hover:bg-error-50'
            }`}
          >
            <span>Urgentes</span>
          </button>
        </div>
      </div>

      {/* Content Container - Table or Cards View */}
      <div className='flex-1 min-h-0 overflow-hidden flex flex-col'>
        {viewMode === 'cards' ? (
          <CallCardsView
            calls={paginatedData}
            onCall={handleCall}
            onMarkResolved={handleMarkResolved}
            onAddNote={(call) => {
              // TODO: Implement add note functionality
              console.log('Add note to call:', call.id)
            }}
            onShowDetail={handleMoreInfo}
            onViewAppointment={handleViewAppointment}
            onCreateAppointment={handleCreateAppointment}
            onListenCall={handleListenCall}
            onViewTranscription={handleViewTranscription}
            onAssignProfessional={handleAssignProfessional}
            voiceAgentTier={voiceAgentTier}
          />
        ) : (
          <div className='w-full table-scroll-x flex-1 flex flex-col'>
            <table className='w-full min-w-[80rem] table-fixed'>
              {/* Header - Sticky vertical and horizontal for key columns */}
              <thead className='sticky top-0 z-20 bg-surface-app'>
                <tr className='border-b border-neutral-300'>
                  {/* Estado - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[6.5625rem] sticky left-0 z-30 bg-surface-app'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        label
                      </span>
                      <span>Estado</span>
                    </div>
                  </th>
                  {/* Hora - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[6rem] sticky left-[6.5625rem] z-30 bg-surface-app'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        schedule
                      </span>
                      <span>Hora</span>
                    </div>
                  </th>
                  {/* Fecha - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[6.5rem] sticky left-[12.5625rem] z-30 bg-surface-app'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        calendar_today
                      </span>
                      <span>Fecha</span>
                    </div>
                  </th>
                  {/* Paciente - Sticky left */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[14.625rem] sticky left-[19.0625rem] z-30 bg-surface-app border-r border-neutral-300'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        person
                      </span>
                      <span>Paciente</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[10.6875rem]'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        phone
                      </span>
                      <span>Teléfono</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[12.4375rem]'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        psychology
                      </span>
                      <span>Intención</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[5.875rem]'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        timer
                      </span>
                      <span>Duración</span>
                    </div>
                  </th>
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        notes
                      </span>
                      <span>Resumen</span>
                    </div>
                  </th>
                  {/* Sentimiento - Sticky right */}
                  <th className='px-2 py-2 text-left text-body-md font-normal text-neutral-700 w-[10.5625rem] sticky right-0 z-30 bg-surface-app border-l border-neutral-300'>
                    <div className='flex items-center gap-1.5'>
                      <span className='material-symbols-rounded text-lg text-neutral-500'>
                        mood
                      </span>
                      <span>Sentimiento</span>
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Body - Scrollable */}
              <tbody>
                {paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className='border-b border-neutral-300 group'
                  >
                    {/* Estado - Sticky left */}
                    <td className='px-2 py-2 border-r border-neutral-300 sticky left-0 z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      <CallStatusBadge status={row.status} />
                    </td>

                    {/* Hora - Sticky left */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 sticky left-[6.5625rem] z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      {row.time}
                    </td>

                    {/* Fecha - Sticky left */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 sticky left-[12.5625rem] z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      {formatCallDate(row.date)}
                    </td>

                    {/* Paciente - Sticky left */}
                    <td className='px-2 py-2 border-r border-neutral-300 sticky left-[19.0625rem] z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors'>
                      <span
                        className={`text-body-md ${
                          row.patient ? 'text-neutral-900' : 'text-neutral-400'
                        }`}
                      >
                        {row.patient ?? 'Pendiente de asignar'}
                      </span>
                    </td>

                    {/* Teléfono */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      {row.phone}
                    </td>

                    {/* Intención */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      {CALL_INTENT_LABELS[row.intent]}
                    </td>

                    {/* Duración */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      {row.duration}
                    </td>

                    {/* Resumen */}
                    <td className='px-2 py-2 text-body-md text-neutral-900 border-r border-neutral-300 group-hover:bg-neutral-50 transition-colors'>
                      <div
                        className='truncate cursor-pointer hover:text-brand-600 transition-colors'
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setSummaryTooltip({ text: row.summary, rect })
                        }}
                        onMouseLeave={() => setSummaryTooltip(null)}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setSummaryTooltip(
                            summaryTooltip?.text === row.summary
                              ? null
                              : { text: row.summary, rect }
                          )
                        }}
                      >
                        {row.summary}
                      </div>
                    </td>

                    {/* Sentimiento + Actions - Sticky right */}
                    <td className='px-2 py-2 sticky right-0 z-10 bg-surface-app group-hover:bg-neutral-50 transition-colors border-l border-neutral-300'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='text-body-md text-neutral-900'>
                          {SENTIMENT_LABELS[row.sentiment]}
                        </span>
                        <button
                          type='button'
                          onClick={(e) => handleOpenMenu(row, e)}
                          className='p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors'
                          aria-label='Acciones'
                        >
                          <span className='material-symbols-rounded text-xl'>
                            more_vert
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className='flex items-center justify-end gap-3 pt-4 shrink-0 bg-surface-app'>
          {/* First page */}
          <button
            type='button'
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>first_page</span>
          </button>

          {/* Previous page */}
          <button
            type='button'
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>
              chevron_left
            </span>
          </button>

          {/* Page numbers */}
          <div className='flex items-center gap-2 text-body-sm'>
            <span
              className={`${
                currentPage === 1 ? 'font-bold underline' : ''
              } text-neutral-900`}
            >
              1
            </span>
            {totalPages > 1 && (
              <span
                className={`cursor-pointer ${
                  currentPage === 2 ? 'font-bold underline' : ''
                } text-neutral-900`}
                onClick={() => setCurrentPage(2)}
              >
                2
              </span>
            )}
            {totalPages > 3 && <span className='text-neutral-900'>...</span>}
            {totalPages > 2 && (
              <span
                className={`cursor-pointer ${
                  currentPage === totalPages ? 'font-bold underline' : ''
                } text-neutral-900`}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </span>
            )}
          </div>

          {/* Next page */}
          <button
            type='button'
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>
              chevron_right
            </span>
          </button>

          {/* Last page */}
          <button
            type='button'
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className='p-1 text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            <span className='material-symbols-rounded text-xl'>last_page</span>
          </button>
        </div>
      )}

      {/* Quick Actions Menu Portal */}
      {activeMenuRow && (
        <Portal>
          <CallQuickActionsMenu
            row={activeMenuRow}
            triggerRect={menuTriggerRect}
            onClose={() => setActiveMenuRow(null)}
            onCall={() => handleCall(activeMenuRow)}
            onViewAppointment={() => handleViewAppointment(activeMenuRow)}
            onCreateAppointment={() => handleCreateAppointment(activeMenuRow)}
            onMarkResolved={() => handleMarkResolved(activeMenuRow)}
            onListenCall={() => handleListenCall(activeMenuRow)}
            onViewTranscription={() => handleViewTranscription(activeMenuRow)}
            onAssignProfessional={() => handleAssignProfessional(activeMenuRow)}
            onMoreInfo={() => handleMoreInfo(activeMenuRow)}
            voiceAgentTier={voiceAgentTier}
          />
        </Portal>
      )}

      {/* Listen Call Modal */}
      {listenCallRow && (
        <ListenCallModal
          call={listenCallRow}
          onClose={() => setListenCallRow(null)}
        />
      )}

      {/* Assign Professional Modal */}
      {assignProfessionalRow && (
        <AssignProfessionalModal
          call={assignProfessionalRow}
          onClose={() => setAssignProfessionalRow(null)}
          onAssign={(professionalId) => {
            console.log(
              'Asignado profesional:',
              professionalId,
              'a llamada:',
              assignProfessionalRow.id
            )
            // TODO: Implement actual assignment logic
          }}
        />
      )}

      {/* Transcription Modal */}
      {transcriptionRow && (
        <TranscriptionModal
          call={transcriptionRow}
          onClose={() => setTranscriptionRow(null)}
        />
      )}

      {/* Call Modal (Devolver llamada) */}
      {callModalRow && (
        <CallModal
          call={callModalRow}
          onClose={() => setCallModalRow(null)}
          onMarkResolved={() => handleCallModalResolved(callModalRow)}
        />
      )}

      {/* Call Detail Modal */}
      {detailRow && (
        <CallDetailModal
          call={detailRow}
          onClose={() => setDetailRow(null)}
          onCall={() => handleCall(detailRow)}
          onCreateAppointment={(prefill) => {
            // Navigate to agenda to create appointment with pre-filled data
            // Encode the prefill data as URL parameters
            const params = new URLSearchParams()
            params.set('action', 'create')
            if (prefill.paciente) params.set('paciente', prefill.paciente)
            if (prefill.pacientePhone)
              params.set('pacientePhone', prefill.pacientePhone)
            if (prefill.observaciones)
              params.set('observaciones', prefill.observaciones)
            if (prefill.createdByVoiceAgent)
              params.set('createdByVoiceAgent', 'true')
            if (prefill.voiceAgentCallId)
              params.set('voiceAgentCallId', prefill.voiceAgentCallId)
            router.push(`/agenda?${params.toString()}`)
          }}
          onViewAppointment={(appointmentId) => {
            // Navigate to agenda with the appointment highlighted
            router.push(`/agenda?appointmentId=${appointmentId}`)
          }}
          voiceAgentTier={voiceAgentTier}
          onMarkResolved={() => handleMarkResolved(detailRow)}
        />
      )}

      {/* Summary Tooltip */}
      {summaryTooltip && (
        <Portal>
          <div
            className='fixed z-[9999] bg-neutral-100 rounded-lg p-4 shadow-lg border border-neutral-200 max-w-[17.5rem]'
            style={{
              top: summaryTooltip.rect.bottom + 8,
              left: Math.min(summaryTooltip.rect.left, window.innerWidth - 300)
            }}
            onMouseEnter={() => {
              // Keep tooltip open when hovering over it
            }}
            onMouseLeave={() => setSummaryTooltip(null)}
          >
            <p className='text-body-sm text-neutral-900'>
              {summaryTooltip.text}
            </p>
          </div>
        </Portal>
      )}
    </div>
  )
}
