'use client'

import EmailRegisterModal from '@/components/auth/EmailRegisterModal'
import RegisterLandingCard from '@/components/auth/RegisterLandingCard'
import React from 'react'

export default function RegisterPage() {
  const [emailPrefill, setEmailPrefill] = React.useState('')
  const [openEmailModal, setOpenEmailModal] = React.useState(false)

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
        <RegisterLandingCard onEmailSubmit={handleEmailSubmit} />
      </div>
      <EmailRegisterModal
        open={openEmailModal}
        initialEmail={emailPrefill}
        onClose={() => setOpenEmailModal(false)}
      />
    </main>
  )
}
