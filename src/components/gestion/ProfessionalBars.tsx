const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'
const CARD_WIDTH_VAR = 'var(--width-card-chart-md)'
const AXIS_LEFT_RATIO = (55 / 529).toFixed(6)
const GRID_WIDTH_RATIO = (438 / 529).toFixed(6)
const AXIS_HEIGHT_RATIO = (220 / 342).toFixed(6)
const AREA_HEIGHT_RATIO = (208 / 342).toFixed(6)
const BAR_HEIGHT_RATIOS = [195, 162, 117, 133].map((value) =>
  (value / 342).toFixed(6)
)

export default function ProfessionalBars() {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md h-card-chart-fluid overflow-clip w-full'>
      <header className='flex items-center justify-between mb-fluid-sm'>
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
        className='relative'
        style={{ height: `calc(${CARD_HEIGHT_VAR} * ${AXIS_HEIGHT_RATIO})` }}
      >
        {/* Y-axis labels */}
        <div className='absolute left-0 inset-y-0 flex flex-col justify-between text-label-sm text-fg-muted'>
          {[350, 300, 250, 200, 150, 100, 50, 0].map((v) => (
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
          <span>Dr. Guille</span>
          <span>Dra. Laura</span>
          <span>Tamara (Hig.)</span>
          <span>Nerea (Hig.)</span>
        </div>
      </div>
    </section>
  )
}
