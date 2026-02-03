'use client'

import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps
} from 'recharts'
import type { CallVolumeDataPoint, VoiceAgentTier } from './voiceAgentTypes'

type CallVolumeChartProps = {
  data?: CallVolumeDataPoint[]
  tier?: VoiceAgentTier
}

// Default data - Daily call volumes (last 7 days)
const DEFAULT_DATA: CallVolumeDataPoint[] = [
  {
    day: 'Lun',
    volumeTotal: 45,
    citasPropuestas: 32,
    citasAceptadas: 28,
    urgentes: 5
  },
  {
    day: 'Mar',
    volumeTotal: 52,
    citasPropuestas: 38,
    citasAceptadas: 31,
    urgentes: 7
  },
  {
    day: 'Mié',
    volumeTotal: 48,
    citasPropuestas: 35,
    citasAceptadas: 29,
    urgentes: 4
  },
  {
    day: 'Jue',
    volumeTotal: 61,
    citasPropuestas: 45,
    citasAceptadas: 38,
    urgentes: 9
  },
  {
    day: 'Vie',
    volumeTotal: 58,
    citasPropuestas: 42,
    citasAceptadas: 35,
    urgentes: 6
  },
  {
    day: 'Sáb',
    volumeTotal: 35,
    citasPropuestas: 25,
    citasAceptadas: 20,
    urgentes: 3
  },
  {
    day: 'Dom',
    volumeTotal: 18,
    citasPropuestas: 12,
    citasAceptadas: 8,
    urgentes: 2
  }
]

// Chart colors from Figma
const COLORS = {
  volumeTotal: '#51D6C7', // brand-500 (teal)
  citasPropuestas: '#D4B5FF', // info-200 (purple)
  citasAceptadas: '#FFD188', // warning-200 (yellow)
  urgentes: '#FF6B6B' // error-400 (red)
}

const Y_CONFIG = {
  domain: [0, 100] as [number, number],
  labels: ['100', '80', '60', '40', '20', '0']
}

/**
 * Call Volume Line Chart
 * Compact version: 54.75rem × 17rem
 * Shows different lines based on tier:
 * - Basic: Volumen total, Urgentes
 * - Advanced: Volumen total, Citas propuestas, Citas aceptadas
 */
export default function CallVolumeChart({
  data = DEFAULT_DATA,
  tier = 'advanced'
}: CallVolumeChartProps) {
  const isBasic = tier === 'basic'
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => setIsMounted(true), [])

  const sectionStyles: CSSProperties = {
    width: '100%',
    height: '100%',
    minHeight: 'min(17rem, 28vh)'
  }

  return (
    <section
      className='relative flex w-full flex-col overflow-hidden rounded-lg bg-surface shadow-elevation-card'
      style={sectionStyles}
    >
      {/* Header */}
      <header className='flex shrink-0 items-center justify-between px-3 pt-3 gap-3'>
        <h3 className='text-label-md font-medium text-fg'>
          Volumen de llamadas
        </h3>

        {/* Legend - Different items for basic vs advanced */}
        <div className='flex items-center gap-3 text-label-sm shrink-0'>
          <div className='flex items-center gap-1'>
            <span
              className='h-2 w-2 rounded-full'
              style={{ backgroundColor: COLORS.volumeTotal }}
            />
            <span className='text-neutral-900'>Total</span>
          </div>
          {isBasic ? (
            <div className='flex items-center gap-1'>
              <span
                className='h-2 w-2 rounded-full'
                style={{ backgroundColor: COLORS.urgentes }}
              />
              <span className='text-neutral-900'>Urgentes</span>
            </div>
          ) : (
            <>
              <div className='flex items-center gap-1'>
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: COLORS.citasPropuestas }}
                />
                <span className='text-neutral-900'>Propuestas</span>
              </div>
              <div className='flex items-center gap-1'>
                <span
                  className='h-2 w-2 rounded-full'
                  style={{ backgroundColor: COLORS.citasAceptadas }}
                />
                <span className='text-neutral-900'>Aceptadas</span>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Chart area */}
      <div className='flex flex-1 overflow-hidden px-3 pb-2 pt-1'>
        <div className='flex min-w-0 flex-1 flex-col'>
          {/* Y-axis + Chart grid container */}
          <div className='flex flex-1'>
            {/* Y-axis labels */}
            <div className='flex w-8 shrink-0 flex-col justify-between py-1 text-label-sm font-normal text-neutral-400'>
              {Y_CONFIG.labels.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>

            {/* Chart area */}
            <div className='relative flex-1'>
              {/* Grid background */}
              <div
                className='absolute inset-0'
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, var(--chart-grid) 1px, transparent 1px), linear-gradient(to right, var(--chart-grid) 1px, transparent 1px)',
                  backgroundSize: '100% calc(100% / 5), calc(100% / 6) 100%',
                  backgroundPosition: 'left top, left top'
                }}
              />

              {/* Recharts container */}
              <div className='absolute inset-0 outline-none' tabIndex={-1}>
                {isMounted && (
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart
                      data={data}
                      margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
                    >
                      <XAxis dataKey='day' hide />
                      <YAxis domain={Y_CONFIG.domain} hide />

                      {/* Volumen total line */}
                      <Line
                        type='monotone'
                        dataKey='volumeTotal'
                        stroke={COLORS.volumeTotal}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: COLORS.volumeTotal,
                          stroke: '#fff',
                          strokeWidth: 2
                        }}
                        animationDuration={1200}
                      />

                      {/* Basic mode: Urgentes line */}
                      {isBasic && (
                        <Line
                          type='monotone'
                          dataKey='urgentes'
                          stroke={COLORS.urgentes}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: COLORS.urgentes,
                            stroke: '#fff',
                            strokeWidth: 2
                          }}
                          animationDuration={1200}
                          animationBegin={100}
                        />
                      )}

                      {/* Advanced mode: Citas propuestas line */}
                      {!isBasic && (
                        <Line
                          type='monotone'
                          dataKey='citasPropuestas'
                          stroke={COLORS.citasPropuestas}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: COLORS.citasPropuestas,
                            stroke: '#fff',
                            strokeWidth: 2
                          }}
                          animationDuration={1200}
                          animationBegin={100}
                        />
                      )}

                      {/* Advanced mode: Citas aceptadas line */}
                      {!isBasic && (
                        <Line
                          type='monotone'
                          dataKey='citasAceptadas'
                          stroke={COLORS.citasAceptadas}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: COLORS.citasAceptadas,
                            stroke: '#fff',
                            strokeWidth: 2
                          }}
                          animationDuration={1200}
                          animationBegin={200}
                        />
                      )}

                      <Tooltip
                        content={<ChartTooltip isBasic={isBasic} />}
                        cursor={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Highlight badge example - positioned at Thursday (highest day) */}
              <div
                className='pointer-events-none absolute rounded-full border border-brand-500 bg-brand-50 px-2 py-1 text-label-md font-normal text-brand-500'
                style={{
                  left: 'calc(50% - 1rem)',
                  top: 'calc(39% - 1.5rem)'
                }}
              >
                61
              </div>

              {/* Highlight dot */}
              <div
                className='pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 border-2 border-white shadow-elevation-card'
                style={{
                  left: '50%',
                  top: '39%'
                }}
              />
            </div>
          </div>

          {/* X-axis labels */}
          <div className='mt-0.5 flex shrink-0 justify-between pl-8 text-label-sm font-normal text-neutral-400'>
            {data.map((point) => (
              <span key={point.day}>{point.day}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

type ChartTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{ dataKey?: string; value?: number; color?: string }>
  label?: string
  isBasic?: boolean
}

function ChartTooltip(props: ChartTooltipProps) {
  const { active, payload, label, isBasic } = props
  if (!active || !payload || payload.length === 0) return null

  const volumeTotal = payload.find((p) => p.dataKey === 'volumeTotal')?.value
  const urgentes = payload.find((p) => p.dataKey === 'urgentes')?.value
  const citasPropuestas = payload.find(
    (p) => p.dataKey === 'citasPropuestas'
  )?.value
  const citasAceptadas = payload.find(
    (p) => p.dataKey === 'citasAceptadas'
  )?.value

  return (
    <div className='rounded-md border border-border bg-surface px-3 py-2 text-label-md text-neutral-700 shadow-elevation-card'>
      <div className='font-medium text-neutral-900 mb-1.5'>{label}</div>
      {typeof volumeTotal === 'number' && (
        <div className='flex items-center gap-1.5'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: COLORS.volumeTotal }}
          />
          <span>Total: {volumeTotal.toLocaleString('es-ES')}</span>
        </div>
      )}
      {/* Basic mode: show urgentes */}
      {isBasic && typeof urgentes === 'number' && (
        <div className='flex items-center gap-1.5'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: COLORS.urgentes }}
          />
          <span>Urgentes: {urgentes.toLocaleString('es-ES')}</span>
        </div>
      )}
      {/* Advanced mode: show citas propuestas and aceptadas */}
      {!isBasic && typeof citasPropuestas === 'number' && (
        <div className='flex items-center gap-1.5'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: COLORS.citasPropuestas }}
          />
          <span>Propuestas: {citasPropuestas.toLocaleString('es-ES')}</span>
        </div>
      )}
      {!isBasic && typeof citasAceptadas === 'number' && (
        <div className='flex items-center gap-1.5'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: COLORS.citasAceptadas }}
          />
          <span>Aceptadas: {citasAceptadas.toLocaleString('es-ES')}</span>
        </div>
      )}
    </div>
  )
}
