'use client'

import AddAPhotoRounded from '@mui/icons-material/AddAPhotoRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import React from 'react'

type Props = {
  onBack: () => void
  onContinue: () => void
}

export default function AddProfilePhotoStep({ onBack, onContinue }: Props) {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const onPickFile = () => fileInputRef.current?.click()
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setImageUrl(URL.createObjectURL(f))
  }

  return (
    <div className='absolute inset-0'>
      <button
        type='button'
        onClick={onBack}
        aria-label='Volver'
        className='absolute left-4 top-4 p-2 rounded-xl text-neutral-900'
      >
        <ArrowBackIosNewRounded className='size-5' />
      </button>
      <div
        className='absolute left-0 right-0 px-fluid-lg'
        style={{ top: 'var(--modal-header-top)' }}
      >
        <div
          style={{
            maxWidth: 'var(--modal-actions-width)',
            marginInline: 'auto'
          }}
        >
          <h2
            className='font-inter text-neutral-900'
            style={{
              fontSize: 'var(--text-title-modal)',
              lineHeight: 'var(--leading-title-modal)',
              fontWeight: 500
            }}
          >
            Añade una foto
          </h2>
          <p
            className='text-neutral-900'
            style={{
              marginTop: 'var(--spacing-gapsm)',
              fontSize: 'var(--text-body-xs)',
              lineHeight: 'var(--leading-body-xs)'
            }}
          >
            Sube una foto de tu cara, asegurate de que esta bien iluminada, esta
            imagen solo se mostrará a los miembros del equipo y a tu
            administrador.
          </p>

          <div
            className='grid place-items-center'
            style={{ marginTop: 'var(--modal-copy-to-first-gap)' }}
          >
            <button
              type='button'
              onClick={onPickFile}
              className='rounded-full bg-[var(--color-neutral-200)] grid place-items-center cursor-pointer'
              style={{ width: '14rem', height: '14rem' }}
              aria-label='Añadir foto'
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt='preview'
                  className='rounded-full object-cover w-full h-full'
                />
              ) : (
                <AddAPhotoRounded
                  className='text-[var(--color-neutral-600)]'
                  style={{ width: '6rem', height: '6rem' }}
                />
              )}
            </button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              hidden
              onChange={onFileChange}
            />
          </div>

          <div
            className='flex items-center justify-center gap-gapsm'
            style={{ marginTop: 'var(--form-field-gap-lg)' }}
          >
            <AddRounded className='text-neutral-900' />
            <button
              type='button'
              onClick={onPickFile}
              className='text-body-md text-neutral-900'
            >
              Añadir desde la biblioteca
            </button>
          </div>

          <div
            style={{
              marginTop: 'var(--modal-cta-top-gap)',
              maxWidth: 'var(--modal-actions-width)',
              marginInline: 'auto'
            }}
          >
            <button
              type='button'
              onClick={onContinue}
              className='w-full rounded-[var(--radius-pill)] grid place-items-center bg-brand-500 border border-[var(--color-border-default)] text-brand-900 text-body-md font-inter'
              style={{ height: 'var(--modal-cta-height)' }}
            >
              Continuar
            </button>
            <p
              className='text-center text-label-sm text-neutral-900'
              style={{ marginTop: 'var(--modal-legal-top-gap)' }}
            >
              Al continuar esta aceptando nuestros{' '}
              <a className='text-brand-500' href='#'>
                términos y condiciones
              </a>{' '}
              y la{' '}
              <a className='text-brand-500' href='#'>
                política de privacidad
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
