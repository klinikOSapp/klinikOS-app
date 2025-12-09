import ClientLayout from '@/app/client-layout'
import AccountingPanel from '@/components/gestion/AccountingPanel'
import BillingLineChart from '@/components/gestion/BillingLineChart'
import HeaderControls from '@/components/gestion/HeaderControls'
import IncomeTypes from '@/components/gestion/IncomeTypes'
import PatientsSummary from '@/components/gestion/PatientsSummary'
import ProductionTotalCard from '@/components/gestion/ProductionTotalCard'
import ProfessionalBars from '@/components/gestion/ProfessionalBars'
import SpecialtyDonut from '@/components/gestion/SpecialtyDonut'
import type { CSSProperties } from 'react'

const secondRowStyles = {
  '--height-card-chart-fluid': '100%',
  '--height-card-chart': '100%'
} as CSSProperties

const thirdRowStyles = {
  '--height-card-chart-fluid': '100%',
  '--height-card-chart': '100%',
  '--height-card-chart-fluid-base': '100%',
  '--chart-prof-height-limit': '100%',
  '--accounting-height-limit': '100%'
} as CSSProperties

export default function GestionPage() {
  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-surface-app rounded-tl-[var(--radius-xl)] flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-y-auto overflow-x-hidden'>
          <div className='container-page py-fluid-md pb-plnav flex h-full flex-col gap-gapmd overflow-hidden'>
            <HeaderControls />

            <div className='flex h-full flex-col gap-gapmd min-h-0'>
              {/* First row - Stats cards */}
              <div className='dashboard-grid-stats flex-none min-w-0'>
                <IncomeTypes />
                <PatientsSummary />
                <ProductionTotalCard />
              </div>

              {/* Second row - Billing chart + Specialty donut */}
              <div
                className='dashboard-grid-charts flex-1 min-h-0 min-w-0'
                style={secondRowStyles}
              >
                <BillingLineChart />
                <SpecialtyDonut />
              </div>

              {/* Third row - Accounting + Professional bars */}
              <div
                className='dashboard-grid-charts dashboard-grid-bottom flex-1 min-h-0 min-w-0'
                style={thirdRowStyles}
              >
                <AccountingPanel />
                <ProfessionalBars />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
