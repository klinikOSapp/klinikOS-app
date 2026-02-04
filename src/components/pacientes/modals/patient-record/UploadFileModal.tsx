'use client'

import {
  CloseRounded,
  ImageRounded,
  UploadFileRounded
} from '@/components/icons/md3'
import React from 'react'

export type UploadFileType = 'document' | 'image'

export interface UploadFileModalProps {
  open: boolean
  type: UploadFileType
  onClose?: () => void
  onFileSelected?: (file: File, type: UploadFileType) => void
  onError?: (message: string) => void
}

export default function UploadFileModal({
  open,
  type,
  onClose,
  onFileSelected,
  onError
}: UploadFileModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragInfo, setDragInfo] = React.useState<{
    name: string
    size: number
  } | null>(null)

  if (!open) return null

  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20MB

  const isImage = type === 'image'

  const config = {
    document: {
      title: 'Archivos adjuntos',
      subtitle: 'Añadir documento',
      description:
        'Sube un documento clínico para anexarlo a la visita. Los documentos subidos aquí también se guardarán en la sección de documentos del paciente.',
      accept: 'application/pdf,image/*',
      validateType: (file: File) => {
        const isPdf =
          file.type === 'application/pdf' ||
          file.name.toLowerCase().endsWith('.pdf')
        const isImg = file.type.startsWith('image/')
        if (!isPdf && !isImg)
          return 'Formato no soportado. Sube un PDF o imagen.'
        return null
      }
    },
    image: {
      title: 'Imágenes',
      subtitle: 'Subir imagen',
      description:
        'Sube una imagen clínica del paciente. Esta imagen también se guardará en la sección de imágenes del paciente.',
      accept: 'image/*',
      validateType: (file: File) => {
        const isImg = file.type.startsWith('image/')
        if (!isImg)
          return 'Formato no soportado. Sube una imagen (PNG, JPG, etc.).'
        return null
      }
    }
  }

  const currentConfig = config[type]

  function validateFile(file: File): string | null {
    const typeError = currentConfig.validateType(file)
    if (typeError) return typeError
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
    onFileSelected?.(f, type)
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
      <div className='bg-[var(--color-surface-modal,#fff)] rounded-2xl border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] w-[min(92vw,560px)] relative'>
        <button
          type='button'
          aria-label='Cerrar'
          onClick={onClose}
          className='absolute top-4 right-4 size-8 grid place-items-center text-[var(--color-neutral-900)] cursor-pointer hover:opacity-70 transition-opacity z-10'
        >
          <CloseRounded className='size-5' />
        </button>

        <div className='px-8 pt-8 pb-6'>
          <p className='text-label-md text-[var(--color-neutral-500)]'>
            {currentConfig.title}
          </p>
          <h2 className='font-inter text-title-lg font-medium text-[var(--color-neutral-900)] mt-1'>
            {currentConfig.subtitle}
          </h2>
          <p className='text-body-sm text-[var(--color-neutral-600)] mt-2'>
            {currentConfig.description}
          </p>

          <div
            className={[
              'mt-5 rounded-xl border-2 border-dashed px-8 py-10 flex flex-col items-center gap-4 bg-[var(--color-neutral-50)]',
              isDragging
                ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]'
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
            {isImage ? (
              <ImageRounded className='size-12 text-[var(--color-neutral-400)]' />
            ) : (
              <UploadFileRounded className='size-12 text-[var(--color-neutral-400)]' />
            )}
            <p className='font-inter text-body-md text-[var(--color-neutral-700)]'>
              {isImage
                ? 'Arrastra una imagen aquí'
                : 'Arrastra un archivo aquí'}
            </p>
            {dragInfo && (
              <p className='text-body-sm text-[var(--color-neutral-600)]'>
                {dragInfo.name} — {formatSize(dragInfo.size)}
              </p>
            )}
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='border border-[var(--color-neutral-300)] rounded-full px-4 py-2 font-inter text-body-sm text-[var(--color-neutral-700)] hover:bg-white cursor-pointer transition-colors'
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
              accept={currentConfig.accept}
            />
          </div>

          {/* Info about where the file will be saved */}
          <div className='mt-4 p-3 bg-[var(--color-info-50)] border border-[var(--color-info-200)] rounded-lg'>
            <p className='text-label-sm text-[var(--color-info-700)]'>
              {isImage ? (
                <>
                  <strong>Nota:</strong> La imagen se guardará automáticamente
                  en la sección de &quot;Imágenes&quot; del paciente.
                </>
              ) : (
                <>
                  <strong>Nota:</strong> El documento se guardará
                  automáticamente en la sección de &quot;Documentos&quot; del
                  paciente.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
