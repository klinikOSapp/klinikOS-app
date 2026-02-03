'use client'

import { useState, useRef, useEffect } from 'react'

import { VISIT_STATUS_CONFIG, type VisitStatus } from './types'
import VisitStatusMenu from './VisitStatusMenu'

interface VisitStatusIndicatorProps {
  status: VisitStatus
  onStatusChange?: (newStatus: VisitStatus) => void
  /** Altura del indicador (por defecto hereda del padre) */
  height?: string
  /** Si es true, solo muestra el indicador sin interacción */
  readOnly?: boolean
  /** Posición del menú */
  menuPosition?: 'right' | 'left' | 'auto'
}

/**
 * Indicador visual del estado de visita del paciente.
 * Se muestra como un borde izquierdo de color que indica el estado actual.
 * Al hacer clic, abre un menú para cambiar el estado.
 */
export default function VisitStatusIndicator({
  status,
  onStatusChange,
  height = '100%',
  readOnly = false,
  menuPosition = 'auto'
}: VisitStatusIndicatorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const config = VISIT_STATUS_CONFIG[status]

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        indicatorRef.current &&
        !indicatorRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!readOnly && onStatusChange) {
      setIsMenuOpen(!isMenuOpen)
    }
  }

  const handleStatusSelect = (newStatus: VisitStatus) => {
    onStatusChange?.(newStatus)
    setIsMenuOpen(false)
  }

  // Calcular posición del menú basándose en la posición del indicador
  const getMenuPosition = (): { top: string; left: string } => {
    if (!indicatorRef.current) return { top: '0', left: '100%' }

    const rect = indicatorRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth

    // Auto: determinar si hay espacio a la derecha
    if (menuPosition === 'auto') {
      const spaceOnRight = viewportWidth - rect.right
      if (spaceOnRight < 200) {
        // Menú a la izquierda
        return { top: '0', left: 'auto' }
      }
    }

    if (menuPosition === 'left') {
      return { top: '0', left: 'auto' }
    }

    // Por defecto a la derecha
    return { top: '0', left: '100%' }
  }

  // Animación pulsante para estado "Llamar"
  const isPulsing = status === 'call_patient'

  return (
    <div
      ref={indicatorRef}
      className='relative'
      style={{ height }}
    >
      {/* Borde indicador de color */}
      <div
        role={readOnly ? 'presentation' : 'button'}
        tabIndex={readOnly ? -1 : 0}
        aria-label={`Estado: ${config.label}. ${readOnly ? '' : 'Clic para cambiar'}`}
        aria-haspopup={readOnly ? undefined : 'menu'}
        aria-expanded={readOnly ? undefined : isMenuOpen}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsMenuOpen(!isMenuOpen)
          }
        }}
        className={[
          'h-full w-[4px] rounded-l-[var(--radius-lg)] transition-all duration-200',
          !readOnly && 'cursor-pointer hover:w-[6px]',
          isPulsing && 'animate-pulse'
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          backgroundColor: config.color,
          boxShadow: isPulsing ? `0 0 8px ${config.color}` : undefined
        }}
      />

      {/* Menú de selección de estado */}
      {isMenuOpen && (
        <div
          className='absolute z-50'
          style={{
            ...getMenuPosition(),
            marginLeft: menuPosition !== 'left' ? '0.5rem' : undefined,
            marginRight: menuPosition === 'left' ? '0.5rem' : undefined,
            right: menuPosition === 'left' ? '100%' : undefined
          }}
        >
          <VisitStatusMenu
            currentStatus={status}
            onSelect={handleStatusSelect}
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
