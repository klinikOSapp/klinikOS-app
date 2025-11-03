'use client'

import AddRounded from '@mui/icons-material/AddRounded'
import AttachEmailRounded from '@mui/icons-material/AttachEmailRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import DownloadRounded from '@mui/icons-material/DownloadRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded'
import VisibilityRounded from '@mui/icons-material/VisibilityRounded'
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
    <div className='relative w-[74.75rem] h-[56.25rem] bg-neutral-50'>
      {/* Close */}
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-6 top-4 right-4 text-neutral-900'
      >
        <CloseRounded className='size-6' />
      </button>

      {/* Header */}
      <div className='absolute left-8 top-10 w-[35.5rem]'>
        <p className='text-[28px] leading-[36px] text-neutral-900'>
          Consentimientos
        </p>
        <p className='text-body-sm text-neutral-900 mt-2'>
          Gestiona todos los consentimientos de los pacientes.
        </p>
      </div>

      {/* Card / List */}
      <div className='absolute left-8 top-36 w-[70.25rem] h-[45.3125rem] bg-white rounded-xl border border-neutral-200'>
        <div className='relative w-full h-full rounded-inherit'>
          {/* Add button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className='absolute top-4 right-4 flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-neutral-900 bg-neutral-50 border border-neutral-300 hover:bg-brand-100 hover:border-brand-300 active:bg-brand-900 active:text-neutral-50 active:border-brand-900 transition-colors cursor-pointer'
          >
            <AddRounded className='size-5' />
            <span className='font-medium'>Subir consentimiento</span>
          </button>

          {/* Column headers */}
          <div className='absolute top-28 left-[33px] w-[588px] border-b border-neutral-300'>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Consentimiento</p>
            </div>
          </div>
          <div className='absolute top-28 left-[calc(40%+171.4px)] w-[154px] border-b border-neutral-300'>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Estado</p>
            </div>
          </div>
          <div className='absolute top-28 left-[calc(60%+100.6px)] w-[238px] border-b border-neutral-300'>
            <div className='px-2 py-1'>
              <p className='text-body-md text-neutral-700'>Fecha de envío</p>
            </div>
          </div>

          {/* Rows */}
          <div className='absolute left-0 right-0 top-[9.5rem] bottom-6 overflow-y-auto'>
            {rows.map((row, idx) => {
              const topOffset = idx * 72
              return (
                <div
                  key={row.id}
                  className='absolute left-0 right-0'
                  style={{ top: topOffset }}
                >
                  {/* File + name + date small */}
                  <div className='absolute left-8 w-[589px] h-[72px] border-b border-neutral-300 flex items-center gap-4 p-2'>
                    <div className='flex items-center justify-center w-[42px] h-[49px]'>
                      <PictureAsPdfRounded className='text-neutral-900' />
                    </div>
                    <div className='flex flex-col justify-between h-full py-1 text-neutral-900'>
                      <p className='text-body-md'>{row.name}</p>
                      <p className='text-label-sm'>{'12/05/2024'}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className='absolute left-[calc(40%+171.4px)] w-[154px] h-[72px] border-b border-neutral-300 flex items-center p-2'>
                    <StatusBadge status={row.status} />
                  </div>

                  {/* Sent date */}
                  <div className='absolute left-[calc(60%+100.6px)] w-[238px] h-[72px] border-b border-neutral-300 flex items-center p-2'>
                    <p className='text-body-md text-neutral-900'>
                      {row.sentAt}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className='absolute right-8 h-[72px] flex items-center gap-2 relative'>
                    <VisibilityRounded className='size-6 text-neutral-900' />
                    <button
                      type='button'
                      aria-haspopup='menu'
                      aria-expanded={openMenuRowId === row.id}
                      onClick={() =>
                        setOpenMenuRowId((prev) =>
                          prev === row.id ? null : row.id
                        )
                      }
                      className='size-8 grid place-items-center rounded-md hover:bg-[var(--color-brand-200)] text-[var(--color-neutral-900)]'
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
              )
            })}
          </div>
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
