'use client'

import React from 'react'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'

type EmailRegisterModalProps = {
  open: boolean
  onClose: () => void
}

export default function EmailRegisterModal({
  open,
  onClose
}: EmailRegisterModalProps) {
  const [name, setName] = React.useState('')
  const [surname, setSurname] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 grid place-items-center px-fluid-md py-fluid-lg'>
        <div
          role='dialog'
          aria-modal='true'
          className='backdrop-blur-[var(--blur-landing)] bg-[rgba(248,250,251,0.8)] w-full relative overflow-hidden'
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'var(--landing-card-width)',
            height: 'var(--landing-card-height)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-landing-card)'
          }}
        >
          <button
            type='button'
            onClick={onClose}
            className='absolute left-4 top-4 p-2 rounded-xl text-neutral-900'
            aria-label='Volver'
          >
            <ArrowBackIosNewRounded className='size-5' />
          </button>

          <div className='absolute left-0 right-0 px-fluid-lg' style={{ top: 64 }}>
            <h2 className='text-[22px] leading-7 font-medium text-neutral-900'>
              Bienvenido a KliniKOS
            </h2>
            <p className='mt-1 text-[12px] leading-4 text-neutral-900'>
              Crea una cuenta para acceder al software, podrás gestionar a tus pacientes y a tu equipo, acceder a tu facturación y más.
            </p>

            <div className='mt-6 space-y-4' style={{ maxWidth: 'var(--landing-actions-width)' }}>
              {/* Nombre */}
              <div className='relative'>
                <div className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] px-2.5 py-2 h-14 flex items-center'>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Introduce tu nombre'
                    className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                  />
                </div>
                <div className='absolute -top-2 left-2 bg-[var(--color-neutral-50)] px-1'>
                  <span className='text-[14px] leading-5 text-neutral-900'>¿Cómo te llamas?</span>
                </div>
              </div>

              {/* Apellidos */}
              <div className='relative'>
                <div className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] px-2.5 py-2 h-14 flex items-center'>
                  <input
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder='Introduce tus apellidos'
                    className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                  />
                </div>
                <div className='absolute -top-2 left-2 bg-[var(--color-neutral-50)] px-1'>
                  <span className='text-[14px] leading-5 text-neutral-900'>¿Cuáles son tus apellidos?</span>
                </div>
              </div>

              {/* Email */}
              <div className='relative'>
                <div className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] px-2.5 py-2 h-14 flex items-center'>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Introduce tu dirección de correo'
                    className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                  />
                </div>
                <div className='absolute -top-2 left-2 bg-[var(--color-neutral-50)] px-1'>
                  <span className='text-[14px] leading-5 text-neutral-900'>¿Cómo es tu email?</span>
                </div>
              </div>

              {/* Contraseña */}
              <div className='relative'>
                <div className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] px-2.5 py-2 h-14 flex items-center'>
                  <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Al menos 8 caracteres'
                    className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                  />
                </div>
                <div className='absolute -top-2 left-2 bg-[var(--color-neutral-50)] px-1'>
                  <span className='text-[14px] leading-5 text-neutral-900'>Escoge una buena contraseña</span>
                </div>
                <p className='mt-2 text-[11px] leading-4 text-neutral-600'>
                  Al menos 1 mayúscula, 1 símbolo y 1 número.
                </p>
              </div>
            </div>

            <div className='mt-6' style={{ maxWidth: 'var(--landing-actions-width)' }}>
              <button
                type='button'
                className='w-full rounded-[var(--radius-pill)] grid place-items-center bg-brand-500 border border-neutral-300 text-brand-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)' }}
                onClick={() => {}}
              >
                Continuar
              </button>
              <p className='mt-3 text-center text-label-sm text-neutral-900'>
                Al continuar esta aceptando nuestros <a className='text-brand-500' href='#'>términos y condiciones</a> y la <a className='text-brand-500' href='#'>política de privacidad</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


