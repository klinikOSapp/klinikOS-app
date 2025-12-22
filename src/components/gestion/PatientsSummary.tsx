import type { CashTimeScale } from '@/components/caja/cajaTypes'

type PatientItem = {
  label: string
  value: string
  percent: string
  change?: string
  kpi?: boolean
}
type PatientsSummaryProps = {
  yearLabel?: string
  items?: PatientItem[]
  timeScale?: CashTimeScale
}

function getItems(timeScale: CashTimeScale): PatientItem[] {
  if (timeScale === 'month') {
    return [
      { label: 'Activos', value: '5.020', percent: '48%', change: '+ 8%' },
      { label: 'Nuevos', value: '96', percent: '52%', change: '+ 10%' },
      { label: 'Crecimiento', value: '+ 9%', percent: '', kpi: true }
    ]
  }

  return [
    { label: 'Activos', value: '1.245', percent: '44%', change: '+ 12%' },
    { label: 'Nuevos', value: '23', percent: '56%', change: '+ 12%' },
    { label: 'Crecimiento', value: '+ 12%', percent: '', kpi: true }
  ]
}

export default function PatientsSummary({
  yearLabel = '2024',
  items,
  timeScale = 'week'
}: PatientsSummaryProps) {
  const data = items ?? getItems(timeScale)

  return (
    <section
      className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid w-full shrink-0 px-[0.5rem] pt-0 pb-card-inner'
      style={{ width: 'min(var(--width-card-stat-fluid), 100%)' }}
    >
      <div className='w-full px-[0.5rem]'>
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>Pacientes</h3>
        </header>
        <div
          className='mt-[0.9375rem] grid gap-[0.75rem] justify-center'
          style={{
            gridTemplateColumns:
              'repeat(3, min(var(--width-income-card), calc((100% - (0.75rem * 2)) / 3)))'
          }}
        >
          {data.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex h-income-card w-full flex-col justify-between items-start text-left'
              style={{ maxWidth: 'var(--width-income-card)' }}
            >
              <div className='flex flex-col items-start gap-[0.5rem] w-full'>
                <div className='flex items-center justify-between gap-[0.5rem] text-label-md text-fg-secondary whitespace-nowrap w-full'>
                  <span>{i.label}</span>
                  <span className='font-medium text-fg-secondary'>
                    {i.percent}
                  </span>
                </div>
                {i.kpi ? (
                  <div className='flex items-center gap-card-metric whitespace-nowrap'>
                    <div className='text-headline-lg text-[var(--color-brand-500)] whitespace-nowrap'>
                      {i.value}
                    </div>
                    <span className='material-symbols-rounded text-[var(--color-brand-500)] text-[2.125rem] leading-none'>
                      arrow_outward
                    </span>
                  </div>
                ) : (
                  <div className='text-headline-sm text-fg-secondary text-[var(--color-neutral-600)]'>
                    {i.value}
                  </div>
                )}
              </div>

              {!i.kpi && i.change ? (
                <div className='flex items-center gap-card-metric'>
                  <span className='text-body-sm text-[var(--color-brand-500)]'>
                    {i.change}
                  </span>
                  <span className='material-symbols-rounded text-[var(--color-brand-500)] text-[1rem] leading-none'>
                    arrow_outward
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
