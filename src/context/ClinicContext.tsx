'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import React from 'react'

const STORAGE_KEY = 'klinikos-selected-clinic-id'

export type ClinicOption = {
  id: string
  name: string
  address: string
}

type ClinicSeed = {
  id: string
  name?: string
  address?: string
}

type ClinicContextValue = {
  clinics: ClinicOption[]
  activeClinicId: string | null
  activeClinic: ClinicOption | null
  isLoading: boolean
  isInitialized: boolean
  setActiveClinicId: (clinicId: string) => void
  refreshClinics: () => Promise<void>
}

const ClinicContext = React.createContext<ClinicContextValue | undefined>(undefined)

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function formatAddress(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!isRecord(value)) return ''
  const street = asNonEmptyString(value.street) || ''
  const line2 = asNonEmptyString(value.line2) || ''
  const city = asNonEmptyString(value.city) || ''
  return [street, line2, city].filter(Boolean).join(', ')
}

function normalizeClinicSeed(raw: unknown): ClinicSeed | null {
  if (typeof raw === 'string' || typeof raw === 'number') {
    const id = String(raw)
    return id ? { id } : null
  }

  if (!isRecord(raw)) return null

  const idCandidate =
    asNonEmptyString(raw.id) ||
    asNonEmptyString(raw.clinic_id) ||
    (typeof raw.id === 'number' ? String(raw.id) : null)
  if (!idCandidate) return null

  const name = asNonEmptyString(raw.name) || asNonEmptyString(raw.clinic_name) || undefined
  const address =
    asNonEmptyString(raw.address) ||
    asNonEmptyString(raw.direccion) ||
    formatAddress(raw.address) ||
    undefined

  return {
    id: idCandidate,
    name,
    address
  }
}

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [clinics, setClinics] = React.useState<ClinicOption[]>([])
  const [activeClinicId, setActiveClinicIdState] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isInitialized, setIsInitialized] = React.useState(false)

  const setActiveClinicId = React.useCallback(
    (clinicId: string) => {
      if (!clinics.some((clinic) => clinic.id === clinicId)) return
      setActiveClinicIdState(clinicId)
      try {
        localStorage.setItem(STORAGE_KEY, clinicId)
      } catch {
        // Ignore localStorage failures (private mode / blocked storage).
      }
    },
    [clinics]
  )

  const refreshClinics = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        setClinics([])
        setActiveClinicIdState(null)
        return
      }

      const { data: clinicIdsRaw, error } = await supabase.rpc('get_my_clinics')
      if (error || !Array.isArray(clinicIdsRaw) || clinicIdsRaw.length === 0) {
        setClinics([])
        setActiveClinicIdState(null)
        return
      }

      const clinicSeedsById = new Map<string, ClinicSeed>()
      for (const raw of clinicIdsRaw) {
        const seed = normalizeClinicSeed(raw)
        if (!seed) continue
        if (!clinicSeedsById.has(seed.id)) clinicSeedsById.set(seed.id, seed)
      }

      const clinicIds = Array.from(clinicSeedsById.keys())
      if (clinicIds.length === 0) {
        setClinics([])
        setActiveClinicIdState(null)
        return
      }

      const { data: clinicRows, error: clinicRowsError } = await supabase
        .from('clinics')
        .select('id, name, address')
        .in('id', clinicIds)
      if (clinicRowsError) {
        console.warn('ClinicContext: could not load clinic rows', clinicRowsError)
      }

      type ClinicRow = { id: string; name: string | null; address: unknown }
      const normalizedClinicRows = (clinicRows || []) as ClinicRow[]
      const clinicRowsById = new Map<string, ClinicRow>(
        normalizedClinicRows.map((row) => [String(row.id), row])
      )
      const mappedClinics: ClinicOption[] = clinicIds.map((clinicId) => {
        const seed = clinicSeedsById.get(clinicId)
        const row = clinicRowsById.get(clinicId)
        const rowAddress = formatAddress(row?.address)
        return {
          id: clinicId,
          name: asNonEmptyString(row?.name) || seed?.name || 'Clínica',
          address: rowAddress || seed?.address || 'Sin dirección'
        }
      })

      setClinics(mappedClinics)

      let storedClinicId: string | null = null
      try {
        storedClinicId = localStorage.getItem(STORAGE_KEY)
      } catch {
        storedClinicId = null
      }

      const availableClinicIds = mappedClinics.map((clinic) => clinic.id)
      const resolvedClinicId =
        (storedClinicId &&
          availableClinicIds.includes(storedClinicId) &&
          storedClinicId) ||
        (activeClinicId &&
          availableClinicIds.includes(activeClinicId) &&
          activeClinicId) ||
        availableClinicIds[0] ||
        null

      setActiveClinicIdState(resolvedClinicId)
      if (resolvedClinicId) {
        try {
          localStorage.setItem(STORAGE_KEY, resolvedClinicId)
        } catch {
          // Ignore localStorage failures.
        }
      }
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [activeClinicId, supabase])

  React.useEffect(() => {
    void refreshClinics()
  }, [refreshClinics])

  const activeClinic = React.useMemo(
    () => clinics.find((clinic) => clinic.id === activeClinicId) || null,
    [clinics, activeClinicId]
  )

  const value = React.useMemo(
    () => ({
      clinics,
      activeClinicId,
      activeClinic,
      isLoading,
      isInitialized,
      setActiveClinicId,
      refreshClinics
    }),
    [
      clinics,
      activeClinicId,
      activeClinic,
      isLoading,
      isInitialized,
      setActiveClinicId,
      refreshClinics
    ]
  )

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}

export function useClinic() {
  const context = React.useContext(ClinicContext)
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider')
  }
  return context
}
