'use client'

import React from 'react'
import CloseRounded from '@mui/icons-material/CloseRounded'
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded'
import AddRounded from '@mui/icons-material/AddRounded'
import RadioButtonCheckedRounded from '@mui/icons-material/RadioButtonCheckedRounded'
import RadioButtonUncheckedRounded from '@mui/icons-material/RadioButtonUncheckedRounded'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import CheckBoxRounded from '@mui/icons-material/CheckBoxRounded'
import CheckBoxOutlineBlankRounded from '@mui/icons-material/CheckBoxOutlineBlankRounded'
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded'
import CloudDownloadRounded from '@mui/icons-material/CloudDownloadRounded'
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded'
import PhoneRounded from '@mui/icons-material/PhoneRounded'
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
      <p className='text-title-sm text-neutral-900'>
        {label}
      </p>
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
    <div
      className='absolute w-[19.1875rem]'
      style={{ left, top }}
    >
      {hasLabel && (
        <label
          htmlFor={id}
          className='block text-body-sm text-neutral-900'
        >
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
  options,
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
    <div
      className='absolute w-[19.1875rem]'
      style={{ left, top }}
    >
      <label
        htmlFor={id}
        className='block text-body-sm text-neutral-900'
      >
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
}

function PricingTextArea({
  id,
  top,
  left = '30.625rem',
  label,
  placeholder
}: PricingTextAreaProps) {
  return (
    <div
      className='absolute w-[19.1875rem]'
      style={{ left, top }}
    >
      <label
        htmlFor={id}
        className='block text-body-sm text-neutral-900'
      >
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        placeholder={placeholder}
        className='mt-[0.5rem] h-[5rem] w-full resize-none rounded-[0.5rem] border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem] text-body-md text-neutral-400 outline-none'
      />
      <p className='mt-[0.25rem] text-[0.6875rem] font-medium leading-4 text-neutral-500'>
        Texto descriptivo
      </p>
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

function ActiveFinancingSwitch({
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
      <div className='relative h-[1.5rem] w-[2.5rem] rounded-[4.375rem] bg-brand-500'>
        <div className='absolute right-[0.1875rem] top-[0.1875rem] size-[1.125rem] rounded-full bg-brand-50' />
      </div>
      <span className='text-body-md text-neutral-900'>Requiere documentación?</span>
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
  const Icon =
    variant === 'upload' ? CloudUploadRounded : CloudDownloadRounded
  return (
    <div
      className='absolute w-[19.1875rem]'
      style={{ left: '30.625rem', top }}
    >
      <label
        htmlFor={id}
        className='block text-body-sm text-neutral-900'
      >
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
    'plan' | 'pricing' | 'financiación'
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
    } else {
      if (key === 'plan' || key === 'pricing') state = 'completed'
      else if (key === 'financiación') state = 'current'
      else state = 'upcoming'
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
    } else {
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep === 'financiación') {
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
                <p className='text-title-md text-neutral-900'>
                  Formulario de creación de presupuesto
                </p>
                <button
                  type='button'
                  onClick={onClose}
                  aria-label='Cerrar'
                  className='flex size-[0.875rem] items-center justify-center text-neutral-900'
                >
                  <CloseRounded fontSize='inherit' />
                </button>
              </div>

              {steps.map((step) => (
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

                  <p className='absolute left-[18.1875rem] top-[11.75rem] text-body-md text-neutral-900'>
                    Tipo de financiación
                  </p>
                  <FinancingOption
                    top='11.75rem'
                    left='30.6875rem'
                    label='Propia'
                    checked
                  />
                  <FinancingOption
                    top='11.75rem'
                    left='43.8125rem'
                    label='Externa'
                    disabled
                  />

                  <p className='absolute left-[18.1875rem] top-[16.75rem] text-body-md text-neutral-900'>
                    Importe a financiar
                  </p>
                  <PricingTextField
                    id={`${baseFieldId}-financing-amount`}
                    label=''
                    top='16.75rem'
                    placeholder='Value'
                  />

                  <p className='absolute left-[18.1875rem] top-[22.25rem] text-body-md text-neutral-900'>
                    Plazo
                  </p>
                  <PricingSelectField
                    id={`${baseFieldId}-financing-term`}
                    label='Label'
                    top='22.25rem'
                    placeholder='Value'
                    options={termOptions}
                    description='Texto descriptivo'
                  />

                  <PricingTextField
                    id={`${baseFieldId}-financing-fee`}
                    label='Cuota estimada'
                    top='27.25rem'
                    placeholder='Value'
                  />

                  <PricingTextField
                    id={`${baseFieldId}-financing-rate`}
                    label='TIN/TAE estimado'
                    top='34rem'
                    defaultValue='0%'
                    readOnly
                  />

                  <p className='absolute left-[18.1875rem] top-[41.25rem] text-body-md text-neutral-900'>
                    Documentación
                  </p>
                  <ActiveFinancingSwitch top='41.25rem' />

                  <DocUploadField
                    id={`${baseFieldId}-financing-doc-dni`}
                    top='44.75rem'
                    label='DNI'
                    placeholder='Subir DNI'
                    variant='upload'
                  />
                  <DocUploadField
                    id={`${baseFieldId}-financing-doc-payroll`}
                    top='51.25rem'
                    label='Nómina'
                    placeholder='Subir DNI ambas caras'
                    variant='upload'
                  />

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

