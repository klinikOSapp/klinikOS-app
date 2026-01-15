'use client'

import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { CSSProperties } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { SpecialtyFilter } from './gestionTypes'

const CARD_WIDTH = 'var(--width-card-chart-lg-fluid)'
const CARD_HEIGHT_CLAMP = 'clamp(15rem, 34vh, 21.375rem)'
const CARD_WIDTH_LIMIT = 'var(--accounting-width-limit)'
const CARD_HEIGHT_LIMIT = 'var(--accounting-height-limit)'

const toWidth = (px: number) => {
  const ratio = (px / 1069).toFixed(6)
  return `min(calc(${CARD_WIDTH} * ${ratio}), calc(${CARD_WIDTH_LIMIT} * ${ratio}))`
}

// Data by specialty for week
const SPECIALTY_DATA_WEEK = {
  Conservadora: {
    produced: '3.360 €',
    invoiced: '2.880 €',
    collected: '2.400 €',
    pending: '480 €',
    deltas: {
      produced: '+ 15%',
      invoiced: '+ 12%',
      collected: '+ 10%',
      pending: '- 8%'
    }
  },
  Ortodoncia: {
    produced: '2.520 €',
    invoiced: '2.160 €',
    collected: '1.800 €',
    pending: '360 €',
    deltas: {
      produced: '+ 10%',
      invoiced: '+ 8%',
      collected: '+ 6%',
      pending: '- 4%'
    }
  },
  Implantes: {
    produced: '1.680 €',
    invoiced: '1.440 €',
    collected: '1.200 €',
    pending: '240 €',
    deltas: {
      produced: '+ 14%',
      invoiced: '+ 11%',
      collected: '+ 9%',
      pending: '- 6%'
    }
  },
  Estética: {
    produced: '840 €',
    invoiced: '720 €',
    collected: '600 €',
    pending: '120 €',
    deltas: {
      produced: '+ 8%',
      invoiced: '+ 7%',
      collected: '+ 5%',
      pending: '- 3%'
    }
  }
} as const

// Data by specialty for month
const SPECIALTY_DATA_MONTH = {
  Conservadora: {
    produced: '15.120 €',
    invoiced: '12.960 €',
    collected: '10.800 €',
    pending: '2.160 €',
    deltas: {
      produced: '+ 20%',
      invoiced: '+ 17%',
      collected: '+ 14%',
      pending: '- 5%'
    }
  },
  Ortodoncia: {
    produced: '11.340 €',
    invoiced: '9.720 €',
    collected: '8.100 €',
    pending: '1.620 €',
    deltas: {
      produced: '+ 16%',
      invoiced: '+ 13%',
      collected: '+ 11%',
      pending: '- 3%'
    }
  },
  Implantes: {
    produced: '7.560 €',
    invoiced: '6.480 €',
    collected: '5.400 €',
    pending: '1.080 €',
    deltas: {
      produced: '+ 19%',
      invoiced: '+ 16%',
      collected: '+ 13%',
      pending: '- 4%'
    }
  },
  Estética: {
    produced: '3.780 €',
    invoiced: '3.240 €',
    collected: '2.700 €',
    pending: '540 €',
    deltas: {
      produced: '+ 12%',
      invoiced: '+ 10%',
      collected: '+ 8%',
      pending: '- 2%'
    }
  }
} as const

function getKpiCards(timeScale: CashTimeScale, specialty?: SpecialtyFilter) {
  const baseCards = [
    {
      title: 'Producido',
      bg: 'var(--color-info-50)',
      icon: 'attach_money',
      left: 16,
      top: 64,
      width: 198
    },
    {
      title: 'Facturado',
      bg: '#e9f6fb',
      icon: 'receipt_long',
      left: 236,
      top: 64,
      width: 198
    },
    {
      title: 'Cobrado',
      bg: 'var(--color-brand-50)',
      icon: 'check_circle',
      left: 16,
      top: 196,
      width: 198
    },
    {
      title: 'Por cobrar',
      bg: 'var(--color-warning-50)',
      icon: 'hourglass_top',
      left: 236,
      top: 196,
      width: 204
    }
  ] as const

  // If specialty is selected, use specialty-specific data
  if (specialty) {
    const dataSource =
      timeScale === 'month' ? SPECIALTY_DATA_MONTH : SPECIALTY_DATA_WEEK
    const specialtyData = dataSource[specialty]
    return baseCards.map((card, index) => ({
      ...card,
      value:
        index === 0
          ? specialtyData.produced
          : index === 1
          ? specialtyData.invoiced
          : index === 2
          ? specialtyData.collected
          : specialtyData.pending,
      delta:
        index === 0
          ? specialtyData.deltas.produced
          : index === 1
          ? specialtyData.deltas.invoiced
          : index === 2
          ? specialtyData.deltas.collected
          : specialtyData.deltas.pending
    }))
  }

  // Default totals (no filter)
  if (timeScale === 'week') {
    return baseCards.map((card, index) => ({
      ...card,
      value: ['8.400 €', '7.200 €', '6.000 €', '1.200 €'][index],
      delta: ['+ 12%', '+ 10%', '+ 8%', '- 5%'][index]
    }))
  }

  return baseCards.map((card, index) => ({
    ...card,
    value: ['37.800 €', '32.400 €', '27.000 €', '5.400 €'][index],
    delta: ['+ 18%', '+ 15%', '+ 12%', '- 3%'][index]
  }))
}

function getDonut(timeScale: CashTimeScale, specialty?: SpecialtyFilter) {
  // Specialty-specific values
  const specialtyValuesWeek = {
    Conservadora: { value: 2400, target: 2880 },
    Ortodoncia: { value: 1800, target: 2160 },
    Implantes: { value: 1200, target: 1440 },
    Estética: { value: 600, target: 720 }
  }

  const specialtyValuesMonth = {
    Conservadora: { value: 10800, target: 12960 },
    Ortodoncia: { value: 8100, target: 9720 },
    Implantes: { value: 5400, target: 6480 },
    Estética: { value: 2700, target: 3240 }
  }

  let value: number
  let target: number

  if (specialty) {
    const source =
      timeScale === 'month' ? specialtyValuesMonth : specialtyValuesWeek
    value = source[specialty].value
    target = source[specialty].target
  } else if (timeScale === 'week') {
    value = 6000
    target = 7200
  } else {
    value = 27000
    target = 32400
  }

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
    progress: value / target,
    valueLabel: value.toLocaleString('es-ES') + ' €',
    targetLabel: target.toLocaleString('es-ES') + ' €',
    pendingValue: pending,
    pendingLabel: pending.toLocaleString('es-ES') + ' €'
  }
}

function getSideStack(timeScale: CashTimeScale, specialty?: SpecialtyFilter) {
  const baseStack = [
    {
      title: specialty ? `Facturación ${specialty}` : 'Total facturación',
      top: 64,
      height: 248,
      bg: 'var(--color-brand-50)',
      percent: undefined,
      textClass: 'text-fg-secondary'
    },
    {
      title: 'Gastos fijos',
      top: 160,
      height: 177,
      bg: 'var(--color-brand-200)',
      percent: '60%',
      textClass: 'text-fg-secondary'
    }
  ] as const

  // Specialty-specific invoiced values
  const specialtyInvoicedWeek = {
    Conservadora: 2880,
    Ortodoncia: 2160,
    Implantes: 1440,
    Estética: 720
  }

  const specialtyInvoicedMonth = {
    Conservadora: 12960,
    Ortodoncia: 9720,
    Implantes: 6480,
    Estética: 3240
  }

  let invoiced: number
  if (specialty) {
    invoiced =
      timeScale === 'month'
        ? specialtyInvoicedMonth[specialty]
        : specialtyInvoicedWeek[specialty]
  } else {
    invoiced = timeScale === 'month' ? 32400 : 7200
  }

  const fixedCosts = Math.round(invoiced * 0.6) // 60% fixed costs ratio

  return [
    {
      ...baseStack[0],
      value: invoiced.toLocaleString('es-ES') + ' €'
    },
    {
      ...baseStack[1],
      value: fixedCosts.toLocaleString('es-ES') + ' €'
    }
  ]
}

const toHeight = (px: number) => {
  const ratio = (px / 342).toFixed(6)
  return `min(calc(${CARD_HEIGHT_CLAMP} * ${ratio}), calc(${CARD_HEIGHT_LIMIT} * ${ratio}))`
}

type AccountingStyle = CSSProperties &
  Record<'--accounting-height-current' | '--stack-scale-y', string>

const DONUT_CARD_WIDTH = 400
const DONUT_CARD_HEIGHT = 248
// Altura total del stack lateral (desde el top de la primera card hasta el bottom de la segunda) en Figma: top1=64, height1=248, top2=160, height2=177 → span=273px
const STACK_TOTAL_SPAN_PX = 273
const STACK_SCALE = Number((DONUT_CARD_HEIGHT / STACK_TOTAL_SPAN_PX).toFixed(6)) // ≈0.908058, iguala la altura total del stack al alto del donut
// Posicionamiento horizontal (ajustado para igualar gaps KPI↔donut↔stack en 1920px)
const DONUT_LEFT = 457 // px

export default function AccountingPanel({
  timeScale,
  selectedSpecialty
}: {
  timeScale: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
}) {
  const kpis = getKpiCards(timeScale, selectedSpecialty)
  const sideStack = getSideStack(timeScale, selectedSpecialty)
  const donut = getDonut(timeScale, selectedSpecialty)

  const sectionStyle: AccountingStyle = {
    width: '100%',
    maxWidth: '100%',
    height: `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`,
    // Altura efectiva de la tarjeta (se reutiliza para escalar el stack lateral en viewports bajos)
    '--accounting-height-current': `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`,
    // Escalamos el stack para que su span total (273px) iguale la altura del donut (248px) en todos los viewports.
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
          className='absolute flex flex-col rounded-lg p-[0.5rem] overflow-hidden'
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
          <div className='mt-auto flex items-baseline justify-between gap-[0.25rem]'>
            <p className='text-neutral-600 whitespace-nowrap text-headline-sm font-normal'>
              {card.value}
            </p>
            <span
              className={`shrink-0 whitespace-nowrap text-label-sm font-medium ${
                card.delta.startsWith('-') ? 'text-red-500' : 'text-brand-500'
              }`}
            >
              {card.delta}
            </span>
          </div>
        </article>
      ))}

      <div
        className='absolute rounded-lg bg-surface shadow-[0px_4px_24px_rgba(36,40,44,0.08)]'
        style={{
          left: toWidth(457),
          right: toWidth(205),
          top: toHeight(64),
          height: toHeight(DONUT_CARD_HEIGHT),
          minWidth: '10rem',
          padding: '1rem'
        }}
      >
        <p className='text-label-md text-fg-secondary'>Cobrado vs Facturado</p>
        <div
          className='relative mx-auto mt-[1rem] flex items-center justify-center outline-none'
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
          tabIndex={-1}
        >
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
