'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type {
  GestionSpecialtyMetric,
  GestionSummaryKpis,
  SpecialtyFilter
} from './gestionTypes'

const CARD_WIDTH = 'var(--width-card-chart-lg-fluid)'
const CARD_HEIGHT_CLAMP = 'clamp(17rem, 34vh, 21.375rem)'
const CARD_WIDTH_LIMIT = 'var(--accounting-width-limit)'
const CARD_HEIGHT_LIMIT = 'var(--accounting-height-limit)'

const DONUT_CARD_HEIGHT = 248
const BASE_ROOT_FONT_SIZE_PX = 16
const DONUT_HEIGHT_RATIO = 186.093 / 307
const DONUT_SCALE = 1.55
const DONUT_MAX_WIDTH_REM = 25
const DONUT_MIN_WIDTH_REM = 10
const FIXED_COST_RATIO_DEFAULT = 0.6

const toWidth = (px: number) => {
  const ratio = (px / 1069).toFixed(6)
  return `min(calc(${CARD_WIDTH} * ${ratio}), calc(${CARD_WIDTH_LIMIT} * ${ratio}))`
}

const toHeight = (px: number) => {
  const ratio = (px / 342).toFixed(6)
  return `min(calc(${CARD_HEIGHT_CLAMP} * ${ratio}), calc(${CARD_HEIGHT_LIMIT} * ${ratio}))`
}

type AccountingStyle = CSSProperties &
  Record<'--accounting-height-current' | '--stack-scale-y', string>

const getRootFontSize = (allowWindow = false) => {
  if (!allowWindow || typeof window === 'undefined') return BASE_ROOT_FONT_SIZE_PX
  const value = parseFloat(
    getComputedStyle(document.documentElement).fontSize ||
      String(BASE_ROOT_FONT_SIZE_PX)
  )
  return Number.isFinite(value) ? value : BASE_ROOT_FONT_SIZE_PX
}

const remToPx = (rem: number, rootFontSize = BASE_ROOT_FONT_SIZE_PX) =>
  rem * rootFontSize

const pxToRem = (px: number, rootFontSize = BASE_ROOT_FONT_SIZE_PX) =>
  px / rootFontSize

const STACK_TOTAL_SPAN_PX = 273
const STACK_SCALE = Number((DONUT_CARD_HEIGHT / STACK_TOTAL_SPAN_PX).toFixed(6))

function formatAmount(value: number) {
  return `${Math.round(value).toLocaleString('es-ES')} €`
}

function formatDelta(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function resolveScopedValues(
  summary: GestionSummaryKpis,
  specialty: SpecialtyFilter,
  specialties: GestionSpecialtyMetric[]
) {
  if (!specialty) {
    return {
      produced: summary.produced,
      invoiced: summary.invoiced,
      collected: summary.collected,
      pending: summary.pending
    }
  }

  const metric = specialties.find((item) => item.label === specialty)
  if (!metric) {
    return {
      produced: 0,
      invoiced: 0,
      collected: 0,
      pending: 0
    }
  }

  return {
    produced: metric.produced,
    invoiced: metric.invoiced,
    collected: metric.collected,
    pending: metric.pending
  }
}

function getKpiCards(
  summary: GestionSummaryKpis,
  specialty: SpecialtyFilter,
  specialties: GestionSpecialtyMetric[]
) {
  const scoped = resolveScopedValues(summary, specialty, specialties)
  return [
    {
      title: 'Producido',
      bg: 'var(--color-info-50)',
      icon: 'attach_money',
      left: 16,
      top: 64,
      width: 198,
      value: formatAmount(scoped.produced),
      delta: formatDelta(summary.producedDelta)
    },
    {
      title: 'Facturado',
      bg: '#e9f6fb',
      icon: 'receipt_long',
      left: 236,
      top: 64,
      width: 198,
      value: formatAmount(scoped.invoiced),
      delta: formatDelta(summary.invoicedDelta)
    },
    {
      title: 'Cobrado',
      bg: 'var(--color-brand-50)',
      icon: 'check_circle',
      left: 16,
      top: 196,
      width: 198,
      value: formatAmount(scoped.collected),
      delta: formatDelta(summary.collectedDelta)
    },
    {
      title: 'Por cobrar',
      bg: 'var(--color-warning-50)',
      icon: 'hourglass_top',
      left: 236,
      top: 196,
      width: 204,
      value: formatAmount(scoped.pending),
      delta: formatDelta(summary.pendingDelta)
    }
  ]
}

function getDonut(
  summary: GestionSummaryKpis,
  specialty: SpecialtyFilter,
  specialties: GestionSpecialtyMetric[]
) {
  const scoped = resolveScopedValues(summary, specialty, specialties)
  const value = scoped.collected
  const target = Math.max(scoped.invoiced, 0)
  const pending = Math.max(target - value, 0)

  return {
    data: [
      { name: 'actual', value, color: 'var(--color-brand-500)' },
      {
        name: 'remaining',
        value: pending,
        color: 'var(--color-brand-50)'
      }
    ],
    valueLabel: formatAmount(value),
    targetLabel: formatAmount(target),
    pendingValue: pending,
    pendingLabel: formatAmount(pending)
  }
}

function getSideStack(
  summary: GestionSummaryKpis,
  specialty: SpecialtyFilter,
  specialties: GestionSpecialtyMetric[],
  fixedCostRatio: number,
  fixedCostsOverride?: number
) {
  const scoped = resolveScopedValues(summary, specialty, specialties)
  const invoiced = scoped.invoiced
  const fixedCosts =
    specialty || fixedCostsOverride == null
      ? Math.round(invoiced * fixedCostRatio)
      : Math.round(fixedCostsOverride)

  return [
    {
      title: specialty ? `Facturación ${specialty}` : 'Total facturación',
      top: 64,
      height: 248,
      bg: 'var(--color-brand-50)',
      value: formatAmount(invoiced),
      percent: undefined,
      textClass: 'text-fg-secondary'
    },
    {
      title: 'Gastos fijos',
      top: 160,
      height: 177,
      bg: 'var(--color-brand-200)',
      value: formatAmount(fixedCosts),
      percent: `${Math.round(fixedCostRatio * 100)}%`,
      textClass: 'text-fg-secondary'
    }
  ]
}

export default function AccountingPanel({
  timeScale,
  selectedSpecialty,
  summary,
  specialties,
  fixedCosts,
  fixedCostRatio
}: {
  timeScale: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
  summary?: GestionSummaryKpis
  specialties?: GestionSpecialtyMetric[]
  fixedCosts?: number
  fixedCostRatio?: number
}) {
  void timeScale

  const safeSummary: GestionSummaryKpis =
    summary || {
      produced: 0,
      invoiced: 0,
      collected: 0,
      pending: 0,
      producedDelta: 0,
      invoicedDelta: 0,
      collectedDelta: 0,
      pendingDelta: null
    }
  const safeSpecialties = specialties || []
  const ratio =
    typeof fixedCostRatio === 'number' ? fixedCostRatio : FIXED_COST_RATIO_DEFAULT

  const kpis = getKpiCards(safeSummary, selectedSpecialty || null, safeSpecialties)
  const sideStack = getSideStack(
    safeSummary,
    selectedSpecialty || null,
    safeSpecialties,
    ratio,
    fixedCosts
  )
  const donut = getDonut(safeSummary, selectedSpecialty || null, safeSpecialties)

  const sectionStyle: AccountingStyle = {
    width: '100%',
    maxWidth: '100%',
    height: `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`,
    '--accounting-height-current': `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`,
    '--stack-scale-y': STACK_SCALE.toString()
  }

  return (
    <section
      className='relative min-w-0 overflow-clip rounded-lg bg-surface shadow-elevation-card'
      style={sectionStyle}
    >
      <header
        className='absolute flex items-baseline justify-between text-title-sm font-medium text-fg'
        style={{
          left: toWidth(16),
          right: toWidth(16),
          top: toHeight(16)
        }}
      >
        <span>
          Panel de contabilidad
          {selectedSpecialty && (
            <span className='text-brand-500 font-normal'>
              {' '}
              · {selectedSpecialty}
            </span>
          )}
        </span>
      </header>

      {kpis.map((card) => (
        <article
          key={card.title}
          className='absolute flex flex-col rounded-lg p-2 overflow-hidden min-w-0'
          style={{
            left: toWidth(card.left),
            top: toHeight(card.top),
            width: toWidth(card.width),
            height: toHeight(116),
            backgroundColor: card.bg
          }}
        >
          <span className='material-symbols-rounded text-base leading-none text-neutral-600 shrink-0'>
            {card.icon}
          </span>
          <p className='text-label-sm text-neutral-600 mt-1 truncate shrink-0'>
            {card.title}
          </p>
          <div className='mt-auto flex items-baseline justify-between gap-1 min-w-0 overflow-hidden'>
            <p className='text-neutral-600 text-lg lg:text-xl font-normal truncate min-w-0'>
              {card.value}
            </p>
            <span
              className={`shrink-0 text-xs lg:text-label-sm font-medium ${
                card.delta.startsWith('-') ? 'text-red-500' : 'text-brand-500'
              }`}
            >
              {card.delta}
            </span>
          </div>
        </article>
      ))}

      <AccountingDonut
        donut={donut}
        style={{
          left: toWidth(457),
          right: toWidth(205),
          top: toHeight(64),
          height: toHeight(DONUT_CARD_HEIGHT)
        }}
      />

      <div
        className='absolute'
        style={{
          right: toWidth(16),
          top: 0,
          width: toWidth(173),
          height: '100%'
        }}
      >
        {sideStack.map((item) => (
          <div
            key={item.title}
            className='absolute rounded-[1rem]'
            style={{
              left: 0,
              top: `calc(${toHeight(item.top)} * var(--stack-scale-y))`,
              width: '100%',
              height: `calc(${toHeight(item.height)} * var(--stack-scale-y))`,
              backgroundColor: item.bg
            }}
          >
            <div className='relative h-full w-full'>
              <p
                className={`absolute left-[0.5rem] top-[0.5rem] text-label-sm ${item.textClass}`}
                style={{ lineHeight: '1rem' }}
              >
                {item.title}
              </p>
              {item.percent ? (
                <span
                  className={`absolute right-[0.5rem] top-[0.5rem] text-label-sm font-medium ${item.textClass}`}
                  style={{ lineHeight: '1rem' }}
                >
                  {item.percent}
                </span>
              ) : null}
              <p
                className={`absolute left-[0.5rem] top-[2.5rem] text-title-sm font-medium ${item.textClass}`}
                style={{ lineHeight: '1.5rem' }}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function AccountingDonut({
  donut,
  style
}: {
  donut: {
    data: Array<{ name: string; value: number; color: string }>
    valueLabel: string
    targetLabel: string
    pendingValue: number
    pendingLabel: string
  }
  style: CSSProperties
}) {
  const donutCardRef = useRef<HTMLDivElement | null>(null)
  const [chartDimensions, setChartDimensions] = useState(() => {
    const rootFontSize = BASE_ROOT_FONT_SIZE_PX
    const widthPx = remToPx(DONUT_MAX_WIDTH_REM, rootFontSize)
    return {
      widthPx,
      heightPx: widthPx * DONUT_HEIGHT_RATIO
    }
  })
  const [rootFontSize, setRootFontSize] = useState(BASE_ROOT_FONT_SIZE_PX)

  useEffect(() => {
    setRootFontSize(getRootFontSize(true))

    const node = donutCardRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const measuredRootFontSize = getRootFontSize(true)
      const maxWidthPx = remToPx(DONUT_MAX_WIDTH_REM, measuredRootFontSize)
      const minWidthPx = remToPx(DONUT_MIN_WIDTH_REM, measuredRootFontSize)

      const availableWidth = entry.contentRect.width
      const widthPx = Math.min(maxWidthPx, Math.max(minWidthPx, availableWidth))

      const maxHeightPx = entry.contentRect.height
      const heightPx = Math.min(
        widthPx * DONUT_HEIGHT_RATIO,
        Math.max(0, maxHeightPx)
      )

      setChartDimensions((prev) => {
        if (prev.widthPx === widthPx && prev.heightPx === heightPx) return prev
        return { widthPx, heightPx }
      })
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const chartWrapperStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '16%',
    transform: 'translate(-50%, -50%)',
    width: `${pxToRem(chartDimensions.widthPx * DONUT_SCALE, rootFontSize)}rem`,
    height: `${pxToRem(chartDimensions.heightPx * DONUT_SCALE, rootFontSize)}rem`
  }

  const valueStackStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '68%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  }

  return (
    <div
      ref={donutCardRef}
      className='absolute rounded-lg bg-surface shadow-[0px_4px_24px_rgba(36,40,44,0.08)]'
      style={{
        ...style,
        minWidth: '10rem',
        padding: '1rem',
        overflow: 'hidden'
      }}
    >
      <p className='text-label-md text-fg-secondary'>Cobrado vs Facturado</p>

      {chartDimensions.widthPx > 0 && chartDimensions.heightPx > 0 ? (
        <div className='absolute' style={chartWrapperStyles} aria-hidden='true'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart style={{ outline: 'none' }}>
              <Pie
                data={donut.data}
                dataKey='value'
                startAngle={180}
                endAngle={0}
                innerRadius='85%'
                outerRadius='100%'
                cx='50%'
                cy='100%'
                stroke='transparent'
              >
                {donut.data.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div
        className='absolute flex flex-col items-center gap-[0.25rem] text-center text-neutral-600'
        style={valueStackStyles}
      >
        <p
          className='text-headline-lg text-fg-secondary'
          style={{ color: 'var(--color-neutral-600)' }}
        >
          {donut.valueLabel}
        </p>
        <p className='flex items-baseline gap-[0.5rem] text-label-sm leading-[1rem]'>
          <span
            className='font-medium'
            style={{
              color: 'var(--color-neutral-600)',
              fontSize: '0.6875rem',
              lineHeight: '1rem'
            }}
          >
            de
          </span>
          <span
            className='text-title-sm font-medium leading-[1.75rem]'
            style={{ color: 'var(--color-neutral-600)' }}
          >
            {donut.targetLabel}
          </span>
        </p>
        {donut.pendingValue > 0 && (
          <p
            className='text-label-sm font-medium'
            style={{ color: 'var(--color-warning-600)' }}
          >
            {donut.pendingLabel} pdte cobrar
          </p>
        )}
      </div>
    </div>
  )
}
