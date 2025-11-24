'use client'

import EmailRegisterModal from '@/components/auth/EmailRegisterModal'
import RegisterLandingCard from '@/components/auth/RegisterLandingCard'
import React from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [emailPrefill, setEmailPrefill] = React.useState('')
  const [openEmailModal, setOpenEmailModal] = React.useState(false)
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])

  const handleGoogle = React.useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/pacientes`
            : undefined
      }
    })
  }, [supabase])

  const handleEmailSubmit = React.useCallback((email: string) => {
    setEmailPrefill(email)
    setOpenEmailModal(true)
  }, [])

  return (
    <main
      className='relative min-h-[100dvh] w-full overflow-hidden'
      style={{ backgroundImage: 'var(--prelogin-bg-gradient)' }}
    >
      <div className='absolute inset-0 grid place-items-center px-fluid-md'>
        <RegisterLandingCard
          onEmailSubmit={handleEmailSubmit}
          onGoogleClick={handleGoogle}
        />
      </div>
      <EmailRegisterModal
        open={openEmailModal}
        initialEmail={emailPrefill}
        onClose={() => setOpenEmailModal(false)}
      />
    </main>
  )
}
