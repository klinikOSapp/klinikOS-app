/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'

type HeaderControlsProps = {
  dateLabel?: string
  onNavigatePrevious?: () => void
  onNavigateNext?: () => void
  onFiltersApply?: (filters: {
    specialty: string
    period: string
    selectedDay: number | null
  }) => void
}

type SelectFieldProps = {
  label: string
  value: string
  options: string[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}

const FIELD_WIDTH = 'min(26.5rem, 92vw)'
const PANEL_WIDTH = 'min(28.5rem, 95vw)'
const PANEL_HEIGHT = 'min(48.5rem, 90vh)'

function SelectField({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect
}: SelectFieldProps) {
  return (
    <div
      className='relative flex flex-col gap-[0.5rem]'
      style={{ width: FIELD_WIDTH }}
    >
      <label className='text-body-sm text-fg'>{label}</label>
      <button
        type='button'
        className='flex items-center justify-between rounded-[0.5rem] border border-border bg-surface-app px-[0.625rem] py-[0.5rem] h-[3rem] text-left'
        onClick={onToggle}
        aria-haspopup='listbox'
        aria-expanded={isOpen}
      >
        <span className='text-body-md text-fg'>{value}</span>
        <span className='material-symbols-rounded text-fg text-[1.5rem]'>
          expand_more
        </span>
      </button>
      {isOpen ? (
        <div
          className='absolute left-0 top-[calc(100%+0.25rem)] z-50 flex flex-col overflow-hidden rounded-[0.75rem] border border-border bg-surface-app shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
          style={{ minWidth: FIELD_WIDTH }}
          role='listbox'
        >
          {options.map((opt) => (
            <button
              key={opt}
              type='button'
              className={`flex items-center justify-between px-[0.75rem] py-[0.5rem] text-title-sm text-fg transition-colors hover:bg-surface ${
                opt === value ? 'bg-brand-50 text-fg font-medium' : ''
              }`}
              onClick={() => onSelect(opt)}
              role='option'
              aria-selected={opt === value}
            >
              <span>{opt}</span>
              {opt === value ? (
                <span className='material-symbols-rounded text-brandSemantic text-[1.25rem] leading-none'>
                  check
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FiltersOverlay({
  onClose,
  onApply
}: {
  onClose: () => void
  onApply: (filters: {
    specialty: string
    period: string
    selectedDay: number | null
  }) => void
}) {
  const specialtyOptions = useMemo(
    () => ['Todas', 'Conservadora', 'Ortodoncia', 'Implantes', 'Estética'],
    []
  )
  const periodOptions = useMemo(() => ['Mes', 'Semana', 'Día'], [])
  const [specialty, setSpecialty] = useState(specialtyOptions[0])
  const [period, setPeriod] = useState(periodOptions[0])
  const [openSelect, setOpenSelect] = useState<'specialty' | 'period' | null>(
    null
  )
  const [selectedDay, setSelectedDay] = useState<number | null>(10)
  const accentDay = 18
  const [currentMonth, setCurrentMonth] = useState(9) // 0-based (Octubre)
  const [currentYear, setCurrentYear] = useState(2025)
  const [isYearOpen, setIsYearOpen] = useState(false)

  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric'
    })
    return formatter.format(new Date(currentYear, currentMonth, 1))
  }, [currentMonth, currentYear])

  const yearOptions = useMemo(
    () => [currentYear - 1, currentYear, currentYear + 1],
    [currentYear]
  )

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()
    const firstWeekday = new Date(currentYear, currentMonth, 1).getDay() // 0 Sunday
    const mondayStart = (firstWeekday + 6) % 7 // Monday = 0
    const totalCells = 42 // 6 weeks grid

    const days: { label: number; inCurrent: boolean }[] = []

    // leading days from previous month
    for (let i = mondayStart - 1; i >= 0; i -= 1) {
      days.push({ label: daysInPrevMonth - i, inCurrent: false })
    }

    // current month days
    for (let d = 1; d <= daysInMonth; d += 1) {
      days.push({ label: d, inCurrent: true })
    }

    // trailing days from next month
    for (let d = 1; days.length < totalCells; d += 1) {
      days.push({ label: d, inCurrent: false })
    }

    return days
  }, [currentMonth, currentYear])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1)
        return 11
      }
      return prev - 1
    })
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1)
        return 0
      }
      return prev + 1
    })
    setSelectedDay(null)
  }

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const days = useMemo(
    () => [
      '30',
      '31',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '1',
      '2'
    ],
    []
  )

  const handleApply = () => {
    onApply({ specialty, period, selectedDay })
    onClose()
  }

  return (
    <div
      className='fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-[2px] px-4'
      onClick={onClose}
    >
      <div
        className='relative overflow-hidden rounded-[1rem] bg-white shadow-elevation-card'
        style={{ width: PANEL_WIDTH, maxHeight: PANEL_HEIGHT }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className='flex flex-col gap-[1rem] p-[1rem] overflow-y-auto max-h-[calc(90vh-2rem)]'>
          <div className='flex items-start justify-between'>
            <h2 className='text-title-sm font-medium text-fg'>Filtros</h2>
            <button
              type='button'
              aria-label='Cerrar filtros'
              className='rounded-full p-[0.25rem] text-fg transition-colors hover:bg-surface'
              onClick={onClose}
            >
              <span className='material-symbols-rounded text-[1.5rem] leading-none'>
                close
              </span>
            </button>
          </div>

          <SelectField
            label='Especialidad'
            value={specialty}
            options={specialtyOptions}
            isOpen={openSelect === 'specialty'}
            onToggle={() =>
              setOpenSelect((prev) =>
                prev === 'specialty' ? null : 'specialty'
              )
            }
            onSelect={(val) => {
              setSpecialty(val)
              setOpenSelect(null)
            }}
          />
          <SelectField
            label='Periodo'
            value={period}
            options={periodOptions}
            isOpen={openSelect === 'period'}
            onToggle={() =>
              setOpenSelect((prev) => (prev === 'period' ? null : 'period'))
            }
            onSelect={(val) => {
              setPeriod(val)
              setOpenSelect(null)
            }}
          />

          <div className='rounded-[1rem] border border-[#f5f5f5] p-[1.25rem]'>
            <div className='flex items-center justify-between text-[#131a29]'>
              <button
                type='button'
                className='p-[0.25rem] rounded-[0.5rem] hover:bg-surface'
                aria-label='Mes anterior'
                onClick={handlePrevMonth}
              >
                <span className='material-symbols-rounded text-[1.5rem]'>
                  chevron_left
                </span>
              </button>
              <div className='relative flex items-center gap-[0.5rem]'>
                <span className='text-title-md font-medium leading-[2rem] capitalize'>
                  {monthLabel.split(' ')[0]}
                </span>
                <div className='relative'>
                  <button
                    type='button'
                    className='flex items-center gap-[0.25rem] rounded-[0.5rem] border border-border bg-surface-app px-[0.5rem] py-[0.25rem] text-title-sm text-fg'
                    aria-haspopup='listbox'
                    aria-expanded={isYearOpen}
                    onClick={() => setIsYearOpen((prev) => !prev)}
                  >
                    <span>{currentYear}</span>
                    <span className='material-symbols-rounded text-[1.25rem] leading-none'>
                      expand_more
                    </span>
                  </button>
                  {isYearOpen ? (
                    <div
                      className='absolute right-0 mt-[0.25rem] flex flex-col overflow-hidden rounded-[0.75rem] border border-border bg-surface-app shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-10'
                      role='listbox'
                    >
                      {yearOptions.map((year) => (
                        <button
                          key={year}
                          type='button'
                          className={`flex items-center justify-between px-[0.75rem] py-[0.5rem] text-title-sm text-fg transition-colors hover:bg-surface ${
                            year === currentYear
                              ? 'bg-brand-50 font-medium'
                              : ''
                          }`}
                          onClick={() => {
                            setCurrentYear(year)
                            setIsYearOpen(false)
                            setSelectedDay(null)
                          }}
                          aria-selected={year === currentYear}
                          role='option'
                        >
                          <span>{year}</span>
                          {year === currentYear ? (
                            <span className='material-symbols-rounded text-brandSemantic text-[1.25rem] leading-none'>
                              check
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                type='button'
                className='p-[0.25rem] rounded-[0.5rem] hover:bg-surface'
                aria-label='Mes siguiente'
                onClick={handleNextMonth}
              >
                <span className='material-symbols-rounded text-[1.5rem]'>
                  chevron_right
                </span>
              </button>
            </div>

            <div className='mt-[1rem] grid grid-cols-7 gap-[0.5rem] text-center text-body-md text-[#c4c4c4]'>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <div key={d} className='rounded-[0.5rem] bg-white py-[0.5rem]'>
                  {d}
                </div>
              ))}
            </div>

            <div className='mt-[0.75rem] grid grid-cols-7 gap-[0.5rem] text-center text-body-md'>
              {calendarDays.map((day, idx) => {
                const { label, inCurrent } = day
                const numericDay = label
                const isAccent =
                  inCurrent &&
                  currentYear === 2025 &&
                  currentMonth === 9 &&
                  numericDay === accentDay
                const isPrimary = inCurrent && numericDay === selectedDay
                return (
                  <div
                    key={`${label}-${idx}`}
                    role='button'
                    tabIndex={0}
                    onClick={() => {
                      if (!inCurrent) return
                      setSelectedDay(numericDay)
                    }}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        if (!inCurrent) return
                        setSelectedDay(numericDay)
                      }
                    }}
                    className={`rounded-[0.5rem] py-[0.5rem] cursor-pointer select-none border border-transparent transition-colors ${
                      isPrimary
                        ? 'bg-brand-500 text-white'
                        : isAccent
                        ? 'border-2 border-brand-500 bg-brand-200 text-brand-500'
                        : inCurrent
                        ? 'bg-[#f5f5f5] text-[#131a29] hover:bg-[#e9f6fb]'
                        : 'bg-white text-[#c4c4c4]'
                    }`}
                  >
                    {label}
                  </div>
                )
              })}
            </div>
          </div>

          <div className='flex justify-end'>
            <button
              type='button'
              className='flex items-center gap-[0.5rem] rounded-[999px] bg-brand-500 px-[1rem] py-[0.5rem] text-title-sm font-medium text-[#24282c] shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
              onClick={handleApply}
            >
              <span className='material-symbols-rounded text-[1.25rem] leading-none text-[#24282c]'>
                add
              </span>
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HeaderControls({
  dateLabel = '13 - 19, oct 2025',
  onNavigatePrevious,
  onNavigateNext,
  onFiltersApply
}: HeaderControlsProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const pillButtonClasses =
    'inline-flex items-center justify-center h-[var(--nav-chip-height)] px-[var(--nav-chip-pad-x)] rounded-full border border-border bg-surface-app text-title-sm font-medium text-fg gap-gapsm transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brandSemantic focus-visible:ring-offset-0'

  return (
    <div className='flex flex-col gap-fluid-sm xl:flex-row xl:items-center xl:justify-end mt-[var(--spacing-plnav)]'>
      <div className='flex w-full flex-nowrap items-center gap-gapsm justify-end pr-4 min-w-0 overflow-x-auto'>
        <button
          className={pillButtonClasses}
          onClick={() => setIsFiltersOpen(true)}
        >
          <span className='material-symbols-rounded'>add</span>
          <span className='text-title-sm font-medium'>Informe</span>
        </button>
      </div>

      {isFiltersOpen ? (
        <FiltersOverlay
          onClose={() => setIsFiltersOpen(false)}
          onApply={(filters) => {
            onFiltersApply?.(filters)
          }}
        />
      ) : null}
    </div>
  )
}
