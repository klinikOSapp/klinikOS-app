'use client'

import React from 'react'
import {
  AddRounded,
  CloseRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'

export type ProfessionalFormData = {
  nombre: string
  telefono: string
  email: string
  especialidad: string
  color: 'morado' | 'naranja' | 'verde'
  estado: 'Activo' | 'Inactivo'
  comision?: string
  fotoUrl?: string
}

type AddProfessionalModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: ProfessionalFormData) => void
  title?: string
  submitLabel?: string
  initialData?: Partial<ProfessionalFormData>
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

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  helperText,
  className
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  required?: boolean
  helperText?: string
  className?: string
}) {
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
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900 appearance-none'
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className='flex items-center justify-center text-neutral-600'>
            <KeyboardArrowDownRounded />
          </span>
        </div>
        {helperText ? (
          <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>{helperText}</p>
        ) : null}
      </div>
    </div>
  )
}

const inicialForm: ProfessionalFormData = {
  nombre: '',
  telefono: '',
  email: '',
  especialidad: 'Odontólogo',
  color: 'verde',
  estado: 'Activo',
  comision: '',
  fotoUrl: undefined
}

export default function AddProfessionalModal({
  open,
  onClose,
  onSubmit,
  title = 'Nuevo profesional',
  submitLabel = 'Añadir profesional',
  initialData
}: AddProfessionalModalProps) {
  const [form, setForm] = React.useState<ProfessionalFormData>({
    ...inicialForm,
    ...initialData
  })

  React.useEffect(() => {
    if (!open) return
    setForm({ ...inicialForm, ...initialData })
  }, [initialData, open])

  if (!open) return null

  const updateField = (field: keyof ProfessionalFormData) => (value: string) =>
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
          <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>{title}</p>
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
          <div className='mx-auto flex w-[min(49rem,calc(100%-2rem))] flex-col gap-[2.5rem] px-[2rem] py-[2.5rem]'>
            <section className='flex flex-col gap-[1rem]'>
              <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                Introduce los datos del nuevo especialista
              </p>
              <div className='flex flex-col gap-[0.5rem]'>
                <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>Foto del profesional</p>
                <div className='flex flex-wrap items-center gap-[1.5rem]'>
                  <div className='relative size-[6.5625rem] overflow-hidden rounded-[0.5rem] bg-neutral-200'>
                    {form.fotoUrl ? (
                      <img src={form.fotoUrl} alt='Foto del profesional' className='size-full object-cover' />
                    ) : null}
                  </div>
                  <button
                    type='button'
                    className='flex h-[2.5rem] items-center gap-[0.5rem] rounded-[8.5rem] border border-neutral-300 bg-[var(--color-neutral-50)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-neutral-900'
                  >
                    <AddRounded className='text-neutral-900' />
                    Añadir foto
                  </button>
                </div>
              </div>
            </section>

            <section className='flex flex-col gap-[1.5rem]'>
              <Field
                label='Nombre y apellidos'
                required
                value={form.nombre}
                onChange={updateField('nombre')}
                helperText='Texto descriptivo'
              />

              <div className='flex flex-wrap gap-[1.5rem]'>
                <Field
                  label='Teléfono'
                  required
                  value={form.telefono}
                  onChange={updateField('telefono')}
                  helperText='Texto descriptivo'
                  className='w-[min(23.75rem,100%)]'
                />
                <Field
                  label='Email'
                  required
                  value={form.email}
                  onChange={updateField('email')}
                  helperText='Texto descriptivo'
                  className='w-[min(23.75rem,100%)]'
                />
              </div>

              <SelectField
                label='Especialidad'
                required
                value={form.especialidad}
                onChange={updateField('especialidad')}
                helperText='Texto descriptivo'
                options={[
                  { label: 'Odontólogo', value: 'Odontólogo' },
                  { label: 'Ortodoncista', value: 'Ortodoncista' },
                  { label: 'Higienista', value: 'Higienista' },
                  { label: 'Cirujano', value: 'Cirujano' },
                  { label: 'Implantólogo', value: 'Implantólogo' }
                ]}
              />

              <div className='flex flex-wrap gap-[1.5rem]'>
                <SelectField
                  label='Color'
                  required
                  value={form.color}
                  onChange={(v) => updateField('color')(v as ProfessionalFormData['color'])}
                  helperText='Texto descriptivo'
                  options={[
                    { label: 'Verde', value: 'verde' },
                    { label: 'Morado', value: 'morado' },
                    { label: 'Naranja', value: 'naranja' }
                  ]}
                  className='w-[min(23.75rem,100%)]'
                />
                <SelectField
                  label='Estado'
                  required
                  value={form.estado}
                  onChange={(v) => updateField('estado')(v as ProfessionalFormData['estado'])}
                  helperText='Texto descriptivo'
                  options={[
                    { label: 'Activo', value: 'Activo' },
                    { label: 'Inactivo', value: 'Inactivo' }
                  ]}
                  className='w-[min(23.75rem,100%)]'
                />
              </div>

              <Field
                label='% comisión (opcional)'
                value={form.comision ?? ''}
                onChange={updateField('comision')}
                helperText='Texto descriptivo'
              />
            </section>

            <div className='flex justify-end'>
              <button
                type='submit'
                className='flex h-[2.5rem] w-[min(12.1875rem,100%)] items-center justify-center rounded-[8.5rem] bg-[var(--color-brand-500)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
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

