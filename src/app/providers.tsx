'use client'

import OrientationLock from '@/components/ui/OrientationLock'
import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { CashClosingProvider } from '@/context/CashClosingContext'
import { PatientFilesProvider } from '@/context/PatientFilesContext'
import { PatientsProvider } from '@/context/PatientsContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PatientsProvider>
      <AppointmentsProvider>
        <CashClosingProvider>
          <PatientFilesProvider>
            <OrientationLock />
            {children}
          </PatientFilesProvider>
        </CashClosingProvider>
      </AppointmentsProvider>
    </PatientsProvider>
  )
}
