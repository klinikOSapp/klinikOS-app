'use client'

import { useEffect, useRef } from 'react'

import { MD3Icon } from '@/components/icons/MD3Icon'

import {
  VISIT_STATUS_CONFIG,
  VISIT_STATUS_ORDER,
  type VisitStatus
} from './types'

interface VisitStatusMenuProps {
  currentStatus: VisitStatus
  onSelect: (status: VisitStatus) => void
  onClose: () => void
}

/**
 * Menú dropdown para seleccionar el estado de visita del paciente.
 * Muestra todos los estados disponibles con su color e icono.
 */
export default function VisitStatusMenu({
  currentStatus,
  onSelect,
  onClose
}: VisitStatusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Focus en el menú al abrirse
  useEffect(() => {
    menuRef.current?.focus()
  }, [])

  const handleSelect = (status: VisitStatus) => {
    if (status !== currentStatus) {
      onSelect(status)
    }
    onClose()
  }

  return (
    <div
      ref={menuRef}
      role='menu'
      tabIndex={-1}
      className='min-w-[180px] overflow-hidden rounded-[8px] border border-[var(--color-neutral-200)] bg-white shadow-lg'
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className='border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-3 py-2'>
        <p className='text-label-sm font-medium text-[var(--color-neutral-600)]'>
          Estado de visita
        </p>
      </div>

      {/* Opciones de estado */}
      <div className='py-1'>
        {VISIT_STATUS_ORDER.map((status) => {
          const config = VISIT_STATUS_CONFIG[status]
          const isSelected = status === currentStatus

          return (
            <button
              key={status}
              role='menuitem'
              onClick={() => handleSelect(status)}
              className={[
                'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                isSelected
                  ? 'bg-[var(--color-brand-0)]'
                  : 'hover:bg-[var(--color-neutral-50)]'
              ].join(' ')}
            >
              {/* Indicador de color */}
              <span
                className='h-3 w-3 shrink-0 rounded-full'
                style={{ backgroundColor: config.color }}
              />

              {/* Icono */}
              <MD3Icon
                name={config.icon as Parameters<typeof MD3Icon>[0]['name']}
                size='sm'
                className='shrink-0'
                style={{ color: config.textColor }}
              />

              {/* Label */}
              <span
                className={[
                  'flex-1 text-body-sm',
                  isSelected ? 'font-medium' : 'font-normal'
                ].join(' ')}
                style={{ color: isSelected ? config.textColor : 'var(--color-neutral-900)' }}
              >
                {config.label}
              </span>

              {/* Check si está seleccionado */}
              {isSelected && (
                <MD3Icon
                  name='CheckRounded'
                  size='sm'
                  className='shrink-0 text-[var(--color-brand-600)]'
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
