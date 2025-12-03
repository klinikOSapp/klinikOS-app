'use client'

import type { CSSProperties } from 'react'

const CHART_SERIES = [
  { hour: '9:00', actual: 2 },
  { hour: '10:00', actual: 9 },
  { hour: '11:00', actual: 18 },
  { hour: '12:00', actual: 26 },
  { hour: '13:00', actual: 33 },
  { hour: '14:00', actual: 38 },
  { hour: '15:00', actual: 40 },
  { hour: '16:00', actual: 41 }
]

const X_AXIS_LABELS = [
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00'
]
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

const chartPoints = CHART_SERIES.map((point, index) => {
  const x = (index / (CHART_SERIES.length - 1)) * chartCanvas.width
  const y =
    chartCanvas.height -
    (point.actual / chartCanvas.maxValue) * chartCanvas.height
  return { x, y }
})

const targetHour = '14:00'
const targetPointIndex = CHART_SERIES.findIndex(
  (point) => point.hour === targetHour
)
const clippedChartPoints =
  targetPointIndex >= 0
    ? chartPoints.slice(0, targetPointIndex + 1)
    : chartPoints

const linePathD = clippedChartPoints.reduce((acc, point, index) => {
  const command = `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(
    2
  )} ${point.y.toFixed(2)}`
  return `${acc} ${command}`.trim()
}, '')

const verticalLineLeftPercent = percentOfWidth(
  GRID_LEFT_PX +
    ((X_AXIS_LABELS.indexOf('14:00') / (X_AXIS_LABELS.length - 1)) *
      GRID_WIDTH_PX || 0)
)

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

export default function CashTrendCard() {
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
          style={rectToStyle(FACT_CHIP_RECT)}
        >
          <span>Facturado:</span>
          <span className='font-bold text-brandSemantic'>38.000 €</span>
        </div>

        <div
          className='absolute inline-flex items-center gap-[0.25rem] rounded-pill px-[0.5rem] py-[0.25rem] text-label-md font-normal'
          style={{
            ...rectToStyle(TARGET_CHIP_RECT),
            backgroundColor: 'rgba(81, 214, 199, 0.1)',
            color: 'var(--color-neutral-600)'
          }}
        >
          <span>Objetivo:</span>
          <span className='font-bold text-neutral-900'>14.000 €</span>
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
          {X_AXIS_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className='absolute' style={rectToStyle(GRID_RECT)}>
          <div
            className='absolute'
            style={{
              left: percentOfGridWidth(GRID_FILL_RECT.left),
              top: percentOfGridHeight(GRID_FILL_RECT.top),
              width: percentOfGridWidth(GRID_FILL_RECT.width),
              height: percentOfGridHeight(GRID_FILL_RECT.height),
              backgroundColor: 'rgba(81, 214, 199, 0.12)'
            }}
          />
          <ChartGrid />
          <svg
            viewBox={`0 0 ${chartCanvas.width} ${chartCanvas.height}`}
            className='absolute inset-0'
            preserveAspectRatio='none'
          >
            <path
              d={linePathD}
              fill='none'
              stroke='var(--color-brand-500)'
              strokeWidth={3}
              strokeLinecap='round'
            />
          </svg>
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
