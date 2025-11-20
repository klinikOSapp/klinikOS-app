'use client'

const WEEKDAYS = [
  { label: 'Lunes', tone: 'neutral' as const },
  { label: 'Martes', tone: 'brand' as const },
  { label: 'Miercoles', tone: 'neutral' as const },
  { label: 'Jueves', tone: 'neutral' as const },
  { label: 'Viernes', tone: 'neutral' as const },
  { label: 'Sábado', tone: 'neutral' as const },
  { label: 'Domingo', tone: 'neutral' as const }
]

type MonthEvent = {
  id: string
  label: string
  bgColor: string
}

type DayCell = {
  day: number | string
  isCurrentMonth: boolean
  isToday: boolean
  events: MonthEvent[]
}

// Datos de ejemplo basados en Figma
const CALENDAR_DATA: DayCell[][] = [
  [
    { day: 29, isCurrentMonth: false, isToday: false, events: [] },
    { day: 30, isCurrentMonth: false, isToday: false, events: [] },
    { day: '1 Octubre', isCurrentMonth: true, isToday: false, events: [] },
    { day: 2, isCurrentMonth: true, isToday: false, events: [] },
    { day: 3, isCurrentMonth: true, isToday: false, events: [] },
    { day: 4, isCurrentMonth: true, isToday: false, events: [] },
    { day: 5, isCurrentMonth: true, isToday: false, events: [] }
  ],
  [
    { day: 6, isCurrentMonth: true, isToday: false, events: [] },
    {
      day: 7,
      isCurrentMonth: true,
      isToday: true,
      events: [
        {
          id: 'e1',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-purple)'
        }
      ]
    },
    { day: 8, isCurrentMonth: true, isToday: false, events: [] },
    {
      day: 9,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e2',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-purple)'
        }
      ]
    },
    {
      day: 10,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e3',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-teal)'
        }
      ]
    },
    { day: 11, isCurrentMonth: true, isToday: false, events: [] },
    { day: 12, isCurrentMonth: false, isToday: false, events: [] }
  ],
  [
    {
      day: 13,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e4',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-teal)'
        }
      ]
    },
    {
      day: 14,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e5',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-teal)'
        }
      ]
    },
    {
      day: 15,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e6',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-teal)'
        }
      ]
    },
    { day: 16, isCurrentMonth: true, isToday: false, events: [] },
    {
      day: 17,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e7',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-purple)'
        }
      ]
    },
    { day: 18, isCurrentMonth: true, isToday: false, events: [] },
    { day: 19, isCurrentMonth: false, isToday: false, events: [] }
  ],
  [
    { day: 20, isCurrentMonth: true, isToday: false, events: [] },
    { day: 21, isCurrentMonth: true, isToday: false, events: [] },
    {
      day: 22,
      isCurrentMonth: true,
      isToday: false,
      events: [
        {
          id: 'e8',
          label: '13:00 Consulta médica',
          bgColor: 'var(--color-event-coral)'
        }
      ]
    },
    { day: 23, isCurrentMonth: true, isToday: false, events: [] },
    { day: 24, isCurrentMonth: true, isToday: false, events: [] },
    { day: 25, isCurrentMonth: true, isToday: false, events: [] },
    { day: 26, isCurrentMonth: false, isToday: false, events: [] }
  ],
  [
    { day: 27, isCurrentMonth: true, isToday: false, events: [] },
    { day: 28, isCurrentMonth: true, isToday: false, events: [] },
    { day: 29, isCurrentMonth: true, isToday: false, events: [] },
    { day: 30, isCurrentMonth: true, isToday: false, events: [] },
    { day: 31, isCurrentMonth: true, isToday: false, events: [] },
    { day: 1, isCurrentMonth: false, isToday: false, events: [] },
    { day: 2, isCurrentMonth: false, isToday: false, events: [] }
  ]
]

function HeaderLabels() {
  return (
    <div
      className='absolute left-0 top-0 flex w-full border-b border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{
        height: 'var(--scheduler-day-header-height)'
      }}
    >
      {WEEKDAYS.map((day, index) => (
        <div
          key={index}
          className='flex flex-1 items-center justify-center p-2'
        >
          <p
            className={[
              'text-body-md text-center',
              day.tone === 'brand'
                ? 'font-bold text-[var(--color-brand-500)]'
                : day.tone === 'neutral'
                ? 'font-normal text-[var(--color-neutral-600)]'
                : 'font-normal text-[var(--color-neutral-900)]'
            ].join(' ')}
          >
            {day.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function MonthEvent({ event }: { event: MonthEvent }) {
  return (
    <div
      className='flex items-center justify-center rounded-[var(--month-event-radius)] p-[var(--month-event-padding)] text-body-sm font-normal text-[var(--color-neutral-900)]'
      style={{
        position: 'absolute',
        top: 'var(--month-event-top)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'var(--month-event-width-percent)',
        height: 'var(--month-event-height)',
        backgroundColor: event.bgColor
      }}
    >
      <p className='truncate text-center'>{event.label}</p>
    </div>
  )
}

function DayCell({ cell }: { cell: DayCell }) {
  const bgClass = cell.isCurrentMonth
    ? 'bg-[var(--color-neutral-0)]'
    : 'bg-transparent'

  const dayTextClass = cell.isToday
    ? 'font-bold text-[var(--color-brand-500)]'
    : 'font-normal text-[var(--color-neutral-600)]'

  return (
    <div
      className={[
        'relative flex-1 overflow-hidden border-b border-r border-[var(--color-border-default)]',
        bgClass
      ].join(' ')}
      style={{
        height: 'var(--month-row-height)'
      }}
    >
      <p
        className={['text-body-md', dayTextClass].join(' ')}
        style={{
          position: 'absolute',
          left: '1rem',
          top: 'var(--month-cell-padding-top)'
        }}
      >
        {cell.day}
      </p>
      {cell.events.map((event) => (
        <MonthEvent key={event.id} event={event} />
      ))}
    </div>
  )
}

function MonthGrid() {
  return (
    <div
      className='absolute left-0 flex w-full flex-col'
      style={{
        top: 'var(--scheduler-day-header-height)',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      {CALENDAR_DATA.map((week, weekIndex) => (
        <div key={weekIndex} className='flex flex-1'>
          {week.map((cell, dayIndex) => (
            <DayCell key={`${weekIndex}-${dayIndex}`} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default function MonthCalendar() {
  return (
    <div className='relative h-full w-full'>
      <HeaderLabels />
      <MonthGrid />
    </div>
  )
}

