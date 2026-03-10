'use client'

import { useAlerts, type Alert } from '@/context/AlertsContext'
import { useState } from 'react'

type AlertFilter = 'pending' | 'completed' | 'all'

type AlertsDropdownProps = {
  onOpenPatient?: (patientId: string) => void
}

const formatDateLabel = (dueDate: string, dueTime: string | null): string => {
  const [year, month, day] = dueDate.split('-').map(Number)
  if (!year || !month || !day) return dueDate
  const date = new Date(year, month - 1, day)
  const dateLabel = date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
  if (!dueTime) return dateLabel
  return `${dateLabel} · ${dueTime.slice(0, 5)}`
}

const getTodayIso = () => {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function AlertGroup({
  title,
  alerts,
  onToggleComplete,
  onOpenPatient
}: {
  title: string
  alerts: Alert[]
  onToggleComplete: (id: number, nextValue: boolean) => Promise<void>
  onOpenPatient?: (patientId: string) => void
}) {
  if (alerts.length === 0) return null

  return (
    <section className='space-y-1'>
      <p className='px-3 pt-2 text-label-sm uppercase tracking-wide text-[var(--color-neutral-500)]'>
        {title}
      </p>
      <div className='space-y-1'>
        {alerts.map((alert) => (
          <article
            key={alert.id}
            className='mx-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-neutral-0)] p-3'
          >
            <div className='flex items-start gap-2'>
              <input
                type='checkbox'
                className='mt-0.5 h-4 w-4 accent-[var(--color-brand-600)]'
                checked={alert.completed}
                onChange={(event) => {
                  void onToggleComplete(alert.id, event.target.checked)
                }}
                aria-label={`Marcar alerta ${alert.title} como completada`}
              />
              <div className='min-w-0 flex-1'>
                <p
                  className={[
                    'truncate text-body-md text-[var(--color-neutral-900)]',
                    alert.completed ? 'line-through opacity-60' : ''
                  ].join(' ')}
                >
                  {alert.title}
                </p>
                <p className='mt-0.5 text-label-sm text-[var(--color-neutral-500)]'>
                  {formatDateLabel(alert.dueDate, alert.dueTime)}
                </p>
                {alert.patientId && alert.patientName && (
                  <button
                    type='button'
                    className='mt-1 text-left text-label-sm text-[var(--color-brand-700)] hover:underline'
                    onClick={() => onOpenPatient?.(alert.patientId)}
                  >
                    {alert.patientName}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function AlertsDropdown({ onOpenPatient }: AlertsDropdownProps) {
  const { alerts, isLoading, toggleComplete } = useAlerts()
  const [filter, setFilter] = useState<AlertFilter>('pending')
  const today = getTodayIso()

  const visibleAlerts = alerts.filter((alert) => {
    if (filter === 'pending') return !alert.completed
    if (filter === 'completed') return alert.completed
    return true
  })

  const overdue = visibleAlerts.filter(
    (alert) => !alert.completed && alert.dueDate < today
  )
  const todayAlerts = visibleAlerts.filter(
    (alert) => !alert.completed && alert.dueDate === today
  )
  const upcoming = visibleAlerts.filter(
    (alert) => !alert.completed && alert.dueDate > today
  )
  const completed = visibleAlerts.filter((alert) => alert.completed)

  return (
    <div className='absolute right-0 top-[calc(100%+0.5rem)] z-[9999] w-[min(22rem,92vw)] overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-white shadow-xl'>
      <header className='border-b border-[var(--color-border-default)] px-3 py-2.5'>
        <div className='flex items-center justify-between'>
          <h3 className='text-title-sm text-[var(--color-neutral-900)]'>Alertas</h3>
          <div className='flex items-center gap-1'>
            {(['pending', 'completed', 'all'] as AlertFilter[]).map((value) => (
              <button
                key={value}
                type='button'
                onClick={() => setFilter(value)}
                className={[
                  'rounded-lg px-2 py-1 text-label-sm capitalize',
                  filter === value
                    ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]'
                    : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]'
                ].join(' ')}
              >
                {value === 'pending'
                  ? 'Pendientes'
                  : value === 'completed'
                    ? 'Completadas'
                    : 'Todas'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className='max-h-[28rem] overflow-y-auto py-2'>
        {isLoading ? (
          <p className='px-3 py-6 text-center text-body-md text-[var(--color-neutral-500)]'>
            Cargando alertas...
          </p>
        ) : visibleAlerts.length === 0 ? (
          <p className='px-3 py-6 text-center text-body-md text-[var(--color-neutral-500)]'>
            No hay alertas para este filtro.
          </p>
        ) : (
          <div className='space-y-2 pb-2'>
            <AlertGroup
              title='Vencidas'
              alerts={overdue}
              onToggleComplete={toggleComplete}
              onOpenPatient={onOpenPatient}
            />
            <AlertGroup
              title='Hoy'
              alerts={todayAlerts}
              onToggleComplete={toggleComplete}
              onOpenPatient={onOpenPatient}
            />
            <AlertGroup
              title='Próximas'
              alerts={upcoming}
              onToggleComplete={toggleComplete}
              onOpenPatient={onOpenPatient}
            />
            <AlertGroup
              title='Completadas'
              alerts={completed}
              onToggleComplete={toggleComplete}
              onOpenPatient={onOpenPatient}
            />
          </div>
        )}
      </div>
    </div>
  )
}
