'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

type SummaryCard = {
  id: string
  title: string
  value: string
  delta: string
  color: string
  accessory: string
}

const SUMMARY_CARDS: SummaryCard[] = [
  {
    id: 'produced',
    title: 'Producido',
    value: '1.200 €',
    delta: '+ 12%',
    color: 'var(--color-info-50)',
    accessory: 'money_bag'
  },
  {
    id: 'invoiced',
    title: 'Facturado',
    value: '1.200 €',
    delta: '+ 12%',
    color: '#e9f6fb',
    accessory: 'receipt_long'
  },
  {
    id: 'collected',
    title: 'Cobrado',
    value: '1.200 €',
    delta: '+ 12%',
    color: 'var(--color-brand-50)',
    accessory: 'check'
  },
  {
    id: 'toCollect',
    title: 'Por cobrar',
    value: '-1.200 €',
    delta: '+ 12%',
    color: 'var(--color-warning-50)',
    accessory: 'money_bag'
  }
]

const CARD_HEIGHT_REM = 17.5 // 280px — reducir alto total para ganar espacio a la tabla
const CARD_HEIGHT_PX = 280
const INCOME_CARD_WIDTH_REM = 66.8125 // 1069px
const INCOME_CARD_WIDTH_PX = 1069
const SUMMARY_CARD_WIDTH_REM = 12.375 // 198px
const SUMMARY_CARD_HEIGHT_REM = 6 // 96px — cards más bajas sin tocar tipografías
const SUMMARY_CARD_COLUMN_GAP_REM = 1.375 // 22px
const SUMMARY_CARD_ROW_GAP_REM = 1 // 16px
const SUMMARY_GRID_WIDTH_REM =
  SUMMARY_CARD_WIDTH_REM * 2 + SUMMARY_CARD_COLUMN_GAP_REM // 26.125rem
const DONUT_CARD_WIDTH_REM = 36.8125 // 589px
const DONUT_CARD_HEIGHT_REM = 13 // 208px — acompasa el recorte vertical
const DONUT_CARD_MIN_HEIGHT_REM = DONUT_CARD_HEIGHT_REM
const DONUT_MAX_WIDTH_REM = 36.8 // 588.8px (casi todo el ancho útil de la card de 589px)
const DONUT_MIN_WIDTH_REM = 15 // 240px
const DONUT_HEIGHT_RATIO = 186.093 / 307 // mantener proporción real del donut de gestión
const DONUT_SAFE_SPACE_REM = 0 // sin margen para ocupar casi todo
const DONUT_SCALE = 1.55 // bajar escala para evitar overflow con menor altura

const BASE_ROOT_FONT_SIZE_PX = 16

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

const DONUT_LABEL_OFFSET_REM = 1
const DONUT_VALUE = 1200
const DONUT_TARGET = 1800
const DONUT_DATA = [
  { name: 'actual', value: DONUT_VALUE, color: 'var(--color-brand-500)' },
  {
    name: 'remaining',
    value: Math.max(DONUT_TARGET - DONUT_VALUE, 0),
    color: 'var(--color-brand-50)'
  }
]

type CashSummaryCardProps = {
  onHeightChange?: (heightRem: number) => void
}

export default function CashSummaryCard({
  onHeightChange
}: CashSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const scaleRef = useRef(1)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const node = cardRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width <= 0 || height <= 0) return
      const widthRatio = width / INCOME_CARD_WIDTH_PX
      const ratio = Math.min(1, widthRatio)
      if (Math.abs(ratio - scaleRef.current) < 0.0005) return
      scaleRef.current = ratio
      setScale(ratio)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const sharedCardStyles: CSSProperties = {
    width: '100%',
    maxWidth: `${INCOME_CARD_WIDTH_REM}rem`,
    height: `${CARD_HEIGHT_REM}rem`,
    overflow: 'hidden'
  }

  useEffect(() => {
    onHeightChange?.(CARD_HEIGHT_REM)
  }, [onHeightChange])

  const iconSizeRem = 1 / Math.max(scale, 0.001)

  const summaryGridStyles: CSSProperties = {
    columnGap: `${SUMMARY_CARD_COLUMN_GAP_REM}rem`,
    rowGap: `${SUMMARY_CARD_ROW_GAP_REM}rem`,
    gridTemplateColumns: `repeat(2, ${SUMMARY_CARD_WIDTH_REM}rem)`,
    width: `${SUMMARY_GRID_WIDTH_REM}rem`
  }

  return (
    <article
      ref={cardRef}
      className='relative w-full rounded-lg bg-surface shadow-elevation-card'
      style={sharedCardStyles}
    >
      <div
        className='flex flex-col px-[1.5rem] py-[1rem]'
        style={{
          width: `${INCOME_CARD_WIDTH_REM}rem`,
          height: `${CARD_HEIGHT_REM}rem`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        <div className='mt-[1rem] flex flex-1 gap-gapmd'>
          <div className='grid flex-none' style={summaryGridStyles}>
            {SUMMARY_CARDS.map((card) => (
              <SummaryInsightCard
                key={card.id}
                card={card}
                iconSizeRem={iconSizeRem}
              />
            ))}
          </div>
          <div className='flex flex-1 min-h-0'>
            <CashDonutGauge />
          </div>
        </div>
      </div>
    </article>
  )
}

function SummaryInsightCard({
  card,
  iconSizeRem
}: {
  card: SummaryCard
  iconSizeRem: number
}) {
  const cardStyles: CSSProperties = {
    backgroundColor: card.color,
    height: `${SUMMARY_CARD_HEIGHT_REM}rem`,
    width: `${SUMMARY_CARD_WIDTH_REM}rem`
  }

  return (
    <div
      className='flex h-full flex-col rounded-lg p-[0.5rem]'
      style={cardStyles}
    >
      <div className='flex h-full flex-col gap-[0.75rem]'>
        <div className='flex items-center justify-between text-label-md text-neutral-600'>
          <span
            className='material-symbols-rounded text-[1rem] leading-[1rem] text-neutral-600'
            style={{
              fontSize: `${iconSizeRem}rem`,
              lineHeight: `${iconSizeRem}rem`
            }}
            aria-hidden
          >
            {card.accessory}
          </span>
        </div>
        <div className='flex flex-col gap-[0.125rem] text-neutral-600'>
          <div className='text-label-md'>{card.title}</div>
          <div className='flex items-baseline justify-between gap-[0.5rem]'>
            <p className='text-headline-sm text-neutral-600 whitespace-nowrap'>
              {card.value}
            </p>
            <div className='flex items-center gap-[0.25rem] text-body-sm text-brand-500 whitespace-nowrap'>
              {card.delta}
              <span
                className='material-symbols-rounded text-[1rem] leading-[1rem]'
                style={{
                  fontSize: `${iconSizeRem}rem`,
                  lineHeight: `${iconSizeRem}rem`
                }}
              >
                arrow_outward
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CashDonutGauge() {
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
      const safeSpacePx = remToPx(DONUT_SAFE_SPACE_REM, measuredRootFontSize)
      const maxWidthPx = remToPx(DONUT_MAX_WIDTH_REM, measuredRootFontSize)
      const minWidthPx = remToPx(DONUT_MIN_WIDTH_REM, measuredRootFontSize)

      const availableWidth = entry.contentRect.width - safeSpacePx
      const widthPx = Math.min(maxWidthPx, Math.max(minWidthPx, availableWidth))

      const maxHeightPx = entry.contentRect.height - safeSpacePx
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

  const donutCardStyles: CSSProperties = {
    width: `${DONUT_CARD_WIDTH_REM}rem`,
    height: `${DONUT_CARD_HEIGHT_REM}rem`,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '-1px -1px 8px rgba(0,0,0,0.05), 2px 2px 8px rgba(0,0,0,0.05)',
    minWidth: '1px',
    minHeight: '1px'
  }

  const chartWrapperStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '16%',
    transform: 'translate(-50%, -50%)',
    width: `${pxToRem(
      chartDimensions.widthPx * DONUT_SCALE,
      rootFontSize
    )}rem`,
    height: `${pxToRem(
      chartDimensions.heightPx * DONUT_SCALE,
      rootFontSize
    )}rem`
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
      className='relative flex w-full items-stretch rounded-lg bg-surface'
      style={donutCardStyles}
    >
      <p
        className='absolute text-[0.6875rem] font-medium leading-[1rem] text-neutral-600'
        style={{
          left: `${DONUT_LABEL_OFFSET_REM}rem`,
          top: `${DONUT_LABEL_OFFSET_REM}rem`
        }}
      >
        Cobrado
      </p>

      {chartDimensions.widthPx > 0 && chartDimensions.heightPx > 0 ? (
        <div className='absolute' style={chartWrapperStyles} aria-hidden='true'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={DONUT_DATA}
                dataKey='value'
                startAngle={180}
                endAngle={0}
                innerRadius='85%'
                outerRadius='100%'
                cx='50%'
                cy='100%'
                stroke='transparent'
              >
                {DONUT_DATA.map((slice) => (
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
        <p className='text-[2.25rem] leading-[2.75rem] text-neutral-600'>
          {DONUT_VALUE.toLocaleString('es-ES', {
            minimumFractionDigits: 0
          })}{' '}
          €
        </p>
        <div className='flex items-baseline gap-[0.5rem] text-[0.6875rem] leading-[1rem]'>
          <span className='font-medium'>de</span>
          <span className='text-[1.125rem] font-medium leading-[1.75rem]'>
            {DONUT_TARGET.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </span>
        </div>
      </div>
    </div>
  )
}
