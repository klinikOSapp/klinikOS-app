'use client'

import AddPhotoAlternateRounded from '@mui/icons-material/AddPhotoAlternateRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import React from 'react'
import { ToggleInput } from './AddPatientInputs'

export default function AddPatientStepConsentimientos() {
  const [imagenesMarketing, setImagenesMarketing] = React.useState(false)
  const [derivacionFileName, setDerivacionFileName] = React.useState<string>('')
  const [informesFileName, setInformesFileName] = React.useState<string>('')

  const derivacionInputRef = React.useRef<HTMLInputElement | null>(null)
  const informesInputRef = React.useRef<HTMLInputElement | null>(null)
  const rxInputRef = React.useRef<HTMLInputElement | null>(null)
  const fotosInputRef = React.useRef<HTMLInputElement | null>(null)

  type Attachment = {
    id: string
    url: string
    name: string
  }
  const [rxAttachment, setRxAttachment] = React.useState<Attachment | null>(null)
  const [fotosAttachment, setFotosAttachment] = React.useState<Attachment | null>(null)

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<Attachment | null>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setFile({ id: Date.now().toString(), url, name: file.name })
    e.target.value = ''
  }

  return (
    <div className='absolute left-[18.375rem] top-[10rem] w-[31.6875rem] h-[43.25rem] overflow-y-auto overflow-x-clip scrollbar-hide'>
      <div className='relative w-full h-full'>
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
            <EditRounded 
              style={{ width: 40, height: 40, color: 'var(--color-neutral-700)' }}
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
            <EditRounded 
              style={{ width: 40, height: 40, color: 'var(--color-neutral-700)' }}
            />
          </button>
        </div>

        {/* Toggle Cesión de imágenes */}
        <div className='absolute left-[12.5625rem] top-[17.375rem] flex items-start gap-4 w-[16.3125rem]'>
          <ToggleInput
            ariaLabel='Cesión de imágenes'
            checked={imagenesMarketing}
            onChange={setImagenesMarketing}
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
                derivacionFileName
                  ? 'text-[var(--color-neutral-900)]'
                  : 'text-[var(--color-neutral-400)]'
              }
            >
              {derivacionFileName || 'Subir documento'}
            </span>
            <UploadRounded className='text-[var(--color-neutral-700)]' />
          </button>
          <span className='text-label-sm text-[var(--color-neutral-600)]'>
            PDF, XML, IMG, ...
          </span>
          <input
            ref={derivacionInputRef}
            type='file'
            className='hidden'
            onChange={(e) => {
              const f = e.target.files?.[0]
              setDerivacionFileName(f ? f.name : '')
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
                informesFileName
                  ? 'text-[var(--color-neutral-900)]'
                  : 'text-[var(--color-neutral-400)]'
              }
            >
              {informesFileName || 'Subir documento'}
            </span>
            <UploadRounded className='text-[var(--color-neutral-700)]' />
          </button>
          <input
            ref={informesInputRef}
            type='file'
            className='hidden'
            onChange={(e) => {
              const f = e.target.files?.[0]
              setInformesFileName(f ? f.name : '')
              if (e.target) e.target.value = ''
            }}
          />
        </div>

        {/* Título RX */}
        <p className='absolute left-[12.5625rem] top-[37.125rem] text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-900)]'>
          RX
        </p>

        {/* Tile RX uploaded */}
        {rxAttachment ? (
          <div className='absolute left-[12.5625rem] top-[38.875rem] relative w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] overflow-hidden bg-[var(--color-neutral-200)]'>
            <button
              type='button'
              className='w-full h-full grid place-items-center text-[var(--color-neutral-900)]'
            >
              <AddPhotoAlternateRounded style={{ width: 40, height: 40 }} />
            </button>
          </div>
        ) : (
          <button
            type='button'
            onClick={() => rxInputRef.current?.click()}
            className='absolute left-[12.5625rem] top-[38.875rem] w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-[var(--color-neutral-200)] grid place-items-center'
          >
            <AddPhotoAlternateRounded 
              style={{ width: 40, height: 40, color: 'var(--color-neutral-700)' }}
            />
          </button>
        )}

        {/* Botón Añadir RX */}
        <button
          type='button'
          onClick={() => rxInputRef.current?.click()}
          className='absolute left-[18.8125rem] top-[38.875rem] w-[4.9375rem] h-[4.9375rem] rounded-[0.5rem] border border-[var(--color-neutral-300)] bg-white grid place-items-center'
        >
          <AddRounded 
            style={{ width: 40, height: 40, color: 'var(--color-neutral-700)' }}
          />
        </button>
        <input
          ref={rxInputRef}
          type='file'
          className='hidden'
          accept='image/*,application/pdf'
          onChange={(e) => handleFileUpload(e, setRxAttachment)}
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
          <AddPhotoAlternateRounded 
            style={{ width: 40, height: 40, color: 'var(--color-neutral-700)' }}
          />
        </button>
        <input
          ref={fotosInputRef}
          type='file'
          className='hidden'
          accept='image/*'
          onChange={(e) => handleFileUpload(e, setFotosAttachment)}
        />

        {/* Scrollbar indicator */}
        <div className='absolute right-0 top-0 w-1 h-[6.25rem] rounded-[1.875rem] bg-[var(--color-neutral-300)]' />
      </div>
    </div>
  )
}
