type BillingLineChartProps = { yearLabel?: string }

const CARD_HEIGHT_VAR = 'var(--height-card-chart-fluid)'
const CARD_WIDTH_VAR = 'var(--width-card-chart-lg-fluid)'
const CARD_WIDTH_STYLE = 'min(100%, var(--width-card-chart-lg-fluid))'

const HEADER_LEFT_RATIO = 16 / 1069
const HEADER_TOP_RATIO = 16 / 342
const Y_AXIS_LEFT_RATIO = 16 / 1069
const Y_AXIS_TOP_RATIO = 64 / 342
const Y_AXIS_HEIGHT_RATIO = 222 / 342
const GRID_LEFT_RATIO = 63 / 1069
const GRID_TOP_RATIO = 58 / 342
const GRID_WIDTH_RATIO = 824 / 1069
const GRID_HEIGHT_RATIO = 228 / 342
const MONTH_ROW_TOP_RATIO = 302 / 342
const CHIP_PRIMARY_LEFT_RATIO = 410 / 1069
const CHIP_PRIMARY_TOP_RATIO = 118 / 342
const CHIP_SECONDARY_LEFT_RATIO = 442 / 1069
const CHIP_SECONDARY_TOP_RATIO = 86 / 342
const COMPARISON_LEFT_RATIO = 911 / 1069
const COMPARISON_TOP_RATIO = 58 / 342
const COMPARISON_WIDTH_RATIO = 142 / 1069
const HIGHLIGHT_LEFT_RATIO = (63 + 673.3636474609375) / 1069
const HIGHLIGHT_WIDTH_RATIO = 1 / 1069
const BRAND_LINE_LEFT_RATIO = 64 / 1069
const BRAND_LINE_TOP_RATIO = 148.49644470214844 / 342
const BRAND_LINE_WIDTH_RATIO = 673.5 / 1069
const BRAND_LINE_HEIGHT_RATIO = 106.50354766845703 / 342
const ACCENT_LINE_LEFT_RATIO = 63.5 / 1069
const ACCENT_LINE_TOP_RATIO = 161.86012268066406 / 342
const ACCENT_LINE_WIDTH_RATIO = 673.5 / 1069
const ACCENT_LINE_HEIGHT_RATIO = 103.1398696899414 / 342
const POINT_LEFT_RATIO = 356 / 1069
const POINT_TOP_RATIO = 142 / 342
const POINT_SIZE_RATIO = 13 / 342

const BRAND_LINE_SRC =
  'http://localhost:3845/assets/fcad0c2a4a81dfabb9159066244314acf76f927a.svg'
const ACCENT_LINE_SRC =
  'http://localhost:3845/assets/4b71e124208891d8f4cea425632526d07945cf2b.svg'
const POINT_SRC =
  'http://localhost:3845/assets/f840588f7a97e1a29391a19836fc99276e96acc6.svg'

const Y_AXIS_LABELS = ['90K', '70K', '50K', '30K', '10K', '0']
const MONTH_LABELS = [
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
]

const toWidth = (ratio: number) =>
  `calc(${CARD_WIDTH_VAR} * ${ratio.toFixed(6)})`
const toHeight = (ratio: number) =>
  `calc(${CARD_HEIGHT_VAR} * ${ratio.toFixed(6)})`

export default function BillingLineChart({
  yearLabel = '2024'
}: BillingLineChartProps) {
  return (
    <section
      className='relative w-full overflow-clip rounded-lg bg-surface shadow-elevation-card'
      style={{ height: CARD_HEIGHT_VAR, width: CARD_WIDTH_STYLE }}
    >
      <header
        className='absolute z-10 flex items-baseline justify-between text-fg'
        style={{
          left: toWidth(HEADER_LEFT_RATIO),
          right: toWidth(HEADER_LEFT_RATIO),
          top: toHeight(HEADER_TOP_RATIO)
        }}
      >
        <h3 className='text-title-sm font-medium'>Facturación</h3>
        <div className='flex items-center gap-[0.25rem] text-label-sm'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[1rem] leading-none'>
            arrow_drop_down
          </span>
        </div>
      </header>

      <div
        className='absolute flex flex-col justify-between text-label-sm text-neutral-400'
        style={{
          left: toWidth(Y_AXIS_LEFT_RATIO),
          top: toHeight(Y_AXIS_TOP_RATIO),
          height: toHeight(Y_AXIS_HEIGHT_RATIO)
        }}
      >
        {Y_AXIS_LABELS.map((value) => (
          <span key={value}>{value}</span>
        ))}
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(GRID_LEFT_RATIO),
          top: toHeight(GRID_TOP_RATIO),
          width: toWidth(GRID_WIDTH_RATIO),
          height: toHeight(GRID_HEIGHT_RATIO)
        }}
      >
        <div
          className='absolute inset-0'
          style={{
            backgroundImage:
              'linear-gradient(to bottom, var(--chart-grid) 1px, transparent 1px), linear-gradient(to right, var(--chart-grid) 1px, transparent 1px)',
            backgroundSize: '100% calc(100% / 5), calc(100% / 11) 100%',
            backgroundPosition: 'left top, left top'
          }}
        />
        <div
          className='absolute inset-y-0'
          style={{
            left: toWidth(HIGHLIGHT_LEFT_RATIO),
            width: `max(1px, calc(${CARD_WIDTH_VAR} * ${HIGHLIGHT_WIDTH_RATIO.toFixed(
              6
            )}))`,
            backgroundColor: 'var(--color-warning-200)'
          }}
        />
        <img
          alt=''
          aria-hidden
          className='absolute pointer-events-none select-none'
          src={ACCENT_LINE_SRC}
          style={{
            left: toWidth(ACCENT_LINE_LEFT_RATIO),
            top: toHeight(ACCENT_LINE_TOP_RATIO),
            width: toWidth(ACCENT_LINE_WIDTH_RATIO),
            height: toHeight(ACCENT_LINE_HEIGHT_RATIO)
          }}
        />
        <img
          alt=''
          aria-hidden
          className='absolute pointer-events-none select-none'
          src={BRAND_LINE_SRC}
          style={{
            left: toWidth(BRAND_LINE_LEFT_RATIO),
            top: toHeight(BRAND_LINE_TOP_RATIO),
            width: toWidth(BRAND_LINE_WIDTH_RATIO),
            height: toHeight(BRAND_LINE_HEIGHT_RATIO)
          }}
        />
        <img
          alt=''
          aria-hidden
          className='absolute pointer-events-none select-none'
          src={POINT_SRC}
          style={{
            left: toWidth(POINT_LEFT_RATIO),
            top: toHeight(POINT_TOP_RATIO),
            width: toHeight(POINT_SIZE_RATIO),
            height: toHeight(POINT_SIZE_RATIO),
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(CHIP_PRIMARY_LEFT_RATIO),
          top: toHeight(CHIP_PRIMARY_TOP_RATIO),
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className='rounded-full border border-brandSemantic bg-brand-50 px-[0.5rem] py-[0.25rem] text-label-sm text-brandSemantic'>
          21.000 €
        </div>
      </div>

      <div
        className='absolute'
        style={{
          left: toWidth(CHIP_SECONDARY_LEFT_RATIO),
          top: toHeight(CHIP_SECONDARY_TOP_RATIO),
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className='rounded-full border border-info-200 border-dashed px-[0.5rem] py-[0.25rem] text-label-sm text-info-200'>
          24.000 €
        </div>
      </div>

      <div
        className='absolute flex justify-between text-label-sm text-neutral-400'
        style={{
          left: toWidth(GRID_LEFT_RATIO),
          top: toHeight(MONTH_ROW_TOP_RATIO),
          width: toWidth(GRID_WIDTH_RATIO)
        }}
      >
        {MONTH_LABELS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      <div
        className='absolute flex flex-col rounded-lg border border-border bg-surface'
        style={{
          left: toWidth(COMPARISON_LEFT_RATIO),
          top: toHeight(COMPARISON_TOP_RATIO),
          width: toWidth(COMPARISON_WIDTH_RATIO),
          height: toHeight(GRID_HEIGHT_RATIO),
          padding: '0.625rem'
        }}
      >
        <p className='text-body-sm font-medium text-neutral-600'>Oct, 2025</p>
        <p className='mt-[0.75rem] text-headline-lg text-neutral-600'>42.000</p>
        <div className='mt-[0.5rem] flex items-center gap-[0.5rem]'>
          <span className='text-body-lg text-brandSemantic'>+ 6%</span>
          <span className='material-symbols-rounded text-brandSemantic text-[1.5rem] leading-none'>
            arrow_outward
          </span>
        </div>
        <p className='mt-[3.25rem] text-label-sm text-neutral-600'>Oct, 2024</p>
        <p className='text-title-sm font-medium text-info-200'>40.000</p>
      </div>
    </section>
  )
}
