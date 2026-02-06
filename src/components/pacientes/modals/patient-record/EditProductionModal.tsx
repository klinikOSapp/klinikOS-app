'use client'

import { CloseRounded } from '@/components/icons/md3'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

type EditProductionModalProps = {
  open: boolean
  onClose: () => void
  // Production data
  productionId: string
  description: string
  currentDate: string
  currentNotes?: string
  professional: string
  // Callback
  onSave: (data: { date: string; notes: string }) => void
}

export default function EditProductionModal({
  open,
  onClose,
  productionId,
  description,
  currentDate,
  currentNotes = '',
  professional,
  onSave
}: EditProductionModalProps) {
  const [date, setDate] = useState(currentDate)
  const [notes, setNotes] = useState(currentNotes)

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setDate(currentDate)
      setNotes(currentNotes)
    }
  }, [open, currentDate, currentNotes])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ date, notes })
    onClose()
  }

  // Convert date from dd/mm/yy to yyyy-mm-dd for input
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      const fullYear = year.length === 2 ? `20${year}` : year
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return ''
  }

  // Convert date from yyyy-mm-dd to dd/mm/yy for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    const shortYear = year.slice(-2)
    return `${day}/${month}/${shortYear}`
  }

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-neutral-900/90'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-lg w-[32rem] overflow-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between h-14 px-8 border-b border-neutral-300'>
          <h2 className='text-title-md text-neutral-900'>
            Editar producción
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-[0.875rem]' />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-6 px-8 py-6'>
          {/* Read-only info */}
          <div className='flex flex-col gap-4 p-4 bg-neutral-50 rounded-lg'>
            <div className='flex gap-8'>
              <div className='flex-1'>
                <p className='text-body-sm text-neutral-500'>ID Producción</p>
                <p className='text-body-md text-neutral-900'>{productionId}</p>
              </div>
              <div className='flex-1'>
                <p className='text-body-sm text-neutral-500'>Profesional</p>
                <p className='text-body-md text-neutral-900'>{professional}</p>
              </div>
            </div>
            <div>
              <p className='text-body-sm text-neutral-500'>Tratamiento</p>
              <p className='text-body-md text-neutral-900'>{description}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className='flex flex-col gap-4'>
            {/* Date field */}
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='production-date'
                className='text-title-sm text-neutral-900'
              >
                Fecha de producción
              </label>
              <input
                id='production-date'
                type='date'
                value={parseDate(date)}
                onChange={(e) => setDate(formatDate(e.target.value))}
                className='h-10 px-3 rounded-lg border border-neutral-300 text-body-md text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              />
            </div>

            {/* Notes field */}
            <div className='flex flex-col gap-1'>
              <label
                htmlFor='production-notes'
                className='text-title-sm text-neutral-900'
              >
                Notas
              </label>
              <textarea
                id='production-notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Añade notas sobre la producción...'
                rows={4}
                className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className='flex justify-end gap-3 mt-2'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 rounded-[8.5rem] border border-neutral-300 text-title-sm text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='px-4 py-2 rounded-[8.5rem] bg-brand-500 text-white text-title-sm hover:bg-brand-600 transition-colors cursor-pointer'
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
