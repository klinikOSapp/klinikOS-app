'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import EmailRegisterModal from '@/components/auth/EmailRegisterModal'

// Figma assets served locally by the desktop app (used only for visual parity)
const figmaAppleIcon = 'http://localhost:3845/assets/0df8d20f4d96579b2cd269f8d9b67bdd5c06edd9.svg'
const figmaGoogleIcon = 'http://localhost:3845/assets/83fe2bd93416bb7b298f60cbb9077f25ab371700.svg'
const figmaFacebookIcon = 'http://localhost:3845/assets/904147bc78bc92458bbf903333987262ff6f49c0.svg'
const figmaMailIcon = 'http://localhost:3845/assets/0a147363a9c63033d0c5ac966e79b493c85dd8dd.svg'

export default function RegisterPage() {
  const [openEmailModal, setOpenEmailModal] = React.useState(false)
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
                  fontWeight: 700
                }}
              >
                Crear una cuenta
              </h1>
              <p className='mt-gapsm text-body-md text-neutral-900'>
                Únete al software de gestion que mejor se adapta a los profesionales sanitarios
              </p>
            </div>

            <div />

            <div
              className='w-full grid gap-gapmd justify-self-center'
              style={{ maxWidth: 'var(--landing-actions-width)' }}
            >
              {/* Apple */}
              <button
                type='button'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)', boxShadow: 'var(--shadow-button-soft)' }}
              >
                <span className='inline-flex items-center gap-2'>
                  <img src={figmaAppleIcon} alt='' width={24} height={24} />
                  Continuar con Apple
                </span>
              </button>

              {/* Google */}
              <button
                type='button'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)', boxShadow: 'var(--shadow-button-soft)' }}
              >
                <span className='inline-flex items-center gap-2'>
                  <img src={figmaGoogleIcon} alt='' width={24} height={24} />
                  Continuar con Google
                </span>
              </button>

              {/* Facebook */}
              <button
                type='button'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)', boxShadow: 'var(--shadow-button-soft)' }}
              >
                <span className='inline-flex items-center gap-2'>
                  <img src={figmaFacebookIcon} alt='' width={24} height={24} />
                  Continuar con Facebook
                </span>
              </button>

              {/* Email */}
              <button
                type='button'
                onClick={() => setOpenEmailModal(true)}
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{ height: 'var(--landing-cta-height)', boxShadow: 'var(--shadow-button-soft)' }}
              >
                <span className='inline-flex items-center gap-2'>
                  <img src={figmaMailIcon} alt='' width={24} height={24} />
                  Continuar con Email
                </span>
              </button>
            </div>

            <p className='w-full text-center text-[14px] leading-5 text-neutral-900'>
              Ya tienes una cuenta?{' '}
              <Link href='/login' className='text-brand-500'>Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
      <EmailRegisterModal open={openEmailModal} onClose={() => setOpenEmailModal(false)} />
    </main>
  )
}


