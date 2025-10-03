'use client'

import React from 'react'
import AddRounded from '@mui/icons-material/AddRounded'

export interface CTANavProps {
  label: string
  onClick?: () => void
  menuItems?: { id: string; label: string; onClick?: () => void }[]
}

export default function CTANav({ label, onClick, menuItems }: CTANavProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const hasMenu = Boolean(menuItems && menuItems.length)

  React.useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current
      if (!el) return
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  const cancelClose = () => {}

  return (
    <div
      ref={rootRef}
      className='relative'
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        const next = e.relatedTarget as Node | null
        if (!next || !e.currentTarget.contains(next)) setOpen(false)
      }}
    >
      <button
        type='button'
        onClick={onClick}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className='bg-[var(--color-neutral-50)] rounded-[var(--radius-xl)] shadow-[var(--shadow-cta)] px-4 h-[var(--spacing-cta)] inline-flex items-center gap-[var(--spacing-gapsm)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-200)] focus:bg-[var(--color-brand-200)] active:bg-[var(--color-brand-900)] active:text-[var(--color-neutral-50)] transition-colors duration-150 ease-out'
        aria-label={label}
        aria-haspopup={hasMenu ? 'menu' : undefined}
        aria-expanded={hasMenu ? open : undefined}
      >
        <AddRounded className='size-5' aria-hidden='true' />
        <span className='font-inter text-title-md'>{label}</span>
      </button>

      {hasMenu && (
        <div
          role='menu'
          className={[
            'absolute left-0 top-full w-48 rounded-lg bg-[var(--color-neutral-50)] shadow-[var(--shadow-cta)] z-10 py-2 inline-flex flex-col justify-center items-start',
            open ? 'block' : 'hidden'
          ].join(' ')}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {menuItems!.map((mi) => (
            <button
              key={mi.id}
              type='button'
              role='menuitem'
              onClick={() => {
                mi.onClick?.()
                setOpen(false)
              }}
              className='self-stretch px-3 py-2 bg-[var(--color-neutral-50)] inline-flex justify-start items-center gap-2 rounded-[8px] text-left hover:bg-[var(--color-brand-200)]'
            >
              <span className='text-[var(--color-neutral-900)] text-base font-normal leading-normal'>
                {mi.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
