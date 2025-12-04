'use client'

import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { CashTimeScale } from '@/components/caja/cajaTypes'

const Y_AXIS_LABELS = ['50K', '40K', '30K', '20K', '10K', 'º']

const CARD_WIDTH_PX = 523
const CARD_HEIGHT_PX = 342
const TREND_CARD_WIDTH_REM = 32.6875 // 523px
const GRID_WIDTH_PX = 451
const GRID_HEIGHT_PX = 228
const GRID_LEFT_PX = 56
const GRID_TOP_PX = 58
const CARD_PADDING_PX = 16
const Y_AXIS_TOP_PX = 64
const Y_AXIS_HEIGHT_PX = 222
const X_AXIS_TOP_PX = 302
const CHIP_LEFT_PX = 64
const CHIP_FACT_TOP_PX = 66
const CHIP_OBJ_TOP_PX = 98
const TARGET_VALUE_EUR = 30000

const percentOfWidth = (px: number) => `${(px / CARD_WIDTH_PX) * 100}%`
const percentOfHeight = (px: number) => `${(px / CARD_HEIGHT_PX) * 100}%`
const percentOfGridWidth = (px: number) => `${(px / GRID_WIDTH_PX) * 100}%`
const percentOfGridHeight = (px: number) => `${(px / GRID_HEIGHT_PX) * 100}%`

const rectToStyle = ({
  left,
  top,
  width,
  height
}: {
  left: number
  top: number
  width: number
  height: number
}) => ({
  left: percentOfWidth(left),
  top: percentOfHeight(top),
  width: percentOfWidth(width),
  height: percentOfHeight(height)
})

const horizontalLinesPx = [0, 41.2, 82.4, 123.6, 164.8, 206]
const verticalLinesPx = Array.from(
  { length: 12 },
  (_, index) => index * (GRID_WIDTH_PX / 11)
)

const chartCanvas = {
  width: GRID_WIDTH_PX,
  height: GRID_HEIGHT_PX,
  maxValue: 50
}

const HEADER_RECT = {
  left: CARD_PADDING_PX,
  top: CARD_PADDING_PX,
  width: 491,
  height: 24
}
const FACT_CHIP_RECT = {
  left: CHIP_LEFT_PX,
  top: CHIP_FACT_TOP_PX,
  width: 135,
  height: 24
}
const TARGET_CHIP_RECT = {
  left: CHIP_LEFT_PX,
  top: CHIP_OBJ_TOP_PX,
  width: 135,
  height: 24
}
const Y_AXIS_RECT = {
  left: CARD_PADDING_PX,
  top: Y_AXIS_TOP_PX,
  width: 24,
  height: Y_AXIS_HEIGHT_PX
}
const X_AXIS_RECT = {
  left: GRID_LEFT_PX,
  top: X_AXIS_TOP_PX,
  width: GRID_WIDTH_PX,
  height: 16
}
const GRID_RECT = {
  left: GRID_LEFT_PX,
  top: GRID_TOP_PX,
  width: GRID_WIDTH_PX,
  height: GRID_HEIGHT_PX
}
const GRID_FILL_RECT = { left: 0, top: 160, width: GRID_WIDTH_PX, height: 68 }
const TARGET_RATIO = TARGET_VALUE_EUR / (chartCanvas.maxValue * 1000)

type SeriesPoint = {
  label: string
  actual: number
}

type SeriesResult = {
  labels: string[]
  dataPoints: SeriesPoint[]
  highlightIndex: number
}

type CashTrendCardProps = {
  timeScale: CashTimeScale
  anchorDate: Date
}

export default function CashTrendCard({ timeScale, anchorDate }: CashTrendCardProps) {
  const series = useMemo(
    () => buildSeries(timeScale, anchorDate),
    [timeScale, anchorDate]
  )

  const chartLineData = useMemo(
    () =>
      series.dataPoints.map((point, index) => ({
        ...point,
        clippedActual: index <= series.highlightIndex ? point.actual : null
      })),
    [series]
  )

  const verticalLineLeftPercent = useMemo(() => {
    const denominator = Math.max(series.labels.length - 1, 1)
    return percentOfWidth(
      GRID_LEFT_PX + ((series.highlightIndex / denominator) * GRID_WIDTH_PX || 0)
    )
  }, [series])

  const cardStyles: CSSProperties = {
    width: `min(${TREND_CARD_WIDTH_REM}rem, 95vw)`,
    aspectRatio: `${CARD_WIDTH_PX} / ${CARD_HEIGHT_PX}`,
    overflow: 'hidden'
  }

  return (
    <article
      className='relative rounded-lg bg-surface shadow-elevation-card'
      style={cardStyles}
    >
      <div className='relative h-full w-full'>
        <header
          className='absolute flex items-center justify-between'
          style={rectToStyle(HEADER_RECT)}
        >
          <h2 className='text-title-sm font-medium text-fg'>Ingresos</h2>
          <button
            type='button'
            className='inline-flex items-center gap-[0.25rem] text-label-md font-normal text-fg'
          >
            2024
            <span className='material-symbols-rounded text-[1rem] leading-4 text-fg'>
              arrow_drop_down
            </span>
          </button>
        </header>

        <div
          className='absolute inline-flex items-center gap-[0.25rem] rounded-pill border border-brandSemantic px-[0.5rem] py-[0.25rem] text-label-md font-normal text-brandSemantic'
          style={{ ...rectToStyle(FACT_CHIP_RECT), whiteSpace: 'nowrap' }}
        >
          <span>Facturado:</span>
          <span className='font-bold text-brandSemantic'>38.000 €</span>
        </div>

        <div
          className='absolute inline-flex items-center gap-[0.25rem] rounded-pill px-[0.5rem] py-[0.25rem] text-label-md font-normal'
          style={{
            ...rectToStyle(TARGET_CHIP_RECT),
            backgroundColor: 'rgba(81, 214, 199, 0.1)',
            color: 'var(--color-neutral-600)',
            whiteSpace: 'nowrap'
          }}
        >
          <span>Objetivo:</span>
          <span className='font-bold text-neutral-900'>
            {TARGET_VALUE_EUR.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </span>
        </div>

        <div
          className='absolute flex flex-col justify-between text-label-md font-normal text-neutral-400'
          style={rectToStyle(Y_AXIS_RECT)}
        >
          {Y_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div
          className='absolute flex items-center justify-between text-label-md font-normal text-neutral-400'
          style={rectToStyle(X_AXIS_RECT)}
        >
          {series.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className='absolute' style={rectToStyle(GRID_RECT)}>
          <div
            className='absolute'
            style={{
              left: percentOfGridWidth(GRID_FILL_RECT.left),
              top: `${(1 - TARGET_RATIO) * 100}%`,
              width: percentOfGridWidth(GRID_FILL_RECT.width),
              height: `${TARGET_RATIO * 100}%`,
              backgroundColor: 'rgba(81, 214, 199, 0.12)'
            }}
          />
          <ChartGrid />
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartLineData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <YAxis type='number' domain={[0, 50]} hide />
              <XAxis dataKey='label' type='category' hide />
              <Line
                type='monotone'
                dataKey='clippedActual'
                stroke='var(--color-brand-500)'
                strokeWidth={3}
                dot={false}
                animationDuration={1100}
                animationBegin={200}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          className='absolute'
          style={{
            left: verticalLineLeftPercent,
            top: percentOfHeight(GRID_TOP_PX),
            width: percentOfWidth(1),
            height: percentOfHeight(GRID_HEIGHT_PX),
            backgroundColor: '#f4c26f'
          }}
        />
      </div>
    </article>
  )
}

function ChartGrid() {
  return (
    <svg
      viewBox={`0 0 ${chartCanvas.width} ${chartCanvas.height}`}
      className='absolute inset-0'
      preserveAspectRatio='none'
    >
      {horizontalLinesPx.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          x2={chartCanvas.width}
          y1={y}
          y2={y}
          stroke='var(--chart-grid)'
          strokeWidth={1}
          opacity={0.35}
        />
      ))}
      {verticalLinesPx.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          x2={x}
          y1={0}
          y2={chartCanvas.height}
          stroke='var(--chart-grid)'
          strokeWidth={1}
          opacity={0.15}
        />
      ))}
    </svg>
  )
}

function buildSeries(scale: CashTimeScale, anchorDate: Date): SeriesResult {
  switch (scale) {
    case 'week':
      return buildWeeklySeries(anchorDate)
    case 'month':
      return buildMonthlySeries(anchorDate)
    case 'day':
    default:
      return buildDailySeries(anchorDate)
  }
}

function buildDailySeries(anchorDate: Date): SeriesResult {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric'
  })
  const dataPoints: SeriesPoint[] = []
  for (let delta = 6; delta >= 0; delta--) {
    const date = addDays(anchorDate, -delta)
    dataPoints.push({
      label: formatter.format(date),
      actual: generateValue(date, 1.4, 12)
    })
  }
  return {
    labels: dataPoints.map((point) => point.label),
    dataPoints,
    highlightIndex: dataPoints.length - 1
  }
}

function buildWeeklySeries(anchorDate: Date): SeriesResult {
  const dataPoints: SeriesPoint[] = []
  for (let delta = 3; delta >= 0; delta--) {
    const start = startOfWeek(addDays(anchorDate, -7 * delta))
    const weekNumber = getWeekOfYear(start)
    dataPoints.push({
      label: `Sem ${weekNumber}`,
      actual: generateValue(start, 2.2, 18)
    })
  }
  return {
    labels: dataPoints.map((point) => point.label),
    dataPoints,
    highlightIndex: dataPoints.length - 1
  }
}

function buildMonthlySeries(anchorDate: Date): SeriesResult {
  const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short' })
  const dataPoints: SeriesPoint[] = []
  for (let delta = 5; delta >= 0; delta--) {
    const date = addMonths(anchorDate, -delta)
    dataPoints.push({
      label: formatter.format(date),
      actual: generateValue(date, 2.5, 20)
    })
  }
  return {
    labels: dataPoints.map((point) => point.label),
    dataPoints,
    highlightIndex: dataPoints.length - 1
  }
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

function addMonths(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + amount)
  return copy
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay() || 7
  if (day !== 1) {
    copy.setDate(copy.getDate() - (day - 1))
  }
  return copy
}

function getWeekOfYear(date: Date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = Math.floor(
    (Number(date) - Number(firstDayOfYear)) / 86400000
  )
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

function generateValue(date: Date, slope: number, base: number) {
  const seed = date.getDate() + date.getMonth() * 31
  const noise = ((seed * 11) % 7) * 0.6
  const trend = ((date.getMonth() % 6) + 1) * slope
  const value = Math.min(48, Math.max(8, base + trend + noise))
  return Math.round((value + Number.EPSILON) * 10) / 10
}

