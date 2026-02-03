'use client'

import type { CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { CallDistribution, VoiceAgentTier } from './voiceAgentTypes'

type CallDistributionDonutProps = {
  data?: CallDistribution[]
  tier?: VoiceAgentTier
}

// Default data for Advanced mode - Distribution by type
const DEFAULT_DATA_ADVANCED: CallDistribution[] = [
  { name: 'Pendientes', value: 40, color: '#E9FBF9' }, // brand-50
  { name: 'Confirmadas', value: 30, color: '#A8EFE7' }, // brand-200
  { name: 'Aceptadas', value: 20, color: '#51D6C7' }, // brand-500
  { name: 'Estética', value: 10, color: '#2A6B67' } // brand-800
]

// Default data for Basic mode - Distribution by intent
const DEFAULT_DATA_BASIC: CallDistribution[] = [
  { name: 'Pedir cita', value: 45, color: '#51D6C7' }, // brand-500
  { name: 'Consultas', value: 25, color: '#A8EFE7' }, // brand-200
  { name: 'Cancelaciones', value: 15, color: '#FFD188' }, // warning-200
  { name: 'Urgencias', value: 15, color: '#FF6B6B' } // error-400
]

/**
 * Call Distribution Donut Chart
 * Compact version: 21.625rem × 17rem
 * - Basic mode: Distribution by intent (Pedir cita, Consultas, Cancelaciones, Urgencias)
 * - Advanced mode: Distribution by type (Pendientes, Confirmadas, Aceptadas, Estética)
 */
export default function CallDistributionDonut({
  data,
  tier = 'advanced'
}: CallDistributionDonutProps) {
  const isBasic = tier === 'basic'
  const chartData =
    data ?? (isBasic ? DEFAULT_DATA_BASIC : DEFAULT_DATA_ADVANCED)
  const title = isBasic ? 'Distribución por intención' : 'Distribución por tipo'
  const sectionStyles: CSSProperties = {
    width: '100%',
    height: '100%',
    minHeight: 'min(17rem, 28vh)'
  }

  return (
    <section
      className='relative overflow-hidden rounded-lg bg-surface text-fg shadow-elevation-card flex flex-col min-w-0'
      style={sectionStyles}
    >
      {/* Header */}
      <header className='px-3 pt-3 shrink-0'>
        <h3 className='text-label-md font-medium text-fg'>{title}</h3>
      </header>

      {/* Donut Chart */}
      <div className='flex-1 flex items-center justify-center px-4 py-2 min-h-0'>
        <div
          className='relative outline-none'
          style={{
            width: 'min(9rem, 100%)',
            height: 'min(9rem, 100%)',
            minWidth: '7rem',
            minHeight: '7rem'
          }}
          tabIndex={-1}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Pie
                data={chartData}
                dataKey='value'
                startAngle={90}
                endAngle={-270}
                innerRadius='65%'
                outerRadius='100%'
                paddingAngle={2}
                stroke='transparent'
                isAnimationActive
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className='px-3 pb-2 shrink-0'>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          {chartData.map((entry) => (
            <div key={entry.name} className='flex items-center gap-1'>
              <span
                className='h-2 w-2 rounded-full shrink-0'
                style={{ backgroundColor: entry.color }}
              />
              <div className='flex items-center gap-1 text-label-sm text-neutral-800'>
                <span className='font-normal'>{entry.name}</span>
                <span className='font-medium'>{entry.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
