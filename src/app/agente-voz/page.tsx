'use client'

import ClientLayout from '@/app/client-layout'
import VoiceAgentPage from '@/components/agente-voz/VoiceAgentPage'

export default function AgenteVozPage() {
  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-surface-app rounded-tl-[var(--radius-xl)] flex flex-col overflow-hidden'>
        <VoiceAgentPage />
      </div>
    </ClientLayout>
  )
}
