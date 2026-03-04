'use client'

/* eslint-disable @next/next/no-img-element */

import {
  ArrowBackRounded,
  ArrowForwardRounded,
  CloseRounded,
  KeyboardArrowDownRounded
} from '@/components/icons/md3'
import { useConfiguration } from '@/context/ConfigurationContext'
import React from 'react'
import { createPortal } from 'react-dom'
import {
  MODAL_HEIGHT_REM,
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

// DISCOUNT_OPTIONS removed - now sourced from ConfigurationContext.discountOptions

export type BudgetTypeOption = {
  id: string
  label: string
  amount: string
  icon: string
}

const OPTIONS: BudgetTypeOption[] = [
  { id: 'limpieza', label: 'Limpieza', amount: '60€', icon: ICON_LIMPIEZA },
  {
    id: 'extraccion',
    label: 'Extracción',
    amount: '120€',
    icon: ICON_EXTRACCION
  },
  { id: 'blanqueo', label: 'Blanqueo', amount: '180€', icon: ICON_BLANQUEO },
  { id: 'revision', label: 'Revisión', amount: 'GRATIS', icon: ICON_REVISION }
]

type BudgetTypeModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: (selection: BudgetTypeOption) => void
  patientName?: string
}

type ModalStep = 'select' | 'details'

type ComboBoxProps = {
  leftRem: number
  topRem: number
  widthRem: number
  value: string
  placeholder: string
  options: string[]
  onChange: (val: string) => void
}

const BudgetTypeModal = ({
  open,
  onClose,
  onContinue,
  patientName
}: BudgetTypeModalProps) => {
  const { professionalNames, discountOptions } = useConfiguration()
  // Nombre del paciente para mostrar (usa prop o mock)
  const displayPatientName = patientName || 'María García López'
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState<ModalStep>('select')
  const [selectedId, setSelectedId] = React.useState<string>('blanqueo')
  const [professional, setProfessional] = React.useState('')
  const [discount, setDiscount] = React.useState('')
  const [reason, setReason] = React.useState('')

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
    setProfessional('')
    setDiscount('')
    setReason('')
  }, [open])

  if (!open || !mounted) return null

  const selectedOption =
    OPTIONS.find((option) => option.id === selectedId) ?? OPTIONS[2]

  const ComboBox = ({
    leftRem,
    topRem,
    widthRem,
    value,
    placeholder,
    options,
    onChange
  }: ComboBoxProps) => {
    const [openCb, setOpenCb] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handle = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setOpenCb(false)
        }
      }
      if (openCb) {
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
      }
      return undefined
    }, [openCb])

    const filtered = options.filter((opt) =>
      value ? opt.toLowerCase().includes(value.toLowerCase()) : true
    )

    return (
      <div
        ref={ref}
        className='absolute'
        style={{
          left: `${leftRem}rem`,
          top: `${topRem}rem`,
          width: `${widthRem}rem`
        }}
      >
        <div className='relative flex items-center rounded-[0.5rem] border border-neutral-300 bg-neutral-50'>
          <input
            type='text'
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpenCb(true)}
            placeholder={placeholder}
            className='w-full h-[3rem] bg-transparent px-[0.625rem] pr-8 text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none'
          />
          <button
            type='button'
            aria-label='Abrir selección'
            onClick={() => setOpenCb((s) => !s)}
            className='absolute right-2 flex items-center justify-center text-neutral-500'
          >
            <KeyboardArrowDownRounded className='text-neutral-500' />
          </button>
        </div>
        {openCb && (
          <div className='absolute z-50 mt-1 w-full max-h-60 overflow-y-auto overflow-x-hidden rounded-[0.5rem] border border-neutral-300 bg-[rgba(248,250,251,0.95)] backdrop-blur-sm shadow-[2px_2px_4px_rgba(0,0,0,0.1)]'>
            {filtered.length === 0 && (
              <div className='px-2 py-2 text-body-md text-neutral-500'>
                Sin resultados
              </div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type='button'
                onClick={() => {
                  onChange(opt)
                  setOpenCb(false)
                }}
                className='w-full px-2 py-2 text-left text-body-md text-neutral-900 hover:bg-brand-50'
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

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
      <div
        className='absolute flex flex-col gap-1'
        style={{ left: '14.3125rem', top: '6rem' }}
      >
        <p className='text-title-lg text-neutral-900'>Selección del plan</p>
        <p className='text-body-md font-medium text-brand-600'>
          Paciente: {displayPatientName}
        </p>
      </div>
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
        <p className='text-title-lg text-neutral-900'>
          {selectedOption.amount}
        </p>
      </div>

      <p
        className='absolute text-body-md text-neutral-900'
        style={{ left: '18.375rem', top: '10.5rem' }}
      >
        Profesional
      </p>
      <ComboBox
        leftRem={30.6875}
        topRem={10.5}
        widthRem={19.1875}
        value={professional}
        placeholder='Value'
        options={professionalNames}
        onChange={setProfessional}
      />
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
        <div className='mt-[0.5rem]'>
          <ComboBox
            leftRem={0}
            topRem={0}
            widthRem={19.1875}
            value={discount}
            placeholder='Sin descuento'
            options={discountOptions}
            onChange={setDiscount}
          />
        </div>
      </div>

      <div
        className='absolute w-[19.1875rem]'
        style={{ left: '30.6875rem', top: '22.75rem' }}
      >
        <p className='text-body-sm text-neutral-900'>Motivo</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='Value'
          className='mt-[0.5rem] h-[5rem] w-full rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem] text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none'
        />
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
    width: `min(92vw, ${MODAL_WIDTH_REM}rem)`,
    height: `min(85vh, ${MODAL_HEIGHT_REM}rem)`
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
          aria-label='Creación de presupuesto tipo'
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className='relative flex shrink-0 items-start justify-center'
            style={modalFrameStyle}
          >
            <div className='relative h-full w-full overflow-hidden overflow-y-auto rounded-[0.5rem] bg-neutral-50'>
                <header className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-neutral-300 px-[2rem]'>
                  <p className='text-title-md text-neutral-900'>
                    Creación de presupuesto tipo
                  </p>
                  <button
                    type='button'
                    onClick={onClose}
                    aria-label='Cerrar presupuesto tipo'
                    className='flex size-[0.875rem] items-center justify-center text-neutral-900'
                  >
                    <CloseRounded fontSize='inherit' />
                  </button>
                </header>

                {step === 'select'
                  ? renderSelectionStep()
                  : renderDetailsStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export { BudgetTypeModal }
