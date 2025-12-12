'use client'

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

// SUMMARY_CARDS removed - now fetched from API

const CARD_HEIGHT_REM = 21.375 // 342px
const CARD_HEIGHT_PX = 342
const INCOME_CARD_WIDTH_REM = 66.8125 // 1069px
const INCOME_CARD_WIDTH_PX = 1069
const SUMMARY_CARD_WIDTH_REM = 12.375 // 198px
const SUMMARY_CARD_HEIGHT_REM = 7.25 // 116px
const SUMMARY_CARD_COLUMN_GAP_REM = 1.375 // 22px
const SUMMARY_CARD_ROW_GAP_REM = 1 // 16px
const SUMMARY_GRID_WIDTH_REM =
  SUMMARY_CARD_WIDTH_REM * 2 + SUMMARY_CARD_COLUMN_GAP_REM // 26.125rem
const DONUT_CARD_WIDTH_REM = 36.8125 // 589px
const DONUT_CARD_HEIGHT_REM = 15.5 // 248px
const DONUT_CARD_MIN_HEIGHT_REM = DONUT_CARD_HEIGHT_REM
const DONUT_MAX_WIDTH_PX = 480 // 30rem
const DONUT_MIN_WIDTH_PX = 240 // 15rem
const DONUT_HEIGHT_RATIO = 186 / 307
const DONUT_HORIZONTAL_SAFE_SPACE_PX = 32

const pxToRem = (px: number) => px / 16

const DONUT_LABEL_OFFSET_REM = pxToRem(16)

type CashSummaryCardProps = {
  date: Date
  timeScale: 'day' | 'week' | 'month'
  onHeightChange?: (heightRem: number) => void
}

export default function CashSummaryCard({
  date,
  timeScale,
  onHeightChange
}: CashSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [summaryCards, setSummaryCards] = useState<SummaryCard[]>([])
  const [donutValue, setDonutValue] = useState(1200)
  const [donutTarget, setDonutTarget] = useState(1800)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch summary from API (YTD accumulated values - independent of date/timeScale)
  // API always uses TODAY's date for YTD calculations, so cards don't change with filters
  useEffect(() => {
    setIsLoading(true)
    // Don't pass date - API will use today's date for YTD calculations
    fetch(`/api/caja/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) {
          setSummaryCards(data.summary)
        }
        if (data.donut) {
          setDonutValue(data.donut.value)
          setDonutTarget(data.donut.target)
        }
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching summary:', error)
        setIsLoading(false)
      })
  }, []) // Empty dependency array - only fetch once on mount, never refetch

  useEffect(() => {
    const node = cardRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const ratio = Math.min(1, entry.contentRect.width / INCOME_CARD_WIDTH_PX)
      setScale(ratio)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const scaledHeightRem = CARD_HEIGHT_REM * scale

  const sharedCardStyles: CSSProperties = {
    width: '100%',
    maxWidth: `${INCOME_CARD_WIDTH_REM}rem`,
    height: `${scaledHeightRem}rem`,
    overflow: 'hidden'
  }

  useEffect(() => {
    onHeightChange?.(scaledHeightRem)
  }, [scaledHeightRem, onHeightChange])

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
        <header className='flex items-center justify-between'>
          <h2 className='text-title-sm font-medium text-fg'>Ingresos</h2>
          <button
            type='button'
            className='inline-flex items-center gap-[0.25rem] text-label-sm text-fg-secondary'
          >
            2024
            <span className='material-symbols-rounded text-[1rem] leading-4'>
              arrow_drop_down
            </span>
          </button>
        </header>

        <div className='mt-[1rem] flex flex-1 gap-gapmd'>
          <div className='grid flex-none' style={summaryGridStyles}>
            {isLoading ? (
              <div className='col-span-2 text-center py-8 text-neutral-500'>Cargando...</div>
            ) : (
              summaryCards.map((card) => <SummaryInsightCard key={card.id} card={card} />)
            )}
          </div>
          <div className='flex flex-1 min-h-0'>
            <CashDonutGauge value={donutValue} target={donutTarget} />
          </div>
        </div>
      </div>
    </article>
  )
}

function SummaryInsightCard({ card }: { card: SummaryCard }) {
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
      <div className='flex h-full flex-col gap-[1.5rem]'>
        <div className='flex items-center justify-between text-[0.6875rem] font-medium leading-[1rem] text-neutral-600'>
          <span
            className='material-symbols-rounded text-[1rem] leading-4 text-neutral-600'
            aria-hidden
          >
            {card.accessory}
          </span>
          <span>{new Date().getFullYear()}</span>
        </div>
        <div className='flex flex-col gap-[0.25rem] text-neutral-600'>
          <div className='font-medium text-[0.6875rem] leading-[1rem]'>
            {card.title}
          </div>
          <div className='flex items-baseline justify-between gap-[0.5rem]'>
            <p className='text-[1.75rem] leading-[2.25rem] text-neutral-600 whitespace-nowrap'>
              {card.value}
            </p>
            <div className='flex items-center gap-[0.25rem] text-[0.75rem] font-medium text-brand-500 whitespace-nowrap'>
              {card.delta}
              <span className='material-symbols-rounded text-[1rem] leading-4'>
                arrow_outward
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type CashDonutGaugeProps = {
  value: number
  target: number
}

function CashDonutGauge({ value, target }: CashDonutGaugeProps) {
  const donutCardRef = useRef<HTMLDivElement | null>(null)
  const [chartDimensions, setChartDimensions] = useState(() => {
    const widthPx = DONUT_MAX_WIDTH_PX
    return {
      widthPx,
      heightPx: widthPx * DONUT_HEIGHT_RATIO
    }
  })

  const DONUT_DATA = [
    { name: 'actual', value: value, color: 'var(--color-brand-500)' },
    {
      name: 'remaining',
      value: Math.max(target - value, 0),
      color: 'var(--color-brand-50)'
    }
  ]

  useEffect(() => {
    const node = donutCardRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const availableWidth =
        entry.contentRect.width - DONUT_HORIZONTAL_SAFE_SPACE_PX
      const widthPx = Math.min(
        DONUT_MAX_WIDTH_PX,
        Math.max(DONUT_MIN_WIDTH_PX, availableWidth)
      )
      const maxHeightPx =
        entry.contentRect.height - DONUT_HORIZONTAL_SAFE_SPACE_PX
      const heightPx = Math.min(
        widthPx * DONUT_HEIGHT_RATIO,
        Math.max(0, maxHeightPx)
      )

      setChartDimensions((prev) =>
        prev.widthPx === widthPx && prev.heightPx === heightPx
          ? prev
          : { widthPx, heightPx }
      )
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const donutCardStyles: CSSProperties = {
    width: `${DONUT_CARD_WIDTH_REM}rem`,
    height: `${DONUT_CARD_HEIGHT_REM}rem`,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '-1px -1px 8px rgba(0,0,0,0.05), 2px 2px 8px rgba(0,0,0,0.05)'
  }

  const chartWrapperStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '27.5%',
    transform: 'translate(-50%, -55%)',
    width: `${pxToRem(chartDimensions.widthPx)}rem`,
    height: `${pxToRem(chartDimensions.heightPx)}rem`
  }

  const valueStackStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '70%',
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

      <div className='absolute' style={chartWrapperStyles} aria-hidden='true'>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={DONUT_DATA}
              dataKey='value'
              startAngle={180}
              endAngle={0}
              innerRadius='80%'
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

      <div
        className='absolute flex flex-col items-center gap-[0.25rem] text-center text-neutral-600'
        style={valueStackStyles}
      >
        <p className='text-[2.25rem] leading-[2.75rem] text-neutral-600'>
          {value.toLocaleString('es-ES', {
            minimumFractionDigits: 0
          })}{' '}
          €
        </p>
        <div className='flex items-baseline gap-[0.5rem] text-[0.6875rem] leading-[1rem]'>
          <span className='font-medium'>de</span>
          <span className='text-[1.125rem] font-medium leading-[1.75rem]'>
            {target.toLocaleString('es-ES', {
              minimumFractionDigits: 0
            })}{' '}
            €
          </span>
        </div>
      </div>
    </div>
  )
}
