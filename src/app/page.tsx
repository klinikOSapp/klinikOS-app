import AccountingPanel from '@/components/gestion/AccountingPanel'
import BillingLineChart from '@/components/gestion/BillingLineChart'
import HeaderControls from '@/components/gestion/HeaderControls'
import IncomeTypes from '@/components/gestion/IncomeTypes'
import PatientsSummary from '@/components/gestion/PatientsSummary'
import ProductionTotalCard from '@/components/gestion/ProductionTotalCard'
import ProfessionalBars from '@/components/gestion/ProfessionalBars'
import SpecialtyDonut from '@/components/gestion/SpecialtyDonut'

export default function Home() {
  return (
    <div className='min-h-screen bg-surface-app text-fg'>
      <main className='container-page py-fluid-lg flex flex-col gap-[var(--spacing-section-gap)]'>
        <div className='dashboard-header-group'>
          <HeaderControls />
        </div>

        <section className='dashboard-grid-stats mt-[var(--spacing-header-stack)]'>
            <IncomeTypes />
            <PatientsSummary />
            <ProductionTotalCard />
        </section>

        <section className='dashboard-grid-charts'>
          <BillingLineChart />
          <SpecialtyDonut />
        </section>

        <section className='dashboard-grid-double'>
          <AccountingPanel />
          <ProfessionalBars />
        </section>
      </main>
    </div>
  )
}
