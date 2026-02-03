'use client'

import OrientationLock from '@/components/ui/OrientationLock'
import { AppointmentsProvider } from '@/context/AppointmentsContext'
import { AuthProvider } from '@/context/AuthContext'
import { CashClosingProvider } from '@/context/CashClosingContext'
import { ClinicProvider } from '@/context/ClinicContext'
import { ConfigurationProvider } from '@/context/ConfigurationContext'
import { PatientFilesProvider } from '@/context/PatientFilesContext'
import { PatientsProvider } from '@/context/PatientsContext'
import { SubscriptionProvider } from '@/context/SubscriptionContext'
import { UnsavedChangesProvider } from '@/context/UnsavedChangesContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClinicProvider>
        <UnsavedChangesProvider>
          <SubscriptionProvider>
            <ConfigurationProvider>
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
            </ConfigurationProvider>
          </SubscriptionProvider>
        </UnsavedChangesProvider>
      </ClinicProvider>
    </AuthProvider>
  )
}
