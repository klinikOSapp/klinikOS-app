'use client'

import { useState, useRef, useEffect, useId } from 'react'
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

/**
 * Dropdown de estados de visita para pantallas pequeñas.
 * Muestra un botón compacto que al hacer clic despliega los estados.
 */
export function VisitStatusDropdown({
  counts,
  activeFilters,
  onFilterChange
}: Omit<VisitStatusCountersProps, 'showEmpty' | 'size'>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownId = useId()

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const visibleStatuses = VISIT_STATUS_ORDER.filter((status) => counts[status] > 0)
  const totalAppointments = Object.values(counts).reduce((sum, count) => sum + count, 0)

  // Determinar qué mostrar en el botón del dropdown
  const getDropdownLabel = () => {
    if (activeFilters && activeFilters.length > 0) {
      const activeConfig = VISIT_STATUS_CONFIG[activeFilters[0]]
      return activeConfig.label
    }
    return 'Estados'
  }

  const getActiveColor = () => {
    if (activeFilters && activeFilters.length > 0) {
      const activeConfig = VISIT_STATUS_CONFIG[activeFilters[0]]
      return activeConfig.color
    }
    return null
  }

  const activeColor = getActiveColor()

  if (visibleStatuses.length === 0) return null

  return (
    <div ref={dropdownRef} className='relative' onClick={(e) => e.stopPropagation()}>
      {/* Botón del dropdown */}
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        aria-expanded={isOpen}
        aria-haspopup='menu'
        aria-controls={dropdownId}
        className={[
          'inline-flex h-[var(--nav-chip-height)] shrink-0 items-center gap-[var(--spacing-gapsm)] whitespace-nowrap rounded-full border px-3 text-body-md font-medium transition-colors duration-150',
          isOpen
            ? 'border-[var(--color-brand-200)] bg-[var(--color-brand-50)] text-[var(--color-neutral-900)]'
            : 'border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-0)]'
        ].join(' ')}
      >
        {/* Indicador de color si hay filtro activo */}
        {activeColor && (
          <span
            className='h-2 w-2 shrink-0 rounded-full'
            style={{ backgroundColor: activeColor }}
          />
        )}
        <span>{getDropdownLabel()}</span>
        {/* Badge con total */}
        <span className='flex h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--color-neutral-200)] px-1 text-xs font-medium text-[var(--color-neutral-700)]'>
          {totalAppointments}
        </span>
        <MD3Icon
          name='KeyboardArrowDownRounded'
          size='inherit'
          className={[
            'text-[var(--color-neutral-400)] transition-transform duration-150',
            isOpen ? 'rotate-180' : ''
          ].join(' ')}
        />
      </button>

      {/* Menu desplegable */}
      {isOpen && (
        <div
          id={dropdownId}
          role='menu'
          aria-orientation='vertical'
          className='absolute left-0 top-[calc(100%+0.5rem)] z-50 flex min-w-[12rem] flex-col rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.95)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Opción "Todos" */}
          <button
            type='button'
            role='menuitemradio'
            aria-checked={activeFilters === null}
            className={[
              'flex w-full items-center gap-[0.5rem] px-[0.75rem] py-[0.5rem] text-left text-title-sm font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              activeFilters === null
                ? 'bg-[var(--color-brand-50)]'
                : 'bg-transparent hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            onClick={(e) => {
              e.stopPropagation()
              onFilterChange(null)
              setIsOpen(false)
            }}
          >
            <span className='flex size-[1.25rem] items-center justify-center'>
              {activeFilters === null && (
                <MD3Icon name='CheckRounded' size={1} className='text-[var(--color-brand-600)]' />
              )}
            </span>
            <span className='flex-1'>Todos los estados</span>
            <span className='rounded-full bg-[var(--color-neutral-200)] px-1.5 text-xs font-medium text-[var(--color-neutral-700)]'>
              {totalAppointments}
            </span>
          </button>

          {/* Separador */}
          <div className='my-1 h-px bg-[var(--color-neutral-200)]' />

          {/* Estados individuales */}
          {visibleStatuses.map((status) => {
            const config = VISIT_STATUS_CONFIG[status]
            const count = counts[status]
            const isActive = activeFilters?.includes(status)

            return (
              <button
                key={status}
                type='button'
                role='menuitemradio'
                aria-checked={isActive}
                className={[
                  'flex w-full items-center gap-[0.5rem] px-[0.75rem] py-[0.5rem] text-left text-title-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-[var(--color-brand-50)]'
                    : 'bg-transparent hover:bg-[var(--color-brand-0)]'
                ].join(' ')}
                style={{ color: isActive ? config.textColor : 'var(--color-neutral-900)' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onFilterChange(isActive ? null : status)
                  setIsOpen(false)
                }}
              >
                {/* Indicador de color */}
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: config.color }}
                />
                {/* Label */}
                <span className='flex-1'>{config.label}</span>
                {/* Contador */}
                <span
                  className='rounded-full px-1.5 text-xs font-medium'
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
      )}
    </div>
  )
}
