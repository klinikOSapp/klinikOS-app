'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import React from 'react'
import { ToggleInput } from './AddPatientInputs'

type Props = {
  imagenesMarketing: boolean
  onChangeImagenesMarketing: (v: boolean) => void
  derivacionFile: File | null
  onChangeDerivacionFile: (f: File | null) => void
  informesFile: File | null
  onChangeInformesFile: (f: File | null) => void
  rxFile: File | null
  onChangeRxFile: (f: File | null) => void
  fotosFile: File | null
  onChangeFotosFile: (f: File | null) => void
}

export default function AddPatientStepConsentimientos({
  imagenesMarketing,
  onChangeImagenesMarketing,
  derivacionFile,
  onChangeDerivacionFile,
  informesFile,
  onChangeInformesFile,
  rxFile,
  onChangeRxFile,
  fotosFile,
  onChangeFotosFile
}: Props) {
  const derivacionInputRef = React.useRef<HTMLInputElement | null>(null)
  const informesInputRef = React.useRef<HTMLInputElement | null>(null)
  const rxInputRef = React.useRef<HTMLInputElement | null>(null)
  const fotosInputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <div className='ml-[18.375rem] w-[31.6875rem] h-full overflow-y-auto overflow-x-clip scrollbar-hide'>
      <div className='relative w-full min-h-[54rem]'>
        {/* Sección Consentimientos */}
        <p className='absolute left-0 top-0 text-title-sm text-[var(--color-neutral-900)] w-[11.25rem]'>
          Consentimientos
        </p>

        {/* Card Informativo general */}
        <div className='absolute left-[12.5625rem] top-0 flex flex-col gap-1'>
          <p className='text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
            Informativo general
          </p>
          <button
            type='button'
            className='w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-200)] grid place-items-center'
          >
            <MD3Icon
              name='EditRounded'
              size={2.5}
              className='text-[var(--color-neutral-700)]'
            />
          </button>
        </div>

        {/* Card Protección de datos */}
        <div className='absolute left-[12.5625rem] top-[8.6875rem] flex flex-col gap-1'>
          <p className='text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
            Protección de datos
          </p>
          <button
            type='button'
            className='w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-200)] grid place-items-center'
          >
            <MD3Icon
              name='EditRounded'
              size={2.5}
              className='text-[var(--color-neutral-700)]'
            />
          </button>
        </div>

        {/* Toggle Cesión de imágenes */}
        <div className='absolute left-[12.5625rem] top-[17.375rem] flex items-start gap-4 w-[16.3125rem]'>
          <ToggleInput
            ariaLabel='Cesión de imágenes'
            checked={imagenesMarketing}
            onChange={onChangeImagenesMarketing}
          />
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              Cesión de imágenes
            </p>
            <p className='text-label-sm text-[var(--color-neutral-600)]'>
              Marketing/RRSS
            </p>
          </div>
        </div>

        {/* Sección Adjuntos */}
        <p className='absolute left-0 top-[22.875rem] text-title-sm text-[var(--color-neutral-900)]'>
          Adjuntos
        </p>

        {/* Campo Derivación */}
        <div className='absolute left-[12.5625rem] top-[22.875rem] w-[19.125rem] flex flex-col gap-1'>
          <label className='text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
            Derivación
          </label>
          <button
            type='button'
            onClick={() => derivacionInputRef.current?.click()}
            className='h-12 w-full rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 flex items-center justify-between text-left'
          >
            <span
              className={
                derivacionFile
                  ? 'text-[var(--color-neutral-900)]'
                  : 'text-[var(--color-neutral-400)]'
              }
            >
              {derivacionFile ? derivacionFile.name : 'Subir documento'}
            </span>
            <MD3Icon
              name='UploadRounded'
              size='sm'
              className='text-[var(--color-neutral-700)]'
            />
          </button>
          <span className='text-label-sm text-[var(--color-neutral-600)]'>
            PDF, XML, IMG, ...
          </span>
          <input
            ref={derivacionInputRef}
            type='file'
            className='hidden'
            onChange={(e) => {
              onChangeDerivacionFile(e.target.files?.[0] ?? null)
              if (e.target) e.target.value = ''
            }}
          />
        </div>

        {/* Campo Informes */}
        <div className='absolute left-[12.5625rem] top-[30.625rem] w-[19.125rem] flex flex-col gap-1'>
          <label className='text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
            Informes
          </label>
          <button
            type='button'
            onClick={() => informesInputRef.current?.click()}
            className='h-12 w-full rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 flex items-center justify-between text-left'
          >
            <span
              className={
                informesFile
                  ? 'text-[var(--color-neutral-900)]'
                  : 'text-[var(--color-neutral-400)]'
              }
            >
              {informesFile ? informesFile.name : 'Subir documento'}
            </span>
            <MD3Icon
              name='UploadRounded'
              size='sm'
              className='text-[var(--color-neutral-700)]'
            />
          </button>
          <input
            ref={informesInputRef}
            type='file'
            className='hidden'
            onChange={(e) => {
              onChangeInformesFile(e.target.files?.[0] ?? null)
              if (e.target) e.target.value = ''
            }}
          />
        </div>

        {/* Título RX */}
        <p className='absolute left-[12.5625rem] top-[37.125rem] text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
          RX
        </p>

        {/* Tile RX uploaded */}
        {rxFile ? (
          <div className='absolute left-[12.5625rem] top-[38.875rem] relative w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] overflow-hidden bg-[var(--color-neutral-200)]'>
            <button
              type='button'
              className='w-full h-full grid place-items-center text-[var(--color-neutral-900)]'
            >
              <MD3Icon name='AddPhotoAlternateRounded' size={2.5} />
            </button>
          </div>
        ) : (
          <button
            type='button'
            onClick={() => rxInputRef.current?.click()}
            className='absolute left-[12.5625rem] top-[38.875rem] w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-200)] grid place-items-center'
          >
            <MD3Icon
              name='AddPhotoAlternateRounded'
              size={2.5}
              className='text-[var(--color-neutral-700)]'
            />
          </button>
        )}

        {/* Botón Añadir RX */}
        <button
          type='button'
          onClick={() => rxInputRef.current?.click()}
          className='absolute left-[18.8125rem] top-[38.875rem] w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-white grid place-items-center'
        >
          <MD3Icon
            name='AddRounded'
            size={2.5}
            className='text-[var(--color-neutral-700)]'
          />
        </button>
        <input
          ref={rxInputRef}
          type='file'
          className='hidden'
          accept='image/*,application/pdf'
          onChange={(e) => {
            onChangeRxFile(e.target.files?.[0] ?? null)
            if (e.target) e.target.value = ''
          }}
        />

        {/* Título Fotos seguro */}
        <p className='absolute left-[12.5625rem] top-[45.8125rem] text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
          Fotos seguro
        </p>

        {/* Tile Fotos */}
        <button
          type='button'
          onClick={() => fotosInputRef.current?.click()}
          className='absolute left-[12.5625rem] top-[47.5625rem] w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-200)] grid place-items-center'
        >
          <MD3Icon
            name='AddPhotoAlternateRounded'
            size={2.5}
            className='text-[var(--color-neutral-700)]'
          />
        </button>
        <input
          ref={fotosInputRef}
          type='file'
          className='hidden'
          accept='image/*'
          onChange={(e) => {
            onChangeFotosFile(e.target.files?.[0] ?? null)
            if (e.target) e.target.value = ''
          }}
        />

        {/* Scrollbar indicator */}
        <div className='absolute right-0 top-0 w-1 h-[6.25rem] rounded-[1.875rem] bg-[var(--color-neutral-300)]' />
      </div>
    </div>
  )
}
