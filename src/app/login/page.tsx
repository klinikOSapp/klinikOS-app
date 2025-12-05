'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [rememberMe, setRememberMe] = React.useState(true)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  function validateEmail(value: string) {
    return /.+@.+\..+/.test(value)
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null)
    setIsGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/auth/callback`
              : undefined
        }
      })
      if (error) {
        setErrorMessage(error.message)
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Error al iniciar sesión con Google.')
    } finally {
      setIsGoogleLoading(false)
    }
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
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        setErrorMessage(error.message)
      } else {
        router.push('/pacientes')
      }
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Error al iniciar sesión.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className='min-h-[100dvh] w-full relative overflow-hidden'
      style={{ backgroundImage: 'var(--prelogin-bg-gradient)' }}
    >
      <div className='absolute inset-0 grid place-items-center px-fluid-md'>
        <div
          className='backdrop-blur-[var(--blur-landing)] bg-[var(--color-surface-overlay)] w-full relative mx-auto'
          style={{
            width: 'min(var(--modal-card-width), 100%)',
            borderRadius: 'var(--modal-radius-lg)',
            boxShadow: 'var(--modal-shadow)'
          }}
        >
          <div
            className='grid px-fluid-lg'
            style={{
              paddingTop: '1.5rem',
              rowGap: '0.75rem',
              paddingBottom: '1.5rem'
            }}
          >
            <div className='grid place-items-center'>
              <Image
                src='/Logo login.svg'
                alt='klinikOS'
                width={0}
                height={0}
                style={{ width: '5.5rem', height: 'auto' }}
              />
            </div>

            <div className='text-center'>
              <h1
                className='font-inter text-neutral-900'
                style={{
                  fontSize: '1.5rem',
                  lineHeight: '1.2',
                  fontWeight: 500
                }}
              >
                Accede a klinikOS
              </h1>
              <p className='mt-1 text-body-sm text-neutral-900'>
                Introduce tus credenciales para continuar
              </p>
            </div>

            <div
              className='grid gap-3 justify-self-center w-full'
              style={{ maxWidth: 'var(--modal-actions-width)' }}
            >
              {errorMessage ? (
                <div className='rounded-xl border border-error-200 bg-error-50 text-error-600 px-3 py-2 text-body-sm'>
                  {errorMessage}
                </div>
              ) : null}

              {/* Google Sign-In Button */}
              <button
                type='button'
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className='w-full flex items-center justify-center gap-3 rounded-[var(--radius-pill)] bg-[#f4f8fa] hover:bg-neutral-100 text-neutral-900 text-body-md font-inter shadow-[var(--shadow-button-soft)] disabled:opacity-70 disabled:cursor-not-allowed transition-colors'
                style={{ height: '2.75rem' }}
              >
                <Image
                  src='/google-icon-logo-svgrepo-com.svg'
                  alt='Google'
                  width={20}
                  height={20}
                />
                {isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}
              </button>

              {/* Divider */}
              <div className='flex items-center gap-3'>
                <span className='h-px flex-1 bg-neutral-300' />
                <span className='text-body-sm text-neutral-500'>o</span>
                <span className='h-px flex-1 bg-neutral-300' />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className='grid gap-3 justify-self-center w-full'
              style={{ maxWidth: 'var(--modal-actions-width)' }}
            >
              <div className='space-y-1'>
                <label
                  htmlFor='email'
                  className='text-label-sm text-neutral-700'
                >
                  Email
                </label>
                <div
                  className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-0)] flex items-center h-11 px-3'
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
                    className='w-full bg-transparent outline-none text-body-sm text-neutral-900 placeholder-neutral-500'
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <label
                  htmlFor='password'
                  className='text-label-sm text-neutral-700'
                >
                  Contraseña
                </label>
                <div className='relative'>
                  <div
                    className='border border-neutral-300 rounded-lg bg-[var(--color-neutral-0)] flex items-center h-11 px-3 pr-[5rem]'
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
                      className='w-full bg-transparent outline-none text-body-sm text-neutral-900 placeholder-neutral-500'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={() => setShowPassword((s) => !s)}
                    className='absolute inset-y-0 right-2 my-1 px-2 text-label-sm text-neutral-700 rounded-lg hover:bg-neutral-50 focus:outline-none'
                    aria-label={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <label className='flex items-center gap-2 text-label-sm text-neutral-700'>
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
                  className='text-label-sm text-brand-700 hover:text-brand-800'
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className='w-full rounded-[var(--radius-pill)] bg-brand-600 hover:bg-brand-700 text-neutral-0 text-body-sm font-inter shadow-cta disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-200 h-11'
              >
                {isLoading ? 'Accediendo…' : 'Acceder'}
              </button>
            </form>

            <p className='w-full text-center text-[13px] leading-5 text-neutral-900'>
              ¿No tienes cuenta?{' '}
              <Link href='/register' className='text-brand-500'>
                Crear una cuenta
              </Link>
            </p>

            <div className='text-center'>
              <span className='text-[11px] text-neutral-600'>
                Al continuar aceptas nuestros
              </span>{' '}
              <a
                href='#'
                className='text-[11px] text-brand-700 hover:text-brand-800'
              >
                Términos
              </a>{' '}
              <span className='text-[11px] text-neutral-600'>y</span>{' '}
              <a
                href='#'
                className='text-[11px] text-brand-700 hover:text-brand-800'
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
