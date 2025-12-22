'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts'

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

const DEFAULT_SPECIALTIES: SpecialtyShare[] = [
  {
    label: 'Conservadora',
    percentage: 40,
    colorToken: 'var(--color-brand-50)'
  },
  { label: 'Ortodoncia', percentage: 30, colorToken: 'var(--color-brand-200)' },
  { label: 'Implantes', percentage: 20, colorToken: 'var(--color-brand-500)' },
  { label: 'Estética', percentage: 10, colorToken: 'var(--color-brand-800)' }
]

const MONTH_SPECIALTIES: SpecialtyShare[] = [
  {
    label: 'Conservadora',
    percentage: 42,
    colorToken: 'var(--color-brand-50)'
  },
  { label: 'Ortodoncia', percentage: 28, colorToken: 'var(--color-brand-200)' },
  { label: 'Implantes', percentage: 22, colorToken: 'var(--color-brand-500)' },
  { label: 'Estética', percentage: 8, colorToken: 'var(--color-brand-800)' }
]

const CARD_WIDTH = 'var(--width-card-chart-md-fluid)'
const CARD_HEIGHT = 'var(--height-card-chart-fluid)'
const DONUT_SIZE_REM = 12.6875
const LEGEND_WIDTH_REM = 8.375
type ChartCardStyles = CSSProperties & Record<'--card-width-current', string>

export default function ProductionTotalCard({
  year = '2024',
  value,
  delta,
  view: _view = 'circular',
  specialties,
  timeScale = 'week'
}: ProductionTotalCardProps) {
  const resolvedSpecialties =
    specialties ??
    (timeScale === 'month' ? MONTH_SPECIALTIES : DEFAULT_SPECIALTIES)
  const resolvedValue =
    value ?? (timeScale === 'month' ? '€ 210 K' : '€ 56 K')
  const resolvedDelta = delta ?? (timeScale === 'month' ? '+ 22%' : '+ 35%')

  const sectionStyles = {
    '--card-width-current': `min(${CARD_WIDTH}, 95vw)`,
    width: 'var(--card-width-current)',
    height: `min(${CARD_HEIGHT}, calc(100vh - 6rem))`
  } satisfies ChartCardStyles

  const donutSize = `min(${DONUT_SIZE_REM}rem, calc(var(--card-width-current) - ${LEGEND_WIDTH_REM}rem - 3rem))`
  const legendLeft = `min(16.9375rem, calc(var(--card-width-current) - ${LEGEND_WIDTH_REM}rem - 1rem))`
  const legendWidth = `min(${LEGEND_WIDTH_REM}rem, calc(var(--card-width-current) - ${DONUT_SIZE_REM}rem - 3rem))`

  return (
    <section
      className='relative overflow-clip rounded-lg bg-surface text-fg shadow-elevation-card'
      style={sectionStyles}
    >
      <header
        className='absolute left-[1rem] top-[1rem] flex items-baseline justify-between'
        style={{
          width: `min(31.0625rem, calc(var(--card-width-current) - 2rem))`
        }}
      >
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por especialidad
        </h3>
      </header>

      <div className='absolute inset-x-[1rem] top-[4.75rem] bottom-[1.5rem] flex items-center gap-[1.5rem]'>
        <div
          className='relative flex flex-shrink-0 items-center justify-center'
          style={{
            width: donutSize,
            height: donutSize,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          aria-hidden='true'
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <Pie
                data={resolvedSpecialties}
                dataKey='percentage'
                startAngle={90}
                endAngle={-270}
                innerRadius='88%'
                outerRadius='100%'
                paddingAngle={0}
                cornerRadius={16}
                stroke='transparent'
                isAnimationActive
              >
                {resolvedSpecialties.map(({ label, colorToken }) => (
                  <Cell key={label} fill={colorToken} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className='absolute inset-[0.75rem] rounded-full border border-[rgba(255,255,255,0.5)] bg-transparent' />
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-gapsm'>
            <p className='text-headline-lg text-neutral-900'>{resolvedValue}</p>
            <div className='flex items-center gap-gapsm'>
              <span className='text-body-sm font-normal text-brand-500'>
                {resolvedDelta}
              </span>
              <span className='material-symbols-rounded text-[1rem] leading-4 text-brand-500'>
                arrow_outward
              </span>
            </div>
          </div>
        </div>

        <dl
          className='flex flex-col gap-[0.75rem] text-[0.75rem] leading-4 text-neutral-800'
          style={{
            width: legendWidth
          }}
        >
          {resolvedSpecialties.map(({ label, percentage, colorToken }) => (
            <div key={label} className='flex items-center gap-[0.5rem]'>
              <span
                className='h-[0.75rem] w-[0.75rem] rounded-full'
                style={{ backgroundColor: colorToken }}
                aria-hidden='true'
              />
              <div className='flex w-full items-center justify-between gap-[0.5rem]'>
                <dt className='font-normal'>{label}</dt>
                <dd className='font-medium'>{percentage}%</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
