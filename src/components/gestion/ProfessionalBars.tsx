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

const AXIS_LABELS = [350, 300, 250, 200, 150, 100, 50, 0]

// Medidas extraídas de Figma y convertidas a rem (px ÷ 16)
const CARD_WIDTH_REM = '33.0625rem' // 529px
const CARD_HEIGHT_REM = '21.375rem' // 342px
// Ratios relativos al contenedor base (529x342) para permitir escalado interno
const HEADER_LEFT = '3.025%' // 16 / 529
const HEADER_TOP = '4.678%' // 16 / 342
const HEADER_WIDTH = '93.951%' // 497 / 529
const HEADER_HEIGHT = '7.018%' // 24 / 342

const DATA_WEEK = [
  { name: 'Dr. Guille', value: 330, color: '#2A6B67' },
  { name: 'Dra. Laura', value: 270, color: '#51D6C7' },
  { name: 'Tamara (Hig.)', value: 180, color: '#D3F7F3' },
  { name: 'Nerea (Hig.)', value: 210, color: '#A8EFE7' }
]

const DATA_MONTH = [
  { name: 'Dr. Guille', value: 1240, color: '#2A6B67' },
  { name: 'Dra. Laura', value: 980, color: '#51D6C7' },
  { name: 'Tamara (Hig.)', value: 620, color: '#D3F7F3' },
  { name: 'Nerea (Hig.)', value: 720, color: '#A8EFE7' }
]

export default function ProfessionalBars({
  timeScale = 'week'
}: {
  timeScale?: CashTimeScale
}) {
  const cardStyles: CSSProperties = {
    width: '100%',
    maxWidth: `min(${CARD_WIDTH_REM}, 95vw, var(--chart-prof-width-limit, ${CARD_WIDTH_REM}))`,
    height: `min(${CARD_HEIGHT_REM}, var(--chart-prof-height-limit, ${CARD_HEIGHT_REM}))`
  }

  const data = timeScale === 'month' ? DATA_MONTH : DATA_WEEK

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
          Facturación por profesional
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
              domain={[0, 350]}
              ticks={AXIS_LABELS}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#AEB8C2', fontSize: 12, fontWeight: 400 }}
              width={32}
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
