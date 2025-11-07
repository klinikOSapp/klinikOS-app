'use client'

import Image from 'next/image'
import React from 'react'

export default function LoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(true)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  function validateEmail(value: string) {
    return /.+@.+\..+/.test(value)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    if (!validateEmail(email)) {
      setErrorMessage('Introduce un email válido.')
      return
    }
    if (!password) {
      setErrorMessage('La contraseña es obligatoria.')
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    setIsLoading(false)
    setErrorMessage('La autenticación aún no está conectada.')
  }

  return (
    <main className='min-h-[100dvh] w-full relative overflow-hidden bg-surface-app'>
      <div className='absolute inset-0 grid place-items-center px-fluid-md'>
        <div
          className='backdrop-blur-[var(--blur-landing)] bg-[var(--color-surface-modal)] w-full relative overflow-hidden mx-auto'
          style={{
            width: 'min(var(--landing-card-width), 100%)',
            height: 'min(var(--landing-card-height), var(--landing-max-h))',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-landing-card)'
          }}
        >
          <div
            className='h-full grid px-fluid-lg'
            style={{
              paddingTop: 'var(--landing-top-gap)',
              rowGap: 'var(--landing-gap-lg)',
              paddingBottom: 'var(--landing-bottom-gap)',
              gridTemplateRows: 'auto auto 1fr auto'
            }}
          >
            <div className='grid place-items-center'>
              <Image
                src='/Logo login.svg'
                alt='klinikOS'
                width={0}
                height={0}
                style={{ width: 'var(--landing-hero-size)', height: 'auto' }}
              />
            </div>

            <div className='text-center'>
              <h1 className='text-title-md font-inter text-neutral-900'>
                Accede a klinikOS
              </h1>
              <p className='mt-gapsm text-body-md text-neutral-900'>
                Introduce tus credenciales para continuar
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className='grid gap-gapmd justify-self-center w-full'
              style={{ maxWidth: 'var(--landing-actions-width)' }}
            >
              {errorMessage ? (
                <div className='rounded-xl border border-error-200 bg-error-50 text-error-600 px-fluid-md py-[0.5rem] text-body-sm'>
                  {errorMessage}
                </div>
              ) : null}

              <div className='space-y-gapsm'>
                <label
                  htmlFor='email'
                  className='text-label-md text-neutral-700'
                >
                  Email
                </label>
                <div
                  className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-0)] flex items-center'
                  style={{
                    height: 'var(--input-height-lg)',
                    padding: 'var(--input-padding-y) var(--input-padding-x)'
                  }}
                >
                  <input
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='tucuenta@ejemplo.com'
                    className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-500'
                  />
                </div>
              </div>

              <div className='space-y-gapsm'>
                <label
                  htmlFor='password'
                  className='text-label-md text-neutral-700'
                >
                  Contraseña
                </label>
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-0)] flex items-center pr-[6rem]'
                    style={{
                      height: 'var(--input-height-lg)',
                      padding: 'var(--input-padding-y) var(--input-padding-x)'
                    }}
                  >
                    <input
                      id='password'
                      name='password'
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='current-password'
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder='••••••••'
                      className='w-full bg-transparent outline-none text-body-md text-neutral-900 placeholder-neutral-500'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => setShowPassword((s) => !s)}
                    className='absolute inset-y-0 right-2 my-1 px-2 text-label-md text-neutral-700 rounded-xl hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-200'
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-gapsm text-label-md text-neutral-700'>
                  <input
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='size-4 accent-brand-600'
                  />
                  Recordarme
                </label>
                <a
                  href='#'
                  className='text-label-md text-brand-700 hover:text-brand-800'
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full rounded-[var(--radius-pill)] bg-brand-600 hover:bg-brand-700 text-neutral-0 text-body-md font-inter shadow-cta disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-200'
                style={{ height: 'var(--landing-cta-height)' }}
              >
                {isLoading ? 'Accediendo…' : 'Acceder'}
              </button>
            </form>

            <div className='text-center'>
              <span className='text-label-sm text-neutral-600'>
                Al continuar aceptas nuestros
              </span>{' '}
              <a
                href='#'
                className='text-label-sm text-brand-700 hover:text-brand-800'
              >
                Términos
              </a>{' '}
              <span className='text-label-sm text-neutral-600'>y</span>{' '}
              <a
                href='#'
                className='text-label-sm text-brand-700 hover:text-brand-800'
              >
                Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
