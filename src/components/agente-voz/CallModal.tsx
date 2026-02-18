'use client'

import Portal from '@/components/ui/Portal'
import { useEffect, useRef, useState } from 'react'
import type { CallRecord } from './voiceAgentTypes'
import { CALL_INTENT_LABELS, SENTIMENT_LABELS } from './voiceAgentTypes'

type CallModalProps = {
  call: CallRecord
  onClose: () => void
  onMarkResolved: () => void
}

/**
 * Call Modal
 * Approx 400px × 380px = 25rem × 23.75rem
 * Shows call context and phone number for callback preparation
 */
export default function CallModal({
  call,
  onClose,
  onMarkResolved
}: CallModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  // Handle escape key and click outside
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Copy phone to clipboard
  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(call.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy phone:', err)
    }
  }

  // Determine urgency level
  const isUrgent = call.status === 'urgente'

  return (
    <Portal>
      {/* Backdrop */}
      <div className='fixed inset-0 z-[9998] bg-black/30' />

      {/* Modal */}
      <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
        <div
          ref={modalRef}
          className='relative w-[min(25rem,95vw)] bg-white rounded-lg overflow-hidden shadow-xl'
          role='dialog'
          aria-modal='true'
          aria-labelledby='call-modal-title'
        >
          {/* Header */}
          <header className='flex items-center justify-between px-6 h-14 border-b border-neutral-200'>
            <div className='flex items-center gap-2'>
              <span className='material-symbols-rounded text-xl text-brand-600'>
                call
              </span>
              <h2
                id='call-modal-title'
                className='text-title-md font-medium text-neutral-900'
              >
                Devolver llamada
              </h2>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='p-1 text-neutral-600 hover:text-neutral-900 transition-colors rounded hover:bg-neutral-100'
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-xl'>close</span>
            </button>
          </header>

          {/* Content */}
          <div className='px-6 py-5'>
            {/* Patient Name */}
            <div className='mb-4'>
              <span className='text-sm text-neutral-500'>Paciente</span>
              <p className='text-lg font-medium text-neutral-900 mt-0.5'>
                {call.patient ?? 'Sin asignar'}
              </p>
            </div>

            {/* Phone Number - Prominent */}
            <div className='bg-neutral-50 rounded-lg p-4 mb-5'>
              <span className='text-sm text-neutral-500'>Teléfono</span>
              <div className='flex items-center justify-between mt-1'>
                <span className='text-2xl font-semibold text-neutral-900 tracking-wide'>
                  {call.phone}
                </span>
                <button
                  type='button'
                  onClick={handleCopyPhone}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    copied
                      ? 'bg-success-100 text-success-700'
                      : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                  }`}
                >
                  <span className='material-symbols-rounded text-lg'>
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Context Section */}
            <div className='border-t border-neutral-200 pt-4'>
              <h3 className='text-sm font-medium text-neutral-700 mb-3'>
                Contexto de la llamada
              </h3>

              <div className='space-y-2.5'>
                {/* Motivo */}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-neutral-500'>Motivo</span>
                  <span className='text-sm font-medium text-neutral-900'>
                    {call.intentDisplay?.trim() || CALL_INTENT_LABELS[call.intent]}
                  </span>
                </div>

                {/* Sentimiento */}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-neutral-500'>Sentimiento</span>
                  <span className='text-sm font-medium text-neutral-900'>
                    {SENTIMENT_LABELS[call.sentiment]}
                  </span>
                </div>

                {/* Urgencia */}
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-neutral-500'>Urgencia</span>
                  <span
                    className={`text-sm font-medium ${
                      isUrgent ? 'text-error-600' : 'text-neutral-900'
                    }`}
                  >
                    {isUrgent ? 'Alta' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* Resumen */}
              {call.summary && (
                <div className='mt-4 bg-neutral-50 rounded-lg p-3'>
                  <span className='text-xs text-neutral-500 uppercase tracking-wide'>
                    Resumen
                  </span>
                  <p className='text-sm text-neutral-700 mt-1 leading-relaxed'>
                    {call.summary}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <footer className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors'
            >
              Cancelar
            </button>
            <button
              type='button'
              onClick={onMarkResolved}
              className='flex items-center gap-2 px-4 py-2 bg-success-500 hover:bg-success-600 text-white text-sm font-medium rounded-lg transition-colors'
            >
              <span className='material-symbols-rounded text-lg'>
                check_circle
              </span>
              <span>Llamada realizada</span>
            </button>
          </footer>
        </div>
      </div>
    </Portal>
  )
}
