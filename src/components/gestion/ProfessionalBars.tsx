import type { CSSProperties } from 'react'

// SOLUCIÓN FINAL: Variables base sin límites para cálculos
// El contenedor tiene el min() pero los elementos internos usan 100% de ese espacio
const CARD_WIDTH = 'var(--width-card-chart-prof)' // 33.0625rem
const CARD_HEIGHT = 'var(--height-card-chart-prof)' // 21.375rem

// Los ratios se calculan sobre el 100% del contenedor (que ya tiene min() aplicado)
// Esto evita expresiones CSS complejas que el navegador no puede procesar
const widthWithRatio = (ratioVar: string) =>
  `calc(100% * var(${ratioVar}))`

const heightWithRatio = (ratioVar: string) =>
  `calc(100% * var(${ratioVar}))`

const bottomWithRatio = (ratioVar: string) =>
  `calc(100% * (1 - var(${ratioVar})))`

const AXIS_LABELS = [350, 300, 250, 200, 150, 100, 50, 0]
const PROFESSIONAL_LABELS = [
  'Dr. Guille',
  'Dra. Laura',
  'Tamara (Hig.)',
  'Nerea (Hig.)'
]

const BARS = [
  {
    label: 'Dr. Guille',
    colorVar: 'var(--chart-1)',
    leftVar: '--chart-prof-bar-1-left-ratio',
    topVar: '--chart-prof-bar-1-top-ratio',
    heightVar: '--chart-prof-bar-1-height-ratio'
  },
  {
    label: 'Dra. Laura',
    colorVar: 'var(--chart-2)',
    leftVar: '--chart-prof-bar-2-left-ratio',
    topVar: '--chart-prof-bar-2-top-ratio',
    heightVar: '--chart-prof-bar-2-height-ratio'
  },
  {
    label: 'Tamara (Hig.)',
    colorVar: 'var(--chart-3)',
    leftVar: '--chart-prof-bar-3-left-ratio',
    topVar: '--chart-prof-bar-3-top-ratio',
    heightVar: '--chart-prof-bar-3-height-ratio'
  },
  {
    label: 'Nerea (Hig.)',
    colorVar: 'var(--chart-4)',
    leftVar: '--chart-prof-bar-4-left-ratio',
    topVar: '--chart-prof-bar-4-top-ratio',
    heightVar: '--chart-prof-bar-4-height-ratio'
  }
]

export default function ProfessionalBars() {
  const cardStyles: CSSProperties = {
    width: `min(${CARD_WIDTH}, var(--chart-prof-width-limit))`,
    height: `min(${CARD_HEIGHT}, var(--chart-prof-height-limit))`
  }

  return (
    <section
      className='relative flex flex-col overflow-hidden rounded-lg bg-surface p-[1rem] shadow-elevation-card'
      style={cardStyles}
    >
      <header className='mb-[2.75rem] flex items-center justify-between'>
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por profesional
        </h3>
        <button className='text-fg-secondary'>
          <span className='material-symbols-rounded text-[1.5rem]'>
            filter_alt
          </span>
        </button>
      </header>

      <div
        className='relative h-full w-full'
      >
        {/* Y-axis labels */}
        <div
          className='absolute flex w-max flex-col justify-between font-normal text-[0.75rem] leading-[1rem] text-fg-muted'
          style={{
            left: widthWithRatio('--chart-prof-axis-label-left-ratio'),
            top: 0,
            height: heightWithRatio('--chart-prof-axis-height-ratio')
          }}
        >
          {AXIS_LABELS.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* Grid lines */}
        <div
          className='absolute'
          style={{
            left: widthWithRatio('--chart-prof-axis-left-ratio'),
            top: heightWithRatio('--chart-prof-grid-top-ratio'),
            width: widthWithRatio('--chart-prof-grid-width-ratio'),
            height: heightWithRatio('--chart-prof-grid-height-ratio')
          }}
        >
          <div className='absolute inset-0 bg-[linear-gradient(to_bottom,var(--chart-grid)_1px,transparent_1px)] bg-[size:100%_calc(100%/7)] opacity-50' />
        </div>

        {/* Bars */}
        {BARS.map((bar) => (
          <div
            key={bar.label}
            className='absolute rounded-2xl'
            style={{
              left: widthWithRatio(bar.leftVar),
              top: heightWithRatio(bar.topVar),
              width: widthWithRatio('--chart-prof-bar-width-ratio'),
              height: heightWithRatio(bar.heightVar),
              backgroundColor: bar.colorVar
            }}
          />
        ))}

        {/* X-axis labels */}
        <div
          className='absolute flex justify-between font-normal text-[0.75rem] leading-[1rem] text-fg-muted'
          style={{
            left: widthWithRatio('--chart-prof-axis-left-ratio'),
            width: widthWithRatio('--chart-prof-grid-width-ratio'),
            bottom: bottomWithRatio('--chart-prof-labels-bottom-ratio')
          }}
        >
          {PROFESSIONAL_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
