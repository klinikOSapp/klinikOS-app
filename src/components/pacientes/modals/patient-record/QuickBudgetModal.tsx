'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import CloseRounded from '@mui/icons-material/CloseRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import {
  MODAL_HEIGHT_REM,
  MODAL_SCALE_FORMULA,
  MODAL_WIDTH_REM
} from './modalDimensions'

const ICON_LIMPIEZA =
  'http://localhost:3845/assets/4c269db2b8ed63791dd98cf8b079fc9359dd0e6c.svg'
const ICON_EXTRACCION =
  'http://localhost:3845/assets/5c09e3b557c4a0e42e1a603d8ffe987c1d2fcfce.svg'
const ICON_BLANQUEO =
  'http://localhost:3845/assets/7f9762c3af725864ea6af036da6fed06ac1b17a7.svg'
const ICON_REVISION =
  'http://localhost:3845/assets/5263d00db0ab1a7b877ddc5b338259512b827923.svg'

export type QuickBudgetOption = {
  id: string
  label: string
  amount: string
  icon: string
}

const OPTIONS: QuickBudgetOption[] = [
  { id: 'limpieza', label: 'Limpieza', amount: '60€', icon: ICON_LIMPIEZA },
  { id: 'extraccion', label: 'Extracción', amount: '120€', icon: ICON_EXTRACCION },
  { id: 'blanqueo', label: 'Blanqueo', amount: '180€', icon: ICON_BLANQUEO },
  { id: 'revision', label: 'Revisión', amount: 'GRATIS', icon: ICON_REVISION }
]

type QuickBudgetModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: (selection: QuickBudgetOption) => void
}

type ModalStep = 'select' | 'details'

const QuickBudgetModal = ({
  open,
  onClose,
  onContinue
}: QuickBudgetModalProps) => {
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<ModalStep>('select')
  const [selectedId, setSelectedId] = React.useState<string>('blanqueo')

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

  React.useEffect(() => {
    if (!open) return
    setStep('select')
    setSelectedId('blanqueo')
  }, [open])

  if (!open || !mounted) return null

  const selectedOption =
    OPTIONS.find((option) => option.id === selectedId) ?? OPTIONS[2]

  const handleSelectionContinue = () => {
    if (!selectedOption) return
    setStep('details')
  }

  const handleConfirm = () => {
    if (!selectedOption) return
    onContinue?.(selectedOption)
  }

  const renderSelectionStep = () => (
    <>
      <p
        className='absolute text-title-lg text-neutral-900'
        style={{ left: '14.3125rem', top: '6rem' }}
      >
        Selección del plan
      </p>
      {OPTIONS.map((option, index) => {
        const top = 10 + index * 5
        const isSelected = option.id === selectedId
        return (
          <button
            key={option.id}
            type='button'
            className={[
              'absolute flex h-[4rem] w-[31.5rem] items-center justify-between rounded-[0.25rem] border px-[1.5rem] py-[1rem] text-left transition-colors',
              isSelected
                ? 'border-brand-500 bg-brand-50/40'
                : 'border-neutral-300 bg-neutral-50 hover:border-brand-300 hover:bg-brand-100'
            ].join(' ')}
            style={{ left: '18.375rem', top: `${top}rem` }}
            onClick={() => setSelectedId(option.id)}
            aria-pressed={isSelected}
          >
            <span className='inline-flex items-center gap-[0.25rem]'>
              <img
                src={option.icon}
                alt=''
                className='size-[1.5rem]'
                aria-hidden='true'
              />
              <span className='text-title-sm text-neutral-900'>
                {option.label}
              </span>
            </span>
            <span className='text-title-lg text-neutral-900'>
              {option.amount}
            </span>
          </button>
        )
      })}
      <div
        className='absolute border-t border-neutral-300'
        style={{ left: '18.375rem', top: '53.25rem', width: '31.5rem' }}
      />
      <button
        type='button'
        onClick={handleSelectionContinue}
        className='absolute flex items-center justify-center gap-2 rounded-[8.5rem] border border-brand-500 bg-brand-500 px-4 py-2 text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
        style={{
          left: '36.4375rem',
          top: '55.75rem',
          width: '13.4375rem'
        }}
      >
        Continuar
        <ArrowForwardRounded className='size-5' />
      </button>
    </>
  )

  const renderDetailsStep = () => (
    <>
      <div
        className='absolute flex items-center justify-between'
        style={{
          left: '14.3125rem',
          top: '6rem',
          width: '35.5rem'
        }}
      >
        <p className='text-title-lg text-neutral-900'>{selectedOption.label}</p>
        <p className='text-title-lg text-neutral-900'>{selectedOption.amount}</p>
      </div>

      <p
        className='absolute text-body-md text-neutral-900'
        style={{ left: '18.375rem', top: '10.5rem' }}
      >
        Profesional
      </p>
      <div
        className='absolute flex h-[3rem] w-[19.1875rem] items-center justify-between rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem]'
        style={{ left: '30.6875rem', top: '10.5rem' }}
      >
        <span className='text-body-md text-neutral-400'>Value</span>
        <KeyboardArrowDownRounded className='text-neutral-500' />
      </div>
      <span
        className='absolute text-error-600'
        style={{ left: '51.125rem', top: '11.625rem' }}
      >
        *
      </span>

      <p
        className='absolute text-body-md text-neutral-900'
        style={{ left: '18.375rem', top: '16rem' }}
      >
        Descuento
      </p>
      <div
        className='absolute w-[19.1875rem]'
        style={{ left: '30.6875rem', top: '16rem' }}
      >
        <p className='text-body-sm text-neutral-900'>General</p>
        <div className='mt-[0.5rem] flex h-[3rem] items-center justify-between rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem]'>
          <span className='text-body-md text-neutral-400'>Sin descuento</span>
          <KeyboardArrowDownRounded className='text-neutral-500' />
        </div>
        <p className='mt-[0.25rem] text-[0.6875rem] font-medium leading-4 text-neutral-600'>
          Texto descriptivo
        </p>
      </div>

      <div
        className='absolute w-[19.1875rem]'
        style={{ left: '30.6875rem', top: '22.75rem' }}
      >
        <p className='text-body-sm text-neutral-900'>Motivo</p>
        <div className='mt-[0.5rem] h-[5rem] rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem]'>
          <span className='text-body-md text-neutral-400'>Value</span>
        </div>
        <p className='mt-[0.25rem] text-[0.6875rem] font-medium leading-4 text-neutral-600'>
          Texto descriptivo
        </p>
      </div>

      <div
        className='absolute border-t border-neutral-300'
        style={{ left: '18.375rem', top: '53.25rem', width: '31.5rem' }}
      />

      <button
        type='button'
        onClick={() => setStep('select')}
        className='absolute flex items-center justify-center gap-2 rounded-[8.5rem] border border-neutral-300 bg-neutral-50 px-4 py-2 text-body-md font-medium text-neutral-900 transition-colors hover:bg-brand-100'
        style={{
          left: '18.375rem',
          top: '55.75rem',
          width: '13.4375rem'
        }}
      >
        <ArrowBackRounded className='size-5 text-neutral-900' />
        Cancelar
      </button>

      <button
        type='button'
        onClick={handleConfirm}
        className='absolute flex items-center justify-center gap-2 rounded-[8.5rem] border border-brand-500 bg-brand-500 px-4 py-2 text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
        style={{
          left: '36.4375rem',
          top: '55.75rem',
          width: '13.4375rem'
        }}
      >
        Crear y cobrar
        <ArrowForwardRounded className='size-5' />
      </button>
    </>
  )

  const modalFrameStyle = {
    '--modal-scale': MODAL_SCALE_FORMULA,
    width: `min(92vw, calc(${MODAL_WIDTH_REM}rem * var(--modal-scale)))`,
    height: `min(85vh, calc(${MODAL_HEIGHT_REM}rem * var(--modal-scale)))`
  } as React.CSSProperties

  const modalContentStyle = {
    width: `${MODAL_WIDTH_REM}rem`,
    height: `${MODAL_HEIGHT_REM}rem`,
    transform: 'scale(var(--modal-scale))',
    transformOrigin: 'top left'
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
          aria-label='Creación de presupuesto rápido'
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className='relative flex shrink-0 items-start justify-center'
            style={modalFrameStyle}
          >
            <div className='relative h-full w-full overflow-hidden rounded-[0.5rem] bg-neutral-50'>
              <div
                className='relative w-[68.25rem] h-[60rem]'
                style={modalContentStyle}
              >
                <header className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-neutral-300 px-[2rem]'>
                  <p className='text-title-md text-neutral-900'>
                    Creación de presupuesto rápido
                  </p>
                  <button
                    type='button'
                    onClick={onClose}
                    aria-label='Cerrar presupuesto rápido'
                    className='flex size-[0.875rem] items-center justify-center text-neutral-900'
                  >
                    <CloseRounded fontSize='inherit' />
                  </button>
                </header>

                {step === 'select' ? renderSelectionStep() : renderDetailsStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )

  return createPortal(content, document.body)
}

export { QuickBudgetModal }

