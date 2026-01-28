'use client'

import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { PatientsProvider } from '@/context/PatientsContext'
import OrientationLock from '@/components/ui/OrientationLock'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PatientsProvider>
      <AppointmentsProvider>
        <OrientationLock />
        {children}
      </AppointmentsProvider>
    </PatientsProvider>
  )
}


