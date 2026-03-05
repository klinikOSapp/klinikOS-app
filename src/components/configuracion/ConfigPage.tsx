'use client'

import {
  AccessTimeFilledRounded,
  AddRounded,
  CloudUploadRounded,
  DeleteRounded,
  FilterListRounded,
  KeyboardArrowDownRounded,
  MoreHorizRounded
} from '@/components/icons/md3'
import {
  useConfiguration,
  type DayOfWeek
} from '@/context/ConfigurationContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AddClinicModal, { ClinicFormData } from './AddClinicModal'

type FieldProps = {
  label: string
  helper?: string
  value?: string
  fullWidth?: boolean
  editable?: boolean
  onChange?: (value: string) => void
}

type Clinica = {
  id: string
  nombre: string
  direccion: string
  horario: string
  telefono: string
  email: string
  selected: boolean
}

type ClinicaInfo = {
  nombreComercial: string
  razonSocial: string
  cif: string
  direccion: string
  poblacion: string
  codigoPostal: string
  telefono: string
  email: string
  iban: string
  emailBancario: string
  logo?: string
  web?: string
}

function Field({
  label,
  helper,
  value = '',
  fullWidth = false,
  editable = false,
  onChange
}: FieldProps) {
  return (
    <div
      className={`flex flex-col gap-2 ${
        fullWidth ? 'w-full' : 'w-full md:w-[min(23.75rem,calc(50%-0.75rem))]'
      }`}
    >
      <p className='text-body-sm text-[var(--color-neutral-900)]'>{label}</p>
      <div className='flex flex-col gap-1 w-full'>
        {editable ? (
          <input
            type='text'
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className='h-[min(3rem,5vh)] w-full rounded-lg border border-[var(--color-brand-500)] bg-[var(--color-surface)] px-[min(0.625rem,1vw)] py-2 text-body-md text-[var(--color-neutral-900)] outline-none focus:ring-2 focus:ring-[var(--color-brand-200)] transition-colors'
          />
        ) : (
          <div className='flex items-center justify-between h-[min(3rem,5vh)] w-full rounded-lg border border-neutral-300 bg-[var(--color-surface)] px-[min(0.625rem,1vw)] py-2'>
            <span className='text-body-md text-[var(--color-neutral-900)]'>
              {value || '—'}
            </span>
            <span
              aria-hidden
              className='inline-flex items-center justify-center text-label-sm font-medium text-neutral-300'
            >
              *
            </span>
          </div>
        )}
        {helper ? (
          <p className='text-label-sm font-medium text-[var(--color-neutral-600)]'>
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  )
}

// Day labels for working hours configuration
const DAY_LABELS: Record<DayOfWeek, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
}

const ALL_DAYS: DayOfWeek[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo'
]

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<
    'general' | 'clinicas' | 'horarios'
  >('general')
  const [showClinicModal, setShowClinicModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showClinicSelector, setShowClinicSelector] = useState(false)
  const [selectedClinicIndex, setSelectedClinicIndex] = useState(0)
  const [isEditingHours, setIsEditingHours] = useState(false)

  // Logo file input ref
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Configuration context for working hours AND clinic info
  const {
    workingHours,
    updateWorkingHours,
    clinicInfo: contextClinicInfo,
    updateClinicInfo: updateContextClinicInfo,
    clinics: contextClinics,
    addClinic: addClinicToContext,
    updateClinic: updateClinicInContext,
    deleteClinic: deleteClinicFromContext
  } = useConfiguration()

  // Local clinic information state (for editing before save)
  const [clinicInfo, setClinicInfo] = useState<ClinicaInfo>({
    nombreComercial: contextClinicInfo.nombreComercial || '',
    razonSocial: contextClinicInfo.razonSocial || '',
    cif: contextClinicInfo.cif || '',
    direccion: contextClinicInfo.direccion || '',
    poblacion: contextClinicInfo.poblacion || '',
    codigoPostal: contextClinicInfo.codigoPostal || '',
    telefono: contextClinicInfo.telefono || '',
    email: contextClinicInfo.email || '',
    iban: contextClinicInfo.iban || '',
    emailBancario: contextClinicInfo.emailBancario || '',
    logo: contextClinicInfo.logo,
    web: contextClinicInfo.web
  })

  // Sync local state when context data loads from DB
  useEffect(() => {
    if (!contextClinicInfo.nombreComercial) return
    setClinicInfo({
      nombreComercial: contextClinicInfo.nombreComercial || '',
      razonSocial: contextClinicInfo.razonSocial || '',
      cif: contextClinicInfo.cif || '',
      direccion: contextClinicInfo.direccion || '',
      poblacion: contextClinicInfo.poblacion || '',
      codigoPostal: contextClinicInfo.codigoPostal || '',
      telefono: contextClinicInfo.telefono || '',
      email: contextClinicInfo.email || '',
      iban: contextClinicInfo.iban || '',
      emailBancario: contextClinicInfo.emailBancario || '',
      logo: contextClinicInfo.logo,
      web: contextClinicInfo.web
    })
  }, [contextClinicInfo])

  const updateClinicInfo = useCallback(
    (field: keyof ClinicaInfo, value: string) => {
      setClinicInfo((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // Handle logo upload
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const logoData = event.target?.result as string
          setClinicInfo((prev) => ({ ...prev, logo: logoData }))
        }
        reader.readAsDataURL(file)
      }
    },
    []
  )

  // Handle logo remove
  const handleRemoveLogo = useCallback(() => {
    setClinicInfo((prev) => ({ ...prev, logo: undefined }))
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }, [])

  const handleSaveInfo = useCallback(() => {
    // Save to context (this would also save to API in production)
    updateContextClinicInfo({
      nombreComercial: clinicInfo.nombreComercial,
      razonSocial: clinicInfo.razonSocial,
      cif: clinicInfo.cif,
      direccion: clinicInfo.direccion,
      poblacion: clinicInfo.poblacion,
      codigoPostal: clinicInfo.codigoPostal,
      telefono: clinicInfo.telefono,
      email: clinicInfo.email,
      iban: clinicInfo.iban,
      emailBancario: clinicInfo.emailBancario,
      logo: clinicInfo.logo,
      web: clinicInfo.web
    })
    setIsEditing(false)
  }, [clinicInfo, updateContextClinicInfo])

  const handleCancelEdit = useCallback(() => {
    // Reset to context values
    setClinicInfo({
      nombreComercial: contextClinicInfo.nombreComercial || '',
      razonSocial: contextClinicInfo.razonSocial || '',
      cif: contextClinicInfo.cif || '',
      direccion: contextClinicInfo.direccion || '',
      poblacion: contextClinicInfo.poblacion || '',
      codigoPostal: contextClinicInfo.codigoPostal || '',
      telefono: contextClinicInfo.telefono || '',
      email: contextClinicInfo.email || '',
      iban: contextClinicInfo.iban || '',
      emailBancario: contextClinicInfo.emailBancario || '',
      logo: contextClinicInfo.logo,
      web: contextClinicInfo.web
    })
    setIsEditing(false)
  }, [contextClinicInfo])

  // Selection state for clinics table (keyed by clinic id)
  const [selectedClinicIds, setSelectedClinicIds] = useState<Set<string>>(new Set())

  // Derive rows from context clinics
  const rows: Clinica[] = useMemo(
    () =>
      contextClinics.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        direccion: c.direccion,
        horario: c.horario,
        telefono: c.telefono,
        email: c.email,
        selected: selectedClinicIds.has(c.id)
      })),
    [contextClinics, selectedClinicIds]
  )
  const [search, setSearch] = useState('')

  const selectionCount = useMemo(
    () => rows.filter((r) => r.selected).length,
    [rows]
  )

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(term) ||
        r.direccion.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.telefono.toLowerCase().includes(term)
    )
  }, [rows, search])

  const toggleRow = useCallback((id: string) => {
    setSelectedClinicIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const deleteSelected = useCallback(() => {
    selectedClinicIds.forEach((id) => deleteClinicFromContext(id))
    setSelectedClinicIds(new Set())
  }, [selectedClinicIds, deleteClinicFromContext])

  const handleCreateClinica = useCallback((data: ClinicFormData) => {
    const horario =
      data.horarioApertura && data.horarioCierre
        ? `${data.horarioApertura} - ${data.horarioCierre}`
        : data.horarioApertura || data.horarioCierre || '08:00 - 20:00'

    addClinicToContext({
      nombre: data.nombreComercial || 'Nueva clínica',
      direccion: data.direccion || '',
      horario,
      telefono: data.telefonos.filter((t) => t).join(', ') || '',
      email: data.emails.filter((e) => e).join(', ') || '',
      isActive: true
    })
    setShowClinicModal(false)
  }, [addClinicToContext])

  // Edit clinic state and handlers
  const [editingClinic, setEditingClinic] = useState<Clinica | null>(null)

  const handleEditSelected = useCallback(() => {
    const selectedClinic = rows.find((r) => r.selected)
    if (selectedClinic) {
      setEditingClinic(selectedClinic)
      setShowClinicModal(true)
    }
  }, [rows])

  const handleUpdateClinica = useCallback(
    (data: ClinicFormData) => {
      if (editingClinic) {
        const horario =
          data.horarioApertura && data.horarioCierre
            ? `${data.horarioApertura} - ${data.horarioCierre}`
            : data.horarioApertura ||
              data.horarioCierre ||
              editingClinic.horario

        updateClinicInContext(editingClinic.id, {
          nombre: data.nombreComercial || editingClinic.nombre,
          direccion: data.direccion || editingClinic.direccion,
          horario,
          telefono:
            data.telefonos.filter((t) => t).join(', ') || editingClinic.telefono,
          email: data.emails.filter((e) => e).join(', ') || editingClinic.email
        })
        setEditingClinic(null)
      } else {
        handleCreateClinica(data)
      }
      setShowClinicModal(false)
    },
    [editingClinic, handleCreateClinica, updateClinicInContext]
  )

  return (
    <>
      {/* Section Header */}
      <div className='flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-[min(2rem,3vw)] min-h-[min(2.5rem,4vh)]'>
        <p className='text-title-lg font-normal text-[var(--color-neutral-900)]'>
          Datos de la clínica
        </p>
        <button
          type='button'
          className='flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors cursor-pointer self-start sm:self-auto'
          onClick={() => setShowClinicModal(true)}
        >
          <AddRounded className='text-[var(--color-neutral-900)] size-6' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)] whitespace-nowrap'>
            Añadir Nueva Clínica
          </span>
        </button>
      </div>

      {/* Content Card */}
      <div className='flex-1 mx-[min(2rem,3vw)] mt-[min(1.5rem,2vh)] mb-0 min-h-0'>
        <div className='bg-[var(--color-surface)] border border-neutral-200 rounded-t-lg h-full overflow-auto'>
          {/* Tabs */}
          <div className='sticky top-0 z-10 bg-[var(--color-surface)] px-[min(2.5rem,3vw)] pt-[min(1.5rem,2vh)] pb-2 min-h-[min(4rem,6vh)]'>
            <div className='flex gap-6 items-center overflow-x-auto'>
              <button
                type='button'
                onClick={() => setActiveTab('general')}
                className={`p-2 border-b transition-colors whitespace-nowrap ${
                  activeTab === 'general'
                    ? 'border-[var(--color-brand-500)]'
                    : 'border-transparent'
                }`}
              >
                <p
                  className={`text-title-sm font-medium ${
                    activeTab === 'general'
                      ? 'text-[var(--color-neutral-900)]'
                      : 'text-[var(--color-neutral-600)]'
                  }`}
                >
                  Información general
                </p>
              </button>
              {contextClinics.length > 1 && (
                <button
                  type='button'
                  onClick={() => setActiveTab('clinicas')}
                  className={`p-2 border-b transition-colors whitespace-nowrap ${
                    activeTab === 'clinicas'
                      ? 'border-[var(--color-brand-500)]'
                      : 'border-transparent'
                  }`}
                >
                  <p
                    className={`text-title-sm font-medium ${
                      activeTab === 'clinicas'
                        ? 'text-[var(--color-neutral-900)]'
                        : 'text-[var(--color-neutral-600)]'
                    }`}
                  >
                    Clínicas
                  </p>
                </button>
              )}
              <button
                type='button'
                onClick={() => setActiveTab('horarios')}
                className={`p-2 border-b transition-colors whitespace-nowrap ${
                  activeTab === 'horarios'
                    ? 'border-[var(--color-brand-500)]'
                    : 'border-transparent'
                }`}
              >
                <p
                  className={`text-title-sm font-medium ${
                    activeTab === 'horarios'
                      ? 'text-[var(--color-neutral-900)]'
                      : 'text-[var(--color-neutral-600)]'
                  }`}
                >
                  Horarios
                </p>
              </button>
            </div>
          </div>

          {activeTab === 'general' && (
            <div className='px-[min(3rem,4vw)] py-[min(1.5rem,2vh)]'>
              {/* Clinic Selector with Chevron (only if multiple clinics) */}
              <div className='relative pb-4 border-b border-neutral-200 mb-10'>
                {contextClinics.length > 1 ? (
                  <>
                    <button
                      type='button'
                      onClick={() => setShowClinicSelector(!showClinicSelector)}
                      className='flex items-center justify-between w-full hover:bg-[var(--color-neutral-50)] rounded-lg px-2 py-1 -mx-2 transition-colors'
                      aria-expanded={showClinicSelector}
                      aria-haspopup='listbox'
                    >
                      <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                        {rows[selectedClinicIndex]?.nombre || clinicInfo.nombreComercial || 'Clínica'}
                      </p>
                      <KeyboardArrowDownRounded
                        className={`size-6 text-[var(--color-neutral-900)] transition-transform ${
                          showClinicSelector ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {showClinicSelector && (
                      <div
                        className='absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-neutral-200 rounded-lg shadow-lg z-20 max-h-48 overflow-auto'
                        role='listbox'
                      >
                        {rows.map((clinic, index) => (
                          <button
                            key={clinic.id}
                            type='button'
                            role='option'
                            aria-selected={index === selectedClinicIndex}
                            onClick={() => {
                              setSelectedClinicIndex(index)
                              setShowClinicSelector(false)
                            }}
                            className={`w-full text-left px-4 py-3 text-body-md transition-colors ${
                              index === selectedClinicIndex
                                ? 'bg-[var(--color-brand-50)] text-[var(--color-brand-900)]'
                                : 'text-[var(--color-neutral-900)] hover:bg-[var(--color-neutral-50)]'
                            }`}
                          >
                            {clinic.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className='text-title-sm font-medium text-[var(--color-neutral-900)] px-2 py-1'>
                    {clinicInfo.nombreComercial || 'Clínica'}
                  </p>
                )}
              </div>

              {/* Form content */}
              <div className='flex flex-col gap-10 max-w-[min(49rem,100%)] pb-6'>
                {/* Información */}
                <section className='flex flex-col gap-4'>
                  <div className='flex items-center justify-between'>
                    <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                      Información
                    </p>
                    {isEditing ? (
                      <div className='flex items-center gap-2'>
                        <button
                          type='button'
                          onClick={handleCancelEdit}
                          className='bg-[var(--color-page-bg)] border border-neutral-300 rounded-2xl flex items-center justify-center px-3 py-1 h-[min(2rem,3vh)] hover:bg-neutral-100 transition-colors'
                        >
                          <span className='text-body-sm text-[var(--color-neutral-700)]'>
                            Cancelar
                          </span>
                        </button>
                        <button
                          type='button'
                          onClick={handleSaveInfo}
                          className='bg-[var(--color-brand-500)] border border-[var(--color-brand-500)] rounded-2xl flex items-center justify-center px-3 py-1 h-[min(2rem,3vh)] hover:bg-[var(--color-brand-600)] transition-colors'
                        >
                          <span className='text-body-sm text-white'>
                            Guardar
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => setIsEditing(true)}
                        className='bg-[var(--color-page-bg)] border border-[var(--color-brand-500)] rounded-2xl flex items-center justify-center px-3 py-1 h-[min(2rem,3vh)] hover:bg-[var(--color-brand-50)] transition-colors'
                      >
                        <span className='text-body-sm text-[var(--color-brand-900)]'>
                          Editar
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Logo Section */}
                  <div className='flex flex-col gap-3 mb-4'>
                    <p className='text-body-sm text-[var(--color-neutral-900)]'>
                      Logo de la clínica
                    </p>
                    <div className='flex items-start gap-6'>
                      {/* Logo Preview */}
                      <div className='w-[min(12rem,30vw)] h-[min(6rem,12vh)] rounded-lg border-2 border-dashed border-neutral-300 bg-[var(--color-neutral-50)] flex items-center justify-center overflow-hidden'>
                        {clinicInfo.logo ? (
                          <img
                            src={clinicInfo.logo}
                            alt='Logo de la clínica'
                            className='max-w-full max-h-full object-contain'
                          />
                        ) : (
                          <div className='flex flex-col items-center gap-1 text-center px-4'>
                            <CloudUploadRounded className='size-8 text-neutral-400' />
                            <span className='text-label-sm text-neutral-400'>
                              Sin logo
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Logo Actions */}
                      {isEditing && (
                        <div className='flex flex-col gap-2'>
                          <input
                            ref={logoInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleLogoUpload}
                            className='hidden'
                            id='clinic-logo-upload'
                          />
                          <button
                            type='button'
                            onClick={() => logoInputRef.current?.click()}
                            className='flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-brand-500)] bg-[var(--color-page-bg)] hover:bg-[var(--color-brand-50)] transition-colors cursor-pointer'
                          >
                            <CloudUploadRounded className='size-5 text-[var(--color-brand-700)]' />
                            <span className='text-body-sm text-[var(--color-brand-700)]'>
                              {clinicInfo.logo ? 'Cambiar logo' : 'Subir logo'}
                            </span>
                          </button>
                          {clinicInfo.logo && (
                            <button
                              type='button'
                              onClick={handleRemoveLogo}
                              className='flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors cursor-pointer'
                            >
                              <DeleteRounded className='size-5 text-red-600' />
                              <span className='text-body-sm text-red-600'>
                                Eliminar
                              </span>
                            </button>
                          )}
                          <p className='text-label-sm text-[var(--color-neutral-500)] max-w-[12rem]'>
                            Formatos: PNG, JPG, SVG. Tamaño recomendado:
                            400x200px
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col gap-6'>
                    <Field
                      label='Nombre comercial'
                      value={clinicInfo.nombreComercial}
                      fullWidth
                      editable={isEditing}
                      onChange={(v) => updateClinicInfo('nombreComercial', v)}
                    />
                    <div className='flex flex-wrap gap-6'>
                      <Field
                        label='Razón social'
                        value={clinicInfo.razonSocial}
                        editable={isEditing}
                        onChange={(v) => updateClinicInfo('razonSocial', v)}
                      />
                      <Field
                        label='CIF/NIF'
                        value={clinicInfo.cif}
                        editable={isEditing}
                        onChange={(v) => updateClinicInfo('cif', v)}
                      />
                    </div>
                  </div>
                </section>

                {/* Dirección */}
                <section className='flex flex-col gap-4'>
                  <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                    Dirección
                  </p>
                  <div className='flex flex-col gap-6'>
                    <Field
                      label='Dirección completa'
                      value={clinicInfo.direccion}
                      fullWidth
                      editable={isEditing}
                      onChange={(v) => updateClinicInfo('direccion', v)}
                    />
                    <div className='flex flex-wrap gap-6'>
                      <Field
                        label='Población'
                        value={clinicInfo.poblacion}
                        editable={isEditing}
                        onChange={(v) => updateClinicInfo('poblacion', v)}
                      />
                      <Field
                        label='Código Postal'
                        value={clinicInfo.codigoPostal}
                        editable={isEditing}
                        onChange={(v) => updateClinicInfo('codigoPostal', v)}
                      />
                    </div>
                  </div>
                </section>

                {/* Información de contacto */}
                <section className='flex flex-col gap-4'>
                  <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                    Información de contacto
                  </p>
                  <div className='flex flex-col gap-6'>
                    <div className='flex flex-wrap gap-6'>
                      <Field
                        label='Teléfono'
                        value={clinicInfo.telefono}
                        editable={isEditing}
                        onChange={(v) => updateClinicInfo('telefono', v)}
                      />
                      <Field
                        label='Email'
                        value={clinicInfo.email}
                        editable={isEditing}
                        onChange={(v) => updateClinicInfo('email', v)}
                      />
                    </div>
                    <Field
                      label='Página web'
                      value={clinicInfo.web || ''}
                      fullWidth
                      editable={isEditing}
                      onChange={(v) => updateClinicInfo('web', v)}
                    />
                  </div>
                </section>

                {/* Información bancaria */}
                <section className='flex flex-col gap-4'>
                  <p className='text-title-sm font-medium text-[var(--color-neutral-900)]'>
                    Información bancaria
                  </p>
                  <div className='flex flex-wrap gap-6'>
                    <Field
                      label='IBAN'
                      value={clinicInfo.iban}
                      editable={isEditing}
                      onChange={(v) => updateClinicInfo('iban', v)}
                    />
                    <Field
                      label='Email facturación'
                      value={clinicInfo.emailBancario}
                      editable={isEditing}
                      onChange={(v) => updateClinicInfo('emailBancario', v)}
                    />
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'clinicas' && (
            <div className='px-[min(2.5rem,3vw)] py-[min(1.5rem,2vh)] flex flex-col h-full min-h-0'>
              {/* Title */}
              <p className='text-title-sm font-medium text-[var(--color-neutral-900)] mb-[min(1.5rem,2vh)]'>
                {clinicInfo.nombreComercial || 'Clínicas'}
              </p>

              {/* Toolbar */}
              <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-[min(1.5rem,2vh)]'>
                {/* Selection Actions */}
                <div className='flex items-center'>
                  <div className='flex items-center bg-[var(--color-brand-0)] text-[var(--color-brand-700)] px-2 py-1 rounded-l border border-[var(--color-brand-200)]'>
                    <span className='text-body-sm'>
                      {selectionCount === 0
                        ? '0 seleccionado'
                        : `${selectionCount} seleccionado${
                            selectionCount > 1 ? 's' : ''
                          }`}
                    </span>
                  </div>
                  <button
                    type='button'
                    aria-label='Editar seleccionado'
                    className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors disabled:opacity-50'
                    onClick={handleEditSelected}
                    disabled={selectionCount !== 1}
                  >
                    <span className='text-body-sm'>Editar</span>
                  </button>
                  <button
                    type='button'
                    aria-label='Eliminar seleccionados'
                    className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 border-t border-b border-r border-neutral-300 cursor-pointer hover:bg-neutral-100 transition-colors disabled:opacity-50'
                    onClick={deleteSelected}
                    disabled={selectionCount === 0}
                  >
                    <DeleteRounded className='size-5 text-[var(--color-neutral-700)]' />
                  </button>
                  <button
                    type='button'
                    aria-label='Más opciones'
                    className='flex items-center bg-[var(--color-page-bg)] text-[var(--color-neutral-700)] px-2 py-1 rounded-r border-t border-b border-r border-neutral-300 hover:bg-neutral-100 transition-colors'
                  >
                    <MoreHorizRounded className='size-5 text-[var(--color-neutral-700)]' />
                  </button>
                </div>

                {/* Search & Filters */}
                <div className='flex flex-wrap items-center gap-2'>
                  <input
                    type='search'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Buscar clínicas...'
                    aria-label='Buscar clínicas'
                    className='h-8 w-full sm:w-40 lg:w-48 rounded-full px-3 text-body-sm border border-[var(--color-neutral-700)] outline-none bg-[var(--color-page-bg)] focus:border-[var(--color-brand-500)] focus:ring-1 focus:ring-[var(--color-brand-500)] transition-colors'
                  />
                  <button
                    type='button'
                    aria-label='Filtrar clínicas'
                    className='flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--color-neutral-700)] hover:bg-neutral-100 transition-colors'
                  >
                    <FilterListRounded className='size-5 text-[var(--color-neutral-700)]' />
                    <span className='text-body-sm text-[var(--color-neutral-700)]'>
                      Todos
                    </span>
                  </button>
                  <button
                    type='button'
                    className='flex items-center gap-2 h-8 px-4 rounded-full border border-neutral-300 bg-[var(--color-page-bg)] hover:bg-neutral-100 transition-colors'
                    onClick={() => setShowClinicModal(true)}
                  >
                    <AddRounded className='text-[var(--color-neutral-900)] size-5' />
                    <span className='text-body-md text-[var(--color-neutral-900)] whitespace-nowrap'>
                      Añadir Clínica
                    </span>
                  </button>
                </div>
              </div>

              {/* Table Container - Responsive without forced horizontal scroll */}
              <div className='flex-1 overflow-auto min-h-0'>
                <table className='w-full border-collapse table-fixed'>
                  <thead className='sticky top-0 bg-[var(--color-surface)] z-10'>
                    <tr>
                      <th className='w-[3rem] h-10 text-center text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'></th>
                      <th className='w-[22%] h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                        Nombre de la clínica
                      </th>
                      <th className='w-[25%] h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                        Dirección completa
                      </th>
                      <th className='w-[15%] h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                        Horario
                      </th>
                      <th className='w-[13%] h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                        Teléfono
                      </th>
                      <th className='w-[22%] h-10 text-left px-2 text-body-sm font-normal text-[var(--color-neutral-600)] border-b border-neutral-200'>
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='py-12 text-center'>
                          <div className='flex flex-col items-center gap-2'>
                            <p className='text-body-sm text-[var(--color-neutral-500)]'>
                              {search
                                ? 'No se encontraron clínicas'
                                : 'No hay clínicas registradas'}
                            </p>
                            <p className='text-body-sm text-[var(--color-neutral-400)]'>
                              {search
                                ? 'Intenta con otros términos de búsqueda'
                                : 'Añade una nueva clínica para comenzar'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((clinica) => (
                        <tr
                          key={clinica.id}
                          className={`h-12 ${
                            clinica.selected
                              ? 'bg-[var(--color-brand-50)]'
                              : 'bg-white'
                          } hover:bg-[var(--color-neutral-50)] transition-colors`}
                        >
                          <td className='text-center border-b border-neutral-300'>
                            <input
                              type='checkbox'
                              checked={clinica.selected}
                              onChange={() => toggleRow(clinica.id)}
                              aria-label={`Seleccionar ${clinica.nombre}`}
                              className='accent-[var(--color-brand-500)] cursor-pointer size-4'
                            />
                          </td>
                          <td className='px-2 border-b border-neutral-300'>
                            <div className='flex items-center gap-2 min-w-0'>
                              <span
                                className='flex-none size-8 rounded-full bg-neutral-100'
                                aria-hidden
                              />
                              <span className='text-body-sm text-[var(--color-neutral-900)] truncate'>
                                {clinica.nombre}
                              </span>
                            </div>
                          </td>
                          <td className='px-2 border-b border-neutral-300'>
                            <span className='text-body-sm text-[var(--color-neutral-900)] truncate block'>
                              {clinica.direccion}
                            </span>
                          </td>
                          <td className='px-2 border-b border-neutral-300'>
                            <span className='text-body-sm text-[var(--color-neutral-900)] truncate block'>
                              {clinica.horario}
                            </span>
                          </td>
                          <td className='px-2 border-b border-neutral-300'>
                            <span className='text-body-sm text-[var(--color-neutral-900)] truncate block'>
                              {clinica.telefono}
                            </span>
                          </td>
                          <td className='px-2 border-b border-neutral-300'>
                            <span className='text-body-sm text-[var(--color-neutral-900)] truncate block'>
                              {clinica.email}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'horarios' && (
            <div className='px-[min(3rem,4vw)] py-[min(1.5rem,2vh)]'>
              {/* Working Hours Section Header */}
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <AccessTimeFilledRounded className='size-6 text-[var(--color-brand-500)]' />
                  <div>
                    <h3 className='text-title-md font-medium text-[var(--color-neutral-900)]'>
                      Horarios de trabajo
                    </h3>
                    <p className='text-body-sm text-[var(--color-neutral-500)]'>
                      Configura los horarios predeterminados de tu clínica
                    </p>
                  </div>
                </div>
                {!isEditingHours && (
                  <button
                    type='button'
                    onClick={() => setIsEditingHours(true)}
                    className='px-4 py-2 text-body-md font-medium text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-lg transition-colors'
                  >
                    Editar
                  </button>
                )}
              </div>

              {/* Working Days */}
              <div className='bg-neutral-50 rounded-xl p-6 mb-6'>
                <h4 className='text-body-md font-medium text-[var(--color-neutral-700)] mb-4'>
                  Días laborables
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {ALL_DAYS.map((day) => {
                    const isWorking = workingHours.workingDays.includes(day)
                    return (
                      <button
                        key={day}
                        type='button'
                        disabled={!isEditingHours}
                        onClick={() => {
                          if (!isEditingHours) return
                          const newDays = isWorking
                            ? workingHours.workingDays.filter((d) => d !== day)
                            : [...workingHours.workingDays, day]
                          updateWorkingHours({ workingDays: newDays })
                        }}
                        className={`px-4 py-2 rounded-lg text-body-md font-medium transition-colors ${
                          isWorking
                            ? 'bg-[var(--color-brand-500)] text-white'
                            : 'bg-white border border-neutral-200 text-[var(--color-neutral-600)]'
                        } ${
                          isEditingHours
                            ? 'cursor-pointer hover:opacity-80'
                            : 'cursor-default'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Hours Configuration */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Default Hours */}
                <div className='bg-white rounded-xl border border-neutral-200 p-6'>
                  <h4 className='text-body-md font-medium text-[var(--color-neutral-700)] mb-4'>
                    Horario por defecto
                  </h4>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <label className='w-24 text-body-sm text-[var(--color-neutral-600)]'>
                        Apertura
                      </label>
                      {isEditingHours ? (
                        <input
                          type='time'
                          value={`${workingHours.defaultStartHour
                            .toString()
                            .padStart(2, '0')}:00`}
                          onChange={(e) => {
                            const hour = parseInt(
                              e.target.value.split(':')[0],
                              10
                            )
                            updateWorkingHours({ defaultStartHour: hour })
                          }}
                          className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                        />
                      ) : (
                        <span className='text-body-md text-[var(--color-neutral-900)]'>
                          {workingHours.defaultStartHour
                            .toString()
                            .padStart(2, '0')}
                          :00
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-4'>
                      <label className='w-24 text-body-sm text-[var(--color-neutral-600)]'>
                        Cierre
                      </label>
                      {isEditingHours ? (
                        <input
                          type='time'
                          value={`${workingHours.defaultEndHour
                            .toString()
                            .padStart(2, '0')}:00`}
                          onChange={(e) => {
                            const hour = parseInt(
                              e.target.value.split(':')[0],
                              10
                            )
                            updateWorkingHours({ defaultEndHour: hour })
                          }}
                          className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                        />
                      ) : (
                        <span className='text-body-md text-[var(--color-neutral-900)]'>
                          {workingHours.defaultEndHour
                            .toString()
                            .padStart(2, '0')}
                          :00
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shift Configuration */}
                <div className='bg-white rounded-xl border border-neutral-200 p-6'>
                  <h4 className='text-body-md font-medium text-[var(--color-neutral-700)] mb-4'>
                    Turnos
                  </h4>
                  <div className='space-y-4'>
                    <div>
                      <p className='text-body-sm text-[var(--color-neutral-500)] mb-2'>
                        Turno mañana
                      </p>
                      <div className='flex items-center gap-2'>
                        {isEditingHours ? (
                          <>
                            <input
                              type='time'
                              value={workingHours.morningShift.start}
                              onChange={(e) =>
                                updateWorkingHours({
                                  morningShift: {
                                    ...workingHours.morningShift,
                                    start: e.target.value
                                  }
                                })
                              }
                              className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                            />
                            <span className='text-neutral-400'>-</span>
                            <input
                              type='time'
                              value={workingHours.morningShift.end}
                              onChange={(e) =>
                                updateWorkingHours({
                                  morningShift: {
                                    ...workingHours.morningShift,
                                    end: e.target.value
                                  }
                                })
                              }
                              className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                            />
                          </>
                        ) : (
                          <span className='text-body-md text-[var(--color-neutral-900)]'>
                            {workingHours.morningShift.start} -{' '}
                            {workingHours.morningShift.end}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className='text-body-sm text-[var(--color-neutral-500)] mb-2'>
                        Turno tarde
                      </p>
                      <div className='flex items-center gap-2'>
                        {isEditingHours ? (
                          <>
                            <input
                              type='time'
                              value={workingHours.afternoonShift.start}
                              onChange={(e) =>
                                updateWorkingHours({
                                  afternoonShift: {
                                    ...workingHours.afternoonShift,
                                    start: e.target.value
                                  }
                                })
                              }
                              className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                            />
                            <span className='text-neutral-400'>-</span>
                            <input
                              type='time'
                              value={workingHours.afternoonShift.end}
                              onChange={(e) =>
                                updateWorkingHours({
                                  afternoonShift: {
                                    ...workingHours.afternoonShift,
                                    end: e.target.value
                                  }
                                })
                              }
                              className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                            />
                          </>
                        ) : (
                          <span className='text-body-md text-[var(--color-neutral-900)]'>
                            {workingHours.afternoonShift.start} -{' '}
                            {workingHours.afternoonShift.end}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot Duration */}
              <div className='bg-white rounded-xl border border-neutral-200 p-6 mt-6'>
                <h4 className='text-body-md font-medium text-[var(--color-neutral-700)] mb-4'>
                  Duración de citas
                </h4>
                <div className='flex items-center gap-4'>
                  <label className='text-body-sm text-[var(--color-neutral-600)]'>
                    Intervalo mínimo
                  </label>
                  {isEditingHours ? (
                    <select
                      value={workingHours.slotDurationMinutes}
                      onChange={(e) =>
                        updateWorkingHours({
                          slotDurationMinutes: parseInt(e.target.value, 10)
                        })
                      }
                      className='px-3 py-2 rounded-lg border border-neutral-300 text-body-md'
                    >
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={20}>20 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  ) : (
                    <span className='text-body-md text-[var(--color-neutral-900)]'>
                      {workingHours.slotDurationMinutes} minutos
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Actions */}
              {isEditingHours && (
                <div className='flex justify-end gap-3 mt-6'>
                  <button
                    type='button'
                    onClick={() => setIsEditingHours(false)}
                    className='px-4 py-2 text-body-md font-medium text-[var(--color-neutral-700)] hover:bg-neutral-100 rounded-lg transition-colors'
                  >
                    Cancelar
                  </button>
                  <button
                    type='button'
                    onClick={() => setIsEditingHours(false)}
                    className='px-4 py-2 text-body-md font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-lg transition-colors'
                  >
                    Guardar cambios
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddClinicModal
        open={showClinicModal}
        onClose={() => {
          setShowClinicModal(false)
          setEditingClinic(null)
        }}
        onSubmit={handleUpdateClinica}
        title={editingClinic ? 'Editar clínica' : 'Añadir nueva clínica'}
        submitLabel={editingClinic ? 'Guardar cambios' : 'Crear clínica'}
        mode={editingClinic ? 'edit' : 'create'}
        initialData={
          editingClinic
            ? {
                nombreComercial: editingClinic.nombre,
                direccion: editingClinic.direccion,
                telefonos: editingClinic.telefono.split(', '),
                emails: editingClinic.email.split(', ')
              }
            : undefined
        }
      />
    </>
  )
}
