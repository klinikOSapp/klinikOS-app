'use client'

import { useEffect, useState } from 'react'

/**
 * OrientationLock Component
 * 
 * Blocks portrait orientation on tablets and mobile devices.
 * Shows a fullscreen overlay asking the user to rotate their device.
 * 
 * Uses three strategies:
 * 1. Screen Orientation API (when available and in fullscreen/PWA)
 * 2. CSS media query detection for portrait mode
 * 3. Visual overlay for unsupported browsers
 */
export default function OrientationLock() {
  const [isPortrait, setIsPortrait] = useState(false)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)

  useEffect(() => {
    // Check if device is mobile or tablet (not desktop)
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent)
      // Also check screen size - tablets typically have screens < 1024px in one dimension
      const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 1024
      
      setIsMobileOrTablet((isTouchDevice && isSmallScreen) || isMobile)
    }

    // Check current orientation
    const checkOrientation = () => {
      // Use Screen Orientation API if available
      if (screen.orientation) {
        const isPortraitOrientation = screen.orientation.type.includes('portrait')
        setIsPortrait(isPortraitOrientation)
      } else {
        // Fallback: check window dimensions
        setIsPortrait(window.innerHeight > window.innerWidth)
      }
    }

    // Try to lock orientation using Screen Orientation API
    const lockOrientation = async () => {
      try {
        if (screen.orientation && 'lock' in screen.orientation) {
          const lockFn = screen.orientation.lock as (orientation: string) => Promise<void>
          await lockFn('landscape')
        }
      } catch (error) {
        // Lock failed - probably not in fullscreen or PWA mode
        // The overlay will handle this case
        console.log('Orientation lock not available:', error)
      }
    }

    // Initial checks
    checkDevice()
    checkOrientation()
    lockOrientation()

    // Listen for orientation changes
    const handleOrientationChange = () => {
      checkOrientation()
    }

    const handleResize = () => {
      checkDevice()
      checkOrientation()
    }

    // Add event listeners
    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleOrientationChange)
      }
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  // Only show overlay on mobile/tablet devices in portrait mode
  if (!isMobileOrTablet || !isPortrait) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-[#0D4C54] flex flex-col items-center justify-center p-8"
      style={{ touchAction: 'none' }}
    >
      {/* Rotate icon */}
      <div className="mb-8 animate-pulse">
        <svg 
          width="120" 
          height="120" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="text-white"
        >
          {/* Phone outline */}
          <rect 
            x="7" 
            y="4" 
            width="10" 
            height="16" 
            rx="2" 
            stroke="currentColor" 
            strokeWidth="1.5"
            fill="none"
          />
          {/* Screen */}
          <rect 
            x="8.5" 
            y="6" 
            width="7" 
            height="10" 
            fill="currentColor" 
            opacity="0.3"
          />
          {/* Rotation arrow */}
          <path 
            d="M2 12C2 7.58172 5.58172 4 10 4" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d="M10 1L10 4L7 4" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <path 
            d="M22 12C22 16.4183 18.4183 20 14 20" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            fill="none"
          />
          <path 
            d="M14 23L14 20L17 20" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Logo */}
      <div className="mb-6">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M24 4L4 14V34L24 44L44 34V14L24 4Z" 
            fill="white" 
            fillOpacity="0.1" 
            stroke="white" 
            strokeWidth="2"
          />
          <path 
            d="M24 14V34M14 24H34" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Text */}
      <h2 className="text-white text-2xl font-semibold mb-3 text-center">
        Gira tu dispositivo
      </h2>
      <p className="text-white/80 text-base text-center max-w-xs">
        klinikOS está optimizado para usarse en modo horizontal (landscape)
      </p>

      {/* Animated hint */}
      <div className="mt-8 flex items-center gap-2 text-white/60 text-sm">
        <span className="inline-block animate-bounce">↻</span>
        <span>Rota 90°</span>
      </div>
    </div>
  )
}
