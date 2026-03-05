'use client'

import {
  CheckRounded,
  CloseRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import React from 'react'
import { createPortal } from 'react-dom'

export type TreatmentFormData = {
  name: string
  code: string
  basePrice: string
  estimatedTime: string
  iva: string
  category?: string
}

type AddTreatmentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: TreatmentFormData) => void
  categoryName?: string
  existingCodes?: string[]
  title?: string
  submitLabel?: string
  initialData?: Partial<TreatmentFormData>
  categories?: { id: string; name: string }[]
}

function generateCodeFromName(name: string, existingCodes: string[]): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim()

  if (!clean) return ''

  const words = clean.split(/\s+/).filter(Boolean)
  let base = ''

  if (words.length >= 3) {
    base = words[0][0] + words[1][0] + words[2][0]
  } else if (words.length === 2) {
    base = words[0].slice(0, 2) + words[1][0]
  } else {
    base = words[0].slice(0, 3)
  }

  base = base.slice(0, 3).padEnd(3, 'X')

  if (!existingCodes.includes(base)) return base

  let n = 2
  while (existingCodes.includes(`${base}${n}`)) n++
  return `${base}${n}`
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  helperText?: string
  className?: string
  placeholder?: string
  type?: string
}

function Field({
  label,
  value,
  onChange,
  required,
  helperText,
  className,
  placeholder,
  type = 'text'
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
            type={type}
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

const initialForm: TreatmentFormData = {
  name: '',
  code: '',
  basePrice: '',
  estimatedTime: '30 min',
  iva: '0%',
  category: undefined
}

const TIME_OPTIONS = [
  { label: '15 min', value: '15 min' },
  { label: '20 min', value: '20 min' },
  { label: '30 min', value: '30 min' },
  { label: '45 min', value: '45 min' },
  { label: '60 min', value: '60 min' },
  { label: '75 min', value: '75 min' },
  { label: '90 min', value: '90 min' },
  { label: '120 min', value: '120 min' }
]

const IVA_OPTIONS = [
  { label: '0%', value: '0%' },
  { label: '4%', value: '4%' },
  { label: '10%', value: '10%' },
  { label: '21%', value: '21%' }
]

export default function AddTreatmentModal({
  open,
  onClose,
  onSubmit,
  categoryName,
  existingCodes = [],
  title = 'Nuevo tratamiento',
  submitLabel = 'Añadir tratamiento',
  initialData,
  categories
}: AddTreatmentModalProps) {
  const [form, setForm] = React.useState<TreatmentFormData>({
    ...initialForm,
    ...initialData
  })
  const [codeManuallyEdited, setCodeManuallyEdited] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setForm({ ...initialForm, ...initialData })
    setCodeManuallyEdited(!!initialData?.code)
  }, [initialData, open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleNameChange = (value: string) => {
    setForm((prev) => {
      const updated = { ...prev, name: value }
      if (!codeManuallyEdited) {
        updated.code = generateCodeFromName(value, existingCodes)
      }
      return updated
    })
  }

  const handleCodeChange = (value: string) => {
    setCodeManuallyEdited(true)
    setForm((prev) => ({ ...prev, code: value }))
  }

  const updateField = (field: keyof TreatmentFormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(form)
  }

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
          className='relative w-[min(40rem,95vw)] max-h-[90vh] overflow-hidden rounded-[0.5rem] bg-[var(--color-surface-modal,#fff)] shadow-xl'
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
            <div className='mx-auto flex w-[min(36rem,calc(100%-2rem))] flex-col gap-[2.5rem] px-[2rem] py-[2.5rem]'>
              <section className='flex flex-col gap-[1.5rem]'>
                {initialData ? (
                  <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                    Modifica los datos del tratamiento
                  </p>
                ) : categoryName ? (
                  <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                    Añadir tratamiento a {categoryName}
                  </p>
                ) : (
                  <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                    Introduce los datos del nuevo tratamiento
                  </p>
                )}

                <Field
                  label='Nombre del tratamiento'
                  required
                  value={form.name}
                  onChange={handleNameChange}
                  placeholder='Ej: Limpieza dental completa'
                  helperText='El código se genera automáticamente a partir del nombre'
                />

                <div className='flex flex-wrap gap-[1.5rem]'>
                  <Field
                    label='Código'
                    required
                    value={form.code}
                    onChange={handleCodeChange}
                    placeholder='Ej: LDC001'
                    helperText={codeManuallyEdited ? 'Editado manualmente' : 'Generado automáticamente'}
                    className='w-[min(15rem,100%)]'
                  />
                  <Field
                    label='Precio base (€)'
                    required
                    value={form.basePrice}
                    onChange={updateField('basePrice')}
                    placeholder='Ej: 120'
                    helperText='Precio sin IVA en euros'
                    className='w-[min(15rem,100%)]'
                    type='number'
                  />
                </div>

                <div className='flex flex-wrap gap-[1.5rem]'>
                  <SelectField
                    label='Tiempo estimado'
                    required
                    value={form.estimatedTime}
                    onChange={updateField('estimatedTime')}
                    helperText='Duración aproximada del tratamiento'
                    options={TIME_OPTIONS}
                    className='w-[min(15rem,100%)]'
                  />
                  <SelectField
                    label='IVA'
                    required
                    value={form.iva}
                    onChange={updateField('iva')}
                    helperText='Tipo impositivo aplicable'
                    options={IVA_OPTIONS}
                    className='w-[min(15rem,100%)]'
                  />
                </div>

                {categories && categories.length > 0 ? (
                  <SelectField
                    label='Familia'
                    required
                    value={form.category || ''}
                    onChange={updateField('category')}
                    helperText='Categoría del tratamiento'
                    options={categories.map((c) => ({ label: c.name, value: c.name }))}
                  />
                ) : null}
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
