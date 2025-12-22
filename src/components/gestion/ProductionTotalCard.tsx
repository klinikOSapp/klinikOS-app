import type { CashTimeScale } from '@/components/caja/cajaTypes'

type ProductionTotalCardProps = {
  periodLabel?: string
  value?: string
  delta?: string
  timeScale?: CashTimeScale
}

function getCardData(timeScale: CashTimeScale) {
  if (timeScale === 'month') {
    return {
      periodLabel: 'Mes actual',
      value: '€ 9.800,00',
      delta: '+ 18%'
    }
  }

  return {
    periodLabel: 'Semana actual',
    value: '€ 2.500,89',
    delta: '+ 35%'
  }
}

export default function ProductionTotalCard({
  periodLabel,
  value,
  delta,
  timeScale = 'week'
}: ProductionTotalCardProps) {
  const data = getCardData(timeScale)

  return (
    <section
      className='bg-brand-900 text-fg-inverse text-[var(--color-text-inverse)] rounded-lg shadow-elevation-card h-card-stat-fluid w-full shrink-0 overflow-hidden min-w-0'
      style={{
        width: 'min(var(--width-card-chart-md-fluid), 100%)'
      }}
    >
      <div className='flex h-full flex-col pl-[1rem] pr-card-pad pt-0 pb-[1rem] text-[var(--color-text-inverse)]'>
        <header className='mt-[1rem] flex shrink-0 items-baseline mb-[2.9375rem]'>
          <h3 className='text-title-sm font-medium text-[var(--color-text-inverse)]'>
            Producción total
          </h3>
        </header>
        <div className='flex flex-wrap items-baseline gap-[1rem] text-[var(--color-text-inverse)]'>
          <div className='text-display-lg text-[var(--color-text-inverse)]'>
            {value ?? data.value}
          </div>
          <div className='flex items-center gap-card-row'>
            <span className='text-body-lg text-[var(--color-brand-500)]'>
              {delta ?? data.delta}
            </span>
            <span className='material-symbols-rounded text-[var(--color-brand-500)] text-[1.5rem] leading-[1.5rem]'>
              arrow_outward
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
