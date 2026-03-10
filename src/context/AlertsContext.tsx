'use client'

import { useClinic } from '@/context/ClinicContext'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

export type Alert = {
  id: number
  clinicId: string
  createdBy: string
  patientId: string | null
  patientName: string | null
  boxId: string | null
  appliesToAllBoxes: boolean
  title: string
  description: string | null
  dueDate: string
  dueTime: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

type DbAlertRow = {
  id: number
  clinic_id: string
  created_by: string
  patient_id: string | null
  box_id: string | null
  applies_to_all_boxes: boolean
  title: string
  description: string | null
  due_date: string
  due_time: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

type DbPatientLookupRow = {
  id: string
  first_name: string | null
  last_name: string | null
}

type CreateAlertInput = {
  title: string
  description?: string
  dueDate: string
  dueTime?: string | null
  patientId?: string | null
  boxId?: string | null
  appliesToAllBoxes: boolean
}

type AlertsContextValue = {
  alerts: Alert[]
  pendingCount: number
  isLoading: boolean
  refreshAlerts: () => Promise<void>
  createAlert: (input: CreateAlertInput) => Promise<void>
  toggleComplete: (id: number, completed: boolean) => Promise<void>
  deleteAlert: (id: number) => Promise<void>
}

const AlertsContext = createContext<AlertsContextValue | undefined>(undefined)

type ErrorInfo = {
  code?: string
  message: string
}

function toErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return { message: error.message }
  }
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>
    const code = typeof record.code === 'string' ? record.code : undefined
    const message =
      typeof record.message === 'string'
        ? record.message
        : JSON.stringify(record)
    return { code, message }
  }
  return { message: String(error) }
}

function shouldUseLocalFallback(error: unknown): boolean {
  const info = toErrorInfo(error)
  // 42P01: relation does not exist (alerts table not deployed yet)
  // 42501: insufficient privilege / RLS not ready
  // PGRST205/PGRST204: missing relation in PostgREST schema cache
  return (
    info.code === '42P01' ||
    info.code === '42501' ||
    info.code === 'PGRST205' ||
    info.code === 'PGRST204' ||
    info.message.toLowerCase().includes("could not find the table 'public.alerts'") ||
    info.message.toLowerCase().includes('schema cache')
  )
}

function sortAlerts(items: Alert[]): Alert[] {
  return [...items].sort((a, b) => {
    const aKey = `${a.dueDate}T${a.dueTime ?? '23:59'}`
    const bKey = `${b.dueDate}T${b.dueTime ?? '23:59'}`
    return aKey.localeCompare(bKey)
  })
}

function getLocalStorageKey(clinicId: string, userId: string): string {
  return `klinikos.alerts.${clinicId}.${userId}`
}

function readLocalAlerts(clinicId: string, userId: string): Alert[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(clinicId, userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<Alert>[]
    const normalized = (Array.isArray(parsed) ? parsed : []).map((item) => ({
      id: Number(item.id ?? Date.now()),
      clinicId: item.clinicId ?? clinicId,
      createdBy: item.createdBy ?? userId,
      patientId: item.patientId ?? null,
      patientName: item.patientName ?? null,
      boxId: item.boxId ?? null,
      appliesToAllBoxes: item.appliesToAllBoxes ?? false,
      title: item.title ?? 'Alerta',
      description: item.description ?? null,
      dueDate: item.dueDate ?? new Date().toISOString().slice(0, 10),
      dueTime: item.dueTime ?? null,
      completed: item.completed ?? false,
      completedAt: item.completedAt ?? null,
      createdAt: item.createdAt ?? new Date().toISOString(),
      updatedAt: item.updatedAt ?? new Date().toISOString()
    }))
    return sortAlerts(normalized)
  } catch {
    return []
  }
}

function writeLocalAlerts(clinicId: string, userId: string, items: Alert[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      getLocalStorageKey(clinicId, userId),
      JSON.stringify(sortAlerts(items))
    )
  } catch {
    // Ignore localStorage write issues.
  }
}

function buildPatientName(row: DbPatientLookupRow | undefined): string | null {
  if (!row) return null
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim()
  return name.length > 0 ? name : null
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const { activeClinicId, isInitialized } = useClinic()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingLocalFallback, setIsUsingLocalFallback] = useState(false)
  const hasLoggedFallbackRef = useRef(false)

  const getSessionUserId = useCallback(async (): Promise<string | null> => {
    const {
      data: { user }
    } = await supabase.auth.getUser()
    return user?.id ?? null
  }, [supabase])

  const refreshAlerts = useCallback(async () => {
    if (!isInitialized) return
    if (!activeClinicId) {
      setAlerts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const userId = await getSessionUserId()
      if (!userId) {
        setAlerts([])
        setIsLoading(false)
        return
      }

      if (isUsingLocalFallback) {
        setAlerts(readLocalAlerts(activeClinicId, userId))
        return
      }

      const { data: alertRows, error: alertsError } = await supabase
        .from('alerts')
        .select(
          'id, clinic_id, created_by, patient_id, box_id, applies_to_all_boxes, title, description, due_date, due_time, completed, completed_at, created_at, updated_at'
        )
        .eq('clinic_id', activeClinicId)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true })
        .returns<DbAlertRow[]>()

      if (alertsError) {
        const info = toErrorInfo(alertsError)
        if (shouldUseLocalFallback(alertsError)) {
          setIsUsingLocalFallback(true)
          setAlerts(readLocalAlerts(activeClinicId, userId))
          if (!hasLoggedFallbackRef.current) {
            hasLoggedFallbackRef.current = true
            console.warn(
              'Alerts table not available in Supabase yet. Using local fallback.',
              info
            )
          }
          return
        }
        console.error('Error loading alerts:', info)
        setAlerts([])
        return
      }

      const patientIds = Array.from(
        new Set(
          (alertRows ?? [])
            .map((row) => row.patient_id)
            .filter((value): value is string => Boolean(value))
        )
      )

      let patientById = new Map<string, DbPatientLookupRow>()
      if (patientIds.length > 0) {
        const { data: patientsData, error: patientError } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .in('id', patientIds)
          .returns<DbPatientLookupRow[]>()

        if (patientError) {
          console.warn('Error loading patient names for alerts:', patientError)
        } else {
          patientById = new Map((patientsData ?? []).map((row) => [row.id, row]))
        }
      }

      const mappedAlerts: Alert[] = (alertRows ?? []).map((row) => ({
        id: row.id,
        clinicId: row.clinic_id,
        createdBy: row.created_by,
        patientId: row.patient_id,
        patientName: row.patient_id
          ? buildPatientName(patientById.get(row.patient_id))
          : null,
        boxId: row.box_id,
        appliesToAllBoxes: row.applies_to_all_boxes,
        title: row.title,
        description: row.description,
        dueDate: row.due_date,
        dueTime: row.due_time,
        completed: row.completed,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      setAlerts(sortAlerts(mappedAlerts))
    } catch (error) {
      console.error('Unexpected error loading alerts:', toErrorInfo(error))
      setAlerts([])
    } finally {
      setIsLoading(false)
    }
  }, [
    activeClinicId,
    getSessionUserId,
    isInitialized,
    isUsingLocalFallback,
    supabase
  ])

  useEffect(() => {
    void refreshAlerts()
  }, [refreshAlerts])

  const createAlert = useCallback(
    async (input: CreateAlertInput) => {
      if (!activeClinicId) {
        throw new Error('No hay una clínica seleccionada para crear alertas.')
      }
      const userId = await getSessionUserId()
      if (!userId) {
        throw new Error('No hay sesión activa para crear alertas.')
      }

      if (isUsingLocalFallback) {
        const nowIso = new Date().toISOString()
        const next: Alert = {
          id: Date.now(),
          clinicId: activeClinicId,
          createdBy: userId,
          patientId: input.patientId ?? null,
          boxId: input.appliesToAllBoxes ? null : (input.boxId ?? null),
          appliesToAllBoxes: input.appliesToAllBoxes,
          patientName: null,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          dueDate: input.dueDate,
          dueTime: input.dueTime || null,
          completed: false,
          completedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso
        }
        const nextItems = sortAlerts([...alerts, next])
        setAlerts(nextItems)
        writeLocalAlerts(activeClinicId, userId, nextItems)
        return
      }

      const { error } = await supabase.from('alerts').insert({
        clinic_id: activeClinicId,
        created_by: userId,
        patient_id: input.patientId ?? null,
        box_id: input.appliesToAllBoxes ? null : (input.boxId ?? null),
        applies_to_all_boxes: input.appliesToAllBoxes,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        due_date: input.dueDate,
        due_time: input.dueTime || null
      })
      if (error) {
        if (shouldUseLocalFallback(error)) {
          setIsUsingLocalFallback(true)
          const nowIso = new Date().toISOString()
          const next: Alert = {
            id: Date.now(),
            clinicId: activeClinicId,
            createdBy: userId,
            patientId: input.patientId ?? null,
            boxId: input.appliesToAllBoxes ? null : (input.boxId ?? null),
            appliesToAllBoxes: input.appliesToAllBoxes,
            patientName: null,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            dueDate: input.dueDate,
            dueTime: input.dueTime || null,
            completed: false,
            completedAt: null,
            createdAt: nowIso,
            updatedAt: nowIso
          }
          const nextItems = sortAlerts([...alerts, next])
          setAlerts(nextItems)
          writeLocalAlerts(activeClinicId, userId, nextItems)
          return
        }
        throw new Error(toErrorInfo(error).message)
      }
      await refreshAlerts()
    },
    [activeClinicId, alerts, getSessionUserId, isUsingLocalFallback, refreshAlerts, supabase]
  )

  const toggleComplete = useCallback(
    async (id: number, completed: boolean) => {
      if (!activeClinicId) return
      const userId = await getSessionUserId()
      if (!userId) return

      if (isUsingLocalFallback) {
        const nextItems = alerts.map((item) =>
          item.id === id
            ? {
                ...item,
                completed,
                completedAt: completed ? new Date().toISOString() : null,
                updatedAt: new Date().toISOString()
              }
            : item
        )
        setAlerts(sortAlerts(nextItems))
        writeLocalAlerts(activeClinicId, userId, nextItems)
        return
      }

      const { error } = await supabase
        .from('alerts')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', id)
      if (error) {
        throw new Error(toErrorInfo(error).message)
      }
      await refreshAlerts()
    },
    [activeClinicId, alerts, getSessionUserId, isUsingLocalFallback, refreshAlerts, supabase]
  )

  const deleteAlert = useCallback(
    async (id: number) => {
      if (!activeClinicId) return
      const userId = await getSessionUserId()
      if (!userId) return

      if (isUsingLocalFallback) {
        const nextItems = alerts.filter((item) => item.id !== id)
        setAlerts(nextItems)
        writeLocalAlerts(activeClinicId, userId, nextItems)
        return
      }

      const { error } = await supabase.from('alerts').delete().eq('id', id)
      if (error) {
        throw new Error(toErrorInfo(error).message)
      }
      await refreshAlerts()
    },
    [activeClinicId, alerts, getSessionUserId, isUsingLocalFallback, refreshAlerts, supabase]
  )

  const pendingCount = useMemo(
    () => alerts.filter((alert) => !alert.completed).length,
    [alerts]
  )

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        pendingCount,
        isLoading,
        refreshAlerts,
        createAlert,
        toggleComplete,
        deleteAlert
      }}
    >
      {children}
    </AlertsContext.Provider>
  )
}

export function useAlerts() {
  const context = useContext(AlertsContext)
  if (!context) {
    throw new Error('useAlerts must be used within an AlertsProvider')
  }
  return context
}
