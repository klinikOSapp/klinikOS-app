'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  CLINIC_SELECTION_COOKIE_NAME,
  CLINIC_SELECTION_STORAGE_KEY
} from '@/lib/clinicSelection'
import LandingAnimation from '@/components/auth/LandingAnimation'

const CLINIC_ID_DEFAULT_PATIENTS = '0a62cf76-bfd0-4125-b8fe-860a1700da39'

export default function PreAuthLanding() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        let selectedClinicId: string | null = null
        try {
          selectedClinicId = localStorage.getItem(CLINIC_SELECTION_STORAGE_KEY)
        } catch {
          selectedClinicId = null
        }

        if (!selectedClinicId && typeof document !== 'undefined') {
          const cookieValue = document.cookie
            .split('; ')
            .find((entry) => entry.startsWith(`${CLINIC_SELECTION_COOKIE_NAME}=`))
            ?.split('=')[1]
          if (cookieValue) {
            selectedClinicId = decodeURIComponent(cookieValue)
          }
        }

        if (!selectedClinicId) {
          const { data: clinicIdsRaw } = await supabase.rpc('get_my_clinics')
          if (Array.isArray(clinicIdsRaw) && clinicIdsRaw.length > 0) {
            const first = clinicIdsRaw[0] as unknown
            if (typeof first === 'string') {
              selectedClinicId = first
            } else if (typeof first === 'number') {
              selectedClinicId = String(first)
            } else if (first && typeof first === 'object') {
              const seed = first as Record<string, unknown>
              selectedClinicId =
                (typeof seed.id === 'string' && seed.id) ||
                (typeof seed.clinic_id === 'string' && seed.clinic_id) ||
                null
            }
          }
        }

        if (selectedClinicId === CLINIC_ID_DEFAULT_PATIENTS) {
          router.replace('/pacientes')
        } else {
          router.replace('/agente-voz')
        }
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
