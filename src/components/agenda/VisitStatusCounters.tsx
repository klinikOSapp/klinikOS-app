'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'

import {
  VISIT_STATUS_CONFIG,
  VISIT_STATUS_ORDER,
  type VisitStatus
} from './types'

interface VisitStatusCountersProps {
  /** Conteo de citas por estado */
  counts: Record<VisitStatus, number>
  /** Estados activos para filtrar (null = mostrar todos) */
  activeFilters: VisitStatus[] | null
  /** Callback cuando se hace clic en un contador para filtrar */
  onFilterChange: (status: VisitStatus | null) => void
  /** Si es true, muestra todos los estados; si es false, solo los que tienen citas */
  showEmpty?: boolean
  /** Tamaño de los chips */
  size?: 'sm' | 'md'
}

/**
 * Componente que muestra contadores de citas por estado de visita.
 * Cada contador es clicable para filtrar las citas por ese estado.
 */
export default function VisitStatusCounters({
  counts,
  activeFilters,
  onFilterChange,
  showEmpty = false,
  size = 'sm'
}: VisitStatusCountersProps) {
  // Filtrar estados que tienen al menos 1 cita (o mostrar todos si showEmpty)
  const visibleStatuses = showEmpty
    ? VISIT_STATUS_ORDER
    : VISIT_STATUS_ORDER.filter((status) => counts[status] > 0)

  // Si no hay ningún estado con citas, no renderizar nada
  if (visibleStatuses.length === 0) {
    return null
  }

  const totalAppointments = Object.values(counts).reduce((sum, count) => sum + count, 0)

  const handleClick = (status: VisitStatus) => {
    if (activeFilters?.includes(status)) {
      // Si ya está activo, quitarlo
      const newFilters = activeFilters.filter((s) => s !== status)
      onFilterChange(newFilters.length === 0 ? null : newFilters[0])
    } else {
      // Activar este filtro
      onFilterChange(status)
    }
  }

  const handleShowAll = () => {
    onFilterChange(null)
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-label-sm gap-1.5',
    md: 'px-3 py-1.5 text-body-sm gap-2'
  }

  const iconSize = size === 'sm' ? 'xs' : 'sm'

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {/* Botón "Todos" */}
      <button
        onClick={handleShowAll}
        className={[
          'inline-flex items-center rounded-full border transition-colors',
          sizeClasses[size],
          activeFilters === null
            ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-0)] text-[var(--color-brand-700)]'
            : 'border-[var(--color-neutral-300)] bg-white text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]'
        ].join(' ')}
      >
        <span className='font-medium'>Todas</span>
        <span className='rounded-full bg-[var(--color-neutral-200)] px-1.5 text-[var(--color-neutral-700)]'>
          {totalAppointments}
        </span>
      </button>

      {/* Separador */}
      <div className='h-4 w-px bg-[var(--color-neutral-200)]' />

      {/* Contadores por estado */}
      {visibleStatuses.map((status) => {
        const config = VISIT_STATUS_CONFIG[status]
        const count = counts[status]
        const isActive = activeFilters?.includes(status)

        // No mostrar estados sin citas (excepto si showEmpty es true)
        if (count === 0 && !showEmpty) return null

        return (
          <button
            key={status}
            onClick={() => handleClick(status)}
            className={[
              'inline-flex items-center rounded-full border transition-all duration-200',
              sizeClasses[size],
              isActive
                ? 'shadow-sm'
                : 'hover:shadow-sm'
            ].join(' ')}
            style={{
              backgroundColor: isActive ? config.bgColor : 'white',
              borderColor: isActive ? config.color : 'var(--color-neutral-300)',
              color: isActive ? config.textColor : 'var(--color-neutral-700)'
            }}
            title={`${config.label}: ${count} cita${count !== 1 ? 's' : ''}`}
          >
            {/* Indicador de color */}
            <span
              className='h-2 w-2 shrink-0 rounded-full'
              style={{ backgroundColor: config.color }}
            />

            {/* Label */}
            <span className={isActive ? 'font-medium' : 'font-normal'}>
              {config.label}
            </span>

            {/* Contador */}
            <span
              className='rounded-full px-1.5 font-medium'
              style={{
                backgroundColor: isActive ? config.color : 'var(--color-neutral-200)',
                color: isActive ? 'white' : 'var(--color-neutral-700)'
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Versión compacta para mostrar en espacios reducidos.
 * Muestra los estados con sus etiquetas y contadores.
 */
export function VisitStatusCountersCompact({
  counts,
  activeFilters,
  onFilterChange
}: Omit<VisitStatusCountersProps, 'showEmpty' | 'size'>) {
  const visibleStatuses = VISIT_STATUS_ORDER.filter((status) => counts[status] > 0)

  if (visibleStatuses.length === 0) return null

  return (
    <div className='flex items-center gap-1.5'>
      {visibleStatuses.map((status) => {
        const config = VISIT_STATUS_CONFIG[status]
        const count = counts[status]
        const isActive = activeFilters?.includes(status)

        return (
          <button
            key={status}
            onClick={() => onFilterChange(isActive ? null : status)}
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all',
              isActive ? 'ring-2 ring-offset-1' : 'hover:opacity-90'
            ].join(' ')}
            style={{
              backgroundColor: config.bgColor,
              color: config.textColor,
              '--tw-ring-color': isActive ? config.color : undefined
            } as React.CSSProperties}
            title={`${config.label}: ${count} cita${count !== 1 ? 's' : ''}`}
          >
            {/* Indicador de color */}
            <span
              className='h-2 w-2 shrink-0 rounded-full'
              style={{ backgroundColor: config.color }}
            />
            {/* Etiqueta */}
            <span className={isActive ? 'font-medium' : 'font-normal'}>
              {config.label}
            </span>
            {/* Contador */}
            <span
              className='rounded-full px-1.5 font-medium'
              style={{
                backgroundColor: config.color,
                color: 'white'
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
