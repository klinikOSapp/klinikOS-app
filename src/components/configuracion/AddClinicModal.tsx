'use client'

import React from 'react'
import { AddRounded, CloseRounded } from '@/components/icons/md3'

export type ClinicFormData = {
  nombre: string
  direccion: string
  horarioApertura: string
  horarioCierre: string
  telefono: string
  email: string
  logoUrl?: string
}

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
  helperText?: string
  className?: string
  placeholder?: string
}

function Field({
  label,
  value,
  onChange,
  required,
  helperText,
  className,
  placeholder
}: FieldProps) {
  return (
    <div className={['flex flex-col gap-[0.5rem] w-full', className].filter(Boolean).join(' ')}>
      <div className='flex items-center justify-between'>
        <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>{label}</p>
        {required ? (
          <span className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]' aria-hidden>
            *
          </span>
        ) : null}
      </div>
      <div className='flex flex-col gap-[0.25rem] w-full'>
        <div className='flex h-[3rem] items-center justify-between rounded-[0.5rem] border-[0.03125rem] border-neutral-300 bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] focus-within:border-[var(--color-brand-500)] focus-within:ring-1 focus-within:ring-[var(--color-brand-500)] transition-colors'>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900'
          />
        </div>
        {helperText ? (
          <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>{helperText}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function AddClinicModal({
  open,
  onClose,
  onSubmit,
  title = 'Añadir nueva clínica',
  submitLabel = 'Crear sucursal',
  initialData,
  mode = 'create'
}: AddClinicModalProps) {
  const [form, setForm] = React.useState<ClinicFormData>({
    nombre: initialData?.nombre ?? '',
    direccion: initialData?.direccion ?? '',
    horarioApertura: initialData?.horarioApertura ?? '',
    horarioCierre: initialData?.horarioCierre ?? '',
    telefono: initialData?.telefono ?? '',
    email: initialData?.email ?? '',
    logoUrl: initialData?.logoUrl
  })

  React.useEffect(() => {
    if (!open) return
    setForm({
      nombre: initialData?.nombre ?? '',
      direccion: initialData?.direccion ?? '',
      horarioApertura: initialData?.horarioApertura ?? '',
      horarioCierre: initialData?.horarioCierre ?? '',
      telefono: initialData?.telefono ?? '',
      email: initialData?.email ?? '',
      logoUrl: initialData?.logoUrl
    })
  }, [initialData, open])

  if (!open) return null

  const updateField = (field: keyof ClinicFormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-8'
      onClick={onClose}
      role='presentation'
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className='relative w-[min(53rem,95vw)] max-h-[90vh] overflow-hidden rounded-[0.5rem] bg-[var(--color-surface-modal,#fff)] shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        <header className='flex h-[3.5rem] items-center justify-between border-b border-[var(--color-neutral-300)] px-[2rem]'>
          <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
            {mode === 'edit' ? 'Editar sucursal' : title}
          </p>
          <button
            type='button'
            onClick={onClose}
            aria-label='Cerrar'
            className='size-[0.875rem] text-neutral-900'
          >
            <CloseRounded />
          </button>
        </header>

        <form onSubmit={handleSubmit} className='max-h-[calc(90vh-3.5rem)] overflow-y-auto'>
          <div className='mx-auto flex w-[min(49rem,calc(100%-2rem))] flex-col gap-[2rem] px-[2rem] py-[2rem]'>
            <section className='flex flex-col gap-[0.5rem]'>
              <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>Logo</p>
              <div className='flex flex-wrap items-center gap-[1.5rem]'>
                <div className='relative size-[6.5625rem] overflow-hidden rounded-[0.5rem] bg-neutral-600'>
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt='Logo de la clínica'
                      className='size-full object-cover'
                    />
                  ) : null}
                </div>
                <div className='flex flex-wrap gap-[0.5rem]'>
                  <button
                    type='button'
                    className='flex h-[2.5rem] items-center gap-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-neutral-50)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-neutral-900'
                  >
                    <AddRounded className='text-neutral-900' />
                    Editar logo
                  </button>
                  <button
                    type='button'
                    className='flex h-[2.5rem] items-center gap-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-neutral-50)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-neutral-900'
                  >
                    <AddRounded className='text-neutral-900' />
                    Eliminar logo
                  </button>
                </div>
              </div>
            </section>

            <section className='flex flex-col gap-[1.5rem]'>
              <Field
                label='Nombre sucursal'
                required
                value={form.nombre}
                onChange={updateField('nombre')}
              />

              <Field
                label='Dirección completa'
                required
                value={form.direccion}
                onChange={updateField('direccion')}
              />

              <div className='flex flex-wrap gap-[1.5rem]'>
                <Field
                  label='Horario apertura'
                  required
                  value={form.horarioApertura}
                  onChange={updateField('horarioApertura')}
                  className='w-[min(23.75rem,100%)]'
                />
                <Field
                  label='Horario cierre'
                  required
                  value={form.horarioCierre}
                  onChange={updateField('horarioCierre')}
                  className='w-[min(23.75rem,100%)]'
                />
              </div>

              <div className='flex flex-wrap items-end gap-[1.5rem]'>
                <Field
                  label='Teléfono'
                  required
                  value={form.telefono}
                  onChange={updateField('telefono')}
                  className='w-[min(23.75rem,100%)]'
                />
                <button
                  type='button'
                  className='flex h-[2.5rem] items-center gap-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-neutral-50)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-neutral-900'
                >
                  <AddRounded className='text-neutral-900' />
                  Añadir teléfono
                </button>
              </div>

              <div className='flex flex-wrap items-end gap-[1.5rem]'>
                <Field
                  label='Email'
                  required
                  value={form.email}
                  onChange={updateField('email')}
                  className='w-[min(23.75rem,100%)]'
                />
                <button
                  type='button'
                  className='flex h-[2.5rem] items-center gap-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-neutral-50)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-neutral-900'
                >
                  <AddRounded className='text-neutral-900' />
                  Añadir email
                </button>
              </div>
            </section>

            <div className='flex justify-end'>
              <button
                type='submit'
                className='flex h-[2.5rem] w-[min(10.25rem,100%)] items-center justify-center rounded-[8.5rem] bg-[var(--color-brand-500)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

