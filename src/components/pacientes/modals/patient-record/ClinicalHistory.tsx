'use client'

import React from 'react'
import {
  AccountCircleRounded,
  AddRounded,
  CalendarMonthRounded,
  CloseRounded,
  DownloadRounded,
  EditRounded,
  ImageRounded,
  PlaceRounded
} from '@/components/icons/md3'
import SelectorCard from '@/components/pacientes/SelectorCard'

type ClinicalHistoryProps = {
  onClose?: () => void
}

export default function ClinicalHistory({ onClose }: ClinicalHistoryProps) {
  const [filter, setFilter] = React.useState<
    'proximas' | 'pasadas' | 'confirmadas' | 'inaxistencia'
  >('proximas')

  const [selectedCardId, setSelectedCardId] = React.useState<string>('c1')

  type Filter = 'proximas' | 'pasadas' | 'confirmadas' | 'inaxistencia'
  const orderedFilters: Filter[] = [
    'proximas',
    'pasadas',
    'confirmadas',
    'inaxistencia'
  ]
  const handleKeyDown = (current: Filter) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setFilter(current)
      return
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const idx = orderedFilters.indexOf(filter)
      const nextIdx =
        e.key === 'ArrowRight'
          ? (idx + 1) % orderedFilters.length
          : (idx - 1 + orderedFilters.length) % orderedFilters.length
      setFilter(orderedFilters[nextIdx])
    }
  }
  return (
    <div
      className='bg-neutral-50 relative w-full max-w-[74.75rem] h-full min-h-[56.25rem] overflow-hidden'
      data-node-id='426:934'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-6 top-[var(--spacing-gapmd)] right-[var(--spacing-plnav)] cursor-pointer'
        data-name='close'
        data-node-id='426:935'
      >
        <CloseRounded className='size-6 text-neutral-900' />
      </button>

      <div className='absolute left-[var(--spacing-plnav)] top-[10.25rem] flex items-center gap-[var(--spacing-gapmd)]'>
        <div
          role='tab'
          aria-selected={filter === 'proximas'}
          onClick={() => setFilter('proximas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'proximas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1016'
          tabIndex={0}
          onKeyDown={handleKeyDown('proximas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'proximas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Próximas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'pasadas'}
          onClick={() => setFilter('pasadas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'pasadas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1017'
          tabIndex={0}
          onKeyDown={handleKeyDown('pasadas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'pasadas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Pasadas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'confirmadas'}
          onClick={() => setFilter('confirmadas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'confirmadas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1019'
          tabIndex={0}
          onKeyDown={handleKeyDown('confirmadas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'confirmadas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Confirmadas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'inaxistencia'}
          onClick={() => setFilter('inaxistencia')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'inaxistencia' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1021'
          tabIndex={0}
          onKeyDown={handleKeyDown('inaxistencia')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'inaxistencia' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Inaxistencia
          </p>
        </div>
      </div>

      {/* Timeline cards left (selectable) */}
      {[
        { id: 'c1', top: '12.75rem' },
        { id: 'c2', top: '21.8125rem' }
      ].map((card) => (
        <div
          key={card.id}
          className='absolute top-[inherit] w-[19.625rem]'
          style={{ left: 'calc(6.25% + 10.25px)', top: card.top }}
        >
          <SelectorCard
            title='Limpieza dental'
            selected={selectedCardId === card.id}
            onClick={() => setSelectedCardId(card.id)}
            lines={[
              {
                icon: (
                  <CalendarMonthRounded className='size-6 text-neutral-700' />
                ),
                text: 'Jue 16 septiembre, 2025'
              },
              {
                icon: <PlaceRounded className='size-6 text-neutral-700' />,
                text: 'KlinkOS Ayora'
              }
            ]}
          />
        </div>
      ))}
      {/* MD3 Variant A: Vertical dividers with badge */}
      <div
        className='absolute h-[6.375rem] w-6 left-[2.8125rem] top-[12.75rem]'
        aria-hidden='true'
      >
        {/* Divider only between circles */}
        <div className='absolute left-1/2 -translate-x-1/2 top-6 bottom-0 w-[0.125rem] bg-brand-500' />
        {/* Badge dot */}
        <div className='absolute left-1/2 top-0 -translate-x-1/2 grid place-items-center size-6'>
          <div className='size-6 rounded-full bg-brand-500' />
        </div>
      </div>
      <div
        className='absolute h-[13.3125rem] w-6 left-[2.8125rem] top-[19.125rem]'
        aria-hidden='true'
      >
        {/* Divider only between circles */}
        <div className='absolute left-1/2 -translate-x-1/2 top-0 w-[0.125rem] bg-brand-500 h-[2.6875rem]' />
        {/* Badge dot */}
        <div className='absolute left-1/2 top-[2.6875rem] -translate-x-1/2 grid place-items-center size-6'>
          <div className='size-6 rounded-full bg-brand-500' />
        </div>
      </div>

      {/* Header */}
      <div
        className='absolute bg-neutral-50 content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start left-[var(--spacing-plnav)] top-[2.5rem] w-[35.5rem]'
        data-name='Header'
      >
        <div className='content-stretch flex gap-[var(--spacing-gapsm)] items-center relative shrink-0'>
          <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-900 text-title-lg text-nowrap whitespace-pre">
            Historial clínico
          </p>
        </div>
        <p className="font-['Inter:Regular',_sans-serif] min-w-full relative shrink-0 text-neutral-900 text-body-sm w-[min-content]">
          Filtra el historial clínico, consulta los detalles y sube imágenes y
          documentos.
        </p>
      </div>

      {/* Right details card - pin to right instead of fixed width */}
      <div
        className='absolute bg-white border border-neutral-200 border-solid rounded-[calc(var(--radius-xl)/2)]'
        style={{
          left: 'calc(31.25% + 4.078rem)',
          right: 'var(--spacing-plnav)',
          top: '10.25rem',
          bottom: 'var(--spacing-plnav)'
        }}
      >
        <div
          className='relative rounded-[inherit] overflow-y-auto px-0 py-fluid-md'
          style={{ height: '100%' }}
        >
          <p className="absolute font-['Inter:Medium',_sans-serif] left-plnav not-italic text-neutral-900 text-title-lg text-nowrap top-[1.5rem] whitespace-pre">
            Limpieza dental
          </p>
          <div
            className='absolute size-6'
            style={{ left: '42.3125rem', top: 'var(--spacing-gapmd)' }}
          >
            <EditRounded className='size-6 text-neutral-900' />
          </div>

          {/* Attachments */}
          <div className='absolute content-stretch flex flex-col gap-[var(--spacing-gapmd)] items-start left-plnav top-[36.75rem] w-[42.3125rem]'>
            <div className='content-stretch flex items-center justify-between relative shrink-0 w-full'>
              <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-neutral-900 text-body-md text-nowrap whitespace-pre">
                Archivos adjuntos
              </p>
              <div className='content-stretch flex gap-[0.25rem] items-center relative shrink-0'>
                <div className='relative shrink-0 size-6'>
                  <AddRounded className='size-6 text-brand-400' />
                </div>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-brand-400 text-body-sm text-nowrap whitespace-pre">
                  Subir documento
                </p>
              </div>
            </div>
            <div className='border border-neutral-300 border-solid box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[0.75rem] py-[var(--spacing-gapsm)] relative rounded-[calc(var(--radius-xl)/2)] shrink-0'>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm text-nowrap whitespace-pre">
                Copia póliza seguro
              </p>
              <div className='relative shrink-0 size-6'>
                <DownloadRounded className='size-6 text-neutral-700' />
              </div>
            </div>
          </div>

          {/* Odontograma */}
          <div className='absolute content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start left-plnav top-[43.75rem] w-[42.3125rem]'>
            <div className='content-stretch flex items-center justify-between relative shrink-0 w-full'>
              <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-neutral-900 text-body-md text-nowrap whitespace-pre">
                Odontograma
              </p>
              <div className='content-stretch flex gap-[0.25rem] items-center relative shrink-0'>
                <div className='relative shrink-0 size-6'>
                  <AddRounded className='size-6 text-brand-400' />
                </div>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-brand-400 text-body-sm text-nowrap whitespace-pre">
                  Subir odontograma
                </p>
              </div>
            </div>
            <div className='border border-neutral-400 border-solid h-[10.875rem] relative rounded-[calc(var(--radius-xl)/2)] shrink-0 w-[14.1875rem]'>
              <div className='h-[10.875rem] overflow-clip relative rounded-[inherit] w-[14.1875rem]'>
                <div className='absolute inset-0 grid place-items-center pointer-events-none'>
                  <ImageRounded className='text-neutral-400 size-12' />
                </div>
              </div>
            </div>
          </div>

          {/* SOAP sections */}
          <div className='absolute content-stretch flex flex-col gap-[1.5rem] items-start left-plnav top-[5rem] w-[42.3125rem]'>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Subjetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  ¿Por qué viene?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                Siente dolor 7/10 al frío en 2.6 desde hace 3 días
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Objetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  ¿Qué tiene?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                Caries oclusal profunda en 2.6; sensibilidad al frío positiva;
                RX: proximidad pulpar
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Evaluación
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  ¿Qué le hacemos?
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                Pulpitis reversible 2.6. Dx diferencial: hipersensibilidad
                dentinaria.
              </p>
            </div>
            <div className='content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start relative shrink-0 w-full'>
              <div className='content-stretch flex flex-col items-start relative shrink-0 w-full'>
                <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
                  Plan
                </p>
                <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-[#aeb8c2] text-label-sm w-full">
                  Tratamiento a seguir
                </p>
              </div>
              <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-700 text-body-sm w-full">
                Operatoria en 2.6 hoy; barniz desensibilizante; ibuprofeno PRN;
                control en 2 semanas; higiene en 6 meses (recall).
              </p>
            </div>
          </div>

          {/* Attended by */}
          <div className='absolute content-stretch flex flex-col gap-[var(--spacing-gapmd)] items-start left-[var(--spacing-plnav)] top-[29.75rem] w-[21.0625rem]'>
            <p className="font-['Inter:Medium',_sans-serif] relative shrink-0 text-[#24282c] text-body-md w-full">
              Atendido Por:
            </p>
            <div className='content-stretch flex gap-[2.0625rem] items-center relative shrink-0 w-full'>
              <div className='content-stretch flex gap-[0.75rem] items-center relative shrink-0 w-[9.5rem]'>
                <div className='relative rounded-full shrink-0 size-9'>
                  <div
                    aria-hidden='true'
                    className='absolute inset-0 pointer-events-none rounded-full'
                  >
                    <div className='absolute bg-white inset-0 rounded-full' />
                    <div className='absolute inset-0 overflow-hidden rounded-full'>
                      <div className='absolute inset-0 grid place-items-center'>
                        <AccountCircleRounded className='text-neutral-400 size-6' />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[0.25rem] items-start relative shrink-0 w-[6rem]">
                  <p className='relative shrink-0 text-[#24282c] text-body-sm w-full'>
                    Daniel Soriano
                  </p>
                  <p className='relative shrink-0 text-[#cbd3d9] text-label-sm w-full'>
                    Higienista
                  </p>
                </div>
              </div>
              <div className='content-stretch flex gap-[0.75rem] items-center relative shrink-0 w-[9.5rem]'>
                <div className='relative rounded-full shrink-0 size-9'>
                  <div
                    aria-hidden='true'
                    className='absolute inset-0 pointer-events-none rounded-full'
                  >
                    <div className='absolute bg-white inset-0 rounded-full' />
                    <div className='absolute inset-0 overflow-hidden rounded-full'>
                      <div className='absolute inset-0 grid place-items-center'>
                        <AccountCircleRounded className='text-neutral-400 size-6' />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="basis-0 content-stretch flex flex-col font-['Inter:Regular',_sans-serif] font-normal gap-[0.25rem] grow items-start min-h-px min-w-px relative shrink-0">
                  <p className='relative shrink-0 text-[#24282c] text-body-sm w-full'>
                    Carlos Ramirez
                  </p>
                  <p className='relative shrink-0 text-[#cbd3d9] text-label-sm w-full'>
                    Odontólogo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


