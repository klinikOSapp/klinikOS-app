'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { useClinic } from '@/context/ClinicContext'
import { uploadPatientFile } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

// ============================================
// TIPOS PARA ARCHIVOS DEL PACIENTE
// ============================================

export type PatientFileType = 'document' | 'consent' | 'rx_image' | 'odontogram'

export type PatientFile = {
  id: string
  patientId: string
  name: string
  type: PatientFileType
  url: string
  mimeType: string
  size: number
  uploadedAt: string
  uploadedBy: string
  // Reference to the appointment where it was uploaded (if applicable)
  appointmentId?: string
  // Additional metadata
  description?: string
  // For consents
  consentStatus?: 'Firmado' | 'Enviado' | 'Pendiente'
  consentSentAt?: string
}

// ============================================
// DATOS INICIALES (MOCK DATA)
// ============================================

const INITIAL_PATIENT_FILES: PatientFile[] = [
  // Sample consent documents
  {
    id: 'pf-001',
    patientId: 'pat-001',
    name: 'Consentimiento general.pdf',
    type: 'consent',
    url: '/files/consent-general.pdf',
    mimeType: 'application/pdf',
    size: 245000,
    uploadedAt: '2024-08-19T10:00:00Z',
    uploadedBy: 'Dr. Antonio Ruiz',
    consentStatus: 'Firmado',
    consentSentAt: '19/08/2024'
  },
  {
    id: 'pf-002',
    patientId: 'pat-001',
    name: 'Tratamiento de datos.pdf',
    type: 'consent',
    url: '/files/consent-datos.pdf',
    mimeType: 'application/pdf',
    size: 189000,
    uploadedAt: '2024-08-19T10:00:00Z',
    uploadedBy: 'Dr. Antonio Ruiz',
    consentStatus: 'Firmado',
    consentSentAt: '19/08/2024'
  },
  // Sample RX images
  {
    id: 'pf-003',
    patientId: 'pat-001',
    name: 'Periapical 2.6',
    type: 'rx_image',
    url: '',
    mimeType: 'image/jpeg',
    size: 1500000,
    uploadedAt: '2025-06-24T09:00:00Z',
    uploadedBy: 'Dr. Antonio Ruiz',
    description: 'Caries distal profunda en 2.6, probable pulpitis reversible.'
  }
]

type DbClinicalAttachmentRow = {
  id: number
  patient_id: string
  appointment_id: number | null
  staff_id: string
  file_name: string
  file_type: string | null
  storage_path: string
  created_at: string
}

type DbPatientConsentRow = {
  id: number
  patient_id: string
  consent_type: string
  status: string
  signed_at: string | null
  document_url: string | null
  created_at: string
}

function inferFileType(
  fileType: string | null | undefined,
  fileName: string
): PatientFileType {
  const lowerType = (fileType || '').toLowerCase()
  const lowerName = fileName.toLowerCase()
  if (lowerType.includes('odontogram') || lowerName.includes('odontogram')) {
    return 'odontogram'
  }
  if (lowerType.includes('xray') || lowerName.includes('rx')) {
    return 'rx_image'
  }
  if (lowerType.startsWith('image/')) {
    return 'rx_image'
  }
  return 'document'
}

function mapConsentStatusToUi(status: string): 'Firmado' | 'Enviado' | 'Pendiente' {
  switch ((status || '').toLowerCase()) {
    case 'signed':
      return 'Firmado'
    case 'sent':
      return 'Enviado'
    case 'pending':
    default:
      return 'Pendiente'
  }
}

function mapConsentStatusToDb(status: PatientFile['consentStatus']): string {
  switch (status) {
    case 'Firmado':
      return 'signed'
    case 'Enviado':
      return 'sent'
    case 'Pendiente':
    default:
      return 'pending'
  }
}

// ============================================
// CONTEXTO
// ============================================

type PatientFilesContextType = {
  files: PatientFile[]
  // CRUD operations
  addFile: (file: Omit<PatientFile, 'id'>, onError?: (tempId: string, error: unknown) => void) => string
  updateFile: (id: string, updates: Partial<PatientFile>) => void
  deleteFile: (id: string) => void
  // Query operations
  getFilesByPatient: (patientId: string) => PatientFile[]
  getFilesByPatientAndType: (
    patientId: string,
    type: PatientFileType
  ) => PatientFile[]
  getConsentsByPatient: (patientId: string) => PatientFile[]
  getRxImagesByPatient: (patientId: string) => PatientFile[]
  getOdontogramsByPatient: (patientId: string) => PatientFile[]
  getFileById: (id: string) => PatientFile | undefined
  // Utility to add file from clinical history
  addDocumentFromClinicalHistory: (
    file: File,
    patientId: string,
    appointmentId: string,
    uploadedBy: string
  ) => Promise<{ id: string; storagePath: string }>
  addOdontogramFromClinicalHistory: (
    file: File,
    patientId: string,
    appointmentId: string,
    uploadedBy: string
  ) => Promise<{ id: string; storagePath: string }>
}

const PatientFilesContext = createContext<PatientFilesContextType | undefined>(
  undefined
)

// ============================================
// PROVIDER
// ============================================

export function PatientFilesProvider({ children }: { children: ReactNode }) {
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()
  const [files, setFiles] = useState<PatientFile[]>([])

  useEffect(() => {
    let isMounted = true

    async function hydrateFilesFromDb() {
      try {
        if (!isClinicInitialized) return

        const supabase = createSupabaseBrowserClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()
        if (!session || !activeClinicId) {
          if (isMounted) setFiles([])
          return
        }

        const clinicId = activeClinicId
        const { data: patientRows, error: patientsError } = await supabase
          .from('patients')
          .select('id')
          .eq('clinic_id', clinicId)

        if (patientsError || !patientRows || patientRows.length === 0) {
          if (isMounted) setFiles([])
          return
        }

        const patientIds = patientRows.map((row) => row.id)
        const [{ data: attachmentRows }, { data: consentRows }] = await Promise.all([
          supabase
            .from('clinical_attachments')
            .select(
              'id, patient_id, appointment_id, staff_id, file_name, file_type, storage_path, created_at'
            )
            .in('patient_id', patientIds),
          supabase
            .from('patient_consents')
            .select(
              'id, patient_id, consent_type, status, signed_at, document_url, created_at'
            )
            .in('patient_id', patientIds)
        ])

        const mappedAttachments: PatientFile[] = (
          (attachmentRows || []) as DbClinicalAttachmentRow[]
        ).map((row) => ({
          id: `attachment-${row.id}`,
          patientId: row.patient_id,
          name: row.file_name,
          type: inferFileType(row.file_type, row.file_name),
          url: row.storage_path,
          mimeType: row.file_type || 'application/octet-stream',
          size: 0,
          uploadedAt: row.created_at,
          uploadedBy: row.staff_id,
          appointmentId: row.appointment_id ? String(row.appointment_id) : undefined
        }))

        const mappedConsents: PatientFile[] = (
          (consentRows || []) as DbPatientConsentRow[]
        ).map((row) => ({
          id: `consent-${row.id}`,
          patientId: row.patient_id,
          name: `${row.consent_type}.pdf`,
          type: 'consent',
          url: row.document_url || '',
          mimeType: 'application/pdf',
          size: 0,
          uploadedAt: row.created_at,
          uploadedBy: 'Sistema',
          consentStatus: mapConsentStatusToUi(row.status),
          consentSentAt: row.signed_at
            ? new Date(row.signed_at).toLocaleDateString('es-ES')
            : undefined
        }))

        if (isMounted) {
          setFiles([...mappedAttachments, ...mappedConsents])
        }
      } catch (error) {
        console.warn('PatientFilesContext DB hydration failed, using local state', error)
        if (isMounted) setFiles([])
      }
    }

    void hydrateFilesFromDb()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized])

  // Add a new file
  const addFile = useCallback(
    (fileData: Omit<PatientFile, 'id'>, onError?: (tempId: string, error: unknown) => void): string => {
    const newId = `pf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newFile: PatientFile = {
      ...fileData,
      id: newId
    }
    setFiles((prev) => [...prev, newFile])
    console.log(`✅ Archivo añadido: ${newFile.name} (${newFile.type})`)

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session) {
          setFiles((prev) => prev.filter((f) => f.id !== newId))
          onError?.(newId, new Error('No autenticado'))
          return
        }
        const staffId = session.user.id

        if (fileData.type === 'consent') {
          const { data: inserted, error } = await supabase
            .from('patient_consents')
            .insert({
              patient_id: fileData.patientId,
              consent_type: fileData.name.replace(/\.pdf$/i, ''),
              status: mapConsentStatusToDb(fileData.consentStatus),
              signed_at:
                fileData.consentStatus === 'Firmado'
                  ? new Date().toISOString()
                  : null,
              document_url: fileData.url || null
            })
            .select('id')
            .single()

          if (error || !inserted) {
            console.warn('No se pudo persistir patient_consent en DB', error)
            setFiles((prev) => prev.filter((f) => f.id !== newId))
            onError?.(newId, error ?? new Error('Insert sin datos'))
            return
          }

          setFiles((prev) =>
            prev.map((file) =>
              file.id === newId ? { ...file, id: `consent-${inserted.id}` } : file
            )
          )
          return
        }

        const fileType =
          fileData.type === 'odontogram'
            ? 'odontogram'
            : fileData.type === 'rx_image'
            ? fileData.mimeType || 'image/jpeg'
            : fileData.mimeType || 'application/octet-stream'

        const { data: inserted, error } = await supabase
          .from('clinical_attachments')
          .insert({
            patient_id: fileData.patientId,
            appointment_id: fileData.appointmentId
              ? Number(fileData.appointmentId)
              : null,
            staff_id: staffId,
            file_name: fileData.name,
            file_type: fileType,
            storage_path: fileData.url || ''
          })
          .select('id')
          .single()

        if (error || !inserted) {
          console.warn('No se pudo persistir clinical_attachment en DB', error)
          setFiles((prev) => prev.filter((f) => f.id !== newId))
          onError?.(newId, error ?? new Error('Insert sin datos'))
          return
        }

        setFiles((prev) =>
          prev.map((file) =>
            file.id === newId
              ? { ...file, id: `attachment-${inserted.id}` }
              : file
          )
        )
      } catch (error) {
        console.warn('Error persistiendo archivo en DB', error)
        setFiles((prev) => prev.filter((f) => f.id !== newId))
        onError?.(newId, error)
      }
    })()

    return newId
  }, [])

  // Update a file
  const updateFile = useCallback(
    (id: string, updates: Partial<PatientFile>) => {
      setFiles((prev) =>
        prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
      )
      console.log(`✅ Archivo ${id} actualizado`)

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          if (id.startsWith('consent-')) {
            const numericId = Number(id.replace('consent-', ''))
            if (Number.isNaN(numericId)) return
            const payload: Record<string, unknown> = {}
            if (updates.name !== undefined) {
              payload.consent_type = updates.name.replace(/\.pdf$/i, '')
            }
            if (updates.consentStatus !== undefined) {
              payload.status = mapConsentStatusToDb(updates.consentStatus)
              payload.signed_at =
                updates.consentStatus === 'Firmado'
                  ? new Date().toISOString()
                  : null
            }
            if (updates.url !== undefined) {
              payload.document_url = updates.url || null
            }
            const { error } = await supabase
              .from('patient_consents')
              .update(payload)
              .eq('id', numericId)
            if (error) {
              console.warn('No se pudo actualizar patient_consent en DB', error)
            }
            return
          }

          if (id.startsWith('attachment-')) {
            const numericId = Number(id.replace('attachment-', ''))
            if (Number.isNaN(numericId)) return
            const payload: Record<string, unknown> = {}
            if (updates.name !== undefined) payload.file_name = updates.name
            if (updates.url !== undefined) payload.storage_path = updates.url
            if (updates.mimeType !== undefined) payload.file_type = updates.mimeType
            const { error } = await supabase
              .from('clinical_attachments')
              .update(payload)
              .eq('id', numericId)
            if (error) {
              console.warn(
                'No se pudo actualizar clinical_attachment en DB',
                error
              )
            }
          }
        } catch (error) {
          console.warn('Error actualizando archivo en DB', error)
        }
      })()
    },
    []
  )

  // Delete a file
  const deleteFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToDelete = prev.find((f) => f.id === id)
      // Cleanup blob URL if exists
      if (fileToDelete?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(fileToDelete.url)
      }
      return prev.filter((f) => f.id !== id)
    })
    console.log(`✅ Archivo ${id} eliminado`)

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        if (id.startsWith('consent-')) {
          const numericId = Number(id.replace('consent-', ''))
          if (Number.isNaN(numericId)) return
          const { error } = await supabase
            .from('patient_consents')
            .delete()
            .eq('id', numericId)
          if (error) {
            console.warn('No se pudo eliminar patient_consent en DB', error)
          }
          return
        }

        if (id.startsWith('attachment-')) {
          const numericId = Number(id.replace('attachment-', ''))
          if (Number.isNaN(numericId)) return
          const { error } = await supabase
            .from('clinical_attachments')
            .delete()
            .eq('id', numericId)
          if (error) {
            console.warn('No se pudo eliminar clinical_attachment en DB', error)
          }
        }
      } catch (error) {
        console.warn('Error eliminando archivo en DB', error)
      }
    })()
  }, [])

  // Get files by patient
  const getFilesByPatient = useCallback(
    (patientId: string): PatientFile[] => {
      return files.filter((f) => f.patientId === patientId)
    },
    [files]
  )

  // Get files by patient and type
  const getFilesByPatientAndType = useCallback(
    (patientId: string, type: PatientFileType): PatientFile[] => {
      return files.filter((f) => f.patientId === patientId && f.type === type)
    },
    [files]
  )

  // Get consents by patient
  const getConsentsByPatient = useCallback(
    (patientId: string): PatientFile[] => {
      return files.filter(
        (f) =>
          f.patientId === patientId &&
          (f.type === 'consent' || f.type === 'document')
      )
    },
    [files]
  )

  // Get RX images by patient
  const getRxImagesByPatient = useCallback(
    (patientId: string): PatientFile[] => {
      return files.filter(
        (f) =>
          f.patientId === patientId &&
          (f.type === 'rx_image' || f.type === 'odontogram')
      )
    },
    [files]
  )

  // Get odontograms by patient
  const getOdontogramsByPatient = useCallback(
    (patientId: string): PatientFile[] => {
      return files.filter(
        (f) => f.patientId === patientId && f.type === 'odontogram'
      )
    },
    [files]
  )

  // Get file by ID
  const getFileById = useCallback(
    (id: string): PatientFile | undefined => {
      return files.find((f) => f.id === id)
    },
    [files]
  )

  // Add document from clinical history (also saves to consents)
  const addDocumentFromClinicalHistory = useCallback(
    async (
      file: File,
      patientId: string,
      appointmentId: string,
      uploadedBy: string
    ): Promise<{ id: string; storagePath: string }> => {
      const { path } = await uploadPatientFile({
        patientId,
        file,
        kind: 'consents'
      })
      const now = new Date()
      const sentAt = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      const newFile: Omit<PatientFile, 'id'> = {
        patientId,
        name: file.name,
        type: 'document',
        url: path,
        mimeType: file.type,
        size: file.size,
        uploadedAt: now.toISOString(),
        uploadedBy,
        appointmentId,
        consentStatus: 'Enviado',
        consentSentAt: sentAt
      }

      const id = addFile(newFile)
      console.log(
        `✅ Documento subido desde historial clínico y guardado en consentimientos: ${file.name}`
      )
      return { id, storagePath: path }
    },
    [addFile]
  )

  // Add odontogram from clinical history (also saves to RX images)
  const addOdontogramFromClinicalHistory = useCallback(
    async (
      file: File,
      patientId: string,
      appointmentId: string,
      uploadedBy: string
    ): Promise<{ id: string; storagePath: string }> => {
      const { path } = await uploadPatientFile({
        patientId,
        file,
        kind: 'rx'
      })
      const now = new Date()

      const newFile: Omit<PatientFile, 'id'> = {
        patientId,
        name: file.name.replace(/\.[^/.]+$/, '') || 'Odontograma',
        type: 'odontogram',
        url: path,
        mimeType: file.type,
        size: file.size,
        uploadedAt: now.toISOString(),
        uploadedBy,
        appointmentId,
        description: `Odontograma subido el ${now.toLocaleDateString('es-ES')}`
      }

      const id = addFile(newFile)
      console.log(
        `✅ Odontograma subido desde historial clínico y guardado en imágenes RX: ${file.name}`
      )
      return { id, storagePath: path }
    },
    [addFile]
  )

  const value: PatientFilesContextType = {
    files,
    addFile,
    updateFile,
    deleteFile,
    getFilesByPatient,
    getFilesByPatientAndType,
    getConsentsByPatient,
    getRxImagesByPatient,
    getOdontogramsByPatient,
    getFileById,
    addDocumentFromClinicalHistory,
    addOdontogramFromClinicalHistory
  }

  return (
    <PatientFilesContext.Provider value={value}>
      {children}
    </PatientFilesContext.Provider>
  )
}

// ============================================
// HOOK PARA USAR EL CONTEXTO
// ============================================

export function usePatientFiles() {
  const context = useContext(PatientFilesContext)
  if (context === undefined) {
    throw new Error(
      'usePatientFiles must be used within a PatientFilesProvider'
    )
  }
  return context
}
