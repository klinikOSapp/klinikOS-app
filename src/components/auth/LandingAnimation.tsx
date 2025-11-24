'use client'

import React from 'react'

const OFFSET = 'calc(var(--landing-hero-size) * 0.532)'

export default function LandingAnimation() {
  const segments = [
    { top: '0', left: '0', rotation: '0deg', delay: '0s' },
    { top: '0', left: OFFSET, rotation: '90deg', delay: '0.12s' },
    {
      top: OFFSET,
      left: '0',
      rotation: '-90deg',
      delay: '0.24s'
    }
  ] as const

  return (
    <div className='logo-animation' aria-hidden>
      <span className='logo-animation__glow' />
      {segments.map((segment) => (
        <span
          key={`${segment.top}-${segment.left}`}
          className='logo-animation__segment logo-animation__segment--outline'
          style={
            {
              top: segment.top,
              left: segment.left,
              '--la-delay': segment.delay,
              '--la-rotation': segment.rotation
            } as React.CSSProperties
          }
        />
      ))}
      <span
        className='logo-animation__segment logo-animation__segment--filled'
        style={
          {
            top: OFFSET,
            left: OFFSET,
            '--la-delay': '0.36s'
          } as React.CSSProperties
        }
      />
    </div>
  )
}

