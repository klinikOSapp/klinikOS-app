'use client'

import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRounded from '@mui/icons-material/ArrowForwardIosRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CheckRounded from '@mui/icons-material/CheckRounded'
import DescriptionRounded from '@mui/icons-material/DescriptionRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import MonitorHeartRounded from '@mui/icons-material/MonitorHeartRounded'
import PrintRounded from '@mui/icons-material/PrintRounded'
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactElement
} from 'react'
import { useEffect, useId, useRef, useState } from 'react'

import AppointmentDetailOverlay from './AppointmentDetailOverlay'
import AppointmentSummaryCard from './AppointmentSummaryCard'
import DayCalendar from './DayCalendar'
import MonthCalendar from './MonthCalendar'
import type {
  AgendaEvent,
  DayColumn,
  EventDetail,
  EventSelection,
  Weekday
} from './types'

type HeaderCell = {
  id: Weekday
  label: string
  leftVar: string
  widthVar: string
  tone: 'neutral' | 'primary' | 'brand'
}

const WEEK_RANGE = '13 - 19, oct 2025'

const TIME_LABELS = [
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00'
]

const HEADER_CELLS: HeaderCell[] = [
  {
    id: 'monday',
    label: '13 Lunes',
    leftVar: '--scheduler-header-left-mon',
    widthVar: '--scheduler-header-width-first',
    tone: 'neutral'
  },
  {
    id: 'tuesday',
    label: '14 Martes',
    leftVar: '--scheduler-header-left-tue',
    widthVar: '--scheduler-header-width',
    tone: 'brand'
  },
  {
    id: 'wednesday',
    label: '15 Miércoles',
    leftVar: '--scheduler-header-left-wed',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'thursday',
    label: '16 Jueves',
    leftVar: '--scheduler-header-left-thu',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'friday',
    label: '17 Viernes',
    leftVar: '--scheduler-header-left-fri',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'saturday',
    label: '18 Sábado',
    leftVar: '--scheduler-header-left-sat',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  },
  {
    id: 'sunday',
    label: '19 Domingo',
    leftVar: '--scheduler-header-left-sun',
    widthVar: '--scheduler-header-width',
    tone: 'primary'
  }
]

type ViewOption = 'dia' | 'semana' | 'mes'

const VIEW_OPTIONS: { id: ViewOption; label: string }[] = [
  { id: 'dia', label: 'Dia' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes', label: 'Mes' }
]

const PROFESSIONAL_OPTIONS = [
  { id: 'profesional-1', label: 'Profesional 1' },
  { id: 'profesional-2', label: 'Profesional 2' },
  { id: 'profesional-3', label: 'Profesional 3' }
]

const DATE_BY_DAY: Record<Weekday, string> = {
  monday: 'Lunes, 14 de Octubre 2024',
  tuesday: 'Lunes, 14 de Octubre 2024',
  wednesday: 'Lunes, 14 de Octubre 2024',
  thursday: 'Lunes, 14 de Octubre 2024',
  friday: 'Lunes, 14 de Octubre 2024',
  saturday: 'Lunes, 14 de Octubre 2024',
  sunday: 'Lunes, 14 de Octubre 2024'
}

const OVERLAY_GUTTER = '0.5rem' // 8px - gap between event card and overlay
const DEFAULT_PATIENT_FULL = 'Juan Pérez González'
const DEFAULT_PATIENT_PHONE = '+34 666 777 888'
const DEFAULT_PATIENT_EMAIL = 'juan.perez@gmail.com'
const DEFAULT_REFERRED_BY = 'Familiar de Xus'
const DEFAULT_PROFESSIONAL = 'Nombre apellidos'
const DEFAULT_ECONOMIC_AMOUNT = '100 €'
const DEFAULT_ECONOMIC_STATUS = 'Pendiente de pago'
const DEFAULT_NOTES = 'Primera limpieza del paciente'
const LOCATION_LABEL = 'Fecha y ubicación'
const PATIENT_LABEL = 'Paciente'
const PROFESSIONAL_LABEL = 'Profesional'
const ECONOMIC_LABEL = 'Económico'
const NOTES_LABEL = 'Notas'

function createDetail(
  day: Weekday,
  title: string,
  startTime: string,
  overrides?: Partial<EventDetail>
): EventDetail {
  return {
    title: `${title} ${startTime}`,
    date: DATE_BY_DAY[day],
    duration: '12:30 - 13:00 (30 minutos)',
    patientFull: DEFAULT_PATIENT_FULL,
    patientPhone: DEFAULT_PATIENT_PHONE,
    patientEmail: DEFAULT_PATIENT_EMAIL,
    referredBy: DEFAULT_REFERRED_BY,
    professional: DEFAULT_PROFESSIONAL,
    economicAmount: DEFAULT_ECONOMIC_AMOUNT,
    economicStatus: DEFAULT_ECONOMIC_STATUS,
    notes: DEFAULT_NOTES,
    locationLabel: LOCATION_LABEL,
    patientLabel: PATIENT_LABEL,
    professionalLabel: PROFESSIONAL_LABEL,
    economicLabel: ECONOMIC_LABEL,
    notesLabel: NOTES_LABEL,
    ...overrides
  }
}

function getOverlayTop(relativeTop: string): string {
  const trimmed = relativeTop.trim()
  if (trimmed.startsWith('calc(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(5, -1).trim()
    return `calc(var(--scheduler-body-offset-y) + ${inner})`
  }
  return `calc(var(--scheduler-body-offset-y) + ${trimmed})`
}

function getOverlayLeft(column: DayColumn): string {
  // Smart positioning: place overlay to the right of the event when possible
  // If event is in the last 4 columns (thu/fri/sat/sun), place overlay to the LEFT
  // This prevents the overlay from appearing too far right or off-screen
  const isRightColumn = ['thursday', 'friday', 'saturday', 'sunday'].includes(
    column.id
  )

  if (isRightColumn) {
    // Place overlay to the LEFT of the column
    // column.left - overlay.width - gutter, but ensure it doesn't go off-screen
    return `max(1rem, calc(var(${column.leftVar}) - var(--scheduler-overlay-width) - ${OVERLAY_GUTTER}))`
  }

  // For left/middle columns (mon/tue/wed), place overlay to the RIGHT
  // column.left + column.width + gutter
  return `calc(var(${column.leftVar}) + var(${column.widthVar}) + ${OVERLAY_GUTTER})`
}

function getSmartOverlayPosition(
  relativeTop: string,
  column: DayColumn,
  overlayHeight: string = 'var(--scheduler-overlay-height)'
) {
  // Calculate base positions
  const baseTop = getOverlayTop(relativeTop)
  const baseLeft = getOverlayLeft(column)

  // Return position with constraint to prevent overflow
  // Using CSS max() and min() functions to clamp the overlay within viewport
  return {
    top: `max(0rem, min(${baseTop}, calc(100vh - ${overlayHeight} - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 1rem)))`,
    left: baseLeft,
    maxHeight: `min(${overlayHeight}, calc(100vh - var(--spacing-topbar) - var(--scheduler-toolbar-height) - var(--scheduler-day-header-height) - 2rem))`
  }
}

const EVENT_DATA: Record<Weekday, AgendaEvent[]> = {
  monday: [
    {
      id: 'mon-1',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    },
    {
      id: 'mon-2',
      top: '6.4375rem', // 103px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[rgba(86,145,255,0.2)]',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    },
    {
      id: 'mon-3',
      top: '11.4375rem', // 183px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[rgba(86,145,255,0.2)]',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    }
  ],
  tuesday: [
    {
      id: 'tue-1',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      borderClass: 'border-2 border-brand-500',
      detail: createDetail('tuesday', 'Limpieza dental', '12:30')
    },
    {
      id: 'tue-2',
      top: 'calc(var(--scheduler-box-top-second) + 1.625rem)', // 26px inside Box 2
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('tuesday', 'Limpieza dental', '12:30')
    },
    {
      id: 'tue-3',
      top: 'calc(var(--scheduler-box-top-second) + 7.625rem)', // 122px inside Box 2
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbf3e9]',
      detail: createDetail('tuesday', 'Limpieza dental', '12:30')
    }
  ],
  wednesday: [
    {
      id: 'wed-1',
      top: '17.375rem', // 278px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Juan Pérez',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbe9f0]',
      detail: createDetail('wednesday', 'Limpieza dental', '12:30')
    }
  ],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: []
}

const DAY_COLUMNS: DayColumn[] = [
  {
    id: 'monday',
    leftVar: '--scheduler-day-left-mon',
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.monday
  },
  {
    id: 'tuesday',
    leftVar: '--scheduler-day-left-tue',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.tuesday
  },
  {
    id: 'wednesday',
    leftVar: '--scheduler-day-left-wed',
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.wednesday
  },
  {
    id: 'thursday',
    leftVar: '--scheduler-day-left-thu',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.thursday
  },
  {
    id: 'friday',
    leftVar: '--scheduler-day-left-fri',
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.friday
  },
  {
    id: 'saturday',
    leftVar: '--scheduler-day-left-sat',
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.saturday
  },
  {
    id: 'sunday',
    leftVar: '--scheduler-day-left-sun',
    widthVar: '--scheduler-day-width-first',
    events: EVENT_DATA.sunday
  }
]

const BOX_ROWS = [
  { id: 'box-1', label: 'BOX 1', top: '0rem' },
  { id: 'box-2', label: 'BOX 2', top: 'var(--scheduler-box-top-second)' }
]

const frameStyle: CSSProperties = {
  width: '100%',
  height: 'calc(100dvh - var(--spacing-topbar))',
  '--scheduler-width': '100%',
  '--scheduler-height': 'calc(100dvh - var(--spacing-topbar))'
} as CSSProperties

const contentStyle: CSSProperties = {
  height: 'calc(var(--scheduler-height) - var(--scheduler-body-offset-y))' // Content height without toolbar and day header
}

function NavigationArrow({
  direction,
  onClick
}: {
  direction: 'previous' | 'next'
  onClick: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={
        direction === 'previous' ? 'Semana anterior' : 'Semana siguiente'
      }
      className='h-[2.5rem] w-[3.5rem] rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-600)] transition-colors duration-150 hover:bg-[var(--color-brand-0)]'
    >
      {direction === 'previous' ? (
        <ArrowBackIosNewRounded fontSize='small' />
      ) : (
        <ArrowForwardIosRounded fontSize='small' />
      )}
    </button>
  )
}

type ToolbarChipProps = {
  label: string
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void
  isActive?: boolean
  icon?: ReactElement
  ariaExpanded?: boolean
  ariaHaspopup?: boolean
  ariaControls?: string
}

function ToolbarChip({
  label,
  onClick,
  isActive = false,
  icon,
  ariaExpanded,
  ariaHaspopup,
  ariaControls
}: ToolbarChipProps) {
  const iconNode =
    icon ??
    (
      <ArrowForwardIosRounded
        className='text-[var(--color-neutral-400)]'
        fontSize='inherit'
      />
    )

  return (
    <button
      type='button'
      className={[
        'inline-flex h-[var(--nav-chip-height)] items-center gap-[var(--spacing-gapsm)] rounded-full border px-4 text-body-md font-medium transition-colors duration-150',
        isActive
          ? 'border-[var(--color-brand-200)] bg-[var(--color-brand-50)] text-[var(--color-neutral-900)]'
          : 'border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)] hover:bg-[var(--color-brand-0)]'
      ].join(' ')}
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-controls={ariaControls}
    >
      <span>{label}</span>
      {iconNode}
    </button>
  )
}

type DayPeriod = 'full' | 'morning' | 'afternoon'

function DayPeriodSegmentedControl({
  selected,
  onSelect
}: {
  selected: DayPeriod
  onSelect: (period: DayPeriod) => void
}) {
  const options: { id: DayPeriod; label: string }[] = [
    { id: 'full', label: 'Día completo' },
    { id: 'morning', label: 'Mañana' },
    { id: 'afternoon', label: 'Tarde' }
  ]

  return (
    <div className='flex items-center overflow-hidden rounded-[var(--day-segmented-radius)] border border-[var(--color-border-default)]'>
      {options.map((option, index) => {
        const isActive = option.id === selected
        return (
          <button
            key={option.id}
            type='button'
            className={[
              'flex items-center justify-center px-[var(--day-segmented-padding-x)] py-[var(--day-segmented-padding-y)] text-body-md font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isActive
                ? 'bg-[var(--color-neutral-200)]'
                : 'bg-[var(--color-neutral-50)] hover:bg-[var(--color-neutral-100)]',
              index === 1 ? 'border-x border-[var(--color-border-default)]' : ''
            ].join(' ')}
            style={{
              height: 'var(--day-segmented-height)',
              width:
                index === 0
                  ? 'var(--day-segmented-btn1-width)'
                  : index === 1
                  ? 'var(--day-segmented-btn2-width)'
                  : 'var(--day-segmented-btn3-width)'
            }}
            onClick={() => onSelect(option.id)}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ViewDropdown({
  id,
  selected,
  onSelect
}: {
  id: string
  selected: ViewOption
  onSelect: (value: ViewOption) => void
}) {
  return (
    <div
      id={id}
      role='menu'
      aria-orientation='vertical'
      className='absolute left-0 top-[calc(100%+0.5rem)] z-20 flex w-[min(9.3125rem,30vw)] flex-col rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
      onClick={(event) => event.stopPropagation()}
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = option.id === selected
        return (
          <button
            key={option.id}
            type='button'
            role='menuitemradio'
            aria-checked={isActive}
            className={[
              'flex w-full items-center gap-[0.5rem] px-[0.5rem] py-[0.25rem] text-left text-title-sm font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isActive
                ? 'bg-[var(--color-brand-50)]'
                : 'bg-transparent hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(option.id)
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ProfessionalDropdown({
  id,
  selected,
  onToggle
}: {
  id: string
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div
      id={id}
      role='menu'
      aria-orientation='vertical'
      className='absolute left-0 top-[calc(100%+0.5rem)] z-20 flex w-[min(9.3125rem,30vw)] flex-col rounded-[0.5rem] border border-[var(--color-neutral-200)] bg-[rgba(248,250,251,0.9)] py-[0.5rem] backdrop-blur-[0.125rem] shadow-[0.125rem_0.125rem_0.25rem_0_rgba(0,0,0,0.1)]'
      onClick={(event) => event.stopPropagation()}
    >
      {PROFESSIONAL_OPTIONS.map((option) => {
        const isChecked = selected.includes(option.id)
        return (
          <button
            key={option.id}
            type='button'
            role='menuitemcheckbox'
            aria-checked={isChecked}
            className={[
              'flex w-full items-center gap-[0.5rem] px-[0.5rem] py-[0.25rem] text-left text-title-sm font-medium text-[var(--color-neutral-900)] transition-colors duration-150',
              isChecked
                ? 'bg-[var(--color-brand-50)]'
                : 'bg-transparent hover:bg-[var(--color-brand-0)]'
            ].join(' ')}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(option.id)
            }}
          >
            <span
              aria-hidden
              className={[
                'flex size-[1.5rem] items-center justify-center rounded-[0.25rem] border',
                isChecked
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-600)]'
                  : 'border-[var(--color-neutral-400)] text-transparent'
              ].join(' ')}
            >
              {isChecked ? (
                <CheckRounded sx={{ fontSize: '1rem' }} />
              ) : null}
            </span>
            <span className='text-nowrap'>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ToolbarAction({ label, icon }: { label: string; icon: ReactElement }) {
  return (
    <button
      type='button'
      className='inline-flex h-[2.5rem] items-center gap-[var(--spacing-gapsm)] rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 text-body-md font-medium text-[var(--color-neutral-900)] transition-colors duration-150 hover:bg-[var(--color-brand-0)]'
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function HeaderLabels({ cells }: { cells: typeof HEADER_CELLS }) {
  return (
    <div className='relative h-[var(--scheduler-day-header-height)] w-full shrink-0 border-b border-[var(--color-border-default)] bg-[var(--color-neutral-200)]'>
      {cells.map((cell) => (
        <span
          key={cell.id}
          className={[
            'absolute flex h-full items-center justify-center text-body-md font-medium',
            cell.tone === 'neutral'
              ? 'text-[var(--color-neutral-600)]'
              : cell.tone === 'brand'
              ? 'text-[var(--color-brand-500)]'
              : 'text-[var(--color-neutral-900)]'
          ].join(' ')}
          style={{
            left: `var(${cell.leftVar})`,
            width: `var(${cell.widthVar})`
          }}
        >
          {cell.label}
        </span>
      ))}
    </div>
  )
}

function TimeColumn() {
  return (
    <div className='absolute left-0 top-0 h-full w-[var(--scheduler-time-width)] border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'>
      <div
        className='grid h-full'
        style={{
          gridTemplateRows: `repeat(${TIME_LABELS.length}, var(--scheduler-slot-height))`
        }}
      >
        {TIME_LABELS.map((label) => (
          <div
            key={label}
            className='flex items-center justify-center border-b border-[var(--color-border-default)] text-body-md font-medium text-[var(--color-neutral-600)]'
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

function BoxLabels() {
  return (
    <div className='absolute left-[var(--scheduler-label-left)] top-0 h-full w-[var(--scheduler-label-width)]'>
      {BOX_ROWS.map((row) => (
        <div
          key={row.id}
          className='absolute flex h-[var(--scheduler-box-height)] w-full items-center justify-center border-r border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-label-md font-medium uppercase tracking-[0.08em] text-[var(--color-neutral-900)]'
          style={{ top: row.top }}
        >
          {row.label}
        </div>
      ))}
    </div>
  )
}

function DayGrid({
  column,
  activeSelection,
  hoveredId,
  onHover,
  onActivate
}: {
  column: DayColumn
  activeSelection: EventSelection
  hoveredId?: string | null
  onHover: (selection: EventSelection) => void
  onActivate: (selection: EventSelection) => void
}) {
  return (
    <div
      className='absolute border-b border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'
      style={{
        left: `var(${column.leftVar})`,
        top: '0',
        width: `var(${column.widthVar})`,
        height: '100%'
      }}
    >
      <div className='absolute inset-0'>
        {column.events.map((event) => (
          <AppointmentSummaryCard
            key={event.id}
            event={event}
            onHover={() => onHover({ event, column })}
            onLeave={() => onHover(null)}
            onActivate={() => onActivate({ event, column })}
            isActive={activeSelection?.event.id === event.id}
            isHovered={
              hoveredId === event.id && activeSelection?.event.id !== event.id
            }
          />
        ))}
      </div>
    </div>
  )
}

export default function WeekScheduler() {
  const [hovered, setHovered] = useState<EventSelection>(null)
  const [active, setActive] = useState<EventSelection>(null)
  const [viewOption, setViewOption] = useState<ViewOption>('semana')
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('full')
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([
    'profesional-1'
  ])
  const [openDropdown, setOpenDropdown] = useState<null | 'view' | 'professional'>(
    null
  )

  // Week navigation state - starts with current week
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 (Sunday) to 6 (Saturday)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Adjust to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  })

  const viewDropdownRef = useRef<HTMLDivElement | null>(null)
  const professionalDropdownRef = useRef<HTMLDivElement | null>(null)
  const viewDropdownId = useId()
  const professionalDropdownId = useId()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(null)
        setOpenDropdown(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!openDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        viewDropdownRef.current?.contains(target) ||
        professionalDropdownRef.current?.contains(target)
      ) {
        return
      }
      setOpenDropdown(null)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // Only show overlay on click (active), not on hover
  const overlaySource = active
  const activeDetail = overlaySource?.event.detail
  const overlayPosition =
    overlaySource && activeDetail
      ? activeDetail.overlayOffsets?.top && activeDetail.overlayOffsets?.left
        ? {
            top: activeDetail.overlayOffsets.top,
            left: activeDetail.overlayOffsets.left
          }
        : getSmartOverlayPosition(overlaySource.event.top, overlaySource.column)
      : null

  const currentViewLabel =
    VIEW_OPTIONS.find((option) => option.id === viewOption)?.label ?? ''

  const handleViewChipClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'view' ? null : 'view'))
  }

  const handleProfessionalChipClick = (
    event: ReactMouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'professional' ? null : 'professional'))
  }

  const handleViewSelect = (value: ViewOption) => {
    setViewOption(value)
    setOpenDropdown(null)
  }

  const handleProfessionalToggle = (value: string) => {
    setSelectedProfessionals((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value)
      }
      return [...previous, value]
    })
  }

  // Week navigation functions
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 7)
      return newDate
    })
  }

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 7)
      return newDate
    })
  }

  // Generate week range string "13 - 19, oct 2025"
  const getWeekRangeString = () => {
    const endDate = new Date(currentWeekStart)
    endDate.setDate(currentWeekStart.getDate() + 6) // Sunday

    const startDay = currentWeekStart.getDate()
    const endDay = endDate.getDate()
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'short' })
    const year = currentWeekStart.getFullYear()

    return `${startDay} - ${endDay}, ${month} ${year}`
  }

  // Month navigation functions
  const goToPreviousMonth = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const goToNextMonth = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // Get month name "Octubre"
  const getMonthString = () => {
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'long' })
    return month.charAt(0).toUpperCase() + month.slice(1)
  }

  // Get day date string "19 oct 2025"
  const getDayString = () => {
    const day = currentWeekStart.getDate()
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'short' })
    const year = currentWeekStart.getFullYear()
    return `${day} ${month} ${year}`
  }

  // Generate header cells with actual dates
  const getHeaderCells = (): typeof HEADER_CELLS => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const weekdayIds: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return days.map((dayName, index) => {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + index)
      const dayNumber = date.getDate()

      // Determine tone based on date comparison
      let tone: 'neutral' | 'primary' | 'brand' = 'primary'
      if (date.getTime() === today.getTime()) {
        tone = 'brand' // Today
      } else if (date < today) {
        tone = 'neutral' // Past
      }

      return {
        ...HEADER_CELLS[index],
        label: `${dayNumber} ${dayName}`,
        id: weekdayIds[index],
        tone
      }
    })
  }

  const handleHover = (state: EventSelection) => {
    setHovered(state)
  }

  const handleActivate = (state: EventSelection) => {
    if (!state) return
    const isSame = active?.event.id === state.event.id
    setActive(isSame ? null : state)
    setHovered(isSame ? null : state)
  }

  const handleRootClick = () => {
    setActive(null)
    setOpenDropdown(null)
  }

  return (
    <section
      className='relative flex h-full w-full flex-col overflow-hidden rounded-tl-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={frameStyle}
      onClick={handleRootClick}
    >
      {/* Fixed Header - Compartido entre todas las vistas */}
      <header className='flex h-[var(--scheduler-toolbar-height)] w-full shrink-0 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-neutral-100)] px-[var(--scheduler-grid-gutter)]'>
        <div className='flex items-center gap-4'>
          {/* Segmented control solo para vista diaria */}
          {viewOption === 'dia' && (
            <DayPeriodSegmentedControl
              selected={dayPeriod}
              onSelect={setDayPeriod}
            />
          )}
          {/* Selector de fecha condicional según la vista */}
          {viewOption === 'mes' ? (
            /* Vista Mensual: Selector de mes "Octubre" */
            <div className='flex items-center'>
              <NavigationArrow
                direction='previous'
                onClick={goToPreviousMonth}
              />
              <div className='flex h-[2.5rem] items-center justify-center border-y border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 py-2 text-body-md font-medium text-[var(--color-neutral-900)]'>
                {getMonthString()}
              </div>
              <NavigationArrow direction='next' onClick={goToNextMonth} />
            </div>
          ) : viewOption === 'dia' ? (
            /* Vista Diaria: Selector de día "19 oct 2025" */
            <div className='flex items-center'>
              <NavigationArrow
                direction='previous'
                onClick={goToPreviousWeek}
              />
              <div className='flex h-[2.5rem] items-center justify-center border-y border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 py-2 text-body-md font-medium text-[var(--color-neutral-900)]'>
                {getDayString()}
              </div>
              <NavigationArrow direction='next' onClick={goToNextWeek} />
            </div>
          ) : (
            /* Vista Semanal: Selector de rango "13 - 19, oct 2025" */
            <div className='flex items-center gap-2'>
              <NavigationArrow
                direction='previous'
                onClick={goToPreviousWeek}
              />
              <div className='flex h-[2.5rem] w-[10.0625rem] items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] text-body-md font-medium text-[var(--color-neutral-900)]'>
                {getWeekRangeString()}
              </div>
              <NavigationArrow direction='next' onClick={goToNextWeek} />
            </div>
          )}
          <div className='flex items-center gap-3'>
            <div ref={viewDropdownRef} className='relative'>
              <ToolbarChip
                label={currentViewLabel}
                onClick={handleViewChipClick}
                isActive={openDropdown === 'view'}
                icon={
                  <KeyboardArrowDownRounded
                    className='text-[var(--color-neutral-400)]'
                    fontSize='inherit'
                  />
                }
                ariaExpanded={openDropdown === 'view'}
                ariaHaspopup
                ariaControls={viewDropdownId}
              />
              {openDropdown === 'view' ? (
                <ViewDropdown
                  id={viewDropdownId}
                  selected={viewOption}
                  onSelect={handleViewSelect}
                />
              ) : null}
            </div>
            <ToolbarChip label='Equipo' />
            <div ref={professionalDropdownRef} className='relative'>
              <ToolbarChip
                label='Profesional'
                onClick={handleProfessionalChipClick}
                isActive={openDropdown === 'professional'}
                icon={
                  <KeyboardArrowDownRounded
                    className='text-[var(--color-neutral-400)]'
                    fontSize='inherit'
                  />
                }
                ariaExpanded={openDropdown === 'professional'}
                ariaHaspopup
                ariaControls={professionalDropdownId}
              />
              {openDropdown === 'professional' ? (
                <ProfessionalDropdown
                  id={professionalDropdownId}
                  selected={selectedProfessionals}
                  onToggle={handleProfessionalToggle}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <ToolbarAction
            label='Parte diario'
            icon={
              <DescriptionRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='small'
              />
            }
          />
          <ToolbarAction
            label='Imprimir'
            icon={
              <PrintRounded
                className='text-[var(--color-neutral-600)]'
                fontSize='small'
              />
            }
          />
        </div>
      </header>

      {/* Contenido condicional según la vista */}
      {viewOption === 'mes' ? (
        /* Vista Mensual */
        <div className='relative flex-1 overflow-hidden bg-[var(--color-neutral-0)]'>
          <MonthCalendar />
        </div>
      ) : viewOption === 'dia' ? (
        /* Vista Diaria - Con scroll vertical */
        <div className='relative flex-1 overflow-y-auto bg-[var(--color-neutral-0)]'>
          <DayCalendar />
        </div>
      ) : (
        /* Vista Semanal */
        <>
          {/* Fixed Header Labels (Days of week) */}
          <HeaderLabels cells={getHeaderCells()} />

          {/* Scrollable Content Area */}
          <div className='relative flex-1 overflow-y-auto bg-[var(--color-neutral-0)]'>
            <div className='relative' style={contentStyle}>
              <TimeColumn />
              <BoxLabels />

          <div
            className='pointer-events-none absolute left-0 w-full border-t border-[var(--color-border-default)]'
            style={{
              top: 'var(--scheduler-box-top-second)'
            }}
          />

          {DAY_COLUMNS.map((column) => (
            <DayGrid
              key={column.id}
              column={column}
              onHover={handleHover}
              onActivate={handleActivate}
              activeSelection={active}
              hoveredId={hovered?.event.id}
            />
          ))}

          {/* Hover overlay - Simplified detail view */}
          {hovered &&
            !active &&
            hovered.event.detail &&
            (() => {
              const position = getSmartOverlayPosition(
                hovered.event.top,
                hovered.column,
                '14rem'
              )
              return (
                <div
                  className='pointer-events-none absolute z-10 flex flex-col overflow-hidden overflow-y-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shadow-[2px_2px_4px_0px_rgba(0,0,0,0.1)]'
                  style={{
                    top: position.top,
                    left: position.left,
                    width: 'var(--scheduler-overlay-width)',
                    maxHeight: position.maxHeight
                  }}
                >
                  {/* Header */}
                  <div className='flex items-center justify-between bg-[var(--color-brand-100)] px-4 py-2'>
                    <p className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                      {hovered.event.detail.title}
                    </p>
                    <p className='text-body-md font-bold text-[var(--color-neutral-900)]'>
                      {hovered.event.box}
                    </p>
                  </div>

                  {/* Body */}
                  <div className='flex flex-col gap-4 bg-[var(--color-neutral-0)] px-4 py-4'>
                    {/* Fecha y ubicación */}
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <CalendarMonthRounded
                          className='text-[var(--color-neutral-600)]'
                          sx={{ fontSize: '1rem' }}
                        />
                        <p className='text-label-md font-normal text-[var(--color-neutral-600)]'>
                          Fecha y ubicación
                        </p>
                      </div>
                      <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                        {hovered.event.detail.date}
                      </p>
                    </div>

                    {/* Paciente */}
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <AccountCircleRounded
                          className='text-[var(--color-neutral-600)]'
                          sx={{ fontSize: '1rem' }}
                        />
                        <p className='text-label-md font-normal text-[var(--color-neutral-600)]'>
                          Paciente
                        </p>
                      </div>
                      <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                        {hovered.event.detail.patientFull}
                      </p>
                    </div>

                    {/* Profesional */}
                    <div className='flex flex-col gap-1'>
                      <div className='flex items-center gap-1'>
                        <MonitorHeartRounded
                          className='text-[var(--color-neutral-600)]'
                          sx={{ fontSize: '1rem' }}
                        />
                        <p className='text-label-md font-normal text-[var(--color-neutral-600)]'>
                          Profesional
                        </p>
                      </div>
                      <div className='flex items-center gap-4'>
                        <span
                          className='inline-flex shrink-0 rounded-full bg-[var(--color-neutral-700)]'
                          style={{
                            width: '2rem',
                            height: '2rem'
                          }}
                        />
                        <p className='text-body-sm font-normal text-[var(--color-neutral-900)]'>
                          {hovered.event.detail.professional}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

              {/* Click overlay - AppointmentDetailOverlay */}
              {overlaySource && activeDetail && overlayPosition ? (
                <AppointmentDetailOverlay
                  detail={activeDetail}
                  box={overlaySource.event.box}
                  position={overlayPosition}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
