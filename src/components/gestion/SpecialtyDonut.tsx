'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { Specialty, SpecialtyFilter } from './gestionTypes'
import type { CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

type SpecialtyShare = {
  label: Specialty
  percentage: number
  colorToken: string
}

type ProductionTotalCardProps = {
  year?: string
  value?: string
  delta?: string
  view?: 'barras' | 'circular'
  specialties?: SpecialtyShare[]
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
  onSpecialtySelect?: (specialty: SpecialtyFilter) => void
}

// Brand colors from design system (hex values for Recharts compatibility)
const BRAND_COLORS = {
  brand50: '#E3F5F2',
  brand200: '#80D6C9',
  brand500: '#00A991',
  brand800: '#004D42'
}

// Color activo cuando está seleccionado
const SELECTED_RING_COLOR = '#00A991' // brand-500

// Desglose del FACTURADO por especialidad
const DEFAULT_SPECIALTIES: SpecialtyShare[] = [
  // Semana: Total Facturado = 7.200 €
  {
    label: 'Conservadora',
    percentage: 40, // 2.880 €
    colorToken: BRAND_COLORS.brand50
  },
  { label: 'Ortodoncia', percentage: 30, colorToken: BRAND_COLORS.brand200 }, // 2.160 €
  { label: 'Implantes', percentage: 20, colorToken: BRAND_COLORS.brand500 }, // 1.440 €
  { label: 'Estética', percentage: 10, colorToken: BRAND_COLORS.brand800 } // 720 €
]

const MONTH_SPECIALTIES: SpecialtyShare[] = [
  // Mes: Total Facturado = 32.400 €
  {
    label: 'Conservadora',
    percentage: 40, // 12.960 €
    colorToken: BRAND_COLORS.brand50
  },
  { label: 'Ortodoncia', percentage: 30, colorToken: BRAND_COLORS.brand200 }, // 9.720 €
  { label: 'Implantes', percentage: 20, colorToken: BRAND_COLORS.brand500 }, // 6.480 €
  { label: 'Estética', percentage: 10, colorToken: BRAND_COLORS.brand800 } // 3.240 €
]

const CARD_HEIGHT = 'var(--height-card-chart-fluid)'

export default function ProductionTotalCard({
  year = '2024',
  value,
  delta,
  view: _view = 'circular',
  specialties,
  timeScale = 'week',
  selectedSpecialty,
  onSpecialtySelect
}: ProductionTotalCardProps) {
  void year
  void _view
  const resolvedSpecialties =
    specialties ??
    (timeScale === 'month' ? MONTH_SPECIALTIES : DEFAULT_SPECIALTIES)
  // Valor central = Total Facturado
  const resolvedValue =
    value ?? (timeScale === 'month' ? '€ 32,4 K' : '€ 7,2 K')
  const resolvedDelta = delta ?? (timeScale === 'month' ? '+ 15%' : '+ 10%')

  // Handler para clic en especialidad
  const handleSpecialtyClick = (label: Specialty) => {
    if (!onSpecialtySelect) return
    // Si ya está seleccionada, deseleccionar (toggle)
    if (selectedSpecialty === label) {
      onSpecialtySelect(null)
    } else {
      onSpecialtySelect(label)
    }
  }

  const sectionStyles: CSSProperties = {
    width: '100%',
    height: `min(${CARD_HEIGHT}, calc(100vh - 6rem))`
  }

  return (
    <section
      className='relative overflow-hidden rounded-lg bg-surface text-fg shadow-elevation-card flex flex-col'
      style={sectionStyles}
    >
      {/* Header */}
      <header className='px-4 pt-4 shrink-0'>
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por especialidad
        </h3>
        {/* Hint for filtering - only show when not filtered */}
        {onSpecialtySelect && !selectedSpecialty && (
          <p className='text-label-sm text-neutral-400 mt-0.5 flex items-center gap-1'>
            <span className='material-symbols-rounded text-sm'>touch_app</span>
            Clic para filtrar el dashboard
          </p>
        )}
      </header>

      {/* Content - donut on left, legend aligned horizontally */}
      <div className='flex-1 flex items-center px-6 pb-4'>
        {/* Donut - bigger */}
        <div
          className='relative shrink-0'
          style={{ width: '12rem', height: '12rem' }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={resolvedSpecialties}
                dataKey='percentage'
                startAngle={90}
                endAngle={-270}
                innerRadius='75%'
                outerRadius='100%'
                paddingAngle={0}
                stroke='transparent'
                isAnimationActive
                style={{ cursor: onSpecialtySelect ? 'pointer' : 'default' }}
                onClick={(_, index) => {
                  const specialty = resolvedSpecialties[index]
                  if (specialty) handleSpecialtyClick(specialty.label)
                }}
              >
                {resolvedSpecialties.map(({ label, colorToken }) => {
                  const isSelected = selectedSpecialty === label
                  const isOtherSelected = selectedSpecialty && selectedSpecialty !== label
                  return (
                    <Cell
                      key={label}
                      fill={colorToken}
                      opacity={isOtherSelected ? 0.3 : 1}
                      stroke={isSelected ? SELECTED_RING_COLOR : 'transparent'}
                      strokeWidth={isSelected ? 3 : 0}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center content */}
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <p className='text-lg font-bold text-neutral-900'>{resolvedValue}</p>
            <span className='text-xs font-medium text-brand-500'>
              {resolvedDelta}
            </span>
          </div>
        </div>

        {/* Legend - percentages aligned, clickable */}
        <dl className='flex flex-col gap-2.5 text-sm text-neutral-800 ml-auto'>
          {resolvedSpecialties.map(({ label, percentage, colorToken }) => {
            const isSelected = selectedSpecialty === label
            const isOtherSelected = selectedSpecialty && selectedSpecialty !== label
            return (
              <button
                key={label}
                type='button'
                onClick={() => handleSpecialtyClick(label)}
                className={`flex items-center gap-3 rounded-md px-2 py-1 -mx-2 transition-all duration-150 ${
                  onSpecialtySelect ? 'hover:bg-neutral-100 cursor-pointer' : ''
                } ${isSelected ? 'bg-brand-50 ring-1 ring-brand-500' : ''} ${
                  isOtherSelected ? 'opacity-40' : ''
                }`}
                disabled={!onSpecialtySelect}
              >
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: colorToken }}
                  aria-hidden='true'
                />
                <dt className='font-normal w-24 text-left'>{label}</dt>
                <dd className='font-semibold tabular-nums text-right w-10'>{percentage}%</dd>
              </button>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
