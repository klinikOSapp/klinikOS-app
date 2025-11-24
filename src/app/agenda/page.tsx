import ClientLayout from '@/app/client-layout'
import WeekScheduler from '@/components/agenda/WeekScheduler'

export default function AgendaPage() {
  return (
    <ClientLayout>
      <div className='flex h-full w-full overflow-hidden bg-surface-app'>
          <WeekScheduler />
      </div>
    </ClientLayout>
  )
}

