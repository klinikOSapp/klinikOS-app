'use client'

import Image from 'next/image'
import React from 'react'

const SOCIAL_OPTIONS = [
  {
    label: 'Continuar con Google',
    iconSrc: '/google-icon-logo-svgrepo-com.svg',
    alt: 'Google'
  }
] as const

type RegisterLandingCardProps = {
  onEmailSubmit?: (email: string) => void
}

export default function RegisterLandingCard({
  onEmailSubmit
}: RegisterLandingCardProps) {
  const [email, setEmail] = React.useState('')

  const handleEmailSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onEmailSubmit?.(email)
      setEmail('')
    },
    [email, onEmailSubmit]
  )

  return (
    <div
      className='relative mx-auto w-full overflow-hidden backdrop-blur-[var(--blur-landing)] bg-[var(--color-surface-modal)]'
      style={{
        width: 'var(--landing-card-width)',
        height: 'var(--landing-card-height)',
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-landing-card)'
      }}
    >
      <div
        className='flex h-full flex-col items-center bg-[var(--color-surface-modal)] text-center'
        style={{
          paddingInline: '2.25rem', // 36px
          paddingTop: '2.98125rem', // 47.7px
          paddingBottom: '3.6rem' // 57.6px
        }}
      >
        <Image
          src='/Logo login.svg'
          alt='Logo klinikOS'
          width={0}
          height={0}
          style={{
            width: 'var(--landing-hero-size)',
            height: 'auto'
          }}
          priority
        />

        <div style={{ marginTop: '1.85625rem' }}>
          <h1
            className='font-inter text-neutral-900'
            style={{
              fontSize: 'var(--text-title-landing)',
              lineHeight: 'var(--leading-title-landing)',
              fontWeight: 700
            }}
          >
            Crear o inicia sesión
          </h1>
          <p
            className='text-body-md text-neutral-900'
            style={{
              marginTop: '0.45rem',
              maxWidth: '19.575rem' // 313.2px
            }}
          >
            Únete al software de gestión que mejor se adapta a los profesionales
            sanitarios
          </p>
        </div>

        <div
          style={{
            marginTop: '1.85625rem', // 29.7px
            width: 'var(--landing-actions-width)'
          }}
          className='flex w-full flex-col items-stretch'
        >
          <div className='flex flex-col gap-[1.125rem]'>
            {SOCIAL_OPTIONS.map((option) => (
              <button
                key={option.label}
                type='button'
                className='bg-[#f4f8fa] text-body-md font-inter text-neutral-900 shadow-[var(--shadow-button-soft)] cursor-pointer'
                style={{
                  height: 'var(--landing-cta-height)',
                  borderRadius: '7.65rem' // 122.4px
                }}
              >
                <span className='inline-flex items-center justify-center gap-[0.5rem]'>
                  <Image
                    src={option.iconSrc}
                    alt={option.alt}
                    width={24}
                    height={24}
                  />
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          <div
            className='flex items-center justify-center text-body-md text-neutral-900'
            style={{ marginTop: '1.8rem' }}
          >
            <span className='h-px flex-1 bg-neutral-300' />
            <span className='px-[0.84375rem]'>o</span>
            <span className='h-px flex-1 bg-neutral-300' />
          </div>

          <form
            onSubmit={handleEmailSubmit}
            className='grid'
            style={{ marginTop: '1.29375rem', gap: '0.675rem' }}
          >
            <label htmlFor='register-email' className='sr-only'>
              Correo electrónico
            </label>
            <div
              className='flex items-center border border-[#cbd3d9] bg-[#f8fafb]'
              style={{
                height: 'var(--landing-cta-height)',
                borderRadius: '7.65rem',
                paddingInline: '0.9rem'
              }}
            >
              <input
                id='register-email'
                type='email'
                aria-label='Correo electrónico'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='Correo electrónico'
                className='w-full bg-transparent text-body-md text-neutral-900 placeholder:text-[#6d7783] outline-none'
              />
            </div>

            <button
              type='submit'
              className='w-full border border-[#cbd3d9] bg-brand-500 text-body-md font-inter text-brand-900 cursor-pointer'
              style={{
                height: 'var(--landing-cta-height)',
                borderRadius: '7.65rem'
              }}
            >
              Continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
