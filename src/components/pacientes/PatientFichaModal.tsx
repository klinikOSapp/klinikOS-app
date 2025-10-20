'use client'

import React from 'react'
import ClientSummary from './ClientSummary'
import ClinicalHistory from './ClinicalHistory'
import RxImages from './RxImages'

type PatientFichaModalProps = {
  open: boolean
  onClose: () => void
}

export default function PatientFichaModal({
  open,
  onClose
}: PatientFichaModalProps) {
  const [active, setActive] = React.useState<
    | 'Resumen'
    | 'Historial clínico'
    | 'Imágenes & RX'
    | 'Consentimientos'
    | 'Presupuestos'
  >('Resumen')

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
      title: 'Imágenes & RX',
      body: 'capturas intraorales/fotos antes-después y escáner 3D.'
    },
    {
      title: 'Consentimientos',
      body: 'log legal, toda acción con usuario, fecha/hora y contexto, para auditorías.'
    },
    {
      title: 'Presupuestos',
      body: 'Presupuestos pendientes, abonados, archivados, etc.'
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
            width: 'min(93.75rem, calc(93.75rem * (85vh / 56.25rem)))',
            height: 'min(56.25rem, calc(56.25rem * (85vh / 56.25rem)))'
          }}
        >
          {/* Scaled content to always fit within 85vh without scroll */}
          <div
            className='w-[93.75rem] h-[56.25rem]'
            style={{
              transform: 'scale(min(1, calc(85vh / 56.25rem)))',
              transformOrigin: 'top left'
            }}
          >
            {/* Content split: left navigation (320px) + right summary */}
            <div className='flex h-full'>
              {/* Left navigation */}
              <div className='w-[19rem] h-full shrink-0 border-r border-[var(--color-neutral-200)]'>
                <ul className='h-auto'>
                  {items.map((it) => {
                    const selected = active === it.title
                    return (
                      <li key={it.title}>
                        <button
                          className={[
                            'w-full text-left px-6 pt-6 pb-4',
                            selected ? 'bg-[#E9FBF9]' : ''
                          ].join(' ')}
                          onClick={() => setActive(it.title)}
                        >
                          <p className='text-xl leading-8 font-medium text-[var(--color-neutral-900)]'>
                            {it.title}
                          </p>
                          <p className='text-sm leading-5 text-[var(--color-neutral-900)]'>
                            {it.body}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              {/* Right content has fixed base width matching design */}
              <div className='w-[74.75rem] h-full overflow-hidden'>
                {active === 'Resumen' && <ClientSummary onClose={onClose} />}
                {active === 'Historial clínico' && (
                  <ClinicalHistory onClose={onClose} />
                )}
                {active === 'Imágenes & RX' && <RxImages onClose={onClose} />}
                {active !== 'Resumen' &&
                  active !== 'Historial clínico' &&
                  active !== 'Imágenes & RX' && (
                    <div className='p-6 text-base text-[var(--color-neutral-900)]'>
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
