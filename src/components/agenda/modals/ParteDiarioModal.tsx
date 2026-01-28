'use client'

import { MD3Icon } from '@/components/icons/MD3Icon'
import { DatePickerInput } from '@/components/pacientes/modals/add-patient/AddPatientInputs'
import Portal from '@/components/ui/Portal'
import { useAppointments } from '@/context/AppointmentsContext'
import {
  calculateDateRange,
  dateToISO,
  generateExportDocuments,
  downloadDocument,
  downloadAllDocuments,
  revokeDocumentUrls,
  type DateRange,
  type ExportFormat,
  type TimeRangePreset,
  type GeneratedDocument
} from '@/utils/exportUtils'
import React, { useEffect, useMemo, useState, useCallback } from 'react'

// ============================================
// TYPES
// ============================================

type ParteDiarioModalProps = {
  isOpen: boolean
  onClose: () => void
  initialProfessionals?: string[]
  initialDate?: Date
}

// ============================================
// TIME RANGE PRESETS CONFIG
// ============================================

const TIME_RANGE_PRESETS: {
  id: TimeRangePreset
  label: string
  description: string
}[] = [
  { id: 'today', label: 'Día', description: 'Solo día seleccionado' },
  { id: 'week', label: 'Semana', description: '±3 días del seleccionado' },
  { id: 'month', label: 'Mes', description: '±15 días del seleccionado' },
  { id: 'custom', label: 'Personalizado', description: 'Seleccionar fechas' }
]


// ============================================
// PROFESSIONAL CHECKBOX COMPONENT
// ============================================

function ProfessionalCheckbox({
  professional,
  isSelected,
  onToggle
}: {
  professional: string
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type='button'
      onClick={onToggle}
      className={[
        'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors',
        isSelected
          ? 'bg-[var(--color-brand-0)] border border-[var(--color-brand-300)]'
          : 'bg-[var(--color-neutral-50)] border border-transparent hover:border-[var(--color-neutral-300)]'
      ].join(' ')}
    >
      <div
        className={[
          'size-5 rounded border-2 flex items-center justify-center transition-colors',
          isSelected
            ? 'bg-[var(--color-brand-500)] border-[var(--color-brand-500)]'
            : 'bg-white border-[var(--color-neutral-300)]'
        ].join(' ')}
      >
        {isSelected && (
          <MD3Icon name='CheckRounded' size={0.75} className='text-white' />
        )}
      </div>
      <span className='text-body-md text-[var(--color-neutral-900)] truncate flex-1'>
        {professional}
      </span>
    </button>
  )
}

// ============================================
// PDF PREVIEW COMPONENT (INLINE)
// ============================================

function PdfPreviewSection({
  documents,
  currentIndex,
  onIndexChange,
  onDownload,
  onDownloadAll,
  onClose
}: {
  documents: GeneratedDocument[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onDownload: (doc: GeneratedDocument) => void
  onDownloadAll: () => void
  onClose: () => void
}) {
  const currentDoc = documents[currentIndex]

  return (
    <div className='flex flex-col h-full'>
      {/* Preview Header */}
      <div className='flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-neutral-100)]'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={onClose}
            className='flex items-center gap-1 text-body-sm text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)] transition-colors'
          >
            <MD3Icon name='ArrowBackRounded' size='sm' />
            <span>Volver</span>
          </button>
          <div className='h-5 w-px bg-[var(--color-neutral-300)]' />
          <span className='text-body-md font-medium text-[var(--color-neutral-900)]'>
            Vista previa
          </span>
        </div>

        {/* Document navigation (if multiple) */}
        {documents.length > 1 && (
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className='size-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-neutral-200)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              <MD3Icon name='ChevronLeftRounded' size='sm' />
            </button>
            <span className='text-body-sm text-[var(--color-neutral-600)]'>
              {currentIndex + 1} de {documents.length}
            </span>
            <button
              type='button'
              onClick={() => onIndexChange(Math.min(documents.length - 1, currentIndex + 1))}
              disabled={currentIndex === documents.length - 1}
              className='size-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--color-neutral-200)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              <MD3Icon name='ChevronRightRounded' size='sm' />
            </button>
          </div>
        )}
      </div>

      {/* Document info bar */}
      <div className='flex items-center justify-between px-6 py-2 border-b border-[var(--color-border-default)] bg-white'>
        <div className='flex items-center gap-3'>
          <MD3Icon
            name='PictureAsPdfRounded'
            size='md'
            className='text-[#E53935]'
          />
          <div>
            <p className='text-body-sm font-medium text-[var(--color-neutral-900)]'>
              {currentDoc.professional}
            </p>
            <p className='text-label-sm text-[var(--color-neutral-500)]'>
              {currentDoc.filename}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => onDownload(currentDoc)}
            className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-0)] border border-[var(--color-brand-300)] text-body-sm font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors'
          >
            <MD3Icon name='DownloadRounded' size='sm' />
            <span>Descargar</span>
          </button>
          {documents.length > 1 && (
            <button
              type='button'
              onClick={onDownloadAll}
              className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-500)] text-body-sm font-medium text-white hover:bg-[var(--color-brand-600)] transition-colors'
            >
              <MD3Icon name='DownloadRounded' size='sm' />
              <span>Descargar todos ({documents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className='flex-1 bg-[var(--color-neutral-200)] p-4 overflow-auto'>
        <iframe
          src={currentDoc.url}
          className='w-full h-full rounded-lg shadow-lg bg-white'
          title={`Preview: ${currentDoc.filename}`}
        />
      </div>
    </div>
  )
}

// ============================================
// MAIN MODAL COMPONENT
// ============================================

export default function ParteDiarioModal({
  isOpen,
  onClose,
  initialProfessionals = [],
  initialDate
}: ParteDiarioModalProps) {
  // Get appointments data
  const { appointments, getAppointmentsByDateRange } = useAppointments()

  // Form state
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([])
  const [timeRangePreset, setTimeRangePreset] = useState<TimeRangePreset>('today')
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date())
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date())
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')

  // Preview state
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  // Extract unique professionals from all appointments
  const uniqueProfessionals = useMemo(() => {
    const professionals = new Set<string>()
    appointments.forEach((apt) => {
      if (apt.professional) {
        professionals.add(apt.professional)
      }
    })
    return Array.from(professionals).sort()
  }, [appointments])

  // Reference date for calculations (from page selection or today)
  const referenceDate = useMemo(() => {
    return initialDate ?? new Date()
  }, [initialDate])

  // Calculate current date range based on preset
  const dateRange = useMemo((): DateRange => {
    if (timeRangePreset === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate }
    }
    return calculateDateRange(timeRangePreset, referenceDate)
  }, [timeRangePreset, customStartDate, customEndDate, referenceDate])

  // Get appointments for the selected date range
  const appointmentsInRange = useMemo(() => {
    return getAppointmentsByDateRange(
      dateToISO(dateRange.startDate),
      dateToISO(dateRange.endDate)
    )
  }, [getAppointmentsByDateRange, dateRange])

  // Filter appointments by selected professionals
  const filteredAppointments = useMemo(() => {
    if (selectedProfessionals.length === 0) {
      return appointmentsInRange
    }
    return appointmentsInRange.filter(apt =>
      selectedProfessionals.includes(apt.professional)
    )
  }, [appointmentsInRange, selectedProfessionals])

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Pre-fill professionals if provided
      if (initialProfessionals.length > 0) {
        setSelectedProfessionals(initialProfessionals)
      }
      // Pre-fill date if provided
      if (initialDate) {
        setCustomStartDate(initialDate)
        setCustomEndDate(initialDate)
      }
    }
  }, [isOpen, initialProfessionals, initialDate])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow animation
      const timeout = setTimeout(() => {
        setSelectedProfessionals([])
        setTimeRangePreset('today')
        setCustomStartDate(new Date())
        setCustomEndDate(new Date())
        setExportFormat('pdf')
        setIsPreviewMode(false)
        setPreviewIndex(0)
        // Clean up document URLs
        if (generatedDocuments.length > 0) {
          revokeDocumentUrls(generatedDocuments)
          setGeneratedDocuments([])
        }
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [isOpen, generatedDocuments])

  // Toggle professional selection
  const toggleProfessional = useCallback((professional: string) => {
    setSelectedProfessionals(prev =>
      prev.includes(professional)
        ? prev.filter(p => p !== professional)
        : [...prev, professional]
    )
  }, [])

  // Select/deselect all professionals
  const toggleAllProfessionals = useCallback(() => {
    if (selectedProfessionals.length === uniqueProfessionals.length) {
      setSelectedProfessionals([])
    } else {
      setSelectedProfessionals([...uniqueProfessionals])
    }
  }, [selectedProfessionals, uniqueProfessionals])

  // Handle preview click
  const handlePreview = useCallback(async () => {
    if (filteredAppointments.length === 0) return

    setIsGenerating(true)

    // Small delay to show loading state
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const documents = generateExportDocuments(
        filteredAppointments,
        selectedProfessionals,
        dateRange,
        exportFormat
      )

      setGeneratedDocuments(documents)
      setPreviewIndex(0)
      setIsPreviewMode(true)
    } catch (error) {
      console.error('Error generating documents:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [filteredAppointments, selectedProfessionals, dateRange, exportFormat])

  // Handle direct download
  const handleDirectDownload = useCallback(async () => {
    if (filteredAppointments.length === 0) return

    setIsGenerating(true)

    try {
      const documents = generateExportDocuments(
        filteredAppointments,
        selectedProfessionals,
        dateRange,
        exportFormat
      )

      downloadAllDocuments(documents)

      // Clean up after download
      setTimeout(() => {
        revokeDocumentUrls(documents)
      }, 2000)
    } catch (error) {
      console.error('Error generating documents:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [filteredAppointments, selectedProfessionals, dateRange, exportFormat])

  // Handle download from preview
  const handleDownloadFromPreview = useCallback((doc: GeneratedDocument) => {
    downloadDocument(doc)
  }, [])

  // Handle download all from preview
  const handleDownloadAllFromPreview = useCallback(() => {
    downloadAllDocuments(generatedDocuments)
  }, [generatedDocuments])

  // Close preview
  const closePreview = useCallback(() => {
    setIsPreviewMode(false)
    revokeDocumentUrls(generatedDocuments)
    setGeneratedDocuments([])
    setPreviewIndex(0)
  }, [generatedDocuments])

  if (!isOpen) return null

  const canExport = filteredAppointments.length > 0

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 bg-black/30'
        onClick={isPreviewMode ? undefined : onClose}
        aria-hidden='true'
      />

      {/* Modal */}
      <div className='fixed inset-0 z-50 flex items-center justify-center pointer-events-none'>
        <div
          className='pointer-events-auto flex flex-col overflow-hidden rounded-lg bg-[var(--color-neutral-50)]'
          style={{
            width: isPreviewMode ? 'min(80rem, 95vw)' : 'min(40rem, 92vw)',
            height: isPreviewMode ? 'min(50rem, 90vh)' : 'min(42rem, 85vh)'
          }}
          role='dialog'
          aria-modal='true'
          aria-labelledby='parte-diario-title'
        >
          {isPreviewMode && generatedDocuments.length > 0 ? (
            <PdfPreviewSection
              documents={generatedDocuments}
              currentIndex={previewIndex}
              onIndexChange={setPreviewIndex}
              onDownload={handleDownloadFromPreview}
              onDownloadAll={handleDownloadAllFromPreview}
              onClose={closePreview}
            />
          ) : (
            <>
              {/* Header */}
              <div
                className='flex items-center justify-between border-b border-[var(--color-border-default)] px-6 shrink-0'
                style={{ height: '3.5rem' }}
              >
                <h2
                  id='parte-diario-title'
                  className='text-title-md font-medium text-[var(--color-neutral-900)]'
                >
                  Exportar parte diario
                </h2>
                <button
                  type='button'
                  onClick={onClose}
                  className='flex items-center justify-center transition-colors hover:bg-[var(--color-neutral-100)] rounded'
                  style={{ width: '1.5rem', height: '1.5rem' }}
                  aria-label='Cerrar modal'
                >
                  <MD3Icon
                    name='CloseRounded'
                    size={0.875}
                    className='text-[var(--color-neutral-600)]'
                  />
                </button>
              </div>

              {/* Content */}
              <div className='flex-1 overflow-y-auto px-6 py-6'>
                {/* Professionals Selection */}
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <label className='text-body-md font-medium text-[var(--color-neutral-900)]'>
                      Profesionales
                    </label>
                    <button
                      type='button'
                      onClick={toggleAllProfessionals}
                      className='text-body-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors'
                    >
                      {selectedProfessionals.length === uniqueProfessionals.length
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className='grid grid-cols-2 gap-2 max-h-[10rem] overflow-y-auto p-1'>
                    {uniqueProfessionals.map(professional => (
                      <ProfessionalCheckbox
                        key={professional}
                        professional={professional}
                        isSelected={selectedProfessionals.includes(professional)}
                        onToggle={() => toggleProfessional(professional)}
                      />
                    ))}
                  </div>
                  {selectedProfessionals.length === 0 && (
                    <p className='mt-2 text-body-sm text-[var(--color-neutral-500)]'>
                      Sin selección: se exportarán todas las citas del período
                    </p>
                  )}
                </div>

                {/* Time Range Selection */}
                <div className='mb-6'>
                  <div className='flex items-center justify-between mb-3'>
                    <label className='text-body-md font-medium text-[var(--color-neutral-900)]'>
                      Rango temporal
                    </label>
                    <span className='text-body-sm text-[var(--color-neutral-500)]'>
                      Fecha base: {referenceDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className='grid grid-cols-4 gap-2 mb-3'>
                    {TIME_RANGE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type='button'
                        onClick={() => setTimeRangePreset(preset.id)}
                        className={[
                          'flex flex-col items-center justify-center p-3 rounded-lg border transition-colors',
                          timeRangePreset === preset.id
                            ? 'bg-[var(--color-brand-0)] border-[var(--color-brand-500)] text-[var(--color-brand-700)]'
                            : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-300)] text-[var(--color-neutral-700)] hover:border-[var(--color-neutral-400)]'
                        ].join(' ')}
                      >
                        <span className='text-body-md font-medium'>{preset.label}</span>
                        <span className='text-label-sm mt-0.5 opacity-70'>{preset.description}</span>
                      </button>
                    ))}
                  </div>

                  {/* Show calculated date range */}
                  {timeRangePreset !== 'custom' && (
                    <p className='text-body-sm text-[var(--color-brand-600)] mb-3'>
                      Rango: {dateRange.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {dateRange.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}

                  {/* Custom date picker */}
                  {timeRangePreset === 'custom' && (
                    <div className='p-4 rounded-lg bg-[var(--color-neutral-100)] border border-[var(--color-neutral-200)]'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-1'>
                          <label className='text-body-sm text-[var(--color-neutral-600)]'>Fecha inicio</label>
                          <DatePickerInput
                            value={customStartDate}
                            onChange={(date) => {
                              setCustomStartDate(date)
                              if (date > customEndDate) {
                                setCustomEndDate(date)
                              }
                            }}
                          />
                        </div>
                        <div className='flex flex-col gap-1'>
                          <label className='text-body-sm text-[var(--color-neutral-600)]'>Fecha fin</label>
                          <DatePickerInput
                            value={customEndDate}
                            onChange={setCustomEndDate}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Format Selection */}
                <div className='mb-6'>
                  <label className='block text-body-md font-medium text-[var(--color-neutral-900)] mb-3'>
                    Formato de exportación
                  </label>
                  <div className='flex gap-4'>
                    <button
                      type='button'
                      onClick={() => setExportFormat('pdf')}
                      className={[
                        'flex items-center gap-3 flex-1 p-4 rounded-lg border transition-colors',
                        exportFormat === 'pdf'
                          ? 'bg-[var(--color-brand-0)] border-[var(--color-brand-500)]'
                          : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]'
                      ].join(' ')}
                    >
                      <MD3Icon
                        name='PictureAsPdfRounded'
                        size={1.5}
                        className={exportFormat === 'pdf' ? 'text-[#E53935]' : 'text-[var(--color-neutral-500)]'}
                      />
                      <div className='text-left'>
                        <p className={`text-body-md font-medium ${exportFormat === 'pdf' ? 'text-[var(--color-brand-700)]' : 'text-[var(--color-neutral-700)]'}`}>
                          PDF
                        </p>
                        <p className='text-label-sm text-[var(--color-neutral-500)]'>
                          Ideal para imprimir o enviar
                        </p>
                      </div>
                      {exportFormat === 'pdf' && (
                        <MD3Icon
                          name='CheckCircleRounded'
                          size='md'
                          className='ml-auto text-[var(--color-brand-500)]'
                        />
                      )}
                    </button>

                    <button
                      type='button'
                      onClick={() => setExportFormat('excel')}
                      className={[
                        'flex items-center gap-3 flex-1 p-4 rounded-lg border transition-colors',
                        exportFormat === 'excel'
                          ? 'bg-[var(--color-brand-0)] border-[var(--color-brand-500)]'
                          : 'bg-[var(--color-neutral-50)] border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]'
                      ].join(' ')}
                    >
                      <MD3Icon
                        name='BarChartRounded'
                        size={1.5}
                        className={exportFormat === 'excel' ? 'text-[#1D6F42]' : 'text-[var(--color-neutral-500)]'}
                      />
                      <div className='text-left'>
                        <p className={`text-body-md font-medium ${exportFormat === 'excel' ? 'text-[var(--color-brand-700)]' : 'text-[var(--color-neutral-700)]'}`}>
                          Excel
                        </p>
                        <p className='text-label-sm text-[var(--color-neutral-500)]'>
                          Ideal para análisis de datos
                        </p>
                      </div>
                      {exportFormat === 'excel' && (
                        <MD3Icon
                          name='CheckCircleRounded'
                          size='md'
                          className='ml-auto text-[var(--color-brand-500)]'
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className='p-4 rounded-lg bg-[var(--color-neutral-100)] border border-[var(--color-neutral-200)]'>
                  <div className='flex items-center gap-2 mb-2'>
                    <MD3Icon name='InfoRounded' size='sm' className='text-[var(--color-brand-500)]' />
                    <span className='text-body-md font-medium text-[var(--color-neutral-900)]'>
                      Resumen de exportación
                    </span>
                  </div>
                  <ul className='text-body-sm text-[var(--color-neutral-700)] space-y-1'>
                    <li>
                      <span className='font-medium'>Citas:</span>{' '}
                      {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
                    </li>
                    <li>
                      <span className='font-medium'>Profesionales:</span>{' '}
                      {selectedProfessionals.length === 0
                        ? 'Todos'
                        : selectedProfessionals.length === 1
                          ? selectedProfessionals[0]
                          : `${selectedProfessionals.length} seleccionados`}
                    </li>
                    <li>
                      <span className='font-medium'>Documentos a generar:</span>{' '}
                      {selectedProfessionals.length === 0 ? 1 : selectedProfessionals.length}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer with Actions */}
              <div className='flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-neutral-0)] shrink-0'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2 text-body-md text-[var(--color-neutral-700)] hover:text-[var(--color-neutral-900)] transition-colors'
                >
                  Cancelar
                </button>
                <div className='flex items-center gap-3'>
                  {exportFormat === 'pdf' && (
                    <button
                      type='button'
                      onClick={handlePreview}
                      disabled={!canExport || isGenerating}
                      className='flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-brand-500)] text-body-md font-medium text-[var(--color-brand-700)] bg-white hover:bg-[var(--color-brand-0)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                      {isGenerating ? (
                        <MD3Icon name='RepeatRounded' size='sm' className='animate-spin' />
                      ) : (
                        <MD3Icon name='VisibilityRounded' size='sm' />
                      )}
                      <span>Previsualizar</span>
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={handleDirectDownload}
                    disabled={!canExport || isGenerating}
                    className='flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-brand-500)] text-body-md font-medium text-white hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {isGenerating ? (
                      <MD3Icon name='RepeatRounded' size='sm' className='animate-spin' />
                    ) : (
                      <MD3Icon name='DownloadRounded' size='sm' />
                    )}
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}
