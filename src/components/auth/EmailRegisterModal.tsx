'use client'

import CloseRounded from '@mui/icons-material/CloseRounded'
import React from 'react'

type EmailRegisterModalProps = {
  open: boolean
  initialEmail?: string
  onClose: () => void
}

export default function EmailRegisterModal({
  open,
  initialEmail = '',
  onClose
}: EmailRegisterModalProps) {
  const [email, setEmail] = React.useState(initialEmail)

  React.useEffect(() => {
    setEmail(initialEmail)
  }, [initialEmail])

  if (!open) return null

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onClose()
  }

  return (
    <div
      className='fixed inset-0 z-[80] bg-neutral-900/40'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 flex items-center justify-center px-fluid-md'>
        <div
          role='dialog'
          aria-modal='true'
          aria-labelledby='email-register-heading'
          className='relative w-[min(26rem,92vw)] rounded-[1rem] bg-neutral-50 px-6 pb-6 pt-5 shadow-lg'
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type='button'
            onClick={onClose}
            aria-label='Cerrar'
            className='absolute right-5 top-5 flex size-[1.5rem] items-center justify-center text-neutral-600 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-full'
          >
            <CloseRounded fontSize='inherit' />
          </button>
          <div className='space-y-4'>
            <div>
              <p id='email-register-heading' className='text-title-md text-neutral-900'>
                Completa tu correo electrónico
              </p>
              <p className='mt-2 text-body-sm text-neutral-600'>
                Confirma la dirección con la que quieres crear tu cuenta.
              </p>
            </div>
            <form className='space-y-4' onSubmit={handleSubmit}>
              <label className='block text-body-sm text-neutral-900' htmlFor='register-email-input'>
                Correo electrónico
              </label>
              <input
                id='register-email-input'
                name='email'
                type='email'
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='h-[3rem] w-full rounded-[0.75rem] border border-neutral-300 bg-neutral-50 px-3 text-body-md text-neutral-900 outline-none focus:border-brand-300 focus:bg-brand-100'
              />
              <div className='flex justify-end gap-3 pt-2'>
                <button
                  type='button'
                  onClick={onClose}
                  className='inline-flex h-[2.5rem] items-center justify-center rounded-full border border-neutral-300 px-4 text-body-sm text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='inline-flex h-[2.5rem] items-center justify-center rounded-full border border-brand-500 bg-brand-500 px-5 text-body-sm font-medium text-brand-900 transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}


