'use client'

import { AddRounded, CloseRounded } from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import React, { useCallback, useEffect, useRef } from 'react'

export type ClinicFormData = {
  nombreComercial: string
  razonSocial: string
  cifNif: string
  direccion: string
  poblacion: string
  codigoPostal: string
  diasSemana: string[]
  horarioApertura: string
  horarioCierre: string
  telefonos: string[]
  emails: string[]
}

const DIAS_SEMANA = [
  { key: 'L', label: 'Lunes' },
  { key: 'M', label: 'Martes' },
  { key: 'X', label: 'Miércoles' },
  { key: 'J', label: 'Jueves' },
  { key: 'V', label: 'Viernes' },
  { key: 'S', label: 'Sábado' },
  { key: 'D', label: 'Domingo' }
]

type AddClinicModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: ClinicFormData) => void
  title?: string
  submitLabel?: string
  initialData?: Partial<ClinicFormData>
  mode?: 'create' | 'edit'
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  fullWidth?: boolean
  placeholder?: string
  hasDropdown?: boolean
}

function Field({
  label,
  value,
  onChange,
  required = true,
  fullWidth = false,
  placeholder,
  hasDropdown = false
}: FieldProps) {
  return (
    <div
      className={`flex flex-col gap-2 ${
        fullWidth ? 'w-full' : 'w-full md:w-[min(23.75rem,calc(50%-0.75rem))]'
      }`}
    >
      <p className='font-inter text-sm leading-5 text-neutral-900'>{label}</p>
      <div className='flex h-12 items-center justify-between rounded-lg border-[0.5px] border-neutral-300 bg-neutral-50 pl-2.5 pr-2 py-2'>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className='flex-1 bg-transparent outline-none font-inter text-base leading-6 text-neutral-900'
        />
        <div className='flex items-center gap-2'>
          {hasDropdown && (
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='text-neutral-600'
            >
              <path d='M7 10L12 15L17 10H7Z' fill='currentColor' />
            </svg>
          )}
          {required && (
            <span
              className='text-[var(--color-error-600)] text-xs font-medium'
              aria-hidden='true'
            >
              *
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AddClinicModal({
  open,
  onClose,
  onSubmit,
  title = 'Nueva clínica',
  submitLabel = 'Crear clínica',
  initialData,
  mode = 'create'
}: AddClinicModalProps) {
  const [form, setForm] = React.useState<ClinicFormData>({
    nombreComercial: initialData?.nombreComercial ?? '',
    razonSocial: initialData?.razonSocial ?? '',
    cifNif: initialData?.cifNif ?? '',
    direccion: initialData?.direccion ?? '',
    poblacion: initialData?.poblacion ?? '',
    codigoPostal: initialData?.codigoPostal ?? '',
    diasSemana: initialData?.diasSemana ?? ['L', 'M', 'X', 'J', 'V'],
    horarioApertura: initialData?.horarioApertura ?? '',
    horarioCierre: initialData?.horarioCierre ?? '',
    telefonos: initialData?.telefonos ?? [''],
    emails: initialData?.emails ?? ['']
  })

  React.useEffect(() => {
    if (!open) return
    setForm({
      nombreComercial: initialData?.nombreComercial ?? '',
      razonSocial: initialData?.razonSocial ?? '',
      cifNif: initialData?.cifNif ?? '',
      direccion: initialData?.direccion ?? '',
      poblacion: initialData?.poblacion ?? '',
      codigoPostal: initialData?.codigoPostal ?? '',
      diasSemana: initialData?.diasSemana ?? ['L', 'M', 'X', 'J', 'V'],
      horarioApertura: initialData?.horarioApertura ?? '',
      horarioCierre: initialData?.horarioCierre ?? '',
      telefonos: initialData?.telefonos ?? [''],
      emails: initialData?.emails ?? ['']
    })
  }, [initialData, open])

  const toggleDia = (dia: string) => {
    setForm((prev) => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter((d) => d !== dia)
        : [...prev.diasSemana, dia]
    }))
  }

  const addTelefono = () => {
    setForm((prev) => ({
      ...prev,
      telefonos: [...prev.telefonos, '']
    }))
  }

  const updateTelefono = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      telefonos: prev.telefonos.map((t, i) => (i === index ? value : t))
    }))
  }

  const removeTelefono = (index: number) => {
    if (form.telefonos.length <= 1) return
    setForm((prev) => ({
      ...prev,
      telefonos: prev.telefonos.filter((_, i) => i !== index)
    }))
  }

  const addEmail = () => {
    setForm((prev) => ({
      ...prev,
      emails: [...prev.emails, '']
    }))
  }

  const updateEmail = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      emails: prev.emails.map((e, i) => (i === index ? value : e))
    }))
  }

  const removeEmail = (index: number) => {
    if (form.emails.length <= 1) return
    setForm((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index)
    }))
  }

  const modalRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the modal when opened
      modalRef.current?.focus()
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  const updateField = (field: keyof ClinicFormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(form)
  }

  if (!open) return null

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-8'
        onClick={onClose}
        aria-hidden='true'
      >
        <div
          ref={modalRef}
          role='dialog'
          aria-modal='true'
          aria-labelledby='clinic-modal-title'
          tabIndex={-1}
          className='relative w-[min(53rem,95vw)] max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl outline-none'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Figma: h-56px, px-32px, border-bottom */}
          <header className='flex h-14 items-center justify-between border-b border-neutral-300 px-8'>
            <h2
              id='clinic-modal-title'
              className='font-inter text-lg leading-7 font-medium text-neutral-900'
            >
              {mode === 'edit' ? 'Editar clínica' : title}
            </h2>
            <button
              type='button'
              onClick={onClose}
              aria-label='Cerrar modal'
              className='size-6 text-neutral-900 hover:text-neutral-600 transition-colors rounded-full hover:bg-neutral-100 p-0.5'
            >
              <CloseRounded className='size-5' />
            </button>
          </header>

          {/* Content - Figma: left-32px, top-88px, w-784px, gap-40px */}
          <form
            onSubmit={handleSubmit}
            className='max-h-[calc(90vh-3.5rem)] overflow-y-auto'
          >
            <div className='flex flex-col gap-10 px-8 py-8'>
              {/* Section Title */}
              <div className='flex flex-col gap-4'>
                <p className='font-inter text-lg leading-7 font-medium text-neutral-900'>
                  Introduce los datos de la nueva clínica
                </p>

                {/* Form Fields - gap-24px between rows */}
                <div className='flex flex-col gap-6'>
                  {/* Nombre comercial - full width */}
                  <Field
                    label='Nombre comercial'
                    value={form.nombreComercial}
                    onChange={updateField('nombreComercial')}
                    fullWidth
                  />

                  {/* Razón social + CIF/NIF - 2 columns */}
                  <div className='flex flex-wrap gap-6'>
                    <Field
                      label='Razón social'
                      value={form.razonSocial}
                      onChange={updateField('razonSocial')}
                    />
                    <Field
                      label='CIF/NIF'
                      value={form.cifNif}
                      onChange={updateField('cifNif')}
                    />
                  </div>

                  {/* Dirección completa - full width */}
                  <Field
                    label='Dirección completa'
                    value={form.direccion}
                    onChange={updateField('direccion')}
                    fullWidth
                  />

                  {/* Población + Código Postal - 2 columns with dropdown */}
                  <div className='flex flex-wrap gap-6'>
                    <Field
                      label='Población'
                      value={form.poblacion}
                      onChange={updateField('poblacion')}
                      hasDropdown
                    />
                    <Field
                      label='Código Postal'
                      value={form.codigoPostal}
                      onChange={updateField('codigoPostal')}
                      hasDropdown
                    />
                  </div>

                  {/* Días de la semana */}
                  <div className='flex flex-col gap-2'>
                    <p className='font-inter text-sm leading-5 text-neutral-900'>
                      Días de apertura
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {DIAS_SEMANA.map((dia) => {
                        const isSelected = form.diasSemana.includes(dia.key)
                        return (
                          <button
                            key={dia.key}
                            type='button'
                            onClick={() => toggleDia(dia.key)}
                            aria-label={`${isSelected ? 'Quitar' : 'Añadir'} ${
                              dia.label
                            }`}
                            aria-pressed={isSelected}
                            className={`flex items-center justify-center size-10 rounded-full border text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-[var(--color-brand-500)] border-[var(--color-brand-500)] text-[var(--color-brand-900)]'
                                : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            {dia.key}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Horario apertura + Horario cierre - 2 columns */}
                  <div className='flex flex-wrap gap-6'>
                    <Field
                      label='Horario apertura'
                      value={form.horarioApertura}
                      onChange={updateField('horarioApertura')}
                      placeholder='08:00'
                    />
                    <Field
                      label='Horario cierre'
                      value={form.horarioCierre}
                      onChange={updateField('horarioCierre')}
                      placeholder='20:00'
                    />
                  </div>

                  {/* Teléfonos */}
                  <div className='flex flex-col gap-3'>
                    <p
                      id='telefonos-label'
                      className='font-inter text-sm leading-5 text-neutral-900'
                    >
                      Teléfono
                    </p>
                    {form.telefonos.map((tel, index) => (
                      <div
                        key={index}
                        className='flex flex-wrap items-center gap-3'
                      >
                        <div className='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]'>
                          <div className='flex h-12 items-center justify-between rounded-lg border-[0.5px] border-neutral-300 bg-neutral-50 pl-2.5 pr-2 py-2'>
                            <input
                              value={tel}
                              onChange={(e) =>
                                updateTelefono(index, e.target.value)
                              }
                              placeholder='Ej: 612 345 678'
                              aria-label={`Teléfono ${index + 1}`}
                              type='tel'
                              className='flex-1 bg-transparent outline-none font-inter text-base leading-6 text-neutral-900'
                            />
                            <span
                              className='text-[var(--color-error-600)] text-xs font-medium'
                              aria-hidden='true'
                            >
                              *
                            </span>
                          </div>
                        </div>
                        {form.telefonos.length > 1 && (
                          <button
                            type='button'
                            onClick={() => removeTelefono(index)}
                            aria-label='Eliminar teléfono'
                            className='flex items-center justify-center size-10 rounded-full border border-neutral-300 bg-neutral-50 text-neutral-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors'
                          >
                            <CloseRounded className='size-5' />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={addTelefono}
                      className='flex h-10 items-center gap-2 rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2 text-base leading-6 font-medium text-neutral-900 hover:bg-neutral-100 transition-colors self-start'
                    >
                      <AddRounded className='text-neutral-900 size-6' />
                      Añadir teléfono
                    </button>
                  </div>

                  {/* Emails */}
                  <div className='flex flex-col gap-3'>
                    <p
                      id='emails-label'
                      className='font-inter text-sm leading-5 text-neutral-900'
                    >
                      Email
                    </p>
                    {form.emails.map((email, index) => (
                      <div
                        key={index}
                        className='flex flex-wrap items-center gap-3'
                      >
                        <div className='w-full md:w-[min(23.75rem,calc(50%-0.75rem))]'>
                          <div className='flex h-12 items-center justify-between rounded-lg border-[0.5px] border-neutral-300 bg-neutral-50 pl-2.5 pr-2 py-2'>
                            <input
                              value={email}
                              onChange={(e) =>
                                updateEmail(index, e.target.value)
                              }
                              placeholder='Ej: contacto@clinica.es'
                              type='email'
                              aria-label={`Email ${index + 1}`}
                              className='flex-1 bg-transparent outline-none font-inter text-base leading-6 text-neutral-900'
                            />
                            <span
                              className='text-[var(--color-error-600)] text-xs font-medium'
                              aria-hidden='true'
                            >
                              *
                            </span>
                          </div>
                        </div>
                        {form.emails.length > 1 && (
                          <button
                            type='button'
                            onClick={() => removeEmail(index)}
                            aria-label='Eliminar email'
                            className='flex items-center justify-center size-10 rounded-full border border-neutral-300 bg-neutral-50 text-neutral-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors'
                          >
                            <CloseRounded className='size-5' />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type='button'
                      onClick={addEmail}
                      className='flex h-10 items-center gap-2 rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2 text-base leading-6 font-medium text-neutral-900 hover:bg-neutral-100 transition-colors self-start'
                    >
                      <AddRounded className='text-neutral-900 size-6' />
                      Añadir email
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button - Figma: w-195px, bg-brand-500, rounded-136px */}
              <div className='flex justify-end'>
                <button
                  type='submit'
                  className='flex h-10 w-[min(12.2rem,100%)] items-center justify-center rounded-full bg-[var(--color-brand-500)] px-4 py-2 text-base leading-6 font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
                >
                  {submitLabel}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
