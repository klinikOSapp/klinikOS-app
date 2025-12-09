'use client'

import CallRounded from '@mui/icons-material/CallRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import MailRounded from '@mui/icons-material/MailRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import React from 'react'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { uploadPatientFile, getSignedUrl } from '@/lib/storage'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className='space-y-3'>
      <h3 className='text-xl font-medium text-[#24282c]'>{title}</h3>
      {children}
    </div>
  )
}

type ClientSummaryProps = {
  onClose?: () => void
  patientId?: string
}

type AlertSeverity = 'low' | 'medium' | 'high'

type PatientAlert = {
  label: string
  severity: AlertSeverity
  category?: string | null
  description?: string | null
}

const ALERT_CATEGORY_LABELS: Record<string, string> = {
  allergy: 'Alergias',
  accessibility: 'Accesibilidad',
  habit: 'Hábitos',
  general: 'General'
}
const ALERT_CATEGORIES = ['allergy', 'accessibility', 'habit'] as const

const CATEGORY_CHIP_COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  allergy: { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' }, // red
  accessibility: { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' }, // amber/yellow
  habit: { bg: '#FFEDD5', text: '#C2410C', border: '#FDBA74' } // orange
}

export default function ClientSummary({ onClose, patientId }: ClientSummaryProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [displayName, setDisplayName] = React.useState<string>('—')
  const [email, setEmail] = React.useState<string>('—')
  const [phone, setPhone] = React.useState<string>('—')
  const [dni, setDni] = React.useState<string>('—')
  const [country, setCountry] = React.useState<string>('—')
  const [preferredLanguage, setPreferredLanguage] = React.useState<string>('—')
  const [occupation, setOccupation] = React.useState<string>('—')
  const [dobText, setDobText] = React.useState<string>('—')
  const [ageText, setAgeText] = React.useState<string>('—')
  const [alerts, setAlerts] = React.useState<PatientAlert[]>([])
  const [emergencyName, setEmergencyName] = React.useState<string>('—')
  const [emergencyEmail, setEmergencyEmail] = React.useState<string>('—')
  const [emergencyPhone, setEmergencyPhone] = React.useState<string>('—')
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [alertTagsByCat, setAlertTagsByCat] = React.useState<Record<string, string[]>>({
    allergy: [],
    accessibility: [],
    habit: []
  })
  const [activeAlertCat, setActiveAlertCat] = React.useState<(typeof ALERT_CATEGORIES)[number]>('allergy')
  const [pendingAlertInput, setPendingAlertInput] = React.useState('')
  const initialAlertsRef = React.useRef<Record<string, string[]>>({
    allergy: [],
    accessibility: [],
    habit: []
  })
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    country: '',
    preferredLanguage: '',
    occupation: '',
    emergencyName: '',
    emergencyEmail: '',
    emergencyPhone: ''
  })

  React.useEffect(() => {
    async function load() {
      if (!patientId) return
      // Patient core data
      const { data: p } = await supabase
        .from('patients')
        .select(
          'first_name, last_name, email, phone_number, national_id, address_country, preferred_language, occupation, date_of_birth, avatar_url, emergency_contact_name, emergency_contact_email, emergency_contact_phone, primary_contact_id'
        )
        .eq('id', patientId)
        .maybeSingle()
      
      // Also fetch primary contact info from contacts table (new schema)
      let primaryContact: { full_name?: string; phone_primary?: string; email?: string; address_country?: string } | null = null
      if (p?.primary_contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('full_name, phone_primary, phone_alt, email, address_country')
          .eq('id', p.primary_contact_id)
          .maybeSingle()
        primaryContact = contact
      }
      
      if (p) {
        setDisplayName(
          [p.first_name, p.last_name].filter(Boolean).join(' ') || '—'
        )
        // Prefer contact table data, fallback to patient table (legacy)
        setEmail(primaryContact?.email ?? p.email ?? '—')
        setPhone(primaryContact?.phone_primary ?? p.phone_number ?? '—')
        setDni(p.national_id ?? '—')
        setCountry(primaryContact?.address_country ?? p.address_country ?? '—')
        setPreferredLanguage(p.preferred_language ?? '—')
        setOccupation(p.occupation ?? '—')
        setEmergencyName(p.emergency_contact_name ?? '—')
        setEmergencyEmail(p.emergency_contact_email ?? '—')
        setEmergencyPhone(p.emergency_contact_phone ?? '—')
        setForm({
          firstName: p.first_name ?? '',
          lastName: p.last_name ?? '',
          email: primaryContact?.email ?? p.email ?? '',
          phone: primaryContact?.phone_primary ?? p.phone_number ?? '',
          nationalId: p.national_id ?? '',
          country: primaryContact?.address_country ?? p.address_country ?? '',
          preferredLanguage: p.preferred_language ?? '',
          occupation: p.occupation ?? '',
          emergencyName: p.emergency_contact_name ?? '',
          emergencyEmail: p.emergency_contact_email ?? '',
          emergencyPhone: p.emergency_contact_phone ?? ''
        })
        if (p.avatar_url) {
          try {
            const signed = await getSignedUrl(p.avatar_url)
            setAvatarPreviewUrl(signed)
          } catch {
            // ignore signed url errors
          }
        }
        if (p.date_of_birth) {
          const d = new Date(p.date_of_birth)
          setDobText(
            `${String(d.getDate()).padStart(2, '0')}/${String(
              d.getMonth() + 1
            ).padStart(2, '0')}/${d.getFullYear()}`
          )
          const now = new Date()
          let age = now.getFullYear() - d.getFullYear()
          const m = now.getMonth() - d.getMonth()
          if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
          setAgeText(`${age} años`)
        }
      }
      // Medical alerts (allergies, chronic conditions, etc.)
      const { data: alertRows } = await supabase
        .from('patient_medical_alerts')
        .select('alert_type, description, severity, category, is_critical')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (Array.isArray(alertRows)) {
        const normalized = alertRows
          .map((row: any) => {
            const rawSeverity: string | null = row?.severity ?? null
            let severity: AlertSeverity
            if (rawSeverity === 'low' || rawSeverity === 'medium' || rawSeverity === 'high') {
              severity = rawSeverity
            } else {
              severity = row?.is_critical ? 'high' : 'medium'
            }
            const label = row?.alert_type || row?.description || 'Alerta'
            return {
              label,
              severity,
              category: row?.category ?? null,
              description: row?.description ?? null
            } satisfies PatientAlert
          })
          .filter(Boolean)
        setAlerts(normalized)
        const grouped: Record<string, string[]> = {
          allergy: [],
          accessibility: [],
          habit: []
        }
        normalized.forEach((a) => {
          const cat = (a.category as string) || 'allergy'
          const key = ALERT_CATEGORIES.includes(cat as any) ? cat : 'allergy'
          if (a.label) grouped[key].push(a.label)
        })
        setAlertTagsByCat(grouped)
        initialAlertsRef.current = grouped
      } else {
        setAlerts([])
        const empty = { allergy: [], accessibility: [], habit: [] }
        setAlertTagsByCat(empty)
        initialAlertsRef.current = empty
      }
    }
    void load()
  }, [patientId, supabase])
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(
    null
  )
  const lastUrlRef = React.useRef<string | null>(null)

  const setPreviewFromFile = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    lastUrlRef.current = url
    setAvatarPreviewUrl(url)
  }, [])

  const saveAvatar = React.useCallback(
    async (file: File) => {
      if (!patientId) return
      const { path } = await uploadPatientFile({
        patientId,
        file,
        kind: 'avatar'
      })
      await fetch('/api/patients/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          patient: { avatar_url: path }
        })
      })
      try {
        const signed = await getSignedUrl(path)
        setAvatarPreviewUrl(signed)
      } catch {
        // ignore
      }
    },
    [patientId, supabase, setAvatarPreviewUrl]
  )

  React.useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current)
    }
  }, [])

  const AlertRow = ({
    cat,
    label
  }: {
    cat: (typeof ALERT_CATEGORIES)[number]
    label: string
  }) => {
    const items = alertTagsByCat[cat] ?? []
    const colors = CATEGORY_CHIP_COLORS[cat]
    return (
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <span className='text-xs font-medium text-[#8a95a1]'>{label}:</span>
        {items.length === 0 ? (
          <span className='text-xs text-[#c1c7d0]'>Sin alertas</span>
        ) : (
          items.map((tag, idx) => (
            <span
              key={`${cat}-${tag}-${idx}`}
              className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs'
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: colors.border ? `1px solid ${colors.border}` : undefined
              }}
            >
              <span
                className='inline-block size-2 rounded-full'
                style={{ backgroundColor: colors.text, opacity: 0.7 }}
              />
              <span className='leading-tight'>{tag}</span>
            </span>
          ))
        )}
      </div>
    )
  }

  return (
    <div
      className='relative bg-[#f8fafb] overflow-hidden w-full h-full p-6'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-[1.5rem] top-[1rem] right-[1rem] cursor-pointer'
        data-name='close'
        data-node-id='410:779'
      >
        <CloseRounded className='size-6 text-[#24282c]' />
      </button>
      <div className='flex flex-col gap-6 h-full overflow-auto'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-wrap items-start gap-6 justify-between'>
            <div className='flex items-center gap-4 min-w-[20rem]'>
              <div className='relative shrink-0'>
                <div className='rounded-[12.5rem] size-[6rem] overflow-hidden bg-[var(--color-neutral-600)]'>
                  {avatarPreviewUrl ? (
                    <img
                      src={avatarPreviewUrl}
                      alt=''
                      className='w-full h-full object-cover'
                      loading='lazy'
                    />
                  ) : null}
                </div>
                <div className='absolute -bottom-1 -right-1'>
                  <AvatarImageDropdown
                    previewUrl={avatarPreviewUrl ?? undefined}
                    onCaptureFromCamera={async (f) => {
                      setPreviewFromFile(f)
                      await saveAvatar(f)
                    }}
                    onUploadFromDevice={async (f) => {
                      setPreviewFromFile(f)
                      await saveAvatar(f)
                    }}
                  />
                </div>
              </div>
              <div className='flex flex-col gap-2'>
                <p className='text-2xl font-medium text-[#24282c]'>{displayName}</p>
                <div className='flex items-center gap-2 text-[#24282c]'>
                  <MailRounded className='size-5' />
                  <span className='text-sm'>{email}</span>
                </div>
                <div className='flex items-center gap-2 text-[#24282c]'>
                  <CallRounded className='size-5' />
                  <span className='text-sm'>{phone}</span>
                </div>
              </div>
            </div>

            <div className='flex-1 min-w-[22rem] flex flex-col gap-2'>
              <AlertRow cat='allergy' label='Alergias' />
              <AlertRow cat='accessibility' label='Accesibilidad' />
              <AlertRow cat='habit' label='Hábitos' />
              <div className='bg-[#e2e7ea] rounded-lg px-3 py-2 text-sm text-[#aeb8c2]'>
                Añadir comentario sobre el paciente
              </div>
            </div>

            <div className='flex items-center gap-3 self-start'>
              <Button
                variant='outlined'
                size='small'
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              <MoreVertRounded className='size-6 text-[#24282c]' />
            </div>
          </div>
        </div>

        <hr className='border-[#e1e7ec]' />

        <div className='grid gap-10'>
          <div className='grid md:grid-cols-2 gap-10'>
            <Section title='General'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#535c66]'>
                <LabelValue label='Fecha de nacimiento' value={dobText} />
                <LabelValue label='Edad' value={ageText} />
                <LabelValue label='DNI/NIE' value={dni} />
                <LabelValue label='País' value={country} />
              </div>
            </Section>

            <Section title='Consulta'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#535c66]'>
                <LabelValue label='Estado' value='Pre-registro' />
                <LabelValue label='Motivo de la consulta' value='—' />
              </div>
            </Section>
          </div>

          <div className='grid md:grid-cols-2 gap-10'>
            <Section title='Información adicional'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#535c66]'>
                <LabelValue label='Origen del cliente' value='Recomendación' />
                <LabelValue label='Recomendado por' value='Sonia Pujante' />
                <LabelValue label='Ocupación' value={occupation} />
                <LabelValue label='Idioma de preferencia' value={preferredLanguage} />
              </div>
            </Section>

            <Section title='Contacto de emergencia'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#535c66]'>
                <LabelValue label='Nombre' value={emergencyName} />
                <LabelValue label='Email' value={emergencyEmail} />
                <LabelValue label='Teléfono' value={emergencyPhone} />
              </div>
            </Section>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className='absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-6'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium text-[#24282c]'>Editar datos del paciente</h3>
              <button onClick={() => setIsEditing(false)} aria-label='Cerrar'>
                <CloseRounded className='size-5 text-[#24282c]' />
              </button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <TextField
                label='Nombre'
                size='small'
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
              <TextField
                label='Apellidos'
                size='small'
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
              <TextField
                label='Email'
                size='small'
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <TextField
                label='Teléfono'
                size='small'
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextField
                label='DNI/NIE'
                size='small'
                value={form.nationalId}
                onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
              />
              <TextField
                label='País'
                size='small'
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              />
              <TextField
                label='Idioma preferido'
                size='small'
                value={form.preferredLanguage}
                onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value }))}
              />
              <TextField
                label='Ocupación'
                size='small'
                value={form.occupation}
                onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
              />
              <TextField
                label='Contacto emergencia - Nombre'
                size='small'
                value={form.emergencyName}
                onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))}
              />
              <TextField
                label='Contacto emergencia - Email'
                size='small'
                value={form.emergencyEmail}
                onChange={(e) => setForm((f) => ({ ...f, emergencyEmail: e.target.value }))}
              />
              <TextField
                label='Contacto emergencia - Teléfono'
                size='small'
                value={form.emergencyPhone}
                onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
              />
            </div>
            <div className='space-y-2'>
              <p className='text-sm font-medium text-[#24282c]'>Alertas</p>
              <div className='flex items-center gap-2 flex-wrap'>
                {ALERT_CATEGORIES.map((cat) => {
                  const label = ALERT_CATEGORY_LABELS[cat]
                  const isActive = activeAlertCat === cat
                  return (
                    <button
                      key={cat}
                      type='button'
                      onClick={() => setActiveAlertCat(cat)}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        isActive
                          ? 'bg-[#1e4947] text-white border-[#1e4947]'
                          : 'bg-white text-[#1e4947] border-[#1e4947]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              <div className='flex flex-wrap gap-2'>
                {(alertTagsByCat[activeAlertCat] ?? []).map((tag) => (
                  <Chip
                    key={`${activeAlertCat}-${tag}`}
                    label={tag}
                    onDelete={() =>
                      setAlertTagsByCat((prev) => ({
                        ...prev,
                        [activeAlertCat]: prev[activeAlertCat].filter((t) => t !== tag)
                      }))
                    }
                    variant='outlined'
                    className='!text-sm'
                    sx={{
                      backgroundColor: CATEGORY_CHIP_COLORS[activeAlertCat].bg,
                      color: CATEGORY_CHIP_COLORS[activeAlertCat].text,
                      borderColor: CATEGORY_CHIP_COLORS[activeAlertCat].border
                    }}
                  />
                ))}
              </div>
              <TextField
                label='Añadir alerta (separa con coma o Enter)'
                size='small'
                value={pendingAlertInput}
                onChange={(e) => setPendingAlertInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    const value = pendingAlertInput.trim().replace(/,$/, '')
                    if (value) {
                      setAlertTagsByCat((prev) => {
                        const exists = prev[activeAlertCat]?.includes(value)
                        if (exists) return prev
                        return {
                          ...prev,
                          [activeAlertCat]: [...(prev[activeAlertCat] ?? []), value]
                        }
                      })
                    }
                    setPendingAlertInput('')
                  }
                }}
                placeholder='Ej: penicilina, latex, embarazo'
                fullWidth
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                onClick={() => {
                  setIsEditing(false)
                  setAlertTagsByCat(initialAlertsRef.current)
                  setPendingAlertInput('')
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant='contained'
                onClick={async () => {
                  if (!patientId) return
                  setIsSaving(true)
                  const alertsPayload = Object.entries(alertTagsByCat).flatMap(([cat, values]) =>
                    values.map((label) => ({
                      label,
                      category: cat
                    }))
                  )

                  const res = await fetch('/api/patients/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      patientId,
                      patient: {
                        first_name: form.firstName || null,
                        last_name: form.lastName || null,
                        email: form.email || null,
                        phone_number: form.phone || null,
                        national_id: form.nationalId || null,
                        address_country: form.country || null,
                        preferred_language: form.preferredLanguage || null,
                        occupation: form.occupation || null,
                        emergency_contact_name: form.emergencyName || null,
                        emergency_contact_email: form.emergencyEmail || null,
                        emergency_contact_phone: form.emergencyPhone || null
                      },
                      alerts: alertsPayload
                    })
                  })

                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    console.error(data?.error || 'No se pudo guardar el paciente')
                    setIsSaving(false)
                    return
                  }

                  // Update local state with saved values
                  setDisplayName([form.firstName, form.lastName].filter(Boolean).join(' ') || '—')
                  setEmail(form.email || '—')
                  setPhone(form.phone || '—')
                  setDni(form.nationalId || '—')
                  setCountry(form.country || '—')
                  setPreferredLanguage(form.preferredLanguage || '—')
                  setOccupation(form.occupation || '—')
                  setEmergencyName(form.emergencyName || '—')
                  setEmergencyEmail(form.emergencyEmail || '—')
                  setEmergencyPhone(form.emergencyPhone || '—')
                  const newAlerts = Object.entries(alertTagsByCat).flatMap(([cat, values]) =>
                    values.map(
                      (label) =>
                        ({
                          label,
                          severity: 'medium',
                          category: cat
                        } as PatientAlert)
                    )
                  )
                  setAlerts(newAlerts)
                  initialAlertsRef.current = { ...alertTagsByCat }
                  setIsSaving(false)
                  setIsEditing(false)
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-xs font-medium text-[#8a95a1]'>{label}</span>
      <span className='text-sm text-[#535c66]'>{value || '—'}</span>
    </div>
  )
}


