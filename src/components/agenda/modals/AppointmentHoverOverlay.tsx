'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import type { CSSProperties } from 'react'
import type { EventDetail } from '../types'

export interface AppointmentHoverOverlayProps {
  detail: EventDetail
  box: string
  position: { top: string; left: string; maxHeight?: string }
  backgroundClass?: string
  bgColorInline?: string
  // Voice agent data (for AI-created appointments)
  createdByVoiceAgent?: boolean
}

// Extrae el color CSS de una clase de Tailwind bg-[...]
function extractBgColor(backgroundClass?: string): string | undefined {
  if (!backgroundClass) return undefined
  const match = backgroundClass.match(/bg-\[([^\]]+)\]/)
  return match ? match[1] : undefined
}

// Extract initials from name
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const overlayStyle: CSSProperties = {
  width: 'var(--scheduler-overlay-width)',
  borderRadius: '0.75rem'
}

export default function AppointmentHoverOverlay({
  detail,
  box,
  position,
  backgroundClass,
  bgColorInline,
  createdByVoiceAgent = false
}: AppointmentHoverOverlayProps) {
  const headerBgColor = createdByVoiceAgent
    ? 'var(--color-event-ai-bg)'
    : bgColorInline || extractBgColor(backgroundClass) || 'var(--color-brand-100)'

  const patientInitials = getInitials(detail.patientFull || '')
  const professionalInitials = getInitials(detail.professional || '')

  return (
    <div
      className='pointer-events-none absolute z-10 flex flex-col overflow-hidden rounded-xl border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] shadow-lg animate-in fade-in zoom-in-95 duration-150'
      style={{
        ...overlayStyle,
        top: position.top,
        left: position.left,
        maxHeight: position.maxHeight
      }}
    >
      {/* Header Mejorado - Con avatar y mejor jerarquía */}
      <div
        className='flex items-center gap-3 px-4 py-3'
        style={{ backgroundColor: headerBgColor }}
      >
        {/* Avatar con iniciales */}
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/40 shadow-sm'>
          <span className='text-sm font-semibold text-[var(--color-neutral-800)]'>
            {patientInitials}
          </span>
        </div>

        {/* Info principal */}
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-sm font-semibold text-[var(--color-neutral-900)]'>
            {detail.patientFull}
          </h3>
          <p className='truncate text-xs text-[var(--color-neutral-700)]'>
            {detail.title}
          </p>
        </div>

        {/* Badge de box */}
        <span className='shrink-0 rounded-md bg-white/60 px-2 py-0.5 text-sm font-bold text-[var(--color-neutral-800)] shadow-sm'>
          {box}
        </span>

        {/* Badge IA si aplica */}
        {createdByVoiceAgent && (
          <span className='inline-flex items-center gap-0.5 rounded-full bg-[#EC4899] px-1.5 py-0.5 text-[0.625rem] font-bold text-white shadow-sm'>
            <span className='material-symbols-rounded text-[0.625rem]'>
              smart_toy
            </span>
            IA
          </span>
        )}
      </div>

      {/* Body con cards */}
      <div className='flex flex-col gap-2.5 p-3'>
        {/* Notas / Tratamiento */}
        {(detail.notes || detail.treatmentDescription) && (
          <div className='rounded-lg bg-[var(--color-neutral-50)] p-2.5'>
            <div className='mb-1.5 flex items-center gap-1.5 text-[var(--color-neutral-500)]'>
              <MD3Icon name='DescriptionRounded' size={0.875} />
              <span className='text-[0.6875rem] font-medium'>
                {detail.notesLabel || 'Notas'}
              </span>
            </div>
            <p className='text-xs text-[var(--color-neutral-700)] line-clamp-2'>
              {detail.notes || detail.treatmentDescription || 'Sin notas'}
            </p>
          </div>
        )}

        {/* Económico */}
        {(detail.economicAmount ||
          detail.economicStatus ||
          detail.paymentInfo) && (
          <div className='rounded-lg bg-[var(--color-neutral-50)] p-2.5'>
            <div className='mb-1.5 flex items-center gap-1.5 text-[var(--color-neutral-500)]'>
              <MD3Icon name='PaymentsRounded' size={0.875} />
              <span className='text-[0.6875rem] font-medium'>
                {detail.economicLabel || 'Económico'}
              </span>
            </div>
            {detail.paymentInfo ? (
              <div className='flex items-baseline justify-between'>
                <span
                  className={`text-base font-bold ${
                    detail.paymentInfo.pendingAmount === 0
                      ? 'text-[var(--color-success-600)]'
                      : 'text-[var(--color-warning-600)]'
                  }`}
                >
                  {detail.paymentInfo.pendingAmount.toLocaleString('es-ES', {
                    minimumFractionDigits: 2
                  })}{' '}
                  {detail.paymentInfo.currency}
                </span>
                <span className='text-[0.6875rem] text-[var(--color-neutral-500)]'>
                  {detail.paymentInfo.pendingAmount === 0
                    ? 'pagado'
                    : 'pendiente'}
                </span>
              </div>
            ) : (
              <div className='flex flex-col gap-0.5'>
                {detail.economicAmount && (
                  <span className='text-sm font-semibold text-[var(--color-neutral-900)]'>
                    {detail.economicAmount}
                  </span>
                )}
                {detail.economicStatus && (
                  <span className='text-xs text-[var(--color-neutral-600)]'>
                    {detail.economicStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profesional y Paciente en row */}
        <div className='grid grid-cols-2 gap-2'>
          {/* Profesional */}
          <div className='rounded-lg bg-[var(--color-neutral-50)] p-2.5'>
            <div className='mb-1.5 flex items-center gap-1.5 text-[var(--color-neutral-500)]'>
              <MD3Icon name='MonitorHeartRounded' size={0.875} />
              <span className='text-[0.6875rem] font-medium'>
                {detail.professionalLabel || 'Profesional'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-neutral-700)] text-[0.625rem] font-medium text-white'>
                {professionalInitials}
              </span>
              <span className='truncate text-xs font-medium text-[var(--color-neutral-900)]'>
                {detail.professional}
              </span>
            </div>
          </div>

          {/* Fecha */}
          <div className='rounded-lg bg-[var(--color-neutral-50)] p-2.5'>
            <div className='mb-1.5 flex items-center gap-1.5 text-[var(--color-neutral-500)]'>
              <MD3Icon name='CalendarMonthRounded' size={0.875} />
              <span className='text-[0.6875rem] font-medium'>
                {detail.locationLabel || 'Fecha'}
              </span>
            </div>
            <p className='text-xs font-medium text-[var(--color-neutral-900)]'>
              {detail.date}
            </p>
            {detail.duration && (
              <p className='text-[0.6875rem] text-[var(--color-neutral-500)]'>
                {detail.duration}
              </p>
            )}
          </div>
        </div>

        {/* Contacto si existe */}
        {(detail.patientPhone || detail.patientEmail) && (
          <div className='flex items-center gap-3 rounded-lg bg-[var(--color-neutral-50)] px-2.5 py-2'>
            {detail.patientPhone && (
              <div className='flex items-center gap-1 text-xs text-[var(--color-neutral-600)]'>
                <MD3Icon name='PhoneRounded' size={0.75} />
                <span>{detail.patientPhone}</span>
              </div>
            )}
            {detail.patientEmail && (
              <div className='flex items-center gap-1 text-xs text-[var(--color-neutral-600)]'>
                <MD3Icon name='EmailRounded' size={0.75} />
                <span className='truncate max-w-[8rem]'>
                  {detail.patientEmail}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
