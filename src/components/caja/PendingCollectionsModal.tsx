'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type PendingPatient = {
  patientId: string
  name: string
  phone: string | null
  email: string | null
  outstandingTotal: number
  oldestDay: string | null
  invoiceCount: number
  agingDays: number
}

type Props = {
  open: boolean
  onClose: () => void
  dateStr: string // YYYY-MM-DD (Madrid)
  timeScale: 'day' | 'week' | 'month' | 'year'
}

function formatMoney(value: number) {
  return value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function toWhatsAppLink(phoneE164: string) {
  const digits = phoneE164.replace(/[^\d]/g, '')
  return `https://wa.me/${digits}`
}

export function PendingCollectionsModal({ open, onClose, dateStr, timeScale }: Props) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<PendingPatient[]>([])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    fetch(`/api/caja/pending-collections?date=${encodeURIComponent(dateStr)}&timeScale=${timeScale}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.patients) ? data.patients : [])
        setIsLoading(false)
      })
      .catch((e) => {
        console.error('Failed to fetch pending collections', e)
        setIsLoading(false)
      })
  }, [open, dateStr, timeScale])

  const totalOutstanding = useMemo(
    () => items.reduce((sum, p) => sum + Number(p.outstandingTotal || 0), 0),
    [items]
  )

  const logContact = async (patientId: string, channel: 'call' | 'email' | 'whatsapp') => {
    try {
      await fetch('/api/caja/pending-collections/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, channel })
      })
    } catch (e) {
      // logging should never block user action
      console.warn('Failed to log contact', e)
    }
  }

  if (!open || !mounted) return null

  const content = (
    <div className='fixed inset-0 z-[90] bg-black/30 backdrop-blur-[1px]' onClick={onClose}>
      <div className='absolute inset-0 flex items-center justify-center px-[2rem] py-[2rem]'>
        <div
          className='w-[min(62rem,95vw)] h-[min(42rem,90vh)] rounded-xl bg-neutral-0 shadow-elevation-popover overflow-hidden'
          onClick={(e) => e.stopPropagation()}
          role='dialog'
          aria-modal='true'
          aria-labelledby='pending-collections-title'
        >
          <header className='flex h-[3.5rem] items-center justify-between border-b border-border px-[1.25rem]'>
            <div className='flex items-baseline gap-[0.75rem]'>
              <p id='pending-collections-title' className='text-title-md font-medium text-fg'>
                Por cobrar
              </p>
              <p className='text-body-sm text-neutral-600'>
                Total: <span className='font-medium text-fg'>{formatMoney(totalOutstanding)}</span>
              </p>
            </div>
            <button
              type='button'
              className='flex size-[2rem] items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              onClick={onClose}
              aria-label='Cerrar'
            >
              <span className='material-symbols-rounded text-[1.25rem] leading-none'>close</span>
            </button>
          </header>

          <div className='h-[calc(100%-3.5rem)] overflow-auto p-[1.25rem]'>
            {isLoading ? (
              <div className='py-[2rem] text-center text-neutral-600'>Cargando...</div>
            ) : items.length === 0 ? (
              <div className='py-[2rem] text-center text-neutral-600'>
                No hay pacientes con saldo pendiente en este periodo.
              </div>
            ) : (
              <div className='space-y-[0.75rem]'>
                {items.map((p) => (
                  <div
                    key={p.patientId}
                    className='rounded-lg border border-border bg-surface px-[1rem] py-[0.75rem]'
                  >
                    <div className='flex items-start justify-between gap-[1rem]'>
                      <div className='min-w-0'>
                        <div className='flex items-center gap-[0.5rem]'>
                          <p className='truncate text-body-md font-medium text-fg'>{p.name}</p>
                          <span className='text-label-sm text-neutral-500'>
                            {p.invoiceCount} facturas
                          </span>
                        </div>
                        <div className='mt-[0.25rem] flex flex-wrap items-center gap-[0.75rem] text-label-sm text-neutral-600'>
                          <span>
                            Antigüedad:{' '}
                            <span className='font-medium text-fg'>{p.agingDays} días</span>
                          </span>
                          {p.oldestDay && (
                            <span>
                              Más antiguo:{' '}
                              <span className='font-medium text-fg'>{p.oldestDay}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className='flex flex-col items-end gap-[0.5rem]'>
                        <p className='text-body-md font-medium text-fg'>
                          {formatMoney(p.outstandingTotal)}
                        </p>
                        <div className='flex items-center gap-[0.375rem]'>
                          <button
                            type='button'
                            disabled={!p.phone}
                            onClick={() => {
                              if (!p.phone) return
                              logContact(p.patientId, 'call')
                              window.open(`tel:${p.phone}`, '_self')
                            }}
                            className='inline-flex h-[2rem] items-center justify-center rounded-full border border-border bg-neutral-0 px-[0.75rem] text-label-sm text-fg hover:bg-neutral-50 disabled:opacity-40'
                          >
                            Llamar
                          </button>
                          <button
                            type='button'
                            disabled={!p.email}
                            onClick={() => {
                              if (!p.email) return
                              logContact(p.patientId, 'email')
                              window.open(`mailto:${p.email}`, '_self')
                            }}
                            className='inline-flex h-[2rem] items-center justify-center rounded-full border border-border bg-neutral-0 px-[0.75rem] text-label-sm text-fg hover:bg-neutral-50 disabled:opacity-40'
                          >
                            Email
                          </button>
                          <button
                            type='button'
                            disabled={!p.phone}
                            onClick={() => {
                              if (!p.phone) return
                              logContact(p.patientId, 'whatsapp')
                              window.open(toWhatsAppLink(p.phone), '_blank', 'noopener,noreferrer')
                            }}
                            className='inline-flex h-[2rem] items-center justify-center rounded-full border border-border bg-neutral-0 px-[0.75rem] text-label-sm text-fg hover:bg-neutral-50 disabled:opacity-40'
                          >
                            WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

