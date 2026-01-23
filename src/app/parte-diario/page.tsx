'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import ClientLayout from '@/app/client-layout'
import ParteDiarioModal from '@/components/agenda/modals/ParteDiarioModal'
import {
  VISIT_STATUS_CONFIG,
  VISIT_STATUS_ORDER,
  type VisitStatus,
  type VisitStatusLog
} from '@/components/agenda/types'
import VisitStatusCounters from '@/components/agenda/VisitStatusCounters'
import VisitStatusMenu from '@/components/agenda/VisitStatusMenu'
import { MD3Icon } from '@/components/icons/MD3Icon'
import PatientRecordModal from '@/components/pacientes/modals/patient-record/PatientRecordModal'
import Portal from '@/components/ui/Portal'
import { type ContextMenuAction } from '@/components/agenda/AppointmentContextMenu'
import {
  formatDateToISO,
  formatDateToShort,
  useAppointments,
  type Appointment,
  type PaymentInfo
} from '@/context/AppointmentsContext'
import React from 'react'

const CTA_WIDTH_REM = 7.3125 // 117px ÷ 16
const CTA_HEIGHT_REM = 2.5 // 40px ÷ 16
const DAILY_BANDS = [
  {
    id: 'odontologo',
    label: 'Odontólogo 10:00 - 16:00',
    background: '#f0fafa'
  },
  {
    id: 'anestesista',
    label: 'Anestesista 10:00 - 16:00',
    background: '#fbe9fb'
  }
]

function KpiCard({
  title,
  value,
  badge
}: {
  title: string
  value: string
  badge?: React.ReactNode
}) {
  return (
    <div className='bg-white rounded-[8px] p-[min(1rem,1.5vw)] h-[min(8rem,12vw)] flex flex-col justify-between shadow-[1px_1px_2px_0_rgba(0,0,0,0.05)] border border-[var(--color-neutral-200)]'>
      <p className='text-title-sm font-medium text-[var(--color-neutral-600)]'>
        {title}
      </p>
      <div className='flex items-baseline justify-between'>
        <p className='text-kpi text-[var(--color-neutral-900)]'>{value}</p>
        {badge}
      </div>
    </div>
  )
}

function Chip({
  children,
  color = 'teal',
  rounded = 'lg',
  size = 'sm'
}: {
  children: React.ReactNode
  color?: 'teal' | 'sky' | 'green' | 'gray'
  rounded?: 'lg' | 'full'
  size?: 'xs' | 'sm' | 'md'
}) {
  const styles = {
    teal: 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-[var(--color-success-200)] text-[var(--color-success-800)]',
    gray: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]'
  }[color]
  const radius = rounded === 'full' ? 'rounded-[80px]' : 'rounded-[4px]'
  const sizeClass =
    size === 'xs'
      ? 'text-label-sm font-normal'
      : size === 'md'
      ? 'text-body-md'
      : 'text-body-sm'

  return (
    <span className={['px-2 py-0.5', sizeClass, styles, radius].join(' ')}>
      {children}
    </span>
  )
}

function TableHeaderCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope='col'
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[0.5rem] pl-[0.5rem] pr-[0.75rem] text-body-md font-normal text-[var(--color-neutral-600)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function TableBodyCell({
  children,
  className,
  align = 'left'
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <td
      className={[
        'border-hairline-b border-hairline-r last:border-hairline-b last:border-r-0 py-[calc(var(--spacing-gapsm)/2)] pl-[0.5rem] pr-[0.75rem] align-middle text-body-md text-[var(--color-neutral-900)]',
        align === 'right' ? 'text-right' : 'text-left',
        className
      ].join(' ')}
    >
      {children}
    </td>
  )
}

// Tipo para las filas de la tabla (derivado de Appointment)
type DailyRow = {
  id: string
  day: string
  hour: string
  name: string
  professional?: string
  reason: string
  phone: string
  charge: 'Si' | 'No'
  tags?: Array<'deuda' | 'confirmada'>
  paymentInfo?: PaymentInfo
  // Nuevos campos para el sistema de estados de visita
  visitStatus: VisitStatus
  visitStatusHistory?: VisitStatusLog[]
  arrivalTime?: string // Hora de llegada (extraída del historial)
  confirmed: boolean // Si el paciente confirmó asistencia
}

// Función para extraer la hora de llegada del historial de estados
function getArrivalTime(history?: VisitStatusLog[]): string | undefined {
  if (!history) return undefined
  const waitingEntry = history.find((log) => log.status === 'waiting_room')
  if (!waitingEntry) return undefined
  return waitingEntry.timestamp.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para convertir Appointment del contexto a DailyRow para la tabla
function appointmentToRow(apt: Appointment): DailyRow {
  return {
    id: apt.id,
    day: formatDateToShort(apt.date),
    hour: apt.startTime,
    name: apt.patientName,
    professional: apt.professional,
    reason: apt.reason,
    phone: apt.patientPhone,
    charge: apt.charge,
    tags: apt.tags,
    paymentInfo: apt.paymentInfo,
    // Nuevos campos
    visitStatus: apt.visitStatus ?? 'scheduled',
    visitStatusHistory: apt.visitStatusHistory,
    arrivalTime: getArrivalTime(apt.visitStatusHistory),
    confirmed: apt.confirmed ?? false
  }
}

// Componente para mostrar el estado de pago
function PaymentStatusCell({ row }: { row: DailyRow }) {
  if (!row.paymentInfo) {
    // Sin información de pago - mostrar solo Si/No
    return (
      <span
        className={
          row.charge === 'Si'
            ? 'text-amber-600 font-medium'
            : 'text-[var(--color-neutral-600)]'
        }
      >
        {row.charge}
      </span>
    )
  }

  const { totalAmount, paidAmount, pendingAmount, currency } = row.paymentInfo
  const percentage =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
  const isFullyPaid = pendingAmount === 0

  if (isFullyPaid) {
    return (
      <span className='inline-flex items-center gap-1 text-[var(--color-success-600)] font-medium'>
        <span className='size-2 rounded-full bg-[var(--color-success-500)]' />
        Pagado
      </span>
    )
  }

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <span className='text-amber-600 font-medium'>
          {pendingAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
          {currency}
        </span>
        <span className='text-xs text-[var(--color-neutral-500)]'>
          ({percentage}%)
        </span>
      </div>
      {/* Mini barra de progreso */}
      <div className='h-1 w-16 overflow-hidden rounded-full bg-[var(--color-neutral-200)]'>
        <div
          className='h-full rounded-full bg-[var(--color-brand-500)]'
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Componente para mostrar y cambiar el estado de visita
function VisitStatusCell({
  appointmentId,
  currentStatus,
  onStatusChange
}: {
  appointmentId: string
  currentStatus: VisitStatus
  onStatusChange: (id: string, status: VisitStatus) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })

  const config = VISIT_STATUS_CONFIG[currentStatus]

  // Calcular posición del menú
  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 280 // Altura aproximada del menú
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top

      // Determinar si abrir arriba o abajo
      let top: number
      if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
        top = rect.bottom + 4
      } else {
        top = rect.top - menuHeight - 4
      }

      // Asegurar que no se salga del viewport
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 200))

      setMenuPosition({ top, left })
      setIsMenuOpen(true)
    }
  }

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleSelect = (status: VisitStatus) => {
    onStatusChange(appointmentId, status)
    setIsMenuOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        onClick={openMenu}
        className='inline-flex items-center gap-2 px-2 py-1 rounded-[4px] text-body-sm transition-all hover:opacity-80 cursor-pointer'
        style={{
          backgroundColor: config.bgColor,
          color: config.textColor
        }}
      >
        <span
          className='h-2.5 w-2.5 shrink-0 rounded-full'
          style={{ backgroundColor: config.color }}
        />
        <span className='font-medium'>{config.label}</span>
        <MD3Icon
          name='KeyboardArrowDownRounded'
          size='xs'
          className='shrink-0'
        />
      </button>

      {isMenuOpen && (
        <Portal>
          <div
            ref={menuRef}
            className='fixed z-[9999]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
          >
            <VisitStatusMenu
              currentStatus={currentStatus}
              onSelect={handleSelect}
              onClose={() => setIsMenuOpen(false)}
            />
          </div>
        </Portal>
      )}
    </>
  )
}

// Componente para el menú de acciones rápidas por fila
function RowActionsMenu({
  row,
  onClose,
  triggerRect,
  onViewAppointment,
  onNewAppointment,
  onNewBudget,
  onNewPrescription,
  onVisitStatusChange,
  onToggleConfirmed
}: {
  row: DailyRow
  onClose: () => void
  triggerRect?: DOMRect
  onViewAppointment: () => void
  onNewAppointment: () => void
  onNewBudget: () => void
  onNewPrescription: () => void
  onVisitStatusChange: (status: VisitStatus) => void
  onToggleConfirmed: (confirmed: boolean) => void
}) {
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<{
    top?: number
    bottom?: number
    right?: number
  }>({})
  const [showStatusSubmenu, setShowStatusSubmenu] = React.useState(false)

  // Calcular posición óptima del menú
  React.useEffect(() => {
    if (!menuRef.current || !triggerRect) return

    const menu = menuRef.current
    const menuRect = menu.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const margin = 8

    const spaceBelow = viewportHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    if (spaceBelow >= menuRect.height + margin) {
      setPosition({
        top: triggerRect.bottom + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else if (spaceAbove >= menuRect.height + margin) {
      setPosition({
        bottom: viewportHeight - triggerRect.top + margin,
        right: window.innerWidth - triggerRect.right
      })
    } else {
      const centeredTop = Math.max(
        margin,
        Math.min(
          viewportHeight - menuRect.height - margin,
          triggerRect.top + triggerRect.height / 2 - menuRect.height / 2
        )
      )
      setPosition({
        top: centeredTop,
        right: window.innerWidth - triggerRect.right
      })
    }
  }, [triggerRect])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className='fixed z-[9999] min-w-[14rem] overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] py-1 shadow-lg'
      style={{
        top: position.top,
        bottom: position.bottom,
        right: position.right
      }}
      role='menu'
      aria-label='Acciones rápidas'
    >
      {/* Acciones principales */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onViewAppointment()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='CalendarMonthRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Ver cita</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onNewAppointment()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='AddRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Nueva cita</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onNewBudget()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='ReceiptLongRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Nuevo presupuesto</span>
        </button>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onNewPrescription()
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name='DescriptionRounded'
            size={1.125}
            className='text-[var(--color-neutral-600)]'
          />
          <span>Nueva receta</span>
        </button>
      </div>

      {/* Separador */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Toggle de confirmación */}
      <div className='py-1'>
        <button
          type='button'
          role='menuitem'
          onClick={() => {
            onToggleConfirmed(!row.confirmed)
            onClose()
          }}
          className='flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <MD3Icon
            name={row.confirmed ? 'CheckCircleRounded' : 'RadioButtonUncheckedRounded'}
            size={1.125}
            className={row.confirmed ? 'text-[#3B82F6]' : 'text-[var(--color-neutral-600)]'}
          />
          <span className={row.confirmed ? 'text-[#3B82F6] font-medium' : 'text-[var(--color-neutral-800)]'}>
            {row.confirmed ? 'Confirmada' : 'Marcar como confirmada'}
          </span>
        </button>
      </div>

      {/* Separador */}
      <div className='my-1 h-px bg-[var(--color-border-default)]' />

      {/* Estado de visita (acordeón) */}
      <div className='py-1'>
        <button
          type='button'
          onClick={() => setShowStatusSubmenu(!showStatusSubmenu)}
          className='flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[var(--color-neutral-800)] transition-colors hover:bg-[var(--color-neutral-100)] focus:bg-[var(--color-neutral-100)] focus:outline-none'
        >
          <div className='flex items-center gap-3'>
            <span
              className='h-3 w-3 shrink-0 rounded-full'
              style={{ backgroundColor: VISIT_STATUS_CONFIG[row.visitStatus].color }}
            />
            <span>Estado de visita</span>
          </div>
          <MD3Icon
            name={showStatusSubmenu ? 'KeyboardArrowUpRounded' : 'KeyboardArrowDownRounded'}
            size='sm'
            className='text-[var(--color-neutral-500)]'
          />
        </button>

        {/* Submenu de estados */}
        {showStatusSubmenu && (
          <div className='bg-[var(--color-neutral-50)] py-1'>
            {VISIT_STATUS_ORDER.map((status) => {
              const config = VISIT_STATUS_CONFIG[status]
              const isSelected = status === row.visitStatus
              return (
                <button
                  key={status}
                  type='button'
                  onClick={() => {
                    onVisitStatusChange(status)
                    onClose()
                  }}
                  className={[
                    'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                    isSelected
                      ? 'bg-[var(--color-brand-0)]'
                      : 'hover:bg-[var(--color-neutral-100)]'
                  ].join(' ')}
                >
                  <span
                    className='h-2.5 w-2.5 shrink-0 rounded-full'
                    style={{ backgroundColor: config.color }}
                  />
                  <span
                    className={isSelected ? 'font-medium' : 'font-normal'}
                    style={{ color: isSelected ? config.textColor : 'var(--color-neutral-800)' }}
                  >
                    {config.label}
                  </span>
                  {isSelected && (
                    <MD3Icon
                      name='CheckRounded'
                      size='sm'
                      className='ml-auto text-[var(--color-brand-600)]'
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Componente para el toggle de confirmación
function ConfirmationToggle({
  appointmentId,
  isConfirmed,
  onToggle
}: {
  appointmentId: string
  isConfirmed: boolean
  onToggle: (id: string, confirmed: boolean) => void
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(appointmentId, !isConfirmed)
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      className={[
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-body-sm transition-all cursor-pointer',
        isConfirmed
          ? 'bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE]'
          : 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-200)]'
      ].join(' ')}
      title={isConfirmed ? 'Confirmada' : 'Sin confirmar'}
    >
      <MD3Icon
        name={isConfirmed ? 'CheckCircleRounded' : 'RadioButtonUncheckedRounded'}
        size='sm'
      />
      <span className='font-medium'>{isConfirmed ? 'Sí' : 'No'}</span>
    </button>
  )
}

export default function ParteDiarioPage() {
  // Hook del contexto de citas compartido
  const {
    appointments,
    getAppointmentsByDate,
    deleteAppointment,
    updateAppointment,
    updateVisitStatus,
    getVisitStatusCounts,
    toggleAppointmentConfirmed
  } = useAppointments()

  const [query, setQuery] = React.useState('')
  type FilterKey = 'deuda' | 'confirmada'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const [selectedPatientIds, setSelectedPatientIds] = React.useState<string[]>(
    []
  )
  const [isFichaModalOpen, setIsFichaModalOpen] = React.useState(false)
  const [isParteModalOpen, setIsParteModalOpen] = React.useState(false)

  // Estado para el menú de acciones por fila
  const [openRowMenuId, setOpenRowMenuId] = React.useState<string | null>(null)
  const [rowMenuTriggerRect, setRowMenuTriggerRect] = React.useState<DOMRect | null>(null)

  // Estado para el menú de cambio de estado masivo
  const [isBulkStatusMenuOpen, setIsBulkStatusMenuOpen] = React.useState(false)
  const bulkStatusMenuRef = React.useRef<HTMLDivElement>(null)

  // Estado para filtro de estado de visita
  const [activeVisitStatusFilters, setActiveVisitStatusFilters] = React.useState<
    VisitStatus[] | null
  >(null)

  // Estado para el filtro de profesional
  const [selectedProfessional, setSelectedProfessional] = React.useState<
    string | null
  >(null)
  const [isProfessionalDropdownOpen, setIsProfessionalDropdownOpen] =
    React.useState(false)
  const professionalDropdownRef = React.useRef<HTMLDivElement>(null)

  // Extraer lista única de profesionales de todas las citas
  const uniqueProfessionals = React.useMemo(() => {
    const professionals = new Set<string>()
    appointments.forEach((apt) => {
      if (apt.professional) {
        professionals.add(apt.professional)
      }
    })
    return Array.from(professionals).sort()
  }, [appointments])

  // Cerrar dropdown al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        professionalDropdownRef.current &&
        !professionalDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfessionalDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Estado para la fecha seleccionada (por defecto hoy)
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())

  // Formatear la fecha seleccionada para comparar con los datos (formato ISO)
  const selectedDateISO = formatDateToISO(selectedDate)

  // Funciones para navegar entre días
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 1)
      return newDate
    })
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 1)
      return newDate
    })
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Obtener citas del día seleccionado desde el contexto y convertirlas al formato de la tabla
  const appointmentsForSelectedDay = getAppointmentsByDate(selectedDateISO)
  const patientsForSelectedDay: DailyRow[] = appointmentsForSelectedDay
    .map(appointmentToRow)
    .sort((a, b) => a.hour.localeCompare(b.hour))

  const isPatientSelected = (patientId: string) =>
    selectedPatientIds.includes(patientId)

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatientIds((prevSelected) =>
      prevSelected.includes(patientId)
        ? prevSelected.filter((id) => id !== patientId)
        : [...prevSelected, patientId]
    )
  }

  const isFilterActive = (key: FilterKey) => selectedFilters.includes(key)
  const toggleFilter = (key: FilterKey) => {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
  const clearFilters = () => {
    setSelectedFilters([])
    setSelectedProfessional(null)
    setActiveVisitStatusFilters(null)
  }

  // Verificar si hay algún filtro activo (para el botón "Todos")
  const hasActiveFilters =
    selectedFilters.length > 0 ||
    selectedProfessional !== null ||
    activeVisitStatusFilters !== null

  // Obtener conteo de estados de visita para la fecha seleccionada
  const visitStatusCounts = getVisitStatusCounts(selectedDateISO)

  // Handler para cambiar filtro de estado de visita
  const handleVisitStatusFilterChange = (status: VisitStatus | null) => {
    if (status === null) {
      setActiveVisitStatusFilters(null)
    } else {
      setActiveVisitStatusFilters([status])
    }
  }

  // Handlers para cambiar estados
  const handleStatusChange = (appointmentId: string, newStatus: VisitStatus) => {
    updateVisitStatus(appointmentId, newStatus)
  }

  const handleConfirmationToggle = (appointmentId: string, confirmed: boolean) => {
    toggleAppointmentConfirmed(appointmentId, confirmed)
  }

  // Handler para cambio de estado masivo
  const handleBulkStatusChange = (newStatus: VisitStatus) => {
    selectedPatientIds.forEach((id) => {
      updateVisitStatus(id, newStatus)
    })
    // Limpiar selección después de aplicar el cambio
    setSelectedPatientIds([])
    setIsBulkStatusMenuOpen(false)
  }

  // Función para manejar las acciones del menú contextual
  const handleContextMenuAction = (action: ContextMenuAction) => {
    switch (action) {
      case 'view-patient':
        setInitialTab('Resumen')
        setOpenBudgetCreation(false)
        setIsFichaModalOpen(true)
        break
      case 'view-appointment':
        setInitialTab('Historial clínico')
        setOpenBudgetCreation(false)
        setIsFichaModalOpen(true)
        break
      case 'new-appointment':
        // TODO: Abrir modal de nueva cita
        console.log('Nueva cita para:', contextMenu.rowData?.name)
        break
      case 'new-budget':
        setInitialTab('Finanzas')
        setOpenBudgetCreation(true)
        setIsFichaModalOpen(true)
        break
      case 'new-prescription':
        setInitialTab('Recetas')
        setOpenBudgetCreation(false)
        setIsFichaModalOpen(true)
        break
      case 'report':
        // TODO: Implementar reportar
        console.log('Reportar:', contextMenu.rowData?.name)
        break
    }
  }

  // Cerrar menú de estado masivo al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bulkStatusMenuRef.current &&
        !bulkStatusMenuRef.current.contains(event.target as Node)
      ) {
        setIsBulkStatusMenuOpen(false)
      }
    }
    if (isBulkStatusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isBulkStatusMenuOpen])

  const searchCtaStyles: React.CSSProperties = {
    width: `min(${CTA_WIDTH_REM}rem, 100%)`,
    minHeight: `min(${CTA_HEIGHT_REM}rem, 6vh)`
  }

  return (
    <ClientLayout>
      <div className='w-full max-w-layout mx-auto h-[calc(100dvh-var(--spacing-topbar))] bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] px-[min(3rem,4vw)] py-[min(1.5rem,2vw)] flex flex-col overflow-auto'>
        <PatientRecordModal
          open={isFichaModalOpen}
          onClose={() => setIsFichaModalOpen(false)}
        />
        <ParteDiarioModal
          isOpen={isParteModalOpen}
          onClose={() => setIsParteModalOpen(false)}
        />

        {/* Header Section - Fixed size */}
        <div className='flex-shrink-0'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <h1 className='text-title-lg text-[var(--color-neutral-900)]'>
                Parte diario
              </h1>
              <Chip color='teal' rounded='full' size='xs'>
                Recepción
              </Chip>
            </div>
            <div className='flex items-center gap-3'>
              <button
                className='size-6 grid place-items-center text-[var(--color-neutral-900)] cursor-pointer'
                aria-label='Más opciones'
              >
                <MD3Icon
                  name='MoreVertRounded'
                  size='md'
                  className='text-[var(--color-neutral-900)]'
                />
              </button>
              <button
                type='button'
                onClick={() => setIsParteModalOpen(true)}
                className='flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-[#24282c] bg-[#D3F7F3] border border-[#7DE7DC] hover:bg-[#c3f3ee] hover:border-[#6ad6cd] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947] transition-colors cursor-pointer'
              >
                <MD3Icon name='AddRounded' size='md' />
                <span className='font-medium'>Exportar parte</span>
              </button>
            </div>
          </div>
          <p className='text-body-sm text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
            Exporta el parte diario de la semana actual para que tus
            profesionales puedan ver sus citas.
          </p>

          {/* Navegador de días */}
          <div className='flex items-center gap-4 mt-4'>
            <div className='flex items-center gap-2'>
              <button
                onClick={goToPreviousDay}
                className='size-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer'
                aria-label='Día anterior'
              >
                <MD3Icon
                  name='ChevronLeftRounded'
                  size='md'
                  className='text-[var(--color-neutral-700)]'
                />
              </button>
              <span className='text-title-md font-medium text-[var(--color-neutral-900)] min-w-[140px] text-center'>
                {selectedDate
                  .toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </span>
              <button
                onClick={goToNextDay}
                className='size-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer'
                aria-label='Día siguiente'
              >
                <MD3Icon
                  name='ChevronRightRounded'
                  size='md'
                  className='text-[var(--color-neutral-700)]'
                />
              </button>
            </div>
            <button
              onClick={goToToday}
              className='px-3 py-1 text-body-sm font-medium text-[var(--color-brand-700)] bg-[var(--color-brand-0)] border border-[var(--color-brand-200)] rounded-full hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer'
            >
              Hoy
            </button>
            <span className='text-body-sm text-[var(--color-neutral-500)]'>
              {patientsForSelectedDay.length} cita
              {patientsForSelectedDay.length !== 1 ? 's' : ''} programada
              {patientsForSelectedDay.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div
          className='flex-shrink-0 grid gap-[min(1rem,1.5vw)] mt-8'
          style={{
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(15.5rem, 100%), 1fr))'
          }}
        >
          <KpiCard
            title='Pacientes semana'
            value={`${appointments.length}/75`}
            badge={
              <span className='text-body-md text-[var(--color-success-600)]'>
                {Math.round((appointments.length / 75) * 100)}%
              </span>
            }
          />
          <KpiCard
            title='Pacientes del día'
            value={String(patientsForSelectedDay.length)}
            badge={
              <span className='text-body-md text-[var(--color-success-600)]'>
                +12%
              </span>
            }
          />
          <KpiCard
            title='Pacientes recibidos'
            value={`${
              patientsForSelectedDay.filter(
                (p) => p.visitStatus !== 'scheduled'
              ).length
            }/${patientsForSelectedDay.length}`}
            badge={
              patientsForSelectedDay.length > 0 ? (
                <span className='text-body-md text-[var(--color-success-600)]'>
                  {Math.round(
                    (patientsForSelectedDay.filter(
                      (p) => p.visitStatus !== 'scheduled'
                    ).length /
                      patientsForSelectedDay.length) *
                      100
                  )}
                  %
                </span>
              ) : null
            }
          />
          <KpiCard
            title='Citas confirmadas'
            value={String(
              patientsForSelectedDay.filter((p) => p.confirmed).length
            )}
            badge={
              patientsForSelectedDay.length > 0 ? (
                <span className='text-body-md text-[var(--color-success-600)]'>
                  {Math.round(
                    (patientsForSelectedDay.filter((p) => p.confirmed).length /
                      patientsForSelectedDay.length) *
                      100
                  )}
                  %
                </span>
              ) : null
            }
          />
        </div>

        {/* Bandas de profesionales - Layout horizontal */}
        <div className='flex-shrink-0 mt-6'>
          <div className='flex items-center gap-4 flex-wrap'>
            <p className='text-body-md font-medium text-[var(--color-neutral-700)]'>
              Profesionales hoy,{' '}
              {new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long'
              })}
            </p>
            <div className='flex items-center gap-4'>
              {DAILY_BANDS.map((band) => (
                <div key={band.id} className='flex items-center gap-2'>
                  <span
                    className='size-3 rounded-full'
                    style={{ backgroundColor: band.background }}
                  />
                  <span className='text-body-sm text-[var(--color-neutral-700)]'>
                    {band.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contadores de estado de visita */}
        <div className='flex-shrink-0 mt-6'>
          <div className='flex items-center gap-3'>
            <p className='text-body-md font-medium text-[var(--color-neutral-700)]'>
              Estado de visita:
            </p>
            <VisitStatusCounters
              counts={visitStatusCounts}
              activeFilters={activeVisitStatusFilters}
              onFilterChange={handleVisitStatusFilterChange}
              showEmpty={false}
              size='sm'
            />
          </div>
        </div>

        {/* Table Section - Flexible container */}
        <div className='flex-1 flex flex-col mt-8 overflow-hidden'>
          <div className='flex-shrink-0 mb-6 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              {selectedPatientIds.length > 0 && (
                <Chip color='teal'>{selectedPatientIds.length} seleccionados</Chip>
              )}
              {/* Botón de cambio de estado masivo */}
              <div className='relative' ref={bulkStatusMenuRef}>
                <button
                  onClick={() => {
                    if (selectedPatientIds.length > 0) {
                      setIsBulkStatusMenuOpen(!isBulkStatusMenuOpen)
                    }
                  }}
                  disabled={selectedPatientIds.length === 0}
                  className={[
                    'flex items-center gap-1 px-2 py-1 text-body-sm border cursor-pointer transition-colors',
                    selectedPatientIds.length > 0
                      ? 'bg-[var(--color-brand-0)] border-[var(--color-brand-500)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)]'
                      : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-300)] text-[var(--color-neutral-400)] cursor-not-allowed'
                  ].join(' ')}
                >
                  <span>Estado</span>
                  {selectedPatientIds.length > 0 && (
                    <MD3Icon
                      name={isBulkStatusMenuOpen ? 'KeyboardArrowUpRounded' : 'KeyboardArrowDownRounded'}
                      size='xs'
                    />
                  )}
                </button>

                {/* Dropdown de estados */}
                {isBulkStatusMenuOpen && selectedPatientIds.length > 0 && (
                  <div className='absolute top-full left-0 mt-1 z-50 min-w-[200px] overflow-hidden rounded-[8px] border border-[var(--color-neutral-200)] bg-white shadow-lg'>
                    <div className='border-b border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] px-3 py-2'>
                      <p className='text-label-sm font-medium text-[var(--color-neutral-600)]'>
                        Cambiar estado de {selectedPatientIds.length} cita{selectedPatientIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className='py-1'>
                      {VISIT_STATUS_ORDER.map((status) => {
                        const config = VISIT_STATUS_CONFIG[status]
                        return (
                          <button
                            key={status}
                            onClick={() => handleBulkStatusChange(status)}
                            className='flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--color-neutral-50)]'
                          >
                            <span
                              className='h-3 w-3 shrink-0 rounded-full'
                              style={{ backgroundColor: config.color }}
                            />
                            <span className='flex-1 text-body-sm text-[var(--color-neutral-900)]'>
                              {config.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (selectedPatientIds.length > 0) {
                    // Eliminar las citas seleccionadas
                    selectedPatientIds.forEach((id) => {
                      deleteAppointment(id)
                    })
                    setSelectedPatientIds([])
                  }
                }}
                disabled={selectedPatientIds.length === 0}
                className={[
                  'p-1 size-[32px] inline-flex items-center justify-center border transition-colors',
                  selectedPatientIds.length > 0
                    ? 'bg-[var(--color-error-50)] border-[var(--color-error-300)] text-[var(--color-error-600)] hover:bg-[var(--color-error-100)] cursor-pointer'
                    : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-300)] text-[var(--color-neutral-400)] cursor-not-allowed'
                ].join(' ')}
                title={selectedPatientIds.length > 0 ? `Eliminar ${selectedPatientIds.length} cita(s)` : 'Selecciona citas para eliminar'}
              >
                <MD3Icon name='DeleteRounded' size='md' />
              </button>
              <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center cursor-pointer'>
                <MD3Icon name='MoreHorizRounded' size='md' />
              </button>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 px-2 py-1'>
                <MD3Icon
                  name='SearchRounded'
                  size='sm'
                  className='text-[var(--color-neutral-900)]'
                />
              </div>
              <button
                onClick={clearFilters}
                className={[
                  'flex items-center gap-2 px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  !hasActiveFilters
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                <MD3Icon name='FilterListRounded' size='sm' />
                <span>Todos</span>
              </button>

              {/* Dropdown de Profesional */}
              <div className='relative' ref={professionalDropdownRef}>
                <button
                  onClick={() =>
                    setIsProfessionalDropdownOpen(!isProfessionalDropdownOpen)
                  }
                  className={[
                    'flex items-center gap-1 px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC]',
                    selectedProfessional
                      ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                      : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                  ].join(' ')}
                >
                  <span className='truncate max-w-[150px]'>
                    {selectedProfessional || 'Profesional'}
                  </span>
                  <MD3Icon
                    name={
                      isProfessionalDropdownOpen
                        ? 'KeyboardArrowUpRounded'
                        : 'KeyboardArrowDownRounded'
                    }
                    size='sm'
                  />
                </button>

                {isProfessionalDropdownOpen && (
                  <div className='absolute top-full left-0 mt-1 z-50 min-w-[200px] max-h-[300px] overflow-auto bg-white rounded-[8px] border border-[var(--color-neutral-200)] shadow-lg'>
                    <button
                      onClick={() => {
                        setSelectedProfessional(null)
                        setIsProfessionalDropdownOpen(false)
                      }}
                      className={[
                        'w-full text-left px-3 py-2 text-body-sm hover:bg-[var(--color-neutral-100)] transition-colors',
                        selectedProfessional === null
                          ? 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)]'
                          : 'text-[var(--color-neutral-900)]'
                      ].join(' ')}
                    >
                      Todos los profesionales
                    </button>
                    {uniqueProfessionals.map((professional) => (
                      <button
                        key={professional}
                        onClick={() => {
                          setSelectedProfessional(professional)
                          setIsProfessionalDropdownOpen(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-[var(--color-neutral-100)] transition-colors truncate',
                          selectedProfessional === professional
                            ? 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)]'
                            : 'text-[var(--color-neutral-900)]'
                        ].join(' ')}
                      >
                        {professional}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleFilter('deuda')}
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  isFilterActive('deuda')
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                En deuda
              </button>
              <button
                onClick={() => toggleFilter('confirmada')}
                className={[
                  'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                  isFilterActive('confirmada')
                    ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                    : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
                ].join(' ')}
              >
                Confirmada
              </button>
            </div>
          </div>

          <div className='flex-1 rounded-[8px] overflow-auto'>
            <table className='w-full table-fixed border-collapse'>
              <thead>
                <tr>
                  <TableHeaderCell className='w-[40px] pr-2'>
                    <span className='sr-only'>Seleccionar fila</span>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[100px] pr-2'>
                    Día
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[80px] pr-2'>
                    Hora
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[80px] pr-2'>
                    <div className='flex items-center gap-1'>
                      <MD3Icon
                        name='EventAvailableRounded'
                        size='xs'
                        className='text-[var(--color-neutral-700)]'
                      />
                      <span>Llegada</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[180px] pr-2'>
                    <div className='flex items-center gap-2'>
                      <MD3Icon
                        name='AccountCircleRounded'
                        size='sm'
                        className='text-[var(--color-neutral-700)]'
                      />
                      <span>Paciente</span>
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[160px] pr-2'>
                    Profesional
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[200px] pr-2'>
                    Motivo consulta
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[120px] pr-2'>
                    Teléfono
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[140px] pr-2'>
                    Estado visita
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[90px] pr-2'>
                    Confirm.
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[120px] pr-2'>
                    Pendiente
                  </TableHeaderCell>
                  <TableHeaderCell className='w-[50px] pr-2'>
                    <span className='sr-only'>Acciones</span>
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {patientsForSelectedDay
                  .filter((p) => {
                    const q = query.trim().toLowerCase()
                    const matchesQuery = q
                      ? p.name.toLowerCase().includes(q) ||
                        p.phone.toLowerCase().includes(q) ||
                        p.reason.toLowerCase().includes(q) ||
                        p.professional?.toLowerCase().includes(q)
                      : true
                    const matchesFilter = (() => {
                      if (selectedFilters.length === 0) return true
                      const tagMap: Record<FilterKey, 'deuda' | 'confirmada'> =
                        {
                          deuda: 'deuda',
                          confirmada: 'confirmada'
                        }
                      return selectedFilters.some((k) =>
                        p.tags?.includes(tagMap[k])
                      )
                    })()
                    // Filtro por profesional
                    const matchesProfessional = selectedProfessional
                      ? p.professional === selectedProfessional
                      : true
                    // Filtro por estado de visita
                    const matchesVisitStatus = activeVisitStatusFilters
                      ? activeVisitStatusFilters.includes(p.visitStatus)
                      : true
                    return Boolean(
                      matchesQuery &&
                        matchesFilter &&
                        matchesProfessional &&
                        matchesVisitStatus
                    )
                  })
                  .map((row, i) => (
                    <tr
                      key={row.id}
                      className='group hover:bg-[var(--color-neutral-50)]'
                    >
                      <TableBodyCell className='w-[40px] pr-2'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePatientSelection(row.id)
                          }}
                          aria-pressed={isPatientSelected(row.id)}
                          className='relative size-6 inline-flex items-center justify-center cursor-pointer'
                        >
                          {/* Outline box on hover */}
                          <span className='absolute inset-0 rounded-[4px] border border-[var(--color-neutral-300)] bg-white opacity-0 group-hover:opacity-100 transition-opacity' />
                          {/* Selected border */}
                          <span
                            className={[
                              'absolute inset-0 rounded-[4px] border-2 transition-opacity',
                              isPatientSelected(row.id)
                                ? 'border-[#1E4947] opacity-100'
                                : 'opacity-0'
                            ].join(' ')}
                          />
                          {/* Check icon when selected */}
                          <MD3Icon
                            aria-hidden='true'
                            name='CheckRounded'
                            size='sm'
                            className={[
                              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                              'text-[#1E4947] transition-opacity',
                              isPatientSelected(row.id)
                                ? 'opacity-100'
                                : 'opacity-0'
                            ].join(' ')}
                          />
                          <span className='sr-only'>Seleccionar fila</span>
                        </button>
                      </TableBodyCell>
                      <TableBodyCell className='w-[100px] pr-2'>
                        {row.day}
                      </TableBodyCell>
                      <TableBodyCell className='w-[80px] pr-2'>
                        {row.hour}
                      </TableBodyCell>
                      <TableBodyCell className='w-[80px] pr-2'>
                        {row.arrivalTime ? (
                          <span className='font-medium text-[#B45309]'>
                            {row.arrivalTime}
                          </span>
                        ) : (
                          <span className='text-[var(--color-neutral-400)]'>
                            —
                          </span>
                        )}
                      </TableBodyCell>
                      <TableBodyCell className='w-[180px] pr-2'>
                        <p className='truncate'>{row.name}</p>
                      </TableBodyCell>
                      <TableBodyCell className='w-[160px] pr-2'>
                        <p className='truncate'>{row.professional ?? '—'}</p>
                      </TableBodyCell>
                      <TableBodyCell className='w-[200px] pr-2'>
                        <p className='truncate'>{row.reason}</p>
                      </TableBodyCell>
                      <TableBodyCell className='w-[120px] pr-2'>
                        <p className='truncate'>{row.phone}</p>
                      </TableBodyCell>
                      <TableBodyCell className='w-[140px] pr-2'>
                        <VisitStatusCell
                          appointmentId={row.id}
                          currentStatus={row.visitStatus}
                          onStatusChange={handleStatusChange}
                        />
                      </TableBodyCell>
                      <TableBodyCell className='w-[90px] pr-2'>
                        <ConfirmationToggle
                          appointmentId={row.id}
                          isConfirmed={row.confirmed}
                          onToggle={handleConfirmationToggle}
                        />
                      </TableBodyCell>
                      <TableBodyCell className='w-[120px] pr-2'>
                        <PaymentStatusCell row={row} />
                      </TableBodyCell>
                      <TableBodyCell className='w-[50px] pr-2'>
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            setRowMenuTriggerRect(rect)
                            setOpenRowMenuId(openRowMenuId === row.id ? null : row.id)
                          }}
                          className='inline-flex size-8 items-center justify-center rounded-full hover:bg-[var(--color-neutral-100)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-300)]'
                        >
                          <MD3Icon
                            name='MoreVertRounded'
                            size='md'
                            className='text-[var(--color-neutral-700)]'
                          />
                        </button>
                        {openRowMenuId === row.id && rowMenuTriggerRect && (
                          <RowActionsMenu
                            row={row}
                            triggerRect={rowMenuTriggerRect}
                            onClose={() => {
                              setOpenRowMenuId(null)
                              setRowMenuTriggerRect(null)
                            }}
                            onViewAppointment={() => {
                              setIsFichaModalOpen(true)
                            }}
                            onNewAppointment={() => {
                              // TODO: Abrir modal de nueva cita
                              console.log('Nueva cita para:', row.name)
                            }}
                            onNewBudget={() => {
                              // TODO: Abrir modal de nuevo presupuesto
                              console.log('Nuevo presupuesto para:', row.name)
                            }}
                            onNewPrescription={() => {
                              // TODO: Abrir modal de nueva receta
                              console.log('Nueva receta para:', row.name)
                            }}
                            onVisitStatusChange={(status) => {
                              handleStatusChange(row.id, status)
                            }}
                            onToggleConfirmed={(confirmed) => {
                              handleConfirmationToggle(row.id, confirmed)
                            }}
                          />
                        )}
                      </TableBodyCell>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className='flex-shrink-0 mt-4 flex items-center justify-end gap-3 text-body-sm text-[var(--color-neutral-900)]'>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='FirstPageRounded' size='md' />
            </button>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='ChevronLeftRounded' size='md' />
            </button>
            <span className='font-bold underline'>1</span>
            <span>2</span>
            <span>…</span>
            <span>12</span>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='ChevronRightRounded' size='md' />
            </button>
            <button className='size-6 inline-flex items-center justify-center cursor-pointer'>
              <MD3Icon name='LastPageRounded' size='md' />
            </button>
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}
