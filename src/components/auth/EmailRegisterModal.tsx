'use client'

import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import React from 'react'
import AddProfilePhotoStep from './AddProfilePhotoStep'

type EmailRegisterModalProps = {
  open: boolean
  onClose: () => void
  initialEmail?: string
}

export default function EmailRegisterModal({
  open,
  onClose,
  initialEmail
}: EmailRegisterModalProps) {
  const [name, setName] = React.useState('')
  const [surname, setSurname] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [passwordTouched, setPasswordTouched] = React.useState(false)
  const [step, setStep] = React.useState<'form' | 'photo'>('form')

  const isPasswordValid = React.useMemo(() => {
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-ZÁÉÍÓÚÜÑ]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[^\p{L}\p{N}\s]/u.test(password)

    return hasMinLength && hasUppercase && hasNumber && hasSymbol
  }, [password])

  const handleContinue = React.useCallback(() => {
    if (!isPasswordValid) {
      setPasswordTouched(true)
      return
    }
    setStep('photo')
  }, [isPasswordValid])

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

  React.useEffect(() => {
    if (open) {
      setEmail(initialEmail ?? '')
    }
  }, [initialEmail, open])

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
          className='backdrop-blur-[var(--blur-landing)] bg-[var(--color-surface-modal)] w-full relative overflow-hidden mx-auto'
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(var(--modal-card-width), 100%)',
            height: 'min(var(--modal-card-height), var(--modal-max-h))',
            borderRadius: 'var(--modal-radius-lg)',
            boxShadow: 'var(--modal-shadow)'
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
              className='absolute left-0 right-0 px-fluid-lg'
              style={{
                top: 'var(--modal-header-top)',
                maxWidth: 'var(--modal-actions-width)',
                marginInline: 'auto'
              }}
            >
              <h2
                className='font-inter text-neutral-900 text-left'
                style={{
                  fontSize: 'var(--text-title-modal)',
                  lineHeight: 'var(--leading-title-modal)',
                  fontWeight: 500
                }}
              >
                Bienvenido a KliniKOS
              </h2>
              <p
                className='text-neutral-900 text-left'
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
                className='grid'
                style={{
                  marginTop: 'var(--modal-copy-to-first-gap)',
                  maxWidth: 'var(--modal-actions-width)',
                  marginInline: 'auto',
                  rowGap: '2rem'
                }}
              >
                {/* Nombre */}
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-surface-modal)] flex items-center'
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
                      background: 'var(--color-surface-modal)'
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
                    className='border border-neutral-300 rounded-lg bg-[var(--color-surface-modal)] flex items-center'
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
                      background: 'var(--color-surface-modal)'
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
                    className='border border-neutral-300 rounded-lg bg-[var(--color-surface-modal)] flex items-center'
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
                      background: 'var(--color-surface-modal)'
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
                    className='border border-neutral-300 rounded-lg bg-[var(--color-surface-modal)] flex items-center'
                    style={{
                      height: 'var(--input-height-lg)',
                      padding: 'var(--input-padding-y) var(--input-padding-x)'
                    }}
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                      }}
                      onBlur={() => setPasswordTouched(true)}
                      placeholder='Al menos 8 caracteres'
                      className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-400'
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword((prev) => !prev)}
                      className='ml-3 text-neutral-600 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-modal)] rounded-full p-1'
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlined className='size-5' />
                      ) : (
                        <VisibilityOutlined className='size-5' />
                      )}
                    </button>
                  </div>
                  <div
                    className='absolute px-1'
                    style={{
                      top: 'var(--input-label-offset-y)',
                      left: 'var(--input-label-offset-x)',
                      background: 'var(--color-surface-modal)'
                    }}
                  >
                    <span className='text-body-sm text-neutral-900'>
                      Escoge una buena contraseña
                    </span>
                  </div>
                  <p
                    className={passwordTouched && !isPasswordValid ? 'text-error-600' : 'text-neutral-600'}
                    style={{
                      marginTop: 'var(--spacing-gapsm)',
                      fontSize: 'var(--text-body-xs)',
                      lineHeight: 'var(--leading-body-xs)'
                    }}
                    role='status'
                    aria-live='polite'
                  >
                    {passwordTouched && !isPasswordValid
                      ? 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 símbolo y 1 número.'
                      : 'Al menos 1 mayúscula, 1 símbolo y 1 número.'}
                  </p>
                </div>
              </div>

              <div
                style={{
                  marginTop: 'var(--modal-cta-top-gap)',
                  maxWidth: 'var(--modal-actions-width)',
                  marginInline: 'auto'
                }}
              >
                <button
                  type='button'
                  className='w-full rounded-[var(--radius-pill)] grid place-items-center bg-brand-500 border border-[var(--color-border-default)] text-brand-900 text-body-md font-inter disabled:bg-neutral-300 disabled:text-neutral-600 disabled:cursor-not-allowed'
                  style={{ height: 'var(--modal-cta-height)' }}
                  onClick={handleContinue}
                  disabled={!isPasswordValid}
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
