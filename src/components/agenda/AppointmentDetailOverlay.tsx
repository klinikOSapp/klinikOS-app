'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import ArticleRounded from '@mui/icons-material/ArticleRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CancelRounded from '@mui/icons-material/CancelRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import EditRounded from '@mui/icons-material/EditRounded'
import EmailRounded from '@mui/icons-material/EmailRounded'
import EuroRounded from '@mui/icons-material/EuroRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import PersonAddRounded from '@mui/icons-material/PersonAddRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import type { CSSProperties } from 'react'
import type { EventDetail } from './types'

export interface AppointmentDetailOverlayProps {
  detail: EventDetail
  box: string
  position: { top: string; left: string; maxHeight?: string }
  // Action handlers
  onModify?: (appointmentId: number) => void
  onCancel?: (appointmentId: number) => void
  onAssignStaff?: (appointmentId: number) => void
  // Hold handlers
  onCancelHold?: (holdId: number) => void
  onConfirmHold?: (holdId: number) => void
  onModifyHold?: (holdId: number) => void
  // Permissions
  canModify?: boolean
  canCancel?: boolean
  canAssignStaff?: boolean
}

const overlayStyle: CSSProperties = {
  width: 'var(--scheduler-overlay-width)',
  borderRadius: '0.5rem 0.5rem 0 0'
}

export default function AppointmentDetailOverlay({
  detail,
  box,
  position,
  onModify,
  onCancel,
  onAssignStaff,
  onCancelHold,
  onConfirmHold,
  onModifyHold,
  canModify = false,
  canCancel = false,
  canAssignStaff = false
}: AppointmentDetailOverlayProps) {
  const isHold = Boolean(detail.appointmentHoldId)
  const hasActions =
    (isHold && (onCancelHold || onConfirmHold || onModifyHold)) ||
    ((canModify || canCancel || canAssignStaff) && detail.appointmentId)
  
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
      
      {/* Action Buttons - Only shown for users with permissions */}
      {hasActions && (
        <div className='flex items-center gap-2 border-b border-[var(--color-border-default)] px-[var(--scheduler-overlay-body-pad-x)] py-2'>
          {detail.appointmentId && canModify && detail.appointmentStatus !== 'cancelled' && (
            <button
              type='button'
              onClick={() => detail.appointmentId && onModify?.(detail.appointmentId)}
              className='flex items-center gap-1.5 rounded-md bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100'
            >
              <EditRounded sx={{ fontSize: '1rem' }} />
              <span>Modificar</span>
            </button>
          )}
          {detail.appointmentHoldId && onModifyHold && (
            <button
              type='button'
              onClick={() => detail.appointmentHoldId && onModifyHold(detail.appointmentHoldId)}
              className='flex items-center gap-1.5 rounded-md bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-100'
            >
              <EditRounded sx={{ fontSize: '1rem' }} />
              <span>Modificar</span>
            </button>
          )}
          {detail.appointmentId && canCancel && detail.appointmentStatus !== 'cancelled' && (
            <button
              type='button'
              onClick={() => detail.appointmentId && onCancel?.(detail.appointmentId)}
              className='flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100'
            >
              <CancelRounded sx={{ fontSize: '1rem' }} />
              <span>Cancelar</span>
            </button>
          )}
          {detail.appointmentHoldId && onCancelHold && (
            <button
              type='button'
              onClick={() => detail.appointmentHoldId && onCancelHold(detail.appointmentHoldId)}
              className='flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100'
            >
              <CancelRounded sx={{ fontSize: '1rem' }} />
              <span>Cancelar</span>
            </button>
          )}
          {detail.appointmentHoldId && onConfirmHold && (
            <button
              type='button'
              onClick={() => detail.appointmentHoldId && onConfirmHold(detail.appointmentHoldId)}
              className='flex items-center gap-1.5 rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100'
            >
              <CheckRounded sx={{ fontSize: '1rem' }} />
              <span>Confirmar</span>
            </button>
          )}
          {detail.appointmentId && canAssignStaff && detail.appointmentStatus !== 'cancelled' && (
            <button
              type='button'
              onClick={() => detail.appointmentId && onAssignStaff?.(detail.appointmentId)}
              className='flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200'
            >
              <PersonAddRounded sx={{ fontSize: '1rem' }} />
              <span>Asignar</span>
            </button>
          )}
        </div>
      )}

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
            <CalendarMonthRounded
              className='text-[var(--color-neutral-600)]'
              fontSize='inherit'
            />
          }
          label={detail.locationLabel}
        >
          <div className='flex flex-col gap-1'>
            <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
              {detail.date}
            </p>
            {/* Show time range with start and end time */}
            {detail.startTime && (
              <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
                {detail.startTime}{detail.endTime ? ` - ${detail.endTime}` : ''}
              </p>
            )}
            {/* Source/Origin */}
            {detail.source && (
              <p className='text-sm font-normal text-[var(--color-neutral-500)] leading-5'>
                Origen: {detail.source}
              </p>
            )}
          </div>
        </OverlaySection>

        {/* Paciente - top: 108px from Figma */}
        <OverlaySection
          icon={
            <AccountCircleRounded
              className='text-[var(--color-neutral-600)]'
              fontSize='inherit'
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
                <PhoneRounded
                  className='text-[var(--color-neutral-600)]'
                  sx={{ fontSize: '1rem' }}
                />
                <span>{detail.patientPhone}</span>
              </div>
            )}
            {detail.patientEmail && (
              <div
                className='flex items-center text-sm font-normal text-[var(--color-neutral-900)] leading-5'
                style={{ gap: 'var(--scheduler-overlay-contact-gap)' }}
              >
                <EmailRounded
                  className='text-[var(--color-neutral-600)]'
                  sx={{ fontSize: '1rem' }}
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
            <MonitorHeartRounded
              className='text-[var(--color-neutral-600)]'
              fontSize='inherit'
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
              <AccountCircleRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='inherit'
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
                  <EuroRounded
                    className='text-[var(--color-neutral-600)]'
                    sx={{ fontSize: '1rem' }}
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

        {/* Notas de cita */}
        {detail.notes && (
          <OverlaySection
            icon={
              <ArticleRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='inherit'
              />
            }
            label='Notas de cita'
          >
            <p className='text-sm font-normal text-[var(--color-neutral-900)] leading-5'>
              {detail.notes}
            </p>
          </OverlaySection>
        )}

        {/* Notas clínicas - from appointment_notes table */}
        {detail.clinicalNotesStructured && detail.clinicalNotesStructured.length > 0 && (
          <OverlaySection
            icon={
              <ArticleRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='inherit'
              />
            }
            label='Notas clínicas'
          >
            <div className='flex flex-col gap-3'>
              {detail.clinicalNotesStructured.map((note, idx) => (
                <div key={idx} className='rounded-md border border-neutral-200 bg-neutral-50 p-3'>
                  {/* Note header with date and author */}
                  {(note.createdAt || note.createdBy) && (
                    <div className='mb-2 flex items-center gap-2 text-xs text-neutral-500'>
                      {note.createdAt && <span>{note.createdAt}</span>}
                      {note.createdBy && <span>• {note.createdBy}</span>}
                    </div>
                  )}
                  
                  {/* SOAP format display */}
                  {note.soap ? (
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <p className='text-xs font-medium text-neutral-600'>Subjetivo</p>
                        <p className='text-xs text-neutral-400'>¿Por qué viene?</p>
                        <p className='mt-1 text-sm text-neutral-900'>{note.soap.S || '-'}</p>
                      </div>
                      <div>
                        <p className='text-xs font-medium text-neutral-600'>Objetivo</p>
                        <p className='text-xs text-neutral-400'>¿Qué tiene?</p>
                        <p className='mt-1 text-sm text-neutral-900'>{note.soap.O || '-'}</p>
                      </div>
                      <div>
                        <p className='text-xs font-medium text-neutral-600'>Evaluación</p>
                        <p className='text-xs text-neutral-400'>¿Qué le hacemos?</p>
                        <p className='mt-1 text-sm text-neutral-900'>{note.soap.A || '-'}</p>
                      </div>
                      <div>
                        <p className='text-xs font-medium text-neutral-600'>Plan</p>
                        <p className='text-xs text-neutral-400'>Tratamiento a seguir</p>
                        <p className='mt-1 text-sm text-neutral-900'>{note.soap.P || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    /* Regular note format */
                    <div>
                      <p className='text-xs font-medium text-neutral-600'>[{note.type}]</p>
                      <p className='mt-1 text-sm text-neutral-900'>{note.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
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
