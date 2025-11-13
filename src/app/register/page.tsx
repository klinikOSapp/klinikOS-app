'use client'

import EmailRegisterModal from '@/components/auth/EmailRegisterModal'
import MailRounded from '@mui/icons-material/MailRounded'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// Replaced Figma-served icons with MD3 icons from MUI

export default function RegisterPage() {
  const [openEmailModal, setOpenEmailModal] = React.useState(false)
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/pacientes`
            : undefined
      }
    })
  }
  return (
    <main
      className='min-h-[100dvh] w-full relative overflow-hidden'
      style={{ backgroundImage: 'var(--prelogin-bg-gradient)' }}
    >
      <div className='absolute inset-0 grid place-items-center px-fluid-md'>
        <div
          className='backdrop-blur-[var(--blur-landing)] bg-[var(--color-surface-overlay)] w-full relative overflow-hidden mx-auto'
          style={{
            width: 'min(var(--modal-card-width), 100%)',
            height: 'min(var(--modal-card-height), var(--modal-max-h))',
            borderRadius: 'var(--modal-radius-lg)',
            boxShadow: 'var(--modal-shadow)'
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
              style={{
                width: 'var(--landing-hero-size)',
                height: 'auto',
                justifySelf: 'center'
              }}
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
                Únete al software de gestion que mejor se adapta a los
                profesionales sanitarios
              </p>
            </div>

            <div />

            <div
              className='w-full grid gap-gapmd justify-self-center'
              style={{ maxWidth: 'var(--modal-actions-width)' }}
            >
              {/* Apple */}
              <button
                type='button'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{
                  height: 'var(--modal-cta-height)',
                  boxShadow: 'var(--shadow-button-soft)'
                }}
              >
                <span className='inline-flex items-center gap-2'>
                  <Image
                    src='/apple-black-logo-svgrepo-com.svg'
                    alt='Apple'
                    width={24}
                    height={24}
                  />
                  Continuar con Apple
                </span>
              </button>

              {/* Google */}
              <button
                type='button'
                onClick={handleGoogle}
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{
                  height: 'var(--modal-cta-height)',
                  boxShadow: 'var(--shadow-button-soft)'
                }}
              >
                <span className='inline-flex items-center gap-2'>
                  <Image
                    src='/google-icon-logo-svgrepo-com.svg'
                    alt='Google'
                    width={24}
                    height={24}
                  />
                  Continuar con Google
                </span>
              </button>

              {/* Facebook */}
              <button
                type='button'
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{
                  height: 'var(--modal-cta-height)',
                  boxShadow: 'var(--shadow-button-soft)'
                }}
              >
                <span className='inline-flex items-center gap-2'>
                  <Image
                    src='/facebook-icon-logo-svgrepo-com.svg'
                    alt='Facebook'
                    width={24}
                    height={24}
                  />
                  Continuar con Facebook
                </span>
              </button>

              {/* Email */}
              <button
                type='button'
                onClick={() => setOpenEmailModal(true)}
                className='rounded-[var(--radius-pill)] grid place-items-center bg-neutral-100 text-neutral-900 text-body-md font-inter'
                style={{
                  height: 'var(--modal-cta-height)',
                  boxShadow: 'var(--shadow-button-soft)'
                }}
              >
                <span className='inline-flex items-center gap-2'>
                  <MailRounded className='w-6 h-6' />
                  Continuar con Email
                </span>
              </button>
            </div>

            <p className='w-full text-center text-[14px] leading-5 text-neutral-900'>
              Ya tienes una cuenta?{' '}
              <Link href='/login' className='text-brand-500'>
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
      <EmailRegisterModal
        open={openEmailModal}
        onClose={() => setOpenEmailModal(false)}
      />
    </main>
  )
}
