import ClientLayout from '@/app/client-layout'
import HeaderControls from '@/components/gestion/HeaderControls'
import IncomeTypes from '@/components/gestion/IncomeTypes'
import PatientsSummary from '@/components/gestion/PatientsSummary'
import ProductionTotalCard from '@/components/gestion/ProductionTotalCard'
import BillingLineChart from '@/components/gestion/BillingLineChart'
import SpecialtyDonut from '@/components/gestion/SpecialtyDonut'
import AccountingPanel from '@/components/gestion/AccountingPanel'
import ProfessionalBars from '@/components/gestion/ProfessionalBars'
import type { CSSProperties } from 'react'

const thirdRowStyles = {
  '--height-card-chart-fluid-base': 'clamp(15rem, 30vh, 21.375rem)',
  '--chart-prof-height-limit': '30vh',
  '--accounting-height-limit': '30vh',
  paddingBottom: '1.5rem'
} satisfies CSSProperties

export default function GestionPage() {
  return (
    <ClientLayout>
      <div className='bg-surface-app min-h-screen overflow-auto pb-plnav'>
        <div className='container-page py-fluid-md pb-plnav'>
          <HeaderControls />

          {/* First row - Stats cards */}
          <div className='dashboard-grid-stats mt-header-stack'>
            <IncomeTypes />
            <PatientsSummary />
            <ProductionTotalCard />
          </div>

          {/* Second row - Billing chart + Specialty donut */}
          <div className='dashboard-grid-charts mt-gapmd'>
            <BillingLineChart />
            <SpecialtyDonut />
          </div>

          {/* Third row - Accounting + Professional bars */}
          <div
            className='dashboard-grid-charts dashboard-grid-bottom mt-gapmd mb-plnav'
            style={thirdRowStyles}
          >
            <AccountingPanel />
            <ProfessionalBars />
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
