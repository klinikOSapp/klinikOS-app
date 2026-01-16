'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import type { CSSProperties } from 'react'
import QuickActionsSection from '../QuickActionsSection'
import type { EventDetail } from '../types'

export interface AppointmentDetailOverlayProps {
  detail: EventDetail
  box: string
  position: { top: string; left: string; maxHeight?: string }
  // Callbacks para acciones rápidas
  onPaymentAction?: () => void
  onViewPatient?: () => void
}

const overlayStyle: CSSProperties = {
  width: 'var(--scheduler-overlay-width)',
  borderRadius: '0.5rem 0.5rem 0 0'
}

export default function AppointmentDetailOverlay({
  detail,
  box,
  position,
  onPaymentAction,
  onViewPatient
}: AppointmentDetailOverlayProps) {
  const showQuickActions = onPaymentAction || onViewPatient

  return (
    <div
      data-overlay='true'
      id='scheduler-event-overlay'
      className='pointer-events-auto absolute z-20 flex flex-col border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[var(--scheduler-overlay-shadow)]'
      style={{
        ...overlayStyle,
        top: position.top,
        left: position.left,
        height: position.maxHeight ?? 'var(--scheduler-overlay-height)',
        maxHeight: position.maxHeight
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* Header - 44px height from Figma */}
      <div className='flex shrink-0 items-center justify-between rounded-tl-[0.5rem] rounded-tr-[0.5rem] bg-[var(--color-brand-100)] px-[var(--scheduler-overlay-header-pad-x)] py-[var(--scheduler-overlay-header-pad-y)]'>
        <h3 className='text-title-md font-medium text-[var(--color-neutral-900)] leading-[var(--leading-title-md)]'>
          {detail.title}
        </h3>
        <span className='text-base font-bold text-[var(--color-neutral-900)] leading-6'>
          {box}
        </span>
      </div>

      {/* Body - Scrollable content area */}
      <div
        className='flex min-h-0 flex-1 flex-col overflow-y-auto text-label-sm text-[var(--color-neutral-600)]'
        style={{
          gap: 'var(--scheduler-overlay-section-gap)',
          paddingInline: 'var(--scheduler-overlay-body-pad-x)',
          paddingTop: 'var(--scheduler-overlay-body-pad-top)',
          paddingBottom: showQuickActions ? '1rem' : 'var(--scheduler-overlay-body-pad-bottom)'
        }}
      >
        {/* Información principal de la cita */}
        <div className='flex flex-col gap-1'>
          {/* Nombre del paciente - Negrita */}
          <p className='text-base font-bold text-[var(--color-neutral-900)] leading-6'>
            {detail.patientFull}
          </p>
          {/* Tratamiento - Cursiva */}
          <p className='text-sm italic text-[var(--color-neutral-700)] leading-5'>
            {detail.treatmentDescription || detail.title}
          </p>
          {/* Notas */}
          {detail.notes && (
            <p className='mt-1 text-sm font-normal text-[var(--color-neutral-600)] leading-5'>
              {detail.notes}
            </p>
          )}
        </div>

        {/* Económico - Con soporte para pagos parciales */}
        {(detail.economicAmount ||
          detail.economicStatus ||
          detail.paymentInfo) && (
          <OverlaySection
            icon={
              <MD3Icon
                name='EuroRounded'
                size='inherit'
                className='text-[var(--color-neutral-600)]'
              />
            }
            label={detail.economicLabel || 'Económico'}
          >
            <div className='flex flex-col gap-2'>
              {/* Si hay paymentInfo, mostrar desglose detallado */}
              {detail.paymentInfo ? (
                <>
                  {/* Total */}
                  <div className='flex items-center justify-between text-sm leading-5'>
                    <span className='font-normal text-[var(--color-neutral-600)]'>
                      Total:
                    </span>
                    <span className='font-medium text-[var(--color-neutral-900)]'>
                      {detail.paymentInfo.totalAmount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2
                      })}{' '}
                      {detail.paymentInfo.currency}
                    </span>
                  </div>

                  {/* Pagado con porcentaje */}
                  <div className='flex items-center justify-between text-sm leading-5'>
                    <span className='font-normal text-[var(--color-neutral-600)]'>
                      Pagado:
                    </span>
                    <span className='font-medium text-[var(--color-success-600)]'>
                      {detail.paymentInfo.paidAmount.toLocaleString('es-ES', {
                        minimumFractionDigits: 2
                      })}{' '}
                      {detail.paymentInfo.currency}
                      {detail.paymentInfo.totalAmount > 0 && (
                        <span className='ml-1 text-xs text-[var(--color-neutral-500)]'>
                          (
                          {Math.round(
                            (detail.paymentInfo.paidAmount /
                              detail.paymentInfo.totalAmount) *
                              100
                          )}
                          %)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Pendiente */}
                  <div className='flex items-center justify-between text-sm leading-5'>
                    <span className='font-normal text-[var(--color-neutral-600)]'>
                      Pendiente:
                    </span>
                    <span
                      className={`font-medium ${
                        detail.paymentInfo.pendingAmount > 0
                          ? 'text-amber-600'
                          : 'text-[var(--color-success-600)]'
                      }`}
                    >
                      {detail.paymentInfo.pendingAmount.toLocaleString(
                        'es-ES',
                        { minimumFractionDigits: 2 }
                      )}{' '}
                      {detail.paymentInfo.currency}
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className='mt-1'>
                    <div className='h-2 w-full overflow-hidden rounded-full bg-[var(--color-neutral-200)]'>
                      <div
                        className='h-full rounded-full bg-[var(--color-brand-500)] transition-all duration-300'
                        style={{
                          width: `${
                            detail.paymentInfo.totalAmount > 0
                              ? Math.min(
                                  100,
                                  (detail.paymentInfo.paidAmount /
                                    detail.paymentInfo.totalAmount) *
                                    100
                                )
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Plan de cuotas si existe */}
                  {detail.installmentPlan && (
                    <div className='mt-1 flex items-center gap-1.5 text-sm leading-5'>
                      <MD3Icon
                        name='CalendarMonthRounded'
                        size={0.875}
                        className='text-[var(--color-neutral-500)]'
                      />
                      <span className='font-normal text-[var(--color-neutral-600)]'>
                        Cuota {detail.installmentPlan.currentInstallment} de{' '}
                        {detail.installmentPlan.totalInstallments}
                      </span>
                      <span className='text-xs text-[var(--color-neutral-500)]'>
                        (
                        {detail.installmentPlan.amountPerInstallment.toLocaleString(
                          'es-ES',
                          { minimumFractionDigits: 2 }
                        )}{' '}
                        {detail.paymentInfo.currency}/cuota)
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Fallback al formato anterior si no hay paymentInfo */
                <>
                  {detail.economicAmount && (
                    <div
                      className='flex items-center text-sm font-normal text-[var(--color-neutral-900)] leading-5'
                      style={{ gap: 'var(--scheduler-overlay-contact-gap)' }}
                    >
                      <MD3Icon
                        name='EuroRounded'
                        size={1}
                        className='text-[var(--color-neutral-600)]'
                      />
                      <span>{detail.economicAmount}</span>
                    </div>
                  )}
                  {detail.economicStatus && (
                    <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
                      {detail.economicStatus}
                    </p>
                  )}
                </>
              )}
            </div>
          </OverlaySection>
        )}

        {/* Profesional */}
        <OverlaySection
          icon={
            <MD3Icon
              name='MonitorHeartRounded'
              size='inherit'
              className='text-[var(--color-neutral-600)]'
            />
          }
          label={detail.professionalLabel}
        >
          <div
            className='flex items-center text-sm font-normal text-[var(--color-neutral-900)] leading-5'
            style={{ gap: 'var(--scheduler-overlay-icon-gap)' }}
          >
            <span
              aria-hidden='true'
              className='inline-flex shrink-0 rounded-full'
              style={{
                width: 'var(--scheduler-overlay-avatar-size)',
                height: 'var(--scheduler-overlay-avatar-size)',
                backgroundColor: 'var(--scheduler-overlay-avatar-color)'
              }}
            />
            <span>{detail.professional}</span>
          </div>
        </OverlaySection>

        {/* Contacto del paciente - Solo si hay datos de contacto */}
        {(detail.patientPhone || detail.patientEmail || detail.referredBy) && (
          <OverlaySection
            icon={
              <MD3Icon
                name='AccountCircleRounded'
                size='inherit'
                className='text-[var(--color-neutral-600)]'
              />
            }
            label='Contacto'
          >
            <div className='flex flex-col gap-1'>
              {detail.patientPhone && (
                <div
                  className='flex items-center text-sm font-normal text-[var(--color-neutral-900)] leading-5'
                  style={{ gap: 'var(--scheduler-overlay-contact-gap)' }}
                >
                  <MD3Icon
                    name='PhoneRounded'
                    size={1}
                    className='text-[var(--color-neutral-600)]'
                  />
                  <span>{detail.patientPhone}</span>
                </div>
              )}
              {detail.patientEmail && (
                <div
                  className='flex items-center text-sm font-normal text-[var(--color-neutral-900)] leading-5'
                  style={{ gap: 'var(--scheduler-overlay-contact-gap)' }}
                >
                  <MD3Icon
                    name='EmailRounded'
                    size={1}
                    className='text-[var(--color-neutral-600)]'
                  />
                  <span>{detail.patientEmail}</span>
                </div>
              )}
              {detail.referredBy && (
                <div className='flex items-center gap-1.5 text-sm leading-5'>
                  <span className='font-normal text-[var(--color-neutral-600)]'>
                    Referido por:
                  </span>
                  <span className='font-normal text-[var(--color-neutral-900)]'>
                    {detail.referredBy}
                  </span>
                </div>
              )}
            </div>
          </OverlaySection>
        )}

        {/* Fecha y ubicación */}
        <OverlaySection
          icon={
            <MD3Icon
              name='CalendarMonthRounded'
              size='inherit'
              className='text-[var(--color-neutral-600)]'
            />
          }
          label={detail.locationLabel}
        >
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
              {detail.date}
            </p>
            {detail.duration && (
              <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
                {detail.duration}
              </p>
            )}
          </div>
        </OverlaySection>

      </div>

      {/* Footer - Acciones rápidas fijas (no afectadas por scroll) */}
      {showQuickActions && (
        <div
          className='shrink-0 border-t border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'
          style={{
            paddingInline: 'var(--scheduler-overlay-body-pad-x)',
            paddingBlock: '1rem'
          }}
        >
          <QuickActionsSection
            showPaymentAction={
              !!onPaymentAction &&
              // Usar paymentInfo si existe
              ((detail.paymentInfo && detail.paymentInfo.pendingAmount > 0) ||
                // Fallback al sistema anterior
                detail.economicStatus === 'Pendiente de cobro' ||
                detail.economicStatus === 'Pendiente de pago' ||
                detail.economicStatus?.includes('Pendiente') ||
                false)
            }
            paymentAmount={
              // Mostrar el monto pendiente si hay paymentInfo
              detail.paymentInfo
                ? `${detail.paymentInfo.pendingAmount.toLocaleString('es-ES', {
                    minimumFractionDigits: 2
                  })} ${detail.paymentInfo.currency}`
                : detail.economicAmount
            }
            onPaymentClick={() => onPaymentAction?.()}
            onViewPatientClick={() => onViewPatient?.()}
          />
        </div>
      )}
    </div>
  )
}

function OverlaySection({
  icon,
  label,
  children
}: {
  icon: React.ReactNode
  label: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className='flex items-start gap-[var(--scheduler-overlay-icon-gap)]'>
      <span
        aria-hidden='true'
        className='flex shrink-0 items-center justify-center text-[var(--scheduler-overlay-icon-size)]'
        style={{
          width: 'var(--scheduler-overlay-icon-size)',
          height: 'var(--scheduler-overlay-icon-size)'
        }}
      >
        {icon}
      </span>
      <div
        className='flex flex-col'
        style={{ gap: 'var(--scheduler-overlay-value-gap)' }}
      >
        <span className='text-xs font-normal text-[var(--color-neutral-600)] leading-4'>
          {label}
        </span>
        <div>{children}</div>
      </div>
    </div>
  )
}
