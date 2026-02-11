'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'

// ============================================
// TYPES
// ============================================

type UnsavedArea = {
  key: string
  label: string // Human-readable label for the area
}

type UnsavedChangesContextType = {
  // Check if there are any unsaved changes
  hasUnsavedChanges: boolean

  // Get list of areas with unsaved changes
  unsavedAreas: UnsavedArea[]

  // Register/unregister unsaved changes for a specific area
  registerUnsavedChanges: (
    key: string,
    label: string,
    hasChanges: boolean
  ) => void

  // Clear all unsaved changes (used when discarding changes)
  clearAllUnsavedChanges: () => void

  // Clear unsaved changes for a specific area
  clearUnsavedChanges: (key: string) => void
}

// ============================================
// AREA LABELS (for human-readable messages)
// ============================================

export const UNSAVED_AREA_LABELS: Record<string, string> = {
  'patient-edit': 'Edición de paciente',
  'appointment-edit': 'Edición de cita',
  'configuration-edit': 'Configuración',
  'treatment-plan': 'Plan de tratamiento',
  'clinical-notes': 'Notas clínicas'
}

// ============================================
// CONTEXT
// ============================================

const UnsavedChangesContext = createContext<
  UnsavedChangesContextType | undefined
>(undefined)

// ============================================
// PROVIDER
// ============================================

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  // Map of area key -> UnsavedArea
  const [unsavedAreasMap, setUnsavedAreasMap] = useState<
    Map<string, UnsavedArea>
  >(new Map())

  // Derived: array of unsaved areas
  const unsavedAreas = useMemo(
    () => Array.from(unsavedAreasMap.values()),
    [unsavedAreasMap]
  )

  // Derived: boolean check
  const hasUnsavedChanges = unsavedAreasMap.size > 0

  // Register or unregister unsaved changes for an area
  const registerUnsavedChanges = useCallback(
    (key: string, label: string, hasChanges: boolean) => {
      setUnsavedAreasMap((prev) => {
        const newMap = new Map(prev)

        if (hasChanges) {
          // Add or update the area
          newMap.set(key, { key, label })
        } else {
          // Remove the area if no longer has changes
          newMap.delete(key)
        }

        return newMap
      })
    },
    []
  )

  // Clear all unsaved changes
  const clearAllUnsavedChanges = useCallback(() => {
    setUnsavedAreasMap(new Map())
  }, [])

  // Clear unsaved changes for a specific area
  const clearUnsavedChanges = useCallback((key: string) => {
    setUnsavedAreasMap((prev) => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  // ====== CONTEXT VALUE ======
  const value = useMemo<UnsavedChangesContextType>(
    () => ({
      hasUnsavedChanges,
      unsavedAreas,
      registerUnsavedChanges,
      clearAllUnsavedChanges,
      clearUnsavedChanges
    }),
    [
      hasUnsavedChanges,
      unsavedAreas,
      registerUnsavedChanges,
      clearAllUnsavedChanges,
      clearUnsavedChanges
    ]
  )

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error(
      'useUnsavedChanges must be used within an UnsavedChangesProvider'
    )
  }
  return context
}

// ============================================
// HELPER HOOK - For components to easily register unsaved changes
// ============================================

/**
 * Hook to track unsaved changes for a specific area
 * @param key - Unique identifier for the area (e.g., 'patient-edit-123')
 * @param label - Human-readable label for the area
 *
 * Usage:
 * const { setHasChanges } = useTrackUnsavedChanges('patient-edit', 'Edición de paciente')
 *
 * // When form changes:
 * setHasChanges(true)
 *
 * // When form is saved or cancelled:
 * setHasChanges(false)
 */
export function useTrackUnsavedChanges(key: string, label: string) {
  const { registerUnsavedChanges, clearUnsavedChanges } = useUnsavedChanges()

  const setHasChanges = useCallback(
    (hasChanges: boolean) => {
      registerUnsavedChanges(key, label, hasChanges)
    },
    [key, label, registerUnsavedChanges]
  )

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    clearUnsavedChanges(key)
  }, [key, clearUnsavedChanges])

  return { setHasChanges, cleanup }
}

export default UnsavedChangesContext
