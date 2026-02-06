'use client'

import { CloseRounded, WarningRounded } from '@/components/icons/md3'
import { useCallback, useEffect, useRef } from 'react'
import Portal from './Portal'

export type ConfirmDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
}

/**
 * ConfirmDialog - Componente de diálogo de confirmación accesible
 * Reemplaza window.confirm() con una UI consistente
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger'
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

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
      // Focus the confirm button when opened for quick action
      setTimeout(() => confirmButtonRef.current?.focus(), 0)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const variantStyles = {
    danger: {
      icon: 'text-[var(--color-error-600)]',
      button:
        'bg-[var(--color-error-600)] hover:bg-[var(--color-error-700)] text-white'
    },
    warning: {
      icon: 'text-[var(--color-warning-600)]',
      button:
        'bg-[var(--color-warning-600)] hover:bg-[var(--color-warning-700)] text-white'
    },
    info: {
      icon: 'text-[var(--color-brand-600)]',
      button:
        'bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white'
    }
  }

  const styles = variantStyles[variant]

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
        onClick={onClose}
        aria-hidden='true'
      >
        <div
          ref={dialogRef}
          role='alertdialog'
          aria-modal='true'
          aria-labelledby='confirm-dialog-title'
          aria-describedby='confirm-dialog-description'
          tabIndex={-1}
          className='relative w-[min(28rem,95vw)] overflow-hidden rounded-xl bg-white shadow-2xl outline-none'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex items-start gap-4 p-6 pb-4'>
            <div className={`flex-shrink-0 ${styles.icon}`}>
              <WarningRounded className='size-6' />
            </div>
            <div className='flex-1 min-w-0'>
              <h2
                id='confirm-dialog-title'
                className='text-title-md font-medium text-[var(--color-neutral-900)]'
              >
                {title}
              </h2>
              <p
                id='confirm-dialog-description'
                className='mt-2 text-body-md text-[var(--color-neutral-600)]'
              >
                {message}
              </p>
            </div>
            <button
              type='button'
              onClick={onClose}
              aria-label='Cerrar diálogo'
              className='flex-shrink-0 rounded-full p-1 text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)] transition-colors'
            >
              <CloseRounded className='size-5' />
            </button>
          </div>

          {/* Actions */}
          <div className='flex items-center justify-end gap-3 px-6 py-4 bg-[var(--color-neutral-50)]'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-body-md font-medium text-[var(--color-neutral-700)] rounded-lg hover:bg-[var(--color-neutral-100)] transition-colors'
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmButtonRef}
              type='button'
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-4 py-2 text-body-md font-medium rounded-lg transition-colors ${styles.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
