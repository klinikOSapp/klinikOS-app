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
    <div className='bg-surface-app h-full overflow-auto'>
      <div className='container-page py-fluid-md space-y-fluid-md'>
        <HeaderControls />

        <div className='grid grid-cols-1 md:grid-cols-3 gap-fluid-md'>
          <IncomeTypes />
          <PatientsSummary />
          <ProductionTotalCard />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-fluid-md'>
          <div className='lg:col-span-2'>
            <BillingLineChart />
          </div>
          <SpecialtyDonut />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-fluid-md'>
          <div className='lg:col-span-2'>
            <AccountingPanel />
          </div>
          <ProfessionalBars />
        </div>
      </div>
    </div>
  )
}


