'use client'

/* eslint-disable @typescript-eslint/no-unused-vars */

import { MD3Icon } from '@/components/icons/MD3Icon'
import type {
  CSSProperties,
  ReactElement,
  MouseEvent as ReactMouseEvent
} from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

import type { AppointmentFormData } from './modals/CreateAppointmentModal'

import AppointmentSummaryCard from './AppointmentSummaryCard'
import DayCalendar from './DayCalendar'
import MonthCalendar from './MonthCalendar'
import AppointmentDetailOverlay from './modals/AppointmentDetailOverlay'
import CreateAppointmentModal from './modals/CreateAppointmentModal'
import ParteDiarioModal from './modals/ParteDiarioModal'
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
  '9:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00'
]

const WEEKDAY_ORDER: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const normalizeTimeLabel = (label: string): string => {
  const [hoursPart = '00', minutesPart = '00'] = label.split(':')
  const hours = hoursPart.padStart(2, '0')
  const minutes = minutesPart.padStart(2, '0')
  return `${hours}:${minutes}`
}

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

const BOX_OPTIONS = [
  { id: 'box-1', label: 'Box 1' },
  { id: 'box-2', label: 'Box 2' },
  { id: 'box-3', label: 'Box 3' }
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
  // If event is in the last columns (thu/fri), place overlay to the LEFT to prevent overflow
  const isRightColumn = ['thursday', 'friday'].includes(column.id)

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
      patient: 'Paciente Box 1',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      left: '2%',
      width: '30%',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    },
    {
      id: 'mon-2',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Paciente Box 2',
      box: 'Box 2',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[rgba(86,145,255,0.2)]',
      left: '34%',
      width: '30%',
      detail: createDetail('monday', 'Limpieza dental', '12:30')
    },
    {
      id: 'mon-3',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Limpieza dental',
      patient: 'Paciente Box 3',
      box: 'Box 3',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[rgba(86,145,255,0.2)]',
      left: '66%',
      width: '30%',
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
  thursday: [
    {
      id: 'thu-1',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Chequeo general',
      patient: 'Paciente Box 1',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      left: '4%',
      width: '44%',
      detail: createDetail('thursday', 'Chequeo general', '12:30')
    },
    {
      id: 'thu-2',
      top: '1.4375rem', // 23px
      height: '4rem', // 64px - single-line content
      title: 'Revisión ortodoncia',
      patient: 'Paciente Box 2',
      box: 'Box 2',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#e9fbf9]',
      left: '52%',
      width: '44%',
      detail: createDetail('thursday', 'Revisión ortodoncia', '12:30')
    }
  ],
  friday: [
    {
      id: 'fri-1',
      top: '1.4375rem',
      height: '4rem',
      title: 'Consulta simultánea',
      patient: 'Paciente Demo 1',
      box: 'Box 1',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[var(--color-brand-100)]',
      left: '2%',
      width: '30%',
      detail: createDetail('friday', 'Consulta simultánea', '12:30')
    },
    {
      id: 'fri-2',
      top: '1.4375rem',
      height: '4rem',
      title: 'Consulta simultánea',
      patient: 'Paciente Demo 2',
      box: 'Box 2',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#fbf3e9]',
      left: '34%',
      width: '30%',
      detail: createDetail('friday', 'Consulta simultánea', '12:30')
    },
    {
      id: 'fri-3',
      top: '1.4375rem',
      height: '4rem',
      title: 'Consulta simultánea',
      patient: 'Paciente Demo 3',
      box: 'Box 3',
      timeRange: '12:30 - 13:30',
      backgroundClass: 'bg-[#e9fbf9]',
      left: '66%',
      width: '30%',
      detail: createDetail('friday', 'Consulta simultánea', '12:30')
    }
  ],
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
    widthVar: '--scheduler-day-width',
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
    widthVar: '--scheduler-day-width',
    events: EVENT_DATA.friday
  }
]

const frameStyle: CSSProperties = {
  width: '100%',
  height: 'calc(100dvh - var(--spacing-topbar))',
  '--scheduler-width': '100%',
  '--scheduler-height': 'calc(100dvh - var(--spacing-topbar))'
} as CSSProperties

// Calcular altura dinámica basada en número de slots de media hora
const getContentHeight = (numSlots: number): string => {
  return `calc(${numSlots} * var(--scheduler-slot-height-half))`
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
        <MD3Icon name='ArrowBackIosNewRounded' size='sm' />
      ) : (
        <MD3Icon name='ArrowForwardIosRounded' size='sm' />
      )}
    </button>
  )
}

function NavigationControl({
  label,
  widthRem,
  onPrevious,
  onNext
}: {
  label: string
  widthRem: number
  onPrevious: () => void
  onNext: () => void
}) {
  const widthStyle = `min(${widthRem}rem, 45vw)`

  return (
    <div className='flex items-center gap-2'>
      <NavigationArrow direction='previous' onClick={onPrevious} />
      <div
        className='flex h-[2.5rem] flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] px-4 text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'
        style={{ minWidth: `${widthRem}rem`, maxWidth: '45vw' }}
      >
        {label}
      </div>
      <NavigationArrow direction='next' onClick={onNext} />
    </div>
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
  const iconNode = icon ?? (
    <MD3Icon
      name='ArrowForwardIosRounded'
      size='inherit'
      className='text-[var(--color-neutral-400)]'
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

type MultiSelectOption = {
  id: string
  label: string
}

function MultiSelectDropdown({
  id,
  selected,
  options,
  onToggle
}: {
  id: string
  selected: string[]
  options: MultiSelectOption[]
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
      {options.map((option) => {
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
              {isChecked ? <MD3Icon name='CheckRounded' size={1} /> : null}
            </span>
            <span className='text-nowrap'>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ToolbarAction({
  label,
  icon,
  onClick
}: {
  label: string
  icon: ReactElement
  onClick?: () => void
}) {
  return (
    <button
      type='button'
      onClick={onClick}
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
    <div
      className='absolute left-0 top-0 flex flex-col bg-[var(--color-neutral-100)]'
      style={{
        width: 'var(--scheduler-time-width)',
        height: '100%'
      }}
    >
      {TIME_LABELS.map((time, index) => (
        <div
          key={index}
          className='flex flex-1 items-center justify-center border-b border-r border-[var(--color-border-default)] p-2'
        >
          <p className='text-body-md font-normal text-[var(--color-neutral-600)]'>
            {time}
          </p>
        </div>
      ))}
    </div>
  )
}

type DaySlotSelection = {
  column: DayColumn
  slotIndex: number
}

function DayGrid({
  column,
  activeSelection,
  hoveredId,
  onHover,
  onActivate,
  onSlotSelect
}: {
  column: DayColumn
  activeSelection: EventSelection
  hoveredId?: string | null
  onHover: (selection: EventSelection) => void
  onActivate: (selection: EventSelection) => void
  onSlotSelect?: (selection: DaySlotSelection) => void
}) {
  // Domingo con patrón de puntos SVG
  const isSunday = column.id === 'sunday'
  const sundayStyle = isSunday
    ? {
        backgroundColor: 'var(--color-neutral-0)',
        backgroundImage: 'var(--sunday-bg-pattern)',
        backgroundRepeat: 'repeat',
        backgroundSize: 'var(--sunday-dot-spacing) var(--sunday-dot-spacing)',
        backgroundPosition: '0 0'
      }
    : {}

  const handleGridClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!onSlotSelect) return
    const target = event.target as HTMLElement | null
    if (target && target.closest('[data-appointment-card="true"]')) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.height <= 0) return

    const relativeY = event.clientY - rect.top
    const slotHeight = rect.height / TIME_LABELS.length
    if (slotHeight <= 0) return

    const rawIndex = Math.floor(relativeY / slotHeight)
    const slotIndex = Math.min(Math.max(rawIndex, 0), TIME_LABELS.length - 1)

    event.stopPropagation()
    onSlotSelect({ column, slotIndex })
  }

  return (
    <div
      className={`absolute border-r border-[var(--color-border-default)] ${
        isSunday ? '' : 'bg-[var(--color-neutral-0)]'
      }`}
      style={{
        left: `var(${column.leftVar})`,
        top: '0',
        width: `var(${column.widthVar})`,
        height: '100%',
        ...sundayStyle
      }}
      onClick={handleGridClick}
    >
      {/* Líneas horizontales para cada media hora */}
      <div
        className='absolute inset-0 grid'
        style={{
          gridTemplateRows: `repeat(${TIME_LABELS.length}, var(--scheduler-slot-height-half))`
        }}
      >
        {TIME_LABELS.map((_, index) => (
          <div
            key={index}
            className='border-b border-[var(--color-border-default)]'
          />
        ))}
      </div>

      {/* Eventos */}
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

// Eventos de ejemplo para la vista mensual
const MONTH_EVENTS = [
  {
    id: 'm1',
    date: new Date(2024, 9, 7),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'm2',
    date: new Date(2024, 9, 9),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'm3',
    date: new Date(2024, 9, 10),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'm4',
    date: new Date(2024, 9, 13),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'm5',
    date: new Date(2024, 9, 14),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'm6',
    date: new Date(2024, 9, 15),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-teal)'
  },
  {
    id: 'm7',
    date: new Date(2024, 9, 17),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-purple)'
  },
  {
    id: 'm8',
    date: new Date(2024, 9, 22),
    title: '13:00 Consulta médica',
    bgColor: 'var(--color-event-coral)'
  }
]

export default function WeekScheduler() {
  const [hovered, setHovered] = useState<EventSelection>(null)
  const [active, setActive] = useState<EventSelection>(null)
  const [viewOption, setViewOption] = useState<ViewOption>('semana')
  const [dayPeriod, setDayPeriod] = useState<DayPeriod>('full')
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([
    'profesional-1'
  ])
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>(
    BOX_OPTIONS.map((option) => option.id)
  )
  const [openDropdown, setOpenDropdown] = useState<
    null | 'view' | 'professional' | 'box'
  >(null)
  const [isParteDiarioModalOpen, setIsParteDiarioModalOpen] = useState(false)
  const [isCreateAppointmentModalOpen, setIsCreateAppointmentModalOpen] =
    useState(false)
  const [appointmentPrefill, setAppointmentPrefill] =
    useState<Partial<AppointmentFormData> | null>(null)

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

  // Month navigation state - starts with current month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const viewDropdownRef = useRef<HTMLDivElement | null>(null)
  const professionalDropdownRef = useRef<HTMLDivElement | null>(null)
  const boxDropdownRef = useRef<HTMLDivElement | null>(null)
  const viewDropdownId = useId()
  const professionalDropdownId = useId()
  const boxDropdownId = useId()

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
        professionalDropdownRef.current?.contains(target) ||
        boxDropdownRef.current?.contains(target)
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
    setOpenDropdown((current) =>
      current === 'professional' ? null : 'professional'
    )
  }

  const handleBoxChipClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setOpenDropdown((current) => (current === 'box' ? null : 'box'))
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

  const handleBoxToggle = (value: string) => {
    setSelectedBoxes((previous) => {
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
    endDate.setDate(currentWeekStart.getDate() + 4) // Friday (no weekends)

    const startDay = currentWeekStart.getDate()
    const endDay = endDate.getDate()
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'short' })
    const year = currentWeekStart.getFullYear()

    return `${startDay} - ${endDay}, ${month} ${year}`
  }

  // Month navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() - 1)
      return newDate
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + 1)
      return newDate
    })
  }

  // Get month name "Octubre 2025"
  const getMonthString = () => {
    const month = currentMonth.toLocaleString('es-ES', { month: 'long' })
    const year = currentMonth.getFullYear()
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
  }

  // Get day date string "19 oct 2025"
  const getDayString = () => {
    const day = currentWeekStart.getDate()
    const month = currentWeekStart.toLocaleString('es-ES', { month: 'short' })
    const year = currentWeekStart.getFullYear()
    return `${day} ${month} ${year}`
  }

  const capitalize = (value: string): string =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value

  const formatHeaderLabel = (date: Date): string => {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

    const parts = formatter.formatToParts(date)
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
    const day = parts.find((part) => part.type === 'day')?.value ?? ''
    const month = parts.find((part) => part.type === 'month')?.value ?? ''
    const year = parts.find((part) => part.type === 'year')?.value ?? ''

    const formattedMonth = month
      ? `${capitalize(month)}${month.endsWith('.') ? '' : '.'}`
      : ''

    return `${capitalize(weekday)} ${day} ${formattedMonth} ${year}`.trim()
  }

  // Generate header cells with actual dates
  const getHeaderCells = (): typeof HEADER_CELLS => {
    const weekdayIds: Weekday[] = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday'
    ]

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return weekdayIds.map((weekdayId, index) => {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + index)

      // Determine tone based on date comparison
      let tone: 'neutral' | 'primary' | 'brand' = 'primary'
      if (date.getTime() === today.getTime()) {
        tone = 'brand' // Today
      } else if (date < today) {
        tone = 'neutral' // Past
      }

      return {
        ...HEADER_CELLS[index],
        label: formatHeaderLabel(date),
        id: weekdayId,
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

  const openCreateAppointmentModal = useCallback(
    (prefill?: Partial<AppointmentFormData>) => {
      setAppointmentPrefill(prefill ?? null)
      setIsCreateAppointmentModalOpen(true)
    },
    []
  )

  const handleCreateModalClose = useCallback(() => {
    setIsCreateAppointmentModalOpen(false)
    setAppointmentPrefill(null)
  }, [])

  const handleDaySlotSelect = useCallback(
    ({ column, slotIndex }: DaySlotSelection) => {
      const dayOffset = WEEKDAY_ORDER.indexOf(column.id)
      const safeOffset = dayOffset >= 0 ? dayOffset : 0
      const slotLabel =
        TIME_LABELS[Math.min(Math.max(slotIndex, 0), TIME_LABELS.length - 1)]
      const normalizedTime = normalizeTimeLabel(slotLabel)

      const slotDate = new Date(currentWeekStart)
      slotDate.setDate(currentWeekStart.getDate() + safeOffset)

      openCreateAppointmentModal({
        fecha: slotDate.toLocaleDateString('en-CA'),
        hora: normalizedTime
      })
    },
    [currentWeekStart, openCreateAppointmentModal]
  )

  return (
    <section
      className='relative flex h-full w-full flex-col rounded-tl-[var(--radius-xl)] border border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{ ...frameStyle, overflow: 'visible' }}
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
            <NavigationControl
              label={getMonthString()}
              widthRem={5.9375} // 95px ÷ 16
              onPrevious={goToPreviousMonth}
              onNext={goToNextMonth}
            />
          ) : viewOption === 'dia' ? (
            <NavigationControl
              label={getDayString()}
              widthRem={10.0625} // Empatado con vista semanal (161px ÷ 16)
              onPrevious={goToPreviousWeek}
              onNext={goToNextWeek}
            />
          ) : (
            <NavigationControl
              label={getWeekRangeString()}
              widthRem={10.0625} // 161px ÷ 16
              onPrevious={goToPreviousWeek}
              onNext={goToNextWeek}
            />
          )}
          <div className='flex items-center gap-3'>
            <div ref={viewDropdownRef} className='relative'>
              <ToolbarChip
                label={currentViewLabel}
                onClick={handleViewChipClick}
                isActive={openDropdown === 'view'}
                icon={
                  <MD3Icon
                    name='KeyboardArrowDownRounded'
                    size='inherit'
                    className='text-[var(--color-neutral-400)]'
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
            <div ref={professionalDropdownRef} className='relative'>
              <ToolbarChip
                label='Profesional'
                onClick={handleProfessionalChipClick}
                isActive={openDropdown === 'professional'}
                icon={
                  <MD3Icon
                    name='KeyboardArrowDownRounded'
                    size='inherit'
                    className='text-[var(--color-neutral-400)]'
                  />
                }
                ariaExpanded={openDropdown === 'professional'}
                ariaHaspopup
                ariaControls={professionalDropdownId}
              />
              {openDropdown === 'professional' ? (
                <MultiSelectDropdown
                  id={professionalDropdownId}
                  selected={selectedProfessionals}
                  options={PROFESSIONAL_OPTIONS}
                  onToggle={handleProfessionalToggle}
                />
              ) : null}
            </div>
            {viewOption !== 'dia' ? (
              <div ref={boxDropdownRef} className='relative'>
                <ToolbarChip
                  label='Box'
                  onClick={handleBoxChipClick}
                  isActive={openDropdown === 'box'}
                  icon={
                    <MD3Icon
                      name='KeyboardArrowDownRounded'
                      size='inherit'
                      className='text-[var(--color-neutral-400)]'
                    />
                  }
                  ariaExpanded={openDropdown === 'box'}
                  ariaHaspopup
                  ariaControls={boxDropdownId}
                />
                {openDropdown === 'box' ? (
                  <MultiSelectDropdown
                    id={boxDropdownId}
                    selected={selectedBoxes}
                    options={BOX_OPTIONS}
                    onToggle={handleBoxToggle}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className='flex items-center gap-3'>
          <ToolbarAction
            label='Parte diario'
            icon={
              <MD3Icon
                name='DescriptionRounded'
                size='sm'
                className='text-[var(--color-neutral-600)]'
              />
            }
            onClick={() => setIsParteDiarioModalOpen(true)}
          />
          <button
            onClick={() => openCreateAppointmentModal()}
            className='flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 transition-all hover:bg-brand-600 active:scale-95'
          >
            <span className='material-symbols-rounded text-xl text-brand-900'>
              add
            </span>
            <span className='font-medium text-sm text-brand-900'>
              Añadir cita
            </span>
          </button>
        </div>
      </header>

      {/* Contenido condicional según la vista */}
      {viewOption === 'mes' ? (
        /* Vista Mensual */
        <div className='relative flex-1 overflow-hidden bg-[var(--color-neutral-0)]'>
          <MonthCalendar currentMonth={currentMonth} />
        </div>
      ) : viewOption === 'dia' ? (
        /* Vista Diaria - Con scroll vertical */
        <div className='relative flex-1 overflow-x-visible overflow-y-auto bg-[var(--color-neutral-0)]'>
          <DayCalendar period={dayPeriod} />
        </div>
      ) : (
        /* Vista Semanal */
        <>
          {/* Fixed Header Labels (Days of week) */}
          <HeaderLabels cells={getHeaderCells()} />

          {/* Scrollable Content Area */}
          <div className='relative flex-1 overflow-y-auto bg-[var(--color-neutral-0)]'>
            <div
              className='relative'
              style={{ height: getContentHeight(TIME_LABELS.length) }}
            >
              <TimeColumn />

              {DAY_COLUMNS.map((column) => (
                <DayGrid
                  key={column.id}
                  column={column}
                  onHover={handleHover}
                  onActivate={handleActivate}
                  activeSelection={active}
                  hoveredId={hovered?.event.id}
                  onSlotSelect={handleDaySlotSelect}
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
                            <MD3Icon
                              name='CalendarMonthRounded'
                              size={1}
                              className='text-[var(--color-neutral-600)]'
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
                            <MD3Icon
                              name='AccountCircleRounded'
                              size={1}
                              className='text-[var(--color-neutral-600)]'
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
                            <MD3Icon
                              name='MonitorHeartRounded'
                              size={1}
                              className='text-[var(--color-neutral-600)]'
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

      {/* Parte Diario Modal */}
      <ParteDiarioModal
        isOpen={isParteDiarioModalOpen}
        onClose={() => setIsParteDiarioModalOpen(false)}
      />

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={isCreateAppointmentModalOpen}
        onClose={handleCreateModalClose}
        initialData={appointmentPrefill ?? undefined}
        onSubmit={(data) => {
          console.log('Nueva cita creada:', data)
          handleCreateModalClose()
          // TODO: Integrar con backend para guardar la cita
        }}
      />
    </section>
  )
}
