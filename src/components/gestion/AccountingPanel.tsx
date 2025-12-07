import type { CSSProperties } from 'react'

const CARD_WIDTH = 'var(--width-card-chart-lg-fluid)'
const CARD_HEIGHT_CLAMP = 'clamp(18rem, 35vh, 24.6rem)'
const CARD_WIDTH_LIMIT = 'var(--accounting-width-limit)'
const CARD_HEIGHT_LIMIT = 'var(--accounting-height-limit)'

const toWidth = (px: number) => {
  const ratio = (px / 1069).toFixed(6)
  return `min(calc(${CARD_WIDTH} * ${ratio}), calc(${CARD_WIDTH_LIMIT} * ${ratio}))`
}

const toHeight = (px: number) => {
  const ratio = (px / 342).toFixed(6)
  return `min(calc(${CARD_HEIGHT_CLAMP} * ${ratio}), calc(${CARD_HEIGHT_LIMIT} * ${ratio}))`
}

const KPI_CARDS = [
  {
    title: 'Producido',
    value: '1.200 €',
    delta: '+ 12%',
    bg: 'var(--color-info-50)',
    icon: 'savings',
    left: 16,
    top: 64,
    width: 198
  },
  {
    title: 'Facturado',
    value: '1.200 €',
    delta: '+ 12%',
    bg: 'var(--color-brand-50)',
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
    icon: 'check',
    left: 16,
    top: 196,
    width: 198
  },
  {
    title: 'Sin facturar',
    value: '-1.200 €',
    delta: '+ 12%',
    bg: 'var(--color-warning-50)',
    icon: 'savings',
    left: 236,
    top: 196,
    width: 204
  }
] as const

const SIDE_STACK = [
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

const DONUT_VIEWBOX = { width: 200, height: 120 }
const DONUT_RADIUS = 90
const DONUT_PROGRESS = 1200 / 1800

export default function AccountingPanel() {
  const sectionStyle: CSSProperties = {
    width: `min(${CARD_WIDTH}, ${CARD_WIDTH_LIMIT})`,
    height: `min(${CARD_HEIGHT_CLAMP}, ${CARD_HEIGHT_LIMIT})`
  }

  const pathLength = Math.PI * DONUT_RADIUS
  const donutDashoffset = pathLength * (1 - DONUT_PROGRESS)

  return (
    <section
      className='relative overflow-clip rounded-lg bg-surface shadow-elevation-card'
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
        <button
          type='button'
          className='flex items-center gap-card-metric text-label-md text-fg'
        >
          2024
          <span className='material-symbols-rounded text-[1rem] leading-none'>
            arrow_drop_down
          </span>
        </button>
      </header>

      {KPI_CARDS.map((card) => (
        <article
          key={card.title}
          className='absolute flex flex-col rounded-lg p-card-pad'
          style={{
            left: toWidth(card.left),
            top: toHeight(card.top),
            width: toWidth(card.width),
            height: toHeight(116),
            backgroundColor: card.bg
          }}
        >
          <header className='flex items-center justify-between text-label-md text-fg-secondary'>
            <span className='material-symbols-rounded text-fg text-[1.25rem]'>
              {card.icon}
            </span>
            <span className='text-[0.6875rem] font-medium leading-4 text-fg-secondary'>
              Hoy
            </span>
          </header>
          <div className='mt-gapsm text-label-md text-fg-secondary'>{card.title}</div>
          <div className='mt-[0.25rem] text-headline-sm text-fg-secondary'>
            {card.value}
          </div>
          <div className='mt-[0.25rem] flex items-center gap-card-metric'>
            <span className='text-body-sm text-brandSemantic'>{card.delta}</span>
            <span className='material-symbols-rounded text-[1rem] leading-none text-brandSemantic'>
              arrow_outward
            </span>
          </div>
        </article>
      ))}

      <div
        className='absolute rounded-lg bg-surface shadow-[0px_4px_24px_rgba(36,40,44,0.08)]'
        style={{
          left: toWidth(464),
          top: toHeight(64),
          width: toWidth(400),
          height: toHeight(248),
          padding: '1rem'
        }}
      >
        <p className='text-label-md text-fg-secondary'>Facturado</p>
        <div
          className='relative mx-auto mt-[1rem] flex items-center justify-center'
          style={{
            width: toWidth(307),
            height: toHeight(210)
          }}
        >
          <svg
            viewBox={`0 0 ${DONUT_VIEWBOX.width} ${DONUT_VIEWBOX.height}`}
            className='h-full w-full'
          >
            <path
              d='M10 110 A90 90 0 0 1 190 110'
              stroke='var(--color-brand-50)'
              strokeWidth={20}
              strokeLinecap='round'
              fill='transparent'
            />
            <path
              d='M10 110 A90 90 0 0 1 190 110'
              stroke='var(--color-brand-500)'
              strokeWidth={20}
              strokeLinecap='round'
              fill='transparent'
              strokeDasharray={pathLength}
              strokeDashoffset={donutDashoffset}
            />
          </svg>
          <div className='absolute flex flex-col items-center gap-card-row text-center'>
            <p className='text-headline-lg text-fg-secondary'>1.200 €</p>
            <p className='text-label-md text-fg-secondary'>
              de <span className='font-medium'>1.800 €</span>
            </p>
          </div>
        </div>
      </div>

      {SIDE_STACK.map((item) => (
        <div
          key={item.title}
          className='absolute rounded-[1rem] px-card-pad py-card-pad'
          style={{
            left: toWidth(880),
            top: toHeight(item.top),
            width: toWidth(173),
            height: toHeight(item.height),
            backgroundColor: item.bg
          }}
        >
          <div className='flex items-center justify-between text-label-md'>
            <span className={item.textClass}>{item.title}</span>
            {item.percent ? (
              <span className={`${item.textClass} font-medium`}>{item.percent}</span>
            ) : null}
          </div>
          <p className={`mt-[1.75rem] text-headline-sm font-medium ${item.textClass}`}>
            {item.value}
          </p>
        </div>
      ))}
    </section>
  )
}
