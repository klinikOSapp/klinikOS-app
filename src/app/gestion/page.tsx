import HeaderControls from '@/components/gestion/HeaderControls'
import IncomeTypes from '@/components/gestion/IncomeTypes'
import PatientsSummary from '@/components/gestion/PatientsSummary'
import ProductionTotalCard from '@/components/gestion/ProductionTotalCard'
import BillingLineChart from '@/components/gestion/BillingLineChart'
import SpecialtyDonut from '@/components/gestion/SpecialtyDonut'
import AccountingPanel from '@/components/gestion/AccountingPanel'
import ProfessionalBars from '@/components/gestion/ProfessionalBars'

export default function GestionPage() {
  return (
    <div className='bg-surface-app min-h-screen overflow-auto'>
      <div className='container-page py-fluid-md'>
        <HeaderControls />

        {/* First row - Stats cards */}
        <section className='dashboard-grid-stats mt-header-stack'>
          <IncomeTypes />
          <PatientsSummary />
          <ProductionTotalCard />
        </section>

        {/* Second row - Billing chart + Specialty donut */}
        <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-gapmd'>
          <BillingLineChart />
          <SpecialtyDonut />
        </div>

        {/* Third row - Accounting + Professional bars */}
        <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mt-gapmd'>
          <AccountingPanel />
          <ProfessionalBars />
        </div>
      </div>
    </div>
  )
}
