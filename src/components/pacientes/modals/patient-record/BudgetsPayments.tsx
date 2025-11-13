import React from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import FilterListRounded from '@mui/icons-material/FilterListRounded'
import FirstPageRounded from '@mui/icons-material/FirstPageRounded'
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded'
import LastPageRounded from '@mui/icons-material/LastPageRounded'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type BudgetsPaymentsProps = {
  onClose?: () => void
  patientId?: string
}

type InvoiceRow = {
  id: string
  invoiceNumber: string
  total: number
  amountPaid: number
  status: string
  issueDate: string
}

const currency = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
    n || 0
  )

export default function BudgetsPayments({
  onClose,
  patientId
}: BudgetsPaymentsProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
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
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([])
  const [payments, setPayments] = React.useState<
    { id: string; amount: number; sent: string; invoiceId: string }[]
  >([])
  const [saldoPendiente, setSaldoPendiente] = React.useState<number>(0)
  const [facturasVencidas, setFacturasVencidas] = React.useState<number>(0)

  // Load invoices and payments for the patient
  React.useEffect(() => {
    async function loadAll() {
      if (!patientId) return
      const { data: invs } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, amount_paid, status, issue_date')
        .eq('patient_id', patientId)
        .order('issue_date', { ascending: false })
        .limit(50)
      const rows: InvoiceRow[] =
        (invs ?? []).map((r: any) => ({
          id: String(r.id),
          invoiceNumber: r.invoice_number,
          total: Number(r.total_amount ?? 0),
          amountPaid: Number(r.amount_paid ?? 0),
          status: r.status,
          issueDate: new Date(r.issue_date).toLocaleDateString()
        })) ?? []
      setInvoices(rows)
      const saldo = rows.reduce((acc, r) => acc + (r.total - r.amountPaid), 0)
      setSaldoPendiente(saldo)
      setFacturasVencidas(rows.filter((r) => r.status === 'overdue').length)

      const invoiceIds = rows.map((r) => Number(r.id)).filter((n) => !isNaN(n))
      if (invoiceIds.length > 0) {
        const { data: pays } = await supabase
          .from('payments')
          .select('id, amount, transaction_date, invoice_id')
          .in('invoice_id', invoiceIds)
          .order('transaction_date', { ascending: false })
          .limit(100)
        setPayments(
          (pays ?? []).map((p: any) => ({
            id: String(p.id),
            amount: Number(p.amount ?? 0),
            sent: new Date(p.transaction_date).toLocaleDateString(),
            invoiceId: String(p.invoice_id)
          }))
        )
      } else {
        setPayments([])
      }
    }
    void loadAll()
  }, [patientId, supabase])
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
        <p className='text-[32px] leading-[40px] text-neutral-900 mt-1'>{currency(saldoPendiente)}</p>
      </div>
      <div className='absolute left-[18.75%] top-[10.25rem] ml-[67.75px]'>
        <p className='text-title-sm text-neutral-900'>Facturas vencidas</p>
        <p className='text-[32px] leading-[40px] text-warning-600 mt-1'>{String(facturasVencidas).padStart(2, '0')}</p>
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
                <div className='px-2 py-1'>Factura</div>
                <div className='px-2 py-1'>Importe</div>
                <div className='px-2 py-1'>Pagado</div>
                <div className='px-2 py-1'>Estado</div>
                <div className='px-2 py-1'>Fecha</div>
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
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-[#F8FAFB] active-border-[#1E4947]',
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
                'px-2 py-1 rounded-[32px] text-body-sm border cursor-pointer transition-colors hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active-bg-[#1E4947] active:text-[#F8FAFB] active:border-[#1E4947]',
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
              {invoices.map((row) => (
                <div
                  key={row.id}
                  className='grid items-center border-b border-neutral-300'
                  style={{ gridTemplateColumns: 'var(--budgets-grid-cols)', height: 'var(--height-row-md)' }}
                >
                  <div className='px-2 text-body-md text-neutral-900'>{row.id}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.invoiceNumber}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{currency(row.total)}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{currency(row.amountPaid)}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.status}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{row.issueDate}</div>
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
                <div className='px-2 py-1'>Importe</div>
                <div className='px-2 py-1'>Factura</div>
                <div className='px-2 py-1'>Fecha</div>
                <div className='px-2 py-1'>—</div>
              </div>
              {payments.map((p) => (
                <div
                  key={p.id}
                  className='grid items-center border-b border-neutral-300'
                  style={{ gridTemplateColumns: 'var(--payments-grid-cols)', height: 'var(--height-row-md)' }}
                >
                  <div className='px-2 text-body-md text-neutral-900'>{p.id}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{currency(p.amount)}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{p.invoiceId}</div>
                  <div className='px-2 text-body-md text-neutral-900'>{p.sent}</div>
                  <div className='px-2 text-body-md text-neutral-900'>—</div>
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


