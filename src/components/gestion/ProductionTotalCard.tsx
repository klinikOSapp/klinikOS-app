import type { CashTimeScale } from '@/components/caja/cajaTypes'
import type {
  GestionSpecialtyMetric,
  GestionSummaryKpis,
  SpecialtyFilter
} from './gestionTypes'

type ProductionTotalCardProps = {
  produced?: string
  invoiced?: string
  producedDelta?: string
  invoicedDelta?: string
  timeScale?: CashTimeScale
  selectedSpecialty?: SpecialtyFilter
  summary?: GestionSummaryKpis
  specialties?: GestionSpecialtyMetric[]
}

function formatCompactCurrency(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return `${value.toFixed(0)}`
}

function formatDelta(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export default function ProductionTotalCard({
  produced,
  invoiced,
  producedDelta,
  invoicedDelta,
  timeScale = 'week',
  selectedSpecialty,
  summary,
  specialties
}: ProductionTotalCardProps) {
  const periodLabel =
    timeScale === 'month' ? 'Mes' : timeScale === 'day' ? 'Día' : 'Semana'

  const specialtyData = specialties?.find((item) => item.label === selectedSpecialty)

  const producedValue = produced
    ? parseFloat(produced.replace(/[^0-9,.]/g, '').replace(',', '.'))
    : specialtyData?.produced ?? Number(summary?.produced || 0)
  const invoicedValue = invoiced
    ? parseFloat(invoiced.replace(/[^0-9,.]/g, '').replace(',', '.'))
    : specialtyData?.invoiced ?? Number(summary?.invoiced || 0)

  const defaultProducedDelta = Number(summary?.producedDelta || 0)
  const defaultInvoicedDelta = Number(summary?.invoicedDelta || 0)

  const billingRatio =
    producedValue > 0 ? Math.min((invoicedValue / producedValue) * 100, 100) : 0
  const pendingAmount = Math.max(producedValue - invoicedValue, 0)

  return (
    <section className='bg-brand-900 text-[var(--color-text-inverse)] rounded-lg shadow-elevation-card h-card-stat-fluid overflow-hidden min-w-0'>
      <div className='flex h-full flex-col p-3 lg:p-[0.875rem] overflow-hidden'>
        <header className='flex shrink-0 items-center justify-between mb-[0.5rem] gap-[0.5rem]'>
          <h3 className='text-title-sm font-medium text-[var(--color-text-inverse)] truncate'>
            Producido vs Facturado
          </h3>
          <span className='text-label-sm text-[var(--color-brand-400)] shrink-0'>
            {selectedSpecialty ? `${periodLabel} · ${selectedSpecialty}` : periodLabel}
          </span>
        </header>

        <div className='flex-1 flex flex-col justify-center min-w-0'>
          <div className='grid grid-cols-2 gap-[0.5rem] min-w-0'>
            <div className='flex flex-col min-w-0 overflow-hidden'>
              <div className='flex items-center gap-[0.25rem] mb-[0.125rem]'>
                <span className='w-[6px] h-[6px] rounded-full bg-[var(--color-brand-300)] shrink-0' />
                <span className='text-label-sm text-[var(--color-brand-300)] truncate'>
                  Producido
                </span>
              </div>
              <div className='flex items-baseline gap-[0.25rem] flex-wrap'>
                <span className='text-title-sm font-bold text-[var(--color-text-inverse)]'>
                  €{formatCompactCurrency(producedValue)}
                </span>
                <span className='text-label-sm text-[var(--color-brand-400)]'>
                  {producedDelta ?? formatDelta(defaultProducedDelta)}
                </span>
              </div>
            </div>

            <div className='flex flex-col min-w-0 overflow-hidden'>
              <div className='flex items-center gap-[0.25rem] mb-[0.125rem]'>
                <span className='w-[6px] h-[6px] rounded-full bg-[var(--color-brand-500)] shrink-0' />
                <span className='text-label-sm text-[var(--color-brand-400)] truncate'>
                  Facturado
                </span>
              </div>
              <div className='flex items-baseline gap-[0.25rem] flex-wrap'>
                <span className='text-title-sm font-bold text-[var(--color-text-inverse)]'>
                  €{formatCompactCurrency(invoicedValue)}
                </span>
                <span className='text-label-sm text-[var(--color-brand-500)]'>
                  {invoicedDelta ?? formatDelta(defaultInvoicedDelta)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-auto pt-[0.5rem]'>
          <div className='relative w-full h-[6px] bg-[var(--color-brand-800)] rounded-full overflow-hidden'>
            <div className='absolute inset-0 bg-[var(--color-brand-700)] rounded-full opacity-40' />
            <div
              className='absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] rounded-full transition-all duration-700'
              style={{ width: `${billingRatio}%` }}
            />
          </div>

          <div className='flex items-center justify-between mt-[0.375rem] gap-2 flex-wrap'>
            <span className='text-label-sm font-medium text-[var(--color-brand-300)] truncate'>
              {billingRatio.toFixed(0)}% facturado
            </span>
            {pendingAmount > 0 && (
              <span className='text-label-sm text-[var(--color-warning-600)] truncate shrink-0'>
                €{formatCompactCurrency(pendingAmount)} pdte facturar
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
