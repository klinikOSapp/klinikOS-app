'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import LandingAnimation from '@/components/auth/LandingAnimation'

export default function PreAuthLanding() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.replace('/pacientes')
      } else {
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router])

  // Show loading animation while checking auth
  return (
    <main
      className='relative min-h-[100dvh] w-full overflow-hidden'
      style={{ backgroundImage: 'var(--prelogin-bg-gradient)' }}
    >
      <div className='absolute inset-0 grid place-items-center'>
        <LandingAnimation />
      </div>
    </main>
  )
}
