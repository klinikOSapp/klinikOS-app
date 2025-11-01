import React from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import FirstPageRounded from '@mui/icons-material/FirstPageRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import LastPageRounded from '@mui/icons-material/LastPageRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'

type BudgetsPaymentsProps = {
  onClose?: () => void
}

type BudgetRow = {
  id: string
  description: string
  amount: string
  status: 'Aceptado' | 'Enviado'
  payment: 'Completado' | 'Financiado'
  insurer: string
}

const MOCK_ROWS: BudgetRow[] = [
  {
    id: 'PR-001',
    description: 'Operación mandíbula',
    amount: '2.300 €',
    status: 'Aceptado',
    payment: 'Completado',
    insurer: 'Adeslas'
  },
  {
    id: 'PR-002',
    description: 'Consulta inicial',
    amount: '150 €',
    status: 'Aceptado',
    payment: 'Financiado',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-003',
    description: 'Radiografía',
    amount: '100 €',
    status: 'Enviado',
    payment: 'Completado',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-004',
    description: 'Extracción de muela',
    amount: '500 €',
    status: 'Aceptado',
    payment: 'Completado',
    insurer: 'DKV'
  },
  {
    id: 'PR-005',
    description: 'Implante dental',
    amount: '1.200 €',
    status: 'Aceptado',
    payment: 'Completado',
    insurer: 'Adelas'
  },
  {
    id: 'PR-006',
    description: 'Férula de descarga',
    amount: '300 €',
    status: 'Enviado',
    payment: 'Financiado',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-007',
    description: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    status: 'Aceptado',
    payment: 'Completado',
    insurer: 'DKV'
  },
  {
    id: 'PR-008',
    description: 'Consulta de seguimiento',
    amount: '100 €',
    status: 'Enviado',
    payment: 'Completado',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-009',
    description: 'Blanqueamiento dental',
    amount: '400 €',
    status: 'Enviado',
    payment: 'Financiado',
    insurer: 'Sanitas'
  }
]

function StatusBadge({
  status
}: {
  status: BudgetRow['status']
}) {
  const isAccepted = status === 'Aceptado'
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-pill px-2 py-1 text-label-sm',
        isAccepted
          ? 'border border-brand-500 text-brand-500'
          : 'border border-warning-200 text-warning-200'
      ].join(' ')}
    >
      {status}
    </span>
  )
}

export default function BudgetsPayments({ onClose }: BudgetsPaymentsProps) {
  const [subTab, setSubTab] = React.useState<'Presupuestos' | 'Pagos'>(
    'Presupuestos'
  )
  type FilterKey = 'deuda' | 'activos' | 'recall'
  const [selectedFilters, setSelectedFilters] = React.useState<FilterKey[]>([])
  const isFilterActive = (key: FilterKey) => selectedFilters.includes(key)
  const toggleFilter = (key: FilterKey) => {
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }
  const clearFilters = () => setSelectedFilters([])
  return (
    <div className='relative w-[74.75rem] h-[56.25rem] bg-neutral-50' data-node-id='997:3320'>
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-6 top-4 right-4 text-neutral-900'
      >
        <CloseRounded className='size-6' />
      </button>

      {/* Header */}
      <div className='absolute left-8 top-10 w-[35.5rem]'>
        <p className='text-title-lg text-neutral-900'>Presupuestos y pagos</p>
        <p className='text-body-sm text-neutral-900 mt-2'>
          Consulta y gestión de pagos y facturas, añadir nueva facturación, descargar facturas y enviar recordatorios al paciente.
        </p>
      </div>

      {/* KPIs */}
      <div className='absolute left-8 top-[10.25rem]'>
        <p className='text-title-sm text-neutral-900'>Saldo pendiente</p>
        <p className='text-[32px] leading-[40px] text-neutral-900 mt-1'>702.60 €</p>
      </div>
      <div className='absolute left-[18.75%] top-[10.25rem] ml-[67.75px]'>
        <p className='text-title-sm text-neutral-900'>Facturas vencidas</p>
        <p className='text-[32px] leading-[40px] text-warning-600 mt-1'>01</p>
      </div>

      {/* Card */}
      <div className='absolute left-8 top-[17.4375rem] w-[70.25rem] h-[36.3125rem] bg-white rounded-xl border border-neutral-200'>
        <div className='relative w-full h-full rounded-inherit'>
          {/* Tabs inside card header */}
          <div className='absolute left-[33px] top-[16px] flex items-center gap-6 h-[40px]'>
            <button
              className={[
                'h-[40px] px-2 flex items-center text-title-sm',
                subTab === 'Presupuestos'
                  ? 'border-b border-[var(--color-brand-500)] text-[var(--color-neutral-900)]'
                  : 'text-[var(--color-neutral-600)]'
              ].join(' ')}
              onClick={() => setSubTab('Presupuestos')}
            >
              Presupuestos
            </button>
            <button
              className={[
                'h-[40px] px-2 flex items-center text-title-sm',
                subTab === 'Pagos'
                  ? 'border-b border-[var(--color-brand-500)] text-[var(--color-neutral-900)]'
                  : 'text-[var(--color-neutral-600)]'
              ].join(' ')}
              onClick={() => setSubTab('Pagos')}
            >
              Pagos
            </button>
          </div>
          {/* Create button */}
          <button className='absolute top-4 right-4 flex items-center gap-2 rounded-[136px] px-4 py-2 text-body-md text-[var(--color-neutral-900)] bg-[#F8FAFB] border border-[#CBD3D9] hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947] transition-colors cursor-pointer'>
            <AddRounded className='size-5' />
            <span className='font-medium'>Crear presupuesto</span>
          </button>

          {subTab === 'Presupuestos' && (
            <div className='absolute left-[33px] right-[32px] top-[7.5rem]'>
              <div
                className='grid border-b border-neutral-300 text-body-md text-neutral-700'
                style={{ gridTemplateColumns: 'var(--budgets-grid-cols)' }}
              >
                <div className='px-2 py-1'>ID</div>
                <div className='px-2 py-1'>Descripción</div>
                <div className='px-2 py-1'>Monto</div>
                <div className='px-2 py-1'>Estado</div>
                <div className='px-2 py-1'>Pago</div>
                <div className='px-2 py-1'>Aseguradora</div>
              </div>
            </div>
          )}

          {/* Search + Filters */}
          <div className='absolute top-[4.5rem] right-8 inline-flex items-center gap-2'>
            <div className='flex items-center gap-2 border-b border-[var(--color-neutral-900)] px-2 py-1'>
              <SearchRounded className='text-[var(--color-neutral-900)]' />
              <input
                placeholder='Buscar por nombre, email, teléfono,...'
                className='bg-transparent outline-none text-body-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-900)]'
              />
            </div>
            <button
              onClick={clearFilters}
              className={[
                'flex items-center gap-2 px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                selectedFilters.length === 0
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              <FilterListRounded className='size-4' />
              <span>Todos</span>
            </button>
            <button
              onClick={() => toggleFilter('deuda')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('deuda')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              En deuda
            </button>
            <button
              onClick={() => toggleFilter('activos')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('activos')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Activos
            </button>
            <button
              onClick={() => toggleFilter('recall')}
              className={[
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
                isFilterActive('recall')
                  ? 'bg-[#1E4947] border-[#1E4947] text-[#F8FAFB]'
                  : 'border-[var(--color-neutral-700)] text-[var(--color-neutral-700)]'
              ].join(' ')}
            >
              Recall
            </button>
          </div>

          {subTab === 'Presupuestos' ? (
            <div className='absolute left-[33px] right-[32px] top-[9.5rem] bottom-[3rem] overflow-y-auto'>
              {MOCK_ROWS.map((row) => (
                <div
                  key={row.id}
                  className='grid items-center border-b border-neutral-300'
                  style={{ gridTemplateColumns: 'var(--budgets-grid-cols)', height: 'var(--height-row-md)' }}
                >
                  <div className='px-2 text-body-md text-neutral-900'>{row.id}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.description}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.amount}</div>
                  <div className='px-2'><StatusBadge status={row.status} /></div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.payment}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.insurer}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className='absolute left-[33px] right-[32px] top-[7.5rem] bottom-[3rem] overflow-y-auto'>
              <div
                className='grid border-b border-neutral-300 text-body-md text-neutral-700'
                style={{ gridTemplateColumns: 'var(--payments-grid-cols)' }}
              >
                <div className='px-2 py-1'>ID</div>
                <div className='px-2 py-1'>Descripción</div>
                <div className='px-2 py-1'>Monto</div>
                <div className='px-2 py-1'>Factura</div>
                <div className='px-2 py-1'>Enviada</div>
                <div className='px-2 py-1'>Aseguradora</div>
              </div>
              {[
                {
                  id: 'P-001',
                  desc: 'Operación mandíbula',
                  amount: '2.300 €',
                  invoice: 'Generada',
                  sent: '24/11/2024',
                  insurer: 'Adeslas'
                },
                {
                  id: 'P-002',
                  desc: 'Consulta inicial',
                  amount: '150 €',
                  invoice: 'Generada',
                  sent: '16/10/2024',
                  insurer: 'Sanitas'
                },
                {
                  id: 'P-003',
                  desc: 'Radiografía',
                  amount: '100 €',
                  invoice: 'Pendiente',
                  sent: '12/10/2024',
                  insurer: 'Sanitas'
                },
                {
                  id: 'P-004',
                  desc: 'Extracción de muela',
                  amount: '500 €',
                  invoice: 'Pendiente',
                  sent: 'No enviada',
                  insurer: 'DKV'
                }
              ].map((p) => (
                <div
                  key={p.id}
                  className='grid items-center border-b border-neutral-300'
                  style={{ gridTemplateColumns: 'var(--payments-grid-cols)', height: 'var(--height-row-md)' }}
                >
                  <div className='px-2 text-body-md text-neutral-900'>{p.id}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{p.desc}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{p.amount}</div>
                  <div className={['px-2 text-body-md', p.invoice === 'Pendiente' ? 'text-warning-600' : 'text-neutral-900'].join(' ')}>
                    {p.invoice}
                  </div>
                  <div className={['px-2 text-body-md', p.sent === 'No enviada' ? 'text-neutral-600' : 'text-neutral-900'].join(' ')}>
                    {p.sent}
                  </div>
                  <div className='px-2 text-body-md text-neutral-900'>{p.insurer}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className='absolute bottom-2 right-8 inline-flex items-center gap-6 text-neutral-900'>
            <div className='inline-flex items-center gap-2'>
              <FirstPageRounded className='size-6' />
              <ChevronLeftRounded className='size-6' />
            </div>
            <div className='inline-flex items-center gap-2 text-body-sm'>
              <span className='underline font-bold'>1</span>
              <span>2</span>
              <span>...</span>
              <span>12</span>
            </div>
            <div className='inline-flex items-center gap-2'>
              <ChevronRightRounded className='size-6' />
              <LastPageRounded className='size-6' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


