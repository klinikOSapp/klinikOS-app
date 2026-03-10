'use client'

import { CloseRounded } from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'

type RegisterAdvancePaymentModalProps = {
  open: boolean
  onClose: () => void
  onSubmit?: (
    data: RegisterAdvancePaymentFormData
  ) => Promise<{ ok: boolean; error?: string } | void> | { ok: boolean; error?: string } | void
}

export type RegisterAdvancePaymentFormData = {
  amount: number
  paymentMethod: string
  paymentDate: Date | null
  concept: string
  reference: string
  notes: string
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' }
]

export default function RegisterAdvancePaymentModal({
  open,
  onClose,
  onSubmit
}: RegisterAdvancePaymentModalProps) {
  const [amountText, setAmountText] = React.useState('')
  const [paymentMethod, setPaymentMethod] = React.useState('')
  const [paymentDate, setPaymentDate] = React.useState('')
  const [concept, setConcept] = React.useState('')
  const [reference, setReference] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setPaymentDate(`${yyyy}-${mm}-${dd}`)
    setError('')
  }, [open])

  const resetForm = React.useCallback(() => {
    setAmountText('')
    setPaymentMethod('')
    setConcept('')
    setReference('')
    setNotes('')
    setError('')
    setIsSubmitting(false)
  }, [])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    const amount = Number(String(amountText).replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Introduce un importe valido mayor que 0')
      return
    }
    if (!paymentMethod.trim()) {
      setError('Selecciona un metodo de pago')
      return
    }
    if (!paymentDate) {
      setError('Selecciona una fecha')
      return
    }
    if (!concept.trim()) {
      setError('Introduce el concepto del anticipo')
      return
    }

    const parsedDate = new Date(`${paymentDate}T12:00:00`)
    if (Number.isNaN(parsedDate.getTime())) {
      setError('La fecha no es valida')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await onSubmit?.({
        amount,
        paymentMethod,
        paymentDate: parsedDate,
        concept: concept.trim(),
        reference: reference.trim(),
        notes: notes.trim()
      })
      if (result && typeof result === 'object' && 'ok' in result && !result.ok) {
        setError(result.error || 'No se pudo registrar el anticipo')
        return
      }
      handleClose()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo registrar el anticipo'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      <div className='absolute inset-0 bg-neutral-900/90' onClick={handleClose} />
      <div className='relative bg-white rounded-lg w-[37.625rem] max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 z-10 flex items-center justify-between h-14 px-8 border-b border-neutral-300 bg-white'>
          <h2 className='text-title-md text-neutral-900'>Registrar anticipo</h2>
          <button
            type='button'
            onClick={handleClose}
            className='text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-[0.875rem]' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-6 px-8 py-6'>
          <div className='flex flex-col gap-2'>
            <label className='text-body-sm text-neutral-900'>Importe</label>
            <input
              type='text'
              inputMode='decimal'
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder='0,00'
              className='h-12 rounded-lg border border-neutral-300 bg-white px-3 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-body-sm text-neutral-900'>Metodo de pago</label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className='h-12 rounded-lg border border-neutral-300 bg-white px-3 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            >
              <option value=''>Seleccionar metodo</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-body-sm text-neutral-900'>Fecha</label>
            <input
              type='date'
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              className='h-12 rounded-lg border border-neutral-300 bg-white px-3 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-body-sm text-neutral-900'>Concepto</label>
            <input
              type='text'
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder='Ej: implante, corona, limpieza con anestesia'
              className='h-12 rounded-lg border border-neutral-300 bg-white px-3 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-body-sm text-neutral-900'>Referencia (opcional)</label>
            <input
              type='text'
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder='Numero de operacion o referencia'
              className='h-12 rounded-lg border border-neutral-300 bg-white px-3 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-body-sm text-neutral-900'>Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder='Notas internas'
              className='min-h-24 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-body-md text-neutral-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
            />
          </div>

          <div className='flex items-center justify-end gap-3 pt-4 border-t border-neutral-200'>
            {error ? <p className='mr-auto text-body-sm text-red-600'>{error}</p> : null}
            <button
              type='button'
              onClick={handleClose}
              disabled={isSubmitting}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='px-6 py-2 rounded-[8.5rem] bg-brand-500 text-title-sm text-brand-900 hover:bg-brand-400 active:bg-brand-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting ? 'Guardando...' : 'Registrar anticipo'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
