import CallRounded from '@mui/icons-material/CallRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import MailRounded from '@mui/icons-material/MailRounded'
import MoreVertRounded from '@mui/icons-material/MoreVertRounded'
import React from 'react'
import AvatarImageDropdown from '@/components/pacientes/AvatarImageDropdown'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { uploadPatientFile, getSignedUrl } from '@/lib/storage'

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

const ALERT_SEVERITY_STYLES: Record<AlertSeverity, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' }
}

const ALERT_CATEGORY_LABELS: Record<string, string> = {
  allergy: 'Alergias',
  condition: 'Condiciones',
  habit: 'Hábitos',
  accessibility: 'Accesibilidad',
  general: 'Alertas'
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
      } else {
        setAlerts([])
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
      await supabase.from('patients').update({ avatar_url: path }).eq('id', patientId)
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
  const groupedAlerts = React.useMemo(() => {
    if (!alerts.length) return []
    const map = new Map<string, PatientAlert[]>()
    alerts.forEach((alert) => {
      const key = alert.category ?? 'general'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(alert)
    })
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items
    }))
  }, [alerts])

  return (
    <div
      className='relative bg-[#f8fafb] overflow-hidden w-[74.75rem] h-[56.25rem]'
      data-node-id='423:822'
    >
      <button
        type='button'
        aria-label='Cerrar'
        onClick={onClose}
        className='absolute size-[1.5rem] top-[1rem] cursor-pointer'
        data-name='close'
        data-node-id='410:779'
        style={{ left: 'calc(93.75% + 2.172rem)' }}
      >
        <CloseRounded className='size-6 text-[#24282c]' />
      </button>
      <div
        className='absolute content-stretch flex gap-[1.5rem] items-center left-[2rem] top-[3rem]'
        data-node-id='426:854'
      >
        <div className='relative shrink-0'>
          <div
            className='rounded-[12.5rem] size-[6rem] overflow-hidden bg-[var(--color-neutral-600)]'
            data-node-id='423:829'
          >
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
        <div
          className='content-stretch flex flex-col gap-[0.5rem] items-start relative shrink-0 w-[14.25rem]'
          data-node-id='426:853'
        >
          <p
            className="font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] min-w-full not-italic relative shrink-0 text-[#24282c] text-[1.5rem]"
            data-node-id='426:830'
            style={{ width: 'min-content' }}
          >
            {displayName}
          </p>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0 w-full'
            data-node-id='426:848'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='mail'
              data-node-id='426:837'
            >
              <MailRounded className='size-6 text-[#24282c]' />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
              data-node-id='426:831'
            >
              {email}
            </p>
          </div>
          <div
            className='content-stretch flex gap-[0.5rem] items-center relative shrink-0'
            data-node-id='426:849'
          >
            <div
              className='relative shrink-0 size-[1.5rem]'
              data-name='call'
              data-node-id='426:847'
            >
              <CallRounded className='size-6 text-[#24282c]' />
            </div>
            <p
              className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.5rem] not-italic relative shrink-0 text-[#24282c] text-[1rem] text-nowrap whitespace-pre"
              data-node-id='426:838'
            >
              {phone}
            </p>
          </div>
        </div>
      </div>
      <div
        className='absolute left-[2.25rem] top-[11.5rem] w-[70.5rem] border-t border-[#e2e7ea]'
        data-node-id='426:850'
      />
      <div
        className='absolute flex flex-col gap-[0.75rem] top-[3rem] w-[30.25rem]'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        <div className='flex flex-col gap-[0.5rem]'>
          {groupedAlerts.length === 0 ? (
            <div className='flex items-center gap-[0.5rem]'>
              <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] text-[#8a95a1] text-[0.75rem] whitespace-pre">
                Alergias:
              </p>
              <span className="font-['Inter:Regular',_sans-serif] text-[0.75rem] text-[#8a95a1]">
                Sin alertas registradas
              </span>
            </div>
          ) : (
            groupedAlerts.map(({ category, items }) => {
              const label = ALERT_CATEGORY_LABELS[category] ?? ALERT_CATEGORY_LABELS.general
              return (
                <div key={category} className='flex flex-wrap items-center gap-[0.5rem]'>
                  <p className="font-['Inter:Medium',_sans-serif] font-medium leading-[1rem] text-[#8a95a1] text-[0.75rem] whitespace-pre">
                    {label}:
                  </p>
                  {items.map((alert, idx) => {
                    const styles = ALERT_SEVERITY_STYLES[alert.severity] || ALERT_SEVERITY_STYLES.medium
                    return (
                      <div
                        key={`${category}-${alert.label}-${idx}`}
                        className={`flex items-center gap-[0.375rem] px-[0.5rem] py-[0.25rem] rounded-[6rem] ${styles.bg}`}
                      >
                        <span className={`inline-block size-2 rounded-full ${styles.dot}`} />
                        <span className={`font-['Inter:Medium',_sans-serif] text-[0.75rem] ${styles.text}`}>
                          {alert.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
        <div className='bg-[#e2e7ea] h-[3.5rem] overflow-clip rounded-[0.5rem]'>
          <p className="font-['Inter:Regular',_sans-serif] font-normal leading-[1rem] text-[#aeb8c2] text-[0.75rem] text-nowrap px-[0.5rem] pt-[0.5rem]">
            Añadir comentario sobre el paciente
          </p>
        </div>
      </div>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:864'
      >
        General
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[14rem] whitespace-pre"
        data-node-id='426:909'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[27rem] whitespace-pre"
        data-node-id='426:876'
      >
        Información adicional
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[2rem] left-[2rem] not-italic text-[#24282c] text-[1.5rem] text-nowrap top-[40rem] whitespace-pre"
        data-node-id='426:885'
      >
        Contacto de emergencia
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#8a95a1] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:868'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Edad
      </p>
      <p
        className='absolute font-["Inter:Medium",_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] top-[30rem] w-[11.813rem]'
        data-node-id='426:877'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Recomendado por:
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:870'
      >
        Fecha de nacimiento
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[17rem] whitespace-pre"
        data-node-id='426:911'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Estado
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[30rem] whitespace-pre"
        data-node-id='426:878'
      >
        Origen del cliente
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[43rem] whitespace-pre"
        data-node-id='426:887'
      >
        {emergencyName}
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:872'
      >
        DNI/NIE
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:912'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Motivo de la consulta
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:879'
      >
        Ocupación
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[21.5rem] whitespace-pre"
        data-node-id='426:874'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Pais
      </p>
      <p
        className="absolute font-['Inter:Medium',_sans-serif] font-medium leading-[1.5rem] left-[2rem] not-italic text-[#24282c] text-[1rem] text-nowrap top-[34.5rem] whitespace-pre"
        data-node-id='426:880'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Idioma de preferencia
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
        data-node-id='426:869'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        {ageText}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
        data-node-id='426:881'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        Sonia Pujante
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
        data-node-id='426:871'
      >
        {dobText}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[18.75rem] whitespace-pre"
        data-node-id='426:915'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Pre-registro
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[31.75rem] whitespace-pre"
        data-node-id='426:882'
      >
        Recomendación
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[44.75rem] whitespace-pre"
        data-node-id='426:891'
      >
        {emergencyEmail}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[46.25rem] whitespace-pre"
        data-node-id='426:894'
      >
        {emergencyPhone}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
        data-node-id='426:873'
      >
        {dni}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] top-[23.25rem] w-[30.25rem]"
        data-node-id='426:916'
        style={{ left: 'calc(43.75% + 0.797rem)' }}
      >
        Sufre de sensibilidad dental y necesita hacerse su limpieza bucal anual
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] left-[2rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
        data-node-id='426:883'
      >
        {occupation}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[23.25rem] whitespace-pre"
        data-node-id='426:875'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        {country}
      </p>
      <p
        className="absolute font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic text-[#535c66] text-[0.875rem] text-nowrap top-[36.25rem] whitespace-pre"
        data-node-id='426:884'
        style={{ left: 'calc(18.75% + 1.922rem)' }}
      >
        {preferredLanguage}
      </p>
      <div
        className='absolute bg-[#f8fafb] box-border content-stretch flex gap-[0.5rem] items-center justify-center px-[0.5rem] py-[0.25rem] rounded-[1rem] top-[14.125rem]'
        data-name='Remember - Button'
        data-node-id='426:905'
        style={{ left: 'calc(87.5% + 1.906rem)' }}
      >
        <div
          aria-hidden='true'
          className='absolute border border-[#51d6c7] border-solid inset-0 pointer-events-none rounded-[1rem]'
        />
        <p
          className="font-['Inter:Regular',_sans-serif] font-normal leading-[1.25rem] not-italic relative shrink-0 text-[#1e4947] text-[0.875rem] text-nowrap whitespace-pre"
          data-node-id='I426:905;236:963'
        >
          Editar
        </p>
      </div>
      <div
        className='absolute size-[1.5rem] top-[14.25rem]'
        data-name='more_vert'
        data-node-id='426:923'
        style={{ left: 'calc(93.75% + 1.172rem)' }}
      >
        <MoreVertRounded className='size-6 text-[#24282c]' />
      </div>
    </div>
  )
}


