'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function PreAuthLanding() {
  const [accepted, setAccepted] = React.useState(false)

  return (
    <main
      className='min-h-screen w-full relative overflow-hidden'
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(81,214,199,1) 0%, rgba(199,210,255,1) 100%)'
      }}
    >
      <div className='absolute inset-0 grid place-items-center px-fluid-md py-fluid-lg'>
        <div
          className='backdrop-blur-[var(--blur-landing)] bg-[rgba(248,250,251,0.8)] w-full relative overflow-hidden'
          style={{
            width: 'var(--landing-card-width)',
            height: 'var(--landing-card-height)',
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
              gridTemplateRows: 'auto auto 1fr auto auto'
            }}
          >
            <Image
              src='/Logo login.svg'
              alt='Logo klinikOS'
              width={0}
              height={0}
              style={{ width: 'var(--landing-hero-size)', height: 'auto', justifySelf: 'center' }}
              priority
            />

            <div className='text-center'>
              <h1
                className='font-inter text-neutral-900'
                style={{
                  fontSize: 'var(--text-title-landing)',
                  lineHeight: 'var(--leading-title-landing)',
                  fontWeight: 500
                }}
              >
                Bienvenido a kliniKOS
              </h1>
              <p className='mt-gapsm text-body-md text-neutral-900'>
                Tu software de gestión de clínicas
              </p>
            </div>

            <div />

            <div
              className='w-full grid gap-gapmd justify-self-center'
              style={{ maxWidth: 'var(--landing-actions-width)' }}
            >
              <Link
                href='/register'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-brand-500 border border-neutral-300 text-brand-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)' }}
              >
                Crear una cuenta
              </Link>
              <Link
                href='/login'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)', boxShadow: 'var(--shadow-button-soft)' }}
              >
                Iniciar sesión
              </Link>
            </div>

            <div
              className='w-full flex items-start gap-gapsm justify-self-center'
              style={{ maxWidth: 'var(--landing-actions-width)' }}
            >
              <input
                id='accept'
                type='checkbox'
                className='mt-[2px] size-4 accent-brand-600'
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <label htmlFor='accept' className='text-label-sm text-neutral-900'>
                Haciendo click en la casilla acepto los{' '}
                <a className='text-brand-500 hover:underline' href='#'>términos y condiciones</a>{' '}y la{' '}
                <a className='text-brand-500 hover:underline' href='#'>política de privacidad</a>
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}


