'use client'

import AddRounded from '@mui/icons-material/AddRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CheckBoxOutlineBlankRounded from '@mui/icons-material/CheckBoxOutlineBlankRounded'
import CheckBoxRounded from '@mui/icons-material/CheckBoxRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CloudDownloadRounded from '@mui/icons-material/CloudDownloadRounded'
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
import RadioButtonCheckedRounded from '@mui/icons-material/RadioButtonCheckedRounded'
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded'
import React from 'react'
import OdontogramaModal from './OdontogramaModal'

type ProposalCreationModalProps = {
  open: boolean
  onClose: () => void
}

type StepState = 'current' | 'completed' | 'upcoming'
type StepConnectorTone = 'brand' | 'neutral'

function StepItem({
  label,
  state,
  top,
  connectorTone
}: {
  label: string
  state: StepState
  top: string
  connectorTone: StepConnectorTone
}) {
  const isCurrent = state === 'current'
  const isCompleted = state === 'completed'
  const showConnector = label !== 'Firma'
  const connectorColor =
    connectorTone === 'brand'
      ? 'var(--color-brand-500)'
      : 'var(--color-neutral-300)'
  return (
    <div
      className='absolute left-[2rem] flex h-[3rem] items-start gap-3'
      style={{ top }}
    >
      <div className='relative h-[3rem] w-6'>
        <div className='absolute left-0 top-0 size-6'>
          {isCompleted ? (
            <CheckCircleRounded
              style={{
                width: 24,
                height: 24,
                color: 'var(--color-brand-500)'
              }}
            />
          ) : isCurrent ? (
            <RadioButtonCheckedRounded
              style={{
                width: 24,
                height: 24,
                color: 'var(--color-brand-500)'
              }}
            />
          ) : (
            <RadioButtonUncheckedRounded
              style={{
                width: 24,
                height: 24,
                color: 'var(--color-neutral-900)'
              }}
            />
          )}
        </div>
        {showConnector && (
          <span
            className='absolute left-[0.625rem] top-[1.625rem] block h-[1.375rem] w-[0.125rem]'
            style={{ backgroundColor: connectorColor }}
          />
        )}
      </div>
      <p className='text-title-sm text-neutral-900'>{label}</p>
    </div>
  )
}

function ExampleDropdown({
  top,
  label,
  labelId,
  options,
  placeholder,
  required = false,
  value,
  onValueChange
}: {
  top: string
  label: string
  labelId: string
  options: string[]
  placeholder: string
  required?: boolean
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState('')
  const selectId = React.useId()
  const selectRef = React.useRef<HTMLSelectElement>(null)
  const isControlled = value !== undefined
  const selectValue = isControlled ? value : uncontrolledValue
  const hasSelection = selectValue !== ''

  const openSelect = React.useCallback(() => {
    const node = selectRef.current
    if (!node) return

    const enhancedNode = node as HTMLSelectElement & {
      showPicker?: () => void
    }

    if (typeof enhancedNode.showPicker === 'function') {
      enhancedNode.showPicker()
      return
    }

    node.focus({ preventScroll: true })
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    node.click()
  }, [])

  return (
    <div
      className='absolute flex h-[3rem] w-[19.1875rem] items-center rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem] transition-colors focus-within:border-brand-300 focus-within:bg-brand-100'
      style={{ left: '30.6875rem', top }}
      data-field={label.toLowerCase()}
    >
      <select
        id={selectId}
        name={label.toLowerCase()}
        value={selectValue}
        onChange={(event) => {
          const nextValue = event.target.value
          if (!isControlled) setUncontrolledValue(nextValue)
          onValueChange?.(nextValue)
        }}
        className={[
          'h-full flex-1 cursor-pointer appearance-none bg-transparent pr-[2.5rem] text-body-md outline-none',
          hasSelection ? 'text-neutral-900' : 'text-neutral-400'
        ].join(' ')}
        aria-labelledby={labelId}
        aria-required={required}
        required={required}
        ref={selectRef}
      >
        <option value=''>{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button
        type='button'
        aria-label={`Abrir selector de ${label.toLowerCase()}`}
        onMouseDown={(event) => {
          event.preventDefault()
          openSelect()
        }}
        onClick={(event) => {
          event.preventDefault()
          openSelect()
        }}
        className='ml-[0.5rem] inline-flex size-[1.5rem] shrink-0 items-center justify-center rounded-[0.5rem] text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
      >
        <KeyboardArrowDownRounded fontSize='small' />
      </button>
    </div>
  )
}

type PricingFieldBaseProps = {
  id: string
  top: string
  left?: string
  label: string
}

type PricingTextFieldProps = PricingFieldBaseProps & {
  defaultValue?: string
  placeholder?: string
  readOnly?: boolean
}

function PricingTextField({
  id,
  top,
  left = '30.625rem',
  label,
  defaultValue,
  placeholder,
  readOnly = false
}: PricingTextFieldProps) {
  const hasLabel = label.trim().length > 0
  return (
    <div className='absolute w-[19.1875rem]' style={{ left, top }}>
      {hasLabel && (
        <label htmlFor={id} className='block text-body-sm text-neutral-900'>
          {label}
        </label>
      )}
      <input
        id={id}
        name={id}
        type='text'
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className={[
          hasLabel ? 'mt-[0.5rem]' : '',
          'h-[3rem] w-full rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] text-body-md text-neutral-400 outline-none'
        ].join(' ')}
      />
    </div>
  )
}

type PricingSelectFieldProps = PricingFieldBaseProps & {
  placeholder: string
  options: string[]
  description?: string
}

function PricingSelectField({
  id,
  top,
  left = '30.625rem',
  label,
  placeholder,
  options = [],
  description
}: PricingSelectFieldProps) {
  const selectRef = React.useRef<HTMLSelectElement>(null)

  const openSelect = React.useCallback(() => {
    const node = selectRef.current
    if (!node) return
    const enhancedNode = node as HTMLSelectElement & {
      showPicker?: () => void
    }
    if (typeof enhancedNode.showPicker === 'function') {
      enhancedNode.showPicker()
      return
    }
    node.focus({ preventScroll: true })
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    node.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    node.click()
  }, [])

  return (
    <div className='absolute w-[19.1875rem]' style={{ left, top }}>
      <label htmlFor={id} className='block text-body-sm text-neutral-900'>
        {label}
      </label>
      <div className='mt-[0.5rem] flex h-[3rem] items-center rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] transition-colors focus-within:border-brand-300 focus-within:bg-brand-100'>
        <select
          id={id}
          name={id}
          defaultValue=''
          className='h-full flex-1 cursor-pointer appearance-none bg-transparent pr-[2.5rem] text-body-md text-neutral-400 outline-none'
          ref={selectRef}
        >
          <option value=''>{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type='button'
          aria-label={`Abrir selector de ${label.toLowerCase()}`}
          onMouseDown={(event) => {
            event.preventDefault()
            openSelect()
          }}
          onClick={(event) => {
            event.preventDefault()
            openSelect()
          }}
          className='ml-[0.5rem] inline-flex size-[1.5rem] shrink-0 items-center justify-center rounded-[0.5rem] text-neutral-500 transition-colors hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
        >
          <KeyboardArrowDownRounded fontSize='small' />
        </button>
      </div>
      {description && (
        <p className='mt-[0.25rem] text-[0.6875rem] font-medium leading-4 text-neutral-500'>
          {description}
        </p>
      )}
    </div>
  )
}

type PricingTextAreaProps = PricingFieldBaseProps & {
  placeholder?: string
  description?: string
}

function PricingTextArea({
  id,
  top,
  left = '30.625rem',
  label,
  placeholder,
  description = 'Texto descriptivo'
}: PricingTextAreaProps) {
  return (
    <div className='absolute w-[19.1875rem]' style={{ left, top }}>
      <label htmlFor={id} className='block text-body-sm text-neutral-900'>
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        placeholder={placeholder}
        className='mt-[0.5rem] h-[6.75rem] w-full resize-none rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem] text-body-md text-neutral-400 outline-none'
      />
      {description && (
        <p className='mt-[0.25rem] text-[0.6875rem] font-medium leading-4 text-neutral-500'>
          {description}
        </p>
      )}
    </div>
  )
}

function DisabledFinancingSwitch({
  top,
  left = '30.625rem'
}: {
  top: string
  left?: string
}) {
  return (
    <div
      className='absolute flex w-[19.1875rem] items-center gap-[1rem]'
      style={{ left, top }}
    >
      <div className='relative h-[1.5rem] w-[2.5rem] rounded-[4.375rem] bg-neutral-200'>
        <div className='absolute left-[0.1875rem] top-[0.1875rem] size-[1.125rem] rounded-full bg-neutral-400' />
      </div>
      <span className='text-body-md text-neutral-900'>Quiero financiar</span>
    </div>
  )
}

function ActiveSwitch({
  top,
  left = '30.625rem',
  label = 'Requiere documentación?',
  width = '19.1875rem'
}: {
  top: string
  left?: string
  label?: string
  width?: string
}) {
  return (
    <div
      className='absolute flex items-center gap-[1rem]'
      style={{ left, top, width }}
    >
      <div className='relative h-[1.5rem] w-[2.5rem] rounded-[4.375rem] bg-brand-500'>
        <div className='absolute right-[0.1875rem] top-[0.1875rem] size-[1.125rem] rounded-full bg-brand-50' />
      </div>
      <span className='text-body-md text-neutral-900'>{label}</span>
    </div>
  )
}

type FinancingOptionProps = {
  top: string
  left: string
  label: string
  checked?: boolean
  disabled?: boolean
}

function FinancingOption({
  top,
  left,
  label,
  checked = false,
  disabled = false
}: FinancingOptionProps) {
  const Icon = checked ? CheckBoxRounded : CheckBoxOutlineBlankRounded
  return (
    <div
      className='absolute inline-flex items-center gap-[0.75rem]'
      style={{ top, left }}
      aria-disabled={disabled}
    >
      <Icon
        className={[
          'size-6',
          checked ? 'text-brand-500' : 'text-neutral-500',
          disabled ? 'opacity-60' : ''
        ].join(' ')}
      />
      <span
        className={[
          'text-body-md',
          disabled ? 'text-neutral-400' : 'text-neutral-900'
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}

type DocUploadFieldProps = {
  id: string
  top: string
  label: string
  placeholder: string
  variant: 'upload' | 'download'
}

function DocUploadField({
  id,
  top,
  label,
  placeholder,
  variant
}: DocUploadFieldProps) {
  const Icon = variant === 'upload' ? CloudUploadRounded : CloudDownloadRounded
  return (
    <div className='absolute w-[19.1875rem]' style={{ left: '30.625rem', top }}>
      <label htmlFor={id} className='block text-body-sm text-neutral-900'>
        {label}
      </label>
      <div className='mt-[0.5rem] flex h-[3rem] items-center justify-between rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] text-body-md text-neutral-400'>
        <span>{placeholder}</span>
        <Icon className='size-[1.5rem] text-neutral-500' />
      </div>
    </div>
  )
}

export default function ProposalCreationModal({
  open,
  onClose
}: ProposalCreationModalProps) {
  const [currentStep, setCurrentStep] = React.useState<
    'plan' | 'pricing' | 'financiación' | 'firma' | 'resumen'
  >('plan')
  const baseFieldId = React.useId()
  const [selectedLocation, setSelectedLocation] = React.useState('')
  const [odontogramaOpen, setOdontogramaOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }
    return undefined
  }, [onClose, open])

  React.useEffect(() => {
    if (!open) {
      setSelectedLocation('')
      setOdontogramaOpen(false)
      setCurrentStep('plan')
    }
  }, [open])

  const isPlanStep = currentStep === 'plan'
  const isPricingStep = currentStep === 'pricing'
  const isFinancingStep = currentStep === 'financiación'
  const isSignatureStep = currentStep === 'firma'
  const isSummaryStep = currentStep === 'resumen'
  const shouldShowStepper = !isSummaryStep
  const headerTitle = isSummaryStep
    ? 'Presupuesto PR-001'
    : 'Formulario de creación de presupuesto'

  const treatmentLabelId = `${baseFieldId}-treatment`
  const locationLabelId = `${baseFieldId}-location`
  const professionalLabelId = `${baseFieldId}-professional`

  const treatmentOptions = ['Ortodoncia', 'Limpieza dental', 'Implantes']
  const locationOptions = [
    'Todas',
    'Arcada inferior',
    'Arcada superior',
    'Piezas individuales'
  ]
  const professionalOptions = [
    'Dra. Laura Fuentes',
    'Dr. Carlos Rivas',
    'Higienista Marta López'
  ]
  const termOptions = ['12 meses', '18 meses', '24 meses']

  const showIndividualPieceButton =
    isPlanStep && selectedLocation === 'Piezas individuales'

  if (!open) return null

  const stepConfig = [
    { key: 'plan', label: 'Plan', top: '6rem' },
    { key: 'pricing', label: 'Precios', top: '9rem' },
    { key: 'financiación', label: 'Financiación', top: '12rem' },
    { key: 'firma', label: 'Firma', top: '15rem' }
  ] as const

  const steps = stepConfig.map(({ key, label, top }) => {
    let state: StepState = 'upcoming'
    if (currentStep === 'plan') {
      state = key === 'plan' ? 'current' : 'upcoming'
    } else if (currentStep === 'pricing') {
      if (key === 'plan') state = 'completed'
      else if (key === 'pricing') state = 'current'
      else state = 'upcoming'
    } else if (currentStep === 'financiación') {
      if (key === 'plan' || key === 'pricing') state = 'completed'
      else if (key === 'financiación') state = 'current'
      else state = 'upcoming'
    } else if (currentStep === 'firma') {
      if (key === 'plan' || key === 'pricing' || key === 'financiación')
        state = 'completed'
      else if (key === 'firma') state = 'current'
      else state = 'upcoming'
    } else {
      state = 'completed'
    }
    const connectorTone: StepConnectorTone =
      state === 'completed' || state === 'current' ? 'brand' : 'neutral'
    return { label, top, state, connectorTone }
  })

  const handleContinue = () => {
    if (currentStep === 'plan') {
      setCurrentStep('pricing')
    } else if (currentStep === 'pricing') {
      setCurrentStep('financiación')
    } else if (currentStep === 'financiación') {
      setCurrentStep('firma')
    } else if (currentStep === 'firma') {
      setCurrentStep('resumen')
    } else {
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep === 'resumen') {
      setCurrentStep('firma')
    } else if (currentStep === 'firma') {
      setCurrentStep('financiación')
    } else if (currentStep === 'financiación') {
      setCurrentStep('pricing')
    } else if (currentStep === 'pricing') {
      setCurrentStep('plan')
    }
  }

  return (
    <>
      <div
        className='fixed inset-0 z-[60] bg-neutral-900/40'
        onClick={onClose}
        aria-hidden
      >
        <div className='absolute inset-0 flex items-center justify-center px-8'>
          <div
            role='dialog'
            aria-modal='true'
            className='relative overflow-hidden rounded-[0.5rem] bg-neutral-50'
            style={{
              width:
                'calc(68.25rem * min(1, calc(85vh / 59.75rem), calc((100vw - 4rem) / 68.25rem), calc(92vw / 68.25rem)))',
              height:
                'calc(59.75rem * min(1, calc(85vh / 59.75rem), calc((100vw - 4rem) / 68.25rem), calc(92vw / 68.25rem)))'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className='relative h-[59.75rem] w-[68.25rem] bg-neutral-50'
              style={{
                transform:
                  'scale(min(1, calc(85vh / 59.75rem), calc((100vw - 4rem) / 68.25rem), calc(92vw / 68.25rem)))',
                transformOrigin: 'top left'
              }}
            >
              <div className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-neutral-300 px-[2rem]'>
                <p className='text-title-md text-neutral-900'>{headerTitle}</p>
                <button
                  type='button'
                  onClick={onClose}
                  aria-label='Cerrar'
                  className='flex size-[0.875rem] items-center justify-center text-neutral-900'
                >
                  <CloseRounded fontSize='inherit' />
                </button>
              </div>

              {shouldShowStepper &&
                steps.map((step) => (
                  <StepItem
                    key={step.label}
                    label={step.label}
                    state={step.state}
                    top={step.top}
                    connectorTone={step.connectorTone}
                  />
                ))}

              {isPlanStep ? (
                <>
                  <div className='absolute left-[14.3125rem] top-[6rem] flex w-[35.5rem] flex-col gap-[0.5rem]'>
                    <p className='text-title-lg text-neutral-900'>
                      Selección de plan
                    </p>
                  </div>

                  <div className='absolute left-[18.375rem] top-[10rem] flex h-[6rem] w-[21.75rem] items-center gap-[1.5rem]'>
                    <div className='size-[6rem] shrink-0 rounded-full bg-neutral-700' />
                    <div className='flex flex-col gap-[0.5rem]'>
                      <p className='text-title-lg text-neutral-900'>
                        Lucia López Cano
                      </p>
                      <div className='flex items-center gap-[0.5rem] text-body-md text-neutral-900'>
                        <MailOutlineRounded className='size-[1.5rem]' />
                        <span>Emailexample@gmail.com</span>
                      </div>
                      <div className='flex items-center gap-[0.5rem] text-body-md text-neutral-900'>
                        <PhoneRounded className='size-[1.5rem]' />
                        <span>+34 666 777 888</span>
                      </div>
                    </div>
                  </div>

                  <p className='absolute left-[18.375rem] top-[18.25rem] text-label-md text-neutral-500'>
                    Alergias:
                  </p>
                  <div className='absolute left-[25.875rem] top-[18rem] inline-flex items-center gap-[0.5rem]'>
                    <span className='inline-flex items-center rounded-full bg-error-200 px-[0.5rem] py-[0.25rem] text-label-md text-error-600'>
                      Penicilina
                    </span>
                    <span className='inline-flex items-center rounded-full bg-error-200 px-[0.5rem] py-[0.25rem] text-label-md text-error-600'>
                      Latex
                    </span>
                  </div>

                  <p className='absolute left-[18.375rem] top-[21rem] text-label-md text-neutral-500'>
                    Anotaciones:
                  </p>
                  <p className='absolute left-[25.875rem] top-[21rem] w-[24rem] text-body-md text-neutral-900'>
                    El paciente lorem ipsum dolor sit aemet dolor aemet ipsum
                  </p>

                  <p
                    id={treatmentLabelId}
                    className='absolute left-[18.375rem] top-[28rem] text-body-md text-neutral-900'
                  >
                    Tratamiento
                  </p>
                  <p
                    id={locationLabelId}
                    className='absolute left-[18.375rem] top-[33.5rem] text-body-md text-neutral-900'
                  >
                    Localización
                  </p>
                  <p
                    id={professionalLabelId}
                    className='absolute left-[18.375rem] top-[44rem] text-body-md text-neutral-900'
                  >
                    Profesional
                  </p>

                  <ExampleDropdown
                    top='28rem'
                    label='Tratamiento'
                    labelId={treatmentLabelId}
                    options={treatmentOptions}
                    placeholder='Selecciona un tratamiento'
                    required
                  />
                  <ExampleDropdown
                    top='33.5rem'
                    label='Localización'
                    labelId={locationLabelId}
                    options={locationOptions}
                    placeholder='Selecciona una localización'
                    required
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  />
                  <ExampleDropdown
                    top='44rem'
                    label='Profesional'
                    labelId={professionalLabelId}
                    options={professionalOptions}
                    placeholder='Selecciona un profesional'
                    required
                  />

                  {showIndividualPieceButton && (
                    <button
                      type='button'
                      className='absolute left-[30.6875rem] top-[38.5rem] inline-flex h-[3rem] w-[19.1875rem] items-center gap-[0.5rem] rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] text-left text-body-md text-neutral-900 transition-colors hover:border-brand-300 hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
                      onClick={() => setOdontogramaOpen(true)}
                    >
                      <AddRounded className='text-neutral-900' />
                      <span className='text-body-md text-neutral-900'>
                        Añadir pieza individual
                      </span>
                    </button>
                  )}

                  <span className='absolute left-[calc(75%-0.0625rem)] top-[29.125rem] text-error-600'>
                    *
                  </span>
                  <span className='absolute left-[calc(75%-0.0625rem)] top-[34.625rem] text-error-600'>
                    *
                  </span>
                  <span className='absolute left-[calc(75%-0.0625rem)] top-[45.125rem] text-error-600'>
                    *
                  </span>

                  <div className='absolute left-[18.375rem] top-[53.25rem] h-px w-[31.5rem] bg-neutral-300' />

                  <button
                    type='button'
                    onClick={handleContinue}
                    className='absolute left-[36.4375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
                  >
                    Continuar
                    <ArrowForwardRounded className='size-5' />
                  </button>
                </>
              ) : isPricingStep ? (
                <>
                  <div className='absolute left-[14.3125rem] top-[6rem] flex w-[34rem] flex-col gap-[0.5rem]'>
                    <p className='text-title-lg text-neutral-900'>
                      Precios, descuentos y ofertas
                    </p>
                  </div>

                  <p className='absolute left-[18.3125rem] top-[10rem] text-body-md text-neutral-900'>
                    Precio unitario
                  </p>
                  <PricingTextField
                    id={`${baseFieldId}-price-piece-1`}
                    label='Pieza 1'
                    top='10rem'
                    defaultValue='780€'
                    readOnly
                  />
                  <PricingTextField
                    id={`${baseFieldId}-price-piece-2`}
                    label='Pieza 2'
                    top='16.75rem'
                    defaultValue='45€'
                    readOnly
                  />

                  <p className='absolute left-[18.3125rem] top-[24rem] text-body-md text-neutral-900'>
                    Descuento
                  </p>
                  <PricingSelectField
                    id={`${baseFieldId}-discount-type`}
                    label='General'
                    top='24rem'
                    placeholder='%'
                    options={['%', '€', 'Sin descuento']}
                    description='Texto descriptivo'
                  />
                  <PricingTextArea
                    id={`${baseFieldId}-discount-reason`}
                    label='Motivo'
                    top='30.75rem'
                    placeholder='Value'
                  />

                  <p className='absolute left-[18.3125rem] top-[39.5rem] text-body-md text-neutral-900'>
                    Impuestos
                  </p>
                  <PricingTextField
                    id={`${baseFieldId}-tax`}
                    label=''
                    top='39.5rem'
                    defaultValue='21%'
                    readOnly
                  />

                  <p className='absolute left-[18.3125rem] top-[45rem] text-body-md text-neutral-900'>
                    Anticipo
                  </p>
                  <PricingTextField
                    id={`${baseFieldId}-advance`}
                    label=''
                    top='45rem'
                    placeholder='Value'
                  />

                  <DisabledFinancingSwitch top='50rem' />

                  <div className='absolute left-[18.375rem] top-[53.25rem] h-px w-[31.5rem] bg-neutral-300' />

                  <button
                    type='button'
                    onClick={handleBack}
                    className='absolute left-[18.375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-neutral-50 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-100'
                  >
                    <ArrowBackRounded className='size-5' />
                    Volver
                  </button>

                  <button
                    type='button'
                    onClick={handleContinue}
                    className='absolute left-[36.4375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
                  >
                    Continuar
                    <ArrowForwardRounded className='size-5' />
                  </button>
                </>
              ) : isFinancingStep ? (
                <>
                  <div className='absolute left-[14.3125rem] top-[6rem] flex w-[35.5rem] flex-col gap-[0.5rem]'>
                    <p className='text-title-lg text-neutral-900'>
                      Financiación
                    </p>
                  </div>

                  <div className='absolute inset-x-0 top-[10rem] bottom-[6.5rem] overflow-y-auto overflow-x-hidden'>
                    <div className='relative min-h-[43rem]'>
                      <p className='absolute left-[18.1875rem] top-[1.75rem] text-body-md text-neutral-900'>
                        Tipo de financiación
                      </p>
                      <FinancingOption
                        top='1.75rem'
                        left='30.6875rem'
                        label='Propia'
                        checked
                      />
                      <FinancingOption
                        top='1.75rem'
                        left='43.8125rem'
                        label='Externa'
                        disabled
                      />

                      <p className='absolute left-[18.1875rem] top-[6.75rem] text-body-md text-neutral-900'>
                        Importe a financiar
                      </p>
                      <PricingTextField
                        id={`${baseFieldId}-financing-amount`}
                        label=''
                        top='6.75rem'
                        placeholder='Value'
                      />

                      <p className='absolute left-[18.1875rem] top-[12.25rem] text-body-md text-neutral-900'>
                        Plazo
                      </p>
                      <PricingSelectField
                        id={`${baseFieldId}-financing-term`}
                        label='Label'
                        top='12.25rem'
                        placeholder='Value'
                        options={termOptions}
                      />

                      <PricingTextField
                        id={`${baseFieldId}-financing-fee`}
                        label='Cuota estimada'
                        top='17.25rem'
                        placeholder='Value'
                      />

                      <PricingTextField
                        id={`${baseFieldId}-financing-rate`}
                        label='TIN/TAE estimado'
                        top='24rem'
                        defaultValue='0%'
                        readOnly
                      />

                      <p className='absolute left-[18.1875rem] top-[31.25rem] text-body-md text-neutral-900'>
                        Documentación
                      </p>
                      <ActiveSwitch
                        top='31.25rem'
                        label='Requiere documentación?'
                        width='16.3125rem'
                      />

                      <DocUploadField
                        id={`${baseFieldId}-financing-doc-dni`}
                        top='34.75rem'
                        label='DNI'
                        placeholder='Subir DNI'
                        variant='upload'
                      />
                      <DocUploadField
                        id={`${baseFieldId}-financing-doc-payroll`}
                        top='41.25rem'
                        label='Nómina'
                        placeholder='Subir DNI ambas caras'
                        variant='upload'
                      />
                    </div>
                  </div>

                  <div className='absolute left-[18.375rem] top-[53.25rem] h-px w-[31.5rem] bg-neutral-300' />

                  <button
                    type='button'
                    onClick={handleBack}
                    className='absolute left-[18.375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-neutral-50 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-100'
                  >
                    <ArrowBackRounded className='size-5' />
                    Volver
                  </button>

                  <button
                    type='button'
                    onClick={handleContinue}
                    className='absolute left-[36.4375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
                  >
                    Continuar
                    <ArrowForwardRounded className='size-5' />
                  </button>
                </>
              ) : isSignatureStep ? (
                <>
                  <div className='absolute left-[14.3125rem] top-[6rem] flex w-[35.5rem] flex-col gap-[0.5rem]'>
                    <p className='text-title-lg text-neutral-900'>
                      Firma y envío
                    </p>
                  </div>

                  <p className='absolute left-[18.1875rem] top-[10.5rem] text-body-md text-neutral-900'>
                    Método firma
                  </p>
                  <PricingTextField
                    id={`${baseFieldId}-signature-method`}
                    label='Firma tablet'
                    placeholder='Value'
                    top='10.5rem'
                    left='30.6875rem'
                  />

                  <ActiveSwitch
                    top='17.25rem'
                    left='30.6875rem'
                    label='Enviar por correo'
                    width='16.3125rem'
                  />

                  <div className='absolute inset-x-0 top-[22.25rem] bottom-[6.5rem] overflow-y-auto overflow-x-hidden'>
                    <div className='relative min-h-[26rem]'>
                      <p className='absolute left-[18.1875rem] top-0 text-body-md text-neutral-900'>
                        Firmante
                      </p>
                      <PricingSelectField
                        id={`${baseFieldId}-signature-signee`}
                        label='Firmante'
                        placeholder='Nombre paciente'
                        top='0rem'
                        left='30.6875rem'
                        options={professionalOptions}
                      />

                      <PricingTextArea
                        id={`${baseFieldId}-signature-notes`}
                        label='Observaciones para el paciente'
                        placeholder='Value'
                        top='5rem'
                        left='30.6875rem'
                      />
                    </div>
                  </div>

                  <div className='absolute left-[18.375rem] top-[53.25rem] h-px w-[31.5rem] bg-neutral-300' />

                  <button
                    type='button'
                    onClick={handleBack}
                    className='absolute left-[18.375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[7.125rem] items-center justify-center gap-[0.5rem] rounded-full border border-neutral-300 bg-neutral-50 px-[1rem] text-body-md font-medium text-neutral-900 transition-colors hover:bg-brand-100'
                  >
                    <ArrowBackRounded className='size-5 text-neutral-900' />
                    Volver
                  </button>

                  <button
                    type='button'
                    className='absolute left-[26.625rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-neutral-300 bg-neutral-50 px-[1rem] text-body-md font-medium text-neutral-900 transition-colors hover:bg-brand-100'
                  >
                    Firmar consentimiento
                  </button>

                  <button
                    type='button'
                    onClick={handleContinue}
                    className='absolute left-[41.1875rem] top-[55.75rem] inline-flex h-[2.5rem] w-[8.6875rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
                  >
                    Continuar
                    <ArrowForwardRounded className='size-5' />
                  </button>
                </>
              ) : isSummaryStep ? (
                <>
                  <div className='absolute left-[14.3125rem] top-[6rem] flex w-[35.5rem] flex-col gap-[0.5rem]'>
                    <p className='text-title-lg text-neutral-900'>PR-001</p>
                  </div>

                  <div className='absolute left-[18.125rem] top-[9.5rem] h-[44.5625rem] w-[31.6875rem] overflow-y-auto overflow-x-hidden'>
                    <div className='relative h-[105.25rem] w-full'>
                      <p className='absolute left-0 top-0 text-title-sm text-neutral-600'>
                        Descripción
                      </p>
                      <p className='absolute left-0 top-[2.25rem] text-body-md text-neutral-900'>
                        Operación de mandíbula
                      </p>

                      <div className='absolute left-0 top-[5.25rem] flex w-full justify-between'>
                        <div className='w-[15.75rem]'>
                          <p className='text-title-sm text-neutral-600'>
                            Monto
                          </p>
                          <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                            2.300 €
                          </p>
                        </div>
                        <div className='w-[15.875rem]'>
                          <p className='text-title-sm text-neutral-600'>
                            Estado
                          </p>
                          <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                            Aceptado
                          </p>
                        </div>
                      </div>

                      <div className='absolute left-0 top-[10.5rem] flex w-full justify-between'>
                        <div className='w-[15.75rem]'>
                          <p className='text-title-sm text-neutral-600'>Pago</p>
                          <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                            Completado
                          </p>
                        </div>
                        <div className='w-[15.875rem]'>
                          <p className='text-title-sm text-neutral-600'>
                            Aseguradora
                          </p>
                          <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                            Adeslas
                          </p>
                        </div>
                      </div>

                      <p className='absolute left-0 top-[15.75rem] text-title-sm text-neutral-600'>
                        Firma
                      </p>
                      <div className='absolute left-0 top-[18rem] h-[6.25rem] w-[11.875rem] rounded-[0.5rem] border border-neutral-300 bg-neutral-50'>
                        <svg
                          viewBox='0 0 190 100'
                          xmlns='http://www.w3.org/2000/svg'
                          className='absolute inset-[1rem] text-neutral-500'
                        >
                          <path
                            d='M4 70 C40 20, 80 90, 140 30 S182 70, 186 40'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='3'
                            strokeLinecap='round'
                          />
                        </svg>
                      </div>

                      <p className='absolute left-0 top-[27.25rem] text-title-sm text-neutral-500'>
                        Plan
                      </p>
                      <div className='absolute left-0 top-[29.5rem] h-px w-full bg-neutral-300' />

                      <p className='absolute left-0 top-[31rem] text-title-sm text-neutral-600'>
                        Tratamiento
                      </p>
                      <p className='absolute left-0 top-[33.25rem] text-body-md text-neutral-900'>
                        Operación dental
                      </p>

                      <p className='absolute left-0 top-[36.25rem] text-title-sm text-neutral-600'>
                        Piezas
                      </p>
                      <p className='absolute left-0 top-[38.5rem] text-body-md text-neutral-900'>
                        Prótesis
                      </p>

                      <p className='absolute left-0 top-[41.5rem] text-title-sm text-neutral-600'>
                        Profesional
                      </p>
                      <div className='absolute left-0 top-[44rem] flex items-center gap-[0.75rem]'>
                        <div className='size-[2.25rem] rounded-full bg-neutral-200' />
                        <div className='flex flex-col'>
                          <p className='text-body-md text-neutral-900'>
                            Carlos Ramirez
                          </p>
                          <p className='text-body-sm text-neutral-600'>
                            Odontólogo
                          </p>
                        </div>
                      </div>

                      <p className='absolute left-0 top-[49.5rem] text-title-sm text-neutral-500'>
                        Precio
                      </p>
                      <div className='absolute left-0 top-[51.75rem] h-px w-full bg-neutral-300' />

                      <div className='absolute left-0 top-[53.25rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>
                          Precio unitario
                        </p>
                        <div className='mt-[2.75rem] space-y-[1.5rem]'>
                          <div className='flex items-center justify-between px-[1rem]'>
                            <p className='text-body-md text-neutral-900'>
                              Pieza 1
                            </p>
                            <p className='text-body-md text-neutral-900'>
                              780 €
                            </p>
                          </div>
                          <div className='flex items-center justify-between px-[1rem]'>
                            <p className='text-body-md text-neutral-900'>
                              Pieza 2
                            </p>
                            <p className='text-body-md text-neutral-900'>
                              1.180,50 €
                            </p>
                          </div>
                          <div className='flex items-center justify-between px-[1rem]'>
                            <p className='text-body-sm text-neutral-600'>
                              Pieza 2
                            </p>
                            <p className='text-body-sm text-neutral-600'>
                              1.180,50 €
                            </p>
                          </div>
                          <div className='flex items-center justify-between px-[1rem]'>
                            <p className='text-body-md text-neutral-900'>
                              Total
                            </p>
                            <p className='text-body-md text-neutral-900'>
                              1.180,50 €
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='absolute left-0 top-[64.75rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>
                          Descuento
                        </p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          15%
                        </p>
                      </div>

                      <div className='absolute left-0 top-[70rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>
                          Impuestos
                        </p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          21%
                        </p>
                      </div>

                      <div className='absolute left-0 top-[75.25rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>
                          Anticipos
                        </p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          500 €
                        </p>
                      </div>

                      <p className='absolute left-0 top-[82rem] text-title-sm text-neutral-500'>
                        Financiación
                      </p>
                      <div className='absolute left-0 top-[84.25rem] h-px w-full bg-neutral-300' />

                      <div className='absolute left-0 top-[85.75rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>
                          Importe a financiar
                        </p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          714,14 €
                        </p>
                      </div>

                      <div className='absolute left-0 top-[91rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>Plazos</p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          12
                        </p>
                      </div>

                      <div className='absolute left-0 top-[96.25rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>
                          TIN/TAE
                        </p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          3%
                        </p>
                      </div>

                      <div className='absolute left-0 top-[101.5rem] w-full'>
                        <p className='text-title-sm text-neutral-600'>Cuota</p>
                        <p className='mt-[2.25rem] text-body-md text-neutral-900'>
                          61,25 €
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='absolute left-[18.375rem] top-[53.25rem] h-px w-[31.5rem] bg-neutral-300' />

                  <button
                    type='button'
                    className='absolute left-[18.375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-neutral-300 bg-neutral-50 px-[1rem] text-body-md font-medium text-neutral-900'
                  >
                    Pendiente de firma
                  </button>

                  <button
                    type='button'
                    onClick={handleContinue}
                    className='absolute left-[36.4375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400'
                  >
                    Generar cita
                    <ArrowForwardRounded className='size-5' />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <OdontogramaModal
        open={odontogramaOpen}
        onClose={() => setOdontogramaOpen(false)}
        onContinue={() => setOdontogramaOpen(false)}
      />
    </>
  )
}
