'use client'

import {
  AutocompleteInput,
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
  profesional?: string
  onChangeProfesional?: (v: string) => void
  canal?: string
  onChangeCanal?: (v: string) => void
  cobertura?: string
  onChangeCobertura?: (v: string) => void
  pais?: string
  onChangePais?: (v: string) => void
  pago1?: string
  onChangePago1?: (v: string) => void
  pago2?: string
  onChangePago2?: (v: string) => void
  financiacion?: string
  onChangeFinanciacion?: (v: string) => void
  cif?: string
  onChangeCif?: (v: string) => void
  calle?: string
  onChangeCalle?: (v: string) => void
  ciudad?: string
  onChangeCiudad?: (v: string) => void
  provincia?: string
  onChangeProvincia?: (v: string) => void
  codigoPostal?: string
  onChangeCodigoPostal?: (v: string) => void
}

export default function AddPatientStepAdministrativo({
  facturaEmpresa,
  onChangeFacturaEmpresa,
  notas,
  onChangeNotas,
  profesional,
  onChangeProfesional,
  canal,
  onChangeCanal,
  cobertura,
  onChangeCobertura,
  pais,
  onChangePais,
  pago1,
  onChangePago1,
  pago2,
  onChangePago2,
  financiacion,
  onChangeFinanciacion,
  cif,
  onChangeCif,
  calle,
  onChangeCalle,
  ciudad,
  onChangeCiudad,
  provincia,
  onChangeProvincia,
  codigoPostal,
  onChangeCodigoPostal
}: Props) {
  return (
    <div className='left-[18.375rem] top-[10rem] absolute inline-flex flex-col justify-start items-start gap-6 w-[31.5rem] h-[43.25rem] overflow-y-auto overflow-x-clip pr-2 pb-2 scrollbar-hide'>
      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Profesional de referencia
        </div>
        <SelectInput
          placeholder='Selecciona profesional'
          value={profesional ?? ''}
          onChange={onChangeProfesional}
          options={[
            { label: 'Dr. Juan Pérez', value: 'juan_perez' },
            { label: 'Dra. María García', value: 'maria_garcia' },
            { label: 'Dr. Carlos López', value: 'carlos_lopez' }
          ]}
        />
      </div>

      <div className='inline-flex flex-col gap-2 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Canal de captación
        </div>
        <SelectInput
          placeholder='Selecciona canal'
          value={canal ?? ''}
          onChange={onChangeCanal}
          options={[
            { label: 'Redes sociales', value: 'redes_sociales' },
            { label: 'Recomendación', value: 'recomendacion' },
            { label: 'Web', value: 'web' },
            { label: 'Publicidad', value: 'publicidad' }
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
          value={cobertura ?? ''}
          onChange={onChangeCobertura}
          options={[
            { label: 'Seguro privado', value: 'privado' },
            { label: 'Seguridad Social', value: 'ss' },
            { label: 'Sin cobertura', value: 'ninguna' },
            { label: 'Mutua', value: 'mutua' }
          ]}
        />
        {cobertura && cobertura !== 'ninguna' && (
          <>
            <TextInput placeholder='Compañía' />
            <TextInput placeholder='Número de póliza' />
            <TextInput placeholder='Vencimiento' />
          </>
        )}
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Dirección fiscal
        </div>
        <AutocompleteInput
          placeholder='Calle'
          value={calle}
          onChange={onChangeCalle}
          onSelect={(suggestion) => {
            // Autorellenar campos relacionados cuando se selecciona una dirección
            if (suggestion.city && onChangeCiudad) {
              onChangeCiudad(suggestion.city)
            }
            if (suggestion.province && onChangeProvincia) {
              onChangeProvincia(suggestion.province)
            }
            if (suggestion.postcode && onChangeCodigoPostal) {
              onChangeCodigoPostal(suggestion.postcode)
            }
            // Autorellenar país según el código de país
            if (suggestion.countryCode && onChangePais) {
              onChangePais(suggestion.countryCode)
            }
          }}
        />
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput placeholder='Número' />
          <TextInput placeholder='Piso' />
        </div>
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput
            placeholder='Ciudad'
            value={ciudad}
            onChange={onChangeCiudad}
          />
          <TextInput
            placeholder='Provincia'
            value={provincia}
            onChange={onChangeProvincia}
          />
        </div>
        <div className='grid grid-cols-2 gap-4 w-full'>
          <TextInput
            placeholder='Código Postal'
            value={codigoPostal}
            onChange={onChangeCodigoPostal}
          />
          <SelectInput
            placeholder='País'
            value={pais ?? ''}
            onChange={onChangePais}
            options={[
              { label: 'España', value: 'es' },
              { label: 'Francia', value: 'fr' },
              { label: 'Portugal', value: 'pt' },
              { label: 'Italia', value: 'it' },
              { label: 'Alemania', value: 'de' },
              { label: 'Reino Unido', value: 'gb' },
              { label: 'Países Bajos', value: 'nl' },
              { label: 'Bélgica', value: 'be' },
              { label: 'Suiza', value: 'ch' },
              { label: 'Austria', value: 'at' },
              { label: 'Andorra', value: 'ad' }
            ]}
          />
        </div>
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
        {facturaEmpresa && (
          <TextInput
            placeholder='CIF de la empresa'
            value={cif}
            onChange={onChangeCif}
          />
        )}
      </div>

      <div className='inline-flex flex-col gap-4 w-full'>
        <div className='text-title-sm text-[var(--color-neutral-900)]'>
          Pago
        </div>
        <SelectInput
          placeholder='Método de pago principal'
          value={pago1 ?? ''}
          onChange={onChangePago1}
          options={[
            { label: 'Efectivo', value: 'efectivo' },
            { label: 'Tarjeta', value: 'tarjeta' },
            { label: 'Transferencia', value: 'transferencia' },
            { label: 'Bizum', value: 'bizum' }
          ]}
        />
        <SelectInput
          placeholder='Método de pago secundario'
          value={pago2 ?? ''}
          onChange={onChangePago2}
          options={[
            { label: 'Efectivo', value: 'efectivo' },
            { label: 'Tarjeta', value: 'tarjeta' },
            { label: 'Transferencia', value: 'transferencia' },
            { label: 'Bizum', value: 'bizum' }
          ]}
        />
        <SelectInput
          placeholder='Financiación'
          value={financiacion ?? ''}
          onChange={onChangeFinanciacion}
          options={[
            { label: 'Sin financiación', value: 'ninguna' },
            { label: 'Financiación 3 meses', value: '3m' },
            { label: 'Financiación 6 meses', value: '6m' },
            { label: 'Financiación 12 meses', value: '12m' }
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
