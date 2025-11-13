'use client'

import CloseRounded from '@mui/icons-material/CloseRounded'
import UploadFileRounded from '@mui/icons-material/UploadFileRounded'
import React from 'react'

export interface UploadConsentModalProps {
  open: boolean
  onClose?: () => void
  onFileSelected?: (file: File) => void
  onError?: (message: string) => void
  patientId?: string
}

export default function UploadConsentModal({
  open,
  onClose,
  onFileSelected,
  onError
}: UploadConsentModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragInfo, setDragInfo] = React.useState<{
    name: string
    size: number
  } | null>(null)

  if (!open) return null

  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

  function validateFile(file: File): string | null {
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    const isImage = file.type.startsWith('image/')
    if (!isPdf && !isImage) return 'Formato no soportado. Sube un PDF o imagen.'
    if (file.size > MAX_FILE_SIZE_BYTES) return 'El archivo supera 20MB.'
    return null
  }

  function handleFileList(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    const err = validateFile(f)
    if (err) {
      onError?.(err)
      return
    }
    onFileSelected?.(f)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setDragInfo(null)
    handleFileList(e.dataTransfer.files)
  }

  function formatSize(bytes: number) {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${bytes} B`
  }

  return (
    <div className='fixed inset-0 z-[100] bg-black/50 grid place-items-center'>
      <div className='bg-[var(--color-surface-modal,#fff)] rounded-[24px] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] w-[min(92vw,960px)] h-[min(85vh,640px)] relative overflow-hidden'>
        <button
          type='button'
          aria-label='Cerrar'
          onClick={onClose}
          className='absolute top-4 right-4 size-8 grid place-items-center text-[var(--color-neutral-900)]'
        >
          <CloseRounded className='size-6' />
        </button>

        <div className='px-16 pt-14 pb-8 overflow-auto h-full'>
          <p className='text-title-sm text-[var(--color-neutral-900)]'>
            Consentimientos
          </p>
          <h2 className='text-[44px] leading-[52px] font-normal text-[var(--color-neutral-900)] mt-2'>
            Subir consentimiento
          </h2>
          <p className='text-body-md text-[var(--color-neutral-900)] mt-2 max-w-[620px]'>
            Puedes subir un archivo sin firmar para enviarlo al paciente a
            través de la plataforma, cuando él te lo envíe firmado podrás
            actualizarlo
          </p>

          <div
            className={[
              'mt-8 rounded-[16px] border-2 border-dashed px-20 py-24 flex flex-col items-center gap-8 bg-[var(--color-neutral-50)]',
              isDragging
                ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-0)]'
                : 'border-[var(--color-neutral-300)]'
            ].join(' ')}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
              const items = e.dataTransfer?.items
              if (items && items.length > 0) {
                const it = items[0]
                if (it.kind === 'file') {
                  const f = it.getAsFile()
                  if (f) setDragInfo({ name: f.name, size: f.size })
                }
              }
            }}
            onDragLeave={() => {
              setIsDragging(false)
              setDragInfo(null)
            }}
            onDrop={onDrop}
            role='region'
            aria-label='Zona para arrastrar y soltar archivos'
          >
            <UploadFileRounded className='size-20 text-[var(--color-neutral-900)]' />
            <p className='text-[18px] leading-[28px] text-[var(--color-neutral-900)]'>
              Subir archivo
            </p>
            {dragInfo && (
              <p className='text-body-md text-[var(--color-neutral-900)]'>
                {dragInfo.name} — {formatSize(dragInfo.size)}
              </p>
            )}
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='border border-[var(--color-neutral-300)] rounded-[24px] px-3 py-2 text-[18px] leading-[28px] text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
            >
              Seleccionar de tu dispositivo
            </button>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              onChange={(e) => {
                handleFileList(e.target.files)
                if (e.target) e.target.value = ''
              }}
              accept='application/pdf,image/*'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
