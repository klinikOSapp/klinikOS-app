'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

const CARD_WIDTH = 'var(--width-card-chart-lg-fluid)'
const CARD_HEIGHT_CLAMP = 'clamp(15rem, 34vh, 21.375rem)'
const CARD_WIDTH_LIMIT = 'var(--accounting-width-limit)'
const CARD_HEIGHT_LIMIT = 'var(--accounting-height-limit)'

const toWidth = (px: number) => {
  const ratio = (px / 1069).toFixed(6)
  return `min(calc(${CARD_WIDTH} * ${ratio}), calc(${CARD_WIDTH_LIMIT} * ${ratio}))`
}

function getKpiCards(timeScale: CashTimeScale) {
  if (timeScale === 'week') {
    return [
      {
        title: 'Producido',
        value: '320 €',
        delta: '+ 3%',
        bg: 'var(--color-info-50)',
        icon: 'attach_money',
        left: 16,
        top: 64,
        width: 198
      },
      {
        title: 'Facturado',
        value: '420 €',
        delta: '+ 5%',
        bg: '#e9f6fb',
        icon: 'receipt_long',
        left: 236,
        top: 64,
        width: 198
      },
      {
        title: 'Cobrado',
        value: '380 €',
        delta: '+ 4%',
        bg: 'var(--color-brand-50)',
        icon: 'check_circle',
        left: 16,
        top: 196,
        width: 198
      },
      {
        title: 'Por cobrar',
        value: '-150 €',
        delta: '+ 2%',
        bg: 'var(--color-warning-50)',
        icon: 'hourglass_top',
        left: 236,
        top: 196,
        width: 204
      }
    ] as const
  }

  return [
    {
      title: 'Producido',
      value: '1.200 €',
      delta: '+ 12%',
      bg: 'var(--color-info-50)',
      icon: 'attach_money',
      left: 16,
      top: 64,
      width: 198
    },
    {
      title: 'Facturado',
      value: '1.200 €',
      delta: '+ 12%',
      bg: '#e9f6fb',
      icon: 'receipt_long',
      left: 236,
      top: 64,
      width: 198
    },
    {
      title: 'Cobrado',
      value: '1.200 €',
      delta: '+ 12%',
      bg: 'var(--color-brand-50)',
      icon: 'check_circle',
      left: 16,
      top: 196,
      width: 198
    },
    {
      title: 'Por cobrar',
      value: '-1.200 €',
      delta: '+ 12%',
      bg: 'var(--color-warning-50)',
      icon: 'hourglass_top',
      left: 236,
      top: 196,
      width: 204
    }
  ] as const
}

function getDonut(timeScale: CashTimeScale) {
  if (timeScale === 'week') {
    const value = 380
    const target = 500
    return {
      data: [
        { name: 'actual', value, color: 'var(--color-brand-500)' },
        {
          name: 'remaining',
          value: Math.max(target - value, 0),
          color: 'var(--color-brand-50)'
        }
      ],
      progress: value / target,
      valueLabel: `${value} €`,
      targetLabel: `${target} €`
    }
  }

  const value = 1200
  const target = 1800
  return {
    data: [
      { name: 'actual', value, color: 'var(--color-brand-500)' },
      {
        name: 'remaining',
        value: Math.max(target - value, 0),
        color: 'var(--color-brand-50)'
      }
    ],
    progress: value / target,
    valueLabel: `${value} €`,
    targetLabel: `${target} €`
  }
}

function getSideStack(timeScale: CashTimeScale) {
  if (timeScale === 'week') {
    return [
      {
        title: 'Total facturación',
        value: '15.000 €',
        top: 64,
        height: 248,
        bg: 'var(--color-brand-50)',
        percent: undefined,
        textClass: 'text-fg-secondary'
      },
      {
        title: 'Gastos fijos',
        value: '9.000 €',
        top: 135,
        height: 177,
        bg: 'var(--color-brand-200)',
        percent: '60%',
        textClass: 'text-fg-secondary'
      },
      {
        title: 'Gastos Variables',
        value: '5.000 €',
        top: 210,
        height: 102,
        bg: 'var(--color-brand-500)',
        percent: '33%',
        textClass: 'text-fg-inverse'
      }
    ] as const
  }

  return [
    {
      title: 'Total facturación',
      value: '60.000 €',
      top: 64,
      height: 248,
      bg: 'var(--color-brand-50)',
      percent: undefined,
      textClass: 'text-fg-secondary'
    },
    {
      title: 'Gastos fijos',
      value: '36.000 €',
      top: 135,
      height: 177,
      bg: 'var(--color-brand-200)',
      percent: '62%',
      textClass: 'text-fg-secondary'
    },
    {
      title: 'Gastos Variables',
      value: '18.000 €',
      top: 210,
      height: 102,
      bg: 'var(--color-brand-500)',
      percent: '32%',
      textClass: 'text-fg-inverse'
    }
  ] as const
}

const toHeight = (px: number) => {
  const ratio = (px / 342).toFixed(6)
  return `min(calc(${CARD_HEIGHT_CLAMP} * ${ratio}), calc(${CARD_HEIGHT_LIMIT} * ${ratio}))`
}

type AccountingStyle = CSSProperties &
  Record<'--accounting-height-current' | '--stack-scale-y', string>

const DONUT_VIEWBOX = { width: 200, height: 120 }
const DONUT_RADIUS = 90
const DONUT_CARD_WIDTH = 400
const DONUT_CARD_HEIGHT = 248
const DONUT_CHART_WIDTH = 307
const DONUT_CHART_HEIGHT = 186.093
const DONUT_THICKNESS = 20
// Posicionamiento horizontal (ajustado para igualar gaps KPI↔donut↔stack en 1920px)
const DONUT_LEFT = 457 // px
const STACK_LEFT = 880 // px

export default function AccountingPanel({
  timeScale
}: {
  timeScale: CashTimeScale
}) {
  const kpis = getKpiCards(timeScale)
  const sideStack = getSideStack(timeScale)
  const donut = getDonut(timeScale)

  const sectionStyle: AccountingStyle = {
    width: '100%',
    maxWidth: `min(${CARD_WIDTH}, ${CARD_WIDTH_LIMIT})`,
    height: `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`,
    // Altura efectiva de la tarjeta (se reutiliza para escalar el stack lateral en viewports bajos)
    '--accounting-height-current': `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`,
    // El stack completo mide ~312px en Figma (19.5rem). Permitimos escalar sólo hasta un piso del 92% para evitar que las cards se encojan demasiado en viewports bajos, sin tocar la vista 1920.
    '--stack-scale-y':
      'max(0.92, min(1, calc(var(--accounting-height-current) / 19.5rem)))'
  }

  const pathLength = Math.PI * DONUT_RADIUS
  const donutDashoffset = pathLength * (1 - donut.progress)

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
        <span>Ingresos</span>
      </header>

      {kpis.map((card) => (
        <article
          key={card.title}
          className='absolute flex flex-col rounded-lg p-[0.5rem]'
          style={{
            left: toWidth(card.left),
            top: toHeight(card.top),
            width: toWidth(card.width),
            height: toHeight(116),
            backgroundColor: card.bg
          }}
        >
          <header className='flex items-center justify-between text-label-md text-neutral-600'>
            <span className='material-symbols-rounded text-[1rem] leading-[1rem] text-neutral-600'>
              {card.icon}
            </span>
          </header>
          <div className='mt-gapsm text-label-md text-neutral-600'>
            {card.title}
          </div>
          <div className='mt-[0.25rem] flex items-baseline justify-between gap-[0.5rem] min-w-0'>
            <p className='text-neutral-600 whitespace-nowrap text-[min(1.75rem,5vw)] leading-[min(2.25rem,6vw)]'>
              {card.value}
            </p>
            <div className='flex items-center gap-[0.25rem] text-brand-500 whitespace-nowrap text-[min(0.875rem,3.2vw)] leading-[min(1.25rem,4vw)]'>
              {card.delta}
              <span className='material-symbols-rounded text-[1rem] leading-[1rem] text-brand-500'>
                arrow_outward
              </span>
            </div>
          </div>
        </article>
      ))}

      <div
        className='absolute rounded-lg bg-surface shadow-[0px_4px_24px_rgba(36,40,44,0.08)]'
        style={{
          left: toWidth(DONUT_LEFT),
          top: toHeight(64),
          width: toWidth(DONUT_CARD_WIDTH),
          height: toHeight(DONUT_CARD_HEIGHT),
          padding: '1rem'
        }}
      >
        <p className='text-label-md text-fg-secondary'>Cobrado</p>
        <div
          className='relative mx-auto mt-[1rem] flex items-center justify-center'
          style={{
            width: '170%',
            height: '170%',
            position: 'absolute',
            left: '50%',
            top: '10%',
            transform: 'translate(-50%, -50%)',
            transformOrigin: 'center center',
            minWidth: 0,
            minHeight: 0
          }}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
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
          <div className='absolute left-1/2 top-[78%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-card-row text-center text-fg-secondary'>
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
          </div>
        </div>
      </div>

      <div
        className='absolute'
        style={{
          right: toWidth(16), // margen derecho igual al padding izquierdo Figma (16px)
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
