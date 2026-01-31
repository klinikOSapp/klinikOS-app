'use client'

import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { CashClosingProvider } from '@/context/CashClosingContext'
import { PatientsProvider } from '@/context/PatientsContext'
import OrientationLock from '@/components/ui/OrientationLock'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PatientsProvider>
      <AppointmentsProvider>
        <CashClosingProvider>
          <OrientationLock />
          {children}
        </CashClosingProvider>
      </AppointmentsProvider>
    </PatientsProvider>
  )
}


