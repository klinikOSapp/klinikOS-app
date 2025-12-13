type PatientItem = {
  label: string
  value: string
  percent: string
  change?: string
  kpi?: boolean
}
type PatientsSummaryProps = { yearLabel?: string; items?: PatientItem[] }

const defaultItems: PatientItem[] = [
  { label: 'Activos', value: '1.245', percent: '44%', change: '+ 12%' },
  { label: 'Nuevos', value: '23', percent: '56%', change: '+ 12%' },
  { label: 'Crecimiento', value: '+ 12%', percent: '44%', kpi: true }
]

export default function PatientsSummary({
  yearLabel = '2024',
  items = defaultItems
}: PatientsSummaryProps) {
  return (
    <section
      className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid w-full shrink-0 px-card-pad pt-0 pb-card-inner'
      style={{ width: 'min(var(--width-card-stat-fluid), 100%)' }}
    >
      <div
        className='w-full'
        style={{
          maxWidth: 'calc((var(--width-income-card) * 3) + (0.75rem * 2))',
          marginInline: 'auto'
        }}
      >
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>Pacientes</h3>
          <div className='flex items-center gap-card-metric text-label-md text-fg'>
            <span>{yearLabel}</span>
            <span className='material-symbols-rounded text-[1rem] leading-none'>
              arrow_drop_down
            </span>
          </div>
        </header>
        <div
          className='mt-[0.9375rem] grid gap-[0.75rem] justify-center'
          style={{
            gridTemplateColumns:
              'repeat(3, min(var(--width-income-card), calc((100% - (0.75rem * 2)) / 3)))'
          }}
        >
          {items.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex h-income-card w-full flex-col justify-between items-start text-left'
              style={{ maxWidth: 'var(--width-income-card)' }}
            >
              <div className='flex flex-col items-start gap-[0.5rem] w-full'>
                <div className='flex items-center justify-between gap-[0.5rem] text-label-md text-fg-secondary whitespace-nowrap w-full'>
                  <span>{i.label}</span>
                  <span className='font-medium text-fg'>{i.percent}</span>
                </div>
                {i.kpi ? (
                  <div className='flex items-center gap-card-metric'>
                    <div className='text-headline-lg text-brandSemantic'>
                      {i.value}
                    </div>
                    <span className='material-symbols-rounded text-brandSemantic text-[2.125rem] leading-none'>
                      arrow_outward
                    </span>
                  </div>
                ) : (
                  <div className='text-headline-sm text-fg-secondary'>
                    {i.value}
                  </div>
                )}
              </div>

              {!i.kpi && i.change ? (
                <div className='flex items-center gap-card-metric'>
                  <span className='text-body-sm text-brandSemantic'>
                    {i.change}
                  </span>
                  <span className='material-symbols-rounded text-brandSemantic text-[1rem] leading-none'>
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
