import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type { GestionPatientsSummary, SpecialtyFilter } from './gestionTypes'

type PatientItem = {
  label: string
  value: string
  percent: string
  kpi?: boolean
}

type PatientsSummaryProps = {
  yearLabel?: string
  summary?: GestionPatientsSummary
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
}

export default function PatientsSummary({
  yearLabel = '2024',
  summary,
  selectedSpecialty
}: PatientsSummaryProps) {
  void yearLabel
  void selectedSpecialty

  const active = Math.max(0, Number(summary?.active || 0))
  const fresh = Math.max(0, Number(summary?.nextDate || 0))
  const total = active + fresh
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0
  const newPercent = total > 0 ? Math.round((fresh / total) * 100) : 0
  const growth = Number(summary?.growthPercent || 0)

  const data: PatientItem[] = [
    {
      label: 'Activos',
      value: active.toLocaleString('es-ES'),
      percent: `${activePercent}%`
    },
    {
      label: 'Nuevos',
      value: fresh.toLocaleString('es-ES'),
      percent: `${newPercent}%`
    },
    {
      label: 'Crecimiento',
      value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      percent: '',
      kpi: true
    }
  ]

  return (
    <section className='bg-surface rounded-lg shadow-elevation-card h-card-stat-fluid overflow-hidden min-w-0 px-[0.5rem] pt-0 pb-card-inner'>
      <div className='w-full px-[0.5rem]'>
        <header className='mt-[1rem] flex items-baseline justify-between'>
          <h3 className='text-title-sm font-medium text-fg'>Pacientes</h3>
        </header>
        <div className='mt-[0.9375rem] grid gap-[0.5rem] lg:gap-[0.75rem] grid-cols-1 sm:grid-cols-3 auto-rows-fr'>
          {data.map((i) => (
            <div
              key={i.label}
              className='bg-surface-app rounded-lg px-[0.5rem] py-[0.5rem] flex min-h-[4rem] lg:h-income-card w-full flex-col justify-between items-start text-left'
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
