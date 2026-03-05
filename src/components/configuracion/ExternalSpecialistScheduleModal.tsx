'use client'

import {
  AccessTimeFilledRounded,
  AddRounded,
  CalendarMonthRounded,
  CheckRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  DeleteRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import {
  type ExternalSpecialistScheduleEntry,
  useConfiguration
} from '@/context/ConfigurationContext'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  staffId: string
  staffName: string
  staffRole: string
}

const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado'
}

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
  value: d,
  label: DAY_LABELS[d]
}))

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 4) + 7
  const m = (i % 4) * 15
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}).filter((t) => {
  const h = parseInt(t.split(':')[0], 10)
  return h >= 7 && h <= 22
})

function InlineSelect({
  value,
  onChange,
  label,
  options,
  placeholder
}: {
  value: string
  onChange: (v: string) => void
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{
    top: number
    left: number
    minWidth: number
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = Math.min(options.length * 36 + 8, 240)
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

    setDropdownPos({
      top: placeAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width
    })
    setIsOpen(true)
  }, [options.length])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return
      setIsOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    const handleScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  return (
    <div className='flex flex-col gap-1'>
      <label className='text-label-sm text-[var(--color-neutral-500)]'>
        {label}
      </label>
      <button
        ref={triggerRef}
        type='button'
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        className={[
          'h-10 px-3 rounded-lg border bg-white text-body-sm text-left flex items-center justify-between gap-1 transition-colors',
          isOpen
            ? 'border-[var(--color-brand-500)] ring-1 ring-[var(--color-brand-500)]'
            : 'border-neutral-300'
        ].join(' ')}
      >
        <span className={`truncate ${value ? 'text-[#24282C]' : 'text-neutral-400'}`}>
          {selectedOption?.label || placeholder || '-'}
        </span>
        <KeyboardArrowDownRounded
          className={[
            'shrink-0 w-4 h-4 text-neutral-400 transition-transform',
            isOpen ? 'rotate-180' : ''
          ].join(' ')}
        />
      </button>
      {isOpen &&
        dropdownPos &&
        createPortal(
          <div
            ref={dropdownRef}
            className='fixed z-[9999] flex flex-col overflow-auto rounded-lg border border-[#E2E7EA] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.12)]'
            style={{
              top: dropdownPos.top,
              left: dropdownPos.left,
              minWidth: dropdownPos.minWidth,
              maxHeight: 240
            }}
            role='listbox'
          >
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type='button'
                  role='option'
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                  }}
                  className={[
                    'flex items-center justify-between gap-2 px-3 py-[0.375rem] text-body-sm transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[#E9FBF9] text-[var(--color-brand-700)] font-medium'
                      : 'text-[#24282C] hover:bg-[var(--color-neutral-50)]'
                  ].join(' ')}
                >
                  <span className='truncate'>{opt.label}</span>
                  {isSelected && (
                    <CheckRounded className='w-3.5 h-3.5 text-[var(--color-brand-500)] shrink-0' />
                  )}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}

function TimeSelect({
  value,
  onChange,
  label,
  allowEmpty
}: {
  value: string
  onChange: (v: string) => void
  label: string
  allowEmpty?: boolean
}) {
  const timeOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    if (allowEmpty) opts.push({ value: '', label: 'Horario clínica' })
    for (const t of TIME_OPTIONS) {
      opts.push({ value: t, label: t })
    }
    return opts
  }, [allowEmpty])

  return (
    <InlineSelect
      value={value}
      onChange={onChange}
      label={label}
      options={timeOptions}
      placeholder='Horario clínica'
    />
  )
}

function RecurringDayItem({
  entry,
  onDelete
}: {
  entry: ExternalSpecialistScheduleEntry
  onDelete: () => void
}) {
  const dayLabel = entry.dayOfWeek != null ? DAY_LABELS[entry.dayOfWeek] : '—'
  const timeLabel =
    entry.startTime && entry.endTime
      ? `${entry.startTime} – ${entry.endTime}`
      : 'Todo el horario de la clínica'

  return (
    <div className='flex items-center justify-between p-3 rounded-lg bg-[var(--color-brand-50)]'>
      <div className='flex items-center gap-3'>
        <div className='size-10 rounded-full bg-[var(--color-brand-100)] flex items-center justify-center'>
          <AccessTimeFilledRounded className='size-5 text-[var(--color-brand-600)]' />
        </div>
        <div>
          <p className='text-body-sm font-medium text-neutral-800'>
            {dayLabel}
          </p>
          <p className='text-label-sm text-neutral-600'>{timeLabel}</p>
        </div>
      </div>
      <button
        type='button'
        onClick={onDelete}
        className='p-1.5 hover:bg-white/50 rounded-lg'
      >
        <DeleteRounded className='size-4 text-neutral-500' />
      </button>
    </div>
  )
}

function SpecificDateItem({
  entry,
  onCancel
}: {
  entry: ExternalSpecialistScheduleEntry
  onCancel: () => void
}) {
  const dateObj = entry.specificDate
    ? new Date(entry.specificDate + 'T12:00:00')
    : null
  const dateStr = dateObj
    ? dateObj.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '—'
  const timeLabel =
    entry.startTime && entry.endTime
      ? `${entry.startTime} – ${entry.endTime}`
      : 'Todo el horario de la clínica'

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        entry.isCancelled ? 'bg-red-50' : 'bg-amber-50'
      }`}
    >
      <div className='flex items-center gap-3'>
        <div
          className={`size-10 rounded-full flex items-center justify-center ${
            entry.isCancelled ? 'bg-red-100' : 'bg-amber-100'
          }`}
        >
          <CalendarMonthRounded
            className={`size-5 ${
              entry.isCancelled ? 'text-red-600' : 'text-amber-600'
            }`}
          />
        </div>
        <div>
          <p
            className={`text-body-sm font-medium ${
              entry.isCancelled
                ? 'text-neutral-500 line-through'
                : 'text-neutral-800'
            }`}
          >
            {dateStr}
          </p>
          <p className='text-label-sm text-neutral-600'>
            {entry.isCancelled ? 'Cancelada' : timeLabel}
            {entry.notes ? ` · ${entry.notes}` : ''}
          </p>
        </div>
      </div>
      {!entry.isCancelled && (
        <button
          type='button'
          onClick={onCancel}
          className='px-3 py-1 text-label-sm font-medium text-red-600 hover:bg-red-100 rounded-lg'
        >
          Cancelar
        </button>
      )}
    </div>
  )
}

function AddRecurringForm({
  existingDays,
  onAdd,
  onCancel
}: {
  existingDays: number[]
  onAdd: (dayOfWeek: number, startTime: string, endTime: string) => void
  onCancel: () => void
}) {
  const availableDays = DAY_OPTIONS.filter(
    (d) => !existingDays.includes(d.value)
  )
  const [day, setDay] = useState(availableDays[0]?.value ?? 1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  return (
    <div className='p-4 border border-neutral-200 rounded-xl space-y-4 bg-neutral-50'>
      <div className='grid grid-cols-3 gap-4'>
        <InlineSelect
          value={String(day)}
          onChange={(v) => setDay(Number(v))}
          label='Día de la semana'
          options={availableDays.map((d) => ({
            value: String(d.value),
            label: d.label
          }))}
        />
        <TimeSelect
          label='Hora inicio (opcional)'
          value={startTime}
          onChange={setStartTime}
          allowEmpty
        />
        <TimeSelect
          label='Hora fin (opcional)'
          value={endTime}
          onChange={setEndTime}
          allowEmpty
        />
      </div>
      <p className='text-label-sm text-neutral-500'>
        Si no se especifica horario, se entiende que viene todo el horario de
        apertura de la clínica.
      </p>
      <div className='flex justify-end gap-2'>
        <button
          type='button'
          onClick={onCancel}
          className='px-4 py-2 text-body-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg'
        >
          Cancelar
        </button>
        <button
          type='button'
          onClick={() => onAdd(day, startTime, endTime)}
          disabled={availableDays.length === 0}
          className='px-4 py-2 text-body-sm font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg'
        >
          Añadir
        </button>
      </div>
    </div>
  )
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function MiniCalendar({
  selectedDates,
  onToggleDate,
  existingDates
}: {
  selectedDates: Set<string>
  onToggleDate: (dateStr: string) => void
  existingDates: Set<string>
}) {
  const today = new Date()
  const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  // Adjust so Monday = 0
  const startOffset = (firstDayOfMonth + 6) % 7

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const cells: Array<{ day: number; dateStr: string } | null> = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: formatDateKey(viewYear, viewMonth, d) })
  }

  return (
    <div className='select-none'>
      <div className='flex items-center justify-between mb-3'>
        <button type='button' onClick={goToPrevMonth} className='p-1 hover:bg-neutral-100 rounded-lg'>
          <ChevronLeftRounded className='size-5 text-neutral-600' />
        </button>
        <p className='text-body-sm font-medium text-neutral-800 capitalize'>{monthLabel}</p>
        <button type='button' onClick={goToNextMonth} className='p-1 hover:bg-neutral-100 rounded-lg'>
          <ChevronRightRounded className='size-5 text-neutral-600' />
        </button>
      </div>
      <div className='grid grid-cols-7 gap-px'>
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map((d) => (
          <div key={d} className='h-8 flex items-center justify-center text-label-xs text-neutral-400 font-medium'>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className='h-9' />
          const isPast = cell.dateStr < todayStr
          const isToday = cell.dateStr === todayStr
          const isSelected = selectedDates.has(cell.dateStr)
          const alreadyExists = existingDates.has(cell.dateStr)

          return (
            <button
              key={cell.dateStr}
              type='button'
              disabled={isPast || alreadyExists}
              onClick={() => onToggleDate(cell.dateStr)}
              className={[
                'h-9 w-full rounded-lg text-body-sm font-medium transition-colors relative',
                isPast ? 'text-neutral-300 cursor-not-allowed' : '',
                alreadyExists && !isPast ? 'text-neutral-400 bg-neutral-100 cursor-not-allowed' : '',
                isSelected ? 'bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)]' : '',
                !isPast && !isSelected && !alreadyExists ? 'text-neutral-700 hover:bg-[var(--color-brand-50)]' : '',
                isToday && !isSelected ? 'ring-1 ring-inset ring-[var(--color-brand-400)]' : ''
              ].filter(Boolean).join(' ')}
            >
              {cell.day}
              {alreadyExists && !isPast && (
                <span className='absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-amber-400' />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AddSpecificDateForm({
  onAdd,
  onCancel,
  existingSpecificDates
}: {
  onAdd: (
    dates: string[],
    startTime: string,
    endTime: string,
    notes: string
  ) => void
  onCancel: () => void
  existingSpecificDates: Set<string>
}) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  const toggleDate = useCallback((dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }, [])

  const sortedSelected = useMemo(
    () => Array.from(selectedDates).sort(),
    [selectedDates]
  )

  return (
    <div className='p-4 border border-neutral-200 rounded-xl space-y-4 bg-neutral-50'>
      <p className='text-body-sm text-neutral-600'>
        Haz clic en los días del calendario para seleccionarlos. Puedes seleccionar varios a la vez.
      </p>

      <div className='flex gap-6'>
        <div className='flex-1 min-w-0'>
          <MiniCalendar
            selectedDates={selectedDates}
            onToggleDate={toggleDate}
            existingDates={existingSpecificDates}
          />
        </div>

        <div className='w-52 flex flex-col gap-3'>
          <TimeSelect
            label='Hora inicio (opcional)'
            value={startTime}
            onChange={setStartTime}
            allowEmpty
          />
          <TimeSelect
            label='Hora fin (opcional)'
            value={endTime}
            onChange={setEndTime}
            allowEmpty
          />
          <div className='flex flex-col gap-1'>
            <label className='text-label-sm text-neutral-500'>
              Notas (opcional)
            </label>
            <input
              type='text'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Ej: Cirugía...'
              className='h-10 px-3 rounded-lg border border-neutral-300 bg-white text-body-sm outline-none'
            />
          </div>
        </div>
      </div>

      {sortedSelected.length > 0 && (
        <div className='flex flex-wrap gap-1.5'>
          {sortedSelected.map((d) => {
            const dateObj = new Date(d + 'T12:00:00')
            const label = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
            return (
              <span
                key={d}
                className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--color-brand-100)] text-[var(--color-brand-700)] text-label-sm font-medium'
              >
                {label}
                <button
                  type='button'
                  onClick={() => toggleDate(d)}
                  className='hover:text-[var(--color-brand-900)]'
                >
                  <CloseRounded className='size-3.5' />
                </button>
              </span>
            )
          })}
        </div>
      )}

      <div className='flex items-center justify-between'>
        <p className='text-label-sm text-neutral-500'>
          {sortedSelected.length === 0
            ? 'Ningún día seleccionado'
            : `${sortedSelected.length} día${sortedSelected.length > 1 ? 's' : ''} seleccionado${sortedSelected.length > 1 ? 's' : ''}`}
        </p>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={onCancel}
            className='px-4 py-2 text-body-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={() => onAdd(sortedSelected, startTime, endTime, notes)}
            disabled={sortedSelected.length === 0}
            className='px-4 py-2 text-body-sm font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg'
          >
            Añadir {sortedSelected.length > 1 ? `${sortedSelected.length} fechas` : 'fecha'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExternalSpecialistScheduleModal({
  open,
  onClose,
  staffId,
  staffName,
  staffRole
}: Props) {
  const {
    externalSpecialistSchedules,
    addExternalScheduleEntry,
    updateExternalScheduleEntry,
    deleteExternalScheduleEntry
  } = useConfiguration()

  const [activeTab, setActiveTab] = useState<'recurring' | 'specific'>(
    'recurring'
  )
  const [showAddRecurring, setShowAddRecurring] = useState(false)
  const [showAddSpecific, setShowAddSpecific] = useState(false)

  useEffect(() => {
    if (!open) {
      setActiveTab('recurring')
      setShowAddRecurring(false)
      setShowAddSpecific(false)
    }
  }, [open])

  const staffSchedules = useMemo(() => {
    if (!staffId) return []
    return externalSpecialistSchedules.filter(
      (e) => e.staffId === staffId
    )
  }, [externalSpecialistSchedules, staffId])

  const recurringEntries = useMemo(
    () =>
      staffSchedules
        .filter((e) => e.scheduleType === 'recurring' && !e.isCancelled)
        .sort((a, b) => (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0)),
    [staffSchedules]
  )

  const specificEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return staffSchedules
      .filter((e) => e.scheduleType === 'specific')
      .filter((e) => (e.specificDate ?? '') >= today || e.isCancelled)
      .sort((a, b) =>
        (a.specificDate ?? '').localeCompare(b.specificDate ?? '')
      )
  }, [staffSchedules])

  const existingSpecificDates = useMemo(
    () => new Set(
      specificEntries
        .filter((e) => !e.isCancelled && e.specificDate)
        .map((e) => e.specificDate!)
    ),
    [specificEntries]
  )

  const existingRecurringDays = useMemo(
    () =>
      recurringEntries
        .map((e) => e.dayOfWeek)
        .filter((d): d is number => d != null),
    [recurringEntries]
  )

  const resolveClinicId = useCallback((): string => {
    const existing = externalSpecialistSchedules.find(
      (e) => e.staffId === staffId
    )
    if (existing?.clinicId) return existing.clinicId
    if (typeof window !== 'undefined') {
      return localStorage.getItem('klinikos-selected-clinic-id') || ''
    }
    return ''
  }, [externalSpecialistSchedules, staffId])

  const handleAddRecurring = useCallback(
    async (dayOfWeek: number, startTime: string, endTime: string) => {
      if (!staffId) return
      await addExternalScheduleEntry({
        staffId,
        clinicId: resolveClinicId(),
        scheduleType: 'recurring',
        dayOfWeek,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        isCancelled: false
      })
      setShowAddRecurring(false)
    },
    [staffId, addExternalScheduleEntry, resolveClinicId]
  )

  const handleAddSpecific = useCallback(
    async (
      dates: string[],
      startTime: string,
      endTime: string,
      notes: string
    ) => {
      if (!staffId || dates.length === 0) return
      const clinicId = resolveClinicId()
      for (const date of dates) {
        await addExternalScheduleEntry({
          staffId,
          clinicId,
          scheduleType: 'specific',
          specificDate: date,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          notes: notes || undefined,
          isCancelled: false
        })
      }
      setShowAddSpecific(false)
    },
    [staffId, addExternalScheduleEntry, resolveClinicId]
  )

  const handleDeleteRecurring = useCallback(
    async (id: number) => {
      await deleteExternalScheduleEntry(id)
    },
    [deleteExternalScheduleEntry]
  )

  const handleCancelSpecific = useCallback(
    async (id: number) => {
      await updateExternalScheduleEntry(id, { isCancelled: true })
    },
    [updateExternalScheduleEntry]
  )

  const summary = useMemo(() => {
    if (recurringEntries.length === 0 && specificEntries.length === 0)
      return 'Sin días asignados'
    const parts: string[] = []
    if (recurringEntries.length > 0) {
      parts.push(
        recurringEntries
          .map((e) =>
            e.dayOfWeek != null ? DAY_LABELS[e.dayOfWeek].slice(0, 3) : ''
          )
          .filter(Boolean)
          .join(', ')
      )
    }
    const activeSpecific = specificEntries.filter((e) => !e.isCancelled)
    if (activeSpecific.length > 0) {
      parts.push(`${activeSpecific.length} fecha${activeSpecific.length > 1 ? 's' : ''} puntual${activeSpecific.length > 1 ? 'es' : ''}`)
    }
    return parts.join(' + ')
  }, [recurringEntries, specificEntries])

  if (!open || !staffId) return null

  const initials = staffName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-8 overflow-y-auto'
        onClick={onClose}
      >
        <div
          className='relative w-[min(60rem,95vw)] my-auto bg-white rounded-xl shadow-xl'
          onClick={(e) => e.stopPropagation()}
        >
          <header className='border-b border-neutral-200'>
            <div className='flex items-center justify-between px-6 py-4'>
              <div className='flex items-center gap-3'>
                <div className='size-12 rounded-full flex items-center justify-center text-title-md font-medium bg-teal-100 text-teal-700'>
                  {initials}
                </div>
                <div>
                  <h2 className='text-title-md font-medium'>
                    Días de {staffName}
                  </h2>
                  <p className='text-body-sm text-neutral-500'>
                    {staffRole} · Especialista externo · {summary}
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={onClose}
                className='p-2 hover:bg-neutral-100 rounded-lg'
              >
                <CloseRounded className='size-5' />
              </button>
            </div>
            <div className='flex px-6 gap-1'>
              <button
                type='button'
                onClick={() => setActiveTab('recurring')}
                className={`px-4 py-2.5 text-body-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'recurring'
                    ? 'border-[var(--color-brand-500)] text-[var(--color-brand-600)]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className='flex items-center gap-2'>
                  <AccessTimeFilledRounded className='size-4' />
                  Días recurrentes
                  {recurringEntries.length > 0 && (
                    <span className='px-1.5 py-0.5 text-label-xs bg-neutral-200 rounded-full'>
                      {recurringEntries.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('specific')}
                className={`px-4 py-2.5 text-body-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'specific'
                    ? 'border-[var(--color-brand-500)] text-[var(--color-brand-600)]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className='flex items-center gap-2'>
                  <CalendarMonthRounded className='size-4' />
                  Fechas específicas
                  {specificEntries.filter((e) => !e.isCancelled).length > 0 && (
                    <span className='px-1.5 py-0.5 text-label-xs bg-neutral-200 rounded-full'>
                      {specificEntries.filter((e) => !e.isCancelled).length}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </header>

          <div className='p-6 max-h-[calc(100vh-16rem)] overflow-y-auto'>
            {activeTab === 'recurring' ? (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-body-md font-medium'>
                      Días recurrentes
                    </h3>
                    <p className='text-body-sm text-neutral-500'>
                      Días fijos de la semana que viene el especialista
                    </p>
                  </div>
                  {!showAddRecurring && existingRecurringDays.length < 7 && (
                    <button
                      type='button'
                      onClick={() => setShowAddRecurring(true)}
                      className='flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-lg'
                    >
                      <AddRounded className='size-4' />
                      Añadir día
                    </button>
                  )}
                </div>

                {showAddRecurring && (
                  <AddRecurringForm
                    existingDays={existingRecurringDays}
                    onAdd={handleAddRecurring}
                    onCancel={() => setShowAddRecurring(false)}
                  />
                )}

                {recurringEntries.length > 0 ? (
                  <div className='space-y-2'>
                    {recurringEntries.map((entry) => (
                      <RecurringDayItem
                        key={entry.id}
                        entry={entry}
                        onDelete={() => handleDeleteRecurring(entry.id)}
                      />
                    ))}
                  </div>
                ) : (
                  !showAddRecurring && (
                    <div className='text-center py-12'>
                      <AccessTimeFilledRounded className='size-12 text-neutral-300 mx-auto mb-3' />
                      <p className='text-body-md text-neutral-500'>
                        No hay días recurrentes configurados
                      </p>
                      <p className='text-body-sm text-neutral-400'>
                        Añade los días fijos de la semana que viene este
                        especialista
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-body-md font-medium'>
                      Fechas específicas
                    </h3>
                    <p className='text-body-sm text-neutral-500'>
                      Fechas puntuales concretas en las que viene el
                      especialista
                    </p>
                  </div>
                  {!showAddSpecific && (
                    <button
                      type='button'
                      onClick={() => setShowAddSpecific(true)}
                      className='flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-lg'
                    >
                      <AddRounded className='size-4' />
                      Añadir fecha
                    </button>
                  )}
                </div>

                {showAddSpecific && (
                  <AddSpecificDateForm
                    onAdd={handleAddSpecific}
                    onCancel={() => setShowAddSpecific(false)}
                    existingSpecificDates={existingSpecificDates}
                  />
                )}

                {specificEntries.length > 0 ? (
                  <div className='space-y-2'>
                    {specificEntries.map((entry) => (
                      <SpecificDateItem
                        key={entry.id}
                        entry={entry}
                        onCancel={() => handleCancelSpecific(entry.id)}
                      />
                    ))}
                  </div>
                ) : (
                  !showAddSpecific && (
                    <div className='text-center py-12'>
                      <CalendarMonthRounded className='size-12 text-neutral-300 mx-auto mb-3' />
                      <p className='text-body-md text-neutral-500'>
                        No hay fechas específicas programadas
                      </p>
                      <p className='text-body-sm text-neutral-400'>
                        Añade fechas puntuales en las que vendrá este
                        especialista
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <footer className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl'>
            <button
              type='button'
              onClick={onClose}
              className='px-6 py-2.5 text-body-md font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg'
            >
              Cerrar
            </button>
          </footer>
        </div>
      </div>
    </Portal>
  )
}
