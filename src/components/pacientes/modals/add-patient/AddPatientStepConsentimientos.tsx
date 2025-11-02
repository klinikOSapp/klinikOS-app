'use client'

import AddPhotoAlternateRounded from '@mui/icons-material/AddPhotoAlternateRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded'
import UploadRounded from '@mui/icons-material/UploadRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
import React from 'react'
import { ToggleInput } from './AddPatientInputs'

export default function AddPatientStepConsentimientos() {
  const [imagenesMarketing, setImagenesMarketing] = React.useState(false)
  const [derivacionFileName, setDerivacionFileName] = React.useState<string>('')
  const [informesFileName, setInformesFileName] = React.useState<string>('')

  const derivacionInputRef = React.useRef<HTMLInputElement | null>(null)
  const informesInputRef = React.useRef<HTMLInputElement | null>(null)
  const attachInputRef = React.useRef<HTMLInputElement | null>(null)

  type ConsentRow = {
    id: string
    name: string
    sentAt: string
    status: 'Firmado' | 'Enviado'
    url?: string
  }
  const [rows, setRows] = React.useState<ConsentRow[]>([
    {
      id: 'c1',
      name: 'Tratamiento de datos.pdf',
      sentAt: '19/08/2024',
      status: 'Firmado'
    },
    {
      id: 'c2',
      name: 'Protección de datos.pdf',
      sentAt: '22/08/2024',
      status: 'Enviado'
    },
    {
      id: 'c3',
      name: 'Cesión de imágenes.pdf',
      sentAt: '25/08/2024',
      status: 'Enviado'
    }
  ])

  const [menuRowId, setMenuRowId] = React.useState<string | null>(null)
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null)

  type Attachment = {
    id: string
    url: string
    type: 'image' | 'pdf'
    name: string
  }
  const [attachments, setAttachments] = React.useState<Attachment[]>([])
  const lastUrlsRef = React.useRef<string[]>([])

  React.useEffect(() => {
    return () => {
      lastUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
      lastUrlsRef.current = []
    }
  }, [])

  function handleRowView(row: ConsentRow) {
    if (row.url) {
      setViewerUrl(row.url)
    } else {
      // Mock: si no hay archivo aún
      alert('Este consentimiento aún no tiene un archivo asociado.')
    }
  }

  function handleRowDownload(row: ConsentRow) {
    if (!row.url) {
      alert('No hay archivo para descargar.')
      return
    }
    const a = document.createElement('a')
    a.href = row.url
    a.download = row.name || 'consentimiento.pdf'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  function handleRowResend(row: ConsentRow) {
    // Mock de reenvío
    console.log('Reenviar consentimiento', row.id)
    alert(`Consentimiento reenviado: ${row.name}`)
    setMenuRowId(null)
  }

  function handleAddAttachmentClick() {
    attachInputRef.current?.click()
  }

  function handleAttachFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    lastUrlsRef.current.push(url)
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    const newItem: Attachment = {
      id: `att-${Date.now()}`,
      url,
      type: isPdf ? 'pdf' : 'image',
      name: file.name
    }
    setAttachments((prev) => [newItem, ...prev])
    e.target.value = ''
  }

  function handleRemoveAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Consentimientos
        </div>
        <div className='flex items-start gap-4'>
          <ToggleInput
            ariaLabel='Cesión de imágenes (Marketing/RRSS)'
            checked={imagenesMarketing}
            onChange={setImagenesMarketing}
          />
          <div>
            <p className='text-body-md text-[var(--color-neutral-900)]'>
              Cesión de imágenes
            </p>
            <p className='text-label-sm text-[var(--color-neutral-600)]'>
              Marketing / RRSS
            </p>
          </div>
        </div>
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Adjuntos
        </div>

        {/* Derivación */}
        <div className='flex flex-col gap-1'>
          <label className='text-body-md text-[var(--color-neutral-900)]'>
            Derivación
          </label>
          <button
            type='button'
            onClick={() => derivacionInputRef.current?.click()}
            className='h-12 w-full rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 flex items-center justify-between text-left'
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

        {/* Informes */}
        <div className='flex flex-col gap-1'>
          <label className='text-body-md text-[var(--color-neutral-900)]'>
            Informes
          </label>
          <button
            type='button'
            onClick={() => informesInputRef.current?.click()}
            className='h-12 w-full rounded-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 flex items-center justify-between text-left'
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

        {/* Tiles de adjuntos (RX, Fotos, Añadir) */}
        <div className='grid grid-cols-3 gap-3 pt-2'>
          {attachments.map((att) => (
            <div
              key={att.id}
              className='relative size-20 rounded-lg border border-[var(--color-neutral-300)] overflow-hidden bg-[var(--color-neutral-200)]'
            >
              {att.type === 'image' ? (
                <button
                  type='button'
                  onClick={() => setViewerUrl(att.url)}
                  className='absolute inset-0'
                >
                  <img
                    src={att.url}
                    alt=''
                    className='w-full h-full object-cover'
                  />
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() => setViewerUrl(att.url)}
                  className='w-full h-full grid place-items-center text-[var(--color-neutral-900)]'
                >
                  <PictureAsPdfRounded />
                </button>
              )}
              <button
                type='button'
                aria-label='Eliminar adjunto'
                onClick={() => handleRemoveAttachment(att.id)}
                className='absolute top-1 right-1 size-5 rounded-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] text-[var(--color-neutral-900)] grid place-items-center'
              >
                ×
              </button>
            </div>
          ))}
          <button
            type='button'
            onClick={handleAddAttachmentClick}
            className='size-20 rounded-lg border border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] grid place-items-center text-[var(--color-neutral-900)]'
            aria-label='Añadir adjunto'
          >
            <AddPhotoAlternateRounded />
          </button>
          <input
            ref={attachInputRef}
            type='file'
            className='hidden'
            accept='image/*,application/pdf'
            onChange={handleAttachFileChange}
          />
        </div>
      </div>

      {/* Tabla de consentimientos */}
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Lista
        </div>
        {/* Headers */}
        <div className='grid grid-cols-[1fr_120px_140px_48px] border-b border-[var(--color-neutral-300)] px-2 py-1'>
          <span className='text-body-md text-[var(--color-neutral-700)]'>
            Consentimiento
          </span>
          <span className='text-body-md text-[var(--color-neutral-700)]'>
            Estado
          </span>
          <span className='text-body-md text-[var(--color-neutral-700)]'>
            Fecha de envío
          </span>
          <span />
        </div>
        {/* Rows */}
        <div className='max-h-[18rem] overflow-y-auto pr-2 scrollbar-hide'>
          {rows.map((row) => (
            <div
              key={row.id}
              className='relative grid grid-cols-[1fr_120px_140px_48px] items-center border-b border-[var(--color-neutral-300)] px-2 py-3'
            >
              <div className='flex items-center gap-3 text-[var(--color-neutral-900)]'>
                <PictureAsPdfRounded />
                <div className='flex flex-col'>
                  <span className='text-body-md'>{row.name}</span>
                  <span className='text-label-sm text-[var(--color-neutral-600)]'>
                    12/05/2024
                  </span>
                </div>
              </div>
              <span
                className={[
                  'inline-flex items-center justify-center rounded-full px-2 py-1 text-label-sm',
                  row.status === 'Firmado'
                    ? 'border border-[var(--color-brand-500)] text-[var(--color-brand-500)]'
                    : 'border border-[var(--color-info-200)] text-[var(--color-info-200)]'
                ].join(' ')}
              >
                {row.status}
              </span>
              <span className='text-body-md text-[var(--color-neutral-900)]'>
                {row.sentAt}
              </span>
              <div className='flex items-center gap-2 text-[var(--color-neutral-900)]'>
                <button
                  type='button'
                  aria-label='Ver'
                  onClick={() => handleRowView(row)}
                >
                  <VisibilityRounded className='size-5' />
                </button>
                <button
                  type='button'
                  aria-label='Más'
                  onClick={() =>
                    setMenuRowId((p) => (p === row.id ? null : row.id))
                  }
                >
                  <MoreVertRounded className='size-5' />
                </button>
              </div>
              {menuRowId === row.id && (
                <div className='absolute right-2 top-[calc(100%-2.25rem)] w-40 bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded-lg shadow-[var(--shadow-cta)] z-10 p-1'>
                  <button
                    type='button'
                    className='w-full text-left px-3 py-2 rounded hover:bg-[var(--color-brand-200)]'
                    onClick={() => handleRowDownload(row)}
                  >
                    Descargar
                  </button>
                  <button
                    type='button'
                    className='w-full text-left px-3 py-2 rounded hover:bg-[var(--color-brand-200)]'
                    onClick={() => handleRowResend(row)}
                  >
                    Reenviar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay visor */}
      {viewerUrl && (
        <div className='fixed inset-0 z-[100] bg-black/50 grid place-items-center'>
          <div className='bg-[var(--color-surface-modal,#fff)] rounded-[1rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] w-[min(92vw,960px)] h-[min(85vh,720px)] relative overflow-hidden'>
            <button
              type='button'
              aria-label='Cerrar'
              onClick={() => setViewerUrl(null)}
              className='absolute top-3 right-3 size-8 grid place-items-center text-[var(--color-neutral-900)]'
            >
              <CloseRounded />
            </button>
            {viewerUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={viewerUrl} className='w-full h-full' />
            ) : (
              <img
                src={viewerUrl}
                alt=''
                className='w-full h-full object-contain bg-black/5'
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
