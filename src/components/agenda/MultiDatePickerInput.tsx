'use client'

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import React from 'react'
import { createPortal } from 'react-dom'

export function MultiDatePickerInput({
  value,
  onChange,
  placeholder = 'Seleccionar fechas'
}: {
  value?: Date[]
  onChange?: (dates: Date[]) => void
  placeholder?: string
}) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  const dateFieldRef = React.useRef<HTMLButtonElement | null>(null)
  const [selectedDates, setSelectedDates] = React.useState<Date[]>(value ?? [])
  const [pendingDates, setPendingDates] = React.useState<Date[]>([])
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
      setPendingDates(selectedDates)
      if (selectedDates.length > 0) {
        const firstDate = selectedDates[0]
        setViewMonth(firstDate.getMonth())
        setViewYear(firstDate.getFullYear())
      } else {
        const now = new Date()
        setViewMonth(now.getMonth())
        setViewYear(now.getFullYear())
      }
    }
  }, [calendarOpen, selectedDates])

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

  // Format selected dates for display
  const formatSelectedDates = () => {
    if (selectedDates.length === 0) {
      return placeholder
    }

    const sortedDates = [...selectedDates].sort(
      (a, b) => a.getTime() - b.getTime()
    )

    if (sortedDates.length === 1) {
      return sortedDates[0].toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    if (sortedDates.length <= 3) {
      return sortedDates
        .map((date) =>
          date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
          })
        )
        .join(', ')
    }

    return `${sortedDates.length} fechas seleccionadas`
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

  // Check if a date is selected
  const isDateSelected = (date: Date, dates: Date[]) => {
    return dates.some(
      (d) =>
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
    )
  }

  // Toggle date selection
  const toggleDate = (date: Date) => {
    if (isDateSelected(date, pendingDates)) {
      // Remove date
      setPendingDates(
        pendingDates.filter(
          (d) =>
            !(
              d.getFullYear() === date.getFullYear() &&
              d.getMonth() === date.getMonth() &&
              d.getDate() === date.getDate()
            )
        )
      )
    } else {
      // Add date
      setPendingDates([...pendingDates, new Date(date)])
    }
  }

  return (
    <>
      <button
        ref={dateFieldRef}
        type='button'
        onClick={() => setCalendarOpen((v) => !v)}
        className='w-full h-12 px-3 pr-10 text-base text-left bg-[var(--color-neutral-50)] border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] transition-colors relative'
        style={{
          color:
            selectedDates.length > 0
              ? 'var(--color-neutral-900)'
              : 'var(--color-neutral-400)'
        }}
      >
        {formatSelectedDates()}
        <KeyboardArrowDownRounded
          className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-600)] pointer-events-none'
          fontSize='small'
        />
      </button>

      {calendarOpen &&
        popoverPos &&
        createPortal(
          <div
            ref={calendarRef}
            className='fixed z-[9999] w-[22.5rem] bg-[var(--color-surface-popover,#fff)] rounded-[1rem] border border-[var(--color-neutral-300)] shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden'
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
                      const isSelected = isDateSelected(date, pendingDates)
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
                          onClick={() => toggleDate(date)}
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
                  setSelectedDates(pendingDates)
                  onChange?.(pendingDates)
                  setCalendarOpen(false)
                }}
              >
                Aceptar
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}




