'use client'

import {
  AddRounded,
  AttachEmailRounded,
  CloseRounded,
  DownloadRounded,
  MoreVertRounded,
  PictureAsPdfRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import React from 'react'
import UploadConsentModal from './UploadConsentModal'

type ConsentsProps = {
  onClose?: () => void
}

type ConsentRow = {
  id: string
  name: string
  sentAt: string
  status: 'Firmado' | 'Enviado'
}

const MOCK_ROWS: ConsentRow[] = [
  {
    id: 'c1',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Firmado'
  },
  {
    id: 'c2',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado'
  },
  {
    id: 'c3',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado'
  },
  {
    id: 'c4',
    name: 'Tratamiento de datos.pdf',
    sentAt: '19/08/2024',
    status: 'Enviado'
  }
]

function StatusBadge({ status }: { status: ConsentRow['status'] }) {
  const isSigned = status === 'Firmado'
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full px-2 py-1 text-label-sm',
        isSigned
          ? 'border border-brand-500 text-brand-500'
          : 'border border-info-200 text-info-200'
      ].join(' ')}
    >
      {status}
    </span>
  )
}

type ToastVariant = 'success' | 'error'

export default function Consents({ onClose }: ConsentsProps) {
  const [openMenuRowId, setOpenMenuRowId] = React.useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = React.useState(false)
  const [rows, setRows] = React.useState<ConsentRow[]>(MOCK_ROWS)
  const [toast, setToast] = React.useState<{
    message: string
    variant: ToastVariant
  } | null>(null)

  React.useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      if (!openMenuRowId) return
      const target = e.target as HTMLElement
      const insideMenu = target.closest('[data-consents-menu="true"]')
      const insideTrigger = target.closest('[data-consents-trigger="true"]')
      if (!insideMenu && !insideTrigger) {
        setOpenMenuRowId(null)
      }
    }
    document.addEventListener('mousedown', handleGlobalClick)
    return () => document.removeEventListener('mousedown', handleGlobalClick)
  }, [openMenuRowId])
  return (
    <div className='w-full h-full bg-neutral-50 flex flex-col p-8 overflow-hidden'>
      {/* Header */}
      <div className='mb-6'>
        <p className='font-inter text-headline-sm text-neutral-900'>
          Consentimientos
        </p>
        <p className='text-body-sm text-neutral-900 mt-2'>
          Gestiona todos los consentimientos de los pacientes.
        </p>
      </div>

      {/* Card / List */}
      <div className='flex-1 bg-white rounded-xl border border-neutral-200 flex flex-col overflow-hidden'>
        {/* Add button */}
        <div className='flex justify-end p-4'>
          <button
            onClick={() => setIsUploadOpen(true)}
            className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-neutral-900 bg-neutral-50 border border-neutral-300 hover:bg-brand-100 hover:border-brand-300 active:bg-brand-900 active:text-neutral-50 active:border-brand-900 transition-colors cursor-pointer'
          >
            <AddRounded className='size-5' />
            <span className='font-medium'>Subir consentimiento</span>
          </button>
        </div>

        {/* Table */}
        <div className='flex-1 overflow-y-auto px-4'>
          {/* Column headers */}
          <div className='grid grid-cols-[1fr_150px_150px_100px] border-b border-neutral-300'>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Consentimiento</p>
            </div>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Estado</p>
            </div>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Fecha de envío</p>
            </div>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Acciones</p>
            </div>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.id}
              className='grid grid-cols-[1fr_150px_150px_100px] border-b border-neutral-300 items-center'
            >
              {/* File + name + date small */}
              <div className='flex items-center gap-4 p-2 h-[72px]'>
                <div className='flex items-center justify-center w-[42px] h-[49px]'>
                  <PictureAsPdfRounded className='text-neutral-900' />
                </div>
                <div className='flex flex-col justify-center text-neutral-900'>
                  <p className='text-body-md'>{row.name}</p>
                  <p className='text-label-sm'>{'12/05/2024'}</p>
                </div>
              </div>

              {/* Status */}
              <div className='flex items-center p-2'>
                <StatusBadge status={row.status} />
              </div>

              {/* Sent date */}
              <div className='flex items-center p-2'>
                <p className='text-body-md text-neutral-900'>
                  {row.sentAt}
                </p>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2 p-2'>
                <VisibilityRounded className='size-6 text-neutral-900 cursor-pointer' />
                <div className='relative'>
                  <button
                    type='button'
                    aria-haspopup='menu'
                    aria-expanded={openMenuRowId === row.id}
                    onClick={() =>
                      setOpenMenuRowId((prev) =>
                        prev === row.id ? null : row.id
                      )
                    }
                    className='cursor-pointer'
                    data-consents-trigger='true'
                    aria-label='Más opciones'
                  >
                    <MoreVertRounded className='size-6 text-neutral-900' />
                  </button>

                  {openMenuRowId === row.id && (
                    <div
                      role='menu'
                      className='absolute right-0 top-full mt-2 w-64 rounded-lg bg-[var(--color-neutral-50)] shadow-[var(--shadow-cta)] border border-[var(--color-neutral-200)] p-2 z-10'
                      data-consents-menu='true'
                    >
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => {
                          // Acción: Enviar consentimiento
                          setOpenMenuRowId(null)
                        }}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)]'
                      >
                        <AttachEmailRounded className='size-5' />
                        <span className='text-body-md'>
                          Enviar Consentimiento
                        </span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        disabled
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-[var(--color-neutral-600)] cursor-not-allowed'
                      >
                        <AttachEmailRounded className='size-5' />
                        <span className='text-body-md'>
                          Enviar copia firmada
                        </span>
                      </button>
                      <button
                        type='button'
                        role='menuitem'
                        onClick={() => {
                          // Acción: Descargar
                          setOpenMenuRowId(null)
                        }}
                        className='w-full flex items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)]'
                      >
                        <DownloadRounded className='size-5' />
                        <span className='text-body-md'>Descargar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <UploadConsentModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onError={(msg) => {
          setToast({ message: msg, variant: 'error' })
          window.setTimeout(() => setToast(null), 3500)
        }}
        onFileSelected={(f) => {
          const d = new Date()
          const dd = String(d.getDate()).padStart(2, '0')
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const yyyy = d.getFullYear()
          const newRow: ConsentRow = {
            id: `new-${Date.now()}`,
            name: f.name || 'consentimiento.pdf',
            sentAt: `${dd}/${mm}/${yyyy}`,
            status: 'Enviado'
          }
          setRows((prev) => [newRow, ...prev])
          setToast({ message: 'Consentimiento añadido', variant: 'success' })
          window.setTimeout(() => setToast(null), 3000)
          setIsUploadOpen(false)
        }}
      />
      {toast && (
        <div className='fixed right-4 bottom-4 z-[200]'>
          <div
            className={[
              'min-w-[240px] max-w-[360px] rounded-lg border shadow-[var(--shadow-cta)] px-3 py-2 flex items-start gap-2',
              toast.variant === 'success'
                ? 'bg-[var(--color-success-50)] border-[var(--color-success-200)] text-[var(--color-success-800)]'
                : 'bg-[var(--color-error-50)] border-[var(--color-error-200)] text-[var(--color-error-800)]'
            ].join(' ')}
          >
            <p className='text-body-md flex-1'>{toast.message}</p>
            <button
              type='button'
              aria-label='Cerrar aviso'
              className='ml-2 leading-none text-body-md'
              onClick={() => setToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
