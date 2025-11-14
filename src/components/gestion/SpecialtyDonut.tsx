'use client'

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

const CARD_WIDTH = 'var(--width-card-chart-md-fluid)'
const CARD_HEIGHT = 'var(--height-card-chart-fluid)'
const DONUT_SIZE_REM = 12.6875
const LEGEND_WIDTH_REM = 8.375
type ChartCardStyles = CSSProperties & Record<'--card-width-current', string>

export default function ProductionTotalCard({
  year = '2024',
  value = '€ 56 K',
  delta = '+ 35%',
  view = 'circular',
  specialties = DEFAULT_SPECIALTIES
}: ProductionTotalCardProps) {
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
        <button
          type='button'
          className='flex items-center gap-[0.25rem] text-[0.75rem] font-normal leading-4 text-fg'
          aria-label={`Seleccionar periodo ${year}`}
        >
          {year}
          <span className='material-symbols-rounded text-[1rem] leading-4 text-fg'>
            arrow_drop_down
          </span>
        </button>
      </header>

      <div
        className='absolute left-[1rem] top-[3.5rem] flex'
        style={{
          width: `min(7.75rem, calc(var(--card-width-current) - 2rem))`
        }}
      >
        <button
          type='button'
          className='flex w-[3.0625rem] items-center justify-center rounded-l-[1rem] border border-neutral-300 border-r-0 bg-neutral-300 px-[0.5rem] py-[0.25rem] text-[0.75rem] font-normal leading-4 text-neutral-900'
          aria-pressed={view === 'barras'}
        >
          Barras
        </button>
        <button
          type='button'
          className='flex w-[3.5rem] items-center justify-center rounded-r-[1rem] border border-neutral-300 px-[0.25rem] py-[0.25rem] text-[0.75rem] font-normal leading-4 text-neutral-900'
          aria-pressed={view === 'circular'}
        >
          Circular
        </button>
      </div>

      <div
        className='absolute left-[1rem] top-[6.5rem] flex items-center justify-center'
        style={{
          width: donutSize,
          height: donutSize
        }}
        aria-hidden='true'
      >
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={specialties}
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
              {specialties.map(({ label, colorToken }) => (
                <Cell key={label} fill={colorToken} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className='absolute inset-[0.75rem] rounded-full border border-[rgba(255,255,255,0.5)] bg-surface' />
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-gapsm'>
          <p className='text-headline-lg text-neutral-900'>{value}</p>
          <div className='flex items-center gap-gapsm'>
            <span className='text-body-sm font-normal text-brand-500'>{delta}</span>
            <span className='material-symbols-rounded text-[1rem] leading-4 text-brand-500'>
              arrow_outward
            </span>
          </div>
        </div>
      </div>

      <dl
        className='absolute top-[9.6875rem] flex flex-col gap-[0.75rem] text-[0.75rem] leading-4 text-neutral-800'
        style={{
          left: legendLeft,
          width: legendWidth
        }}
      >
        {specialties.map(({ label, percentage, colorToken }) => (
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
    </section>
  )
}
