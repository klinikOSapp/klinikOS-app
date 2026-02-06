'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import React from 'react'
import { createPortal } from 'react-dom'

export type QuickActionsSectionProps = {
  showPaymentAction: boolean
  paymentAmount?: string
  onPaymentClick: () => void
  onViewPatientClick: () => void
  // Nuevos props para pagos de presupuestos fraccionados
  hasBudgetInstallments?: boolean
  budgetInstallmentsCount?: number
  onBudgetPaymentClick?: () => void
}

export default function QuickActionsSection({
  showPaymentAction,
  paymentAmount,
  onPaymentClick,
  onViewPatientClick,
  hasBudgetInstallments = false,
  budgetInstallmentsCount = 0,
  onBudgetPaymentClick
}: QuickActionsSectionProps) {
  const [showPaymentMenu, setShowPaymentMenu] = React.useState(false)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Determinar si mostrar menú desplegable (cuando hay ambos tipos de pago)
  const showDropdown = showPaymentAction && hasBudgetInstallments && onBudgetPaymentClick

  // Cerrar menú al hacer clic fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPaymentMenu(false)
      }
    }
    if (showPaymentMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPaymentMenu])

  const handlePaymentButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (showDropdown) {
      // Mostrar menú desplegable
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setMenuPosition({
          top: rect.top - 100, // Posicionar arriba del botón
          left: rect.left
        })
      }
      setShowPaymentMenu(!showPaymentMenu)
    } else if (hasBudgetInstallments && onBudgetPaymentClick && !showPaymentAction) {
      // Solo pagos de presupuesto
      onBudgetPaymentClick()
    } else {
      // Solo pago de cita
      onPaymentClick()
    }
  }

  // Determinar si mostrar el botón de cobrar
  const showCobrarButton = showPaymentAction || (hasBudgetInstallments && onBudgetPaymentClick)

  // Determinar el texto del botón
  const getButtonText = () => {
    if (showDropdown) {
      return 'Cobrar'
    }
    if (hasBudgetInstallments && !showPaymentAction) {
      return `Cobrar cuotas (${budgetInstallmentsCount})`
    }
    return paymentAmount ? `Cobrar ${paymentAmount}` : 'Cobrar'
  }

  return (
    <div className='flex items-start gap-[var(--scheduler-overlay-icon-gap)]'>
      <span
        aria-hidden='true'
        className='flex shrink-0 items-center justify-center text-[var(--scheduler-overlay-icon-size)]'
        style={{
          width: 'var(--scheduler-overlay-icon-size)',
          height: 'var(--scheduler-overlay-icon-size)'
        }}
      >
        <MD3Icon
          name='AppsRounded'
          size='inherit'
          className='text-[var(--color-neutral-600)]'
        />
      </span>
      <div
        className='flex flex-1 flex-col'
        style={{ gap: 'var(--scheduler-overlay-value-gap)' }}
      >
        <span className='text-xs font-normal text-[var(--color-neutral-600)] leading-4'>
          Acciones rápidas
        </span>
        <div className='grid grid-cols-2 gap-2'>
          {/* Botón Ver ficha - siempre visible */}
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              onViewPatientClick()
            }}
            className='flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-neutral-100)] px-4 py-2 text-[var(--color-neutral-900)] transition-all hover:brightness-95 active:brightness-90'
          >
            <MD3Icon name='FolderOpenRounded' size={1} />
            <span className='text-sm font-medium'>Ver ficha</span>
          </button>

          {/* Botón Cobrar - con soporte para menú desplegable */}
          {showCobrarButton && (
            <button
              ref={buttonRef}
              type='button'
              onClick={handlePaymentButtonClick}
              className='flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-500)] px-4 py-2 text-[var(--color-brand-900)] transition-all hover:brightness-95 active:brightness-90'
            >
              <MD3Icon name='PaymentsRounded' size={1} />
              <span className='text-sm font-medium'>{getButtonText()}</span>
              {showDropdown && (
                <MD3Icon 
                  name={showPaymentMenu ? 'KeyboardArrowUpRounded' : 'KeyboardArrowDownRounded'} 
                  size={1} 
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Menú desplegable para seleccionar tipo de pago */}
      {showPaymentMenu &&
        showDropdown &&
        createPortal(
          <div
            ref={menuRef}
            className='fixed z-[9999] w-56 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden'
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
          >
            <div className='p-2'>
              <p className='text-xs font-medium text-neutral-500 px-3 py-1'>
                ¿Qué desea cobrar?
              </p>
              
              {/* Opción: Cobrar cita */}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPaymentMenu(false)
                  onPaymentClick()
                }}
                className='w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 cursor-pointer text-left'
              >
                <MD3Icon name='ReceiptLongRounded' size={1.25} className='text-neutral-600' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-neutral-900'>Cobrar cita</p>
                  <p className='text-xs text-neutral-500'>
                    {paymentAmount || 'Pago pendiente de la cita'}
                  </p>
                </div>
              </button>

              {/* Opción: Cobrar cuotas de presupuesto */}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  setShowPaymentMenu(false)
                  onBudgetPaymentClick?.()
                }}
                className='w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-50 cursor-pointer text-left'
              >
                <MD3Icon name='PaymentsRounded' size={1.25} className='text-neutral-600' />
                <div className='flex-1'>
                  <p className='text-sm font-medium text-neutral-900'>Cobrar cuotas</p>
                  <p className='text-xs text-neutral-500'>
                    {budgetInstallmentsCount} cuota{budgetInstallmentsCount !== 1 ? 's' : ''} pendiente{budgetInstallmentsCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
