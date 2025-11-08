import type { CSSProperties } from 'react'

const CARD_HEIGHT_VAR = 'var(--chart-card-height)'
const CARD_WIDTH_VAR = 'var(--chart-card-width)'
const AXIS_LEFT_RATIO = (55 / 529).toFixed(6)
const GRID_WIDTH_RATIO = (438 / 529).toFixed(6)
const AXIS_HEIGHT_RATIO = (220 / 342).toFixed(6)
const AREA_HEIGHT_RATIO = (208 / 342).toFixed(6)
const BAR_HEIGHT_RATIOS = [195, 162, 117, 133].map((value) =>
  (value / 342).toFixed(6)
)
const PROFESSIONAL_LABELS = [
  'Dr. Guille',
  'Dra. Laura',
  'Tamara (Hig.)',
  'Nerea (Hig.)'
]
const AXIS_LABELS = [350, 300, 250, 200, 150, 100, 50, 0]

export default function ProfessionalBars() {
  const cardStyles: CSSProperties = {
    '--chart-card-width': 'min(var(--width-card-chart-md-fluid), 95vw)',
    '--chart-card-height': 'min(var(--height-card-chart-fluid), 34vh)',
    width: 'var(--chart-card-width)',
    height: 'var(--chart-card-height)'
  }

  return (
    <section
      className='relative flex flex-col rounded-lg bg-surface p-fluid-md shadow-elevation-card overflow-clip'
      style={cardStyles}
    >
      <header className='mb-[min(2.75rem,4vh)] flex items-center justify-between'>
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por profesional
        </h3>
        <button className='text-fg-secondary'>
          <span className='material-symbols-rounded text-[24px]'>
            filter_alt
          </span>
        </button>
      </header>

      <div
        className='relative w-full'
        style={{ height: `calc(${CARD_HEIGHT_VAR} * ${AXIS_HEIGHT_RATIO})` }}
      >
        {/* Y-axis labels */}
        <div className='absolute inset-y-0 left-0 flex w-max flex-col justify-between text-label-sm text-fg-muted'>
          {AXIS_LABELS.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* Grid lines */}
        <div
          className='absolute'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${AXIS_LEFT_RATIO})`,
            width: `calc(${CARD_WIDTH_VAR} * ${GRID_WIDTH_RATIO})`,
            height: `calc(${CARD_HEIGHT_VAR} * ${AREA_HEIGHT_RATIO})`
          }}
        >
          <div className='absolute inset-0 bg-[linear-gradient(to_bottom,var(--chart-grid)_1px,transparent_1px)] bg-[size:100%_calc(100%/7)] opacity-50' />
        </div>

        {/* Bars */}
        <div
          className='absolute grid grid-cols-4 gap-fluid-md items-end'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${AXIS_LEFT_RATIO})`,
            width: `calc(${CARD_WIDTH_VAR} * ${GRID_WIDTH_RATIO})`,
            height: `calc(${CARD_HEIGHT_VAR} * ${AREA_HEIGHT_RATIO})`
          }}
        >
          {BAR_HEIGHT_RATIOS.map((ratio, index) => (
            <div
              key={index}
              className={`rounded-2xl ${
                ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4'][index]
              }`}
              style={{ height: `calc(${CARD_HEIGHT_VAR} * ${ratio})` }}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div
          className='absolute grid grid-cols-4 gap-fluid-md text-label-sm text-fg-muted'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${AXIS_LEFT_RATIO})`,
            width: `calc(${CARD_WIDTH_VAR} * ${GRID_WIDTH_RATIO})`,
            bottom: 0
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
