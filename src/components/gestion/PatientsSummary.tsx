import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { SpecialtyFilter } from './gestionTypes'

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
  selectedSpecialty?: SpecialtyFilter
}

function getItems(timeScale: CashTimeScale): PatientItem[] {
  // Datos realistas para clínica dental pequeña (4 profesionales)
  if (timeScale === 'month') {
    return [
      { label: 'Activos', value: '186', percent: '85%', change: '+ 8%' },
      { label: 'Nuevos', value: '32', percent: '15%', change: '+ 12%' },
      { label: 'Crecimiento', value: '+ 10%', percent: '', kpi: true }
    ]
  }

  // Semana: ~47 pacientes activos, 8 nuevos
  return [
    { label: 'Activos', value: '47', percent: '85%', change: '+ 6%' },
    { label: 'Nuevos', value: '8', percent: '15%', change: '+ 14%' },
    { label: 'Crecimiento', value: '+ 8%', percent: '', kpi: true }
  ]
}

export default function PatientsSummary({
  yearLabel = '2024',
  items,
  timeScale = 'week',
  selectedSpecialty
}: PatientsSummaryProps) {
  void yearLabel
  void selectedSpecialty // Will be used for filtering when connected to real data
  const data = items ?? getItems(timeScale)

  return (
    <section className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid overflow-hidden min-w-0 px-[0.5rem] pt-0 pb-card-inner'>
      <div className='w-full px-[0.5rem]'>
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>Pacientes</h3>
        </header>
        <div className='mt-[0.9375rem] grid gap-[0.75rem] grid-cols-3 auto-rows-fr'>
          {data.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex h-income-card w-full flex-col justify-between items-start text-left'
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
