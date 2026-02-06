'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import type { CSSProperties } from 'react'
import type { EventDetail } from '../types'

// Voice agent data types (matching AppointmentsContext)
export type VoiceAgentSentiment =
  | 'aliviado'
  | 'nervioso'
  | 'enfadado'
  | 'contento'
  | 'preocupado'

export type VoiceAgentData = {
  callSummary: string
  patientSentiment: VoiceAgentSentiment
  callDuration: string
  callIntent: string
  transcriptionAvailable: boolean
}

// Sentiment labels for display
const SENTIMENT_LABELS: Record<VoiceAgentSentiment, string> = {
  aliviado: 'Aliviado',
  nervioso: 'Nervioso',
  enfadado: 'Enfadado',
  contento: 'Contento',
  preocupado: 'Preocupado'
}

// Sentiment icons/colors
const SENTIMENT_CONFIG: Record<
  VoiceAgentSentiment,
  { color: string; bgColor: string; icon: string }
> = {
  aliviado: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'sentiment_satisfied'
  },
  nervioso: { color: '#F59E0B', bgColor: '#FEF3C7', icon: 'sentiment_neutral' },
  enfadado: {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'sentiment_very_dissatisfied'
  },
  contento: {
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    icon: 'sentiment_very_satisfied'
  },
  preocupado: {
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    icon: 'sentiment_dissatisfied'
  }
}

export interface AppointmentDetailOverlayProps {
  detail: EventDetail
  box: string
  position: { top: string; left: string; maxHeight?: string }
  // Clase de fondo de la cita (ej: 'bg-[var(--color-brand-100)]' o 'bg-[#fbe9f0]')
  backgroundClass?: string
  // Callbacks para acciones rápidas
  onPaymentAction?: () => void
  onViewPatient?: () => void
  // Estado de confirmación de la cita
  isConfirmed?: boolean
  onToggleConfirmed?: (confirmed: boolean) => void
  // Voice agent data (for AI-created appointments)
  createdByVoiceAgent?: boolean
  voiceAgentCallId?: string
  voiceAgentData?: VoiceAgentData
  // Callback to view the linked call details
  onViewVoiceCall?: (callId: string) => void
  // Callback to close the overlay
  onClose?: () => void
}

// Extrae el color CSS de una clase de Tailwind bg-[...]
function extractBgColor(backgroundClass?: string): string | undefined {
  if (!backgroundClass) return undefined
  // Match bg-[...] pattern
  const match = backgroundClass.match(/bg-\[([^\]]+)\]/)
  return match ? match[1] : undefined
}

// Extract initials from patient name
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

export default function AppointmentDetailOverlay({
  detail,
  box,
  position,
  backgroundClass,
  onPaymentAction,
  onViewPatient,
  isConfirmed = false,
  onToggleConfirmed,
  createdByVoiceAgent = false,
  voiceAgentCallId,
  voiceAgentData,
  onViewVoiceCall,
  onClose
}: AppointmentDetailOverlayProps) {
  const showQuickActions = onPaymentAction || onViewPatient
  const headerBgColor = createdByVoiceAgent
    ? 'var(--color-event-ai-bg)'
    : extractBgColor(backgroundClass) || 'var(--color-brand-100)'

  // Get patient initials for avatar
  const patientInitials = getInitials(detail.patientFull || '')

  // Calculate payment percentage
  const paymentPercentage =
    detail.paymentInfo && detail.paymentInfo.totalAmount > 0
      ? Math.min(
          100,
          (detail.paymentInfo.paidAmount / detail.paymentInfo.totalAmount) * 100
        )
      : 0

  const isPaid = detail.paymentInfo && detail.paymentInfo.pendingAmount === 0

  return (
    <div
      data-overlay='true'
      id='scheduler-event-overlay'
      className='pointer-events-auto absolute z-20 flex flex-col border border-[var(--color-neutral-200)] bg-[var(--color-neutral-0)] shadow-lg animate-in fade-in slide-in-from-left-2 duration-200'
      style={{
        ...overlayStyle,
        top: position.top,
        left: position.left,
        height: position.maxHeight ?? 'var(--scheduler-overlay-height)',
        maxHeight: position.maxHeight
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Header Mejorado - Con avatar y mejor jerarquía */}
      <div
        className='relative flex shrink-0 items-center gap-3 rounded-t-[0.75rem] px-4 py-3'
        style={{ backgroundColor: headerBgColor }}
      >
        {/* Avatar con iniciales */}
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/40 shadow-sm'>
          <span className='text-base font-semibold text-[var(--color-neutral-800)]'>
            {patientInitials}
          </span>
        </div>

        {/* Info principal */}
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-base font-semibold text-[var(--color-neutral-900)] leading-tight'>
            {detail.patientFull}
          </h3>
          <p className='truncate text-sm text-[var(--color-neutral-700)]'>
            {detail.title}
          </p>
        </div>

        {/* Badge de box */}
        <div className='flex shrink-0 items-center gap-2'>
          <span className='rounded-md bg-white/60 px-2 py-0.5 text-sm font-bold text-[var(--color-neutral-800)] shadow-sm'>
            {box}
          </span>
          {/* Botón cerrar */}
          {onClose && (
            <button
              type='button'
              onClick={onClose}
              className='flex h-7 w-7 items-center justify-center rounded-full bg-white/40 text-[var(--color-neutral-600)] transition-colors hover:bg-white/60 hover:text-[var(--color-neutral-900)]'
              aria-label='Cerrar'
            >
              <MD3Icon name='CloseRounded' size={1} />
            </button>
          )}
        </div>
      </div>

      {/* Toggle de confirmación - Debajo del header */}
      {onToggleConfirmed && (
        <div className='flex items-center justify-between border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-4 py-2'>
          <span className='text-xs font-medium text-[var(--color-neutral-600)]'>
            Estado de la cita
          </span>
          <button
            type='button'
            onClick={() => onToggleConfirmed(!isConfirmed)}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
              isConfirmed
                ? 'bg-[#3B82F6] text-white shadow-sm'
                : 'bg-white text-[var(--color-neutral-600)] shadow-sm ring-1 ring-inset ring-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-100)] hover:text-[#3B82F6]'
            ].join(' ')}
          >
            <MD3Icon
              name={
                isConfirmed ? 'CheckCircleRounded' : 'EventAvailableRounded'
              }
              size={0.875}
              fill={isConfirmed ? 1 : 0}
            />
            <span>{isConfirmed ? 'Confirmada' : 'Sin confirmar'}</span>
          </button>
        </div>
      )}

      {/* Body - Scrollable content area */}
      <div className='flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4'>
        {/* Información principal - Tratamiento y notas */}
        <div className='rounded-lg bg-[var(--color-neutral-50)] p-3'>
          <p className='text-sm font-medium italic text-[var(--color-neutral-700)]'>
            {detail.treatmentDescription || detail.title}
          </p>
          {detail.notes && (
            <>
              <hr className='my-2 border-t border-[var(--color-neutral-200)]' />
              <p className='text-sm text-[var(--color-neutral-600)]'>
                {detail.notes}
              </p>
            </>
          )}
        </div>

        {/* Voice Agent Info - Rediseñado con gradiente */}
        {createdByVoiceAgent && (
          <div className='relative overflow-hidden rounded-lg border border-[#F9A8D4] bg-gradient-to-br from-[#FDF2F8] to-[#FCE7F3] p-4'>
            {/* Badge IA flotante */}
            <div className='absolute right-3 top-3'>
              <span className='inline-flex items-center gap-1 rounded-full bg-[#EC4899] px-2 py-0.5 text-[0.625rem] font-bold text-white shadow-sm'>
                <span className='material-symbols-rounded text-xs'>
                  smart_toy
                </span>
                IA
              </span>
            </div>

            <p className='mb-2 text-xs font-medium text-[#DB2777]'>
              Creada por agente de voz
            </p>

            {/* Voice agent data if available */}
            {voiceAgentData && (
              <div className='flex flex-col gap-3'>
                {/* Call summary as quote */}
                <blockquote className='border-l-2 border-[#F472B6] pl-3 text-sm italic text-[var(--color-neutral-700)]'>
                  &ldquo;{voiceAgentData.callSummary}&rdquo;
                </blockquote>

                {/* Sentiment and duration row */}
                <div className='flex items-center gap-3 text-xs'>
                  {/* Sentiment badge */}
                  <div
                    className='flex items-center gap-1 rounded-full px-2 py-1'
                    style={{
                      backgroundColor:
                        SENTIMENT_CONFIG[voiceAgentData.patientSentiment]
                          ?.bgColor || '#F3F4F6'
                    }}
                  >
                    <span
                      className='material-symbols-rounded text-sm'
                      style={{
                        color:
                          SENTIMENT_CONFIG[voiceAgentData.patientSentiment]
                            ?.color || '#6B7280'
                      }}
                    >
                      {SENTIMENT_CONFIG[voiceAgentData.patientSentiment]
                        ?.icon || 'sentiment_neutral'}
                    </span>
                    <span
                      className='font-medium'
                      style={{
                        color:
                          SENTIMENT_CONFIG[voiceAgentData.patientSentiment]
                            ?.color || '#6B7280'
                      }}
                    >
                      {SENTIMENT_LABELS[voiceAgentData.patientSentiment] ||
                        'Desconocido'}
                    </span>
                  </div>
                  <span className='text-[var(--color-neutral-400)]'>•</span>
                  <div className='flex items-center gap-1 text-[var(--color-neutral-600)]'>
                    <span className='material-symbols-rounded text-sm'>
                      timer
                    </span>
                    <span>{voiceAgentData.callDuration}</span>
                  </div>
                </div>
              </div>
            )}

            {/* View full call button */}
            {voiceAgentCallId && onViewVoiceCall && (
              <button
                type='button'
                onClick={() => onViewVoiceCall(voiceAgentCallId)}
                className='mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#F9A8D4] bg-white py-2 text-sm font-medium text-[#DB2777] shadow-sm transition-all hover:bg-[#FDF2F8] hover:shadow-md'
              >
                <span className='material-symbols-rounded text-base'>call</span>
                <span>Ver llamada completa</span>
              </button>
            )}
          </div>
        )}

        {/* Sección Económica - Rediseñada como card de estado */}
        {(detail.economicAmount ||
          detail.economicStatus ||
          detail.paymentInfo) && (
          <div
            className={`rounded-lg border p-4 ${
              isPaid
                ? 'border-[var(--color-success-200)] bg-[var(--color-success-50)]'
                : detail.paymentInfo && detail.paymentInfo.pendingAmount > 0
                ? 'border-[var(--color-warning-200)] bg-[var(--color-warning-50)]'
                : 'border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)]'
            }`}
          >
            <div className='mb-2 flex items-center gap-2'>
              <MD3Icon
                name='PaymentsRounded'
                size={1.125}
                className='text-[var(--color-neutral-600)]'
              />
              <span className='text-sm font-medium text-[var(--color-neutral-700)]'>
                {detail.economicLabel || 'Económico'}
              </span>
            </div>

            {detail.paymentInfo ? (
              <div className='flex flex-col gap-3'>
                {/* Monto pendiente destacado */}
                <div className='flex items-baseline justify-between'>
                  <span
                    className={`text-2xl font-bold ${
                      isPaid
                        ? 'text-[var(--color-success-600)]'
                        : 'text-[var(--color-warning-600)]'
                    }`}
                  >
                    {detail.paymentInfo.pendingAmount.toLocaleString('es-ES', {
                      minimumFractionDigits: 2
                    })}{' '}
                    {detail.paymentInfo.currency}
                  </span>
                  <span className='text-xs text-[var(--color-neutral-500)]'>
                    {isPaid ? 'pagado' : 'pendiente'}
                  </span>
                </div>

                {/* Barra de progreso mejorada */}
                <div className='relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]'>
                  <div
                    className='absolute inset-y-0 left-0 rounded-full bg-[var(--color-brand-500)] transition-all duration-500'
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>

                {/* Detalles de pago */}
                <div className='flex justify-between text-xs text-[var(--color-neutral-600)]'>
                  <span>
                    Pagado:{' '}
                    <span className='font-medium text-[var(--color-success-600)]'>
                      {detail.paymentInfo.paidAmount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2
                      })}{' '}
                      {detail.paymentInfo.currency}
                    </span>
                  </span>
                  <span>
                    Total:{' '}
                    <span className='font-medium text-[var(--color-neutral-900)]'>
                      {detail.paymentInfo.totalAmount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2
                      })}{' '}
                      {detail.paymentInfo.currency}
                    </span>
                  </span>
                </div>

                {/* Plan de cuotas si existe */}
                {detail.installmentPlan && (
                  <div className='flex items-center gap-2 rounded-md bg-white/60 px-2 py-1.5 text-xs'>
                    <MD3Icon
                      name='CalendarMonthRounded'
                      size={0.875}
                      className='text-[var(--color-neutral-500)]'
                    />
                    <span className='text-[var(--color-neutral-700)]'>
                      Cuota {detail.installmentPlan.currentInstallment} de{' '}
                      {detail.installmentPlan.totalInstallments}
                    </span>
                    <span className='text-[var(--color-neutral-500)]'>
                      (
                      {detail.installmentPlan.amountPerInstallment.toLocaleString(
                        'es-ES',
                        { minimumFractionDigits: 2 }
                      )}{' '}
                      {detail.paymentInfo.currency}/cuota)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Fallback al formato anterior si no hay paymentInfo */
              <div className='flex flex-col gap-1'>
                {detail.economicAmount && (
                  <span className='text-lg font-semibold text-[var(--color-neutral-900)]'>
                    {detail.economicAmount}
                  </span>
                )}
                {detail.economicStatus && (
                  <span className='text-sm text-[var(--color-neutral-700)]'>
                    {detail.economicStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Profesional - Card */}
        <OverlayCard
          icon={<MD3Icon name='MonitorHeartRounded' size={1.125} />}
          label={detail.professionalLabel}
        >
          <div className='flex items-center gap-2'>
            <span
              aria-hidden='true'
              className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-neutral-700)] text-xs font-medium text-white'
            >
              {getInitials(detail.professional || '')}
            </span>
            <span className='text-sm font-medium text-[var(--color-neutral-900)]'>
              {detail.professional}
            </span>
          </div>
        </OverlayCard>

        {/* Contacto del paciente - Card */}
        {(detail.patientPhone || detail.patientEmail || detail.referredBy) && (
          <OverlayCard
            icon={<MD3Icon name='AccountCircleRounded' size={1.125} />}
            label='Contacto'
          >
            <div className='flex flex-col gap-2'>
              {detail.patientPhone && (
                <div className='flex items-center gap-2 text-sm text-[var(--color-neutral-900)]'>
                  <MD3Icon
                    name='PhoneRounded'
                    size={1}
                    className='text-[var(--color-neutral-500)]'
                  />
                  <span>{detail.patientPhone}</span>
                </div>
              )}
              {detail.patientEmail && (
                <div className='flex items-center gap-2 text-sm text-[var(--color-neutral-900)]'>
                  <MD3Icon
                    name='EmailRounded'
                    size={1}
                    className='text-[var(--color-neutral-500)]'
                  />
                  <span>{detail.patientEmail}</span>
                </div>
              )}
              {detail.referredBy && (
                <div className='flex items-center gap-2 text-sm'>
                  <span className='text-[var(--color-neutral-500)]'>
                    Referido por:
                  </span>
                  <span className='font-medium text-[var(--color-neutral-900)]'>
                    {detail.referredBy}
                  </span>
                </div>
              )}
            </div>
          </OverlayCard>
        )}

        {/* Fecha y ubicación - Card */}
        <OverlayCard
          icon={<MD3Icon name='CalendarMonthRounded' size={1.125} />}
          label={detail.locationLabel}
        >
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-medium text-[var(--color-neutral-900)]'>
              {detail.date}
            </p>
            {detail.duration && (
              <p className='text-xs text-[var(--color-neutral-600)]'>
                {detail.duration}
              </p>
            )}
          </div>
        </OverlayCard>
      </div>

      {/* Footer - Acciones rápidas mejoradas */}
      {showQuickActions && (
        <div className='shrink-0 border-t border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] p-4'>
          <p className='mb-3 text-xs font-medium text-[var(--color-neutral-500)]'>
            Acciones rápidas
          </p>
          <div className='grid grid-cols-2 gap-3'>
            {/* Botón Ver ficha */}
            <button
              type='button'
              onClick={() => onViewPatient?.()}
              className='flex items-center justify-center gap-2 rounded-xl border border-[var(--color-neutral-300)] bg-white py-3 text-sm font-medium text-[var(--color-neutral-900)] shadow-sm transition-all hover:border-[var(--color-neutral-400)] hover:shadow-md'
            >
              <MD3Icon name='FolderOpenRounded' size={1.25} />
              <span>Ver ficha</span>
            </button>

            {/* Botón Cobrar */}
            {onPaymentAction &&
              ((detail.paymentInfo && detail.paymentInfo.pendingAmount > 0) ||
                detail.economicStatus === 'Pendiente de cobro' ||
                detail.economicStatus === 'Pendiente de pago' ||
                detail.economicStatus?.includes('Pendiente')) && (
                <button
                  type='button'
                  onClick={() => onPaymentAction?.()}
                  className='flex items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-500)] py-3 text-sm font-medium text-[var(--color-brand-900)] shadow-sm transition-all hover:bg-[var(--color-brand-400)] hover:shadow-md'
                >
                  <MD3Icon name='PaymentsRounded' size={1.25} />
                  <span>
                    Cobrar{' '}
                    {detail.paymentInfo
                      ? `${detail.paymentInfo.pendingAmount.toLocaleString(
                          'es-ES',
                          { minimumFractionDigits: 2 }
                        )} ${detail.paymentInfo.currency}`
                      : detail.economicAmount || ''}
                  </span>
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  )
}

// Nueva sección como card con fondo sutil
function OverlayCard({
  icon,
  label,
  children
}: {
  icon: React.ReactNode
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='rounded-lg bg-[var(--color-neutral-50)] p-3'>
      <div className='mb-2 flex items-center gap-2 text-[var(--color-neutral-600)]'>
        {icon}
        <span className='text-xs font-medium'>{label}</span>
      </div>
      <div className='pl-6'>{children}</div>
    </div>
  )
}
