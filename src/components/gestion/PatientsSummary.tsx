type PatientItem = {
  label: string
  value: string
  percent: string
  kpi?: boolean
}
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
    <section className='bg-surface rounded-lg shadow-elevation-card p-fluid-md h-card-stat-fluid w-card-stat-fluid shrink-0'>
      <header className='flex items-center justify-between mb-fluid-sm'>
        <h3 className='text-title-sm font-medium text-fg'>Pacientes</h3>
        <div className='flex items-center gap-1 text-label-sm text-fg'>
          <span>{yearLabel}</span>
          <span className='material-symbols-rounded text-[16px]'>
            arrow_drop_down
          </span>
        </div>
      </header>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gapmd'>
        {items.map((i) => (
          <div
            key={i.label}
            className='bg-surface-app rounded-lg p-gapsm h-full flex flex-col justify-between'
          >
            <div className='flex items-center justify-between text-label-sm text-fg-secondary mb-gapsm'>
              <span>{i.label}</span>
              <span className='font-medium text-fg'>{i.percent}</span>
            </div>
            {i.kpi ? (
              <div className='flex items-center gap-gapsm'>
                <div className='text-headline-lg text-brandSemantic'>+ 12%</div>
                <span className='material-symbols-rounded text-brandSemantic text-[34px]'>
                  arrow_outward
                </span>
              </div>
            ) : (
              <>
                <div className='text-headline-sm text-fg-secondary mb-1'>
                  {i.value}
                </div>
                <div className='flex items-center gap-1'>
                  <span className='text-body-sm text-brandSemantic'>+ 12%</span>
                  <span className='material-symbols-rounded text-brandSemantic text-[16px]'>
                    arrow_outward
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
