'use client'

import {
  ArrowBackRounded,
  CheckCircleRounded,
  DownloadRounded,
  PictureAsPdfRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import { useConfiguration } from '@/context/ConfigurationContext'
import {
  downloadBlob,
  formatPrescriptionFilename,
  generatePrescriptionPDF,
  type PrescriptionData
} from '@/utils/exportUtils'
import React from 'react'
import type { MedicationEntry } from './PrescriptionCreationModal'

// HU-021: Updated props to support multiple medications
type PrescriptionPdfPreviewProps = {
  open: boolean
  onClose: () => void
  onSave?: () => void
  patientName?: string
  data?: {
    medicamento?: string
    especialista?: string
    frecuencia?: string
    duracion?: string
    administracion?: string
    // HU-021: Array of medications
    medicamentos?: MedicationEntry[]
  }
}

type GeneratedDocument = {
  filename: string
  blob: Blob
  url: string
}

export default function PrescriptionPdfPreview({
  open,
  onClose,
  onSave,
  patientName = 'Paciente',
  data
}: PrescriptionPdfPreviewProps) {
  const [document, setDocument] = React.useState<GeneratedDocument | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Get clinic data from configuration context
  const { clinicInfo } = useConfiguration()

  // Build full clinic address from configuration
  const fullClinicAddress = [
    clinicInfo.direccion,
    clinicInfo.poblacion,
    clinicInfo.codigoPostal
  ]
    .filter(Boolean)
    .join(', ')

  // Build medications array from data
  const medications = React.useMemo(() => {
    if (data?.medicamentos && data.medicamentos.length > 0) {
      return data.medicamentos.map((m) => ({
        medicamento: m.medicamento.trim() || 'Medicamento',
        frecuencia: m.frecuencia.trim() || '-',
        duracion: m.duracion.trim() || '-',
        administracion: m.administracion.trim() || 'Oral',
        dosis: '500mg' // Placeholder
      }))
    }
    // Legacy: single medication
    return [
      {
        medicamento: data?.medicamento?.trim() || 'Medicamento',
        frecuencia: data?.frecuencia?.trim() || '3 por día',
        duracion: data?.duracion?.trim() || '7 días',
        administracion: data?.administracion?.trim() || 'Oral',
        dosis: '500mg'
      }
    ]
  }, [data])

  // Generate PDF when modal opens
  React.useEffect(() => {
    if (!open) {
      // Cleanup URL when closing
      if (document?.url) {
        URL.revokeObjectURL(document.url)
      }
      setDocument(null)
      return
    }

    setIsGenerating(true)

    // Build prescription data using clinic info from configuration context
    const prescriptionData: PrescriptionData = {
      patientName: patientName,
      patientDni: '44556677X',
      patientSex: 'Hombre',
      patientAge: 45,
      doctorName: data?.especialista || 'Dr. García López',
      doctorLicense: 'XX 895 895 895',
      clinicName: clinicInfo.nombreComercial || 'Clínica Dental',
      clinicAddress: fullClinicAddress || clinicInfo.direccion || '',
      clinicPhone: clinicInfo.telefono || '',
      prescriptionDate: new Date(),
      caseNotes: '',
      medications
    }

    // Generate PDF
    try {
      const blob = generatePrescriptionPDF(prescriptionData)
      const url = URL.createObjectURL(blob)
      const filename = formatPrescriptionFilename(
        patientName,
        medications[0]?.medicamento
      )

      setDocument({ filename, blob, url })
    } catch (error) {
      console.error('Error generating prescription PDF:', error)
    } finally {
      setIsGenerating(false)
    }

    // Cleanup on unmount
    return () => {
      if (document?.url) {
        URL.revokeObjectURL(document.url)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data, patientName, medications])

  const handleDownload = React.useCallback(() => {
    if (!document) return
    downloadBlob(document.blob, document.filename)
  }, [document])

  const handleSave = React.useCallback(() => {
    onSave?.()
    onClose()
  }, [onSave, onClose])

  if (!open) return null

  return (
    <Portal>
      <div
        className='fixed inset-0 z-[200] bg-black/50 flex items-center justify-center'
        onClick={onClose}
        aria-hidden
      >
        <div
          className='relative bg-white rounded-xl shadow-xl overflow-hidden flex flex-col'
          style={{
            width: 'min(65rem, 95vw)',
            height: 'min(50rem, 90vh)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex items-center justify-between px-6 py-3 border-b border-[#E2E7EA] bg-[#F8FAFB]'>
            <div className='flex items-center gap-4'>
              <button
                type='button'
                onClick={onClose}
                className='flex items-center gap-1 text-[0.875rem] text-[#535C66] hover:text-[#24282C] transition-colors cursor-pointer'
              >
                <ArrowBackRounded className='w-[1.25rem] h-[1.25rem]' />
                <span>Volver</span>
              </button>
              <div className='h-5 w-px bg-[#CBD3D9]' />
              <span className='text-[1rem] font-medium text-[#24282C]'>
                Vista previa de la receta
              </span>
            </div>
          </div>

          {/* Document info bar */}
          <div className='flex items-center justify-between px-6 py-2 border-b border-[#E2E7EA] bg-white'>
            <div className='flex items-center gap-3'>
              <PictureAsPdfRounded className='w-[1.5rem] h-[1.5rem] text-[#E53935]' />
              <div>
                <p className='text-[0.875rem] font-medium text-[#24282C]'>
                  {data?.especialista || 'Dr. García López'}
                </p>
                <p className='text-[0.75rem] text-[#535C66]'>
                  {document?.filename || 'Receta.pdf'}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={handleDownload}
                disabled={!document || isGenerating}
                className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9FBF9] border border-[var(--color-brand-300)] text-[0.875rem] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <DownloadRounded className='w-[1rem] h-[1rem]' />
                <span>Descargar</span>
              </button>
              {onSave && (
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={!document || isGenerating}
                  className='flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#51D6C7] text-[0.875rem] font-medium text-[#1E4947] hover:bg-[#3ECBBB] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <CheckCircleRounded className='w-[1rem] h-[1rem]' />
                  <span>Guardar receta</span>
                </button>
              )}
            </div>
          </div>

          {/* PDF Viewer */}
          <div className='flex-1 bg-[#E2E7EA] p-4 overflow-auto'>
            {isGenerating ? (
              <div className='w-full h-full flex items-center justify-center bg-white rounded-lg'>
                <div className='flex flex-col items-center gap-3'>
                  <div className='w-8 h-8 border-2 border-[#51D6C7] border-t-transparent rounded-full animate-spin' />
                  <p className='text-[0.875rem] text-[#535C66]'>
                    Generando PDF...
                  </p>
                </div>
              </div>
            ) : document?.url ? (
              <iframe
                src={document.url}
                className='w-full h-full rounded-lg shadow-lg bg-white'
                title={`Preview: ${document.filename}`}
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-white rounded-lg'>
                <p className='text-[0.875rem] text-[#535C66]'>
                  Error al generar el PDF
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
