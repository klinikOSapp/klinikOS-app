'use client'

import Portal from '@/components/ui/Portal'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
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
  calls
}: VoiceAgentPendingWidgetProps) {
  const supabase = useRef(createSupabaseBrowserClient())
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const router = useRouter()
  const [liveCalls, setLiveCalls] = useState<PendingCall[]>(calls ?? [])
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number
    left: number
  } | null>(null)

  useEffect(() => {
    if (calls) {
      setLiveCalls(calls)
    }
  }, [calls])

  useEffect(() => {
    let isMounted = true
    async function hydrateCalls() {
      if (!isClinicInitialized) return
      if (calls) return
      try {
        if (!activeClinicId) {
          if (isMounted) setLiveCalls([])
          return
        }

        const { data: callRows, error } = await supabase.current
          .from('calls')
          .select('id, status, started_at, from_number, is_urgent, call_outcome')
          .eq('clinic_id', activeClinicId)
          .order('started_at', { ascending: false })
          .limit(30)
        if (error) throw error

        const mapped: PendingCall[] = (callRows || []).map((row) => {
          const rawStatus = String(row.status || '').toLowerCase()
          const status: PendingCallStatus = row.is_urgent
            ? 'urgente'
            : rawStatus.includes('new')
            ? 'nueva'
            : rawStatus.includes('pending') || rawStatus.includes('queue')
            ? 'pendiente'
            : rawStatus.includes('in_progress')
            ? 'en_curso'
            : 'pendiente'
          const at = row.started_at ? new Date(row.started_at) : new Date()
          return {
            id: String(row.id),
            status,
            time: at.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            patient: null,
            phone: row.from_number || '—',
            summary: row.call_outcome || 'Llamada pendiente de gestión'
          }
        })

        if (isMounted) setLiveCalls(mapped)
      } catch (error) {
        console.warn('VoiceAgentPendingWidget hydration failed', error)
        if (isMounted) setLiveCalls([])
      }
    }

    void hydrateCalls()
    return () => {
      isMounted = false
    }
  }, [activeClinicId, calls, isClinicInitialized])

  // Filter for actionable calls (nueva, pendiente, urgente)
  const actionableCalls = liveCalls.filter(
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
    setIsOpen(false)
    // Use setTimeout to ensure the dropdown closes before navigation
    setTimeout(() => {
      router.push(`/agente-voz?callId=${callId}`)
    }, 0)
  }

  // Navigate to voice agent page (main view)
  const handleViewAll = () => {
    setIsOpen(false)
    // Use setTimeout to ensure the dropdown closes before navigation
    setTimeout(() => {
      router.push('/agente-voz')
    }, 0)
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
