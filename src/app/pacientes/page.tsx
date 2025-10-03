'use client'

import React from 'react'
import AccountCircleRounded from '@mui/icons-material/AccountCircleRounded'
import { useRouter } from 'next/navigation'
import PatientFichaModal from '@/components/pacientes/PatientFichaModal'

function KpiCard({
  title,
  value,
  badge
}: {
  title: string
  value: string
  badge?: React.ReactNode
}) {
  return (
    <div className='bg-white rounded-[8px] px-4 py-2 h-[128px] flex flex-col justify-between shadow-[1px_1px_2px_0_rgba(0,0,0,0.05)] border border-[var(--color-neutral-200)]'>
      <p className='text-[18px] leading-[28px] font-medium text-[var(--color-neutral-600)]'>
        {title}
      </p>
      <div className='flex items-baseline justify-between'>
        <p className='text-[52px] leading-[60px] text-[var(--color-neutral-900)] font-medium'>
          {value}
        </p>
        {badge}
      </div>
    </div>
  )
}

function Chip({
  children,
  color = 'teal',
  rounded = 'lg'
}: {
  children: React.ReactNode
  color?: 'teal' | 'sky' | 'green' | 'gray'
  rounded?: 'lg' | 'full'
}) {
  const styles = {
    teal: 'bg-[var(--color-brand-0)] text-[var(--color-brand-700)] border border-[var(--color-brand-200)]',
    sky: 'bg-sky-100 text-sky-800',
    green: 'bg-[var(--color-success-200)] text-[var(--color-success-800)]',
    gray: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]'
  }[color]
  const radius = rounded === 'full' ? 'rounded-[80px]' : 'rounded-[4px]'
  return (
    <span
      className={[
        'px-2 py-0.5 text-[14px] leading-[20px]',
        styles,
        radius
      ].join(' ')}
    >
      {children}
    </span>
  )
}

function StatusPill({ type }: { type: 'Activo' | 'Hecho' }) {
  if (type === 'Activo') {
    return (
      <span className='inline-flex items-center'>
        <Chip color='sky'>Activo</Chip>
      </span>
    )
  }
  return (
    <span className='inline-flex items-center'>
      <Chip color='green' rounded='full'>
        Hecho
      </Chip>
    </span>
  )
}

function TableHeaderCell({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={[
        'text-[16px] leading-[24px] font-normal text-[var(--color-neutral-600)] text-left',
        className
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function Row() {
  const router = useRouter()
  return (
    <tr
      className='cursor-pointer hover:bg-[var(--color-neutral-50)]'
      onClick={() => router.push('/pacientes/ficha')}
    >
      <td className='py-2 pr-2 w-[240px]'>
        <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
          Laura Rivas
        </p>
      </td>
      <td className='py-2 pr-2 w-[191px]'>
        <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
      <td className='py-2 pr-2 w-[154px]'>
        <StatusPill type='Activo' />
      </td>
      <td className='py-2 pr-2 w-[196px]'>
        <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
          888 888 888
        </p>
      </td>
      <td className='py-2 pr-2 w-[151px]'>
        <StatusPill type='Hecho' />
      </td>
      <td className='py-2 pr-2 w-[120px]'>
        <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
          No
        </p>
      </td>
      <td className='py-2 pr-2 w-[120px]'>
        <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
          380€
        </p>
      </td>
      <td className='py-2 pr-2 w-[204px]'>
        <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
          DD/MM/AAAA
        </p>
      </td>
    </tr>
  )
}

type PatientRow = {
  id: string
  name: string
  nextDate: string
  status: 'Activo' | 'Hecho'
  phone: string
  checkin: 'Hecho' | 'Pendiente'
  financing: 'Sí' | 'No'
  debt: string
  lastContact: string
  tags?: Array<'deuda' | 'activo' | 'recall'>
}

const MOCK_PATIENTS: PatientRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `p-${i}`,
  name: 'Laura Rivas',
  nextDate: 'DD/MM/AAAA',
  status: 'Activo',
  phone: '888 888 888',
  checkin: 'Hecho',
  financing: 'No',
  debt: '380€',
  lastContact: 'DD/MM/AAAA',
  tags: i % 3 === 0 ? ['deuda'] : i % 2 === 0 ? ['activo'] : ['recall']
}))

export default function PacientesPage() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeFilter, setActiveFilter] = React.useState<
    'todos' | 'deuda' | 'activos' | 'recall'
  >('todos')

  return (
    <div className='bg-[var(--color-neutral-50)] rounded-tl-[var(--radius-xl)] min-h-[calc(100dvh-var(--spacing-topbar))] p-12'>
      <PatientFichaModal open={open} onClose={() => setOpen(false)} />
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h1 className='text-[28px] leading-[36px] text-[var(--color-neutral-900)]'>
            Pacientes
          </h1>
          <Chip color='teal' rounded='full'>
            Recepción
          </Chip>
        </div>
        <div className='flex items-center gap-3'>
          <button
            className='flex items-center gap-2 bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded-[136px] px-4 py-2 text-[16px] leading-[24px] text-[var(--color-neutral-900)]'
            onClick={() => setOpen(true)}
          >
            <span className='text-[20px] leading-[20px]'>＋</span>
            <span>Añadir paciente</span>
          </button>
          <button
            className='size-6 grid place-items-center text-[var(--color-neutral-900)]'
            aria-label='Más opciones'
          >
            ⋮
          </button>
        </div>
      </div>
      <p className='text-[14px] leading-[20px] text-[var(--color-neutral-900)] mt-2 max-w-[680px]'>
        Busca y filtra pacientes; confirma asistencias, reprograma citas y envía
        pre-registro, firmas y recordatorios al instante.
      </p>

      <div className='grid grid-cols-4 gap-6 mt-8'>
        <KpiCard
          title='Pacientes hoy'
          value='2'
          badge={
            <span className='text-[16px] leading-[24px] text-[var(--color-success-600)]'>
              24%
            </span>
          }
        />
        <KpiCard
          title='Pacientes semana'
          value='16'
          badge={
            <span className='text-[16px] leading-[24px] text-[var(--color-success-600)]'>
              8%
            </span>
          }
        />
        <KpiCard
          title='Pacientes recibidos'
          value='4/16'
          badge={
            <span className='text-[16px] leading-[24px] text-[#d97706]'>
              25%
            </span>
          }
        />
        <KpiCard
          title='Citas confirmadas'
          value='12/16'
          badge={
            <span className='text-[16px] leading-[24px] text-[var(--color-success-600)]'>
              75%
            </span>
          }
        />
      </div>

      <div className='mt-8 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Chip color='teal'>3 selected</Chip>
          <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-[14px] leading-[20px] text-[var(--color-neutral-700)]'>
            Estado
          </button>
          <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] px-2 py-1 text-[14px] leading-[20px] text-[var(--color-neutral-700)]'>
            Check-in
          </button>
          <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center'>
            🗑️
          </button>
          <button className='bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] p-1 size-[32px] inline-flex items-center justify-center'>
            ⋯
          </button>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
            <span className='text-[var(--color-neutral-900)]'>🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Buscar por nombre, email, teléfono,...'
              className='bg-transparent outline-none text-[14px] leading-[20px] text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-900)]'
            />
          </div>
          <button
            onClick={() => setActiveFilter('todos')}
            className={[
              'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border',
              activeFilter === 'todos'
                ? 'border-[var(--color-neutral-900)] text-[var(--color-neutral-900)]'
                : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
            ].join(' ')}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter('deuda')}
            className={[
              'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border',
              activeFilter === 'deuda'
                ? 'border-[var(--color-neutral-900)] text-[var(--color-neutral-900)]'
                : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
            ].join(' ')}
          >
            En deuda
          </button>
          <button
            onClick={() => setActiveFilter('activos')}
            className={[
              'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border',
              activeFilter === 'activos'
                ? 'border-[var(--color-neutral-900)] text-[var(--color-neutral-900)]'
                : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
            ].join(' ')}
          >
            Activos
          </button>
          <button
            onClick={() => setActiveFilter('recall')}
            className={[
              'px-2 py-1 rounded-[32px] text-[14px] leading-[20px] border',
              activeFilter === 'recall'
                ? 'border-[var(--color-neutral-900)] text-[var(--color-neutral-900)]'
                : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
            ].join(' ')}
          >
            Recall
          </button>
        </div>
      </div>

      <div className='mt-6 rounded-[8px] overflow-hidden'>
        <table className='w-full table-fixed'>
          <thead>
            <tr>
              <TableHeaderCell className='py-2 pr-2 w-[240px]'>
                <div className='flex items-center gap-2'>
                  <AccountCircleRounded className='size-4 text-[var(--color-neutral-700)]' />
                  <span>Paciente</span>
                </div>
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[191px]'>
                Próxima cita
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[154px]'>
                Estado
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[196px]'>
                Teléfono
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[151px]'>
                Check-in
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[120px]'>
                Financiación
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[120px]'>
                Deuda
              </TableHeaderCell>
              <TableHeaderCell className='py-2 pr-2 w-[204px]'>
                Último contacto
              </TableHeaderCell>
            </tr>
          </thead>
          <tbody>
            {MOCK_PATIENTS.filter((p) => {
              const q = query.trim().toLowerCase()
              const matchesQuery = q
                ? p.name.toLowerCase().includes(q) ||
                  p.phone.toLowerCase().includes(q)
                : true
              const matchesFilter =
                activeFilter === 'todos'
                  ? true
                  : activeFilter === 'deuda'
                  ? p.tags?.includes('deuda')
                  : activeFilter === 'activos'
                  ? p.tags?.includes('activo')
                  : p.tags?.includes('recall')
              return Boolean(matchesQuery && matchesFilter)
            }).map((row, i) => (
              <tr
                key={row.id}
                className='cursor-pointer hover:bg-[var(--color-neutral-50)]'
                onClick={() => setOpen(true)}
              >
                <td className='py-2 pr-2 w-[240px]'>
                  <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
                    {row.name}
                  </p>
                </td>
                <td className='py-2 pr-2 w-[191px]'>
                  <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
                    {row.nextDate}
                  </p>
                </td>
                <td className='py-2 pr-2 w-[154px]'>
                  <StatusPill type={row.status} />
                </td>
                <td className='py-2 pr-2 w-[196px]'>
                  <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
                    {row.phone}
                  </p>
                </td>
                <td className='py-2 pr-2 w-[151px]'>
                  <span className='inline-flex items-center'>
                    <Chip color='green' rounded='full'>
                      {row.checkin}
                    </Chip>
                  </span>
                </td>
                <td className='py-2 pr-2 w-[120px]'>
                  <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
                    {row.financing}
                  </p>
                </td>
                <td className='py-2 pr-2 w-[120px]'>
                  <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
                    {row.debt}
                  </p>
                </td>
                <td className='py-2 pr-2 w-[204px]'>
                  <p className='text-[16px] leading-[24px] text-[var(--color-neutral-900)]'>
                    {row.lastContact}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex items-center justify-end gap-3 text-[14px] text-[var(--color-neutral-900)]'>
        <button className='size-6 inline-flex items-center justify-center'>
          «
        </button>
        <button className='size-6 inline-flex items-center justify-center'>
          ‹
        </button>
        <span className='underline'>1</span>
        <span>2</span>
        <span>…</span>
        <span>12</span>
        <button className='size-6 inline-flex items-center justify-center'>
          ›
        </button>
        <button className='size-6 inline-flex items-center justify-center'>
          »
        </button>
      </div>
    </div>
  )
}
