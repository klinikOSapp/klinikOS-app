'use client'

import { AppointmentsProvider } from '@/context/AppointmentsContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppointmentsProvider>{children}</AppointmentsProvider>
}

