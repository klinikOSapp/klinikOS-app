import type { Treatment } from '@/components/pacientes/shared/treatmentTypes'
import { useMemo } from 'react'

/**
 * Hook for filtering treatments by search query
 * Searches in: id, description, professional
 */
export function useTreatmentFilter(
  treatments: Treatment[],
  searchQuery: string
): Treatment[] {
  return useMemo(() => {
    if (!searchQuery) return treatments
    const query = searchQuery.toLowerCase()
    return treatments.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.professional.toLowerCase().includes(query)
    )
  }, [treatments, searchQuery])
}

/**
 * Hook for counting selected treatments across multiple arrays
 */
export function useSelectedCount(...treatmentArrays: Treatment[][]): number {
  return useMemo(() => {
    return treatmentArrays.reduce(
      (total, arr) => total + arr.filter((t) => t.selected).length,
      0
    )
  }, [treatmentArrays])
}
