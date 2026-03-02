'use client'

import {
  CloseRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import React from 'react'

export type DiscountFormData = {
  name: string
  discountType: 'percentage' | 'fixed'
  value: string
  notes: string
}

type AddDiscountModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (data: DiscountFormData) => void
}

const initialForm: DiscountFormData = {
  name: '',
  discountType: 'percentage',
  value: '',
  notes: ''
}

export default function AddDiscountModal({
  open,
  onClose,
  onSubmit
}: AddDiscountModalProps) {
  const [form, setForm] = React.useState<DiscountFormData>(initialForm)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setForm(initialForm)
      setError('')
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const numValue = Number(form.value)
    if (!form.name.trim()) {
      setError('El nombre del descuento es obligatorio.')
      return
    }
    if (!Number.isFinite(numValue) || numValue < 0) {
      setError('El valor del descuento no es válido.')
      return
    }
    onSubmit({ ...form, value: form.value })
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
          aria-label='Nuevo descuento'
          className='relative w-[min(40rem,95vw)] max-h-[90vh] overflow-hidden rounded-[0.5rem] bg-[var(--color-surface-modal,#fff)] shadow-xl'
          onClick={(e) => e.stopPropagation()}
        >
          <header className='flex h-[3.5rem] items-center justify-between border-b border-[var(--color-neutral-300)] px-[2rem]'>
            <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
              Nuevo descuento
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
                <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                  Introduce los datos del nuevo descuento
                </p>

                {/* Name */}
                <div className='flex flex-col gap-[0.5rem] w-full'>
                  <div className='flex items-center justify-between'>
                    <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
                      Nombre del descuento
                    </p>
                    <span className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]' aria-hidden>
                      *
                    </span>
                  </div>
                  <div className='flex h-[3rem] items-center rounded-[0.5rem] border-[0.03125rem] border-neutral-300 bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] focus-within:border-[var(--color-brand-500)] focus-within:ring-1 focus-within:ring-[var(--color-brand-500)] transition-colors'>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder='Ej: Descuento familiar'
                      className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900'
                      autoFocus
                    />
                  </div>
                </div>

                <div className='flex flex-wrap gap-[1.5rem]'>
                  {/* Discount type */}
                  <div className='flex flex-col gap-[0.5rem] w-[min(15rem,100%)]'>
                    <div className='flex items-center justify-between'>
                      <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
                        Tipo de descuento
                      </p>
                      <span className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]' aria-hidden>
                        *
                      </span>
                    </div>
                    <div className='flex h-[3rem] items-center justify-between rounded-[0.5rem] border-[0.03125rem] border-neutral-300 bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] focus-within:border-[var(--color-brand-500)] focus-within:ring-1 focus-within:ring-[var(--color-brand-500)] transition-colors'>
                      <select
                        value={form.discountType}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            discountType: e.target.value as 'percentage' | 'fixed'
                          }))
                        }
                        className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900 appearance-none'
                      >
                        <option value='percentage'>Porcentaje (%)</option>
                        <option value='fixed'>Precio fijo (€)</option>
                      </select>
                      <span className='flex items-center justify-center text-neutral-600'>
                        <KeyboardArrowDownRounded />
                      </span>
                    </div>
                    <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>
                      Cómo se aplica el descuento
                    </p>
                  </div>

                  {/* Value */}
                  <div className='flex flex-col gap-[0.5rem] w-[min(15rem,100%)]'>
                    <div className='flex items-center justify-between'>
                      <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
                        Valor
                      </p>
                      <span className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]' aria-hidden>
                        *
                      </span>
                    </div>
                    <div className='flex h-[3rem] items-center rounded-[0.5rem] border-[0.03125rem] border-neutral-300 bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] focus-within:border-[var(--color-brand-500)] focus-within:ring-1 focus-within:ring-[var(--color-brand-500)] transition-colors'>
                      <input
                        value={form.value}
                        onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))}
                        placeholder={form.discountType === 'percentage' ? 'Ej: 10' : 'Ej: 25'}
                        type='number'
                        min='0'
                        step='any'
                        className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900'
                      />
                    </div>
                    <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>
                      {form.discountType === 'percentage' ? 'Porcentaje de descuento (0–100)' : 'Importe fijo en euros'}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className='flex flex-col gap-[0.5rem] w-full'>
                  <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
                    Notas (opcional)
                  </p>
                  <div className='flex min-h-[5rem] items-start rounded-[0.5rem] border-[0.03125rem] border-neutral-300 bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] focus-within:border-[var(--color-brand-500)] focus-within:ring-1 focus-within:ring-[var(--color-brand-500)] transition-colors'>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder='Ej: Aplicar a pacientes con seguro médico...'
                      rows={3}
                      className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900 resize-none'
                    />
                  </div>
                </div>

                {error ? (
                  <p className='font-inter text-[0.875rem] leading-[1.25rem] text-[var(--color-error-600)]'>
                    {error}
                  </p>
                ) : null}
              </section>

              <div className='flex justify-end'>
                <button
                  type='submit'
                  className='flex h-[2.5rem] w-[min(12.1875rem,100%)] items-center justify-center rounded-[8.5rem] bg-[var(--color-brand-500)] px-[1rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
                >
                  Añadir descuento
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
