'use client'

import { KeyboardArrowDownRounded, SearchRounded } from '@/components/icons/md3'
import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import React from 'react'
import {
  PROFESSIONALS,
  TREATMENT_AREAS,
  TREATMENT_CATALOG,
  TREATMENT_FAMILIES,
  type TreatmentCatalogEntry
} from './treatmentTypes'

type FilterPillProps = {
  label: string
  onClick?: () => void
}

function FilterPill({ label, onClick }: FilterPillProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex items-center gap-[0.5rem] h-[2rem] px-[1rem] py-[0.5rem] border-[0.5px] border-[#535C66] rounded-[8.5rem] bg-transparent hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer'
    >
      <span className='text-[0.875rem] leading-[1.25rem] text-[#535C66]'>
        {label}
      </span>
      <KeyboardArrowDownRounded className='w-[1.25rem] h-[1.25rem] text-[#535C66]' />
    </button>
  )
}

type CatalogRowProps = {
  codigo: string
  descripcion: string
  precio: string
  isSelected?: boolean
  onClick?: () => void
  onDoubleClick?: () => void
}

function CatalogRow({
  codigo,
  descripcion,
  precio,
  isSelected,
  onClick,
  onDoubleClick
}: CatalogRowProps) {
  return (
    <div
      className={[
        'flex items-center h-[2rem] border-b-[0.5px] border-l-[0.5px] border-r-[0.5px] cursor-pointer transition-colors',
        isSelected
          ? 'bg-[#E9FBF9] border-[var(--color-brand-500)]'
          : 'border-[#CBD3D9] hover:bg-[var(--color-neutral-50)]'
      ].join(' ')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className='w-[4rem] px-[0.375rem] py-[0.25rem]'>
        <span
          className={`text-[0.8125rem] leading-[1.125rem] ${
            isSelected
              ? 'text-[var(--color-brand-700)] font-medium'
              : 'text-[#24282C]'
          }`}
        >
          {codigo}
        </span>
      </div>
      <div className='flex-1 px-[0.375rem] py-[0.25rem] overflow-hidden'>
        <span
          className={`text-[0.8125rem] leading-[1.125rem] truncate block ${
            isSelected ? 'text-[var(--color-brand-700)]' : 'text-[#24282C]'
          }`}
        >
          {descripcion}
        </span>
      </div>
      <div className='w-[4rem] px-[0.375rem] py-[0.25rem]'>
        <span
          className={`text-[0.8125rem] leading-[1.125rem] ${
            isSelected ? 'text-[var(--color-brand-700)]' : 'text-[#24282C]'
          }`}
        >
          {precio}
        </span>
      </div>
    </div>
  )
}

type CatalogoTratamientosProps = {
  onSelectTreatment?: (codigo: string, entry: TreatmentCatalogEntry) => void
  onDoubleClickTreatment?: (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => void // Doble clic para añadir directamente
  selectedTreatmentCode?: string // Código del tratamiento actualmente seleccionado
  selectedFamily?: string
  selectedDoctor?: string
  selectedArea?: string
  compact?: boolean // Versión compacta para modales más pequeños
}

export default function CatalogoTratamientos({
  onSelectTreatment,
  onDoubleClickTreatment,
  selectedTreatmentCode,
  selectedFamily,
  selectedDoctor,
  selectedArea,
  compact = false
}: CatalogoTratamientosProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [familyFilter, setFamilyFilter] = React.useState(selectedFamily || '')
  const [doctorFilter, setDoctorFilter] = React.useState(selectedDoctor || '')
  const [areaFilter, setAreaFilter] = React.useState(selectedArea || '')

  // Estados para controlar los dropdowns
  const [showFamilyDropdown, setShowFamilyDropdown] = React.useState(false)
  const [showDoctorDropdown, setShowDoctorDropdown] = React.useState(false)
  const [showAreaDropdown, setShowAreaDropdown] = React.useState(false)
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [dbCatalog, setDbCatalog] = React.useState<Array<[string, TreatmentCatalogEntry]>>([])

  React.useEffect(() => {
    let isMounted = true

    async function hydrateCatalogFromDb() {
      try {
        if (!isClinicInitialized || !activeClinicId) {
          if (isMounted) setDbCatalog([])
          return
        }

        const supabase = createSupabaseBrowserClient()
        const { data: clinicRow, error: clinicError } = await supabase
          .from('clinics')
          .select('organization_id')
          .eq('id', activeClinicId)
          .maybeSingle()

        const organizationId = String(clinicRow?.organization_id || '').trim()
        if (clinicError || !organizationId) {
          if (isMounted) setDbCatalog([])
          return
        }

        const { data: services, error: servicesError } = await supabase
          .from('service_catalog')
          .select('id, treatment_code, name, standard_price')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('name', { ascending: true })

        if (servicesError) {
          console.warn('No se pudo cargar service_catalog, usando catálogo local', servicesError)
          if (isMounted) setDbCatalog([])
          return
        }

        const mappedCatalog = (services || [])
          .map((row: any) => {
            const id = Number(row?.id)
            const code = String(row?.treatment_code || '').trim() || `SVC-${id}`
            const name = String(row?.name || '').trim()
            if (!name) return null

            const numericPrice = Number(row?.standard_price ?? 0)
            const amount = `${numericPrice.toLocaleString('es-ES', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2
            })} €`

            return [
              code,
              {
                description: name,
                amount
              }
            ] as [string, TreatmentCatalogEntry]
          })
          .filter(
            (entry): entry is [string, TreatmentCatalogEntry] => entry !== null
          )

        if (isMounted) setDbCatalog(mappedCatalog)
      } catch (error) {
        console.warn('Error cargando catálogo de tratamientos desde DB', error)
        if (isMounted) setDbCatalog([])
      }
    }

    void hydrateCatalogFromDb()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized])

  const sourceCatalog = React.useMemo(
    () => (dbCatalog.length > 0 ? dbCatalog : Object.entries(TREATMENT_CATALOG)),
    [dbCatalog]
  )

  // Filtrar el catálogo
  const filteredCatalog = React.useMemo(() => {
    return sourceCatalog.filter(([codigo, entry]) => {
      // Filtro por búsqueda
      const matchesSearch =
        searchTerm === '' ||
        codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro por familia
      const matchesFamily =
        familyFilter === '' || !entry.familia || entry.familia === familyFilter

      return matchesSearch && matchesFamily
    })
  }, [sourceCatalog, searchTerm, familyFilter])

  const handleTreatmentClick = (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => {
    onSelectTreatment?.(codigo, entry)
  }

  const handleTreatmentDoubleClick = (
    codigo: string,
    entry: TreatmentCatalogEntry
  ) => {
    onDoubleClickTreatment?.(codigo, entry)
  }

  const familyLabel =
    TREATMENT_FAMILIES.find((f) => f.value === familyFilter)?.label || 'Familia'
  const doctorLabel =
    PROFESSIONALS.find((p) => p.value === doctorFilter)?.label || 'Doctor'
  const areaLabel =
    TREATMENT_AREAS.find((a) => a.value === areaFilter)?.label || 'Área'

  return (
    <div
      className={`flex flex-col w-full ${
        compact ? 'gap-[0.5rem]' : 'gap-[0.75rem]'
      }`}
    >
      {/* Filtros y buscador */}
      <div
        className={`flex flex-wrap items-center ${
          compact ? 'gap-[0.375rem]' : 'gap-[0.5rem]'
        }`}
      >
        {/* Filtros pill */}
        <div className='flex gap-[0.375rem] items-center relative'>
          {/* Familia dropdown */}
          <div className='relative'>
            <FilterPill
              label={familyLabel}
              onClick={() => setShowFamilyDropdown(!showFamilyDropdown)}
            />
            {showFamilyDropdown && (
              <div className='absolute top-full left-0 mt-1 bg-white border border-[#CBD3D9] rounded-lg shadow-lg z-10 min-w-[10rem]'>
                <button
                  type='button'
                  className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-50)] cursor-pointer'
                  onClick={() => {
                    setFamilyFilter('')
                    setShowFamilyDropdown(false)
                  }}
                >
                  Todos
                </button>
                {TREATMENT_FAMILIES.map((fam) => (
                  <button
                    key={fam.value}
                    type='button'
                    className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-50)] cursor-pointer'
                    onClick={() => {
                      setFamilyFilter(fam.value)
                      setShowFamilyDropdown(false)
                    }}
                  >
                    {fam.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Doctor dropdown */}
          <div className='relative'>
            <FilterPill
              label={doctorLabel}
              onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
            />
            {showDoctorDropdown && (
              <div className='absolute top-full left-0 mt-1 bg-white border border-[#CBD3D9] rounded-lg shadow-lg z-10 min-w-[10rem]'>
                <button
                  type='button'
                  className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-50)] cursor-pointer'
                  onClick={() => {
                    setDoctorFilter('')
                    setShowDoctorDropdown(false)
                  }}
                >
                  Todos
                </button>
                {PROFESSIONALS.map((doc) => (
                  <button
                    key={doc.value}
                    type='button'
                    className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-50)] cursor-pointer'
                    onClick={() => {
                      setDoctorFilter(doc.value)
                      setShowDoctorDropdown(false)
                    }}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Área dropdown */}
          <div className='relative'>
            <FilterPill
              label={areaLabel}
              onClick={() => setShowAreaDropdown(!showAreaDropdown)}
            />
            {showAreaDropdown && (
              <div className='absolute top-full left-0 mt-1 bg-white border border-[#CBD3D9] rounded-lg shadow-lg z-10 min-w-[10rem]'>
                <button
                  type='button'
                  className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-50)] cursor-pointer'
                  onClick={() => {
                    setAreaFilter('')
                    setShowAreaDropdown(false)
                  }}
                >
                  Todos
                </button>
                {TREATMENT_AREAS.map((area) => (
                  <button
                    key={area.value}
                    type='button'
                    className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-neutral-50)] cursor-pointer'
                    onClick={() => {
                      setAreaFilter(area.value)
                      setShowAreaDropdown(false)
                    }}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buscador - flex-1 en pantallas grandes, ancho completo en pequeñas */}
        <div className='flex items-center gap-[0.5rem] px-[0.75rem] py-[0.375rem] border border-[#CBD3D9] rounded-[8.5rem] bg-white flex-1 min-w-[10rem] max-w-[16rem]'>
          <SearchRounded className='w-[1.25rem] h-[1.25rem] text-[#535C66] shrink-0' />
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Buscar tratamiento...'
            className='flex-1 bg-transparent border-none outline-none text-[0.875rem] leading-[1.25rem] text-[#24282C] placeholder:text-[#AEB8C2] w-full'
          />
        </div>
      </div>

      {/* Tabla de catálogo */}
      <div className='flex flex-col'>
        {/* Header */}
        <div
          className={`flex items-center border-b-[0.5px] border-[#CBD3D9] ${
            compact ? 'h-[1.5rem]' : 'h-[1.75rem]'
          }`}
        >
          <div className='w-[4rem] px-[0.375rem] py-[0.125rem]'>
            <span
              className={`leading-[1.125rem] text-[#535C66] ${
                compact ? 'text-[0.75rem]' : 'text-[0.8125rem]'
              }`}
            >
              Código
            </span>
          </div>
          <div className='flex-1 px-[0.375rem] py-[0.125rem]'>
            <span
              className={`leading-[1.125rem] text-[#535C66] ${
                compact ? 'text-[0.75rem]' : 'text-[0.8125rem]'
              }`}
            >
              Descripción
            </span>
          </div>
          <div className='w-[4rem] px-[0.375rem] py-[0.125rem]'>
            <span
              className={`leading-[1.125rem] text-[#535C66] ${
                compact ? 'text-[0.75rem]' : 'text-[0.8125rem]'
              }`}
            >
              Precio
            </span>
          </div>
        </div>

        {/* Rows */}
        <div
          className={
            compact
              ? 'max-h-[6rem] overflow-y-auto'
              : 'max-h-[10rem] overflow-y-auto'
          }
        >
          {filteredCatalog.map(([codigo, entry]) => (
            <CatalogRow
              key={codigo}
              codigo={codigo}
              descripcion={entry.description}
              precio={entry.amount}
              isSelected={selectedTreatmentCode === codigo}
              onClick={() => handleTreatmentClick(codigo, entry)}
              onDoubleClick={() => handleTreatmentDoubleClick(codigo, entry)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
