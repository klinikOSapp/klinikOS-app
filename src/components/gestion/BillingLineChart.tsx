'use client'
import {
  Line,
  LineChart,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
import { useEffect, useState } from 'react'
type BillingLineChartProps = { yearLabel?: string }

const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'
const CARD_WIDTH_VAR = 'var(--width-card-chart-lg-fluid)'
const CARD_WIDTH_STYLE = 'min(100%, var(--width-card-chart-lg-fluid))'

const HEADER_LEFT_RATIO = 16 / 1069
const HEADER_TOP_RATIO = 16 / 342
const Y_AXIS_LEFT_RATIO = 16 / 1069
const Y_AXIS_TOP_RATIO = 64 / 342
const Y_AXIS_HEIGHT_RATIO = 222 / 342
const GRID_LEFT_RATIO = 63 / 1069
const GRID_TOP_RATIO = 58 / 342
const GRID_WIDTH_RATIO = 824 / 1069
const GRID_HEIGHT_RATIO = 228 / 342
const MONTH_ROW_TOP_RATIO = 302 / 342
const CHIP_PRIMARY_LEFT_RATIO = 410 / 1069
const CHIP_PRIMARY_TOP_RATIO = 118 / 342
const CHIP_SECONDARY_LEFT_RATIO = 442 / 1069
const CHIP_SECONDARY_TOP_RATIO = 86 / 342
const COMPARISON_LEFT_RATIO = 911 / 1069
const COMPARISON_TOP_RATIO = 58 / 342
const COMPARISON_WIDTH_RATIO = 142 / 1069
const HIGHLIGHT_LEFT_RATIO = (63 + 673.3636474609375) / 1069
const HIGHLIGHT_WIDTH_RATIO = 1 / 1069
// Recharts sustituye las líneas SVG estáticas. Los datos por mes permiten dibujar
// la línea "brand" (actual) y la "accent" (comparativa) manteniendo la estructura Figma.
// Valores aproximados para maqueta; deben venir del backend en producción.
const CHART_DATA = [
  { month: 'Ene', brand: 26000, accent: 24000 },
  { month: 'Feb', brand: 28000, accent: 25500 },
  { month: 'Mar', brand: 30000, accent: 27000 },
  { month: 'Abr', brand: 32000, accent: 29500 },
  { month: 'May', brand: 35000, accent: 31500 },
  { month: 'Jun', brand: 33000, accent: 31000 },
  { month: 'Jul', brand: 36000, accent: 33000 },
  { month: 'Ago', brand: 38000, accent: 35000 },
  { month: 'Sept', brand: 39000, accent: 36500 },
  { month: 'Oct', brand: 42000, accent: 40000 },
  { month: 'Nov', brand: 41000, accent: 39500 },
  { month: 'Dic', brand: 43000, accent: 40500 }
]

const Y_AXIS_LABELS = ['90K', '70K', '50K', '30K', '10K', '0']
const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sept',
  'Oct',
  'Nov',
  'Dic'
]

const toWidth = (ratio: number) =>
  `calc(${CARD_WIDTH_VAR} * ${ratio.toFixed(6)})`
const toHeight = (ratio: number) =>
  `calc(${CARD_HEIGHT_VAR} * ${ratio.toFixed(6)})`

export default function BillingLineChart({
  yearLabel = '2024'
}: BillingLineChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])
  return (
    <section
      className='relative w-full overflow-clip rounded-lg bg-surface shadow-elevation-card'
      style={{ height: CARD_HEIGHT_VAR, width: CARD_WIDTH_STYLE }}
    >
      <header
        className='absolute z-10 flex items-baseline justify-between text-fg'
        style={{
          left: toWidth(HEADER_LEFT_RATIO),
          right: toWidth(HEADER_LEFT_RATIO),
          top: toHeight(HEADER_TOP_RATIO)
        }}
      >
        <h3 className='text-title-sm font-medium'>Facturación</h3>
        <div className='flex items-center gap-[0.25rem] text-label-sm'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[1rem] leading-none'>
            arrow_drop_down
          </span>
        </div>
      </header>

      <div
        className='absolute flex flex-col justify-between text-label-sm text-neutral-400'
        style={{
          left: toWidth(Y_AXIS_LEFT_RATIO),
          top: toHeight(Y_AXIS_TOP_RATIO),
          height: toHeight(Y_AXIS_HEIGHT_RATIO)
        }}
      >
        {Y_AXIS_LABELS.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(GRID_LEFT_RATIO),
          top: toHeight(GRID_TOP_RATIO),
          width: toWidth(GRID_WIDTH_RATIO),
          height: toHeight(GRID_HEIGHT_RATIO)
        }}
      >
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'linear-gradient(to bottom, var(--chart-grid) 1px, transparent 1px), linear-gradient(to right, var(--chart-grid) 1px, transparent 1px)',
            backgroundSize: '100% calc(100% / 5), calc(100% / 11) 100%',
            backgroundPosition: 'left top, left top'
          }}
        />
        <div
          className='absolute inset-y-0'
          style={{
            left: toWidth(HIGHLIGHT_LEFT_RATIO),
            width: `max(1px, calc(${CARD_WIDTH_VAR} * ${HIGHLIGHT_WIDTH_RATIO.toFixed(
              6
            )}))`,
            backgroundColor: 'var(--color-warning-200)'
          }}
        />
        <div className='absolute inset-0'>
          {isMounted && (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={CHART_DATA}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
              >
                {/* Ejes ocultos para mantener las etiquetas personalizadas de Figma */}
                <XAxis dataKey='month' hide />
                <YAxis domain={[0, 90000]} hide />
                {/* Línea comparativa (info-200) - estilo discontínuo */}
                <Line
                  type='monotone'
                  dataKey='accent'
                  stroke='var(--info-200, #D4B5FF)'
                  strokeWidth={2}
                  strokeDasharray='4 4'
                  dot={false}
                  animationDuration={1200}
                  animationBegin={150}
                />
                {/* Línea principal (brandSemantic) */}
                <Line
                  type='monotone'
                  dataKey='brand'
                  stroke='var(--brandSemantic, #51D6C7)'
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1200}
                  animationBegin={0}
                />
                {/* Punto de foco en un mes concreto (aprox. a la maqueta) */}
                <ReferenceDot
                  x='Jun'
                  y={33000}
                  r={6}
                  fill='var(--brandSemantic, #51D6C7)'
                  stroke='var(--brandSemantic, #51D6C7)'
                  isFront
                />
                {/* Línea vertical destacada en "Oct" como en la maqueta */}
                <ReferenceLine
                  x='Oct'
                  stroke='var(--color-warning-200)'
                  strokeWidth={1}
                  ifOverflow='extendDomain'
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(CHIP_PRIMARY_LEFT_RATIO),
          top: toHeight(CHIP_PRIMARY_TOP_RATIO),
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className='rounded-full border border-brandSemantic bg-brand-50 px-[0.5rem] py-[0.25rem] text-label-sm text-brandSemantic'>
          21.000 €
        </div>
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(CHIP_SECONDARY_LEFT_RATIO),
          top: toHeight(CHIP_SECONDARY_TOP_RATIO),
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className='rounded-full border border-info-200 border-dashed px-[0.5rem] py-[0.25rem] text-label-sm text-info-200'>
          24.000 €
        </div>
      </div>

      <div
        className='absolute flex justify-between text-label-sm text-neutral-400'
        style={{
          left: toWidth(GRID_LEFT_RATIO),
          top: toHeight(MONTH_ROW_TOP_RATIO),
          width: toWidth(GRID_WIDTH_RATIO)
        }}
      >
        {MONTH_LABELS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      <div
        className='absolute flex flex-col rounded-lg border border-border bg-surface'
        style={{
          left: toWidth(COMPARISON_LEFT_RATIO),
          top: toHeight(COMPARISON_TOP_RATIO),
          width: toWidth(COMPARISON_WIDTH_RATIO),
          height: toHeight(GRID_HEIGHT_RATIO),
          padding: '0.625rem'
        }}
      >
        <p className='text-body-sm font-medium text-neutral-600'>Oct, 2025</p>
        <p className='mt-[0.75rem] text-headline-lg text-neutral-600'>42.000</p>
        <div className='mt-[0.5rem] flex items-center gap-[0.5rem]'>
          <span className='text-body-lg text-brandSemantic'>+ 6%</span>
          <span className='material-symbols-rounded text-brandSemantic text-[1.5rem] leading-none'>
            arrow_outward
          </span>
        </div>
        <p className='mt-[3.25rem] text-label-sm text-neutral-600'>Oct, 2024</p>
        <p className='text-title-sm font-medium text-info-200'>40.000</p>
      </div>
    </section>
  )
}
