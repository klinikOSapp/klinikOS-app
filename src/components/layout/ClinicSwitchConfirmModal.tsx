'use client'

import { CloseRounded, WarningRounded } from '@/components/icons/md3'
import { useCallback, useEffect, useRef } from 'react'

type UnsavedArea = {
  key: string
  label: string
}

type ClinicSwitchConfirmModalProps = {
  isOpen: boolean
  targetClinicName: string
  unsavedAreas: UnsavedArea[]
  onConfirm: () => void
  onCancel: () => void
}

export default function ClinicSwitchConfirmModal({
  isOpen,
  targetClinicName,
  unsavedAreas,
  onConfirm,
  onCancel
}: ClinicSwitchConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Focus the modal when it opens
    modalRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onCancel])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onCancel()
      }
    },
    [onCancel]
  )

  if (!isOpen) {
    return null
  }

  return (
    <div
      className='fixed inset-0 z-[100] flex items-center justify-center'
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby='confirm-modal-title'
    >
      {/* Backdrop */}
      <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative z-10
          w-[min(28rem,90vw)]
          bg-white rounded-2xl shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
        `}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-100'>
          <div className='flex items-center gap-3'>
            <div className='size-10 rounded-full bg-amber-100 flex items-center justify-center'>
              <WarningRounded className='size-6 text-amber-600' />
            </div>
            <h2
              id='confirm-modal-title'
              className='text-lg font-semibold text-neutral-900'
            >
              Cambios sin guardar
            </h2>
          </div>
          <button
            type='button'
            onClick={onCancel}
            className='size-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center transition-colors'
            aria-label='Cerrar'
          >
            <CloseRounded className='size-5 text-neutral-500' />
          </button>
        </div>

        {/* Content */}
        <div className='px-6 py-5'>
          <p className='text-body-md text-neutral-700 mb-4'>
            Tienes cambios sin guardar en las siguientes áreas. Si cambias a{' '}
            <span className='font-semibold text-neutral-900'>
              {targetClinicName}
            </span>
            , estos cambios se perderán.
          </p>

          {/* List of unsaved areas */}
          {unsavedAreas.length > 0 && (
            <ul className='space-y-2 mb-4'>
              {unsavedAreas.map((area) => (
                <li
                  key={area.key}
                  className='flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg'
                >
                  <span className='size-1.5 rounded-full bg-amber-500' />
                  <span className='text-sm text-amber-800'>{area.label}</span>
                </li>
              ))}
            </ul>
          )}

          <p className='text-sm text-neutral-500'>
            ¿Deseas continuar y descartar los cambios?
          </p>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100'>
          <button
            type='button'
            onClick={onCancel}
            className={`
              px-4 py-2 rounded-xl
              text-body-md font-medium
              bg-neutral-100 text-neutral-700
              hover:bg-neutral-200
              transition-colors duration-150
            `}
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={onConfirm}
            className={`
              px-4 py-2 rounded-xl
              text-body-md font-medium
              bg-amber-500 text-white
              hover:bg-amber-600
              transition-colors duration-150
            `}
          >
            Descartar y cambiar
          </button>
        </div>
      </div>
    </div>
  )
}
