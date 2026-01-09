'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

type SpecialtyShare = {
  label: string
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
}

// Brand colors from design system (hex values for Recharts compatibility)
const BRAND_COLORS = {
  brand50: '#E3F5F2',
  brand200: '#80D6C9',
  brand500: '#00A991',
  brand800: '#004D42'
}

const DEFAULT_SPECIALTIES: SpecialtyShare[] = [
  {
    label: 'Conservadora',
    percentage: 40,
    colorToken: BRAND_COLORS.brand50
  },
  { label: 'Ortodoncia', percentage: 30, colorToken: BRAND_COLORS.brand200 },
  { label: 'Implantes', percentage: 20, colorToken: BRAND_COLORS.brand500 },
  { label: 'Estética', percentage: 10, colorToken: BRAND_COLORS.brand800 }
]

const MONTH_SPECIALTIES: SpecialtyShare[] = [
  {
    label: 'Conservadora',
    percentage: 42,
    colorToken: BRAND_COLORS.brand50
  },
  { label: 'Ortodoncia', percentage: 28, colorToken: BRAND_COLORS.brand200 },
  { label: 'Implantes', percentage: 22, colorToken: BRAND_COLORS.brand500 },
  { label: 'Estética', percentage: 8, colorToken: BRAND_COLORS.brand800 }
]

const CARD_HEIGHT = 'var(--height-card-chart-fluid)'

export default function ProductionTotalCard({
  year = '2024',
  value,
  delta,
  view: _view = 'circular',
  specialties,
  timeScale = 'week'
}: ProductionTotalCardProps) {
  void year
  void _view
  const resolvedSpecialties =
    specialties ??
    (timeScale === 'month' ? MONTH_SPECIALTIES : DEFAULT_SPECIALTIES)
  const resolvedValue =
    value ?? (timeScale === 'month' ? '€ 210 K' : '€ 56 K')
  const resolvedDelta = delta ?? (timeScale === 'month' ? '+ 22%' : '+ 35%')

  const sectionStyles: CSSProperties = {
    width: '100%',
    height: `min(${CARD_HEIGHT}, calc(100vh - 6rem))`
  }

  return (
    <section
      className='relative overflow-hidden rounded-lg bg-surface text-fg shadow-elevation-card'
      style={sectionStyles}
    >
      <header className='px-4 pt-4'>
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por especialidad
        </h3>
      </header>

      <div className='flex h-[calc(100%-4rem)] items-center gap-4 px-4 pb-4'>
        {/* Donut container - explicit size for ResponsiveContainer to work */}
        <div
          className='relative shrink-0'
          style={{ width: '10rem', height: '10rem' }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={resolvedSpecialties}
                dataKey='percentage'
                startAngle={90}
                endAngle={-270}
                innerRadius='80%'
                outerRadius='100%'
                paddingAngle={0}
                cornerRadius={10}
                stroke='transparent'
                isAnimationActive
              >
                {resolvedSpecialties.map(({ label, colorToken }) => (
                  <Cell key={label} fill={colorToken} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center content */}
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <p className='text-xl font-bold text-neutral-900'>{resolvedValue}</p>
            <div className='flex items-center gap-1'>
              <span className='text-xs font-normal text-brand-500'>
                {resolvedDelta}
              </span>
              <span className='material-symbols-rounded text-xs text-brand-500'>
                arrow_outward
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <dl className='flex min-w-0 flex-1 flex-col gap-2 text-xs text-neutral-800'>
          {resolvedSpecialties.map(({ label, percentage, colorToken }) => (
            <div key={label} className='flex items-center gap-2'>
              <span
                className='h-3 w-3 shrink-0 rounded-full'
                style={{ backgroundColor: colorToken }}
                aria-hidden='true'
              />
              <div className='flex min-w-0 flex-1 items-center justify-between gap-1'>
                <dt className='truncate font-normal'>{label}</dt>
                <dd className='shrink-0 font-medium'>{percentage}%</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
