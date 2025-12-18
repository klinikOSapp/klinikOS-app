'use client'

import React from 'react'
import BudgetsPayments from './BudgetsPayments'
import ClientSummary from './ClientSummary'
import ClinicalHistory from './ClinicalHistory'
import Consents from './Consents'
import RxImages from './RxImages'

export type PatientRecordTab =
  | 'Resumen'
  | 'Historial clínico'
  | 'Imágenes RX'
  | 'Presupuestos y pagos'
  | 'Consentimientos'

type PatientRecordModalProps = {
  open: boolean
  onClose: () => void
  initialTab?: PatientRecordTab
}

export default function PatientRecordModal({
  open,
  onClose,
  initialTab = 'Resumen'
}: PatientRecordModalProps) {
  const [active, setActive] = React.useState<PatientRecordTab>(initialTab)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [onClose, open])

  React.useEffect(() => {
    if (open) {
      setActive(initialTab)
    }
  }, [initialTab, open])

  if (!open) return null

  const items: Array<{ title: typeof active; body: string }> = [
    {
      title: 'Resumen',
      body: 'Datos básicos de consulta, alertas, próximas citas, deuda, ...'
    },
    {
      title: 'Historial clínico',
      body: 'Notas SOAP, odontograma, actos y adjuntos.'
    },
    {
      title: 'Imágenes RX',
      body: 'capturas intraorales/fotos antes-después y escáner 3D.'
    },
    {
      title: 'Presupuestos y pagos',
      body: 'Cobros, financiación embebida, facturas/recibos y conciliación.'
    },
    {
      title: 'Consentimientos',
      body: 'Accede a todos los consentimientos de los pacientes.'
    }
  ]

  return (
    <div
      className='fixed inset-0 z-50 bg-black/30 overflow-hidden'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 flex items-center justify-center px-8'>
        <div
          role='dialog'
          aria-modal='true'
          className='bg-white rounded-xl shadow-xl overflow-hidden w-[93.75rem] h-[56.25rem] max-w-[92vw] max-h-[85vh]'
          onClick={(e) => e.stopPropagation()}
          style={{
            width:
              'calc(93.75rem * min(1, calc(85vh / 56.25rem), calc((100vw - 4rem) / 93.75rem), calc(92vw / 93.75rem)))',
            height:
              'calc(56.25rem * min(1, calc(85vh / 56.25rem), calc((100vw - 4rem) / 93.75rem), calc(92vw / 93.75rem)))'
          }}
        >
          {/* Scaled content to always fit within 85vh without scroll */}
          <div
            className='w-[93.75rem] h-[56.25rem]'
            style={{
              transform:
                'scale(min(1, calc(85vh / 56.25rem), calc((100vw - 4rem) / 93.75rem), calc(92vw / 93.75rem)))',
              transformOrigin: 'top left'
            }}
          >
            {/* Content split: left navigation (320px) + right summary */}
            <div className='flex h-full'>
              {/* Left navigation */}
              <div className='w-[19rem] h-full shrink-0 border-r border-[var(--color-neutral-200)] box-border'>
                <ul className='h-auto'>
                  {items.map((it) => {
                    const selected = active === it.title
                    return (
                      <li key={it.title}>
                        <button
                          className={[
                            'w-full text-left px-6 pt-6 pb-4 cursor-pointer',
                            selected ? 'bg-[#E9FBF9]' : ''
                          ].join(' ')}
                          onClick={() => setActive(it.title)}
                        >
                          <p className='text-title-lg font-medium text-[var(--color-neutral-900)]'>
                            {it.title}
                          </p>
                          <p className='text-body-sm text-[var(--color-neutral-900)]'>
                            {it.body}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              {/* Right content: vertical scroll only; never horizontal */}
              <div className='w-[74.75rem] h-full overflow-y-auto overflow-x-hidden box-border'>
                {active === 'Resumen' && <ClientSummary onClose={onClose} />}
                {active === 'Historial clínico' && (
                  <ClinicalHistory onClose={onClose} />
                )}
                {active === 'Imágenes RX' && <RxImages onClose={onClose} />}
                {active === 'Presupuestos y pagos' && (
                  <BudgetsPayments onClose={onClose} />
                )}
                {active === 'Consentimientos' && <Consents onClose={onClose} />}
                {active !== 'Resumen' &&
                  active !== 'Historial clínico' &&
                  active !== 'Imágenes RX' &&
                  active !== 'Consentimientos' &&
                  active !== 'Presupuestos y pagos' && (
                    <div className='p-6 text-body-md text-[var(--color-neutral-900)]'>
                      {active}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
