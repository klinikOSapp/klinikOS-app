'use client'

import { VISIT_STATUS_CONFIG } from '@/components/agenda/types'
import {
  AccessTimeFilledRounded,
  AttachFileRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  DescriptionRounded,
  MedicalServicesRounded,
  MoreVertRounded,
  PersonRounded,
  UploadFileRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import ExpandedTextInput from '@/components/pacientes/shared/ExpandedTextInput'
import { PROFESSIONALS } from '@/components/pacientes/shared/treatmentTypes'
import type {
  Appointment,
  VisitSOAPNotes,
  VisitStatus
} from '@/context/AppointmentsContext'
import React from 'react'
import {
  calculateDurationMinutes,
  formatShortDate,
  formatTimeRange
} from './types'

// ============================================
// Table Components (copied from Treatments.tsx for consistency)
// ============================================
function TableHeaderCell({
  children,
  className,
  width,
  sticky,
  stickyPosition = 'left'
}: {
  children?: React.ReactNode
  className?: string
  width?: string
  sticky?: boolean
  stickyPosition?: 'left' | 'right'
}) {
  const stickyClasses = sticky
    ? `sticky ${
        stickyPosition === 'left' ? 'left-0' : 'right-0'
      } z-10 bg-[#F8FAFB]`
    : ''
  return (
    <th
      scope='col'
      className={[
        'border-b-[0.5px] border-[#CBD3D9] px-[0.5rem] py-[0.25rem] text-left text-[1rem] leading-[1.5rem] font-normal text-[#535C66]',
        stickyClasses,
        className
      ].join(' ')}
      style={{ width }}
    >
      {children}
    </th>
  )
}

function TableBodyCell({
  children,
  className,
  width,
  sticky,
  stickyPosition = 'left',
  rowSelected
}: {
  children: React.ReactNode
  className?: string
  width?: string
  sticky?: boolean
  stickyPosition?: 'left' | 'right'
  rowSelected?: boolean
}) {
  const stickyClasses = sticky
    ? `sticky ${stickyPosition === 'left' ? 'left-0' : 'right-0'} z-10 ${
        rowSelected ? 'bg-[#E9FBF9]' : 'bg-white'
      }`
    : ''
  return (
    <td
      className={[
        'border-b-[0.5px] border-[#CBD3D9] px-[0.5rem] py-[0.5rem] text-[1rem] leading-[1.5rem] text-[#24282C]',
        stickyClasses,
        className
      ].join(' ')}
      style={{ width }}
    >
      {children}
    </td>
  )
}

// ============================================
// Editable Cell Component (copied from Treatments.tsx)
// ============================================
type EditableCellProps = {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'number'
  placeholder?: string
  className?: string
  disabled?: boolean
}

function EditableCell({
  value,
  onChange,
  type = 'text',
  placeholder = '',
  className = '',
  disabled = false
}: EditableCellProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-transparent border-none outline-none text-[0.875rem] leading-[1.25rem] text-[#24282C] 
        focus:bg-[var(--color-neutral-50)] rounded px-1 py-0.5 transition-colors
        disabled:text-[#AEB8C2] disabled:cursor-not-allowed
        ${className}`}
    />
  )
}

// ============================================
// Visit Row Component
// ============================================
type VisitRowProps = {
  appointment: Appointment
  isUpcoming: boolean
  onUpdateAppointment: (updates: Partial<Appointment>) => void
  onUpdateSOAPNotes: (notes: Partial<VisitSOAPNotes>) => void
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>) => void
}

function VisitRow({
  appointment,
  isUpcoming,
  onUpdateAppointment,
  onUpdateSOAPNotes,
  onOpenMenu
}: VisitRowProps) {
  const visitStatus = appointment.visitStatus || 'scheduled'
  const statusConfig = VISIT_STATUS_CONFIG[visitStatus]
  const treatmentCount = appointment.linkedTreatments?.length || 0
  const attachmentCount = appointment.attachments?.length || 0

  // Combine S/O notes for display
  const soNotes = [
    appointment.soapNotes?.subjective,
    appointment.soapNotes?.objective
  ]
    .filter(Boolean)
    .join('\n')

  // Combine A/P notes for display
  const apNotes = [
    appointment.soapNotes?.assessment,
    appointment.soapNotes?.plan
  ]
    .filter(Boolean)
    .join('\n')

  // Handler for S/O notes change
  const handleSOChange = (value: string) => {
    // Split by newline - first part is subjective, rest is objective
    const parts = value.split('\n')
    const subjective = parts[0] || ''
    const objective = parts.slice(1).join('\n') || ''
    onUpdateSOAPNotes({ subjective, objective })
  }

  // Handler for A/P notes change
  const handleAPChange = (value: string) => {
    // Split by newline - first part is assessment, rest is plan
    const parts = value.split('\n')
    const assessment = parts[0] || ''
    const plan = parts.slice(1).join('\n') || ''
    onUpdateSOAPNotes({ assessment, plan })
  }

  const rowBg = 'bg-white hover:bg-[var(--color-neutral-50)]'

  return (
    <tr className={`${rowBg} transition-colors`}>
      {/* Fecha */}
      <TableBodyCell width='7rem'>
        <div className='flex items-center gap-1.5'>
          <CalendarMonthRounded
            className={`w-[1rem] h-[1rem] ${
              isUpcoming
                ? 'text-[var(--color-brand-500)]'
                : 'text-[var(--color-neutral-400)]'
            }`}
          />
          <span
            className={`text-[0.875rem] leading-[1.25rem] ${
              isUpcoming ? 'text-[var(--color-brand-700)]' : 'text-[#24282C]'
            }`}
          >
            {formatShortDate(appointment.date)}
          </span>
        </div>
      </TableBodyCell>

      {/* Hora */}
      <TableBodyCell width='6rem'>
        <span className='text-[0.875rem] leading-[1.25rem] text-[#24282C]'>
          {formatTimeRange(appointment.startTime, appointment.endTime)}
        </span>
      </TableBodyCell>

      {/* Profesional - Select */}
      <TableBodyCell width='10rem'>
        <select
          value={appointment.professional}
          onChange={(e) =>
            onUpdateAppointment({ professional: e.target.value })
          }
          className='w-full bg-transparent border-none outline-none text-[0.875rem] leading-[1.25rem] text-[#24282C] 
            focus:bg-[var(--color-neutral-50)] rounded px-1 py-0.5 cursor-pointer'
        >
          {PROFESSIONALS.map((prof) => (
            <option key={prof.value} value={prof.value}>
              {prof.label}
            </option>
          ))}
        </select>
      </TableBodyCell>

      {/* Motivo - Editable */}
      <TableBodyCell width='12rem'>
        <EditableCell
          value={appointment.reason}
          onChange={(value) => onUpdateAppointment({ reason: value })}
          placeholder='Motivo de consulta'
          className='truncate'
        />
      </TableBodyCell>

      {/* Estado - Select */}
      <TableBodyCell width='7rem'>
        <select
          value={visitStatus}
          onChange={(e) =>
            onUpdateAppointment({ visitStatus: e.target.value as VisitStatus })
          }
          className='w-full border-none outline-none text-[0.75rem] font-medium rounded-full px-2 py-0.5 cursor-pointer'
          style={{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.textColor
          }}
        >
          <option value='scheduled'>Programada</option>
          <option value='waiting_room'>En sala espera</option>
          <option value='call_patient'>Llamar</option>
          <option value='in_consultation'>En consulta</option>
          <option value='completed'>Completada</option>
        </select>
      </TableBodyCell>

      {/* Duración */}
      <TableBodyCell width='5rem'>
        <span className='text-[0.875rem] leading-[1.25rem] text-[var(--color-neutral-600)]'>
          {appointment.visitStatus === 'completed' &&
          appointment.consultationDuration
            ? `${calculateDurationMinutes(
                appointment.consultationDuration
              )} min`
            : '—'}
        </span>
      </TableBodyCell>

      {/* Tratamientos */}
      <TableBodyCell width='5rem'>
        <div className='flex items-center gap-1'>
          <MedicalServicesRounded
            className={`w-[1rem] h-[1rem] ${
              treatmentCount > 0
                ? 'text-[var(--color-brand-500)]'
                : 'text-[var(--color-neutral-300)]'
            }`}
          />
          <span
            className={`text-[0.875rem] leading-[1.25rem] ${
              treatmentCount > 0
                ? 'text-[var(--color-neutral-700)]'
                : 'text-[var(--color-neutral-400)]'
            }`}
          >
            {treatmentCount > 0 ? treatmentCount : '—'}
          </span>
        </div>
      </TableBodyCell>

      {/* S/O (Notas) - ExpandedTextInput */}
      <TableBodyCell className='max-w-[14rem]'>
        <ExpandedTextInput
          value={soNotes}
          onChange={handleSOChange}
          placeholder='S/O...'
        />
      </TableBodyCell>

      {/* A/P (Notas) - ExpandedTextInput */}
      <TableBodyCell className='max-w-[14rem]'>
        <ExpandedTextInput
          value={apNotes}
          onChange={handleAPChange}
          placeholder='A/P...'
        />
      </TableBodyCell>

      {/* Adjuntos */}
      <TableBodyCell width='4rem'>
        <div className='flex items-center gap-1'>
          <AttachFileRounded
            className={`w-[1rem] h-[1rem] ${
              attachmentCount > 0
                ? 'text-[var(--color-neutral-600)]'
                : 'text-[var(--color-neutral-300)]'
            }`}
          />
          <span
            className={`text-[0.875rem] leading-[1.25rem] ${
              attachmentCount > 0
                ? 'text-[var(--color-neutral-700)]'
                : 'text-[var(--color-neutral-400)]'
            }`}
          >
            {attachmentCount > 0 ? attachmentCount : '—'}
          </span>
        </div>
      </TableBodyCell>

      {/* Acciones - Sticky right */}
      <TableBodyCell width='2.25rem' sticky stickyPosition='right'>
        <button
          type='button'
          onClick={onOpenMenu}
          className='p-[0.25rem] hover:bg-[var(--color-neutral-100)] rounded-lg transition-colors cursor-pointer'
          aria-label='Acciones'
        >
          <MoreVertRounded className='w-[1.25rem] h-[1.25rem] text-[var(--color-neutral-600)]' />
        </button>
      </TableBodyCell>
    </tr>
  )
}

// ============================================
// Main Table Component
// ============================================
type ClinicalHistoryTableProps = {
  appointments: Appointment[]
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => void
  onUpdateSOAPNotes: (id: string, notes: Partial<VisitSOAPNotes>) => void
  isUpcoming: (apt: Appointment) => boolean
  onViewDetails?: (appointmentId: string) => void
  onUploadFile?: (appointmentId: string) => void
  onMarkComplete?: (appointmentId: string) => void
}

export default function ClinicalHistoryTable({
  appointments,
  onUpdateAppointment,
  onUpdateSOAPNotes,
  isUpcoming,
  onViewDetails,
  onUploadFile,
  onMarkComplete
}: ClinicalHistoryTableProps) {
  // Menu state
  const [activeMenu, setActiveMenu] = React.useState<{
    appointmentId: string
    appointment: Appointment
    triggerRect?: DOMRect
  } | null>(null)

  if (appointments.length === 0) {
    return (
      <div className='h-full flex items-center justify-center bg-white rounded-[0.5rem]'>
        <div className='text-center py-12'>
          <CalendarMonthRounded className='w-12 h-12 text-[var(--color-neutral-300)] mx-auto mb-3' />
          <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-600)] text-body-md">
            No hay visitas para mostrar
          </p>
          <p className="font-['Inter:Regular',_sans-serif] text-[var(--color-neutral-400)] text-body-sm mt-1">
            Prueba cambiando el filtro
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-[0.5rem] overflow-hidden h-full flex flex-col'>
      <div className='overflow-x-auto flex-1'>
        <table className='w-full border-collapse min-w-[85rem]'>
          <thead className='sticky top-0 z-10'>
            <tr className='bg-[#F8FAFB]'>
              <TableHeaderCell width='7rem'>
                <div className='flex items-center gap-1.5'>
                  <CalendarMonthRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Fecha</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell width='6rem'>
                <div className='flex items-center gap-1.5'>
                  <AccessTimeFilledRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Hora</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell width='10rem'>
                <div className='flex items-center gap-1.5'>
                  <PersonRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Profesional</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell width='12rem'>
                <div className='flex items-center gap-1.5'>
                  <DescriptionRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Motivo</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell width='7rem'>Estado</TableHeaderCell>
              <TableHeaderCell width='5rem'>
                <div className='flex items-center gap-1.5'>
                  <AccessTimeFilledRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Duración</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell width='5rem'>
                <div className='flex items-center gap-1.5'>
                  <MedicalServicesRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Trat.</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell>S/O (Notas)</TableHeaderCell>
              <TableHeaderCell>A/P (Notas)</TableHeaderCell>
              <TableHeaderCell width='4rem'>
                <div className='flex items-center gap-1.5'>
                  <AttachFileRounded className='w-[1rem] h-[1rem] text-[#535C66]' />
                  <span>Adj.</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell width='2.25rem' sticky stickyPosition='right' />
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <VisitRow
                key={apt.id}
                appointment={apt}
                isUpcoming={isUpcoming(apt)}
                onUpdateAppointment={(updates) =>
                  onUpdateAppointment(apt.id, updates)
                }
                onUpdateSOAPNotes={(notes) => onUpdateSOAPNotes(apt.id, notes)}
                onOpenMenu={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setActiveMenu({
                    appointmentId: apt.id,
                    appointment: apt,
                    triggerRect: rect
                  })
                }}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className='px-4 py-2 bg-[#F8FAFB] border-t border-[var(--color-neutral-200)] shrink-0'>
        <span className='text-[0.8125rem] text-[var(--color-neutral-600)]'>
          {appointments.length} visita{appointments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Actions menu */}
      {activeMenu && (
        <div className='fixed inset-0 z-50' onClick={() => setActiveMenu(null)}>
          <div
            className='absolute bg-white rounded-lg shadow-lg border border-[var(--color-neutral-200)] py-1 min-w-[180px]'
            style={{
              top: activeMenu.triggerRect
                ? activeMenu.triggerRect.bottom + 4
                : 0,
              left: activeMenu.triggerRect
                ? activeMenu.triggerRect.left - 160
                : 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ver detalles */}
            <button
              type='button'
              className='w-full px-3 py-2 text-left text-[0.875rem] text-[#24282C] hover:bg-[var(--color-neutral-50)] cursor-pointer flex items-center gap-2'
              onClick={() => {
                onViewDetails?.(activeMenu.appointmentId)
                setActiveMenu(null)
              }}
            >
              <VisibilityRounded className='w-[1.25rem] h-[1.25rem] text-[var(--color-neutral-500)]' />
              Ver detalles
            </button>

            {/* Subir archivo */}
            <button
              type='button'
              className='w-full px-3 py-2 text-left text-[0.875rem] text-[#24282C] hover:bg-[var(--color-neutral-50)] cursor-pointer flex items-center gap-2'
              onClick={() => {
                onUploadFile?.(activeMenu.appointmentId)
                setActiveMenu(null)
              }}
            >
              <UploadFileRounded className='w-[1.25rem] h-[1.25rem] text-[var(--color-neutral-500)]' />
              Subir archivo
            </button>

            {/* Marcar como completada - solo si no está completada */}
            {activeMenu.appointment.visitStatus !== 'completed' && (
              <button
                type='button'
                className='w-full px-3 py-2 text-left text-[0.875rem] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)] cursor-pointer flex items-center gap-2'
                onClick={() => {
                  onMarkComplete?.(activeMenu.appointmentId)
                  setActiveMenu(null)
                }}
              >
                <CheckCircleRounded className='w-[1.25rem] h-[1.25rem] text-[var(--color-brand-500)]' />
                Marcar completada
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
