'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import Portal from '@/components/ui/Portal'
import React, { useEffect, useRef, useState } from 'react'
import { MultiDatePickerInput } from '../MultiDatePickerInput'

type ParteDiarioModalProps = {
  isOpen: boolean
  onClose: () => void
  initialProfessional?: string
  initialDate?: Date
}

const PROFESSIONAL_OPTIONS = [
  'Dr. García López',
  'Dra. Martínez Silva',
  'Dr. Rodríguez Pérez',
  'Dra. Gómez',
  'Dr. Pérez'
]

function ComboBox({
  value,
  onChange,
  placeholder,
  widthRem = 19.1875
}: {
  value: string
  onChange: (val: string) => void
  placeholder: string
  widthRem?: number
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
    return undefined
  }, [open])

  const filtered = PROFESSIONAL_OPTIONS.filter((opt) =>
    inputValue ? opt.toLowerCase().includes(inputValue.toLowerCase()) : true
  )

  return (
    <div ref={ref} className='relative' style={{ maxWidth: `${widthRem}rem` }}>
      <div className='relative flex h-12 items-center rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-border-default)] px-3'>
        <input
          type='text'
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
          }}
          className='w-full bg-transparent pr-6 text-base text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
        />
        <button
          type='button'
          onClick={() => setOpen((s) => !s)}
          aria-label='Abrir selección'
          className='absolute right-2 flex items-center justify-center text-[var(--color-neutral-700)]'
        >
          <MD3Icon
            name='KeyboardArrowDownRounded'
            size='sm'
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {open && (
        <div className='absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-[0.5rem] border border-[var(--color-border-default)] bg-[rgba(248,250,251,0.95)] backdrop-blur-[2px] py-2 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]'>
          {filtered.length === 0 && (
            <div className='px-2 py-1 text-body-md text-[var(--color-neutral-500)]'>
              Sin resultados
            </div>
          )}
          {filtered.map((opt) => (
            <button
              key={opt}
              type='button'
              onClick={() => {
                onChange(opt)
                setInputValue(opt)
                setOpen(false)
              }}
              className='w-full px-2 py-1 text-left text-body-md font-medium text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-50)] transition-colors'
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ParteDiarioModal({
  isOpen,
  onClose,
  initialProfessional,
  initialDate
}: ParteDiarioModalProps) {
  const [selectedProfesional, setSelectedProfesional] = useState('')
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  // Pre-rellenar con los valores iniciales cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Pre-rellenar profesional si viene filtrado
      if (initialProfessional) {
        setSelectedProfesional(initialProfessional)
      }
      // Pre-rellenar fecha con el día seleccionado en la página
      if (initialDate) {
        setSelectedDates([initialDate])
      }
    }
  }, [isOpen, initialProfessional, initialDate])

  // Limpiar estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedProfesional('')
      setSelectedDates([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDownload = () => {
    // TODO: Implementar lógica de descarga
    console.log('Descargando parte diario...', {
      profesional: selectedProfesional,
      fechas: selectedDates
    })
  }

  return (
    <Portal>
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
                <ComboBox
                  value={selectedProfesional}
                  onChange={setSelectedProfesional}
                  placeholder='Seleccionar profesional'
                />
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
    </Portal>
  )
}

