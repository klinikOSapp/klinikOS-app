'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { getTrendChartData } from '@/data/accountingData'
import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

type CashTrendCardProps = {
  timeScale: CashTimeScale
  anchorDate: Date
  targetHeightRem?: number | null
}

export default function CashTrendCard({
  timeScale,
  anchorDate,
  targetHeightRem
}: CashTrendCardProps) {
  const chartData = useMemo(
    () => getTrendChartData(timeScale, anchorDate),
    [timeScale, anchorDate]
  )

  const {
    dataPoints,
    currentPeriodIndex,
    invoicedLabel,
    targetLabel,
    maxValue,
    yAxisLabels,
    target
  } = chartData

  // Calculate target line position as percentage from bottom
  const targetRatio = target / maxValue

  // Calculate yellow line position (current period)
  const linePosition =
    dataPoints.length > 1
      ? (currentPeriodIndex / (dataPoints.length - 1)) * 100
      : 0

  return (
    <article
      className='relative flex flex-col rounded-lg bg-surface shadow-elevation-card overflow-hidden'
      style={{
        width: '100%',
        height: targetHeightRem ? `${targetHeightRem}rem` : '17.5rem'
      }}
    >
      {/* Header with chips */}
      <div className='flex items-center gap-3 px-4 pt-4 pb-2'>
        <div className='inline-flex items-center gap-1 rounded-full border border-brandSemantic px-3 py-1 text-label-md text-brandSemantic'>
          <span>Facturado:</span>
          <span className='font-bold'>{invoicedLabel}</span>
        </div>
        <div
          className='inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-md text-neutral-600'
          style={{ backgroundColor: 'rgba(81, 214, 199, 0.1)' }}
        >
          <span>Objetivo:</span>
          <span className='font-bold text-neutral-900'>{targetLabel}</span>
        </div>
      </div>

      {/* Chart area */}
      <div className='flex flex-1 min-h-0 px-2 pb-2'>
        {/* Y Axis labels */}
        <div className='flex flex-col justify-between py-1 pr-2 text-label-sm text-neutral-400 w-10 shrink-0'>
          {yAxisLabels.map((label, i) => (
            <span key={i} className='text-right'>
              {label}
            </span>
          ))}
        </div>

        {/* Chart container */}
        <div className='flex-1 flex flex-col min-w-0'>
          {/* Grid and line chart */}
          <div className='relative flex-1 min-h-0'>
            {/* Target zone background */}
            <div
              className='absolute left-0 right-0 bottom-0'
              style={{
                height: `${targetRatio * 100}%`,
                backgroundColor: 'rgba(81, 214, 199, 0.12)'
              }}
            />

            {/* Grid lines */}
            <svg
              className='absolute inset-0 w-full h-full'
              preserveAspectRatio='none'
            >
              {/* Horizontal lines */}
              {[0, 20, 40, 60, 80, 100].map((percent) => (
                <line
                  key={`h-${percent}`}
                  x1='0%'
                  x2='100%'
                  y1={`${percent}%`}
                  y2={`${percent}%`}
                  stroke='var(--color-neutral-200)'
                  strokeWidth={1}
                />
              ))}
              {/* Vertical lines - one per data point */}
              {dataPoints.map((_, i) => {
                const x =
                  dataPoints.length > 1
                    ? (i / (dataPoints.length - 1)) * 100
                    : 50
                return (
                  <line
                    key={`v-${i}`}
                    x1={`${x}%`}
                    x2={`${x}%`}
                    y1='0%'
                    y2='100%'
                    stroke='var(--color-neutral-200)'
                    strokeWidth={1}
                    opacity={0.5}
                  />
                )
              })}
            </svg>

            {/* Line chart */}
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={dataPoints}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <YAxis type='number' domain={[0, maxValue]} hide />
                <XAxis dataKey='label' hide />
                <Line
                  type='monotone'
                  dataKey='value'
                  stroke='var(--color-brand-500)'
                  strokeWidth={3}
                  dot={false}
                  animationDuration={800}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Current period indicator (yellow vertical line) */}
            <div
              className='absolute top-0 bottom-0 w-[2px] pointer-events-none'
              style={{
                left: `${linePosition}%`,
                backgroundColor: '#f4c26f'
              }}
            />

            {/* Current period label badge */}
            {dataPoints[currentPeriodIndex] && (
              <div
                className='absolute -translate-x-1/2 rounded-full bg-surface px-2 py-0.5 text-label-sm font-medium text-neutral-700 shadow-sm border border-neutral-200 pointer-events-none'
                style={{
                  left: `${linePosition}%`,
                  top: '0.25rem'
                }}
              >
                {dataPoints[currentPeriodIndex].label}
              </div>
            )}
          </div>

          {/* X Axis labels */}
          <div className='flex justify-between pt-2 text-label-sm text-neutral-400'>
            {dataPoints.map((point, i) => (
              <span
                key={`${point.label}-${i}`}
                className={
                  i === currentPeriodIndex ? 'font-medium text-neutral-600' : ''
                }
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
