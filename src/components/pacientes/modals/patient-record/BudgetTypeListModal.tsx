'use client'

import { AddRounded, CloseRounded, SearchRounded } from '@/components/icons/md3'
import type { BudgetTypeData } from '@/components/pacientes/shared/budgetTypeData'
import { useConfiguration } from '@/context/ConfigurationContext'
import React from 'react'
import { createPortal } from 'react-dom'

// ============================================
// Modal Dimensions (más pequeño que el modal principal)
// ============================================
const MODAL_WIDTH_REM = 50
const MODAL_HEIGHT_REM = 40

// ============================================
// Types
// ============================================
type BudgetTypeListModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (budgetType: BudgetTypeData) => void
  onCreateNew?: () => void
}

// ============================================
// Table Row Component
// ============================================
function BudgetTypeRow({
  budgetType,
  onClick
}: {
  budgetType: BudgetTypeData
  onClick: () => void
}) {
  return (
    <tr
      className='border-b border-[#E2E7EA] hover:bg-[#E9FBF9] cursor-pointer transition-colors'
      onClick={onClick}
    >
      <td className='px-4 py-3'>
        <div className='flex flex-col'>
          <span className='text-[0.875rem] font-medium text-[#24282C]'>
            {budgetType.name}
          </span>
          <span className='text-[0.75rem] text-[#535C66]'>
            {budgetType.description}
          </span>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <span className='text-[0.875rem] text-[#24282C]'>
          {budgetType.treatments.length}
        </span>
      </td>
      <td className='px-4 py-3 text-right'>
        <span className='text-[0.875rem] font-medium text-[#24282C]'>
          {budgetType.totalPrice.toLocaleString('es-ES')} €
        </span>
      </td>
    </tr>
  )
}

// ============================================
// Main Component
// ============================================
export default function BudgetTypeListModal({
  open,
  onClose,
  onSelect,
  onCreateNew
}: BudgetTypeListModalProps) {
  const { budgetTypes } = useConfiguration()
  const [mounted, setMounted] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  // Reset search when modal opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm('')
    }
  }, [open])

  if (!open || !mounted) return null

  // Filter budget types by search term and only show active ones
  const filteredBudgetTypes = budgetTypes.filter((bt) => {
    const matchesSearch =
      searchTerm === '' ||
      bt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bt.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && bt.isActive
  })

  const modalFrameStyle = {
    width: `min(92vw, ${MODAL_WIDTH_REM}rem)`,
    height: `min(80vh, ${MODAL_HEIGHT_REM}rem)`
  } as React.CSSProperties

  const content = (
    <div
      className='fixed inset-0 z-50 bg-black/30'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-start justify-center p-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Selección de presupuesto tipo'
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className='relative flex shrink-0 items-start justify-center'
            style={modalFrameStyle}
          >
            <div className='relative h-full w-full overflow-hidden overflow-y-auto rounded-[0.5rem] bg-neutral-50 shadow-xl flex flex-col'>
                {/* Header */}
                <header className='flex h-[3.5rem] shrink-0 items-center justify-between border-b border-neutral-300 px-6'>
                  <h2 className='text-title-md text-neutral-900'>
                    Presupuestos tipo
                  </h2>
                  <button
                    type='button'
                    onClick={onClose}
                    aria-label='Cerrar modal'
                    className='flex size-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer'
                  >
                    <CloseRounded className='size-5' />
                  </button>
                </header>

                {/* Search Bar */}
                <div className='flex items-center gap-4 px-6 py-4 border-b border-[#E2E7EA]'>
                  <div className='relative flex-1 max-w-[20rem]'>
                    <SearchRounded className='absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#535C66]' />
                    <input
                      type='text'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder='Buscar presupuesto tipo...'
                      className='w-full h-[2.5rem] pl-10 pr-4 rounded-full border border-[#CBD3D9] bg-white text-[0.875rem] text-[#24282C] placeholder:text-[#8E99A4] outline-none focus:border-[var(--color-brand-500)] transition-colors'
                    />
                  </div>
                  <p className='text-[0.875rem] text-[#535C66]'>
                    {filteredBudgetTypes.length} presupuesto
                    {filteredBudgetTypes.length !== 1 ? 's' : ''} tipo
                    disponible{filteredBudgetTypes.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Table */}
                <div className='flex-1 overflow-auto'>
                  <table className='w-full'>
                    <thead className='bg-[#F8FAFB] sticky top-0 z-10'>
                      <tr className='border-b border-[#CBD3D9]'>
                        <th className='px-4 py-3 text-left text-[0.75rem] font-medium text-[#535C66] uppercase tracking-wide'>
                          Nombre
                        </th>
                        <th className='px-4 py-3 text-center text-[0.75rem] font-medium text-[#535C66] uppercase tracking-wide'>
                          Tratamientos
                        </th>
                        <th className='px-4 py-3 text-right text-[0.75rem] font-medium text-[#535C66] uppercase tracking-wide'>
                          Precio Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBudgetTypes.map((budgetType) => (
                        <BudgetTypeRow
                          key={budgetType.id}
                          budgetType={budgetType}
                          onClick={() => onSelect(budgetType)}
                        />
                      ))}
                    </tbody>
                  </table>

                  {filteredBudgetTypes.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-16 text-center'>
                      <p className='text-[1rem] text-[#535C66]'>
                        No se encontraron presupuestos tipo
                      </p>
                      <p className='text-[0.875rem] text-[#8E99A4] mt-1'>
                        Intenta con otra búsqueda o crea uno nuevo en
                        Configuración
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <footer className='flex items-center justify-between h-[4rem] shrink-0 border-t border-[#E2E7EA] px-6 bg-[#F8FAFB]'>
                  <p className='text-[0.8125rem] text-[#535C66]'>
                    Selecciona un presupuesto tipo para añadirlo al paciente
                  </p>
                  <div className='flex items-center gap-3'>
                    {onCreateNew && (
                      <button
                        type='button'
                        onClick={onCreateNew}
                        className='flex items-center gap-2 px-4 py-2 rounded-full bg-[#51D6C7] text-[0.875rem] font-medium text-[#1E4947] hover:bg-[#3ECBBB] transition-colors cursor-pointer'
                      >
                        <AddRounded className='size-5' />
                        Crear nuevo
                      </button>
                    )}
                    <button
                      type='button'
                      onClick={onClose}
                      className='px-4 py-2 rounded-full border border-[#CBD3D9] bg-white text-[0.875rem] font-medium text-[#24282C] hover:bg-[#F0F2F4] transition-colors cursor-pointer'
                    >
                      Cancelar
                    </button>
                  </div>
                </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export { BudgetTypeListModal }
