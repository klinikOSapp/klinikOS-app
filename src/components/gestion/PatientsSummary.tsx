type PatientItem = { label: string; value: string; percent: string; kpi?: boolean }
type PatientsSummaryProps = { yearLabel?: string; items?: PatientItem[] }

const defaultItems: PatientItem[] = [
  { label: 'Activos', value: '1.245', percent: '44%' },
  { label: 'Nuevos', value: '23', percent: '56%' },
  { label: 'Crecimiento', value: '+ 12%', percent: '44%', kpi: true }
]

export default function PatientsSummary({
  yearLabel = '2024',
  items = defaultItems
}: PatientsSummaryProps) {
  return (
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md'>
      <header className='flex items-center justify-between'>
        <h3 className='text-title-md text-fg'>Pacientes</h3>
        <div className='text-label-sm text-fg-secondary'>{yearLabel} ▾</div>
      </header>
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-fluid-sm pt-fluid-sm'>
        {items.map((i) => (
          <div key={i.label} className='bg-surface-app rounded-lg p-fluid-sm'>
            <div className='flex items-center justify-between text-label-sm text-fg-secondary'>
              <span>{i.label}</span>
              <span className='text-fg'>{i.percent}</span>
            </div>
            {i.kpi ? (
              <div className='flex items-center gap-2'>
                <div className='text-display-md text-state-success'>+ 12%</div>
                <span className='material-symbols-rounded text-state-success'>trending_up</span>
              </div>
            ) : (
              <div className='text-headline-sm text-fg'>{i.value}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}


