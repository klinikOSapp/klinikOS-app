'use client'

import { PendingCollectionsModal } from '@/components/caja/PendingCollectionsModal'
import type { CashTimeScale } from '@/components/caja/cajaTypes'
import { useClinic } from '@/context/ClinicContext'
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

type DonutData = {
  data: Array<{ name: string; value: number; color: string }>
  value: number
  target: number
  pendingToCollect: number
}

const CARD_HEIGHT_REM = 17.5
const INCOME_CARD_WIDTH_PX = 1069
const SUMMARY_CARD_WIDTH_REM = 12.375 // 198px
const SUMMARY_CARD_HEIGHT_REM = 6
const SUMMARY_CARD_COLUMN_GAP_REM = 1.375 // 22px
const SUMMARY_CARD_ROW_GAP_REM = 1 // 16px
const SUMMARY_GRID_WIDTH_REM =
  SUMMARY_CARD_WIDTH_REM * 2 + SUMMARY_CARD_COLUMN_GAP_REM // 26.125rem
const DONUT_CARD_HEIGHT_REM = 13
const DONUT_CARD_MIN_HEIGHT_REM = DONUT_CARD_HEIGHT_REM
const DONUT_MAX_WIDTH_REM = 36.8
const DONUT_MIN_WIDTH_REM = 15
const DONUT_HEIGHT_RATIO = 186.093 / 307
const DONUT_SAFE_SPACE_REM = 0
const DONUT_SCALE = 1.55

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

type CashSummaryCardProps = {
  date: Date
  timeScale: CashTimeScale
  onHeightChange?: (heightRem: number) => void
}

export default function CashSummaryCard({
  date,
  timeScale,
  onHeightChange
}: CashSummaryCardProps) {
  const { activeClinicId } = useClinic()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const scaleRef = useRef(1)
  const [scale, setScale] = useState(1)
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([])
  const [donutData, setDonutData] = useState<DonutData>({
    data: [
      { name: 'actual', value: 0, color: 'var(--color-brand-500)' },
      { name: 'remaining', value: 0, color: 'var(--color-brand-50)' }
    ],
    value: 0,
    target: 0,
    pendingToCollect: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [pendingModalOpen, setPendingModalOpen] = useState(false)

  const formatMadridDate = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d)

  // v2.0: KPI cards are filterable and change with temporal selection
  useEffect(() => {
    if (!activeClinicId) {
      setSummaryCards([])
      setIsLoading(false)
      return
    }
    const controller = new AbortController()
    setIsLoading(true)
    const dateStr = formatMadridDate(date)
    fetch(
      `/api/caja/summary?date=${dateStr}&timeScale=${timeScale}&clinicId=${encodeURIComponent(
        activeClinicId
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return
        if (data.summary) {
          setSummaryCards(data.summary)
        }
        if (data.donut) {
          const value = Number(data.donut.value || 0)
          const target = Number(data.donut.target || 0)
          const pendingToCollect = Number(
            data.donut.pendingToCollect ?? Math.max(target - value, 0)
          )
          setDonutData({
            data: [
              { name: 'actual', value, color: 'var(--color-brand-500)' },
              {
                name: 'remaining',
                value: Math.max(target - value, 0),
                color: 'var(--color-brand-50)'
              }
            ],
            value,
            target,
            pendingToCollect
          })
        }
        setIsLoading(false)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error('Error fetching summary:', error)
        setIsLoading(false)
      })
    return () => controller.abort()
  }, [date, timeScale, activeClinicId])

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
      <div className='flex h-full w-full flex-col px-[1.5rem] py-[1rem]'>
        <div className='mt-[1rem] flex flex-1 gap-gapmd'>
          <div className='grid flex-none' style={summaryGridStyles}>
            {isLoading ? (
              <div className='col-span-2 text-center py-8 text-neutral-500'>Cargando...</div>
            ) : (
              summaryCards.map((card) => (
                <SummaryInsightCard
                  key={card.id}
                  card={card}
                  iconSizeRem={iconSizeRem}
                  onClick={
                    card.id === 'toCollect' || card.id === 'pending'
                      ? () => setPendingModalOpen(true)
                      : undefined
                  }
                />
              ))
            )}
          </div>
          <div className='flex flex-1 min-h-0'>
            <CashDonutGauge donutData={donutData} />
          </div>
        </div>
      </div>

      <PendingCollectionsModal
        open={pendingModalOpen}
        onClose={() => setPendingModalOpen(false)}
        dateStr={formatMadridDate(date)}
        timeScale={timeScale}
      />
    </article>
  )
}

function SummaryInsightCard({
  card,
  iconSizeRem,
  onClick
}: {
  card: SummaryCard
  iconSizeRem: number
  onClick?: () => void
}) {
  const cardStyles: CSSProperties = {
    backgroundColor: card.color,
    height: `${SUMMARY_CARD_HEIGHT_REM}rem`,
    width: `${SUMMARY_CARD_WIDTH_REM}rem`
  }

  const content = (
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
          <div
            className={`flex items-center gap-[0.25rem] text-body-sm whitespace-nowrap ${
              card.delta.startsWith('-') ? 'text-red-500' : 'text-brand-500'
            }`}
          >
            {card.delta}
            {card.delta !== '—' && (
              <span
                className='material-symbols-rounded text-[1rem] leading-[1rem]'
                style={{
                  fontSize: `${iconSizeRem}rem`,
                  lineHeight: `${iconSizeRem}rem`
                }}
              >
                arrow_outward
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof onClick === 'function') {
    return (
      <button
        type='button'
        onClick={onClick}
        className='flex h-full flex-col rounded-lg p-[0.5rem] text-left hover:brightness-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic'
        style={cardStyles}
        aria-label={`Abrir detalle de ${card.title}`}
      >
        {content}
      </button>
    )
  }

  return (
    <div className='flex h-full flex-col rounded-lg p-[0.5rem]' style={cardStyles}>
      {content}
    </div>
  )
}

function CashDonutGauge({ donutData }: { donutData: DonutData }) {
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
    width: '100%',
    height: `${DONUT_CARD_HEIGHT_REM}rem`,
    minHeight: `${DONUT_CARD_MIN_HEIGHT_REM}rem`,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '-1px -1px 8px rgba(0,0,0,0.05), 2px 2px 8px rgba(0,0,0,0.05)',
    minWidth: '1px'
  }

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
        Cobrado vs Facturado
      </p>

      {chartDimensions.widthPx > 0 && chartDimensions.heightPx > 0 ? (
        <div className='absolute' style={chartWrapperStyles} aria-hidden='true'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={donutData.data}
                dataKey='value'
                startAngle={180}
                endAngle={0}
                innerRadius='85%'
                outerRadius='100%'
                cx='50%'
                cy='100%'
                stroke='transparent'
              >
                {donutData.data.map((slice) => (
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
          {donutData.value.toLocaleString('es-ES', {
            minimumFractionDigits: 0
          })}{' '}
          €
        </p>
        <div className='flex items-baseline gap-[0.5rem] text-[0.6875rem] leading-[1rem]'>
          <span className='font-medium'>de</span>
          <span className='text-[1.125rem] font-medium leading-[1.75rem]'>
            {donutData.target.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </span>
        </div>
        {donutData.pendingToCollect > 0 ? (
          <span
            className='text-label-sm font-medium'
            style={{ color: 'var(--color-warning-600)' }}
          >
            {donutData.pendingToCollect.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            € pdte cobrar
          </span>
        ) : null}
      </div>
    </div>
  )
}
