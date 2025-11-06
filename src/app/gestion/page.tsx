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
        <div className='grid grid-cols-1 md:grid-cols-3 gap-fluid-md mt-stats-offset'>
          <IncomeTypes />
          <PatientsSummary />
          <ProductionTotalCard />
        </div>

        {/* Second row - Billing chart + Specialty donut */}
        <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-fluid-md mt-gapmd'>
          <BillingLineChart />
          <SpecialtyDonut />
        </div>

        {/* Third row - Accounting + Professional bars */}
        <div className='grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-fluid-md mt-section-gap'>
          <AccountingPanel />
          <ProfessionalBars />
        </div>
      </div>
    </div>
  )
}
