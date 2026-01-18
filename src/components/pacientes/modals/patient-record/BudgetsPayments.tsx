/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  AddRounded,
  AttachEmailRounded,
  BarChartRounded,
  CalendarMonthRounded,
  CancelRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CloseRounded,
  DeleteRounded,
  DescriptionRounded,
  DownloadRounded,
  EditRounded,
  ElectricBoltRounded,
  EuroRounded,
  FilterListRounded,
  FirstPageRounded,
  KeyboardArrowDownRounded,
  LastPageRounded,
  MoreVertRounded,
  ReceiptLongRounded,
  SearchRounded,
  TimelineRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import React from 'react'
import { createPortal } from 'react-dom'
import AddProductionModal from './AddProductionModal'
import InvoiceProductionModal from './InvoiceProductionModal'
import MarkAsProducedModal from './MarkAsProducedModal'
import ProposalCreationModal from './ProposalCreationModal'
import { QuickBudgetModal, type QuickBudgetOption } from './QuickBudgetModal'
import RegisterPaymentModal from './RegisterPaymentModal'
import TraceabilityModal from './TraceabilityModal'

type BudgetsPaymentsProps = {
  onClose?: () => void
  openBudgetCreation?: boolean
  onBudgetCreationOpened?: () => void
  patientName?: string
}

type ActionMenuItem = {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}

type ActionsMenuProps = {
  rowId: string
  status: StatusType
  onAction: (rowId: string, action: string) => void
}

function ActionsMenu({ rowId, status, onAction }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const [openUpward, setOpenUpward] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate position and check if menu should open upward
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 280 // Approximate menu height
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < menuHeight

      setOpenUpward(shouldOpenUpward)
      setMenuPosition({
        top: shouldOpenUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 205 // Menu width is ~205px, align to right
      })
    }
    setIsOpen(!isOpen)
  }

  // Define actions based on status
  const getMenuItems = (): ActionMenuItem[] => {
    // Actions for "Producido" status
    if (status === 'Producido') {
      return [
        {
          id: 'facturar',
          label: 'Facturar',
          icon: <EuroRounded className='size-6' />,
          onClick: () => onAction(rowId, 'facturar')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-presupuesto',
          label: 'Ver presupuesto',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-presupuesto')
        },
        {
          id: 'editar',
          label: 'Editar fecha/notas',
          icon: <EditRounded className='size-6' />,
          onClick: () => onAction(rowId, 'editar')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Pendiente" status
    if (status === 'Pendiente') {
      return [
        {
          id: 'marcar-producido',
          label: 'Marcar como producido',
          icon: <CheckCircleRounded className='size-6' />,
          onClick: () => onAction(rowId, 'marcar-producido')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-presupuesto',
          label: 'Ver presupuesto',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-presupuesto')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Facturado" status
    if (status === 'Facturado') {
      return [
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-presupuesto',
          label: 'Ver presupuesto',
          icon: <DescriptionRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-presupuesto')
        },
        {
          id: 'ver-factura',
          label: 'Ver factura',
          icon: <EuroRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-factura')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    return []
  }

  const menuItems = getMenuItems()

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='px-2 cursor-pointer hover:text-neutral-900 transition-colors'
        aria-label='Más acciones'
        onClick={handleToggle}
      >
        <MoreVertRounded className='size-6 text-neutral-700' />
      </button>

      {isOpen &&
        menuItems.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[12.8125rem] p-4 flex flex-col gap-6 bg-neutral-50/90 backdrop-blur-sm rounded-lg shadow-[2px_2px_4px_0_rgba(0,0,0,0.1)]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
            data-node-id='3092:10033'
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleItemClick(item)}
                className={[
                  'flex items-center gap-2 text-title-sm text-left cursor-pointer transition-colors',
                  item.danger
                    ? 'text-error-600 hover:text-error-800'
                    : 'text-neutral-900 hover:text-brand-700'
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// === BUDGET ACTIONS MENU ===
type BudgetActionsMenuProps = {
  rowId: string
  status: BudgetStatusType
  onAction: (rowId: string, action: string) => void
}

function BudgetActionsMenu({
  rowId,
  status,
  onAction
}: BudgetActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 380
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < menuHeight

      setMenuPosition({
        top: shouldOpenUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 250
      })
    }
    setIsOpen(!isOpen)
  }

  const getBudgetMenuItems = (): ActionMenuItem[] => {
    // Actions for "Pendiente" status
    if (status === 'Pendiente') {
      return [
        {
          id: 'marcar-aceptado',
          label: 'Marcar como aceptado',
          icon: <CheckCircleRounded className='size-6' />,
          onClick: () => onAction(rowId, 'marcar-aceptado')
        },
        {
          id: 'marcar-rechazado',
          label: 'Marcar como rechazado',
          icon: <CancelRounded className='size-6' />,
          onClick: () => onAction(rowId, 'marcar-rechazado')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'editar',
          label: 'Editar',
          icon: <EditRounded className='size-6' />,
          onClick: () => onAction(rowId, 'editar')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar Mail',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Aceptado" status
    if (status === 'Aceptado') {
      return [
        {
          id: 'ver-produccion',
          label: 'Ver producción',
          icon: <BarChartRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-produccion')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar Mail',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Rechazado" status
    if (status === 'Rechazado') {
      return [
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    return []
  }

  const menuItems = getBudgetMenuItems()

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='px-2 cursor-pointer hover:text-neutral-900 transition-colors'
        aria-label='Más acciones'
        onClick={handleToggle}
      >
        <MoreVertRounded className='size-6 text-neutral-700' />
      </button>

      {isOpen &&
        menuItems.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[15.625rem] p-4 flex flex-col gap-6 bg-neutral-50/90 backdrop-blur-sm rounded-lg shadow-[2px_2px_4px_0_rgba(0,0,0,0.1)]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleItemClick(item)}
                className={[
                  'flex items-center gap-2 text-title-sm text-left cursor-pointer transition-colors',
                  item.danger
                    ? 'text-error-600 hover:text-error-800'
                    : 'text-neutral-900 hover:text-brand-700'
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// === PRODUCCIÓN TYPES ===
type StatusType = 'Producido' | 'Pendiente' | 'Facturado'

const STATUS_OPTIONS: StatusType[] = ['Producido', 'Pendiente', 'Facturado']

type ProductionRow = {
  id: string
  date: string
  description: string
  amount: string
  status: StatusType
  professional: string
}

// === PRESUPUESTOS TYPES ===
type BudgetStatusType = 'Aceptado' | 'Pendiente' | 'Rechazado'

const BUDGET_STATUS_OPTIONS: BudgetStatusType[] = [
  'Aceptado',
  'Pendiente',
  'Rechazado'
]

type BudgetRow = {
  id: string
  description: string
  amount: string
  date: string
  status: BudgetStatusType
  professional: string
  insurer: string
}

// === FACTURAS TYPES ===
type InvoiceStatusType = 'Cobrado' | 'Pendiente'

const INVOICE_STATUS_OPTIONS: InvoiceStatusType[] = ['Cobrado', 'Pendiente']

type InvoiceRow = {
  id: string
  description: string
  amount: string
  date: string
  status: InvoiceStatusType
  paymentMethod: string
  insurer: string
}

const INITIAL_INVOICE_ROWS: InvoiceRow[] = [
  {
    id: 'F-001',
    description: 'Operación mandíbula',
    amount: '2.300 €',
    date: '22/12/25',
    status: 'Cobrado',
    paymentMethod: 'Efectivo',
    insurer: 'Adeslas'
  },
  {
    id: 'F-002',
    description: 'Consulta inicial',
    amount: '150 €',
    date: '18/12/25',
    status: 'Pendiente',
    paymentMethod: '',
    insurer: 'Sanitas'
  },
  {
    id: 'F-003',
    description: 'Radiografía',
    amount: '100 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Tarjeta',
    insurer: 'Sanitas'
  },
  {
    id: 'F-004',
    description: 'Extracción de muela',
    amount: '500 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Tarjeta',
    insurer: 'DKV'
  },
  {
    id: 'F-005',
    description: 'Implante dental',
    amount: '1.200 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Transferencia',
    insurer: 'Adelas'
  },
  {
    id: 'F-006',
    description: 'Férula de descarga',
    amount: '300 €',
    date: '01/12/25',
    status: 'Pendiente',
    paymentMethod: '',
    insurer: 'Sanitas'
  },
  {
    id: 'F-007',
    description: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    date: '01/12/25',
    status: 'Cobrado',
    paymentMethod: 'Tarjeta',
    insurer: 'DKV'
  },
  {
    id: 'F-008',
    description: 'Consulta de seguimiento',
    amount: '100 €',
    date: '30/08/25',
    status: 'Pendiente',
    paymentMethod: '',
    insurer: 'Sanitas'
  },
  {
    id: 'F-009',
    description: 'Blanqueamiento dental',
    amount: '400 €',
    date: '11/03/25',
    status: 'Cobrado',
    paymentMethod: 'Efectivo',
    insurer: 'Sanitas'
  }
]

const INITIAL_BUDGET_ROWS: BudgetRow[] = [
  {
    id: 'PR-001',
    description: 'Operación mandíbula',
    amount: '2.300 €',
    date: '22/12/25',
    status: 'Aceptado',
    professional: 'Dr. Guillermo',
    insurer: 'Adeslas'
  },
  {
    id: 'PR-002',
    description: 'Consulta inicial',
    amount: '150 €',
    date: '18/12/25',
    status: 'Aceptado',
    professional: 'Dr. Guillermo',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-003',
    description: 'Radiografía',
    amount: '100 €',
    date: '01/12/25',
    status: 'Pendiente',
    professional: 'Dra. Andrea',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-004',
    description: 'Extracción de muela',
    amount: '500 €',
    date: '01/12/25',
    status: 'Aceptado',
    professional: 'Dr. Guillermo',
    insurer: 'DKV'
  },
  {
    id: 'PR-005',
    description: 'Implante dental',
    amount: '1.200 €',
    date: '01/12/25',
    status: 'Aceptado',
    professional: 'Dr. Guillermo',
    insurer: 'Adelas'
  },
  {
    id: 'PR-006',
    description: 'Férula de descarga',
    amount: '300 €',
    date: '01/12/25',
    status: 'Pendiente',
    professional: 'Dra. Andrea',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-007',
    description: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    date: '01/12/25',
    status: 'Aceptado',
    professional: 'Dra. Andrea',
    insurer: 'DKV'
  },
  {
    id: 'PR-008',
    description: 'Consulta de seguimiento',
    amount: '100 €',
    date: '30/08/25',
    status: 'Rechazado',
    professional: 'Dr. Guillermo',
    insurer: 'Sanitas'
  },
  {
    id: 'PR-009',
    description: 'Blanqueamiento dental',
    amount: '400 €',
    date: '11/03/25',
    status: 'Pendiente',
    professional: 'Dr. Guillermo',
    insurer: 'Sanitas'
  }
]

const INITIAL_PRODUCTION_ROWS: ProductionRow[] = [
  {
    id: 'PR-001',
    date: '22/12/25',
    description: 'Operación mandíbula',
    amount: '2.300 €',
    status: 'Producido',
    professional: 'Dr. Guillermo'
  },
  {
    id: 'PR-002',
    date: '18/12/25',
    description: 'Consulta inicial',
    amount: '150 €',
    status: 'Producido',
    professional: 'Dr. Guillermo'
  },
  {
    id: 'PR-003',
    date: '',
    description: 'Radiografía',
    amount: '100 €',
    status: 'Pendiente',
    professional: 'Dra. Andrea'
  },
  {
    id: 'PR-004',
    date: '01/12/25',
    description: 'Extracción de muela',
    amount: '500 €',
    status: 'Producido',
    professional: 'Dr. Guillermo'
  },
  {
    id: 'PR-005',
    date: '01/12/25',
    description: 'Implante dental',
    amount: '1.200 €',
    status: 'Producido',
    professional: 'Dr. Guillermo'
  },
  {
    id: 'PR-006',
    date: '',
    description: 'Férula de descarga',
    amount: '300 €',
    status: 'Pendiente',
    professional: 'Dra. Andrea'
  },
  {
    id: 'PR-007',
    date: '01/12/25',
    description: 'Tratamiento de ortodoncia',
    amount: '1.800 €',
    status: 'Producido',
    professional: 'Dra. Andrea'
  },
  {
    id: 'PR-008',
    date: '30/08/25',
    description: 'Consulta de seguimiento',
    amount: '100 €',
    status: 'Facturado',
    professional: 'Dr. Guillermo'
  },
  {
    id: 'PR-009',
    date: '',
    description: 'Blanqueamiento dental',
    amount: '400 €',
    status: 'Pendiente',
    professional: 'Dr. Guillermo'
  }
]

// === PRODUCTION STATUS STYLES ===
function getStatusStyles(status: StatusType) {
  switch (status) {
    case 'Producido':
      return 'border-brand-500 text-brand-500'
    case 'Pendiente':
      return 'border-[#FFD188] text-[#FFD188]'
    case 'Facturado':
      return 'border-[#0088FF] text-[#0088FF]'
    default:
      return 'border-neutral-300 text-neutral-600'
  }
}

// === BUDGET STATUS STYLES ===
function getBudgetStatusStyles(status: BudgetStatusType) {
  switch (status) {
    case 'Aceptado':
      return 'border-brand-500 text-brand-500'
    case 'Pendiente':
      return 'border-[#FFD188] text-[#FFD188]'
    case 'Rechazado':
      return 'border-error-600 text-error-600'
    default:
      return 'border-neutral-300 text-neutral-600'
  }
}

// === INVOICE STATUS STYLES ===
function getInvoiceStatusStyles(status: InvoiceStatusType) {
  switch (status) {
    case 'Cobrado':
      return 'border-brand-500 text-brand-500'
    case 'Pendiente':
      return 'border-[#FFD188] text-[#FFD188]'
    default:
      return 'border-neutral-300 text-neutral-600'
  }
}

// === INVOICE STATUS BADGE ===
type InvoiceStatusBadgeProps = {
  status: InvoiceStatusType
  rowId: string
  onStatusChange: (rowId: string, newStatus: InvoiceStatusType) => void
}

function InvoiceStatusBadge({
  status,
  rowId,
  onStatusChange
}: InvoiceStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: InvoiceStatusType) => {
    onStatusChange(rowId, newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'inline-flex items-center justify-center rounded-[5rem] border px-2 py-1 text-label-sm cursor-pointer transition-all hover:opacity-80',
          getInvoiceStatusStyles(status)
        ].join(' ')}
      >
        {status}
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 min-w-[10rem]'>
          {INVOICE_STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => handleSelect(option)}
              className={[
                'w-full px-3 py-2 text-left text-body-sm hover:bg-neutral-50 transition-colors flex items-center gap-2',
                status === option ? 'bg-neutral-50' : ''
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center rounded-[5rem] border px-2 py-0.5 text-label-sm',
                  getInvoiceStatusStyles(option)
                ].join(' ')}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// === INVOICE ACTIONS MENU ===
type InvoiceActionsMenuProps = {
  rowId: string
  status: InvoiceStatusType
  onAction: (rowId: string, action: string) => void
}

function InvoiceActionsMenu({
  rowId,
  status,
  onAction
}: InvoiceActionsMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 320
      const spaceBelow = window.innerHeight - rect.bottom
      const shouldOpenUpward = spaceBelow < menuHeight

      setMenuPosition({
        top: shouldOpenUpward ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 220
      })
    }
    setIsOpen(!isOpen)
  }

  const getInvoiceMenuItems = (): ActionMenuItem[] => {
    // Actions for "Pendiente" status
    if (status === 'Pendiente') {
      return [
        {
          id: 'registrar-pago',
          label: 'Registrar pago',
          icon: <ReceiptLongRounded className='size-6' />,
          onClick: () => onAction(rowId, 'registrar-pago')
        },
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-trazabilidad',
          label: 'Ver trazabilidad',
          icon: <TimelineRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-trazabilidad')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar por Mail',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    // Actions for "Cobrado" status
    if (status === 'Cobrado') {
      return [
        {
          id: 'ver-detalles',
          label: 'Ver detalles',
          icon: <VisibilityRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-detalles')
        },
        {
          id: 'ver-trazabilidad',
          label: 'Ver trazabilidad',
          icon: <TimelineRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-trazabilidad')
        },
        {
          id: 'ver-pago-registrado',
          label: 'Ver pago registrado',
          icon: <ReceiptLongRounded className='size-6' />,
          onClick: () => onAction(rowId, 'ver-pago-registrado')
        },
        {
          id: 'enviar-mail',
          label: 'Enviar por Mail',
          icon: <AttachEmailRounded className='size-6' />,
          onClick: () => onAction(rowId, 'enviar-mail')
        },
        {
          id: 'descargar-pdf',
          label: 'Descargar PDF',
          icon: <DownloadRounded className='size-6' />,
          onClick: () => onAction(rowId, 'descargar-pdf')
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          icon: <DeleteRounded className='size-6' />,
          onClick: () => onAction(rowId, 'eliminar'),
          danger: true
        }
      ]
    }

    return []
  }

  const menuItems = getInvoiceMenuItems()

  const handleItemClick = (item: ActionMenuItem) => {
    item.onClick()
    setIsOpen(false)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type='button'
        className='px-2 cursor-pointer hover:text-neutral-900 transition-colors'
        aria-label='Más acciones'
        onClick={handleToggle}
      >
        <MoreVertRounded className='size-6 text-neutral-700' />
      </button>

      {isOpen &&
        menuItems.length > 0 &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-[13.75rem] p-4 flex flex-col gap-6 bg-neutral-50/90 backdrop-blur-sm rounded-lg shadow-[2px_2px_4px_0_rgba(0,0,0,0.1)]'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                type='button'
                onClick={() => handleItemClick(item)}
                className={[
                  'flex items-center gap-2 text-title-sm text-left cursor-pointer transition-colors',
                  item.danger
                    ? 'text-error-600 hover:text-error-800'
                    : 'text-neutral-900 hover:text-brand-700'
                ].join(' ')}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}

// === BUDGET STATUS BADGE ===
type BudgetStatusBadgeProps = {
  status: BudgetStatusType
  rowId: string
  onStatusChange: (rowId: string, newStatus: BudgetStatusType) => void
}

function BudgetStatusBadge({
  status,
  rowId,
  onStatusChange
}: BudgetStatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: BudgetStatusType) => {
    onStatusChange(rowId, newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'inline-flex items-center justify-center rounded-[5rem] border px-2 py-1 text-label-sm cursor-pointer transition-all hover:opacity-80',
          getBudgetStatusStyles(status)
        ].join(' ')}
      >
        {status}
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 min-w-[10rem]'>
          {BUDGET_STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => handleSelect(option)}
              className={[
                'w-full px-3 py-2 text-left text-body-sm hover:bg-neutral-50 transition-colors flex items-center gap-2',
                status === option ? 'bg-neutral-50' : ''
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center rounded-[5rem] border px-2 py-0.5 text-label-sm',
                  getBudgetStatusStyles(option)
                ].join(' ')}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type StatusBadgeProps = {
  status: StatusType
  rowId: string
  onStatusChange: (rowId: string, newStatus: StatusType) => void
}

function StatusBadge({ status, rowId, onStatusChange }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: StatusType) => {
    onStatusChange(rowId, newStatus)
    setIsOpen(false)
  }

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'inline-flex items-center justify-center rounded-[5rem] border px-2 py-1 text-label-sm cursor-pointer transition-all hover:opacity-80',
          getStatusStyles(status)
        ].join(' ')}
      >
        {status}
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-neutral-200 shadow-lg py-1 min-w-[10rem]'>
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => handleSelect(option)}
              className={[
                'w-full px-3 py-2 text-left text-body-sm hover:bg-neutral-50 transition-colors flex items-center gap-2',
                status === option ? 'bg-neutral-50' : ''
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center justify-center rounded-[5rem] border px-2 py-0.5 text-label-sm',
                  getStatusStyles(option)
                ].join(' ')}
              >
                {option}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BudgetsPayments({
  onClose,
  openBudgetCreation = false,
  onBudgetCreationOpened,
  patientName
}: BudgetsPaymentsProps) {
  // Nombre del paciente para mostrar (usa prop o mock)
  const displayPatientName = patientName || 'María García López'
  type TabKey = 'Presupuestos' | 'Producción' | 'Facturas'
  const [activeTab, setActiveTab] = React.useState<TabKey>('Presupuestos')
  const [showProposalModal, setShowProposalModal] = React.useState(false)
  const [showQuickBudgetModal, setShowQuickBudgetModal] = React.useState(false)
  const [showAddProductionModal, setShowAddProductionModal] =
    React.useState(false)
  const [showMarkAsProducedModal, setShowMarkAsProducedModal] =
    React.useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false)
  const [showRegisterPaymentModal, setShowRegisterPaymentModal] =
    React.useState(false)
  const [showTraceabilityModal, setShowTraceabilityModal] =
    React.useState(false)
  const [selectedProductionRow, setSelectedProductionRow] =
    React.useState<ProductionRow | null>(null)
  const [selectedInvoiceRow, setSelectedInvoiceRow] =
    React.useState<InvoiceRow | null>(null)

  // Separate state for each tab
  const [productionRows, setProductionRows] = React.useState<ProductionRow[]>(
    INITIAL_PRODUCTION_ROWS
  )
  const [budgetRows, setBudgetRows] =
    React.useState<BudgetRow[]>(INITIAL_BUDGET_ROWS)
  const [invoiceRows, setInvoiceRows] =
    React.useState<InvoiceRow[]>(INITIAL_INVOICE_ROWS)

  // === FILTER STATES ===
  // Search
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showSearchInput, setShowSearchInput] = React.useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Status filters (multi-select) - Default to "Pendiente" for all tabs
  const [selectedProductionStatuses, setSelectedProductionStatuses] =
    React.useState<StatusType[]>(['Pendiente'])
  const [selectedBudgetStatuses, setSelectedBudgetStatuses] = React.useState<
    BudgetStatusType[]
  >(['Pendiente'])
  const [selectedInvoiceStatuses, setSelectedInvoiceStatuses] = React.useState<
    InvoiceStatusType[]
  >(['Pendiente'])

  // Professional filter
  const [selectedProfessional, setSelectedProfessional] = React.useState('')

  // Insurer filter
  const [selectedInsurer, setSelectedInsurer] = React.useState('')

  // Payment method filter (facturas only)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('')

  // Date range filter
  const [dateFrom, setDateFrom] = React.useState<Date | null>(null)
  const [dateTo, setDateTo] = React.useState<Date | null>(null)

  // Quick filters
  const [quickFilter, setQuickFilter] = React.useState<
    'all' | 'this-week' | 'this-month'
  >('all')

  // Dropdown visibility states
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false)
  const [showProfessionalDropdown, setShowProfessionalDropdown] =
    React.useState(false)
  const [showInsurerDropdown, setShowInsurerDropdown] = React.useState(false)
  const [showPaymentMethodDropdown, setShowPaymentMethodDropdown] =
    React.useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = React.useState(false)

  // Extract unique professionals and insurers from data
  const professionals = React.useMemo(() => {
    const prods = productionRows.map((r) => r.professional)
    const budgets = budgetRows.map((r) => r.professional)
    return [...new Set([...prods, ...budgets])].filter(Boolean)
  }, [productionRows, budgetRows])

  const insurers = React.useMemo(() => {
    const budgets = budgetRows.map((r) => r.insurer)
    const invoices = invoiceRows.map((r) => r.insurer)
    return [...new Set([...budgets, ...invoices])].filter(Boolean)
  }, [budgetRows, invoiceRows])

  const paymentMethods = React.useMemo(() => {
    return [...new Set(invoiceRows.map((r) => r.paymentMethod))].filter(Boolean)
  }, [invoiceRows])

  // Parse date string dd/mm/yy to Date
  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10) + 2000
    return new Date(year, month, day)
  }

  // Check if date is within range
  const isDateInRange = (
    dateStr: string,
    from: Date | null,
    to: Date | null
  ): boolean => {
    if (!from && !to) return true
    const date = parseDate(dateStr)
    if (!date) return true
    if (from && date < from) return false
    if (to && date > to) return false
    return true
  }

  // Check if date is this week
  const isThisWeek = (dateStr: string): boolean => {
    const date = parseDate(dateStr)
    if (!date) return true
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    return date >= startOfWeek && date <= endOfWeek
  }

  // Check if date is this month
  const isThisMonth = (dateStr: string): boolean => {
    const date = parseDate(dateStr)
    if (!date) return true
    const now = new Date()
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    )
  }

  // === FILTERED DATA ===
  const filteredProductionRows = React.useMemo(() => {
    return productionRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !row.id.toLowerCase().includes(query) &&
          !row.description.toLowerCase().includes(query)
        )
          return false
      }
      // Status filter
      if (
        selectedProductionStatuses.length > 0 &&
        !selectedProductionStatuses.includes(row.status)
      )
        return false
      // Professional filter
      if (selectedProfessional && row.professional !== selectedProfessional)
        return false
      // Date range filter
      if (!isDateInRange(row.date, dateFrom, dateTo)) return false
      // Quick filters
      if (quickFilter === 'this-week' && !isThisWeek(row.date)) return false
      if (quickFilter === 'this-month' && !isThisMonth(row.date)) return false
      return true
    })
  }, [
    productionRows,
    searchQuery,
    selectedProductionStatuses,
    selectedProfessional,
    dateFrom,
    dateTo,
    quickFilter
  ])

  const filteredBudgetRows = React.useMemo(() => {
    return budgetRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !row.id.toLowerCase().includes(query) &&
          !row.description.toLowerCase().includes(query)
        )
          return false
      }
      // Status filter
      if (
        selectedBudgetStatuses.length > 0 &&
        !selectedBudgetStatuses.includes(row.status)
      )
        return false
      // Professional filter
      if (selectedProfessional && row.professional !== selectedProfessional)
        return false
      // Insurer filter
      if (selectedInsurer && row.insurer !== selectedInsurer) return false
      // Date range filter
      if (!isDateInRange(row.date, dateFrom, dateTo)) return false
      // Quick filters
      if (quickFilter === 'this-week' && !isThisWeek(row.date)) return false
      if (quickFilter === 'this-month' && !isThisMonth(row.date)) return false
      return true
    })
  }, [
    budgetRows,
    searchQuery,
    selectedBudgetStatuses,
    selectedProfessional,
    selectedInsurer,
    dateFrom,
    dateTo,
    quickFilter
  ])

  const filteredInvoiceRows = React.useMemo(() => {
    return invoiceRows.filter((row) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !row.id.toLowerCase().includes(query) &&
          !row.description.toLowerCase().includes(query)
        )
          return false
      }
      // Status filter
      if (
        selectedInvoiceStatuses.length > 0 &&
        !selectedInvoiceStatuses.includes(row.status)
      )
        return false
      // Insurer filter
      if (selectedInsurer && row.insurer !== selectedInsurer) return false
      // Payment method filter
      if (selectedPaymentMethod && row.paymentMethod !== selectedPaymentMethod)
        return false
      // Date range filter
      if (!isDateInRange(row.date, dateFrom, dateTo)) return false
      // Quick filters
      if (quickFilter === 'this-week' && !isThisWeek(row.date)) return false
      if (quickFilter === 'this-month' && !isThisMonth(row.date)) return false
      return true
    })
  }, [
    invoiceRows,
    searchQuery,
    selectedInvoiceStatuses,
    selectedInsurer,
    selectedPaymentMethod,
    dateFrom,
    dateTo,
    quickFilter
  ])

  // Clear all filters (reset to defaults with "Pendiente" status)
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedProductionStatuses(['Pendiente'])
    setSelectedBudgetStatuses(['Pendiente'])
    setSelectedInvoiceStatuses(['Pendiente'])
    setSelectedProfessional('')
    setSelectedInsurer('')
    setSelectedPaymentMethod('')
    setDateFrom(null)
    setDateTo(null)
    setQuickFilter('all')
  }

  // Check if any filter is active (beyond the default "Pendiente")
  const isDefaultStatusFilter = (statuses: string[]) =>
    statuses.length === 1 && statuses[0] === 'Pendiente'

  const hasActiveFilters =
    searchQuery ||
    !isDefaultStatusFilter(selectedProductionStatuses) ||
    !isDefaultStatusFilter(selectedBudgetStatuses) ||
    !isDefaultStatusFilter(selectedInvoiceStatuses) ||
    selectedProfessional ||
    selectedInsurer ||
    selectedPaymentMethod ||
    dateFrom ||
    dateTo ||
    quickFilter !== 'all'

  // Focus search input when opened
  React.useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearchInput])

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-filter-dropdown]')) {
        setShowStatusDropdown(false)
        setShowProfessionalDropdown(false)
        setShowInsurerDropdown(false)
        setShowPaymentMethodDropdown(false)
        setShowDateRangeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-open proposal modal if openBudgetCreation is true
  React.useEffect(() => {
    if (openBudgetCreation && !showProposalModal) {
      setShowProposalModal(true)
      onBudgetCreationOpened?.()
    }
  }, [openBudgetCreation, showProposalModal, onBudgetCreationOpened])

  const [quickBudgetSelection, setQuickBudgetSelection] =
    React.useState<QuickBudgetOption | null>(null)

  // Handler to update production row status
  const handleProductionStatusChange = (
    rowId: string,
    newStatus: StatusType
  ) => {
    setProductionRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status: newStatus } : row
      )
    )
  }

  // Handler to update budget row status
  const handleBudgetStatusChange = (
    rowId: string,
    newStatus: BudgetStatusType
  ) => {
    setBudgetRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status: newStatus } : row
      )
    )
  }

  // Handler to update invoice row status
  const handleInvoiceStatusChange = (
    rowId: string,
    newStatus: InvoiceStatusType
  ) => {
    setInvoiceRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, status: newStatus } : row
      )
    )
  }

  // Handler for invoice action menu items
  const handleInvoiceAction = (rowId: string, action: string) => {
    console.log(`Invoice Action: ${action} on row: ${rowId}`)

    switch (action) {
      case 'registrar-pago': {
        // Find the invoice row and open the modal
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedInvoiceRow(row)
          setShowRegisterPaymentModal(true)
        }
        break
      }
      case 'eliminar':
        setInvoiceRows((prevRows) => prevRows.filter((row) => row.id !== rowId))
        break
      case 'ver-trazabilidad': {
        // Find the invoice row and open the traceability modal
        const row = invoiceRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedInvoiceRow(row)
          setShowTraceabilityModal(true)
        }
        break
      }
      case 'ver-detalles':
      case 'ver-pago-registrado':
      case 'enviar-mail':
      case 'descargar-pdf':
        // Placeholder for future implementation
        break
      default:
        break
    }
  }

  // Handler for production action menu items
  const handleProductionAction = (rowId: string, action: string) => {
    console.log(`Action: ${action} on row: ${rowId}`)

    switch (action) {
      case 'facturar': {
        // Find the row and open the invoice modal
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedProductionRow(row)
          setShowInvoiceModal(true)
        }
        break
      }
      case 'marcar-producido': {
        // Find the row and open the modal
        const row = productionRows.find((r) => r.id === rowId)
        if (row) {
          setSelectedProductionRow(row)
          setShowMarkAsProducedModal(true)
        }
        break
      }
      case 'eliminar':
        setProductionRows((prevRows) =>
          prevRows.filter((row) => row.id !== rowId)
        )
        break
      default:
        break
    }
  }

  // Handler for budget action menu items
  const handleBudgetAction = (rowId: string, action: string) => {
    console.log(`Budget Action: ${action} on row: ${rowId}`)

    switch (action) {
      case 'marcar-aceptado':
        handleBudgetStatusChange(rowId, 'Aceptado')
        break
      case 'marcar-rechazado':
        handleBudgetStatusChange(rowId, 'Rechazado')
        break
      case 'eliminar':
        setBudgetRows((prevRows) => prevRows.filter((row) => row.id !== rowId))
        break
      case 'ver-detalles':
      case 'ver-produccion':
      case 'editar':
      case 'enviar-mail':
      case 'descargar-pdf':
        // Placeholder for future implementation
        break
      default:
        break
    }
  }

  // Column widths for PRODUCCIÓN from Figma (converted to rem)
  const PROD_COL_FECHA = 'w-[6.8125rem]' // 109px
  const PROD_COL_DESC = 'w-[21.375rem]' // 342px
  const PROD_COL_MONTO = 'w-[7.625rem]' // 122px
  const PROD_COL_ESTADO = 'w-[9.625rem]' // 154px
  const PROD_COL_PROFESIONAL = 'w-[13.1875rem]' // 211px
  const PROD_COL_ID = 'w-[6.625rem]' // 106px

  // Column widths for PRESUPUESTOS from Figma (converted to rem)
  const BUDGET_COL_ID = 'w-[6rem]' // 96px
  const BUDGET_COL_DESC = 'w-[19.375rem]' // 310px
  const BUDGET_COL_MONTO = 'w-[6.875rem]' // 110px
  const BUDGET_COL_FECHA = 'w-[6.9375rem]' // 111px
  const BUDGET_COL_ESTADO = 'w-[6.75rem]' // 108px
  const BUDGET_COL_PROFESIONAL = 'w-[10rem]' // 160px
  const BUDGET_COL_INSURER = 'w-[9.3125rem]' // 149px

  return (
    <div
      className='relative w-[74.75rem] h-full bg-neutral-50'
      data-node-id='3092:10807'
    >
      {/* Header */}
      <div
        className='absolute left-8 top-10 flex flex-col gap-2 w-[35.5rem]'
        data-node-id='3092:10815'
      >
        <p className='text-headline-sm text-neutral-900'>
          Presupuestos y pagos
        </p>
        <p className='text-body-sm text-neutral-900'>
          Cobros, financiación embebida, facturas/recibos y conciliación.
        </p>
      </div>

      {/* KPIs - calculated dynamically */}
      {(() => {
        // Calculate pending balance from invoices with status "Pendiente"
        const pendingBalance = invoiceRows
          .filter((row) => row.status === 'Pendiente')
          .reduce((sum, row) => {
            // Parse amount like "150 €" or "1.200 €" to number
            const amountStr = row.amount.replace(/[€\s.]/g, '').replace(',', '.')
            return sum + (parseFloat(amountStr) || 0)
          }, 0)

        // Count pending invoices (could represent "vencidas" in a real scenario)
        const pendingCount = invoiceRows.filter(
          (row) => row.status === 'Pendiente'
        ).length

        // Format balance with Spanish locale
        const formattedBalance = pendingBalance.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })

        return (
          <>
            <div
              className='absolute left-8 top-[10.25rem]'
              data-node-id='3092:10811'
            >
              <p className='text-title-md text-neutral-900'>Saldo pendiente</p>
              <p
                className='mt-[0.4375rem] text-neutral-900'
                style={{ fontSize: '2rem', lineHeight: '2.5rem' }}
                data-node-id='3092:10813'
              >
                {formattedBalance} €
              </p>
            </div>
            <div
              className='absolute left-[18.75rem] top-[10.25rem]'
              data-node-id='3092:10812'
            >
              <p className='text-title-md text-neutral-900'>Facturas vencidas</p>
              <p
                className='mt-[0.4375rem] text-warning-600'
                style={{ fontSize: '2rem', lineHeight: '2.5rem' }}
                data-node-id='3092:10814'
              >
                {String(pendingCount).padStart(2, '0')}
              </p>
            </div>
          </>
        )
      })()}

      {/* Main Card */}
      <div
        className='absolute left-8 top-[17.4375rem] w-[70.25rem] h-[36.3125rem] bg-white rounded-lg border border-neutral-200 overflow-hidden'
        data-node-id='3092:10816'
      >
        {/* Tabs */}
        <div
          className='absolute left-8 top-4 flex items-center gap-6'
          data-node-id='3092:10964'
        >
          {(['Presupuestos', 'Producción', 'Facturas'] as TabKey[]).map(
            (tab) => (
              <button
                key={tab}
                type='button'
                className={[
                  'h-10 px-2 flex items-center text-title-md cursor-pointer transition-colors',
                  activeTab === tab
                    ? 'border-b border-brand-500 text-neutral-900'
                    : 'text-neutral-600 hover:text-neutral-900'
                ].join(' ')}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Action buttons - change based on active tab */}
        {activeTab === 'Presupuestos' ? (
          <>
            {/* Presupuesto rápido button */}
            <button
              className='absolute top-4 right-[15rem] flex items-center gap-2 rounded-[8.5rem] px-4 py-2 text-body-md text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer'
              type='button'
              onClick={() => setShowQuickBudgetModal(true)}
            >
              <ElectricBoltRounded className='size-6 text-brand-500' />
              <span className='font-medium'>Presupuesto rapido</span>
            </button>
            {/* Crear presupuesto button */}
            <button
              className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
              type='button'
              onClick={() => setShowProposalModal(true)}
            >
              <AddRounded className='size-6' />
              <span className='font-medium'>Crear presupuesto</span>
            </button>
          </>
        ) : activeTab === 'Producción' ? (
          <button
            className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
            type='button'
            onClick={() => setShowAddProductionModal(true)}
            data-node-id='3092:10817'
          >
            <AddRounded className='size-6' />
            <span className='font-medium'>Añadir producción</span>
          </button>
        ) : activeTab === 'Facturas' ? (
          <button
            className='absolute top-4 right-8 flex items-center gap-2 rounded-[8.5rem] px-4 py-2 bg-neutral-50 border border-neutral-300 text-body-md text-neutral-900 hover:bg-[#D3F7F3] hover:border-[#7DE7DC] active:bg-[#1E4947] active:text-neutral-50 active:border-[#1E4947] transition-colors cursor-pointer'
            type='button'
            onClick={() => {
              // Export CSV functionality
              console.log('Exportar CSV')
            }}
          >
            <DownloadRounded className='size-6' />
            <span className='font-medium'>Exportar CSV</span>
          </button>
        ) : null}

        {/* Search + Filters */}
        <div
          className='absolute top-[4.4375rem] left-8 right-8 flex items-center justify-between gap-2'
          data-node-id='3092:10999'
        >
          {/* Left side: Quick filters */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => setQuickFilter('all')}
              className={[
                'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                quickFilter === 'all'
                  ? 'bg-brand-500 text-brand-900 border border-brand-500'
                  : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              ].join(' ')}
            >
              Todos
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('this-week')}
              className={[
                'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                quickFilter === 'this-week'
                  ? 'bg-brand-500 text-brand-900 border border-brand-500'
                  : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              ].join(' ')}
            >
              Esta semana
            </button>
            <button
              type='button'
              onClick={() => setQuickFilter('this-month')}
              className={[
                'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                quickFilter === 'this-month'
                  ? 'bg-brand-500 text-brand-900 border border-brand-500'
                  : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              ].join(' ')}
            >
              Este mes
            </button>
          </div>

          {/* Right side: Search and filter dropdowns */}
          <div className='flex items-center gap-2'>
            {/* Search */}
            {showSearchInput ? (
              <div className='flex items-center gap-1 h-8 px-2 rounded-full border border-neutral-700 bg-white'>
                <SearchRounded className='size-5 text-neutral-600' />
                <input
                  ref={searchInputRef}
                  type='text'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Buscar...'
                  className='w-32 text-body-sm bg-transparent outline-none'
                />
                <button
                  type='button'
                  onClick={() => {
                    setSearchQuery('')
                    setShowSearchInput(false)
                  }}
                  className='text-neutral-500 hover:text-neutral-700'
                >
                  <CloseRounded className='size-4' />
                </button>
              </div>
            ) : (
              <button
                type='button'
                onClick={() => setShowSearchInput(true)}
                className='flex items-center h-8 px-2 py-1 rounded-full border border-neutral-300 text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors'
              >
                <SearchRounded className='size-5' />
              </button>
            )}

            {/* Status Filter */}
            <div className='relative' data-filter-dropdown>
              <button
                type='button'
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowProfessionalDropdown(false)
                  setShowInsurerDropdown(false)
                  setShowPaymentMethodDropdown(false)
                  setShowDateRangeDropdown(false)
                }}
                className={[
                  'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                  (activeTab === 'Producción' &&
                    selectedProductionStatuses.length > 0) ||
                  (activeTab === 'Presupuestos' &&
                    selectedBudgetStatuses.length > 0) ||
                  (activeTab === 'Facturas' &&
                    selectedInvoiceStatuses.length > 0)
                    ? 'bg-brand-100 border border-brand-500 text-brand-700'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                ].join(' ')}
              >
                <span>Estado</span>
                <KeyboardArrowDownRounded className='size-4' />
              </button>
              {showStatusDropdown && (
                <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                  {activeTab === 'Producción' &&
                    STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className='flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedProductionStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductionStatuses((prev) => [
                                ...prev,
                                status
                              ])
                            } else {
                              setSelectedProductionStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          }}
                          className='w-4 h-4 accent-brand-500'
                        />
                        <span className='text-body-sm text-neutral-900'>
                          {status}
                        </span>
                      </label>
                    ))}
                  {activeTab === 'Presupuestos' &&
                    BUDGET_STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className='flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedBudgetStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBudgetStatuses((prev) => [
                                ...prev,
                                status
                              ])
                            } else {
                              setSelectedBudgetStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          }}
                          className='w-4 h-4 accent-brand-500'
                        />
                        <span className='text-body-sm text-neutral-900'>
                          {status}
                        </span>
                      </label>
                    ))}
                  {activeTab === 'Facturas' &&
                    INVOICE_STATUS_OPTIONS.map((status) => (
                      <label
                        key={status}
                        className='flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={selectedInvoiceStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceStatuses((prev) => [
                                ...prev,
                                status
                              ])
                            } else {
                              setSelectedInvoiceStatuses((prev) =>
                                prev.filter((s) => s !== status)
                              )
                            }
                          }}
                          className='w-4 h-4 accent-brand-500'
                        />
                        <span className='text-body-sm text-neutral-900'>
                          {status}
                        </span>
                      </label>
                    ))}
                </div>
              )}
            </div>

            {/* Professional Filter (not for Facturas) */}
            {activeTab !== 'Facturas' && (
              <div className='relative' data-filter-dropdown>
                <button
                  type='button'
                  onClick={() => {
                    setShowProfessionalDropdown(!showProfessionalDropdown)
                    setShowStatusDropdown(false)
                    setShowInsurerDropdown(false)
                    setShowPaymentMethodDropdown(false)
                    setShowDateRangeDropdown(false)
                  }}
                  className={[
                    'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                    selectedProfessional
                      ? 'bg-brand-100 border border-brand-500 text-brand-700'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  ].join(' ')}
                >
                  <span>
                    {selectedProfessional || 'Profesional'}
                  </span>
                  <KeyboardArrowDownRounded className='size-4' />
                </button>
                {showProfessionalDropdown && (
                  <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedProfessional('')
                        setShowProfessionalDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-body-sm text-neutral-600 hover:bg-neutral-50'
                    >
                      Todos
                    </button>
                    {professionals.map((prof) => (
                      <button
                        key={prof}
                        type='button'
                        onClick={() => {
                          setSelectedProfessional(prof)
                          setShowProfessionalDropdown(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50',
                          selectedProfessional === prof
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-neutral-900'
                        ].join(' ')}
                      >
                        {prof}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insurer Filter (not for Producción) */}
            {activeTab !== 'Producción' && (
              <div className='relative' data-filter-dropdown>
                <button
                  type='button'
                  onClick={() => {
                    setShowInsurerDropdown(!showInsurerDropdown)
                    setShowStatusDropdown(false)
                    setShowProfessionalDropdown(false)
                    setShowPaymentMethodDropdown(false)
                    setShowDateRangeDropdown(false)
                  }}
                  className={[
                    'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                    selectedInsurer
                      ? 'bg-brand-100 border border-brand-500 text-brand-700'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  ].join(' ')}
                >
                  <span>{selectedInsurer || 'Aseguradora'}</span>
                  <KeyboardArrowDownRounded className='size-4' />
                </button>
                {showInsurerDropdown && (
                  <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedInsurer('')
                        setShowInsurerDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-body-sm text-neutral-600 hover:bg-neutral-50'
                    >
                      Todas
                    </button>
                    {insurers.map((ins) => (
                      <button
                        key={ins}
                        type='button'
                        onClick={() => {
                          setSelectedInsurer(ins)
                          setShowInsurerDropdown(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50',
                          selectedInsurer === ins
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-neutral-900'
                        ].join(' ')}
                      >
                        {ins}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Filter (Facturas only) */}
            {activeTab === 'Facturas' && (
              <div className='relative' data-filter-dropdown>
                <button
                  type='button'
                  onClick={() => {
                    setShowPaymentMethodDropdown(!showPaymentMethodDropdown)
                    setShowStatusDropdown(false)
                    setShowProfessionalDropdown(false)
                    setShowInsurerDropdown(false)
                    setShowDateRangeDropdown(false)
                  }}
                  className={[
                    'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                    selectedPaymentMethod
                      ? 'bg-brand-100 border border-brand-500 text-brand-700'
                      : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                  ].join(' ')}
                >
                  <span>{selectedPaymentMethod || 'Método pago'}</span>
                  <KeyboardArrowDownRounded className='size-4' />
                </button>
                {showPaymentMethodDropdown && (
                  <div className='absolute right-0 top-10 z-50 w-48 bg-white rounded-lg border border-neutral-200 shadow-lg py-2'>
                    <button
                      type='button'
                      onClick={() => {
                        setSelectedPaymentMethod('')
                        setShowPaymentMethodDropdown(false)
                      }}
                      className='w-full text-left px-3 py-2 text-body-sm text-neutral-600 hover:bg-neutral-50'
                    >
                      Todos
                    </button>
                    {paymentMethods.map((method) => (
                      <button
                        key={method}
                        type='button'
                        onClick={() => {
                          setSelectedPaymentMethod(method)
                          setShowPaymentMethodDropdown(false)
                        }}
                        className={[
                          'w-full text-left px-3 py-2 text-body-sm hover:bg-neutral-50',
                          selectedPaymentMethod === method
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-neutral-900'
                        ].join(' ')}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Date Range Filter */}
            <div className='relative' data-filter-dropdown>
              <button
                type='button'
                onClick={() => {
                  setShowDateRangeDropdown(!showDateRangeDropdown)
                  setShowStatusDropdown(false)
                  setShowProfessionalDropdown(false)
                  setShowInsurerDropdown(false)
                  setShowPaymentMethodDropdown(false)
                }}
                className={[
                  'flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm cursor-pointer transition-colors',
                  dateFrom || dateTo
                    ? 'bg-brand-100 border border-brand-500 text-brand-700'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                ].join(' ')}
              >
                <CalendarMonthRounded className='size-4' />
                <span>
                  {dateFrom || dateTo
                    ? `${dateFrom ? dateFrom.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '...'} - ${dateTo ? dateTo.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '...'}`
                    : 'Fechas'}
                </span>
                <KeyboardArrowDownRounded className='size-4' />
              </button>
              {showDateRangeDropdown && (
                <div className='absolute right-0 top-10 z-50 w-72 bg-white rounded-lg border border-neutral-200 shadow-lg p-4'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-col gap-1'>
                      <label className='text-body-sm text-neutral-600'>
                        Desde
                      </label>
                      <input
                        type='date'
                        value={
                          dateFrom
                            ? dateFrom.toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          setDateFrom(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className='h-10 px-3 rounded-lg border border-neutral-300 text-body-sm'
                      />
                    </div>
                    <div className='flex flex-col gap-1'>
                      <label className='text-body-sm text-neutral-600'>
                        Hasta
                      </label>
                      <input
                        type='date'
                        value={
                          dateTo ? dateTo.toISOString().split('T')[0] : ''
                        }
                        onChange={(e) =>
                          setDateTo(
                            e.target.value ? new Date(e.target.value) : null
                          )
                        }
                        className='h-10 px-3 rounded-lg border border-neutral-300 text-body-sm'
                      />
                    </div>
                    <div className='flex justify-between pt-2'>
                      <button
                        type='button'
                        onClick={() => {
                          setDateFrom(null)
                          setDateTo(null)
                        }}
                        className='text-body-sm text-neutral-600 hover:text-neutral-900'
                      >
                        Limpiar
                      </button>
                      <button
                        type='button'
                        onClick={() => setShowDateRangeDropdown(false)}
                        className='px-3 py-1 rounded-full bg-brand-500 text-body-sm text-brand-900'
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                type='button'
                onClick={clearAllFilters}
                className='flex items-center gap-1 h-8 px-3 py-1 rounded-full text-body-sm text-error-600 border border-error-300 hover:bg-error-50 cursor-pointer transition-colors'
              >
                <CloseRounded className='size-4' />
                <span>Limpiar</span>
              </button>
            )}

            {/* Results count indicator */}
            {hasActiveFilters && (
              <span className='text-body-sm text-neutral-500 ml-2'>
                {activeTab === 'Presupuestos' &&
                  `${filteredBudgetRows.length} de ${budgetRows.length}`}
                {activeTab === 'Producción' &&
                  `${filteredProductionRows.length} de ${productionRows.length}`}
                {activeTab === 'Facturas' &&
                  `${filteredInvoiceRows.length} de ${invoiceRows.length}`}
              </span>
            )}
          </div>
        </div>

        {/* Table Container - PRESUPUESTOS */}
        {activeTab === 'Presupuestos' && (
          <div
            className='absolute left-8 top-[7.4375rem] w-[65.25rem]'
            data-node-id='3092:10352'
          >
            {/* Table Header */}
            <div className='flex items-center border-b border-neutral-300'>
              <div
                className={`${BUDGET_COL_ID} px-2 py-1 text-body-md text-neutral-600`}
              >
                ID
              </div>
              <div
                className={`${BUDGET_COL_DESC} px-2 py-1 text-body-md text-neutral-600`}
              >
                Descripción
              </div>
              <div
                className={`${BUDGET_COL_MONTO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Monto
              </div>
              <div
                className={`${BUDGET_COL_FECHA} px-2 py-1 text-body-md text-neutral-600`}
              >
                Fecha
              </div>
              <div
                className={`${BUDGET_COL_ESTADO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Estado
              </div>
              <div
                className={`${BUDGET_COL_PROFESIONAL} px-2 py-1 text-body-md text-neutral-600`}
              >
                Profesional
              </div>
              <div
                className={`${BUDGET_COL_INSURER} px-2 py-1 text-body-md text-neutral-600`}
              >
                Aseguradora
              </div>
            </div>

            {/* Table Body */}
            <div className='max-h-[24.5rem] overflow-y-auto'>
              {filteredBudgetRows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <SearchRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No se encontraron presupuestos</p>
                  {hasActiveFilters && (
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-2 text-body-sm text-brand-600 hover:underline'
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredBudgetRows.map((row) => (
                <div
                  key={row.id}
                  className='flex items-center border-b border-neutral-300 h-10 group'
                >
                  <div
                    className={`${BUDGET_COL_ID} px-2 text-body-md font-semibold text-brand-700`}
                  >
                    {row.id}
                  </div>
                  <div
                    className={`${BUDGET_COL_DESC} px-2 text-body-md text-neutral-900`}
                  >
                    {row.description}
                  </div>
                  <div
                    className={`${BUDGET_COL_MONTO} px-2 text-body-md text-neutral-900`}
                  >
                    {row.amount}
                  </div>
                  <div
                    className={`${BUDGET_COL_FECHA} px-2 text-body-md text-neutral-900`}
                  >
                    {row.date}
                  </div>
                  <div className={`${BUDGET_COL_ESTADO} px-2`}>
                    <BudgetStatusBadge
                      status={row.status}
                      rowId={row.id}
                      onStatusChange={handleBudgetStatusChange}
                    />
                  </div>
                  <div
                    className={`${BUDGET_COL_PROFESIONAL} px-2 text-body-md text-neutral-900`}
                  >
                    {row.professional}
                  </div>
                  <div
                    className={`${BUDGET_COL_INSURER} px-2 text-body-md text-neutral-900`}
                  >
                    {row.insurer}
                  </div>
                  {/* More actions menu */}
                  <div className='ml-auto'>
                    <BudgetActionsMenu
                      rowId={row.id}
                      status={row.status}
                      onAction={handleBudgetAction}
                    />
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* Table Container - PRODUCCIÓN */}
        {activeTab === 'Producción' && (
          <div
            className='absolute left-8 top-[7.4375rem] w-[65.25rem]'
            data-node-id='3092:10838'
          >
            {/* Table Header */}
            <div className='flex items-center border-b border-neutral-300'>
              <div
                className={`${PROD_COL_FECHA} px-2 py-1 text-body-md text-neutral-600`}
              >
                Fecha
              </div>
              <div
                className={`${PROD_COL_DESC} px-2 py-1 text-body-md text-neutral-600`}
              >
                Descripción
              </div>
              <div
                className={`${PROD_COL_MONTO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Monto
              </div>
              <div
                className={`${PROD_COL_ESTADO} px-2 py-1 text-body-md text-neutral-600`}
              >
                Estado
              </div>
              <div
                className={`${PROD_COL_PROFESIONAL} px-2 py-1 text-body-md text-neutral-600`}
              >
                Profesional
              </div>
              <div
                className={`${PROD_COL_ID} px-2 py-1 text-body-md text-neutral-600`}
              >
                ID
              </div>
            </div>

            {/* Table Body */}
            <div className='max-h-[24.5rem] overflow-y-auto'>
              {filteredProductionRows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <SearchRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No se encontraron producciones</p>
                  {hasActiveFilters && (
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-2 text-body-sm text-brand-600 hover:underline'
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredProductionRows.map((row) => (
                <div
                  key={row.id}
                  className='flex items-center border-b border-neutral-300 h-10 group'
                >
                  <div
                    className={`${PROD_COL_FECHA} px-2 text-body-md text-neutral-900`}
                  >
                    {row.date}
                  </div>
                  <div
                    className={`${PROD_COL_DESC} px-2 text-body-md text-neutral-900`}
                  >
                    {row.description}
                  </div>
                  <div
                    className={`${PROD_COL_MONTO} px-2 text-body-md text-neutral-900`}
                  >
                    {row.amount}
                  </div>
                  <div className={`${PROD_COL_ESTADO} px-2`}>
                    <StatusBadge
                      status={row.status}
                      rowId={row.id}
                      onStatusChange={handleProductionStatusChange}
                    />
                  </div>
                  <div
                    className={`${PROD_COL_PROFESIONAL} px-2 text-body-md text-neutral-900`}
                  >
                    {row.professional}
                  </div>
                  <div
                    className={`${PROD_COL_ID} px-2 text-body-md font-semibold text-brand-700`}
                  >
                    {row.id}
                  </div>
                  {/* More actions menu */}
                  <div className='ml-auto'>
                    <ActionsMenu
                      rowId={row.id}
                      status={row.status}
                      onAction={handleProductionAction}
                    />
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* Table Container - FACTURAS */}
        {activeTab === 'Facturas' && (
          <div
            className='absolute left-8 top-[7.4375rem] w-[65.25rem]'
            data-node-id='facturas-table'
          >
            {/* Column widths from Figma */}
            {/* ID: 96px = 6rem, Desc: 310px = 19.375rem, Monto: 110px = 6.875rem */}
            {/* Fecha: 113px = 7.0625rem, Estado: 122px = 7.625rem */}
            {/* Método: 145px = 9.0625rem, Aseguradora: 149px = 9.3125rem */}

            {/* Table Header */}
            <div className='flex items-center border-b border-neutral-300'>
              <div className='w-[6rem] px-2 py-1 text-body-md text-neutral-600'>
                ID
              </div>
              <div className='w-[19.375rem] px-2 py-1 text-body-md text-neutral-600'>
                Descripción
              </div>
              <div className='w-[6.875rem] px-2 py-1 text-body-md text-neutral-600'>
                Monto
              </div>
              <div className='w-[7.0625rem] px-2 py-1 text-body-md text-neutral-600'>
                Fecha fact.
              </div>
              <div className='w-[7.625rem] px-2 py-1 text-body-md text-neutral-600'>
                Estado cobro
              </div>
              <div className='w-[9.0625rem] px-2 py-1 text-body-md text-neutral-600'>
                Método pago
              </div>
              <div className='w-[9.3125rem] px-2 py-1 text-body-md text-neutral-600'>
                Aseguradora
              </div>
            </div>

            {/* Table Body */}
            <div className='max-h-[24.5rem] overflow-y-auto'>
              {filteredInvoiceRows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-neutral-500'>
                  <SearchRounded className='size-12 mb-3 opacity-30' />
                  <p className='text-body-md'>No se encontraron facturas</p>
                  {hasActiveFilters && (
                    <button
                      type='button'
                      onClick={clearAllFilters}
                      className='mt-2 text-body-sm text-brand-600 hover:underline'
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredInvoiceRows.map((row) => (
                <div
                  key={row.id}
                  className='flex items-center border-b border-neutral-300 h-10 group'
                >
                  <div className='w-[6rem] px-2 text-body-md text-neutral-900'>
                    {row.id}
                  </div>
                  <div className='w-[19.375rem] px-2 text-body-md text-neutral-900'>
                    {row.description}
                  </div>
                  <div className='w-[6.875rem] px-2 text-body-md text-neutral-900'>
                    {row.amount}
                  </div>
                  <div className='w-[7.0625rem] px-2 text-body-md text-neutral-900'>
                    {row.date}
                  </div>
                  <div className='w-[7.625rem] px-2'>
                    <InvoiceStatusBadge
                      status={row.status}
                      rowId={row.id}
                      onStatusChange={handleInvoiceStatusChange}
                    />
                  </div>
                  <div className='w-[9.0625rem] px-2 text-body-md text-neutral-900'>
                    {row.paymentMethod}
                  </div>
                  <div className='w-[9.3125rem] px-2 text-body-md text-neutral-900'>
                    {row.insurer}
                  </div>
                  {/* More actions menu */}
                  <div className='ml-auto'>
                    <InvoiceActionsMenu
                      rowId={row.id}
                      status={row.status}
                      onAction={handleInvoiceAction}
                    />
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div
          className='absolute bottom-2 right-8 inline-flex items-center gap-3 text-neutral-900'
          data-node-id='3092:10818'
        >
          <div className='inline-flex items-center'>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Primera página'
            >
              <FirstPageRounded className='size-6' />
            </button>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Página anterior'
            >
              <ChevronLeftRounded className='size-6' />
            </button>
          </div>
          <div
            className='inline-flex items-center gap-2 text-body-sm'
            data-node-id='3092:10826'
          >
            <span className='underline font-bold'>1</span>
            <span>2</span>
            <span>...</span>
            <span>12</span>
          </div>
          <div className='inline-flex items-center'>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Página siguiente'
            >
              <ChevronRightRounded className='size-6' />
            </button>
            <button
              type='button'
              className='cursor-pointer hover:text-neutral-600 transition-colors'
              aria-label='Última página'
            >
              <LastPageRounded className='size-6' />
            </button>
          </div>
        </div>
      </div>

      <ProposalCreationModal
        open={showProposalModal}
        onClose={() => setShowProposalModal(false)}
      />
      <QuickBudgetModal
        open={showQuickBudgetModal}
        onClose={() => setShowQuickBudgetModal(false)}
        onContinue={(selection) => {
          setQuickBudgetSelection(selection)
          setShowQuickBudgetModal(false)
          setShowProposalModal(true)
        }}
        patientName={displayPatientName}
      />
      <AddProductionModal
        open={showAddProductionModal}
        onClose={() => setShowAddProductionModal(false)}
        onSubmit={(data) => {
          console.log('New production:', data)
          // Here you would add the new production to the list
          setShowAddProductionModal(false)
        }}
      />
      <MarkAsProducedModal
        open={showMarkAsProducedModal}
        onClose={() => {
          setShowMarkAsProducedModal(false)
          setSelectedProductionRow(null)
        }}
        onSubmit={(data) => {
          console.log('Mark as produced:', data)
          if (selectedProductionRow) {
            // Format the selected date or use today as fallback
            const formattedDate = data.productionDate
              ? data.productionDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })
              : new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })

            // 1. Update the production row: set date and change status to "Producido"
            setProductionRows((prevRows) =>
              prevRows.map((row) =>
                row.id === selectedProductionRow.id
                  ? {
                      ...row,
                      status: 'Producido' as StatusType,
                      date: formattedDate,
                      professional:
                        data.professional === 'dr-guillermo'
                          ? 'Dr. Guillermo'
                          : data.professional === 'dra-andrea'
                          ? 'Dra. Andrea'
                          : row.professional
                    }
                  : row
              )
            )
          }
          setShowMarkAsProducedModal(false)
          setSelectedProductionRow(null)
        }}
        budgetCode={selectedProductionRow?.id ?? ''}
        treatment={selectedProductionRow?.description ?? ''}
        amount={selectedProductionRow?.amount ?? ''}
      />
      <InvoiceProductionModal
        open={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setSelectedProductionRow(null)
        }}
        onSubmit={(data) => {
          console.log('Invoice production:', data)
          if (selectedProductionRow) {
            // Format the selected date or use today as fallback
            const formattedDate = data.invoiceDate
              ? data.invoiceDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })
              : new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })

            // 1. Change production status to "Facturado"
            handleProductionStatusChange(selectedProductionRow.id, 'Facturado')

            // 2. Create new invoice with status "Pendiente"
            const newInvoice: InvoiceRow = {
              id: data.invoiceNumber,
              description: selectedProductionRow.description,
              amount: selectedProductionRow.amount,
              date: formattedDate,
              status: 'Pendiente',
              paymentMethod: '',
              insurer: ''
            }
            setInvoiceRows((prev) => [newInvoice, ...prev])
          }
          setShowInvoiceModal(false)
          setSelectedProductionRow(null)
        }}
        treatment={selectedProductionRow?.description ?? ''}
        productionDate={selectedProductionRow?.date ?? ''}
        amount={selectedProductionRow?.amount ?? ''}
      />
      <RegisterPaymentModal
        open={showRegisterPaymentModal}
        onClose={() => {
          setShowRegisterPaymentModal(false)
          setSelectedInvoiceRow(null)
        }}
        onSubmit={(data) => {
          console.log('Register payment:', data)
          if (selectedInvoiceRow) {
            // Update the invoice: change status to "Cobrado" and set payment method
            setInvoiceRows((prevRows) =>
              prevRows.map((row) =>
                row.id === selectedInvoiceRow.id
                  ? {
                      ...row,
                      status: 'Cobrado' as InvoiceStatusType,
                      paymentMethod:
                        data.paymentMethod === 'efectivo'
                          ? 'Efectivo'
                          : data.paymentMethod === 'tarjeta'
                          ? 'Tarjeta'
                          : data.paymentMethod === 'transferencia'
                          ? 'Transferencia'
                          : row.paymentMethod
                    }
                  : row
              )
            )
          }
          setShowRegisterPaymentModal(false)
          setSelectedInvoiceRow(null)
        }}
        invoiceId={selectedInvoiceRow?.id ?? ''}
        treatment={selectedInvoiceRow?.description ?? ''}
        amount={selectedInvoiceRow?.amount ?? ''}
      />
      <TraceabilityModal
        open={showTraceabilityModal}
        onClose={() => {
          setShowTraceabilityModal(false)
          setSelectedInvoiceRow(null)
        }}
        invoiceId={selectedInvoiceRow?.id ?? ''}
        treatment={selectedInvoiceRow?.description ?? ''}
        amount={selectedInvoiceRow?.amount ?? ''}
        invoiceDate={selectedInvoiceRow?.date ?? ''}
        invoiceStatus={selectedInvoiceRow?.status ?? ''}
        paymentMethod={selectedInvoiceRow?.paymentMethod ?? ''}
        insurer={selectedInvoiceRow?.insurer ?? ''}
      />
    </div>
  )
}
