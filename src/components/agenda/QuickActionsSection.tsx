'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'

export type QuickActionsSectionProps = {
  showPaymentAction: boolean
  paymentAmount?: string
  onPaymentClick: () => void
  onViewPatientClick: () => void
}

export default function QuickActionsSection({
  showPaymentAction,
  paymentAmount,
  onPaymentClick,
  onViewPatientClick
}: QuickActionsSectionProps) {
  return (
    <div className='flex items-start gap-[var(--scheduler-overlay-icon-gap)]'>
      <span
        aria-hidden='true'
        className='flex shrink-0 items-center justify-center text-[var(--scheduler-overlay-icon-size)]'
        style={{
          width: 'var(--scheduler-overlay-icon-size)',
          height: 'var(--scheduler-overlay-icon-size)'
        }}
      >
        <MD3Icon
          name='AppsRounded'
          size='inherit'
          className='text-[var(--color-neutral-600)]'
        />
      </span>
      <div
        className='flex flex-1 flex-col'
        style={{ gap: 'var(--scheduler-overlay-value-gap)' }}
      >
        <span className='text-xs font-normal text-[var(--color-neutral-600)] leading-4'>
          Acciones rápidas
        </span>
        <div className='grid grid-cols-2 gap-2'>
          {/* Botón Ver ficha - siempre visible */}
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onViewPatientClick()
            }}
            className='flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-neutral-100)] px-4 py-2 text-[var(--color-neutral-900)] transition-all hover:brightness-95 active:brightness-90'
          >
            <MD3Icon name='FolderOpenRounded' size={1} />
            <span className='text-sm font-medium'>Ver ficha</span>
          </button>

          {/* Botón Cobrar - a la derecha, acción principal */}
          {showPaymentAction && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onPaymentClick()
              }}
              className='flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-4 py-2 text-[var(--color-brand-900)] transition-all hover:brightness-95 active:brightness-90'
            >
              <MD3Icon name='PaymentsRounded' size={1} />
              <span className='text-sm font-medium'>
                {paymentAmount ? `Cobrar ${paymentAmount}` : 'Cobrar'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
