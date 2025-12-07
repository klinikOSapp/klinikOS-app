'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import { useState } from 'react'
import { MultiDatePickerInput } from '../MultiDatePickerInput'

type ParteDiarioModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ParteDiarioModal({
  isOpen,
  onClose
}: ParteDiarioModalProps) {
  const [selectedProfesional, setSelectedProfesional] = useState('')
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  if (!isOpen) return null

  const handleDownload = () => {
    // TODO: Implementar lógica de descarga
    console.log('Descargando parte diario...', {
      profesional: selectedProfesional,
      fechas: selectedDates
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 bg-black/30'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center pointer-events-none'>
        <div
          className='pointer-events-auto flex h-full flex-col overflow-hidden rounded-lg bg-[var(--color-neutral-50)]'
          style={{
            width: 'min(37.625rem, 92vw)',
            height: 'min(26.25rem, 85vh)'
          }}
          role='dialog'
          aria-modal='true'
          aria-labelledby='parte-diario-title'
        >
          {/* Header */}
          <div
            className='flex items-center justify-between border-b border-[var(--color-border-default)] px-8'
            style={{ height: '3.5rem' }}
          >
            <h2
              id='parte-diario-title'
              className='text-title-md font-medium text-[var(--color-neutral-900)]'
            >
              Enviar parte diario
            </h2>
            <button
              type='button'
              onClick={onClose}
              className='flex items-center justify-center transition-colors hover:bg-[var(--color-neutral-100)] rounded'
              style={{ width: '1.5rem', height: '1.5rem' }}
              aria-label='Cerrar modal'
            >
              <MD3Icon
                name='CloseRounded'
                size={0.875}
                className='text-[var(--color-neutral-600)]'
              />
            </button>
          </div>

          {/* Content */}
          <div className='flex-1 px-8 pt-12'>
            {/* Profesional Field */}
            <div className='flex items-start gap-6 mb-16'>
              <label
                htmlFor='profesional-select'
                className='text-base font-normal text-[var(--color-neutral-900)]'
                style={{ width: '7.375rem', paddingTop: '0.75rem' }}
              >
                Profesional
              </label>
              <div className='flex-1' style={{ maxWidth: '19.1875rem' }}>
                <div className='relative'>
                  <select
                    id='profesional-select'
                    value={selectedProfesional}
                    onChange={(e) => setSelectedProfesional(e.target.value)}
                    className='w-full h-12 px-3 pr-10 text-base bg-[var(--color-neutral-50)] border border-[var(--color-border-default)] rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] transition-colors'
                    style={{
                      color: selectedProfesional
                        ? 'var(--color-neutral-900)'
                        : 'var(--color-neutral-400)'
                    }}
                  >
                    <option value='' disabled>
                      Seleccionar profesional
                    </option>
                    <option value='profesional1'>Dr. García López</option>
                    <option value='profesional2'>Dra. Martínez Silva</option>
                    <option value='profesional3'>Dr. Rodríguez Pérez</option>
                  </select>
                  <MD3Icon
                    name='KeyboardArrowDownRounded'
                    size='sm'
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)] pointer-events-none'
                  />
                </div>
              </div>
            </div>

            {/* Fecha del parte Field */}
            <div className='flex items-start gap-6'>
              <label
                htmlFor='periodo-input'
                className='text-base font-normal text-[var(--color-neutral-900)]'
                style={{ width: '7.375rem', paddingTop: '0.75rem' }}
              >
                Fecha del parte
              </label>
              <div style={{ width: '19.1875rem' }}>
                <p className='text-sm font-normal text-[var(--color-neutral-900)] mb-2'>
                  Periodo
                </p>
                <MultiDatePickerInput
                  value={selectedDates}
                  onChange={setSelectedDates}
                  placeholder='Seleccionar fechas'
                />
              </div>
            </div>
          </div>

          {/* Footer with Download Button */}
          <div className='flex justify-end px-8 pb-[2.6875rem]'>
            <button
              type='button'
              onClick={handleDownload}
              disabled={!selectedProfesional || selectedDates.length === 0}
              className='h-10 w-[7.4375rem] rounded-full border border-[var(--color-border-default)] bg-[var(--color-brand-500)] px-4 text-base font-medium text-[var(--color-brand-900)] transition-all duration-150 hover:bg-[var(--color-brand-600)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--color-brand-500)]'
            >
              Descargar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

