'use client'

import { CloseRounded } from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import React from 'react'

type AddFamilyModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  existingNames: string[]
}

export default function AddFamilyModal({
  open,
  onClose,
  onSubmit,
  existingNames
}: AddFamilyModalProps) {
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (!open) return
    setName('')
    setError('')
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
    const trimmed = name.trim()
    if (!trimmed) {
      setError('El nombre es obligatorio')
      return
    }
    const duplicate = existingNames.some(
      (n) => n.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      setError('Ya existe una familia con ese nombre')
      return
    }
    onSubmit(trimmed)
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
          aria-label='Nueva familia'
          className='relative w-[min(30rem,95vw)] overflow-hidden rounded-[0.5rem] bg-[var(--color-surface-modal,#fff)] shadow-xl'
          onClick={(e) => e.stopPropagation()}
        >
          <header className='flex h-[3.5rem] items-center justify-between border-b border-[var(--color-neutral-300)] px-[2rem]'>
            <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
              Nueva familia
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

          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-[1.5rem] px-[2rem] py-[2rem]'>
              <p className='font-inter text-[1.125rem] leading-[1.75rem] font-medium text-neutral-900'>
                Introduce el nombre de la nueva familia
              </p>

              <div className='flex flex-col gap-[0.5rem] w-full'>
                <div className='flex items-center justify-between'>
                  <p className='font-inter text-[0.875rem] leading-[1.25rem] text-neutral-900'>
                    Nombre de la familia
                  </p>
                  <span
                    className='text-[0.75rem] leading-[0.875rem] text-[var(--color-error-600)]'
                    aria-hidden
                  >
                    *
                  </span>
                </div>
                <div
                  className={[
                    'flex h-[3rem] items-center rounded-[0.5rem] border-[0.03125rem] bg-[var(--color-neutral-50)] px-[0.625rem] py-[0.5rem] transition-colors',
                    error
                      ? 'border-[var(--color-error-600)]'
                      : 'border-neutral-300 focus-within:border-[var(--color-brand-500)] focus-within:ring-1 focus-within:ring-[var(--color-brand-500)]'
                  ].join(' ')}
                >
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (error) setError('')
                    }}
                    placeholder='Ej: Ortodoncia, Periodoncia...'
                    autoFocus
                    className='w-full bg-transparent outline-none font-inter text-[1rem] leading-[1.5rem] text-neutral-900'
                  />
                </div>
                {error ? (
                  <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-[var(--color-error-600)]'>
                    {error}
                  </p>
                ) : (
                  <p className='font-inter text-[0.6875rem] leading-[1rem] font-medium text-neutral-600'>
                    Se usará como categoría para agrupar tratamientos
                  </p>
                )}
              </div>

              <div className='flex justify-end'>
                <button
                  type='submit'
                  className='flex h-[2.5rem] items-center justify-center rounded-[8.5rem] bg-[var(--color-brand-500)] px-[1.5rem] py-[0.5rem] text-[1rem] leading-[1.5rem] font-medium text-[var(--color-brand-900)] transition-colors hover:bg-[var(--color-brand-400)]'
                >
                  Crear familia
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}
