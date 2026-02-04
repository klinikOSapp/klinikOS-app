'use client'

import { VISIT_STATUS_CONFIG } from '@/components/agenda/types'
import {
  AccessTimeFilledRounded,
  AttachFileRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CheckRounded,
  DescriptionRounded,
  KeyboardArrowDownRounded,
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
// Professional Dropdown Component
// ============================================
type ProfessionalDropdownProps = {
  value: string
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}

function ProfessionalDropdown({
  value,
  isOpen,
  onToggle,
  onSelect
}: ProfessionalDropdownProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  const currentLabel =
    PROFESSIONALS.find((p) => p.value === value)?.label || value

  return (
    <div className='relative inline-flex' ref={dropdownRef}>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className='inline-flex h-[1.75rem] items-center gap-1 rounded-lg px-2 text-[0.8125rem] font-medium bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)] transition-colors cursor-pointer'
      >
        <span className='truncate max-w-[7rem]'>{currentLabel}</span>
        <KeyboardArrowDownRounded
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className='absolute left-0 top-[calc(100%+0.25rem)] z-20 min-w-[10rem] max-h-[12rem] overflow-y-auto rounded-lg border border-[var(--color-neutral-200)] bg-white shadow-lg'>
          {PROFESSIONALS.map((prof) => (
            <button
              key={prof.value}
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                onSelect(prof.value)
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-[0.8125rem] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer ${
                prof.value === value ? 'font-semibold' : ''
              }`}
            >
              <span>{prof.label}</span>
              {prof.value === value && (
                <CheckRounded className='w-4 h-4 text-[var(--color-brand-500)]' />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// Treatments Hover Card Component
// ============================================
type TreatmentsHoverCardProps = {
  treatments: Appointment['linkedTreatments']
}

const TREATMENT_STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: 'bg-[var(--color-warning-100)]',
    text: 'text-[var(--color-warning-700)]',
    label: 'Pendiente'
  },
  in_progress: {
    bg: 'bg-[var(--color-info-100)]',
    text: 'text-[var(--color-info-700)]',
    label: 'En curso'
  },
  completed: {
    bg: 'bg-[var(--color-success-100)]',
    text: 'text-[var(--color-success-700)]',
    label: 'Completado'
  },
  cancelled: {
    bg: 'bg-[var(--color-neutral-200)]',
    text: 'text-[var(--color-neutral-600)]',
    label: 'Cancelado'
  }
}

function TreatmentsHoverCard({ treatments }: TreatmentsHoverCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState<{
    top: number
    left: number
  } | null>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const treatmentCount = treatments?.length || 0

  const handleMouseEnter = () => {
    if (treatmentCount === 0) return
    hoverTimeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + 4,
          left: rect.left
        })
        setIsOpen(true)
      }
    }, 300)
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setIsOpen(false)
  }

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className='relative'
    >
      <div
        className={`flex items-center gap-1 ${treatmentCount > 0 ? 'cursor-pointer' : ''}`}
      >
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

      {/* Hover card */}
      {isOpen && position && treatments && treatments.length > 0 && (
        <div
          className='fixed z-50 bg-white rounded-lg shadow-lg border border-[var(--color-neutral-200)] p-3 min-w-[280px] max-w-[360px]'
          style={{ top: position.top, left: position.left }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
          }}
          onMouseLeave={handleMouseLeave}
        >
          <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-900)] text-body-sm mb-2">
            Tratamientos ({treatments.length})
          </p>
          <div className='flex flex-col gap-2 max-h-[200px] overflow-y-auto'>
            {treatments.map((treatment) => {
              const statusConfig =
                TREATMENT_STATUS_COLORS[treatment.status] ||
                TREATMENT_STATUS_COLORS.pending
              return (
                <div
                  key={treatment.id}
                  className='flex items-start justify-between gap-2 p-2 bg-[var(--color-neutral-50)] rounded-lg'
                >
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className="font-['Inter:Medium',_sans-serif] text-[var(--color-neutral-800)] text-label-md truncate">
                        {treatment.description}
                      </p>
                      {treatment.pieceNumber && (
                        <span className='shrink-0 px-1.5 py-0.5 bg-[var(--color-neutral-200)] rounded text-[0.625rem] text-[var(--color-neutral-600)]'>
                          #{treatment.pieceNumber}
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='text-label-sm text-[var(--color-neutral-500)]'>
                        {treatment.amount}
                      </span>
                      {treatment.completedBy && (
                        <span className='text-label-sm text-[var(--color-neutral-400)]'>
                          • {treatment.completedBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[0.625rem] font-medium ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// Status Dropdown Component
// ============================================
const VISIT_STATUS_OPTIONS: Array<{ value: VisitStatus; label: string }> = [
  { value: 'scheduled', label: 'Programada' },
  { value: 'waiting_room', label: 'En sala espera' },
  { value: 'call_patient', label: 'Llamar' },
  { value: 'in_consultation', label: 'En consulta' },
  { value: 'completed', label: 'Completada' }
]

type StatusDropdownProps = {
  value: VisitStatus
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: VisitStatus) => void
}

function StatusDropdown({
  value,
  isOpen,
  onToggle,
  onSelect
}: StatusDropdownProps) {
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const statusConfig = VISIT_STATUS_CONFIG[value]

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onToggle()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  const currentLabel =
    VISIT_STATUS_OPTIONS.find((s) => s.value === value)?.label || value

  return (
    <div className='relative inline-flex' ref={dropdownRef}>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className='inline-flex h-[1.75rem] items-center gap-1 rounded-full px-2.5 text-[0.75rem] font-medium transition-colors cursor-pointer'
        style={{
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.textColor
        }}
      >
        <span>{currentLabel}</span>
        <KeyboardArrowDownRounded
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className='absolute left-0 top-[calc(100%+0.25rem)] z-20 min-w-[9rem] rounded-lg border border-[var(--color-neutral-200)] bg-white shadow-lg overflow-hidden'>
          {VISIT_STATUS_OPTIONS.map((status) => {
            const config = VISIT_STATUS_CONFIG[status.value]
            return (
              <button
                key={status.value}
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(status.value)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-[0.8125rem] hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer ${
                  status.value === value ? 'font-semibold' : ''
                }`}
                style={{ color: config.textColor }}
              >
                <div className='flex items-center gap-2'>
                  <span
                    className='w-2 h-2 rounded-full'
                    style={{ backgroundColor: config.bgColor }}
                  />
                  <span>{status.label}</span>
                </div>
                {status.value === value && (
                  <CheckRounded className='w-4 h-4 text-[var(--color-brand-500)]' />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
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
  const attachmentCount = appointment.attachments?.length || 0

  // Dropdown states
  const [openDropdown, setOpenDropdown] = React.useState<
    'professional' | 'status' | null
  >(null)

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

      {/* Profesional - Dropdown */}
      <TableBodyCell width='10rem'>
        <ProfessionalDropdown
          value={appointment.professional}
          isOpen={openDropdown === 'professional'}
          onToggle={() =>
            setOpenDropdown((prev) =>
              prev === 'professional' ? null : 'professional'
            )
          }
          onSelect={(value) => {
            onUpdateAppointment({ professional: value })
            setOpenDropdown(null)
          }}
        />
      </TableBodyCell>

      {/* Motivo - ExpandedTextInput */}
      <TableBodyCell width='12rem'>
        <ExpandedTextInput
          value={appointment.reason}
          onChange={(value) => onUpdateAppointment({ reason: value })}
          placeholder='Motivo de consulta'
        />
      </TableBodyCell>

      {/* Estado - Dropdown */}
      <TableBodyCell width='8rem'>
        <StatusDropdown
          value={visitStatus}
          isOpen={openDropdown === 'status'}
          onToggle={() =>
            setOpenDropdown((prev) => (prev === 'status' ? null : 'status'))
          }
          onSelect={(value) => {
            onUpdateAppointment({ visitStatus: value })
            setOpenDropdown(null)
          }}
        />
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

      {/* Tratamientos - Hover card */}
      <TableBodyCell width='5rem'>
        <TreatmentsHoverCard treatments={appointment.linkedTreatments} />
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
      <div className='table-scroll-x flex-1'>
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
              <TableHeaderCell width='8rem'>Estado</TableHeaderCell>
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
