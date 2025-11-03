'use client'

import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import React from 'react'
import AddProfilePhotoStep from './AddProfilePhotoStep'

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
  const [step, setStep] = React.useState<'form' | 'photo'>('form')

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
      className='fixed inset-0 z-50 bg-transparent'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 flex items-center justify-center px-fluid-md'>
        <div
          role='dialog'
          aria-modal='true'
          className='backdrop-blur-[var(--blur-landing)] bg-[var(--color-surface-overlay)] w-full relative overflow-hidden mx-auto'
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(var(--landing-card-width), 100%)',
            height: 'min(var(--landing-card-height), var(--landing-max-h))',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--elevation-card-soft)'
          }}
        >
          {step === 'form' ? (
            <button
              type='button'
              onClick={onClose}
              className='absolute left-4 top-4 p-2 rounded-xl text-neutral-900'
              aria-label='Volver'
            >
              <ArrowBackIosNewRounded className='size-5' />
            </button>
          ) : null}

          {step === 'form' ? (
            <div
              className='absolute left-0 right-0 px-fluid-lg text-center'
              style={{
                top: 'var(--modal-header-top)',
                maxWidth: 'var(--landing-actions-width)',
                marginInline: 'auto'
              }}
            >
              <h2
                className='font-inter text-neutral-900'
                style={{
                  fontSize: 'var(--text-title-modal)',
                  lineHeight: 'var(--leading-title-modal)',
                  fontWeight: 500
                }}
              >
                Bienvenido a KliniKOS
              </h2>
              <p
                className='text-neutral-900'
                style={{
                  marginTop: 'var(--spacing-gapsm)',
                  fontSize: 'var(--text-body-xs)',
                  lineHeight: 'var(--leading-body-xs)'
                }}
              >
                Crea una cuenta para acceder al software, podrás gestionar a tus
                pacientes y a tu equipo, acceder a tu facturación y más.
              </p>

              <div
                className='space-y-4'
                style={{
                  marginTop: 'var(--modal-copy-to-first-gap)',
                  maxWidth: 'var(--landing-actions-width)',
                  marginInline: 'auto'
                }}
              >
                {/* Nombre */}
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] flex items-center'
                    style={{
                      height: 'var(--input-height-lg)',
                      padding: 'var(--input-padding-y) var(--input-padding-x)'
                    }}
                  >
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder='Introduce tu nombre'
                      className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                    />
                  </div>
                  <div
                    className='absolute px-1'
                    style={{
                      top: 'var(--input-label-offset-y)',
                      left: 'var(--input-label-offset-x)',
                      background: 'var(--color-neutral-50)'
                    }}
                  >
                    <span className='text-body-sm text-neutral-900'>
                      ¿Cómo te llamas?
                    </span>
                  </div>
                </div>

                {/* Apellidos */}
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] flex items-center'
                    style={{
                      height: 'var(--input-height-lg)',
                      padding: 'var(--input-padding-y) var(--input-padding-x)'
                    }}
                  >
                    <input
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder='Introduce tus apellidos'
                      className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                    />
                  </div>
                  <div
                    className='absolute px-1'
                    style={{
                      top: 'var(--input-label-offset-y)',
                      left: 'var(--input-label-offset-x)',
                      background: 'var(--color-neutral-50)'
                    }}
                  >
                    <span className='text-body-sm text-neutral-900'>
                      ¿Cuáles son tus apellidos?
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] flex items-center'
                    style={{
                      height: 'var(--input-height-lg)',
                      padding: 'var(--input-padding-y) var(--input-padding-x)'
                    }}
                  >
                    <input
                      type='email'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder='Introduce tu dirección de correo'
                      className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                    />
                  </div>
                  <div
                    className='absolute px-1'
                    style={{
                      top: 'var(--input-label-offset-y)',
                      left: 'var(--input-label-offset-x)',
                      background: 'var(--color-neutral-50)'
                    }}
                  >
                    <span className='text-body-sm text-neutral-900'>
                      ¿Cómo es tu email?
                    </span>
                  </div>
                </div>

                {/* Contraseña */}
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-50)] flex items-center'
                    style={{
                      height: 'var(--input-height-lg)',
                      padding: 'var(--input-padding-y) var(--input-padding-x)'
                    }}
                  >
                    <input
                      type='password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder='Al menos 8 caracteres'
                      className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                    />
                  </div>
                  <div
                    className='absolute px-1'
                    style={{
                      top: 'var(--input-label-offset-y)',
                      left: 'var(--input-label-offset-x)',
                      background: 'var(--color-neutral-50)'
                    }}
                  >
                    <span className='text-body-sm text-neutral-900'>
                      Escoge una buena contraseña
                    </span>
                  </div>
                  <p
                    className='text-neutral-600'
                    style={{
                      marginTop: 'var(--spacing-gapsm)',
                      fontSize: 'var(--text-body-xs)',
                      lineHeight: 'var(--leading-body-xs)'
                    }}
                  >
                    Al menos 1 mayúscula, 1 símbolo y 1 número.
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 'var(--modal-cta-top-gap)',
                  maxWidth: 'var(--landing-actions-width)',
                  marginInline: 'auto'
                }}
              >
                <button
                  type='button'
                  className='w-full rounded-[var(--radius-pill)] grid place-items-center bg-brand-500 border border-[var(--color-border-default)] text-brand-900 text-body-md font-inter'
                  style={{ height: 'var(--landing-cta-height)' }}
                  onClick={() => setStep('photo')}
                >
                  Continuar
                </button>
                <p
                  className='text-center text-label-sm text-neutral-900'
                  style={{ marginTop: 'var(--modal-legal-top-gap)' }}
                >
                  Al continuar esta aceptando nuestros{' '}
                  <a className='text-brand-500' href='#'>
                    términos y condiciones
                  </a>{' '}
                  y la{' '}
                  <a className='text-brand-500' href='#'>
                    política de privacidad
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <AddProfilePhotoStep
              onBack={() => setStep('form')}
              onContinue={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}
