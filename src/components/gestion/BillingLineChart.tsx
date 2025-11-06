type BillingLineChartProps = { yearLabel?: string }

const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'
const CARD_WIDTH_VAR = 'var(--width-card-chart-lg)'
const CHART_HEIGHT_RATIO = (228 / 342).toFixed(6)
const CHART_TOP_RATIO = (58 / 342).toFixed(6)
const GRID_LEFT_RATIO = (63 / 1069).toFixed(6)
const GRID_WIDTH_RATIO = (824 / 1069).toFixed(6)
const Y_AXIS_TOP_RATIO = (2 / 342).toFixed(6)
const Y_AXIS_HEIGHT_RATIO = (222 / 342).toFixed(6)
const LABEL_ONE_LEFT_RATIO = (410 / 1069).toFixed(6)
const LABEL_TWO_LEFT_RATIO = (442 / 1069).toFixed(6)
const LABEL_TOP_RATIO = (118 / 342).toFixed(6)
const COMPARISON_WIDTH_RATIO = (142 / 1069).toFixed(6)

export default function BillingLineChart({
  yearLabel = '2024'
}: BillingLineChartProps) {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md h-card-chart-fluid relative overflow-clip'>
      <header className='flex items-center justify-between mb-fluid-sm'>
        <h3 className='text-title-sm font-medium text-fg'>Facturación</h3>
        <div className='flex items-center gap-gapsm text-label-sm text-fg'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[16px]'>
            arrow_drop_down
          </span>
        </div>
      </header>

      {/* Chart Area */}
      <div
        className='relative mt-fluid-sm'
        style={{ height: `calc(${CARD_HEIGHT_VAR} * ${CHART_HEIGHT_RATIO})` }}
      >
        {/* Y-axis labels */}
        <div
          className='absolute left-0 flex flex-col justify-between text-label-sm text-fg-muted'
          style={{
            top: `calc(${CARD_HEIGHT_VAR} * ${Y_AXIS_TOP_RATIO})`,
            height: `calc(${CARD_HEIGHT_VAR} * ${Y_AXIS_HEIGHT_RATIO})`
          }}
        >
          {['90K', '70K', '50K', '30K', '10K', '0'].map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* Grid */}
        <div
          className='absolute'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${GRID_LEFT_RATIO})`,
            top: `calc(${CARD_HEIGHT_VAR} * ${CHART_TOP_RATIO})`,
            width: `calc(${CARD_WIDTH_VAR} * ${GRID_WIDTH_RATIO})`,
            height: `calc(${CARD_HEIGHT_VAR} * ${CHART_HEIGHT_RATIO})`
          }}
        >
          <div className='absolute inset-0 bg-[linear-gradient(to_bottom,var(--chart-grid)_1px,transparent_1px)] bg-[size:100%_calc(100%/5)] opacity-50' />
        </div>

        {/* Chart lines */}
        <svg
          className='absolute'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${GRID_LEFT_RATIO})`,
            top: `calc(${CARD_HEIGHT_VAR} * ${CHART_TOP_RATIO})`,
            width: `calc(${CARD_WIDTH_VAR} * ${GRID_WIDTH_RATIO})`,
            height: `calc(${CARD_HEIGHT_VAR} * ${CHART_HEIGHT_RATIO})`
          }}
          viewBox='0 0 824 228'
          preserveAspectRatio='none'
        >
          {/* Line 1 - Brand color */}
          <polyline
            points='0,158 68,148 137,153 206,138 275,118 344,123 413,128 482,126 551,133 620,143 689,138 757,148 824,138'
            fill='none'
            stroke='var(--chart-2)'
            strokeWidth='2'
          />
          {/* Line 2 - Accent color dashed */}
          <polyline
            points='0,168 68,158 137,163 206,148 275,128 344,133 413,138 482,136 551,143 620,153 689,148 757,158 824,148'
            fill='none'
            stroke='var(--chart-accent)'
            strokeDasharray='4 4'
            strokeWidth='2'
          />
          {/* Data point markers */}
          <circle cx='413' cy='128' r='6.5' fill='var(--chart-2)' />
        </svg>

        {/* Data labels */}
        <div
          className='absolute'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${LABEL_ONE_LEFT_RATIO})`,
            top: `calc(${CARD_HEIGHT_VAR} * ${LABEL_TOP_RATIO})`
          }}
        >
          <div className='bg-surface-accent border border-brandSemantic rounded-full px-2 py-1 text-label-sm text-brandSemantic'>
            21.000 €
          </div>
        </div>
        <div
          className='absolute'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${LABEL_TWO_LEFT_RATIO})`,
            top: `calc(${CARD_HEIGHT_VAR} * ${LABEL_TOP_RATIO})`
          }}
        >
          <div className='border border-chart-accent border-dashed rounded-full px-2 py-1 text-label-sm text-chart-accent'>
            24.000 €
          </div>
        </div>

        {/* X-axis labels */}
        <div
          className='absolute flex justify-between text-label-sm text-fg-muted'
          style={{
            left: `calc(${CARD_WIDTH_VAR} * ${GRID_LEFT_RATIO})`,
            width: `calc(${CARD_WIDTH_VAR} * ${GRID_WIDTH_RATIO})`,
            bottom: 0
          }}
        >
          {[
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sept',
            'Oct',
            'Nov',
            'Dic'
          ].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      {/* Comparison Card */}
      <div
        className='absolute right-fluid-md bg-surface border border-border rounded-lg p-gapsm'
        style={{
          top: `calc(${CARD_HEIGHT_VAR} * ${CHART_TOP_RATIO})`,
          width: `calc(${CARD_WIDTH_VAR} * ${COMPARISON_WIDTH_RATIO})`,
          height: `calc(${CARD_HEIGHT_VAR} * ${CHART_HEIGHT_RATIO})`
        }}
      >
        <p className='text-body-sm font-medium text-fg-secondary'>Oct, 2025</p>
        <p className='text-headline-lg text-fg-secondary mt-fluid-sm'>42.000</p>
        <div className='flex items-center gap-gapsm mt-fluid-sm'>
          <p className='text-body-lg text-brandSemantic'>+ 6%</p>
          <span className='material-symbols-rounded text-brandSemantic text-[24px]'>
            arrow_outward
          </span>
        </div>
        <p className='text-label-sm text-fg-secondary mt-fluid-md'>Oct, 2024</p>
        <p className='text-title-sm font-medium text-chart-accent'>40.000</p>
      </div>
    </section>
  )
}
