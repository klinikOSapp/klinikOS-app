// use client is required because Recharts depends on browser APIs
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

// Desglose del PRODUCIDO por profesional (valores en decenas de €)
// Semana: 8.400 € total → dividido entre profesionales
const AXIS_LABELS_WEEK = [3500, 3000, 2500, 2000, 1500, 1000, 500, 0]
// Mes: 37.800 € total → escala mayor
const AXIS_LABELS_MONTH = [16000, 14000, 12000, 10000, 8000, 6000, 4000, 2000, 0]

// Formateador para mostrar valores en € con K para miles
const formatYAxis = (value: number): string => {
  if (value === 0) return '0 €'
  if (value >= 1000) {
    const k = value / 1000
    return `${k % 1 === 0 ? k : k.toFixed(1)}K €`
  }
  return `${value} €`
}

// Medidas extraídas de Figma y convertidas a rem (px ÷ 16)
const CARD_WIDTH_REM = '33.0625rem' // 529px
const CARD_HEIGHT_REM = '21.375rem' // 342px
// Ratios relativos al contenedor base (529x342) para permitir escalado interno
const HEADER_LEFT = '3.025%' // 16 / 529
const HEADER_TOP = '4.678%' // 16 / 342
const HEADER_WIDTH = '93.951%' // 497 / 529
const HEADER_HEIGHT = '7.018%' // 24 / 342

// Semana: Producido = 8.400 € (valores en €)
const DATA_WEEK = [
  { name: 'Dr. Guille', value: 3360, color: '#2A6B67' }, // 3.360 € (40%)
  { name: 'Dra. Laura', value: 2520, color: '#51D6C7' }, // 2.520 € (30%)
  { name: 'Tamara (Hig.)', value: 1260, color: '#D3F7F3' }, // 1.260 € (15%)
  { name: 'Nerea (Hig.)', value: 1260, color: '#A8EFE7' } // 1.260 € (15%)
]

// Mes: Producido = 37.800 € (valores en €)
const DATA_MONTH = [
  { name: 'Dr. Guille', value: 15120, color: '#2A6B67' }, // 15.120 € (40%)
  { name: 'Dra. Laura', value: 11340, color: '#51D6C7' }, // 11.340 € (30%)
  { name: 'Tamara (Hig.)', value: 5670, color: '#D3F7F3' }, // 5.670 € (15%)
  { name: 'Nerea (Hig.)', value: 5670, color: '#A8EFE7' } // 5.670 € (15%)
]

export default function ProfessionalBars({
  timeScale = 'week'
}: {
  timeScale?: CashTimeScale
}) {
  const cardStyles: CSSProperties = {
    width: '100%',
    height: `min(${CARD_HEIGHT_REM}, var(--chart-prof-height-limit, ${CARD_HEIGHT_REM}))`
  }

  const data = timeScale === 'month' ? DATA_MONTH : DATA_WEEK
  const axisLabels = timeScale === 'month' ? AXIS_LABELS_MONTH : AXIS_LABELS_WEEK
  const yDomain = timeScale === 'month' ? [0, 16000] : [0, 3500]

  return (
    <section
      className='relative overflow-visible rounded-[0.5rem] bg-white shadow-elevation-card'
      style={cardStyles}
    >
      <header
        className='absolute flex items-center justify-between'
        style={{
          left: HEADER_LEFT,
          top: HEADER_TOP,
          width: HEADER_WIDTH,
          height: HEADER_HEIGHT
        }}
      >
        <h3 className='text-[1rem] font-medium leading-[1.5rem] text-[#24282C]'>
          Producción por profesional
        </h3>
      </header>

      {/* Área de gráfico */}
      <div
        className='relative h-full w-full'
        style={{ transform: 'translateY(-0.5rem)' }}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart
            data={data}
            margin={{
              top: 70,
              right: 24,
              left: 24,
              bottom: 5
            }}
            barSize={58}
            barGap={32}
          >
            <CartesianGrid stroke='#E2E7EA' vertical={false} />
            <YAxis
              domain={yDomain}
              ticks={axisLabels}
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEB8C2', fontSize: 11, fontWeight: 400 }}
              width={52}
            />
            <XAxis
              dataKey='name'
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEB8C2', fontSize: 12, fontWeight: 400 }}
              interval={0}
            />
            <Bar dataKey='value' radius={[16, 16, 0, 0]}>
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
