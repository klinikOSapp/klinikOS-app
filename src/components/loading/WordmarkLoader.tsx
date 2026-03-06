'use client'

import LandingAnimation from '@/components/auth/LandingAnimation'

interface WordmarkLoaderProps {
  isLoading: boolean
}

export default function WordmarkLoader({ isLoading }: WordmarkLoaderProps) {
  if (!isLoading) return null

  return (
    <div className="page-loading-overlay" aria-hidden="true">
      <div className="page-loading-logo">
        <LandingAnimation />
      </div>
    </div>
  )
}
