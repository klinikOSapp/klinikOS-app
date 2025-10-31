'use client'

import AddAPhotoRounded from '@mui/icons-material/AddAPhotoRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import RadioButtonCheckedRounded from '@mui/icons-material/RadioButtonCheckedRounded'
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded'
import React from 'react'
import { createPortal } from 'react-dom'
// Removed Figma assets; using MUI MD3 icons instead

type AddPatientModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='text-body-md text-[var(--color-neutral-900)]'>{children}</p>
  )
}

function TextInput({
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
        <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[#B91C1C] text-body-md leading-none'>
          *
        </span>
      )}
    </div>
  )
}

function DateInput() {
  return (
    <div className='relative'>
      <input
        placeholder='DD/MM/AAAA'
        className='w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] pl-2.5 pr-10 text-body-md text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none'
      />
      <CalendarMonthRounded className='absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-700)]' />
    </div>
  )
}

function SelectInput() {
  return (
    <div className='relative'>
      <select className='appearance-none w-full h-12 rounded-[0.5rem] bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2.5 text-body-md text-[var(--color-neutral-900)] outline-none'>
        <option>Value</option>
      </select>
      <KeyboardArrowDownRounded className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-700)]' />
    </div>
  )
}

export default function AddPatientModal({
  open,
  onClose,
  onContinue
}: AddPatientModalProps) {
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const calendarRef = React.useRef<HTMLDivElement | null>(null)
  const dateFieldRef = React.useRef<HTMLDivElement | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)
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
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
    return undefined
  }, [onClose, open])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!calendarOpen) return
      const target = e.target as Node
      if (
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        dateFieldRef.current &&
        !dateFieldRef.current.contains(target)
      ) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [calendarOpen])

  const remToPx = React.useCallback((rem: number) => {
    const root = getComputedStyle(document.documentElement).fontSize
    const base = parseFloat(root || '16') || 16
    return rem * base
  }, [])

  React.useEffect(() => {
    const updatePosition = () => {
      if (!dateFieldRef.current) return
      const rect = dateFieldRef.current.getBoundingClientRect()
      const margin = 8 // px
      const baseWpx = remToPx(22.5)
      const baseHpx = remToPx(28.75)
      const maxWFrac = 0.4 // máx 40% del viewport ancho
      const maxHFrac = 0.6 // máx 60% del viewport alto
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
  const dayHeader = React.useMemo(() => ['D', 'L', 'M', 'X', 'J', 'V', 'S'], [])

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

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden
    >
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className='w-[68.25rem] h-[59.75rem] max-w-[92vw] max-h-[85vh] shrink-0 relative bg-[var(--color-surface-modal,#fff)] rounded-[1rem] overflow-hidden flex items-start justify-center'
            style={{
              width: 'min(68.25rem, calc(68.25rem * (85vh / 60rem)))',
              height: 'min(59.75rem, calc(59.75rem * (85vh / 60rem)))'
            }}
          >
            {/* Scaled content to always fit within 85vh without scroll */}
            <div
              className='relative w-[68.25rem] h-[60rem]'
              style={{
                transform: 'scale(min(1, calc(85vh / 60rem)))',
                transformOrigin: 'top left'
              }}
            >
              <div className='w-[68.25rem] h-14 px-8 left-0 top-0 absolute border-b border-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-lg font-sans'>
                  Formulario de creación de usuarios
                </div>
                <button
                  type='button'
                  aria-label='Cerrar'
                  onClick={onClose}
                  className='w-3.5 h-3.5'
                >
                  <CloseRounded className='block w-3.5 h-3.5' />
                </button>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[6rem] absolute inline-flex justify-start items-start gap-3'
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='Fill'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonCheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color: 'var(--color-brand-500)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Paciente
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[9rem] absolute inline-flex justify-start items-start gap-3'
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color: 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Contacto
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[12rem] absolute inline-flex justify-start items-start gap-3'
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color: 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Administrativo
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[15rem] absolute inline-flex justify-start items-start gap-3'
              >
                <div
                  data-has-line='true'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color: 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                  <div className='absolute left-[0.625rem] top-[1.625rem] w-[0.125rem] h-[1.375rem] bg-[var(--color-neutral-900)]'></div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Salud
                </div>
              </div>

              <div
                data-devide='Desktop'
                className='left-[2rem] top-[18rem] absolute inline-flex justify-start items-start gap-3'
              >
                <div
                  data-has-line='false'
                  data-orientation='Vertical'
                  className='w-6 h-12 relative'
                >
                  <div
                    data-state='radio_button_unchecked'
                    className='w-6 h-6 left-0 top-0 absolute'
                  >
                    <RadioButtonUncheckedRounded
                      style={{
                        width: 24,
                        height: 24,
                        color: 'var(--color-neutral-900)'
                      }}
                    />
                  </div>
                </div>
                <div className='justify-start text-[var(--color-neutral-900)] text-title-sm font-sans'>
                  Consentimientos
                </div>
              </div>

              <div
                data-property-1='Default'
                className='w-[35.5rem] left-[14.3125rem] top-[6rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='inline-flex justify-start items-center gap-2'>
                  <div className='justify-start text-[var(--color-neutral-900)] text-title-lg font-sans'>
                    Datos básicos del paciente
                  </div>
                </div>
              </div>

              <div
                data-has-description='false'
                data-has-icon='true'
                data-has-label='false'
                data-state='Default'
                data-typevalue='Place Holder'
                className='w-80 left-[30.6875rem] top-[17.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                    <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
                      Value
                    </div>
                    <span className='text-[var(--color-error-600)] text-body-md leading-none grid place-items-center'>
                      *
                    </span>
                  </div>
                </div>
              </div>

              <div
                data-has-description='false'
                data-has-icon='true'
                data-has-label='false'
                data-state='Default'
                data-typevalue='Place Holder'
                className='w-80 left-[30.6875rem] top-[23.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                    <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
                      Value
                    </div>
                    <span className='text-[var(--color-error-600)] text-body-md leading-none grid place-items-center'>
                      *
                    </span>
                  </div>
                </div>
              </div>

              <div
                data-has-description='false'
                data-has-icon='true'
                data-has-label='false'
                data-state='Default'
                data-typevalue='Place Holder'
                className='w-80 left-[30.6875rem] top-[47.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'
              >
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                    <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
                      Value
                    </div>
                    <span className='text-[var(--color-error-600)] text-title-sm leading-none grid place-items-center'>
                      *
                    </span>
                  </div>
                </div>
              </div>

              <div className='w-80 left-[30.6875rem] top-[29.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div
                    ref={dateFieldRef}
                    className='relative self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'
                  >
                    <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
                      {selectedDate
                        ? formatDateDDMMYYYY(selectedDate)
                        : 'DD/MM/AAAA'}
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
                                weeks.length === 5
                                  ? 'grid-rows-5'
                                  : 'grid-rows-6'
                              } gap-y-0`}
                            >
                              {weeks.map((row, rIdx) => (
                                <div
                                  key={`row-${rIdx}`}
                                  className='grid grid-cols-7'
                                >
                                  {row.map(({ date, inMonth }, cIdx) => {
                                    const isSelected =
                                      pendingDate &&
                                      date.getFullYear() ===
                                        pendingDate.getFullYear() &&
                                      date.getMonth() ===
                                        pendingDate.getMonth() &&
                                      date.getDate() === pendingDate.getDate()
                                    const base =
                                      'w-10 h-10 grid place-items-center rounded text-body-sm'
                                    const muted =
                                      'text-[var(--color-neutral-700)] opacity-40'
                                    const normal =
                                      'text-[var(--color-neutral-900)]'
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
                                        onClick={() =>
                                          setPendingDate(new Date(date))
                                        }
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
                                if (pendingDate) setSelectedDate(pendingDate)
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
              </div>

              <div className='left-[18.375rem] top-[10rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                Imagen del paciente
              </div>
              <div className='left-[18.375rem] top-[17.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                Nombre
              </div>
              <div className='left-[18.375rem] top-[23.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                Apellidos
              </div>
              <div className='left-[18.375rem] top-[47.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                DNI/NIE
              </div>
              <div className='left-[18.375rem] top-[29.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                Fecha de nacimiento
              </div>
              <div className='left-[18.375rem] top-[35.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                Sexo biológico
              </div>
              <div className='left-[18.375rem] top-[41.9375rem] absolute justify-start text-[var(--color-neutral-900)] text-body-md font-sans'>
                Idioma preferido
              </div>
              <div className='w-40 left-[18.375rem] top-[11.75rem] absolute justify-start text-[var(--color-neutral-500)] text-label-sm font-medium font-sans'>
                Toma una fotografía o súbela desde tu dispositivo
              </div>
              <button
                type='button'
                className='w-20 h-20 left-[30.6875rem] top-[10rem] absolute bg-[var(--color-neutral-200)] rounded-lg outline-[0.0625rem] outline-offset-[-0.0625rem] outline-[var(--color-brand-300)] overflow-hidden grid place-items-center'
              >
                <AddAPhotoRounded className='w-8 h-8' />
              </button>

              <div className='w-80 left-[30.6875rem] top-[35.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                    <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
                      Value
                    </div>
                    <KeyboardArrowDownRounded className='w-6 h-6' />
                  </div>
                </div>
              </div>

              <div className='w-80 left-[30.6875rem] top-[41.9375rem] absolute inline-flex flex-col justify-start items-start gap-2'>
                <div className='self-stretch flex flex-col justify-start items-start gap-1'>
                  <div className='self-stretch h-12 pl-2.5 pr-2 py-2 bg-[var(--color-neutral-50)] rounded-lg outline-[0.03125rem] outline-offset-[-0.03125rem] outline-[var(--color-neutral-300)] inline-flex justify-between items-center'>
                    <div className='justify-start text-[var(--color-neutral-400)] text-body-md font-sans'>
                      Value
                    </div>
                    <KeyboardArrowDownRounded className='w-6 h-6' />
                  </div>
                </div>
              </div>

              <div className='w-[31.5rem] h-0 left-[49.875rem] top-[53.25rem] absolute origin-top-left rotate-180 border-t-[0.0625rem] border-[var(--color-neutral-400)]'></div>
              <button
                type='button'
                onClick={onContinue}
                className='w-52 px-4 py-2 left-[36.4375rem] top-[55.75rem] absolute bg-[var(--color-brand-300)] rounded-[8.5rem] outline-[0.0625rem] outline-offset-[-0.0625rem] outline-[var(--color-neutral-300)] inline-flex justify-center items-center gap-2'
              >
                <div className='justify-start text-[var(--color-brand-900)] text-body-md font-medium font-sans'>
                  Continuar
                </div>
                <ArrowForwardRounded className='w-6 h-6' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
