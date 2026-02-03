'use client'

import Portal from '@/components/ui/Portal'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Types for pending calls (matching voice agent types)
export type PendingCallStatus = 'nueva' | 'pendiente' | 'urgente' | 'en_curso'

export type PendingCall = {
  id: string
  status: PendingCallStatus
  time: string
  patient: string | null
  phone: string
  summary: string
}

// Mock data - in production this would come from a shared context/API
const MOCK_PENDING_CALLS: PendingCall[] = [
  {
    id: '1',
    status: 'nueva',
    time: '09:00',
    patient: 'Carlos Martínez Pérez',
    phone: '+34 667 890 111',
    summary: 'Solicita cita para limpieza dental'
  },
  {
    id: '2',
    status: 'nueva',
    time: '09:30',
    patient: 'Nacho Nieto Iniesta',
    phone: '+34 658 478 512',
    summary: 'Consulta opciones de financiación'
  },
  {
    id: '3',
    status: 'pendiente',
    time: '10:00',
    patient: 'Sofia Rodríguez López',
    phone: '+34 667 890 111',
    summary: 'Dolor intenso en molar - URGENTE'
  },
  {
    id: '7',
    status: 'pendiente',
    time: '12:00',
    patient: null,
    phone: '+34 658 478 512',
    summary: 'Consulta financiación implantes'
  },
  {
    id: '9',
    status: 'urgente',
    time: '13:00',
    patient: 'Pablo Sánchez Delgado',
    phone: '+34 667 890 111',
    summary: 'Molestia en prótesis - URGENTE'
  }
]

// Status color configuration
const STATUS_CONFIG: Record<
  PendingCallStatus,
  { label: string; color: string; bgColor: string }
> = {
  nueva: {
    label: 'Nueva',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
  pendiente: {
    label: 'Pendiente',
    color: '#F59E0B',
    bgColor: '#FEF3C7'
  },
  urgente: {
    label: 'Urgente',
    color: '#EF4444',
    bgColor: '#FEE2E2'
  },
  en_curso: {
    label: 'En curso',
    color: '#6B7280',
    bgColor: '#F3F4F6'
  }
}

interface VoiceAgentPendingWidgetProps {
  /** Override pending calls data (for API integration) */
  calls?: PendingCall[]
}

export default function VoiceAgentPendingWidget({
  calls = MOCK_PENDING_CALLS
}: VoiceAgentPendingWidgetProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number
    left: number
  } | null>(null)

  // Filter for actionable calls (nueva, pendiente, urgente)
  const actionableCalls = calls.filter(
    (c) =>
      c.status === 'nueva' || c.status === 'pendiente' || c.status === 'urgente'
  )

  // Count urgent calls specifically
  const urgentCount = actionableCalls.filter(
    (c) => c.status === 'urgente'
  ).length
  const totalCount = actionableCalls.length

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.left - 200 + rect.width) // Right-align the dropdown
      })
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        buttonRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return
      }
      setIsOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
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
  }, [isOpen])

  // Navigate to voice agent page with call selected
  const handleCallClick = (callId: string) => {
    router.push(`/agente-voz?callId=${callId}`)
    setIsOpen(false)
  }

  // Navigate to voice agent page (main view)
  const handleViewAll = () => {
    router.push('/agente-voz')
    setIsOpen(false)
  }

  // Don't render if no actionable calls
  if (totalCount === 0) {
    return null
  }

  return (
    <>
      {/* Trigger button */}
      <button
        ref={buttonRef}
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'relative inline-flex h-[2.25rem] items-center gap-2 rounded-full border px-3 text-body-sm font-medium transition-all duration-150',
          urgentCount > 0
            ? 'border-[#EF4444] bg-[#FEE2E2] text-[#B91C1C] animate-pulse'
            : 'border-[#EC4899] bg-[#FDF2F8] text-[#BE185D]'
        ].join(' ')}
        title={`${totalCount} llamadas pendientes${
          urgentCount > 0 ? ` (${urgentCount} urgentes)` : ''
        }`}
      >
        <span className='material-symbols-rounded text-lg'>smart_toy</span>
        <span className='hidden xl:inline'>
          {totalCount} pendiente{totalCount !== 1 ? 's' : ''}
        </span>
        {/* Notification badge for urgent */}
        {urgentCount > 0 && (
          <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#EF4444] text-[0.625rem] font-bold text-white'>
            {urgentCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && dropdownPosition && (
        <Portal>
          <div
            ref={dropdownRef}
            className='fixed z-[9999] w-[20rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-white shadow-lg'
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left
            }}
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-[var(--color-border-default)] bg-[#FDF2F8] px-4 py-3'>
              <div className='flex items-center gap-2'>
                <span className='material-symbols-rounded text-lg text-[#EC4899]'>
                  smart_toy
                </span>
                <span className='text-sm font-medium text-[var(--color-neutral-900)]'>
                  Llamadas pendientes
                </span>
              </div>
              <span className='rounded-full bg-[#EC4899] px-2 py-0.5 text-xs font-bold text-white'>
                {totalCount}
              </span>
            </div>

            {/* Calls list */}
            <div className='max-h-[18rem] overflow-y-auto'>
              {actionableCalls.map((call) => {
                const statusConfig = STATUS_CONFIG[call.status]
                return (
                  <button
                    key={call.id}
                    type='button'
                    onClick={() => handleCallClick(call.id)}
                    className='flex w-full flex-col gap-1 border-b border-[var(--color-border-default)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-neutral-50)] last:border-b-0'
                  >
                    <div className='flex items-center justify-between'>
                      <span
                        className='rounded-full px-2 py-0.5 text-[0.625rem] font-bold'
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color
                        }}
                      >
                        {statusConfig.label}
                      </span>
                      <span className='text-xs text-[var(--color-neutral-500)]'>
                        {call.time}
                      </span>
                    </div>
                    <p className='text-sm font-medium text-[var(--color-neutral-900)] truncate'>
                      {call.patient ?? 'Paciente desconocido'}
                    </p>
                    <p className='text-xs text-[var(--color-neutral-600)] truncate'>
                      {call.summary}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className='border-t border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 py-2'>
              <button
                type='button'
                onClick={handleViewAll}
                className='flex w-full items-center justify-center gap-1.5 rounded-md bg-[#EC4899] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#DB2777]'
              >
                <span className='material-symbols-rounded text-sm'>
                  open_in_new
                </span>
                <span>Ver todas en Agente de Voz</span>
              </button>
            </div>
          </div>
        </Portal>
      )}
    </>
  )
}
