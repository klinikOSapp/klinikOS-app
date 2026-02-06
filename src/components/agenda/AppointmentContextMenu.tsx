'use client'

import { MD3Icon, type MD3IconName } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import type { EventDetail, VisitStatus } from './types'
import { VISIT_STATUS_CONFIG, VISIT_STATUS_ORDER } from './types'

export type ContextMenuAction =
  | 'view-patient'
  | 'view-appointment'
  | 'new-appointment'
  | 'new-budget'
  | 'new-prescription'
  | 'report'
  | 'view-voice-call'

export interface AppointmentContextMenuProps {
  /** Posición del menú en la pantalla */
  position: { x: number; y: number }
  /** Detalles de la cita seleccionada */
  eventDetail?: EventDetail
  /** Callback cuando se selecciona una acción */
  onAction: (action: ContextMenuAction) => void
  /** Callback para cerrar el menú */
  onClose: () => void
  /** Estado de visita actual de la cita */
  currentVisitStatus?: VisitStatus
  /** Callback para cambiar el estado de visita */
  onVisitStatusChange?: (newStatus: VisitStatus) => void
  /** Si la cita está confirmada */
  isConfirmed?: boolean
  /** Callback para cambiar el estado de confirmación */
  onToggleConfirmed?: (confirmed: boolean) => void
  /** Si la cita fue creada por el agente de voz */
  createdByVoiceAgent?: boolean
  /** ID de la llamada vinculada (si fue creada por agente de voz) */
  voiceAgentCallId?: string
}

const MENU_ITEMS: {
  id: ContextMenuAction
  label: string
  icon: MD3IconName
}[] = [
  { id: 'view-patient', label: 'Ver paciente', icon: 'AccountCircleRounded' },
  { id: 'view-appointment', label: 'Ver cita', icon: 'CalendarMonthRounded' },
  { id: 'new-appointment', label: 'Nueva cita', icon: 'AddRounded' },
  { id: 'new-budget', label: 'Nuevo presupuesto', icon: 'ReceiptLongRounded' },
  { id: 'new-prescription', label: 'Nueva receta', icon: 'DescriptionRounded' },
  { id: 'report', label: 'Reportar', icon: 'EditRounded' }
]

export default function AppointmentContextMenu({
  position,
  eventDetail,
  onAction,
  onClose,
  currentVisitStatus = 'scheduled',
  onVisitStatusChange,
  isConfirmed = false,
  onToggleConfirmed,
  createdByVoiceAgent = false,
  voiceAgentCallId
}: AppointmentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false)
  const [adjustedPosition, setAdjustedPosition] = useState({
    x: position.x,
    y: position.y
  })

  // Función para calcular la posición ajustada
  const calculatePosition = useCallback(() => {
    if (!menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const margin = 12 // Margen mínimo desde los bordes

    let newX = position.x
    let newY = position.y

    // Ajustar si se sale por la derecha
    if (newX + rect.width > viewportWidth - margin) {
      newX = viewportWidth - rect.width - margin
    }

    // Ajustar si se sale por la izquierda
    if (newX < margin) {
      newX = margin
    }

    // Ajustar si se sale por abajo - mover el menú hacia arriba
    if (newY + rect.height > viewportHeight - margin) {
      newY = viewportHeight - rect.height - margin
    }

    // Ajustar si se sale por arriba
    if (newY < margin) {
      newY = margin
    }

    setAdjustedPosition({ x: newX, y: newY })
  }, [position.x, position.y])

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Añadir listeners con un pequeño delay para evitar que el mismo click que abre el menú lo cierre
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

  // Calcular posición inicial después del primer render
  useLayoutEffect(() => {
    calculatePosition()
  }, [calculatePosition])

  // Recalcular posición cuando se expande/colapsa el submenu
  useEffect(() => {
    // Pequeño delay para que el DOM se actualice
    const timeoutId = setTimeout(() => {
      calculatePosition()
    }, 0)
    return () => clearTimeout(timeoutId)
  }, [showStatusSubmenu, calculatePosition])

  const handleItemClick = (action: ContextMenuAction) => {
    onAction(action)
    onClose()
  }

  return (
    <Portal>
      <div
        ref={menuRef}
        className='fixed z-[9999] min-w-[12rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
        style={{
          top: adjustedPosition.y,
          left: adjustedPosition.x
        }}
        role='menu'
        aria-label='Acciones rápidas de cita'
      >
        {/* Header con info del paciente si está disponible */}
        {eventDetail?.patientFull && (
          <div className='border-b border-[var(--color-border-default)] px-3 py-2'>
            <p className='text-xs font-medium text-[var(--color-neutral-500)]'>
              Acciones para
            </p>
            <p className='truncate text-sm font-semibold text-[var(--color-neutral-900)]'>
              {eventDetail.patientFull}
            </p>
          </div>
        )}

        {/* Opciones del menú */}
        <div className='py-1'>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type='button'
              role='menuitem'
              onClick={() => handleItemClick(item.id)}
              className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
            >
              <MD3Icon
                name={item.icon}
                size={1.125}
                className='text-[var(--color-neutral-600)]'
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Opción "Ver llamada IA" - Solo para citas creadas por agente de voz */}
        {createdByVoiceAgent && voiceAgentCallId && (
          <>
            <div className='my-1 h-px bg-[var(--color-border-default)]' />
            <div className='py-1'>
              <button
                type='button'
                role='menuitem'
                onClick={() => handleItemClick('view-voice-call')}
                className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-event-ai)] transition-colors hover:bg-[var(--color-event-ai-bg)] focus:bg-[var(--color-event-ai-bg)] focus:outline-none'
              >
                <span className='material-symbols-rounded text-lg'>
                  smart_toy
                </span>
                <span className='font-medium'>Ver llamada IA</span>
              </button>
            </div>
          </>
        )}

        {/* Toggle de confirmación */}
        {onToggleConfirmed && (
          <>
            <div className='my-1 h-px bg-[var(--color-border-default)]' />
            <div className='py-1'>
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  onToggleConfirmed(!isConfirmed)
                  onClose()
                }}
                className={[
                  'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors',
                  isConfirmed
                    ? 'text-[#3B82F6] hover:bg-[#EFF6FF]'
                    : 'text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)]'
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors',
                    isConfirmed
                      ? 'border-[#3B82F6] bg-[#3B82F6]'
                      : 'border-[var(--color-neutral-400)]'
                  ].join(' ')}
                >
                  {isConfirmed && (
                    <MD3Icon
                      name='CheckRounded'
                      size={0.625}
                      className='text-white'
                    />
                  )}
                </span>
                <span className={isConfirmed ? 'font-medium' : ''}>
                  {isConfirmed ? 'Confirmada' : 'Marcar como confirmada'}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Sección de estado de visita - Lista expandible (no submenu) */}
        {onVisitStatusChange && (
          <>
            <div className='my-1 h-px bg-[var(--color-border-default)]' />
            <div className='py-1'>
              {/* Trigger para expandir/colapsar */}
              <button
                type='button'
                onClick={() => setShowStatusSubmenu((prev) => !prev)}
                className={[
                  'flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors',
                  showStatusSubmenu
                    ? 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]'
                    : 'text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)]'
                ].join(' ')}
              >
                <div className='flex items-center gap-3'>
                  <span
                    className='h-3 w-3 rounded-full'
                    style={{
                      backgroundColor:
                        VISIT_STATUS_CONFIG[currentVisitStatus].color
                    }}
                  />
                  <span>Estado de visita</span>
                </div>
                <MD3Icon
                  name='KeyboardArrowDownRounded'
                  size={1.125}
                  className={[
                    'transition-transform duration-200',
                    showStatusSubmenu ? 'rotate-180' : ''
                  ].join(' ')}
                  style={{ color: 'var(--color-neutral-500)' }}
                />
              </button>

              {/* Lista de estados expandida (debajo, no a la derecha) */}
              {showStatusSubmenu && (
                <div
                  className='border-t border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
                  role='menu'
                  aria-label='Estados de visita'
                >
                  {VISIT_STATUS_ORDER.map((status) => {
                    const config = VISIT_STATUS_CONFIG[status]
                    const isCurrentStatus = status === currentVisitStatus

                    return (
                      <button
                        key={status}
                        type='button'
                        role='menuitem'
                        onClick={() => {
                          if (!isCurrentStatus) {
                            onVisitStatusChange(status)
                          }
                          onClose()
                        }}
                        className={[
                          'flex w-full items-center gap-3 px-3 py-2 pl-6 text-left text-sm transition-colors',
                          isCurrentStatus
                            ? 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)]'
                            : 'text-[var(--color-neutral-800)] hover:bg-[var(--color-neutral-100)]'
                        ].join(' ')}
                      >
                        <span
                          className='h-2.5 w-2.5 rounded-full'
                          style={{ backgroundColor: config.color }}
                        />
                        <span className={isCurrentStatus ? 'font-medium' : ''}>
                          {config.label}
                        </span>
                        {isCurrentStatus && (
                          <MD3Icon
                            name='CheckRounded'
                            size={0.875}
                            className='ml-auto text-[var(--color-brand-600)]'
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Portal>
  )
}
