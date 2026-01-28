'use client'

import ClientLayout from '@/app/client-layout'
import WeekScheduler from '@/components/agenda/WeekScheduler'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function AgendaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const shouldOpen = searchParams.get('openCreate') === '1'
    if (!shouldOpen) return

    window.dispatchEvent(new CustomEvent('agenda:open-create-appointment'))
    router.replace('/agenda')
  }, [router, searchParams])

  return (
    <ClientLayout>
      <div className='flex h-full w-full overflow-hidden bg-surface-app'>
        <WeekScheduler />
      </div>
    </ClientLayout>
  )
}

export default function AgendaPage() {
  return (
    <Suspense fallback={null}>
      <AgendaPageContent />
    </Suspense>
  )
}
