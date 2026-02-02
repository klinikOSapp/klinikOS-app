'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState
} from 'react'

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

// ============================================
// CONTEXTO
// ============================================

type PatientFilesContextType = {
  files: PatientFile[]
  // CRUD operations
  addFile: (file: Omit<PatientFile, 'id'>) => string
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
  ) => Promise<string>
  addOdontogramFromClinicalHistory: (
    file: File,
    patientId: string,
    appointmentId: string,
    uploadedBy: string
  ) => Promise<string>
}

const PatientFilesContext = createContext<PatientFilesContextType | undefined>(
  undefined
)

// ============================================
// PROVIDER
// ============================================

export function PatientFilesProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<PatientFile[]>(INITIAL_PATIENT_FILES)

  // Add a new file
  const addFile = useCallback((fileData: Omit<PatientFile, 'id'>): string => {
    const newId = `pf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newFile: PatientFile = {
      ...fileData,
      id: newId
    }
    setFiles((prev) => [...prev, newFile])
    console.log(`✅ Archivo añadido: ${newFile.name} (${newFile.type})`)
    return newId
  }, [])

  // Update a file
  const updateFile = useCallback(
    (id: string, updates: Partial<PatientFile>) => {
      setFiles((prev) =>
        prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
      )
      console.log(`✅ Archivo ${id} actualizado`)
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
    ): Promise<string> => {
      const url = URL.createObjectURL(file)
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
        url,
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
      return id
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
    ): Promise<string> => {
      const url = URL.createObjectURL(file)
      const now = new Date()

      const newFile: Omit<PatientFile, 'id'> = {
        patientId,
        name: file.name.replace(/\.[^/.]+$/, '') || 'Odontograma',
        type: 'odontogram',
        url,
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
      return id
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
