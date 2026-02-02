'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import React from 'react'
import type { Treatment } from './treatmentTypes'

type RowActionsMenuProps = {
  treatment: Treatment
  onClose: () => void
  triggerRect?: DOMRect
  onCreateBudget: () => void
  onToggleStatus: () => void
  onDelete: () => void
  /** Optional callback for creating an appointment - only shown if provided */
  onCreateAppointment?: () => void
  /** Optional callback to mark treatment as completed */
  onMarkComplete?: () => void
  /** Optional callback to cancel treatment */
  onMarkCancelled?: () => void
}

export function RowActionsMenu({
  treatment,
  onClose,
  triggerRect,
  onCreateBudget,
  onToggleStatus,
  onDelete,
  onCreateAppointment,
  onMarkComplete,
  onMarkCancelled
}: RowActionsMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
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

  const isAccepted = treatment.status === 'Aceptado'

  // Calcular posición directamente desde triggerRect
  const menuStyle: React.CSSProperties = triggerRect
    ? {
        top: triggerRect.bottom + 4,
        right: window.innerWidth - triggerRect.right
      }
    : {}

  return (
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[12rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={menuStyle}
      role='menu'
      aria-label='Acciones rápidas'
    >
      {/* Acciones principales */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onCreateBudget()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='ReceiptLongRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Crear presupuesto</span>
        </button>
        {onCreateAppointment && (
          <button
            type='button'
            role='menuitem'
            onClick={() => {
              onCreateAppointment()
              onClose()
            }}
            className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
          >
            <MD3Icon
              name='CalendarMonthRounded'
              size={1.125}
              className='text-[var(--color-neutral-600)]'
            />
            <span>Crear cita</span>
          </button>
        )}
      </div>

      {/* Separador - Acciones de estado */}
      {(onMarkComplete || onMarkCancelled) && (
        <>
          <div className='my-1 h-px bg-[var(--color-border-default)]' />
          <div className='py-1'>
            {onMarkComplete && (
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  onMarkComplete()
                  onClose()
                }}
                className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
              >
                <MD3Icon
                  name='CheckCircleRounded'
                  size={1.125}
                  className='text-[#16A34A]'
                />
                <span>Marcar como realizado</span>
              </button>
            )}
            {onMarkCancelled && (
              <button
                type='button'
                role='menuitem'
                onClick={() => {
                  onMarkCancelled()
                  onClose()
                }}
                className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
              >
                <MD3Icon
                  name='CancelRounded'
                  size={1.125}
                  className='text-[#9CA3AF]'
                />
                <span>Cancelar tratamiento</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Separador */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Cambiar estado */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onToggleStatus()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name={
              isAccepted ? 'CheckCircleRounded' : 'RadioButtonUncheckedRounded'
            }
            size={1.125}
            className={
              isAccepted ? 'text-[#3B82F6]' : 'text-[var(--color-neutral-600)]'
            }
          />
          <span
            className={
              isAccepted
                ? 'text-[#3B82F6] font-medium'
                : 'text-[var(--color-neutral-800)]'
            }
          >
            {isAccepted ? 'Marcar como no aceptado' : 'Marcar como aceptado'}
          </span>
        </button>
      </div>

      {/* Separador */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Eliminar */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onDelete()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[#DC2626] transition-colors hover:bg-[#FEE2E2] focus:bg-[#FEE2E2] focus:outline-none'
        >
          <MD3Icon
            name='DeleteRounded'
            size={1.125}
            className='text-[#DC2626]'
          />
          <span>Eliminar tratamiento</span>
        </button>
      </div>
    </div>
  )
}
