'use client'

import {
  ArrowBackRounded,
  DownloadRounded,
  EditRounded,
  PictureAsPdfRounded,
  VisibilityRounded
} from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import {
  useConfiguration,
  type DocumentTemplate
} from '@/context/ConfigurationContext'
import {
  downloadBlob,
  formatDocumentFilename,
  generateDocumentPDF,
  type GeneratedDocument
} from '@/utils/exportUtils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type PatientData = {
  nombre?: string
  dni?: string
  email?: string
  telefono?: string
  direccion?: string
  fecha_nacimiento?: string
  edad?: string
  sexo?: string
}

type PatientDocumentEditorProps = {
  open: boolean
  onClose: () => void
  template: DocumentTemplate | null
  patientData?: PatientData
  onSave?: (document: GeneratedDocument) => void
}

// Replace template variables with actual data
function replaceTemplateVariables(
  content: string,
  patientData: PatientData,
  clinicData: {
    nombre: string
    razon_social: string
    nif: string
    direccion: string
    telefono: string
    email: string
    web?: string
    iban: string
    email_facturacion: string
  },
  professionalData?: {
    nombre?: string
    especialidad?: string
    num_colegiado?: string
  },
  documentType?: string
): string {
  let result = content

  // Replace patient variables
  result = result.replace(/\{\{paciente\.nombre\}\}/g, patientData.nombre || '[Nombre paciente]')
  result = result.replace(/\{\{paciente\.dni\}\}/g, patientData.dni || '[DNI paciente]')
  result = result.replace(/\{\{paciente\.email\}\}/g, patientData.email || '[Email paciente]')
  result = result.replace(/\{\{paciente\.telefono\}\}/g, patientData.telefono || '[Teléfono paciente]')
  result = result.replace(/\{\{paciente\.direccion\}\}/g, patientData.direccion || '[Dirección paciente]')
  result = result.replace(/\{\{paciente\.fecha_nacimiento\}\}/g, patientData.fecha_nacimiento || '[Fecha nacimiento]')
  result = result.replace(/\{\{paciente\.edad\}\}/g, patientData.edad || '[Edad]')
  result = result.replace(/\{\{paciente\.sexo\}\}/g, patientData.sexo || '[Sexo]')

  // Replace clinic variables
  result = result.replace(/\{\{clinica\.nombre\}\}/g, clinicData.nombre)
  result = result.replace(/\{\{clinica\.razon_social\}\}/g, clinicData.razon_social)
  result = result.replace(/\{\{clinica\.nif\}\}/g, clinicData.nif)
  result = result.replace(/\{\{clinica\.direccion\}\}/g, `${clinicData.direccion}`)
  result = result.replace(/\{\{clinica\.telefono\}\}/g, clinicData.telefono)
  result = result.replace(/\{\{clinica\.email\}\}/g, clinicData.email)
  result = result.replace(/\{\{clinica\.web\}\}/g, clinicData.web || '')
  result = result.replace(/\{\{clinica\.iban\}\}/g, clinicData.iban)
  result = result.replace(/\{\{clinica\.email_facturacion\}\}/g, clinicData.email_facturacion)

  // Replace professional variables
  result = result.replace(/\{\{profesional\.nombre\}\}/g, professionalData?.nombre || '[Nombre profesional]')
  result = result.replace(/\{\{profesional\.especialidad\}\}/g, professionalData?.especialidad || '[Especialidad]')
  result = result.replace(/\{\{profesional\.num_colegiado\}\}/g, professionalData?.num_colegiado || '[Nº Colegiado]')

  // Replace document variables
  const today = new Date()
  result = result.replace(/\{\{documento\.fecha\}\}/g, today.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }))
  result = result.replace(/\{\{documento\.numero\}\}/g, `DOC-${Date.now().toString().slice(-6)}`)
  result = result.replace(/\{\{documento\.tipo\}\}/g, documentType || 'documento')

  // Replace treatment variables (placeholders)
  result = result.replace(/\{\{tratamiento\.nombre\}\}/g, '[Nombre tratamiento]')
  result = result.replace(/\{\{tratamiento\.descripcion\}\}/g, '[Descripción tratamiento]')
  result = result.replace(/\{\{tratamiento\.precio\}\}/g, '[Precio]')
  result = result.replace(/\{\{tratamiento\.pieza\}\}/g, '[Pieza dental]')

  // Replace budget variables (placeholders)
  result = result.replace(/\{\{presupuesto\.subtotal\}\}/g, '[Subtotal]')
  result = result.replace(/\{\{presupuesto\.descuento\}\}/g, '[Descuento]')
  result = result.replace(/\{\{presupuesto\.total\}\}/g, '[Total]')
  result = result.replace(/\{\{presupuesto\.validez\}\}/g, '30 días')

  // Replace prescription variables (placeholders)
  result = result.replace(/\{\{receta\.medicamento\}\}/g, '[Medicamento]')
  result = result.replace(/\{\{receta\.dosis\}\}/g, '[Dosis]')
  result = result.replace(/\{\{receta\.frecuencia\}\}/g, '[Frecuencia]')
  result = result.replace(/\{\{receta\.duracion\}\}/g, '[Duración]')
  result = result.replace(/\{\{receta\.via\}\}/g, '[Vía administración]')
  result = result.replace(/\{\{receta\.notas\}\}/g, '[Notas]')

  return result
}

export default function PatientDocumentEditor({
  open,
  onClose,
  template,
  patientData = {},
  onSave
}: PatientDocumentEditorProps) {
  const { clinicInfo, professionals } = useConfiguration()
  const editorRef = useRef<HTMLDivElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [documentName, setDocumentName] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [generatedPdf, setGeneratedPdf] = useState<GeneratedDocument | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Get first active professional as default
  const defaultProfessional = useMemo(
    () => professionals.find((p) => p.status === 'Activo'),
    [professionals]
  )

  // Prepare clinic data for variable replacement
  const clinicData = useMemo(
    () => ({
      nombre: clinicInfo.nombreComercial,
      razon_social: clinicInfo.razonSocial,
      nif: clinicInfo.cif,
      direccion: `${clinicInfo.direccion}, ${clinicInfo.poblacion} ${clinicInfo.codigoPostal}`,
      telefono: clinicInfo.telefono,
      email: clinicInfo.email,
      web: clinicInfo.web,
      iban: clinicInfo.iban,
      email_facturacion: clinicInfo.emailBancario
    }),
    [clinicInfo]
  )

  // Prepare professional data
  const professionalData = useMemo(
    () =>
      defaultProfessional
        ? {
            nombre: defaultProfessional.name,
            especialidad: defaultProfessional.role,
            num_colegiado: 'N/A'
          }
        : undefined,
    [defaultProfessional]
  )

  // Process template content with patient data
  const processedContent = useMemo(() => {
    if (!template) return ''
    return replaceTemplateVariables(
      template.content,
      patientData,
      clinicData,
      professionalData,
      template.type
    )
  }, [template, patientData, clinicData, professionalData])

  // Generate PDF from content
  const generatePdf = useCallback((content: string, name: string) => {
    setIsGenerating(true)
    
    // Small delay for UI feedback
    setTimeout(() => {
      try {
        const blob = generateDocumentPDF({
          title: name,
          content: content,
          patientName: patientData.nombre,
          documentDate: new Date(),
          clinicName: clinicData.nombre,
          clinicAddress: clinicData.direccion,
          clinicPhone: clinicData.telefono,
          clinicCif: clinicData.nif
        })

        const url = URL.createObjectURL(blob)
        const filename = formatDocumentFilename(name, patientData.nombre)

        // Cleanup previous URL if exists
        if (generatedPdf?.url) {
          URL.revokeObjectURL(generatedPdf.url)
        }

        setGeneratedPdf({
          professional: name,
          filename,
          blob,
          url
        })
      } catch (error) {
        console.error('Error generating PDF:', error)
      } finally {
        setIsGenerating(false)
      }
    }, 100)
  }, [patientData.nombre, clinicData, generatedPdf?.url])

  // Initialize editor content and generate PDF
  useEffect(() => {
    if (template && open) {
      const name = `${template.title} - ${patientData.nombre || 'Paciente'}`
      setDocumentName(name)
      setEditorContent(processedContent)
      setIsEditMode(false)
      
      // Generate initial PDF
      generatePdf(processedContent, name)
    }
    
    // Cleanup on close
    return () => {
      if (!open && generatedPdf?.url) {
        URL.revokeObjectURL(generatedPdf.url)
        setGeneratedPdf(null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, open, processedContent, patientData.nombre])

  // Sync editorRef with editorContent when switching to edit mode
  useEffect(() => {
    if (isEditMode && editorRef.current && editorContent) {
      editorRef.current.innerHTML = editorContent
    }
  }, [isEditMode, editorContent])

  // Sync content from editor to state and regenerate PDF
  const syncAndRegeneratePdf = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML
      setEditorContent(newContent)
      generatePdf(newContent, documentName)
    }
  }, [documentName, generatePdf])

  // Handle save - pass the generated PDF document
  const handleSave = useCallback(() => {
    if (!onSave || !generatedPdf) return
    onSave(generatedPdf)
    onClose()
  }, [generatedPdf, onClose, onSave])

  // Handle download PDF
  const handleDownload = useCallback(() => {
    if (!generatedPdf) return
    downloadBlob(generatedPdf.blob, generatedPdf.filename)
  }, [generatedPdf])

  // Handle close
  const handleClose = useCallback(() => {
    if (generatedPdf?.url) {
      URL.revokeObjectURL(generatedPdf.url)
    }
    setGeneratedPdf(null)
    setIsEditMode(false)
    onClose()
  }, [generatedPdf?.url, onClose])

  if (!open || !template) return null

  return (
    <Portal>
      <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
        onClick={handleClose}
      >
        <div
          className='w-[min(70rem,95vw)] h-[min(52rem,90vh)] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col'
          onClick={(e) => e.stopPropagation()}
          role='dialog'
          aria-modal='true'
        >
          {isEditMode ? (
            // ========================================
            // EDIT MODE
            // ========================================
            <>
              {/* Edit Header */}
              <div className='flex-none flex items-center justify-between px-6 py-3 border-b border-[#E2E7EA] bg-[#F8FAFB]'>
                <div className='flex items-center gap-4'>
                  <button
                    type='button'
                    onClick={() => {
                      syncAndRegeneratePdf()
                      setIsEditMode(false)
                    }}
                    className='flex items-center gap-1 text-[0.875rem] text-[#535C66] hover:text-[#24282C] transition-colors cursor-pointer'
                  >
                    <ArrowBackRounded className='w-[1.25rem] h-[1.25rem]' />
                    <span>Volver a vista previa</span>
                  </button>
                  <div className='h-5 w-px bg-[#CBD3D9]' />
                  <span className='text-[1rem] font-medium text-[#24282C]'>
                    Editando documento
                  </span>
                </div>
              </div>

              {/* Document name input */}
              <div className='flex items-center gap-3 px-6 py-2 border-b border-[#E2E7EA] bg-white'>
                <span className='text-[0.875rem] text-[#535C66]'>Nombre:</span>
                <input
                  type='text'
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className='flex-1 text-[0.875rem] font-medium text-[#24282C] bg-transparent border-none outline-none focus:ring-2 focus:ring-brand-200 rounded px-2 py-1'
                />
              </div>

              {/* Editor Area */}
              <div className='flex-1 overflow-auto bg-[#E2E7EA] p-4'>
                <div className='max-w-[800px] mx-auto'>
                  <div className='bg-white rounded-lg shadow-lg p-8 min-h-[50rem] ring-2 ring-brand-200'>
                    <div
                      ref={editorRef}
                      contentEditable
                      className='outline-none min-h-[45rem] prose prose-sm max-w-none'
                      suppressContentEditableWarning
                    />
                  </div>
                </div>
              </div>

              {/* Edit Footer */}
              <div className='flex-none flex items-center justify-between px-6 py-3 border-t border-[#E2E7EA] bg-[#F8FAFB]'>
                <p className='text-[0.875rem] text-[#535C66]'>
                  Haz clic en el documento para editar el contenido.
                </p>
                <button
                  type='button'
                  onClick={() => {
                    syncAndRegeneratePdf()
                    setIsEditMode(false)
                  }}
                  className='flex items-center gap-2 px-4 py-2 rounded-full bg-[#51D6C7] text-[0.875rem] font-medium text-[#1E4947] hover:bg-[#3ECBBB] transition-colors cursor-pointer'
                >
                  <VisibilityRounded className='w-[1rem] h-[1rem]' />
                  <span>Ver vista previa</span>
                </button>
              </div>
            </>
          ) : (
            // ========================================
            // PREVIEW MODE (PDF)
            // ========================================
            <>
              {/* Preview Header */}
              <div className='flex-none flex items-center justify-between px-6 py-3 border-b border-[#E2E7EA] bg-[#F8FAFB]'>
                <div className='flex items-center gap-4'>
                  <button
                    type='button'
                    onClick={handleClose}
                    className='flex items-center gap-1 text-[0.875rem] text-[#535C66] hover:text-[#24282C] transition-colors cursor-pointer'
                  >
                    <ArrowBackRounded className='w-[1.25rem] h-[1.25rem]' />
                    <span>Volver</span>
                  </button>
                  <div className='h-5 w-px bg-[#CBD3D9]' />
                  <span className='text-[1rem] font-medium text-[#24282C]'>
                    Vista previa del documento
                  </span>
                </div>
              </div>

              {/* Document info bar */}
              <div className='flex-none flex items-center justify-between px-6 py-2 border-b border-[#E2E7EA] bg-white'>
                <div className='flex items-center gap-3'>
                  <PictureAsPdfRounded className='w-[1.5rem] h-[1.5rem] text-[#E53935]' />
                  <div>
                    <p className='text-[0.875rem] font-medium text-[#24282C]'>
                      {documentName}
                    </p>
                    <p className='text-[0.75rem] text-[#535C66]'>
                      {generatedPdf?.filename || 'documento.pdf'}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  {/* Edit button */}
                  <button
                    type='button'
                    onClick={() => setIsEditMode(true)}
                    className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F7F9] border border-[#CBD3D9] text-[0.875rem] font-medium text-[#535C66] hover:bg-[#E2E7EA] transition-colors cursor-pointer'
                  >
                    <EditRounded className='w-[1rem] h-[1rem]' />
                    <span>Editar</span>
                  </button>
                  {/* Download button */}
                  <button
                    type='button'
                    onClick={handleDownload}
                    disabled={!generatedPdf || isGenerating}
                    className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E9FBF9] border border-[var(--color-brand-300)] text-[0.875rem] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <DownloadRounded className='w-[1rem] h-[1rem]' />
                    <span>Descargar</span>
                  </button>
                  {/* Save button */}
                  {onSave && (
                    <button
                      type='button'
                      onClick={handleSave}
                      disabled={!generatedPdf || isGenerating}
                      className='flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#51D6C7] text-[0.875rem] font-medium text-[#1E4947] hover:bg-[#3ECBBB] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <span>Guardar documento</span>
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Viewer */}
              <div className='flex-1 bg-[#E2E7EA] p-4 overflow-auto'>
                {isGenerating ? (
                  <div className='w-full h-full flex flex-col items-center justify-center text-[#535C66]'>
                    <div className='w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4' />
                    <p className='text-[1rem] font-medium'>Generando PDF...</p>
                  </div>
                ) : generatedPdf?.url ? (
                  <iframe
                    src={generatedPdf.url}
                    className='w-full h-full rounded-lg shadow-lg bg-white'
                    title={`Preview: ${generatedPdf.filename}`}
                  />
                ) : (
                  <div className='w-full h-full flex flex-col items-center justify-center text-[#535C66] bg-white rounded-lg shadow-lg'>
                    <PictureAsPdfRounded className='size-16 mb-4 text-[#CBD3D9]' />
                    <p className='text-[1rem] font-medium'>Error al generar el PDF</p>
                    <p className='text-[0.875rem] mt-1'>
                      Intenta editar y guardar de nuevo
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}
