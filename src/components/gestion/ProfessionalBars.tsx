'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
import type {
  GestionProfessionalMetric,
  GestionSpecialtyMetric,
  SpecialtyFilter
} from './gestionTypes'

const BAR_COLORS = ['#2A6B67', '#51D6C7', '#D3F7F3', '#A8EFE7', '#9ADACF']
const CARD_HEIGHT_REM = '21.375rem'

const formatYAxis = (value: number): string => {
  if (value === 0) return '0 €'
  if (value >= 1000) {
    const k = value / 1000
    return `${k % 1 === 0 ? k : k.toFixed(1)}K €`
  }
  return `${Math.round(value)} €`
}

export default function ProfessionalBars({
  timeScale = 'week',
  selectedSpecialty,
  professionals,
  specialties
}: {
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
  professionals?: GestionProfessionalMetric[]
  specialties?: GestionSpecialtyMetric[]
}) {
  const cardStyles: CSSProperties = {
    width: '100%',
    height: `min(${CARD_HEIGHT_REM}, var(--chart-prof-height-limit, ${CARD_HEIGHT_REM}))`
  }

  const specialtyShare =
    selectedSpecialty
      ? (specialties?.find((item) => item.label === selectedSpecialty)?.sharePercent ||
          0) / 100
      : 1

  const rawData = (professionals || []).map((item, index) => ({
    name: item.name,
    value: selectedSpecialty ? item.produced * specialtyShare : item.produced,
    color: BAR_COLORS[index % BAR_COLORS.length]
  }))

  const data = rawData.filter((item) => item.value > 0)
  const maxValue = Math.max(...data.map((d) => d.value), 1000)
  const roundedMax = Math.ceil(maxValue / 1000) * 1000
  const step = roundedMax / 5
  const ticks = Array.from({ length: 6 }, (_, i) => (5 - i) * step)

  return (
    <section
      className='relative overflow-visible rounded-[0.5rem] bg-white shadow-elevation-card'
      style={cardStyles}
    >
      <header className='absolute left-3 lg:left-4 top-3 lg:top-4 right-3 lg:right-4 flex items-center justify-between'>
        <h3 className='text-title-sm font-medium text-[#24282C] truncate'>
          Producción por profesional
          {selectedSpecialty && (
            <span className='text-brand-500 font-normal'>
              {' '}
              · {selectedSpecialty}
            </span>
          )}
        </h3>
      </header>

      <div
        className='relative h-full w-full outline-none'
        style={{ transform: 'translateY(-0.25rem)' }}
        tabIndex={-1}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            style={{ outline: 'none' }}
            data={data}
            margin={{
              top: 56,
              right: 12,
              left: 8,
              bottom: 5
            }}
            barCategoryGap='20%'
          >
            <CartesianGrid stroke='#E2E7EA' vertical={false} />
            <YAxis
              domain={[0, roundedMax]}
              ticks={ticks}
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEB8C2', fontSize: 'var(--text-label-sm)', fontWeight: 400 }}
              width={44}
            />
            <XAxis
              dataKey='name'
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEB8C2', fontSize: 'var(--text-label-sm)', fontWeight: 400 }}
              interval={0}
            />
            <Bar dataKey='value' radius={[12, 12, 0, 0]} maxBarSize={60}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
