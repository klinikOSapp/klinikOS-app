'use client'

import {
  AddAPhotoRounded,
  PhotoCameraRounded,
  UploadRounded
} from '@/components/icons/md3'
import React from 'react'

export interface AvatarImageDropdownProps {
  onCaptureFromCamera?: (file: File) => void
  onUploadFromDevice?: (file: File) => void
  className?: string
  triggerClassName?: string
  triggerIconClassName?: string
  previewUrl?: string
}

export default function AvatarImageDropdown({
  onCaptureFromCamera,
  onUploadFromDevice,
  className,
  triggerClassName,
  triggerIconClassName,
  previewUrl
}: AvatarImageDropdownProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Camera state
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

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

  React.useEffect(() => {
    return () => {
      // Cleanup any active stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        // Older TS may not know srcObject; type assert
        ;(videoRef.current as HTMLVideoElement).srcObject = stream
        await videoRef.current.play()
      }
      setCameraOpen(true)
    } catch (e) {
      console.error('No se pudo acceder a la cámara', e)
    }
  }

  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video) return
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], 'capture.jpg', {
          type: blob.type || 'image/jpeg'
        })
        onCaptureFromCamera?.(file)
        closeCamera()
      },
      'image/jpeg',
      0.92
    )
  }

  function triggerUploadDialog() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onUploadFromDevice?.(f)
    // Reset the input so the same file can be selected again if desired
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

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
          'relative overflow-hidden size-8 grid place-items-center rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-200)] hover:border-[var(--color-brand-200)] active:bg-[var(--color-brand-900)] active:text-[var(--color-neutral-50)] active:border-[var(--color-brand-900)] shadow-cta/0'
        }
        aria-label='Añadir imagen'
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=''
            className='absolute inset-0 w-full h-full object-cover rounded-[inherit]'
          />
        ) : null}
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
              // Open camera flow
              openCamera()
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
              triggerUploadDialog()
              setMenuOpen(false)
            }}
            className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)]'
          >
            <UploadRounded className='size-5' />
            <span className='text-body-md'>Subir desde el equipo</span>
          </button>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />

      {/* Camera overlay */}
      {cameraOpen && (
        <div className='fixed inset-0 z-[100] bg-black/50 grid place-items-center'>
          <div className='bg-[var(--color-surface-modal,#fff)] rounded-[1rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] w-[min(90vw,640px)]'>
            <div className='p-3 border-b border-[var(--color-neutral-300)]'>
              <p className='text-body-md text-[var(--color-neutral-900)]'>
                Cámara
              </p>
            </div>
            <div className='p-3'>
              <video
                ref={videoRef}
                className='w-full rounded bg-black'
                playsInline
                muted
              />
            </div>
            <div className='p-3 flex justify-end gap-2 border-t border-[var(--color-neutral-300)]'>
              <button
                type='button'
                className='h-10 px-4 rounded text-body-sm text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
                onClick={closeCamera}
              >
                Cancelar
              </button>
              <button
                type='button'
                className='h-10 px-4 rounded text-body-sm text-[var(--color-brand-900)] bg-[var(--color-brand-300)] hover:bg-[var(--color-brand-200)]'
                onClick={capturePhoto}
              >
                Capturar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
