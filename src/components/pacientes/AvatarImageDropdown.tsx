'use client'

import AddAPhotoRounded from '@mui/icons-material/AddAPhotoRounded'
import PhotoCameraRounded from '@mui/icons-material/PhotoCameraRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import React from 'react'

export interface AvatarImageDropdownProps {
  onCaptureFromCamera?: () => void
  onUploadFromDevice?: () => void
  className?: string
  triggerClassName?: string
  triggerIconClassName?: string
}

export default function AvatarImageDropdown({
  onCaptureFromCamera,
  onUploadFromDevice,
  className,
  triggerClassName,
  triggerIconClassName
}: AvatarImageDropdownProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  return (
    <div
      ref={containerRef}
      className={['relative', className].filter(Boolean).join(' ')}
    >
      <button
        type='button'
        aria-haspopup='menu'
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className={
          triggerClassName ||
          'size-8 grid place-items-center rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-200)] hover:border-[var(--color-brand-200)] active:bg-[var(--color-brand-900)] active:text-[var(--color-neutral-50)] active:border-[var(--color-brand-900)] shadow-cta/0'
        }
        aria-label='Añadir imagen'
      >
        <AddAPhotoRounded className={triggerIconClassName || 'size-5'} />
      </button>

      {menuOpen && (
        <div
          role='menu'
          className='absolute right-0 mt-2 w-60 rounded-lg bg-[var(--color-neutral-50)] shadow-[var(--shadow-cta)] border border-[var(--color-neutral-200)] p-2 z-10'
        >
          <button
            type='button'
            role='menuitem'
            onClick={() => {
              onCaptureFromCamera?.()
              setMenuOpen(false)
            }}
            className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)]'
          >
            <PhotoCameraRounded className='size-5' />
            <span className='text-body-md'>Cámara</span>
          </button>
          <button
            type='button'
            role='menuitem'
            onClick={() => {
              onUploadFromDevice?.()
              setMenuOpen(false)
            }}
            className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)]'
          >
            <UploadRounded className='size-5' />
            <span className='text-body-md'>Subir desde el equipo</span>
          </button>
        </div>
      )}
    </div>
  )
}
