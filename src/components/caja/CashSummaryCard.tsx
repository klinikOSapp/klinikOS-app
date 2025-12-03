'use client'

import type { CSSProperties } from 'react'
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

const CARD_HEIGHT_REM = 21.375 // 342px
const INCOME_CARD_WIDTH_REM = 66.8125 // 1069px
const SUMMARY_CARD_WIDTH_REM = 12.375 // 198px
const SUMMARY_CARD_HEIGHT_REM = 7.25 // 116px
const SUMMARY_CARD_COLUMN_GAP_REM = 1.375 // 22px
const SUMMARY_CARD_ROW_GAP_REM = 1 // 16px
const SUMMARY_GRID_WIDTH_REM =
  SUMMARY_CARD_WIDTH_REM * 2 + SUMMARY_CARD_COLUMN_GAP_REM // 26.125rem
const DONUT_CARD_WIDTH_REM = 36.8125 // 589px
const DONUT_CARD_HEIGHT_REM = 15.5 // 248px
const DONUT_CARD_MIN_HEIGHT_REM = DONUT_CARD_HEIGHT_REM

const pxToRem = (px: number) => px / 16

const DONUT_LABEL_OFFSET_REM = pxToRem(16)
const DONUT_VALUE = 1200
const DONUT_TARGET = 1800
const DONUT_CHART_SIZE_REM = 30
const DONUT_DATA = [
  { name: 'actual', value: DONUT_VALUE, color: 'var(--color-brand-500)' },
  {
    name: 'remaining',
    value: Math.max(DONUT_TARGET - DONUT_VALUE, 0),
    color: 'var(--color-brand-50)'
  }
]

export default function CashSummaryCard() {
  const sharedCardStyles: CSSProperties = {
    minHeight: `min(${CARD_HEIGHT_REM}rem, calc(100vh - 10rem))`,
    maxWidth: `min(${INCOME_CARD_WIDTH_REM}rem, 100%)`
  }

  const summaryGridStyles: CSSProperties = {
    columnGap: `min(${SUMMARY_CARD_COLUMN_GAP_REM}rem, 5vw)`,
    rowGap: `min(${SUMMARY_CARD_ROW_GAP_REM}rem, 3vw)`,
    gridTemplateColumns: `repeat(2, min(${SUMMARY_CARD_WIDTH_REM}rem, 45vw))`,
    width: `min(${SUMMARY_GRID_WIDTH_REM}rem, 100%)`
  }

  return (
    <article
      className='w-full rounded-lg bg-surface px-[1.5rem] py-[1.5rem] shadow-elevation-card'
      style={sharedCardStyles}
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

      <div className='mt-gapmd flex flex-col gap-gapmd xl:flex-row xl:items-start'>
        <div className='grid flex-none' style={summaryGridStyles}>
          {SUMMARY_CARDS.map((card) => (
            <SummaryInsightCard key={card.id} card={card} />
          ))}
        </div>
        <CashDonutGauge />
      </div>
    </article>
  )
}

function SummaryInsightCard({ card }: { card: SummaryCard }) {
  const cardStyles: CSSProperties = {
    backgroundColor: card.color,
    height: `min(${SUMMARY_CARD_HEIGHT_REM}rem, 18vh)`,
    width: `min(${SUMMARY_CARD_WIDTH_REM}rem, 100%)`
  }

  return (
    <div
      className='flex h-full flex-col rounded-lg p-[0.5rem]'
      style={cardStyles}
    >
      <div className='flex h-full flex-col gap-[min(1.5rem,4vw)]'>
        <div className='flex items-center justify-between text-[min(0.6875rem,3vw)] font-medium leading-[min(1rem,3vw)] text-neutral-600'>
          <span
            className='material-symbols-rounded text-[1rem] leading-4 text-neutral-600'
            aria-hidden
          >
            {card.accessory}
          </span>
          <span>Hoy</span>
        </div>
        <div className='flex flex-col gap-[min(0.25rem,1vw)] text-neutral-600'>
          <div className='font-medium text-[min(0.6875rem,3vw)] leading-[min(1rem,3vw)]'>
            {card.title}
          </div>
          <div className='flex items-baseline justify-between gap-[0.5rem]'>
            <p className='text-[min(1.75rem,5vw)] leading-[min(2.25rem,6vw)] text-neutral-600'>
              {card.value}
            </p>
            <div className='flex items-center gap-[0.25rem] text-[min(0.75rem,3.5vw)] font-medium text-brand-500'>
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

function CashDonutGauge() {
  const donutCardStyles: CSSProperties = {
    width: `min(${DONUT_CARD_WIDTH_REM}rem, 100%)`,
    minHeight: `min(${DONUT_CARD_MIN_HEIGHT_REM}rem, calc(${CARD_HEIGHT_REM}rem - 4rem))`,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '-1px -1px 8px rgba(0,0,0,0.05), 2px 2px 8px rgba(0,0,0,0.05)'
  }

  const chartWrapperStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '27.5%',
    transform: 'translate(-50%, -55%)',
    width: `min(${DONUT_CHART_SIZE_REM}rem, calc(170%))`,
    height: `min(${DONUT_CHART_SIZE_REM * 1.3}rem, calc(170%))`
  }

  const valueStackStyles: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '70%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center'
  }

  return (
    <div className='relative rounded-lg bg-surface' style={donutCardStyles}>
      <p
        className='absolute text-[min(0.6875rem,3vw)] font-medium leading-[min(1rem,3vw)] text-neutral-600'
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
        className='absolute flex flex-col items-center gap-[min(0.25rem,1vw)] text-center text-neutral-600'
        style={valueStackStyles}
      >
        <p className='text-[min(2.25rem,6vw)] leading-[min(2.75rem,7vw)] text-neutral-600'>
          {DONUT_VALUE.toLocaleString('es-ES', {
            minimumFractionDigits: 0
          })}{' '}
          €
        </p>
        <div className='flex items-baseline gap-[min(0.5rem,2vw)] text-[min(0.6875rem,3vw)] leading-[min(1rem,3vw)]'>
          <span className='font-medium'>de</span>
          <span className='text-[min(1.125rem,4vw)] font-medium leading-[min(1.75rem,5vw)]'>
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
