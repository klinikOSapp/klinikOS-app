type SpecialtyDonutProps = { yearLabel?: string }

const CARD_WIDTH_VAR = 'var(--width-card-chart-md)'
const DONUT_SIZE_RATIO = (203 / 529).toFixed(6)

export default function SpecialtyDonut({
  yearLabel = '2024'
}: SpecialtyDonutProps) {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md h-card-chart-fluid overflow-clip w-full'>
      <header className='flex items-center justify-between mb-fluid-sm'>
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por especialidad
        </h3>
        <div className='flex items-center gap-gapsm text-label-sm text-fg'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[16px]'>
            arrow_drop_down
          </span>
        </div>
      </header>

      {/* Toggle buttons */}
      <div className='flex mt-fluid-sm mb-fluid-sm'>
        <button className='bg-border border border-border px-gapsm py-gapsm rounded-l-2xl text-label-sm text-fg'>
          Barras
        </button>
        <button className='border border-l-0 border-border px-gapsm py-gapsm rounded-r-2xl text-label-sm text-fg'>
          Circular
        </button>
      </div>

      <div className='relative flex items-center gap-fluid-md'>
        {/* Donut Chart */}
        <div
          className='relative'
          style={{
            width: `calc(${CARD_WIDTH_VAR} * ${DONUT_SIZE_RATIO})`,
            height: `calc(${CARD_WIDTH_VAR} * ${DONUT_SIZE_RATIO})`
          }}
        >
          <svg viewBox='0 0 203 203' className='size-full -rotate-90'>
            {/* Background circle */}
            <circle
              cx='101.5'
              cy='101.5'
              r='76.5'
              fill='none'
              stroke='var(--color-brand-50)'
              strokeWidth='50'
            />
            {/* Conservadora 40% - Brand 50 */}
            <circle
              cx='101.5'
              cy='101.5'
              r='76.5'
              fill='none'
              stroke='var(--color-brand-50)'
              strokeWidth='50'
              strokeDasharray='192 481'
              strokeDashoffset='0'
            />
            {/* Ortodoncia 30% - Brand 200 */}
            <circle
              cx='101.5'
              cy='101.5'
              r='76.5'
              fill='none'
              stroke='var(--color-brand-200)'
              strokeWidth='50'
              strokeDasharray='144 481'
              strokeDashoffset='-192'
            />
            {/* Implantes 20% - Brand 500 */}
            <circle
              cx='101.5'
              cy='101.5'
              r='76.5'
              fill='none'
              stroke='var(--color-brand-500)'
              strokeWidth='50'
              strokeDasharray='96 481'
              strokeDashoffset='-336'
            />
            {/* Estética 10% - Brand 800 */}
            <circle
              cx='101.5'
              cy='101.5'
              r='76.5'
              fill='none'
              stroke='var(--color-brand-800)'
              strokeWidth='50'
              strokeDasharray='48 481'
              strokeDashoffset='-432'
            />
          </svg>

          {/* Center text */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <p className='text-headline-lg font-bold text-fg'>€ 56 K</p>
            <div className='flex items-center gap-gapsm mt-gapsm'>
              <p className='text-body-sm text-brandSemantic'>+ 35%</p>
              <span className='material-symbols-rounded text-brandSemantic text-[16px]'>
                arrow_outward
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className='flex flex-col gap-gapsm'>
          <div className='flex items-center gap-gapsm text-label-sm text-fg-800'>
            <div className='w-3 h-3 rounded-full bg-brand-50' />
            <span>Conservadora</span>
            <span className='font-medium'>40%</span>
          </div>
          <div className='flex items-center gap-gapsm text-label-sm text-fg-800'>
            <div className='w-3 h-3 rounded-full bg-brand-200' />
            <span>Ortodoncia</span>
            <span className='font-medium'>30%</span>
          </div>
          <div className='flex items-center gap-gapsm text-label-sm text-fg-800'>
            <div className='w-3 h-3 rounded-full bg-brand-500' />
            <span>Implantes</span>
            <span className='font-medium'>20%</span>
          </div>
          <div className='flex items-center gap-gapsm text-label-sm text-fg-800'>
            <div className='w-3 h-3 rounded-full bg-brand-800' />
            <span>Estética</span>
            <span className='font-medium'>10%</span>
          </div>
        </div>
      </div>
    </section>
  )
}
