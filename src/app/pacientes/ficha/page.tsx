import React from 'react'
import ClientSummary from '@/components/pacientes/ClientSummary'

export default function PacienteFichaPage() {
  return (
    <div className='bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] min-h-[calc(100dvh-var(--spacing-topbar))] p-6'>
      <div className='flex gap-6'>
        <ClientSummary />
      </div>
    </div>
  )
}
