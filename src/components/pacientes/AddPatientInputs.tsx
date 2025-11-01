'use client'

import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import React from 'react'
import { createPortal } from 'react-dom'

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-body-md text-[var(--color-neutral-900)]'>{children}</p>
  )
}

export function TextInput({
  placeholder = 'Value',
  required
}: {
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className='relative'>
      <input
        placeholder={placeholder}
        className='w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
      />
      {required && (
        <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-error-600)] text-body-md leading-none'>
          *
        </span>
      )}
    </div>
  )
}

export function SelectInput({
  placeholder = 'Value'
}: {
  placeholder?: string
}) {
  return (
    <div className='relative'>
      <select className='appearance-none w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-body-md text-[var(--color-neutral-900)] outline-none'>
        <option>{placeholder}</option>
      </select>
      <KeyboardArrowDownRounded className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-700)]' />
    </div>
  )
}

export function TextArea({ placeholder = 'Value' }: { placeholder?: string }) {
  return (
    <div className='relative'>
      <textarea
        placeholder={placeholder}
        className='w-full h-20 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 py-2 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none resize-none'
      />
    </div>
  )
}

export function DatePickerInput({
  value,
  onChange
}: {
  value?: Date | null
  onChange?: (d: Date) => void
}) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  const dateFieldRef = React.useRef<HTMLDivElement | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    value ?? null
  )
  const [pendingDate, setPendingDate] = React.useState<Date | null>(null)
  const today = React.useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = React.useState<number>(today.getMonth())
  const [viewYear, setViewYear] = React.useState<number>(today.getFullYear())
  const [popoverPos, setPopoverPos] = React.useState<{
    left: number
    top: number
  } | null>(null)
  const [scale, setScale] = React.useState(1)
  const [showMonthMenu, setShowMonthMenu] = React.useState(false)
  const [showYearMenu, setShowYearMenu] = React.useState(false)

  const remToPx = React.useCallback((rem: number) => {
    const root = getComputedStyle(document.documentElement).fontSize
    const base = parseFloat(root || '16') || 16
    return rem * base
  }, [])

  React.useEffect(() => {
    const updatePosition = () => {
      if (!dateFieldRef.current) return
      const rect = dateFieldRef.current.getBoundingClientRect()
      const margin = 8
      const baseWpx = remToPx(22.5)
      const baseHpx = remToPx(28.75)
      const maxWFrac = 0.4
      const maxHFrac = 0.6
      const s = Math.min(
        1,
        (window.innerWidth * maxWFrac) / baseWpx,
        (window.innerHeight * maxHFrac) / baseHpx
      )
      setScale(s)
      const scaledW = baseWpx * s
      const scaledH = baseHpx * s
      let left = rect.left + window.scrollX
      let top = rect.bottom + window.scrollY + 4
      const maxLeft = window.scrollX + window.innerWidth - scaledW - margin
      const maxTop = window.scrollY + window.innerHeight - scaledH - margin
      left = Math.max(window.scrollX + margin, Math.min(left, maxLeft))
      top = Math.max(window.scrollY + margin, Math.min(top, maxTop))
      setPopoverPos({ left, top })
    }
    if (calendarOpen) {
      updatePosition()
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)
      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
      }
    }
    return undefined
  }, [calendarOpen, remToPx])

  React.useEffect(() => {
    if (calendarOpen) {
      const base = selectedDate ?? new Date()
      setPendingDate(selectedDate ?? null)
      setViewMonth(base.getMonth())
      setViewYear(base.getFullYear())
    }
  }, [calendarOpen, selectedDate])

  const monthLabels = React.useMemo(
    () => [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ],
    []
  )
  function formatDateDDMMYYYY(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }
  function buildMonthMatrix(year: number, month: number) {
    const first = new Date(year, month, 1)
    const startDow = first.getDay()
    const start = new Date(year, month, 1 - startDow)
    const weeks: { date: Date; inMonth: boolean }[][] = []
    for (let r = 0; r < 6; r++) {
      const row: { date: Date; inMonth: boolean }[] = []
      for (let c = 0; c < 7; c++) {
        const d = new Date(start)
        d.setDate(start.getDate() + (r * 7 + c))
        row.push({ date: d, inMonth: d.getMonth() === month })
      }
      weeks.push(row)
    }
    return weeks
  }
  const weeks = React.useMemo(() => {
    const allWeeks = buildMonthMatrix(viewYear, viewMonth)
    const last = allWeeks[allWeeks.length - 1]
    if (last && last.every((c) => !c.inMonth)) {
      return allWeeks.slice(0, allWeeks.length - 1)
    }
    return allWeeks
  }, [viewYear, viewMonth])
  const prevMonth = () => setViewMonth((m) => (m > 0 ? m - 1 : 11))
  const nextMonth = () => setViewMonth((m) => (m < 11 ? m + 1 : 0))
  const prevYear = () => setViewYear((y) => y - 1)
  const nextYear = () => setViewYear((y) => y + 1)

  return (
    <div className='self-stretch flex flex-col justify-start items-start gap-1'>
      <div
        ref={dateFieldRef}
        className='relative self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'
      >
        <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
          {selectedDate ? formatDateDDMMYYYY(selectedDate) : 'DD/MM/AAAA'}
        </div>
        <button
          type='button'
          aria-label='Abrir calendario'
          onClick={() => setCalendarOpen((v) => !v)}
          className='p-1 rounded hover:bg-[var(--color-neutral-100)]'
        >
          <CalendarMonthRounded className='w-6 h-6' />
        </button>
        {calendarOpen &&
          popoverPos &&
          createPortal(
            <div
              ref={calendarRef}
              className='fixed z-[100] w-[22.5rem] bg-[var(--color-surface-popover,#fff)] rounded-[1rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden'
              style={{
                left: popoverPos.left,
                top: popoverPos.top,
                transform: `scale(${scale})`,
                transformOrigin: 'top left'
              }}
            >
              <div className='w-full h-16 px-2 flex items-center justify-between'>
                <div className='flex items-center gap-0'>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center'
                    onClick={prevMonth}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <ChevronLeftRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                    </div>
                  </button>
                  <div className='relative ml-1'>
                    <button
                      type='button'
                      className='box-border flex items-center gap-2 overflow-clip pl-2 pr-1 py-2 rounded-[100px] h-10 hover:bg-[var(--color-neutral-50)]'
                      onClick={() => {
                        setShowMonthMenu((v) => !v)
                        setShowYearMenu(false)
                      }}
                    >
                      <span className='text-body-sm font-medium text-[var(--color-neutral-700)]'>
                        {monthLabels[viewMonth]}
                      </span>
                      <KeyboardArrowDownRounded className='w-[18px] h-[18px] text-[var(--color-neutral-700)]' />
                    </button>
                    {showMonthMenu && (
                      <div className='absolute left-0 top-[calc(100%+4px)] z-10 w-32 max-h-60 overflow-auto bg-[var(--color-surface-popover)] rounded-[0.75rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)]'>
                        {monthLabels.map((m, idx) => (
                          <button
                            key={m}
                            type='button'
                            className={`w-full px-3 py-2 text-left text-body-sm ${
                              idx === viewMonth
                                ? 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)]'
                                : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
                            }`}
                            onClick={() => {
                              setViewMonth(idx)
                              setShowMonthMenu(false)
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center ml-1'
                    onClick={nextMonth}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <ChevronRightRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                    </div>
                  </button>
                </div>
                <div className='flex items-center gap-0'>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center'
                    onClick={prevYear}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <ChevronLeftRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                    </div>
                  </button>
                  <div className='relative ml-1'>
                    <button
                      type='button'
                      className='box-border flex items-center gap-2 overflow-clip pl-2 pr-1 py-2 rounded-[100px] h-10 hover:bg-[var(--color-neutral-50)]'
                      onClick={() => {
                        setShowYearMenu((v) => !v)
                        setShowMonthMenu(false)
                      }}
                    >
                      <span className='text-body-sm font-medium text-[var(--color-neutral-700)]'>
                        {viewYear}
                      </span>
                      <KeyboardArrowDownRounded className='w-[18px] h-[18px] text-[var(--color-neutral-700)]' />
                    </button>
                    {showYearMenu && (
                      <div className='absolute left-0 top-[calc(100%+4px)] z-10 w-28 max-h-60 overflow-auto bg-[var(--color-surface-popover)] rounded-[0.75rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)]'>
                        {Array.from({ length: 121 }).map((_, i) => {
                          const y = viewYear - 60 + i
                          return (
                            <button
                              key={y}
                              type='button'
                              className={`w-full px-3 py-2 text-left text-body-sm ${
                                y === viewYear
                                  ? 'bg-[var(--color-neutral-50)] text-[var(--color-neutral-900)]'
                                  : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
                              }`}
                              onClick={() => {
                                setViewYear(y)
                                setShowYearMenu(false)
                              }}
                            >
                              {y}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type='button'
                    className='w-12 h-12 grid place-items-center ml-1'
                    onClick={nextYear}
                  >
                    <div className='w-10 h-10 rounded-full grid place-items-center'>
                      <ChevronRightRounded className='w-6 h-6 text-[var(--color-neutral-900)]' />
                    </div>
                  </button>
                </div>
              </div>
              <div className='w-full px-3 pt-2'>
                <div className='w-[21rem] mx-auto h-12 grid grid-cols-7 text-center text-[var(--color-neutral-700)] text-body-sm items-center'>
                  {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div
                  className={`w-[21rem] mx-auto grid ${
                    weeks.length === 5 ? 'grid-rows-5' : 'grid-rows-6'
                  } gap-y-0`}
                >
                  {weeks.map((row, rIdx) => (
                    <div key={`row-${rIdx}`} className='grid grid-cols-7'>
                      {row.map(({ date, inMonth }, cIdx) => {
                        const isSelected =
                          pendingDate &&
                          date.getFullYear() === pendingDate.getFullYear() &&
                          date.getMonth() === pendingDate.getMonth() &&
                          date.getDate() === pendingDate.getDate()
                        const base =
                          'w-10 h-10 grid place-items-center rounded text-body-sm'
                        const muted =
                          'text-[var(--color-neutral-700)] opacity-40'
                        const normal = 'text-[var(--color-neutral-900)]'
                        const selected =
                          'bg-[var(--color-brand-500)] text-[var(--color-neutral-50)]'
                        return (
                          <button
                            key={`cell-${rIdx}-${cIdx}`}
                            type='button'
                            className={`${base} ${
                              isSelected
                                ? selected
                                : inMonth
                                ? `${normal} hover:bg-[var(--color-neutral-50)]`
                                : muted
                            }`}
                            onClick={() => setPendingDate(new Date(date))}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className='w-full h-14 px-3 flex items-center justify-end gap-4'>
                <button
                  type='button'
                  className='h-12 px-4 text-[var(--color-brand-500)] text-body-sm font-medium rounded hover:bg-[var(--color-neutral-50)]'
                  onClick={() => setCalendarOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type='button'
                  className='h-12 px-4 text-[var(--color-brand-500)] text-body-sm font-medium rounded hover:bg-[var(--color-neutral-50)]'
                  onClick={() => {
                    if (pendingDate) {
                      setSelectedDate(pendingDate)
                      onChange?.(pendingDate)
                    }
                    setCalendarOpen(false)
                  }}
                >
                  Aceptar
                </button>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  )
}
