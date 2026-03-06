'use client'

/* eslint-disable @next/next/no-img-element */

import {
  AddRounded,
  CheckRounded,
  CloseRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import type { EmploymentType, ProfessionalColorTone, ProfessionalRole } from '@/context/ConfigurationContext'
import React from 'react'
import { createPortal } from 'react-dom'

export type ProfessionalFormData = {
  nombre: string
  telefono: string
  email: string
  role: ProfessionalRole
  specialty: string
  color: ProfessionalColorTone
  estado: 'Activo' | 'Inactivo'
  employmentType: EmploymentType
  comision?: string
  salary?: string
  fotoUrl?: string
  notas?: string
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
    <div
      className={['flex flex-col gap-[0.5rem] w-full', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className='flex items-center justify-between'>
        <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
          {label}
        </p>
        {required ? (
          <span
            className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]'
            aria-hidden
          >
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
          <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>
            {helperText}
          </p>
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
  const [isOpen, setIsOpen] = React.useState(false)
  const [dropdownPos, setDropdownPos] = React.useState<{
    top: number
    left: number
    minWidth: number
  } | null>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const openDropdown = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = Math.min(options.length * 40 + 8, 280)
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

    setDropdownPos({
      top: placeAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width
    })
    setIsOpen(true)
  }, [options.length])

  React.useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return
      setIsOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  return (
    <div
      className={['flex flex-col gap-[0.5rem] w-full', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className='flex items-center justify-between'>
        <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
          {label}
        </p>
        {required ? (
          <span
            className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]'
            aria-hidden
          >
            *
          </span>
        ) : null}
      </div>
      <div className='flex flex-col gap-[0.25rem] w-full'>
        <button
          ref={triggerRef}
          type='button'
          onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
          className={[
            'flex h-[3rem] items-center justify-between rounded-[0.5rem] border-[0.03125rem] bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] transition-colors text-left',
            isOpen
              ? 'border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)]'
              : 'border-neutral-300'
          ].join(' ')}
        >
          <span className='font-inter text-[1rem] leading-[1.5rem] text-neutral-900 truncate'>
            {selectedOption?.label || '-'}
          </span>
          <KeyboardArrowDownRounded
            className={[
              'shrink-0 text-neutral-600 transition-transform',
              isOpen ? 'rotate-180' : ''
            ].join(' ')}
          />
        </button>
        {isOpen &&
          dropdownPos &&
          createPortal(
            <div
              ref={dropdownRef}
              className='fixed z-[9999] flex flex-col overflow-auto rounded-[0.5rem] border border-[#E2E7EA] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
              style={{
                top: dropdownPos.top,
                left: dropdownPos.left,
                minWidth: dropdownPos.minWidth,
                maxHeight: 280
              }}
              role='listbox'
            >
              {options.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type='button'
                    role='option'
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value)
                      setIsOpen(false)
                    }}
                    className={[
                      'flex items-center justify-between gap-2 px-[0.625rem] py-[0.5rem] font-inter text-[0.9375rem] leading-[1.375rem] transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#E9FBF9] text-[var(--color-brand-700)] font-medium'
                        : 'text-[#24282C] hover:bg-[var(--color-neutral-50)]'
                    ].join(' ')}
                  >
                    <span className='truncate'>{opt.label}</span>
                    {isSelected && (
                      <CheckRounded className='w-[1rem] h-[1rem] text-[var(--color-brand-500)] shrink-0' />
                    )}
                  </button>
                )
              })}
            </div>,
            document.body
          )}
        {helperText ? (
          <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>
            {helperText}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const ROLE_OPTIONS: { label: string; value: ProfessionalRole }[] = [
  { label: 'Gerencia', value: 'director' },
  { label: 'Administración', value: 'recepcion' },
  { label: 'Doctor', value: 'profesional' }
]

const EMPLOYEE_SPECIALTIES: { label: string; value: string }[] = [
  { label: 'Odontología general', value: 'Odontología general' },
  { label: 'Odontólogo', value: 'Odontólogo' },
  { label: 'Ortodoncista', value: 'Ortodoncista' },
  { label: 'Higienista dental', value: 'Higienista dental' },
  { label: 'Cirujano oral', value: 'Cirujano oral' },
  { label: 'Implantólogo', value: 'Implantólogo' },
  { label: 'Endodoncista', value: 'Endodoncista' },
  { label: 'Periodoncista', value: 'Periodoncista' },
  { label: 'Prostodoncista', value: 'Prostodoncista' },
  { label: 'Odontopediatra', value: 'Odontopediatra' }
]

const ADMIN_SPECIALTIES: { label: string; value: string }[] = [
  { label: 'Ninguna', value: '' },
  { label: 'Higienista', value: 'Higienista dental' }
]

const NINGUNA_OPTION = { label: 'Ninguna', value: '' }

const EXTERNAL_SPECIALTIES: { label: string; value: string }[] = [
  { label: 'Ortodoncista', value: 'Ortodoncista' },
  { label: 'Cirujano maxilofacial', value: 'Cirujano maxilofacial' },
  { label: 'Implantólogo', value: 'Implantólogo' },
  { label: 'Endodoncista', value: 'Endodoncista' },
  { label: 'Periodoncista', value: 'Periodoncista' },
  { label: 'Prostodoncista', value: 'Prostodoncista' },
  { label: 'Cirujano oral', value: 'Cirujano oral' },
  { label: 'Odontopediatra', value: 'Odontopediatra' },
  { label: 'Radiólogo dental', value: 'Radiólogo dental' }
]

const inicialForm: ProfessionalFormData = {
  nombre: '',
  telefono: '',
  email: '',
  role: 'profesional',
  specialty: 'Odontología general',
  color: 'verde',
  estado: 'Activo',
  employmentType: 'empleado',
  comision: '',
  salary: '',
  fotoUrl: undefined,
  notas: ''
}

export default function AddProfessionalModal({
  open,
  onClose,
  onSubmit,
  title = 'Nuevo',
  submitLabel = 'Añadir',
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

  const specialtyOptions =
    form.employmentType === 'externo'
      ? EXTERNAL_SPECIALTIES
      : form.role === 'recepcion'
        ? ADMIN_SPECIALTIES
        : form.role === 'director'
          ? [NINGUNA_OPTION, ...EMPLOYEE_SPECIALTIES]
          : EMPLOYEE_SPECIALTIES

  return (
    <Portal>
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
              {title}
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

          <form
            onSubmit={handleSubmit}
            className='max-h-[calc(90vh-3.5rem)] overflow-y-auto'
          >
            <div className='mx-auto flex w-[min(49rem,calc(100%-2rem))] flex-col gap-[2.5rem] px-[2rem] py-[2.5rem]'>
              <section className='flex flex-col gap-[1rem]'>
                <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                  Introduce los datos
                </p>
                <div className='flex flex-col gap-[0.5rem]'>
                  <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
                    Foto del profesional
                  </p>
                  <div className='flex flex-wrap items-center gap-[1.5rem]'>
                    <div className='relative size-[6.5625rem] overflow-hidden rounded-[0.5rem] bg-neutral-200'>
                      {form.fotoUrl ? (
                        <img
                          src={form.fotoUrl}
                          alt='Foto del profesional'
                          className='size-full object-cover'
                        />
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
                  placeholder='Ej: María García López'
                  helperText='Nombre completo tal como aparecerá en la agenda'
                />

                <div className='flex flex-wrap gap-[1.5rem]'>
                  <Field
                    label='Teléfono'
                    required={form.employmentType !== 'externo'}
                    value={form.telefono}
                    onChange={updateField('telefono')}
                    placeholder='Ej: 612 345 678'
                    helperText='Número de contacto del profesional'
                    className='w-[min(23.75rem,100%)]'
                  />
                  <Field
                    label='Email'
                    required={form.employmentType !== 'externo'}
                    value={form.email}
                    onChange={updateField('email')}
                    placeholder='Ej: maria@clinica.es'
                    helperText='Correo electrónico profesional'
                    className='w-[min(23.75rem,100%)]'
                  />
                </div>

                <SelectField
                  label='Tipo de vinculación'
                  required
                  value={form.employmentType}
                  onChange={(v) => {
                    const empType = v as EmploymentType
                    setForm((prev) => ({
                      ...prev,
                      employmentType: empType,
                      specialty: empType === 'externo'
                        ? EXTERNAL_SPECIALTIES[0].value
                        : EMPLOYEE_SPECIALTIES[0].value
                    }))
                  }}
                  helperText='Los empleados son internos. Los externos aparecen en la agenda los días asignados.'
                  options={[
                    { label: 'Empleado (interno)', value: 'empleado' },
                    { label: 'Especialista externo', value: 'externo' }
                  ]}
                />

                <div className='flex flex-wrap gap-[1.5rem]'>
                  <SelectField
                    label='Rol'
                    required
                    value={form.role}
                    onChange={(v) => {
                      const newRole = v as ProfessionalRole
                      const defaultSpec =
                        newRole === 'recepcion' ? '' :
                        newRole === 'director' ? '' :
                        EMPLOYEE_SPECIALTIES[0].value
                      setForm((prev) => ({
                        ...prev,
                        role: newRole,
                        specialty: defaultSpec
                      }))
                    }}
                    helperText='Rol del profesional en la clínica'
                    options={ROLE_OPTIONS}
                    className='w-[min(23.75rem,100%)]'
                  />
                  <SelectField
                    label='Especialidad'
                    required
                    value={form.specialty}
                    onChange={updateField('specialty')}
                    helperText='Área de especialización principal'
                    options={specialtyOptions}
                    className='w-[min(23.75rem,100%)]'
                  />
                </div>

                <div className='flex flex-wrap gap-[1.5rem]'>
                  <SelectField
                    label='Color'
                    required
                    value={form.color}
                    onChange={(v) =>
                      updateField('color')(v as ProfessionalFormData['color'])
                    }
                    helperText='Color identificativo en la agenda'
                    options={[
                      { label: 'Verde', value: 'verde' },
                      { label: 'Morado', value: 'morado' },
                      { label: 'Naranja', value: 'naranja' },
                      { label: 'Azul', value: 'azul' },
                      { label: 'Rojo', value: 'rojo' }
                    ]}
                    className='w-[min(23.75rem,100%)]'
                  />
                  <SelectField
                    label='Estado'
                    required
                    value={form.estado}
                    onChange={(v) =>
                      updateField('estado')(v as ProfessionalFormData['estado'])
                    }
                    helperText='Profesionales inactivos no aparecen en la agenda'
                    options={[
                      { label: 'Activo', value: 'Activo' },
                      { label: 'Inactivo', value: 'Inactivo' }
                    ]}
                    className='w-[min(23.75rem,100%)]'
                  />
                </div>

              {form.employmentType === 'externo' ? (
                <>
                  <Field
                    label='% comisión'
                    value={form.comision ?? ''}
                    onChange={updateField('comision')}
                    placeholder='Ej: 30'
                    helperText='Porcentaje de comisión por servicios realizados'
                  />
                  <Field
                    label='Notas'
                    value={form.notas ?? ''}
                    onChange={updateField('notas')}
                    placeholder='Ej: Viene los martes por la mañana'
                    helperText='Información adicional sobre el especialista externo'
                  />
                </>
              ) : (
                <Field
                  label='Salario mensual (EUR)'
                  value={form.salary ?? ''}
                  onChange={updateField('salary')}
                  placeholder='Ej: 2.500'
                  helperText='Salario bruto mensual del profesional'
                />
              )}
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
    </Portal>
  )
}
