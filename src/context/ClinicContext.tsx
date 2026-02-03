'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useAuth } from './AuthContext'
import { Clinic } from './ConfigurationContext'

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'klinikos-selected-clinic'

// ============================================
// MOCK CLINICS DATA
// ============================================

// This data matches the clinics in ConfigurationContext
// In production, this would come from the backend
const allClinics: Clinic[] = [
  {
    id: 'clinic-1',
    nombre: 'Clínica Morales Ruzafa',
    direccion: 'C/ Universidad, 2, Valencia',
    horario: '08:00 - 20:00',
    telefono: '608020203',
    email: 'clinicamorales@morales.es',
    isActive: true
  },
  {
    id: 'clinic-2',
    nombre: 'Clínica Morales Albal',
    direccion: 'C/ Madrid, 12, Catarroja',
    horario: '09:30 - 20:00',
    telefono: '608020203',
    email: 'clinicamorales@morales.es',
    isActive: true
  },
  {
    id: 'clinic-3',
    nombre: 'Clínica Morales Centro',
    direccion: 'C/ Colón, 45, Valencia',
    horario: '09:00 - 21:00',
    telefono: '608020204',
    email: 'centro@morales.es',
    isActive: true
  }
]

// ============================================
// CONTEXT TYPE
// ============================================

type ClinicContextType = {
  // Current clinic state
  currentClinic: Clinic | null
  currentClinicId: string | null

  // Available clinics for the user
  accessibleClinics: Clinic[]

  // Actions
  switchClinic: (clinicId: string) => void

  // Loading state
  isLoading: boolean
  isInitialized: boolean
}

// ============================================
// CONTEXT
// ============================================

const ClinicContext = createContext<ClinicContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

export function ClinicProvider({ children }: { children: ReactNode }) {
  const { accessibleClinicIds } = useAuth()

  const [currentClinicId, setCurrentClinicId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Filter clinics based on user's accessible clinic IDs
  const accessibleClinics = useMemo(
    () =>
      allClinics.filter(
        (clinic) => accessibleClinicIds.includes(clinic.id) && clinic.isActive
      ),
    [accessibleClinicIds]
  )

  // Get current clinic object
  const currentClinic = useMemo(
    () => accessibleClinics.find((c) => c.id === currentClinicId) ?? null,
    [accessibleClinics, currentClinicId]
  )

  // Initialize from localStorage on mount
  useEffect(() => {
    const initializeClinic = () => {
      try {
        const storedClinicId = localStorage.getItem(STORAGE_KEY)

        // Validate that stored clinic ID is accessible to the user
        if (storedClinicId && accessibleClinicIds.includes(storedClinicId)) {
          setCurrentClinicId(storedClinicId)
        } else if (accessibleClinics.length > 0) {
          // Default to first accessible clinic
          const defaultClinicId = accessibleClinics[0].id
          setCurrentClinicId(defaultClinicId)
          localStorage.setItem(STORAGE_KEY, defaultClinicId)
        }
      } catch (error) {
        // localStorage might not be available (SSR, private browsing, etc.)
        console.warn('Could not access localStorage:', error)
        if (accessibleClinics.length > 0) {
          setCurrentClinicId(accessibleClinics[0].id)
        }
      }

      setIsInitialized(true)
    }

    // Only initialize once we have accessible clinics
    if (accessibleClinicIds.length > 0 && !isInitialized) {
      initializeClinic()
    } else if (accessibleClinicIds.length === 0) {
      setIsInitialized(true)
    }
  }, [accessibleClinicIds, accessibleClinics, isInitialized])

  // Switch clinic function
  const switchClinic = useCallback(
    (clinicId: string) => {
      // Validate that the clinic is accessible
      if (!accessibleClinicIds.includes(clinicId)) {
        console.error(
          `Clinic ${clinicId} is not accessible to the current user`
        )
        return
      }

      setIsLoading(true)

      // Update state
      setCurrentClinicId(clinicId)

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, clinicId)
      } catch (error) {
        console.warn('Could not save to localStorage:', error)
      }

      // Simulate a small delay for UX feedback (optional, can be removed)
      // In production, this might involve fetching clinic-specific data
      setTimeout(() => {
        setIsLoading(false)
      }, 50)
    },
    [accessibleClinicIds]
  )

  // ====== CONTEXT VALUE ======
  const value = useMemo<ClinicContextType>(
    () => ({
      currentClinic,
      currentClinicId,
      accessibleClinics,
      switchClinic,
      isLoading,
      isInitialized
    }),
    [
      currentClinic,
      currentClinicId,
      accessibleClinics,
      switchClinic,
      isLoading,
      isInitialized
    ]
  )

  return (
    <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useClinic() {
  const context = useContext(ClinicContext)
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider')
  }
  return context
}

export default ClinicContext
