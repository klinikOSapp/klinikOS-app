'use client'

import { useEffect, useRef } from 'react'
import { MD3Icon, type MD3IconName } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'
import type { EventDetail } from './types'

export type ContextMenuAction = 
  | 'view-appointment'
  | 'new-appointment'
  | 'new-budget'
  | 'new-prescription'
  | 'report'

export interface AppointmentContextMenuProps {
  /** Posición del menú en la pantalla */
  position: { x: number; y: number }
  /** Detalles de la cita seleccionada */
  eventDetail?: EventDetail
  /** Callback cuando se selecciona una acción */
  onAction: (action: ContextMenuAction) => void
  /** Callback para cerrar el menú */
  onClose: () => void
}

const MENU_ITEMS: { id: ContextMenuAction; label: string; icon: MD3IconName }[] = [
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
  onClose
}: AppointmentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Ajustar posición para que no se salga de la pantalla
  useEffect(() => {
    if (!menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Ajustar si se sale por la derecha
    if (rect.right > viewportWidth) {
      menu.style.left = `${viewportWidth - rect.width - 8}px`
    }

    // Ajustar si se sale por abajo
    if (rect.bottom > viewportHeight) {
      menu.style.top = `${viewportHeight - rect.height - 8}px`
    }
  }, [position])

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
          top: position.y,
          left: position.x
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
      </div>
    </Portal>
  )
}
