'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type {
  GestionSpecialtyMetric,
  GestionSummaryKpis,
  Specialty,
  SpecialtyFilter
} from './gestionTypes'

type SpecialtyShare = {
  label: Specialty
  percentage: number
  colorToken: string
}

type SpecialtyDonutProps = {
  year?: string
  value?: string
  delta?: string
  view?: 'barras' | 'circular'
  specialties?: GestionSpecialtyMetric[]
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
  onSpecialtySelect?: (specialty: SpecialtyFilter) => void
  summary?: GestionSummaryKpis
}

const BRAND_COLORS = ['#E3F5F2', '#80D6C9', '#00A991', '#004D42']
const SELECTED_RING_COLOR = '#00A991'

function formatCompactCurrency(value: number) {
  if (value >= 1000) {
    return `€ ${(value / 1000).toFixed(1)} K`
  }
  return `€ ${value.toFixed(0)}`
}

function formatDelta(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default function SpecialtyDonut({
  year = '2024',
  value,
  delta,
  view: _view = 'circular',
  specialties,
  selectedSpecialty,
  onSpecialtySelect,
  summary
}: SpecialtyDonutProps) {
  void year
  void _view

  const normalized: SpecialtyShare[] = (specialties || []).map((item, index) => ({
    label: item.label,
    percentage: item.sharePercent,
    colorToken: BRAND_COLORS[index % BRAND_COLORS.length]
  }))

  const resolvedValue =
    value ?? formatCompactCurrency(Number(summary?.invoiced || 0))
  const resolvedDelta =
    delta ?? formatDelta(Number(summary?.invoicedDelta || 0))

  const handleSpecialtyClick = (label: Specialty) => {
    if (!onSpecialtySelect) return
    if (selectedSpecialty === label) {
      onSpecialtySelect(null)
    } else {
      onSpecialtySelect(label)
    }
  }

  const sectionStyles: CSSProperties = {
    width: '100%',
    height: '100%',
    minHeight: 'min(14rem, 20vh)'
  }

  return (
    <section
      className='relative overflow-hidden rounded-lg bg-surface text-fg shadow-elevation-card flex flex-col min-w-0'
      style={sectionStyles}
    >
      <header className='px-3 lg:px-4 pt-3 lg:pt-4 shrink-0 flex items-center gap-2 justify-between'>
        <h3 className='text-title-sm font-medium text-fg truncate'>
          Facturación por especialidad
        </h3>
        {onSpecialtySelect && !selectedSpecialty && normalized.length > 0 && (
          <p className='text-label-sm text-neutral-400 flex items-center gap-1 shrink-0'>
            <span className='material-symbols-rounded text-sm'>touch_app</span>
            <span className='hidden lg:inline'>Clic para filtrar el dashboard</span>
          </p>
        )}
      </header>

      <div className='flex-1 flex flex-col lg:flex-row items-center px-3 lg:px-4 pt-2 pb-3 lg:pb-4 gap-2 lg:gap-4 min-w-0 overflow-hidden'>
        <div
          className='relative outline-none shrink-0'
          style={{
            width: 'min(11rem, 40vw)',
            height: 'min(11rem, 40vw)',
            minWidth: '7rem',
            minHeight: '7rem'
          }}
          tabIndex={-1}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart
              margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
              style={{ outline: 'none' }}
            >
              <Pie
                data={normalized}
                dataKey='percentage'
                startAngle={90}
                endAngle={-270}
                innerRadius='70%'
                outerRadius='100%'
                paddingAngle={0}
                stroke='transparent'
                isAnimationActive
                style={{ cursor: onSpecialtySelect ? 'pointer' : 'default' }}
                onClick={(_, index) => {
                  const specialty = normalized[index]
                  if (specialty) handleSpecialtyClick(specialty.label)
                }}
              >
                {normalized.map(({ label, colorToken }) => {
                  const isSelected = selectedSpecialty === label
                  const isOtherSelected =
                    selectedSpecialty && selectedSpecialty !== label
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
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <p className='text-base lg:text-title-md font-bold text-neutral-900 whitespace-nowrap'>
              {resolvedValue}
            </p>
            <span className='text-xs lg:text-label-sm font-medium text-brand-500'>
              {resolvedDelta}
            </span>
          </div>
        </div>

        <dl className='flex flex-col gap-1 lg:gap-1.5 text-sm text-neutral-800 justify-center min-w-0 overflow-visible'>
          {normalized.map(({ label, percentage, colorToken }) => {
            const isSelected = selectedSpecialty === label
            const isOtherSelected =
              selectedSpecialty && selectedSpecialty !== label
            return (
              <button
                key={label}
                type='button'
                onClick={() => handleSpecialtyClick(label)}
                className={`flex items-center gap-2 lg:gap-3 rounded-md px-2 py-1 transition-colors duration-150 outline-none focus:outline-none min-w-0 ${
                  onSpecialtySelect ? 'hover:bg-neutral-100 cursor-pointer' : ''
                } ${isSelected ? 'bg-brand-50 ring-1 ring-inset ring-brand-500' : ''} ${
                  isOtherSelected ? 'opacity-40' : ''
                }`}
                disabled={!onSpecialtySelect}
              >
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: colorToken }}
                  aria-hidden='true'
                />
                <dt className='font-normal text-sm text-left truncate min-w-0 flex-1'>
                  {label}
                </dt>
                <dd className='font-semibold tabular-nums text-right text-sm shrink-0'>
                  {percentage}%
                </dd>
              </button>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
