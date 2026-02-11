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
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useClinic } from './ClinicContext'

// ============================================
// TIPOS PARA CONFIGURACIÓN DE CLÍNICA
// ============================================

export type ClinicInfo = {
  id: string
  nombreComercial: string
  razonSocial: string
  cif: string
  direccion: string
  poblacion: string
  codigoPostal: string
  telefono: string
  email: string
  iban: string
  emailBancario: string
  logo?: string // Base64 or URL of the clinic logo
  web?: string // Website URL
}

export type Clinic = {
  id: string
  nombre: string
  direccion: string
  horario: string
  telefono: string
  email: string
  isActive: boolean
}

// ============================================
// TIPOS PARA PROFESIONALES/ESPECIALISTAS
// ============================================

export type ProfessionalColorTone =
  | 'morado'
  | 'naranja'
  | 'verde'
  | 'azul'
  | 'rojo'

export type Professional = {
  id: string
  name: string
  role: string // Especialidad: Odontólogo, Ortodoncista, Higienista, etc.
  phone: string
  email: string
  colorLabel: string
  colorTone: ProfessionalColorTone
  commission: string
  status: 'Activo' | 'Inactivo'
  photoUrl?: string
}

// Color styles for professionals
export const professionalColorStyles: Record<
  ProfessionalColorTone,
  { bg: string; text: string; hex: string }
> = {
  morado: { bg: 'bg-[#f3eaff]', text: 'text-[#7725eb]', hex: '#7725eb' },
  naranja: { bg: 'bg-[#fff7e8]', text: 'text-[#d97706]', hex: '#d97706' },
  verde: { bg: 'bg-[#e9f8f1]', text: 'text-[#2e7d5b]', hex: '#2e7d5b' },
  azul: { bg: 'bg-[#e0f2fe]', text: 'text-[#0369a1]', hex: '#0369a1' },
  rojo: { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', hex: '#dc2626' }
}

// ============================================
// TIPOS PARA BOXES/GABINETES
// ============================================

export type Box = {
  id: string
  label: string
  tone: 'neutral' | 'brand' | 'success' | 'warning' | 'error'
  isActive: boolean
}

// ============================================
// TIPOS PARA HORARIOS DE TRABAJO
// ============================================

export type DayOfWeek =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo'

export type TimeRange = {
  start: string // HH:MM format
  end: string // HH:MM format
}

export type WorkingHoursConfig = {
  defaultStartHour: number // e.g., 9 for 9:00
  defaultEndHour: number // e.g., 20 for 20:00
  slotDurationMinutes: number // e.g., 15
  workingDays: DayOfWeek[]
  morningShift: TimeRange
  afternoonShift: TimeRange
}

// ============================================
// DATOS INICIALES (MOCK)
// ============================================

const initialClinicInfo: ClinicInfo = {
  id: 'clinic-main',
  nombreComercial: 'Clínica Morales',
  razonSocial: 'Clínica Morales S.L.',
  cif: 'B12345678',
  direccion: 'C/ Universidad, 2',
  poblacion: 'Valencia',
  codigoPostal: '46001',
  telefono: '608020203',
  email: 'clinicamorales@morales.es',
  iban: 'ES12 1234 5678 9012 3456 7890',
  emailBancario: 'facturacion@morales.es'
}

const initialClinics: Clinic[] = [
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

const initialProfessionals: Professional[] = [
  {
    id: 'prof-1',
    name: 'Dr. Antonio Ruiz',
    role: 'Odontólogo',
    phone: '608020203',
    email: 'antonio@clinicamorales.es',
    colorLabel: 'Morado',
    colorTone: 'morado',
    commission: '30%',
    status: 'Activo'
  },
  {
    id: 'prof-2',
    name: 'Dra. María García',
    role: 'Ortodoncista',
    phone: '608020204',
    email: 'maria@clinicamorales.es',
    colorLabel: 'Naranja',
    colorTone: 'naranja',
    commission: '30%',
    status: 'Activo'
  },
  {
    id: 'prof-3',
    name: 'Carlos Pérez',
    role: 'Higienista',
    phone: '608020205',
    email: 'carlos@clinicamorales.es',
    colorLabel: 'Verde',
    colorTone: 'verde',
    commission: '25%',
    status: 'Activo'
  },
  {
    id: 'prof-4',
    name: 'Dra. Laura Martínez',
    role: 'Implantólogo',
    phone: '608020206',
    email: 'laura@clinicamorales.es',
    colorLabel: 'Azul',
    colorTone: 'azul',
    commission: '35%',
    status: 'Activo'
  },
  {
    id: 'prof-5',
    name: 'Javier Herrera',
    role: 'Higienista',
    phone: '608020207',
    email: 'javier@clinicamorales.es',
    colorLabel: 'Rojo',
    colorTone: 'rojo',
    commission: '25%',
    status: 'Inactivo'
  }
]

const initialBoxes: Box[] = [
  { id: 'box-1', label: 'BOX 1', tone: 'neutral', isActive: true },
  { id: 'box-2', label: 'BOX 2', tone: 'neutral', isActive: true },
  { id: 'box-3', label: 'BOX 3', tone: 'neutral', isActive: true }
]

const initialWorkingHours: WorkingHoursConfig = {
  defaultStartHour: 9,
  defaultEndHour: 20,
  slotDurationMinutes: 15,
  workingDays: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
  morningShift: { start: '09:00', end: '14:00' },
  afternoonShift: { start: '15:00', end: '20:00' }
}

const DAY_INDEX_TO_NAME: Record<number, DayOfWeek> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado'
}

const DAY_NAME_TO_INDEX: Record<DayOfWeek, number> = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0
}

function parseHexToTone(hex?: string | null): ProfessionalColorTone {
  const value = (hex || '').toLowerCase()
  if (value === '#d97706') return 'naranja'
  if (value === '#2e7d5b') return 'verde'
  if (value === '#0369a1') return 'azul'
  if (value === '#dc2626') return 'rojo'
  return 'morado'
}

function toneToLabel(tone: ProfessionalColorTone): string {
  switch (tone) {
    case 'naranja':
      return 'Naranja'
    case 'verde':
      return 'Verde'
    case 'azul':
      return 'Azul'
    case 'rojo':
      return 'Rojo'
    default:
      return 'Morado'
  }
}

// ============================================
// CONTEXT TYPE
// ============================================

type ConfigurationContextType = {
  // Clinic Info
  clinicInfo: ClinicInfo
  updateClinicInfo: (updates: Partial<ClinicInfo>) => void

  // Clinics List
  clinics: Clinic[]
  addClinic: (clinic: Omit<Clinic, 'id'>) => void
  updateClinic: (id: string, updates: Partial<Clinic>) => void
  deleteClinic: (id: string) => void

  // Professionals
  professionals: Professional[]
  activeProfessionals: Professional[]
  addProfessional: (professional: Omit<Professional, 'id'>) => void
  updateProfessional: (id: string, updates: Partial<Professional>) => void
  deleteProfessional: (id: string) => void
  getProfessionalById: (id: string) => Professional | undefined
  getProfessionalByName: (name: string) => Professional | undefined

  // Professional options for dropdowns (agenda)
  professionalOptions: Array<{ id: string; label: string; color: string }>

  // Boxes
  boxes: Box[]
  activeBoxes: Box[]
  addBox: (box: Omit<Box, 'id'>) => void
  updateBox: (id: string, updates: Partial<Box>) => void
  deleteBox: (id: string) => void

  // Box options for dropdowns (agenda)
  boxOptions: Array<{ id: string; label: string }>

  // Working Hours
  workingHours: WorkingHoursConfig
  updateWorkingHours: (updates: Partial<WorkingHoursConfig>) => void

  // Period helpers for calendar
  getPeriodConfig: (period: 'full' | 'morning' | 'afternoon') => {
    startHour: number
    endHour: number
  }
}

// ============================================
// CONTEXT
// ============================================

const ConfigurationContext = createContext<
  ConfigurationContextType | undefined
>(undefined)

// ============================================
// PROVIDER
// ============================================

export function ConfigurationProvider({ children }: { children: ReactNode }) {
  // State
  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>(initialClinicInfo)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [workingHours, setWorkingHours] =
    useState<WorkingHoursConfig>(initialWorkingHours)
  const { activeClinicId, isInitialized: isClinicInitialized } = useClinic()

  useEffect(() => {
    let isMounted = true

    async function hydrateConfigurationFromDb() {
      try {
        if (!isClinicInitialized || !activeClinicId) return

        const supabase = createSupabaseBrowserClient()
        const {
          data: { session }
        } = await supabase.auth.getSession()

        if (!session) return

        const { data: myClinicIds, error: myClinicsError } =
          await supabase.rpc('get_my_clinics')
        if (
          myClinicsError ||
          !Array.isArray(myClinicIds) ||
          myClinicIds.length === 0
        ) {
          return
        }

        const clinicIds = myClinicIds.map((id) => String(id))
        const selectedClinicId = clinicIds.includes(activeClinicId)
          ? activeClinicId
          : clinicIds[0]

        const [{ data: clinicRows }, { data: boxRows }, { data: workingRows }, { data: staffLiteRows }] =
          await Promise.all([
            supabase
              .from('clinics')
              .select(
                'id, name, legal_name, tax_id, website, logo_url, address, contact_info'
              )
              .in('id', clinicIds)
              .order('name', { ascending: true }),
            supabase
              .from('boxes')
              .select('id, clinic_id, name_or_number')
              .eq('clinic_id', selectedClinicId),
            supabase
              .from('clinic_working_hours')
              .select('dow, start_time, end_time, is_open')
              .eq('clinic_id', selectedClinicId)
              .order('dow', { ascending: true }),
            supabase.rpc('get_clinic_staff', { clinic: selectedClinicId })
          ])

        const staffIds = Array.isArray(staffLiteRows)
          ? staffLiteRows
              .map((row) => String((row as { id?: string }).id || ''))
              .filter(Boolean)
          : []

        const { data: staffRows } =
          staffIds.length > 0
            ? await supabase
                .from('staff')
                .select(
                  'id, full_name, specialties, phone, email, calendar_color, commission_percentage, is_active, avatar_url'
                )
                .in('id', staffIds)
            : { data: [] as Array<Record<string, unknown>> }
        const workingRowsSafe = workingRows || []

        const mappedClinics: Clinic[] = Array.isArray(clinicRows)
          ? clinicRows.map((row) => {
              const address = (row.address as Record<string, unknown> | null) || {}
              const contact = (row.contact_info as Record<string, unknown> | null) || {}
              const city = String(address.city || '')
              const street = String(address.street || '')
              const line2 = String(address.line2 || '')
              const direction = [street, line2, city].filter(Boolean).join(', ')
              const openHour = Number(workingRowsSafe[0]?.start_time?.slice(0, 2) || 9)
              const closeHour = Number(
                workingRowsSafe[workingRowsSafe.length - 1]?.end_time?.slice(0, 2) ||
                  20
              )

              return {
                id: String(row.id),
                nombre: String(row.name || 'Clínica'),
                direccion: direction || 'Sin dirección',
                horario: `${String(openHour).padStart(2, '0')}:00 - ${String(
                  closeHour
                ).padStart(2, '0')}:00`,
                telefono: String(contact.phone || ''),
                email: String(contact.email || ''),
                isActive: true
              }
            })
          : []

        const selectedClinicRow =
          (clinicRows || []).find((row) => String(row.id) === selectedClinicId) ||
          clinicRows?.[0]

        const selectedAddress =
          (selectedClinicRow?.address as Record<string, unknown> | null) || {}
        const selectedContact =
          (selectedClinicRow?.contact_info as Record<string, unknown> | null) || {}

        const mappedProfessionals: Professional[] = Array.isArray(staffRows)
          ? staffRows.map((row) => {
              const tone = parseHexToTone(
                typeof row.calendar_color === 'string' ? row.calendar_color : null
              )
              return {
                id: String(row.id),
                name: String(row.full_name || 'Profesional'),
                role: Array.isArray(row.specialties)
                  ? String(row.specialties[0] || 'Profesional')
                  : 'Profesional',
                phone: String(row.phone || ''),
                email: String(row.email || ''),
                colorLabel: toneToLabel(tone),
                colorTone: tone,
                commission:
                  row.commission_percentage != null
                    ? `${Number(row.commission_percentage)}%`
                    : '0%',
                status: row.is_active === false ? 'Inactivo' : 'Activo',
                photoUrl:
                  typeof row.avatar_url === 'string' ? row.avatar_url : undefined
              }
            })
          : []

        const mappedBoxes: Box[] = Array.isArray(boxRows)
          ? boxRows.map((row) => ({
              id: String(row.id),
              label: String(row.name_or_number || 'BOX'),
              tone: 'neutral' as const,
              isActive: true
            }))
          : []

        const openWorkingRows = workingRowsSafe.filter((row) => row.is_open)
        const workingDays =
          openWorkingRows.length > 0
            ? openWorkingRows
                .map((row) => DAY_INDEX_TO_NAME[row.dow] || null)
                .filter(Boolean) as DayOfWeek[]
            : initialWorkingHours.workingDays

        const minStartHour =
          openWorkingRows.length > 0
            ? Math.min(...openWorkingRows.map((row) => Number(row.start_time.slice(0, 2))))
            : initialWorkingHours.defaultStartHour
        const maxEndHour =
          openWorkingRows.length > 0
            ? Math.max(...openWorkingRows.map((row) => Number(row.end_time.slice(0, 2))))
            : initialWorkingHours.defaultEndHour

        const morningRows = openWorkingRows.filter(
          (row) => Number(row.end_time.slice(0, 2)) <= 15
        )
        const afternoonRows = openWorkingRows.filter(
          (row) => Number(row.start_time.slice(0, 2)) >= 14
        )

        const newWorkingHours: WorkingHoursConfig = {
          defaultStartHour: minStartHour,
          defaultEndHour: maxEndHour,
          slotDurationMinutes: initialWorkingHours.slotDurationMinutes,
          workingDays,
          morningShift: {
            start: morningRows[0]?.start_time?.slice(0, 5) || '09:00',
            end:
              morningRows[morningRows.length - 1]?.end_time?.slice(0, 5) ||
              '14:00'
          },
          afternoonShift: {
            start: afternoonRows[0]?.start_time?.slice(0, 5) || '15:00',
            end:
              afternoonRows[afternoonRows.length - 1]?.end_time?.slice(0, 5) ||
              '20:00'
          }
        }

        if (isMounted) {
          if (mappedClinics.length > 0) {
            setClinics(mappedClinics)
          }
          if (mappedProfessionals.length > 0) {
            setProfessionals(mappedProfessionals)
          }
          if (mappedBoxes.length > 0) {
            setBoxes(mappedBoxes)
          }
          setWorkingHours(newWorkingHours)

          if (selectedClinicRow) {
            setClinicInfo((prev) => ({
              ...prev,
              id: String(selectedClinicRow.id),
              nombreComercial: String(selectedClinicRow.name || prev.nombreComercial),
              razonSocial: String(
                selectedClinicRow.legal_name || prev.razonSocial || ''
              ),
              cif: String(selectedClinicRow.tax_id || prev.cif || ''),
              direccion: String(selectedAddress.street || prev.direccion || ''),
              poblacion: String(selectedAddress.city || prev.poblacion || ''),
              codigoPostal: String(
                selectedAddress.postal_code || prev.codigoPostal || ''
              ),
              telefono: String(selectedContact.phone || prev.telefono || ''),
              email: String(selectedContact.email || prev.email || ''),
              iban: String(selectedContact.iban || prev.iban || ''),
              emailBancario: String(
                selectedContact.billing_email || prev.emailBancario || ''
              ),
              logo:
                typeof selectedClinicRow.logo_url === 'string'
                  ? selectedClinicRow.logo_url
                  : prev.logo,
              web:
                typeof selectedClinicRow.website === 'string'
                  ? selectedClinicRow.website
                  : prev.web
            }))
          }
        }
      } catch (error) {
        console.warn('ConfigurationContext DB hydration failed, using mock data', error)
      }
    }

    void hydrateConfigurationFromDb()

    return () => {
      isMounted = false
    }
  }, [activeClinicId, isClinicInitialized])

  // ====== CLINIC INFO ======
  const updateClinicInfo = useCallback((updates: Partial<ClinicInfo>) => {
    const mergedClinicInfo: ClinicInfo = { ...clinicInfo, ...updates }
    setClinicInfo(mergedClinicInfo)

    if (!activeClinicId) return

    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString()
        }

        if (updates.nombreComercial !== undefined) payload.name = updates.nombreComercial
        if (updates.razonSocial !== undefined) payload.legal_name = updates.razonSocial
        if (updates.cif !== undefined) payload.tax_id = updates.cif
        if (updates.web !== undefined) payload.website = updates.web || null
        if (updates.logo !== undefined) payload.logo_url = updates.logo || null

        payload.address = {
          street: mergedClinicInfo.direccion || null,
          city: mergedClinicInfo.poblacion || null,
          postal_code: mergedClinicInfo.codigoPostal || null
        }
        payload.contact_info = {
          phone: mergedClinicInfo.telefono || null,
          email: mergedClinicInfo.email || null,
          iban: mergedClinicInfo.iban || null,
          billing_email: mergedClinicInfo.emailBancario || null
        }

        const { error } = await supabase
          .from('clinics')
          .update(payload)
          .eq('id', activeClinicId)

        if (error) {
          console.warn('No se pudo persistir clinicInfo en DB', error)
        }
      } catch (error) {
        console.warn('Error persistiendo clinicInfo en DB', error)
      }
    })()
  }, [activeClinicId, clinicInfo])

  // ====== CLINICS ======
  const addClinic = useCallback((clinic: Omit<Clinic, 'id'>) => {
    const newClinic: Clinic = {
      ...clinic,
      id: `clinic-${Date.now()}`
    }
    setClinics((prev) => [...prev, newClinic])
  }, [])

  const updateClinic = useCallback((id: string, updates: Partial<Clinic>) => {
    setClinics((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }, [])

  const deleteClinic = useCallback((id: string) => {
    setClinics((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // ====== PROFESSIONALS ======
  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.status === 'Activo'),
    [professionals]
  )

  const addProfessional = useCallback(
    (professional: Omit<Professional, 'id'>) => {
      const newProfessional: Professional = {
        ...professional,
        id: `prof-${Date.now()}`
      }
      setProfessionals((prev) => [...prev, newProfessional])
    },
    []
  )

  const updateProfessional = useCallback(
    (id: string, updates: Partial<Professional>) => {
      setProfessionals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      )
    },
    []
  )

  const deleteProfessional = useCallback((id: string) => {
    setProfessionals((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getProfessionalById = useCallback(
    (id: string) => professionals.find((p) => p.id === id),
    [professionals]
  )

  const getProfessionalByName = useCallback(
    (name: string) => professionals.find((p) => p.name === name),
    [professionals]
  )

  // Professional options for agenda dropdowns
  const professionalOptions = useMemo(
    () =>
      activeProfessionals.map((p) => ({
        id: p.id,
        label: p.name,
        color: professionalColorStyles[p.colorTone]?.hex || '#6b7280'
      })),
    [activeProfessionals]
  )

  // ====== BOXES ======
  const activeBoxes = useMemo(() => boxes.filter((b) => b.isActive), [boxes])

  const addBox = useCallback((box: Omit<Box, 'id'>) => {
    const newBox: Box = {
      ...box,
      id: `box-${Date.now()}`
    }
    setBoxes((prev) => [...prev, newBox])
  }, [])

  const updateBox = useCallback((id: string, updates: Partial<Box>) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    )
  }, [])

  const deleteBox = useCallback((id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id))
  }, [])

  // Box options for agenda dropdowns
  const boxOptions = useMemo(
    () => activeBoxes.map((b) => ({ id: b.id, label: b.label })),
    [activeBoxes]
  )

  // ====== WORKING HOURS ======
  const updateWorkingHours = useCallback(
    (updates: Partial<WorkingHoursConfig>) => {
      const mergedConfig: WorkingHoursConfig = { ...workingHours, ...updates }
      setWorkingHours(mergedConfig)

      if (!activeClinicId) return

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const rows = mergedConfig.workingDays.flatMap((day) => {
            const dow = DAY_NAME_TO_INDEX[day]
            const blocks: Array<{
              clinic_id: string
              dow: number
              start_time: string
              end_time: string
              is_open: boolean
            }> = []

            if (mergedConfig.morningShift.start < mergedConfig.morningShift.end) {
              blocks.push({
                clinic_id: activeClinicId,
                dow,
                start_time: mergedConfig.morningShift.start,
                end_time: mergedConfig.morningShift.end,
                is_open: true
              })
            }
            if (mergedConfig.afternoonShift.start < mergedConfig.afternoonShift.end) {
              blocks.push({
                clinic_id: activeClinicId,
                dow,
                start_time: mergedConfig.afternoonShift.start,
                end_time: mergedConfig.afternoonShift.end,
                is_open: true
              })
            }

            return blocks
          })

          const { error: deleteError } = await supabase
            .from('clinic_working_hours')
            .delete()
            .eq('clinic_id', activeClinicId)

          if (deleteError) {
            console.warn('No se pudieron limpiar horarios de clínica', deleteError)
            return
          }

          if (rows.length > 0) {
            const { error: insertError } = await supabase
              .from('clinic_working_hours')
              .insert(rows)
            if (insertError) {
              console.warn('No se pudieron guardar horarios de clínica', insertError)
            }
          }
        } catch (error) {
          console.warn('Error persistiendo clinic_working_hours', error)
        }
      })()
    },
    [activeClinicId, workingHours]
  )

  // Period config helper for calendar views
  const getPeriodConfig = useCallback(
    (period: 'full' | 'morning' | 'afternoon') => {
      switch (period) {
        case 'morning':
          return {
            startHour: parseInt(
              workingHours.morningShift.start.split(':')[0],
              10
            ),
            endHour: parseInt(workingHours.morningShift.end.split(':')[0], 10)
          }
        case 'afternoon':
          return {
            startHour: parseInt(
              workingHours.afternoonShift.start.split(':')[0],
              10
            ),
            endHour: parseInt(workingHours.afternoonShift.end.split(':')[0], 10)
          }
        case 'full':
        default:
          return {
            startHour: workingHours.defaultStartHour,
            endHour: workingHours.defaultEndHour
          }
      }
    },
    [workingHours]
  )

  // ====== CONTEXT VALUE ======
  const value = useMemo<ConfigurationContextType>(
    () => ({
      clinicInfo,
      updateClinicInfo,
      clinics,
      addClinic,
      updateClinic,
      deleteClinic,
      professionals,
      activeProfessionals,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      getProfessionalById,
      getProfessionalByName,
      professionalOptions,
      boxes,
      activeBoxes,
      addBox,
      updateBox,
      deleteBox,
      boxOptions,
      workingHours,
      updateWorkingHours,
      getPeriodConfig
    }),
    [
      clinicInfo,
      updateClinicInfo,
      clinics,
      addClinic,
      updateClinic,
      deleteClinic,
      professionals,
      activeProfessionals,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      getProfessionalById,
      getProfessionalByName,
      professionalOptions,
      boxes,
      activeBoxes,
      addBox,
      updateBox,
      deleteBox,
      boxOptions,
      workingHours,
      updateWorkingHours,
      getPeriodConfig
    ]
  )

  return (
    <ConfigurationContext.Provider value={value}>
      {children}
    </ConfigurationContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useConfiguration() {
  const context = useContext(ConfigurationContext)
  if (!context) {
    throw new Error(
      'useConfiguration must be used within a ConfigurationProvider'
    )
  }
  return context
}

// Export default for convenience
export default ConfigurationContext
