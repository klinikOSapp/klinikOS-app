type SpecialtyShare = {
  label: string
  percentage: number
  colorToken: string
}

type ProductionTotalCardProps = {
  year?: string
  value?: string
  delta?: string
  view?: 'barras' | 'circular'
  specialties?: SpecialtyShare[]
}

const DEFAULT_SPECIALTIES: SpecialtyShare[] = [
  {
    label: 'Conservadora',
    percentage: 40,
    colorToken: 'var(--color-brand-50)'
  },
  { label: 'Ortodoncia', percentage: 30, colorToken: 'var(--color-brand-200)' },
  { label: 'Implantes', percentage: 20, colorToken: 'var(--color-brand-500)' },
  { label: 'Estética', percentage: 10, colorToken: 'var(--color-brand-800)' }
]

const CARD_WIDTH = 'var(--width-card-chart-md)'
const CARD_HEIGHT = 'var(--height-card-chart)'
const DONUT_SIZE_REM = 12.6875
const LEGEND_WIDTH_REM = 8.375

function buildGradientStops(segments: SpecialtyShare[]) {
  let cursor = 0
  return segments
    .map(({ percentage, colorToken }) => {
      const start = cursor
      cursor += percentage
      return `${colorToken} ${start}% ${cursor}%`
    })
    .join(', ')
}

export default function ProductionTotalCard({
  year = '2024',
  value = '€ 56 K',
  delta = '+ 35%',
  view = 'circular',
  specialties = DEFAULT_SPECIALTIES
}: ProductionTotalCardProps) {
  const gradientStops = buildGradientStops(specialties)

  return (
    <section
      className='relative overflow-clip rounded-lg bg-surface text-fg shadow-elevation-card'
      style={{
        width: `min(${CARD_WIDTH}, 95vw)`,
        height: `min(${CARD_HEIGHT}, calc(100vh - 6rem))`
      }}
    >
      <header className='absolute left-[1rem] top-[1rem] flex w-[min(31.0625rem,calc(95vw-2rem))] items-baseline justify-between'>
        <h3 className='text-title-sm font-medium text-fg'>
          Facturación por especialidad
        </h3>
        <button
          type='button'
          className='flex items-center gap-[0.25rem] text-[0.75rem] leading-4 text-fg font-normal'
          aria-label={`Seleccionar periodo ${year}`}
        >
          {year}
          <span className='material-symbols-rounded text-[1rem] leading-4 text-fg'>
            arrow_drop_down
          </span>
        </button>
      </header>

      <div className='absolute left-[1rem] top-[3.5rem] flex'>
        <button
          type='button'
          className='flex items-center justify-center rounded-l-[1rem] border border-neutral-300 border-r-0 bg-neutral-300 px-[0.5rem] py-[0.25rem] text-[0.75rem] leading-4 text-neutral-900 font-normal'
          aria-pressed={view === 'barras'}
        >
          Barras
        </button>
        <button
          type='button'
          className='flex items-center justify-center rounded-r-[1rem] border border-neutral-300 px-[0.25rem] py-[0.25rem] text-[0.75rem] leading-4 text-neutral-900 font-normal'
          aria-pressed={view === 'circular'}
        >
          Circular
        </button>
      </div>

      <div
        className='absolute left-[1rem] top-[6.5rem] flex items-center justify-center'
        style={{
          width: `min(${DONUT_SIZE_REM}rem, 40vw)`,
          height: `min(${DONUT_SIZE_REM}rem, 40vw)`
        }}
        aria-hidden='true'
      >
        <div
          className='relative size-full rounded-full'
          style={{
            background: `conic-gradient(${gradientStops})`
          }}
        >
          <div className='absolute inset-[0.75rem] rounded-full border border-[rgba(255,255,255,0.5)] bg-surface' />
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-gapsm'>
            <p className='text-headline-lg text-neutral-900'>{value}</p>
            <div className='flex items-center gap-gapsm'>
              <span className='text-body-sm font-normal text-brand-500'>
                {delta}
              </span>
              <span className='material-symbols-rounded text-brand-500 text-[1rem] leading-4'>
                arrow_outward
              </span>
            </div>
          </div>
        </div>
      </div>

      <dl
        className='absolute top-[9.6875rem] flex flex-col gap-[0.75rem] text-[0.75rem] leading-4 text-neutral-800'
        style={{
          left: `min(16.9375rem, calc(95vw - 10.5rem))`,
          width: `min(${LEGEND_WIDTH_REM}rem, calc(95vw - 18rem))`
        }}
      >
        {specialties.map(({ label, percentage, colorToken }) => (
          <div key={label} className='flex items-center gap-[0.5rem]'>
            <span
              className='h-[0.75rem] w-[0.75rem] rounded-full'
              style={{ backgroundColor: colorToken }}
              aria-hidden='true'
            />
            <div className='flex w-full items-center justify-between gap-[0.5rem]'>
              <dt className='font-normal'>{label}</dt>
              <dd className='font-medium'>{percentage}%</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
