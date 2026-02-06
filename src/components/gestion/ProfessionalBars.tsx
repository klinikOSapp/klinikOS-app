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
import type { SpecialtyFilter } from './gestionTypes'

// Desglose del PRODUCIDO por profesional (valores en decenas de €)
// Semana: 8.400 € total → dividido entre profesionales
const AXIS_LABELS_WEEK = [3500, 3000, 2500, 2000, 1500, 1000, 500, 0]
// Mes: 37.800 € total → escala mayor
const AXIS_LABELS_MONTH = [
  16000, 14000, 12000, 10000, 8000, 6000, 4000, 2000, 0
]

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
  {
    name: 'Dr. Guille',
    value: 3360,
    color: '#2A6B67',
    specialties: ['Conservadora', 'Implantes']
  },
  {
    name: 'Dra. Laura',
    value: 2520,
    color: '#51D6C7',
    specialties: ['Ortodoncia', 'Estética']
  },
  {
    name: 'Tamara (Hig.)',
    value: 1260,
    color: '#D3F7F3',
    specialties: ['Conservadora']
  },
  {
    name: 'Nerea (Hig.)',
    value: 1260,
    color: '#A8EFE7',
    specialties: ['Conservadora', 'Estética']
  }
]

// Mes: Producido = 37.800 € (valores en €)
const DATA_MONTH = [
  {
    name: 'Dr. Guille',
    value: 15120,
    color: '#2A6B67',
    specialties: ['Conservadora', 'Implantes']
  },
  {
    name: 'Dra. Laura',
    value: 11340,
    color: '#51D6C7',
    specialties: ['Ortodoncia', 'Estética']
  },
  {
    name: 'Tamara (Hig.)',
    value: 5670,
    color: '#D3F7F3',
    specialties: ['Conservadora']
  },
  {
    name: 'Nerea (Hig.)',
    value: 5670,
    color: '#A8EFE7',
    specialties: ['Conservadora', 'Estética']
  }
]

// Production values per professional by specialty (week)
const SPECIALTY_PRODUCTION_WEEK: Record<string, Record<string, number>> = {
  'Dr. Guille': {
    Conservadora: 1680,
    Ortodoncia: 0,
    Implantes: 1680,
    Estética: 0
  },
  'Dra. Laura': {
    Conservadora: 0,
    Ortodoncia: 1890,
    Implantes: 0,
    Estética: 630
  },
  'Tamara (Hig.)': {
    Conservadora: 1260,
    Ortodoncia: 0,
    Implantes: 0,
    Estética: 0
  },
  'Nerea (Hig.)': {
    Conservadora: 840,
    Ortodoncia: 0,
    Implantes: 0,
    Estética: 420
  }
}

// Production values per professional by specialty (month)
const SPECIALTY_PRODUCTION_MONTH: Record<string, Record<string, number>> = {
  'Dr. Guille': {
    Conservadora: 7560,
    Ortodoncia: 0,
    Implantes: 7560,
    Estética: 0
  },
  'Dra. Laura': {
    Conservadora: 0,
    Ortodoncia: 8505,
    Implantes: 0,
    Estética: 2835
  },
  'Tamara (Hig.)': {
    Conservadora: 5670,
    Ortodoncia: 0,
    Implantes: 0,
    Estética: 0
  },
  'Nerea (Hig.)': {
    Conservadora: 3780,
    Ortodoncia: 0,
    Implantes: 0,
    Estética: 1890
  }
}

export default function ProfessionalBars({
  timeScale = 'week',
  selectedSpecialty
}: {
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
}) {
  const cardStyles: CSSProperties = {
    width: '100%',
    height: `min(${CARD_HEIGHT_REM}, var(--chart-prof-height-limit, ${CARD_HEIGHT_REM}))`
  }

  // Get base data for the time scale
  const baseData = timeScale === 'month' ? DATA_MONTH : DATA_WEEK
  const productionSource =
    timeScale === 'month'
      ? SPECIALTY_PRODUCTION_MONTH
      : SPECIALTY_PRODUCTION_WEEK

  // Filter and adjust data based on selected specialty
  const data = selectedSpecialty
    ? baseData
        .filter((prof) => prof.specialties.includes(selectedSpecialty))
        .map((prof) => ({
          ...prof,
          value: productionSource[prof.name]?.[selectedSpecialty] ?? 0
        }))
        .filter((prof) => prof.value > 0)
    : baseData

  // Adjust Y-axis based on filtered data
  const maxValue = Math.max(...data.map((d) => d.value), 1000)
  const getYConfig = () => {
    if (selectedSpecialty) {
      // Dynamic scale based on max filtered value
      const roundedMax = Math.ceil(maxValue / 1000) * 1000
      const step = roundedMax / 5
      return {
        domain: [0, roundedMax] as [number, number],
        ticks: Array.from({ length: 6 }, (_, i) => (5 - i) * step)
      }
    }
    // Default scales
    if (timeScale === 'month') {
      return {
        domain: [0, 16000] as [number, number],
        ticks: AXIS_LABELS_MONTH
      }
    }
    return { domain: [0, 3500] as [number, number], ticks: AXIS_LABELS_WEEK }
  }

  const { domain: yDomain, ticks: axisLabels } = getYConfig()

  return (
    <section
      className='relative overflow-visible rounded-[0.5rem] bg-white shadow-elevation-card'
      style={cardStyles}
    >
      {/* Header - responsive positioning */}
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

      {/* Área de gráfico - responsive */}
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
              domain={yDomain}
              ticks={axisLabels}
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
