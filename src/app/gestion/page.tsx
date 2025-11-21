'use client'

import HeaderControls from '@/components/gestion/HeaderControls'
import AccountingPanel from '@/components/gestion/AccountingPanel'
import BillingLineChart from '@/components/gestion/BillingLineChart'
import IncomeTypes from '@/components/gestion/IncomeTypes'
import PatientsSummary from '@/components/gestion/PatientsSummary'
import ProductionTotalCard from '@/components/gestion/ProductionTotalCard'
import ProfessionalBars from '@/components/gestion/ProfessionalBars'
import SpecialtyDonut from '@/components/gestion/SpecialtyDonut'
import { useUserRole } from '@/context/role-context'
import { useRouter } from 'next/navigation'
import type { CSSProperties } from 'react'
import { useEffect } from 'react'

const thirdRowStyles = {
  '--height-card-chart-fluid-base': 'clamp(17.6rem, 34vh, 23.25rem)',
  '--chart-prof-height-limit': '34vh',
  '--accounting-height-limit': '34vh'
} satisfies CSSProperties

export default function GestionPage() {
  const router = useRouter()
  const { role, canViewFinancials } = useUserRole()

  useEffect(() => {
    if (role && !canViewFinancials) {
      router.replace('/')
    }
  }, [role, canViewFinancials, router])

  if (role && !canViewFinancials) {
    return (
      <div className='flex h-[calc(100dvh-var(--spacing-topbar))] flex-col items-center justify-center rounded-tl-[var(--radius-xl)] bg-[var(--color-neutral-50)] px-6 text-center text-neutral-700'>
        <p className='text-title-md font-semibold text-neutral-900'>Sin acceso</p>
        <p className='mt-2 max-w-md text-body-md'>
          Tu rol actual no tiene permisos para ver el panel de gestión. Contacta con gerencia si
          necesitas acceso.
        </p>
      </div>
    )
  }

  return (
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
  )
}
