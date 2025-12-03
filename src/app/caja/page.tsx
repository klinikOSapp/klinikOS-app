import ClientLayout from '@/app/client-layout'
import CashMovementsTable from '@/components/caja/CashMovementsTable'
import CashSummaryCard from '@/components/caja/CashSummaryCard'
import CashToolbar from '@/components/caja/CashToolbar'
import CashTrendCard from '@/components/caja/CashTrendCard'

export default function CajaPage() {
  return (
    <ClientLayout>
      <div className='bg-surface-app min-h-screen overflow-auto pb-plnav'>
        <div className='container-page py-fluid-md pb-plnav'>
          <CashToolbar />
          <div className='mt-fluid-md flex justify-center'>
            <div
              className='grid gap-gapmd'
              style={{
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                width: 'min(99.5rem, 95vw)'
              }}
            >
              <CashSummaryCard />
              <CashTrendCard />
            </div>
          </div>
          <CashMovementsTable />
        </div>
      </div>
    </ClientLayout>
  )
}
