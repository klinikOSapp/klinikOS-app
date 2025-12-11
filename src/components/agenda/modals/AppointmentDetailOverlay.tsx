'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import type { CSSProperties } from 'react'
import type { EventDetail } from '../types'

export interface AppointmentDetailOverlayProps {
  detail: EventDetail
  box: string
  position: { top: string; left: string; maxHeight?: string }
}

const overlayStyle: CSSProperties = {
  width: 'var(--scheduler-overlay-width)',
  borderRadius: '0.5rem 0.5rem 0 0'
}

export default function AppointmentDetailOverlay({
  detail,
  box,
  position
}: AppointmentDetailOverlayProps) {
  return (
    <div
      data-overlay='true'
      id='scheduler-event-overlay'
      className='pointer-events-auto absolute overflow-y-auto border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[var(--scheduler-overlay-shadow)]'
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
      <div className='flex items-center justify-between rounded-tl-[0.5rem] rounded-tr-[0.5rem] bg-[var(--color-brand-100)] px-[var(--scheduler-overlay-header-pad-x)] py-[var(--scheduler-overlay-header-pad-y)]'>
        <h3 className='text-title-md font-medium text-[var(--color-neutral-900)] leading-[var(--leading-title-md)]'>
          {detail.title}
        </h3>
        <span className='text-base font-bold text-[var(--color-neutral-900)] leading-6'>
          {box}
        </span>
      </div>

      {/* Body - 488px height from Figma */}
      <div
        className='flex flex-col text-label-sm text-[var(--color-neutral-600)]'
        style={{
          gap: 'var(--scheduler-overlay-section-gap)',
          paddingInline: 'var(--scheduler-overlay-body-pad-x)',
          paddingTop: 'var(--scheduler-overlay-body-pad-top)',
          paddingBottom: 'var(--scheduler-overlay-body-pad-bottom)'
        }}
      >
        {/* Fecha y ubicación - top: 16px from Figma */}
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

        {/* Paciente - top: 108px from Figma */}
        <OverlaySection
          icon={
            <MD3Icon
              name='AccountCircleRounded'
              size='inherit'
              className='text-[var(--color-neutral-600)]'
            />
          }
          label={detail.patientLabel}
        >
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
              {detail.patientFull}
            </p>
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

        {/* Profesional - top: 248px from Figma */}
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

        {/* Económico - top: 328px from Figma */}
        {(detail.economicAmount || detail.economicStatus) && (
          <OverlaySection
            icon={
              <MD3Icon
                name='AccountCircleRounded'
                size='inherit'
                className='text-[var(--color-neutral-600)]'
              />
            }
            label={detail.economicLabel || 'Económico'}
          >
            <div className='flex flex-col gap-1'>
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
            </div>
          </OverlaySection>
        )}

        {/* Notas - top: 422px from Figma */}
        {detail.notes && (
          <OverlaySection
            icon={
              <MD3Icon
                name='ArticleRounded'
                size='inherit'
                className='text-[var(--color-neutral-600)]'
              />
            }
            label={detail.notesLabel || 'Notas'}
          >
            <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
              {detail.notes}
            </p>
          </OverlaySection>
        )}
      </div>
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
