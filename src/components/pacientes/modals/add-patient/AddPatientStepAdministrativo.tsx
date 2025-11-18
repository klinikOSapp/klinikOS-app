'use client'

import {
  DatePickerInput,
  SelectInput,
  TextArea,
  TextInput,
  ToggleInput
} from './AddPatientInputs'

type Props = {
  facturaEmpresa: boolean
  onChangeFacturaEmpresa: (v: boolean) => void
  notas?: string
  onChangeNotas?: (v: string) => void
  staffOptions: Array<{ label: string; value: string }>
  selectedStaffId?: string
  onChangeStaff?: (v: string) => void
  leadSource?: string
  onChangeLeadSource?: (v: string) => void
  coverageType?: string
  onChangeCoverageType?: (v: string) => void
  insuranceProvider?: string
  onChangeInsuranceProvider?: (v: string) => void
  insurancePolicyNumber?: string
  onChangeInsurancePolicyNumber?: (v: string) => void
  insuranceExpiry?: Date | null
  onChangeInsuranceExpiry?: (d: Date) => void
  addressLine1?: string
  onChangeAddressLine1?: (v: string) => void
  addressLine2?: string
  onChangeAddressLine2?: (v: string) => void
  addressNumber?: string
  onChangeAddressNumber?: (v: string) => void
  addressState?: string
  onChangeAddressState?: (v: string) => void
  addressCity?: string
  onChangeAddressCity?: (v: string) => void
  addressPostalCode?: string
  onChangeAddressPostalCode?: (v: string) => void
  addressCountry?: string
  onChangeAddressCountry?: (v: string) => void
  billCompanyName?: string
  onChangeBillCompanyName?: (v: string) => void
  billCompanyTaxId?: string
  onChangeBillCompanyTaxId?: (v: string) => void
  preferredPaymentMethod?: string
  onChangePreferredPaymentMethod?: (v: string) => void
  preferredFinancingOption?: string
  onChangePreferredFinancingOption?: (v: string) => void
}

export default function AddPatientStepAdministrativo({
  facturaEmpresa,
  onChangeFacturaEmpresa,
  notas,
  onChangeNotas,
  staffOptions,
  selectedStaffId,
  onChangeStaff,
  leadSource,
  onChangeLeadSource,
  coverageType,
  onChangeCoverageType,
  insuranceProvider,
  onChangeInsuranceProvider,
  insurancePolicyNumber,
  onChangeInsurancePolicyNumber,
  insuranceExpiry,
  onChangeInsuranceExpiry,
  addressLine1,
  onChangeAddressLine1,
  addressLine2,
  onChangeAddressLine2,
  addressNumber,
  onChangeAddressNumber,
  addressState,
  onChangeAddressState,
  addressCity,
  onChangeAddressCity,
  addressPostalCode,
  onChangeAddressPostalCode,
  addressCountry,
  onChangeAddressCountry,
  billCompanyName,
  onChangeBillCompanyName,
  billCompanyTaxId,
  onChangeBillCompanyTaxId,
  preferredPaymentMethod,
  onChangePreferredPaymentMethod,
  preferredFinancingOption,
  onChangePreferredFinancingOption
}: Props) {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Profesional de referencia
        </div>
        <SelectInput
          placeholder='Selecciona profesional'
          value={selectedStaffId ?? ''}
          onChange={onChangeStaff}
          options={staffOptions}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Canal de captación
        </div>
        <SelectInput
          placeholder='Selecciona canal'
          value={leadSource ?? ''}
          onChange={onChangeLeadSource}
          options={[
            { label: 'Recomendación', value: 'referencia' },
            { label: 'Redes sociales', value: 'social' },
            { label: 'Publicidad', value: 'ads' },
            { label: 'Otro', value: 'otro' }
          ]}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Notas
        </div>
        <TextArea placeholder='Value' value={notas} onChange={onChangeNotas} />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Cobertura
        </div>
        <SelectInput
          placeholder='Tipo de cobertura'
          value={coverageType ?? ''}
          onChange={onChangeCoverageType}
          options={[
            { label: 'Privado', value: 'private' },
            { label: 'Seguro dental', value: 'insurance' },
            { label: 'Mutua', value: 'mutual' }
          ]}
        />
        <TextInput
          placeholder='Compañía'
          value={insuranceProvider}
          onChange={onChangeInsuranceProvider}
        />
        <TextInput
          placeholder='Número de póliza'
          value={insurancePolicyNumber}
          onChange={onChangeInsurancePolicyNumber}
        />
        <DatePickerInput value={insuranceExpiry ?? undefined} onChange={onChangeInsuranceExpiry} />
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Dirección fiscal
        </div>
        <TextInput
          placeholder='Calle'
          value={addressLine1}
          onChange={onChangeAddressLine1}
        />
        <TextInput
          placeholder='Piso / datos adicionales'
          value={addressLine2}
          onChange={onChangeAddressLine2}
        />
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput
            placeholder='Número'
            value={addressNumber}
            onChange={onChangeAddressNumber}
          />
          <TextInput
            placeholder='Provincia / Estado'
            value={addressState}
            onChange={onChangeAddressState}
          />
        </div>
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput
            placeholder='Ciudad'
            value={addressCity}
            onChange={onChangeAddressCity}
          />
          <TextInput
            placeholder='Código postal'
            value={addressPostalCode}
            onChange={onChangeAddressPostalCode}
          />
        </div>
        <TextInput
          placeholder='País'
          value={addressCountry}
          onChange={onChangeAddressCountry}
        />
        <div className='flex items-center gap-4'>
          <ToggleInput
            ariaLabel='Facturar a empresa'
            checked={facturaEmpresa}
            onChange={onChangeFacturaEmpresa}
          />
          <span className='text-body-md text-[var(--color-neutral-900)]'>
            Facturar a empresa
          </span>
        </div>
        {facturaEmpresa ? (
          <div className='grid grid-cols-1 gap-4 w-full'>
            <TextInput
              placeholder='Nombre fiscal'
              value={billCompanyName}
              onChange={onChangeBillCompanyName}
            />
            <TextInput
              placeholder='CIF / NIF'
              value={billCompanyTaxId}
              onChange={onChangeBillCompanyTaxId}
            />
          </div>
        ) : null}
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Pago
        </div>
        <SelectInput
          placeholder='Método preferido'
          value={preferredPaymentMethod ?? ''}
          onChange={onChangePreferredPaymentMethod}
          options={[
            { label: 'Tarjeta', value: 'card' },
            { label: 'Efectivo', value: 'cash' },
            { label: 'Transferencia', value: 'wire' }
          ]}
        />
        <SelectInput
          placeholder='Financiación'
          value={preferredFinancingOption ?? ''}
          onChange={onChangePreferredFinancingOption}
          options={[
            { label: 'Sin financiación', value: 'none' },
            { label: 'Financiación interna', value: 'internal' },
            { label: 'Entidad externa', value: 'external' }
          ]}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-body-sm text-[var(--color-neutral-900)]'>
          Firma
        </div>
        <div className='w-20 h-20 rounded-lg border border-[var(--color-brand-500)] bg-[var(--color-neutral-200)]' />
      </div>
    </div>
  )
}
