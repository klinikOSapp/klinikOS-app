'use client'

const TIME_LABELS = [
  '9:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00'
]

const BOX_HEADERS = [
  { label: 'BOX 1', tone: 'neutral' as const },
  { label: 'BOX 2', tone: 'neutral' as const },
  { label: 'BOX 3', tone: 'neutral' as const }
]

type DayEvent = {
  id: string
  label: string
  top: string
  bgColor: string
}

type BoxColumn = {
  id: string
  events: DayEvent[]
}

type TimeSlot = {
  time: string
  boxes: BoxColumn[]
}

// Datos de ejemplo basados en Figma
const TIME_SLOTS: TimeSlot[] = [
  {
    time: '9:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e1',
            label: '13:00 Consulta médica',
            top: '3.9375rem', // 63px
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '10:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e2',
            label: '13:00 Consulta médica',
            top: '3.96469rem', // 63.43px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '11:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e3',
            label: '13:00 Consulta médica',
            top: '1.11625rem', // 17.86px
            bgColor: 'var(--color-event-coral)'
          },
          {
            id: 'e4',
            label: '13:00 Consulta médica',
            top: '3.92875rem', // 62.86px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e5',
            label: '13:00 Consulta médica',
            top: '3.92875rem', // 62.86px
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      {
        id: 'box3',
        events: [
          {
            id: 'e6',
            label: '13:00 Consulta médica',
            top: '1.11625rem', // 17.86px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      }
    ]
  },
  {
    time: '12:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e7',
            label: '13:00 Consulta médica',
            top: '3.95563rem', // 63.29px
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '13:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e8',
            label: '13:00 Consulta médica',
            top: '3.91938rem', // 62.71px
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e9',
            label: '13:00 Consulta médica',
            top: '3.91938rem', // 62.71px
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '14:00',
    boxes: [
      { id: 'box1', events: [] },
      { id: 'box2', events: [] },
      {
        id: 'box3',
        events: [
          {
            id: 'e10',
            label: '13:00 Consulta médica',
            top: '1.13375rem', // 18.14px
            bgColor: 'var(--color-event-purple)'
          }
        ]
      }
    ]
  },
  {
    time: '15:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e11',
            label: '15:00 Revisión ortodoncia',
            top: '2.5rem',
            bgColor: 'var(--color-brand-0)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e12',
            label: '15:30 Limpieza dental',
            top: '4.5rem',
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '16:00',
    boxes: [
      { id: 'box1', events: [] },
      {
        id: 'box2',
        events: [
          {
            id: 'e13',
            label: '16:00 Consulta médica',
            top: '1.5rem',
            bgColor: 'var(--color-event-teal)'
          }
        ]
      },
      {
        id: 'box3',
        events: [
          {
            id: 'e14',
            label: '16:15 Extracción',
            top: '2.8rem',
            bgColor: 'var(--color-event-coral)'
          }
        ]
      }
    ]
  },
  {
    time: '17:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e15',
            label: '17:00 Consulta médica',
            top: '1.2rem',
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      { id: 'box2', events: [] },
      {
        id: 'box3',
        events: [
          {
            id: 'e16',
            label: '17:30 Revisión',
            top: '4.8rem',
            bgColor: 'var(--color-brand-0)'
          }
        ]
      }
    ]
  },
  {
    time: '18:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e17',
            label: '18:00 Limpieza dental',
            top: '1.8rem',
            bgColor: 'var(--color-event-teal)'
          }
        ]
      },
      {
        id: 'box2',
        events: [
          {
            id: 'e18',
            label: '18:15 Consulta médica',
            top: '3.2rem',
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box3', events: [] }
    ]
  },
  {
    time: '19:00',
    boxes: [
      { id: 'box1', events: [] },
      {
        id: 'box2',
        events: [
          {
            id: 'e19',
            label: '19:00 Revisión ortodoncia',
            top: '2rem',
            bgColor: 'var(--color-event-purple)'
          }
        ]
      },
      {
        id: 'box3',
        events: [
          {
            id: 'e20',
            label: '19:30 Consulta médica',
            top: '5rem',
            bgColor: 'var(--color-brand-0)'
          }
        ]
      }
    ]
  },
  {
    time: '20:00',
    boxes: [
      {
        id: 'box1',
        events: [
          {
            id: 'e21',
            label: '20:00 Última consulta',
            top: '1.5rem',
            bgColor: 'var(--color-event-coral)'
          }
        ]
      },
      { id: 'box2', events: [] },
      { id: 'box3', events: [] }
    ]
  }
]

function TimeColumn() {
  return (
    <div
      className='absolute left-0 flex flex-col bg-[var(--color-neutral-100)]'
      style={{
        top: 'var(--scheduler-day-header-height)',
        width: 'var(--day-time-column-width)',
        height: 'calc(100% - var(--scheduler-day-header-height))'
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

function BoxHeaders() {
  return (
    <div
      className='absolute left-0 flex w-full border-b border-[var(--color-border-default)] bg-[var(--color-neutral-50)]'
      style={{
        top: 0,
        height: 'var(--scheduler-day-header-height)'
      }}
    >
      {BOX_HEADERS.map((box, index) => (
        <div
          key={index}
          className={[
            'flex flex-1 items-center justify-center p-2',
            index === 0 ? 'pl-[var(--day-time-column-width)]' : ''
          ].join(' ')}
        >
          <p
            className={[
              'text-body-md text-center',
              box.tone === 'neutral'
                ? 'font-normal text-[var(--color-neutral-600)]'
                : 'font-normal text-[var(--color-neutral-900)]'
            ].join(' ')}
          >
            {box.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function DayEvent({ event }: { event: DayEvent }) {
  return (
    <div
      className='flex items-center justify-center rounded-[var(--day-event-radius)] p-[var(--day-event-padding)] text-body-sm font-normal text-[var(--color-neutral-900)]'
      style={{
        position: 'absolute',
        top: event.top,
        left: 'var(--day-event-left)',
        width: 'var(--day-event-width)',
        height: 'var(--day-event-height)',
        backgroundColor: event.bgColor
      }}
    >
      <p className='truncate text-center'>{event.label}</p>
    </div>
  )
}

function BoxColumn({ column }: { column: BoxColumn }) {
  return (
    <div className='relative flex-1 overflow-hidden border-b border-r border-[var(--color-border-default)] bg-[var(--color-neutral-0)]'>
      {column.events.map((event) => (
        <DayEvent key={event.id} event={event} />
      ))}
    </div>
  )
}

function TimeSlotRow({ slot }: { slot: TimeSlot }) {
  return (
    <div className='flex flex-1'>
      {slot.boxes.map((box) => (
        <BoxColumn key={box.id} column={box} />
      ))}
    </div>
  )
}

function DayGrid() {
  return (
    <div
      className='absolute flex w-full flex-col'
      style={{
        left: 'var(--day-time-column-width)',
        top: 'var(--scheduler-day-header-height)',
        width: 'calc(100% - var(--day-time-column-width))',
        height: 'calc(100% - var(--scheduler-day-header-height))'
      }}
    >
      {TIME_SLOTS.map((slot, index) => (
        <TimeSlotRow key={index} slot={slot} />
      ))}
    </div>
  )
}

export default function DayCalendar() {
  // Calcular altura total: 12 slots × 124.57px = 1494.84px → 93.4275rem
  const totalHeight = `calc(${TIME_LABELS.length} * var(--scheduler-slot-height) + var(--scheduler-day-header-height))`

  return (
    <div className='relative w-full' style={{ height: totalHeight }}>
      <BoxHeaders />
      <TimeColumn />
      <DayGrid />
    </div>
  )
}

