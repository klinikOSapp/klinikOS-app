'use client'

import CloseRounded from '@mui/icons-material/CloseRounded'
import React from 'react'
import ClinicalHistory from './ClinicalHistory'

type PatientFileModalProps = {
  open: boolean
  onClose: () => void
}

type TabKey = 'summary' | 'history' | 'rx' | 'billing' | 'consents'

export default function PatientFileModal({ open, onClose }: PatientFileModalProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>('history')

  if (!open) return null

  const NavItem = ({
    title,
    subtitle,
    tab
  }: {
    title: string
    subtitle: string
    tab: TabKey
  }) => {
    const isActive = activeTab === tab
    return (
      <button
        type='button'
        onClick={() => setActiveTab(tab)}
        className={[
          'w-full text-left rounded-lg px-6 py-4 transition-colors',
          isActive ? 'bg-[#E9FBF9]' : 'hover:bg-[var(--color-neutral-50)]'
        ].join(' ')}
      >
        <p className="font-['Inter:Medium',_sans-serif] text-[24px] leading-[32px] text-[var(--color-neutral-900)]">
          {title}
        </p>
        <p className="font-['Inter:Regular',_sans-serif] text-[14px] leading-[20px] text-[var(--color-neutral-900)]">
          {subtitle}
        </p>
      </button>
    )
  }

  const RightPaneContent = () => {
    switch (activeTab) {
      case 'history':
        return (
          <div className='w-full h-full overflow-auto'>
            {/* Reutilizamos el diseño del historial clínico dentro del panel derecho */}
            <ClinicalHistory onClose={onClose} />
          </div>
        )
      case 'summary':
        return (
          <div className='p-8'>
            <h2 className='text-title-lg text-[var(--color-neutral-900)] mb-2'>Resumen</h2>
            <p className='text-body-sm text-[var(--color-neutral-700)]'>Datos básicos de consulta, alertas, próximas citas, deuda, …</p>
          </div>
        )
      case 'rx':
        return (
          <div className='p-8'>
            <h2 className='text-title-lg text-[var(--color-neutral-900)] mb-2'>Imágenes RX</h2>
            <p className='text-body-sm text-[var(--color-neutral-700)]'>Capturas intraorales/fotos antes-después y escáner 3D.</p>
          </div>
        )
      case 'billing':
        return (
          <div className='p-8'>
            <h2 className='text-title-lg text-[var(--color-neutral-900)] mb-2'>Presupuestos y pagos</h2>
            <p className='text-body-sm text-[var(--color-neutral-700)]'>Cobros, financiación embebida, facturas/recibos y conciliación.</p>
          </div>
        )
      case 'consents':
        return (
          <div className='p-8'>
            <h2 className='text-title-lg text-[var(--color-neutral-900)] mb-2'>Consentimientos</h2>
            <p className='text-body-sm text-[var(--color-neutral-700)]'>Accede a todos los consentimientos de los pacientes.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className='fixed inset-0 z-50 bg-black/30' onClick={onClose} aria-hidden>
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
          <div
            className='w-[82rem] h-[60rem] max-w-[95vw] max-h-[90vh] relative bg-[var(--color-surface-modal,#fff)] rounded-[1rem] overflow-hidden flex'
            style={{
              width: 'min(82rem, calc(82rem * (90vh / 60rem)))',
              height: 'min(60rem, 90vh)'
            }}
          >
            {/* Header */}
            <div className='absolute top-0 left-0 right-0 h-14 border-b border-[var(--color-neutral-300)] flex items-center justify-between px-6'>
              <div className='text-title-lg text-[var(--color-neutral-900)]'>Ficha del paciente</div>
              <button type='button' aria-label='Cerrar' onClick={onClose} className='w-3.5 h-3.5'>
                <CloseRounded className='block w-3.5 h-3.5' />
              </button>
            </div>

            {/* Body layout */}
            <div className='pt-14 w-full h-full flex'>
              {/* Left navigation (304px) */}
              <nav className='w-[304px] shrink-0 h-full border-r border-[var(--color-neutral-300)] p-4 overflow-auto'>
                <NavItem
                  title='Resumen'
                  subtitle='Datos básicos de consulta, alertas, próximas citas, deuda, …'
                  tab='summary'
                />
                <NavItem
                  title='Historial clínico'
                  subtitle='Notas SOAP, odontograma, actos y adjuntos.'
                  tab='history'
                />
                <NavItem
                  title='Imágenes RX'
                  subtitle='capturas intraorales/fotos antes-después y escáner 3D.'
                  tab='rx'
                />
                <NavItem
                  title='Presupuestos y pagos'
                  subtitle='Cobros, financiación embebida, facturas/recibos y conciliación.'
                  tab='billing'
                />
                <NavItem
                  title='Consentimientos'
                  subtitle='Accede a todos los consentimientos de los pacientes.'
                  tab='consents'
                />
              </nav>

              {/* Right content */}
              <section className='flex-1 h-full overflow-hidden bg-[var(--color-neutral-50)]'>
                <RightPaneContent />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


