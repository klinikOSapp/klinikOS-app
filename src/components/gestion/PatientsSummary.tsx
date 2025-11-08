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
    <section className='bg-surface rounded-lg shadow-elevation-card p-card-pad h-card-stat-fluid w-card-stat-fluid shrink-0'>
      <header className='flex items-center justify-between mb-header-cards'>
        <h3 className='text-title-sm font-medium text-fg'>Pacientes</h3>
        <div className='flex items-center gap-card-metric'>
          <span className='text-label-md font-normal text-fg'>{yearLabel}</span>
          <span className='material-symbols-rounded text-fg text-[1rem] leading-none'>
            arrow_drop_down
          </span>
        </div>
      </header>
      <div className='grid grid-cols-3 gap-card-gap'>
        {items.map((i) => (
          <div
            key={i.label}
            className='bg-surface-app rounded-lg p-card-inner flex min-h-[min(6.25rem,12vh)] flex-col gap-card-row'
          >
            <div className='flex items-center justify-between'>
              <span className='text-label-md font-normal text-fg-secondary'>
                {i.label}
              </span>
              <span className='text-label-md font-medium text-fg'>
                {i.percent}
              </span>
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
              <>
                <div className='text-headline-sm text-fg-secondary'>
                  {i.value}
                </div>
                {i.change ? (
                  <div className='flex items-center gap-card-metric'>
                    <span className='text-body-sm text-brandSemantic'>
                      {i.change}
                    </span>
                    <span className='material-symbols-rounded text-brandSemantic text-[1rem] leading-none'>
                      arrow_outward
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
