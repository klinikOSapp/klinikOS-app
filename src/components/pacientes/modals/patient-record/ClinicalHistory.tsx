'use client'

import React from 'react'
import {
  AccountCircleRounded,
  AddRounded,
  CalendarMonthRounded,
  CloseRounded,
  DownloadRounded,
  EditRounded,
  ImageRounded,
  PlaceRounded,
  CheckRounded
} from '@/components/icons/md3'
import SelectorCard from '@/components/pacientes/SelectorCard'

type ClinicalHistoryProps = {
  onClose?: () => void
  initialEditMode?: boolean
  onEditModeOpened?: () => void
}

// Datos iniciales del historial clínico
const initialClinicalData = {
  titulo: 'Limpieza dental',
  subjetivo: 'Siente dolor 7/10 al frío en 2.6 desde hace 3 días',
  objetivo: 'Caries oclusal profunda en 2.6; sensibilidad al frío positiva; RX: proximidad pulpar',
  evaluacion: 'Pulpitis reversible 2.6. Dx diferencial: hipersensibilidad dentinaria.',
  plan: 'Operatoria en 2.6 hoy; barniz desensibilizante; ibuprofeno PRN; control en 2 semanas; higiene en 6 meses (recall).',
  profesional1Nombre: 'Daniel Soriano',
  profesional1Rol: 'Higienista',
  profesional2Nombre: 'Carlos Ramirez',
  profesional2Rol: 'Odontólogo'
}

export default function ClinicalHistory({ 
  onClose,
  initialEditMode = false,
  onEditModeOpened
}: ClinicalHistoryProps) {
  const [filter, setFilter] = React.useState<
    'proximas' | 'pasadas' | 'confirmadas' | 'inaxistencia'
  >('proximas')

  const [selectedCardId, setSelectedCardId] = React.useState<string>('c1')
  
  // Estado de edición
  const [isEditing, setIsEditing] = React.useState(initialEditMode)
  const [formData, setFormData] = React.useState(initialClinicalData)
  const [tempFormData, setTempFormData] = React.useState(initialClinicalData)

  // Activar modo edición si se abre con initialEditMode
  React.useEffect(() => {
    if (initialEditMode && !isEditing) {
      setTempFormData(formData)
      setIsEditing(true)
      onEditModeOpened?.()
    }
  }, [initialEditMode, isEditing, formData, onEditModeOpened])

  const handleEdit = () => {
    setTempFormData(formData)
    setIsEditing(true)
  }

  const handleSave = () => {
    setFormData(tempFormData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempFormData(formData)
    setIsEditing(false)
  }

  const updateField = (field: keyof typeof formData, value: string) => {
    setTempFormData(prev => ({ ...prev, [field]: value }))
  }

  type Filter = 'proximas' | 'pasadas' | 'confirmadas' | 'inaxistencia'
  const orderedFilters: Filter[] = [
    'proximas',
    'pasadas',
    'confirmadas',
    'inaxistencia'
  ]
  const handleKeyDown = (current: Filter) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setFilter(current)
      return
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const idx = orderedFilters.indexOf(filter)
      const nextIdx =
        e.key === 'ArrowRight'
          ? (idx + 1) % orderedFilters.length
          : (idx - 1 + orderedFilters.length) % orderedFilters.length
      setFilter(orderedFilters[nextIdx])
    }
  }
  return (
    <div
      className='bg-neutral-50 relative w-full max-w-[74.75rem] h-full overflow-hidden'
      data-node-id='426:934'
    >
      <div className='absolute left-[var(--spacing-plnav)] top-[10.25rem] flex items-center gap-[var(--spacing-gapmd)]'>
        <div
          role='tab'
          aria-selected={filter === 'proximas'}
          onClick={() => setFilter('proximas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'proximas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1016'
          tabIndex={0}
          onKeyDown={handleKeyDown('proximas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'proximas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Próximas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'pasadas'}
          onClick={() => setFilter('pasadas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'pasadas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1017'
          tabIndex={0}
          onKeyDown={handleKeyDown('pasadas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'pasadas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Pasadas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'confirmadas'}
          onClick={() => setFilter('confirmadas')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'confirmadas' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1019'
          tabIndex={0}
          onKeyDown={handleKeyDown('confirmadas')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'confirmadas' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Confirmadas
          </p>
        </div>
        <div
          role='tab'
          aria-selected={filter === 'inaxistencia'}
          onClick={() => setFilter('inaxistencia')}
          className={`box-border content-stretch flex gap-[var(--spacing-gapsm)] items-center justify-center px-[var(--spacing-gapsm)] py-[calc(var(--spacing-gapsm)/2)] rounded-[var(--radius-pill)] cursor-pointer ${
            filter === 'inaxistencia' ? 'bg-neutral-900' : ''
          }`}
          data-node-id='426:1021'
          tabIndex={0}
          onKeyDown={handleKeyDown('inaxistencia')}
        >
          <p
            className={`font-['Inter:Medium',_sans-serif] not-italic relative shrink-0 text-label-md text-nowrap whitespace-pre ${
              filter === 'inaxistencia' ? 'text-neutral-50' : 'text-neutral-900'
            }`}
          >
            Inaxistencia
          </p>
        </div>
      </div>

      {/* Timeline cards left (selectable) */}
      {[
        { id: 'c1', top: '12.75rem' },
        { id: 'c2', top: '21.8125rem' }
      ].map((card) => (
        <div
          key={card.id}
          className='absolute top-[inherit] w-[19.625rem]'
          style={{ left: 'calc(6.25% + 10.25px)', top: card.top }}
        >
          <SelectorCard
            title='Limpieza dental'
            selected={selectedCardId === card.id}
            onClick={() => setSelectedCardId(card.id)}
            lines={[
              {
                icon: (
                  <CalendarMonthRounded className='size-6 text-neutral-700' />
                ),
                text: 'Jue 16 septiembre, 2025'
              },
              {
                icon: <PlaceRounded className='size-6 text-neutral-700' />,
                text: 'KlinkOS Ayora'
              }
            ]}
          />
        </div>
      ))}
      {/* MD3 Variant A: Vertical dividers with badge */}
      <div
        className='absolute h-[6.375rem] w-6 left-[2.8125rem] top-[12.75rem]'
        aria-hidden='true'
      >
        {/* Divider only between circles */}
        <div className='absolute left-1/2 -translate-x-1/2 top-6 bottom-0 w-[0.125rem] bg-brand-500' />
        {/* Badge dot */}
        <div className='absolute left-1/2 top-0 -translate-x-1/2 grid place-items-center size-6'>
          <div className='size-6 rounded-full bg-brand-500' />
        </div>
      </div>
      <div
        className='absolute h-[13.3125rem] w-6 left-[2.8125rem] top-[19.125rem]'
        aria-hidden='true'
      >
        {/* Divider only between circles */}
        <div className='absolute left-1/2 -translate-x-1/2 top-0 w-[0.125rem] bg-brand-500 h-[2.6875rem]' />
        {/* Badge dot */}
        <div className='absolute left-1/2 top-[2.6875rem] -translate-x-1/2 grid place-items-center size-6'>
          <div className='size-6 rounded-full bg-brand-500' />
        </div>
      </div>

      {/* Header */}
      <div
        className='absolute bg-neutral-50 content-stretch flex flex-col gap-[var(--spacing-gapsm)] items-start left-[var(--spacing-plnav)] top-[2.5rem] w-[35.5rem]'
        data-name='Header'
      >
        <p className="font-['Inter:Regular',_sans-serif] relative shrink-0 text-neutral-900 text-title-lg text-nowrap whitespace-pre">
          Historial clínico
        </p>
        <p className="font-['Inter:Regular',_sans-serif] min-w-full relative shrink-0 text-neutral-900 text-body-sm w-[min-content]">
          Filtra el historial clínico, consulta los detalles y sube imágenes y
          documentos.
        </p>
      </div>

      {/* Right details card - pin to right instead of fixed width */}
      <div
        className='absolute bg-white border border-neutral-200 border-solid rounded-[calc(var(--radius-xl)/2)]'
        style={{
          left: 'calc(31.25% + 4.078rem)',
          right: 'var(--spacing-plnav)',
          top: '10.25rem',
          bottom: 'var(--spacing-plnav)'
        }}
      >
        <div
          className='relative rounded-[inherit] overflow-y-auto px-plnav py-6'
          style={{ height: '100%' }}
        >
          {/* Header with title and edit button */}
          <div className='flex items-center justify-between mb-6'>
            {isEditing ? (
              <input
                type="text"
                value={tempFormData.titulo}
                onChange={(e) => updateField('titulo', e.target.value)}
                className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-title-lg bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] w-[20rem]"
              />
            ) : (
              <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-title-lg">
                {formData.titulo}
              </p>
            )}
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEdit}
                className='relative box-border flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-brand-50)] transition-colors'
              >
                <div
                  aria-hidden='true'
                  className='absolute border border-[#51d6c7] border-solid inset-0 pointer-events-none rounded-[1rem]'
                />
                <EditRounded className='size-4 text-[#1e4947]' />
                <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-[#1e4947] text-[0.875rem]">
                  Editar
                </span>
              </button>
            ) : (
              <div className='flex gap-[0.5rem]'>
                <button
                  type="button"
                  onClick={handleCancel}
                  className='bg-[#f8fafb] box-border flex gap-[0.5rem] items-center justify-center px-[0.75rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-neutral-100)] transition-colors border border-[var(--color-neutral-300)]'
                >
                  <CloseRounded className='size-4 text-[var(--color-neutral-700)]' />
                  <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-[var(--color-neutral-700)] text-[0.875rem]">
                    Cancelar
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className='bg-[var(--color-brand-500)] box-border flex gap-[0.5rem] items-center justify-center px-[0.75rem] py-[0.25rem] rounded-[1rem] cursor-pointer hover:bg-[var(--color-brand-600)] transition-colors'
                >
                  <CheckRounded className='size-4 text-white' />
                  <span className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] text-white text-[0.875rem]">
                    Guardar
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* All content in a single flex column - no absolute positioning */}
          <div className='flex flex-col gap-6 w-full max-w-[42.3125rem]'>
            {/* SOAP: Subjetivo */}
            <div className='flex flex-col gap-[var(--spacing-gapsm)]'>
              <div className='flex flex-col'>
                <p className="font-['Inter:Medium',_sans-serif] text-[#24282c] text-body-md">
                  Subjetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] text-[#aeb8c2] text-label-sm">
                  ¿Por qué viene?
                </p>
              </div>
              {isEditing ? (
                <textarea
                  value={tempFormData.subjetivo}
                  onChange={(e) => updateField('subjetivo', e.target.value)}
                  className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[3rem]"
                />
              ) : (
                <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm">
                  {formData.subjetivo}
                </p>
              )}
            </div>

            {/* SOAP: Objetivo */}
            <div className='flex flex-col gap-[var(--spacing-gapsm)]'>
              <div className='flex flex-col'>
                <p className="font-['Inter:Medium',_sans-serif] text-[#24282c] text-body-md">
                  Objetivo
                </p>
                <p className="font-['Inter:Regular',_sans-serif] text-[#aeb8c2] text-label-sm">
                  ¿Qué tiene?
                </p>
              </div>
              {isEditing ? (
                <textarea
                  value={tempFormData.objetivo}
                  onChange={(e) => updateField('objetivo', e.target.value)}
                  className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[3rem]"
                />
              ) : (
                <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm">
                  {formData.objetivo}
                </p>
              )}
            </div>

            {/* SOAP: Evaluación */}
            <div className='flex flex-col gap-[var(--spacing-gapsm)]'>
              <div className='flex flex-col'>
                <p className="font-['Inter:Medium',_sans-serif] text-[#24282c] text-body-md">
                  Evaluación
                </p>
                <p className="font-['Inter:Regular',_sans-serif] text-[#aeb8c2] text-label-sm">
                  ¿Qué le hacemos?
                </p>
              </div>
              {isEditing ? (
                <textarea
                  value={tempFormData.evaluacion}
                  onChange={(e) => updateField('evaluacion', e.target.value)}
                  className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[3rem]"
                />
              ) : (
                <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm">
                  {formData.evaluacion}
                </p>
              )}
            </div>

            {/* SOAP: Plan */}
            <div className='flex flex-col gap-[var(--spacing-gapsm)]'>
              <div className='flex flex-col'>
                <p className="font-['Inter:Medium',_sans-serif] text-[#24282c] text-body-md">
                  Plan
                </p>
                <p className="font-['Inter:Regular',_sans-serif] text-[#aeb8c2] text-label-sm">
                  Tratamiento a seguir
                </p>
              </div>
              {isEditing ? (
                <textarea
                  value={tempFormData.plan}
                  onChange={(e) => updateField('plan', e.target.value)}
                  className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-2 py-1 outline-none focus:border-[var(--color-brand-500)] resize-none min-h-[3rem]"
                />
              ) : (
                <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm">
                  {formData.plan}
                </p>
              )}
            </div>

            {/* Atendido Por */}
            <div className='flex flex-col gap-[var(--spacing-gapmd)]'>
              <p className="font-['Inter:Medium',_sans-serif] text-[#24282c] text-body-md">
                Atendido Por:
              </p>
              <div className='flex gap-8 items-center'>
                <div className='flex gap-3 items-center'>
                  <div className='relative rounded-full size-9'>
                    <div className='absolute bg-white inset-0 rounded-full' />
                    <div className='absolute inset-0 overflow-hidden rounded-full grid place-items-center'>
                      <AccountCircleRounded className='text-neutral-400 size-6' />
                    </div>
                  </div>
                  <div className="flex flex-col font-['Inter:Regular',_sans-serif] gap-1 w-24">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={tempFormData.profesional1Nombre}
                          onChange={(e) => updateField('profesional1Nombre', e.target.value)}
                          placeholder="Nombre"
                          className="text-[#24282c] text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-1 py-0.5 outline-none focus:border-[var(--color-brand-500)]"
                        />
                        <input
                          type="text"
                          value={tempFormData.profesional1Rol}
                          onChange={(e) => updateField('profesional1Rol', e.target.value)}
                          placeholder="Rol"
                          className="text-[#cbd3d9] text-label-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-1 py-0.5 outline-none focus:border-[var(--color-brand-500)]"
                        />
                      </>
                    ) : (
                      <>
                        <p className='text-[#24282c] text-body-sm'>{formData.profesional1Nombre}</p>
                        <p className='text-[#cbd3d9] text-label-sm'>{formData.profesional1Rol}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className='flex gap-3 items-center'>
                  <div className='relative rounded-full size-9'>
                    <div className='absolute bg-white inset-0 rounded-full' />
                    <div className='absolute inset-0 overflow-hidden rounded-full grid place-items-center'>
                      <AccountCircleRounded className='text-neutral-400 size-6' />
                    </div>
                  </div>
                  <div className="flex flex-col font-['Inter:Regular',_sans-serif] gap-1 w-24">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={tempFormData.profesional2Nombre}
                          onChange={(e) => updateField('profesional2Nombre', e.target.value)}
                          placeholder="Nombre"
                          className="text-[#24282c] text-body-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-1 py-0.5 outline-none focus:border-[var(--color-brand-500)]"
                        />
                        <input
                          type="text"
                          value={tempFormData.profesional2Rol}
                          onChange={(e) => updateField('profesional2Rol', e.target.value)}
                          placeholder="Rol"
                          className="text-[#cbd3d9] text-label-sm w-full bg-[var(--color-neutral-50)] border border-[var(--color-neutral-300)] rounded px-1 py-0.5 outline-none focus:border-[var(--color-brand-500)]"
                        />
                      </>
                    ) : (
                      <>
                        <p className='text-[#24282c] text-body-sm'>{formData.profesional2Nombre}</p>
                        <p className='text-[#cbd3d9] text-label-sm'>{formData.profesional2Rol}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Archivos adjuntos */}
            <div className='flex flex-col gap-[var(--spacing-gapmd)]'>
              <div className='flex items-center justify-between w-full'>
                <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
                  Archivos adjuntos
                </p>
                <div className='flex gap-1 items-center cursor-pointer'>
                  <AddRounded className='size-6 text-brand-400' />
                  <p className="font-['Inter:Regular',_sans-serif] text-brand-400 text-body-sm">
                    Subir documento
                  </p>
                </div>
              </div>
              <div className='border border-neutral-300 box-border flex gap-[var(--spacing-gapsm)] items-center justify-center px-3 py-[var(--spacing-gapsm)] rounded-[calc(var(--radius-xl)/2)] w-fit'>
                <p className="font-['Inter:Regular',_sans-serif] text-neutral-700 text-body-sm">
                  Copia póliza seguro
                </p>
                <DownloadRounded className='size-6 text-neutral-700' />
              </div>
            </div>

            {/* Odontograma */}
            <div className='flex flex-col gap-[var(--spacing-gapsm)]'>
              <div className='flex items-center justify-between w-full'>
                <p className="font-['Inter:Medium',_sans-serif] text-neutral-900 text-body-md">
                  Odontograma
                </p>
                <div className='flex gap-1 items-center cursor-pointer'>
                  <AddRounded className='size-6 text-brand-400' />
                  <p className="font-['Inter:Regular',_sans-serif] text-brand-400 text-body-sm">
                    Subir odontograma
                  </p>
                </div>
              </div>
              <div className='border border-neutral-400 h-[10.875rem] rounded-[calc(var(--radius-xl)/2)] w-[14.1875rem] grid place-items-center'>
                <ImageRounded className='text-neutral-400 size-12' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


