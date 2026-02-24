'use client'

import { getSignedUrl, uploadStaffAvatar } from '@/lib/storage'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import CloseRounded from '@mui/icons-material/CloseRounded'
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import React from 'react'

type StaffProfile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  contact_info: Record<string, any> | null
}

type AccountPanelProps = {
  open: boolean
  onClose: () => void
  user: { id: string; email?: string | null } | null
  staff: StaffProfile | null
  onProfileUpdated?: (payload: {
    fullName: string
    avatarUrl?: string | null
    phone?: string | null
  }) => void
}

function resolveInitials(name?: string | null) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '—'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

export default function AccountPanel({
  open,
  onClose,
  user,
  staff,
  onProfileUpdated
}: AccountPanelProps) {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), [])
  const [fullName, setFullName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [avatarPath, setAvatarPath] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    setFullName(staff?.full_name ?? '')
    const contact = (staff?.contact_info ?? {}) as { phone?: string }
    setPhone(contact?.phone ?? '')
    setAvatarPath(staff?.avatar_url ?? null)

    async function loadAvatar() {
      if (staff?.avatar_url) {
        try {
          const signed = await getSignedUrl(staff.avatar_url)
          setAvatarUrl(signed)
        } catch {
          setAvatarUrl(null)
        }
      } else {
        setAvatarUrl(null)
      }
    }

    void loadAvatar()
  }, [open, staff])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setIsUploading(true)
    try {
      const { path } = await uploadStaffAvatar({ staffId: user.id, file })
      const signed = await getSignedUrl(path)
      setAvatarPath(path)
      setAvatarUrl(signed)
    } catch (error) {
      console.error('Error uploading avatar', error)
      alert('No se pudo subir el avatar. Intenta nuevamente.')
    } finally {
      setIsUploading(false)
      if (event.target) event.target.value = ''
    }
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      const payload = {
        id: user.id,
        full_name: fullName || null,
        avatar_url: avatarPath,
        contact_info: phone ? { phone } : null
      }
      const { error } = await supabase.from('staff').upsert(payload, { onConflict: 'id' })
      if (error) {
        throw error
      }
      onProfileUpdated?.({
        fullName: fullName || user.email || 'Usuario',
        avatarUrl: avatarPath,
        phone: phone || null
      })
      onClose()
    } catch (error) {
      console.error('Error saving profile', error)
      alert('No se pudieron guardar los cambios. Intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!open) return null

  const initials = resolveInitials(fullName || staff?.full_name || user?.email || '')

  return (
    <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-4'>
      <div className='relative w-[min(420px,100%)] rounded-2xl bg-white p-6 shadow-2xl'>
        <button
          type='button'
          onClick={onClose}
          className='absolute right-4 top-4 text-neutral-500 hover:text-neutral-800'
          aria-label='Cerrar panel de cuenta'
        >
          <CloseRounded className='size-5' />
        </button>
        <div className='flex flex-col gap-6'>
          <header className='flex flex-col gap-1'>
            <h2 className='text-title-md text-neutral-900'>Cuenta</h2>
            <p className='text-body-sm text-neutral-600'>Actualiza tu perfil y cierra sesión.</p>
          </header>
          <div className='flex items-center gap-4'>
            <div className='relative size-16 overflow-hidden rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-title-lg'>
              {avatarUrl ? (
                <img src={avatarUrl} alt='' className='size-full object-cover' />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className='flex flex-col gap-2 text-sm'>
              <button
                type='button'
                className='inline-flex items-center gap-2 text-brand-500 hover:text-brand-600'
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUploadRounded className='size-4' /> Cambiar avatar
              </button>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleFileChange}
              />
              {isUploading ? <span className='text-neutral-500 text-xs'>Subiendo...</span> : null}
            </div>
          </div>
          <label className='flex flex-col gap-2 text-sm text-neutral-700'>
            Nombre completo
            <input
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200'
              placeholder='Tu nombre'
            />
          </label>
          <label className='flex flex-col gap-2 text-sm text-neutral-700'>
            Teléfono
            <input
              type='tel'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className='rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200'
              placeholder='Número de contacto'
            />
          </label>
          <div className='flex flex-col gap-1 text-sm text-neutral-500'>
            <span>Correo</span>
            <span className='rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700'>
              {user?.email ?? '—'}
            </span>
          </div>
          <div className='flex flex-col gap-3 pt-2'>
            <button
              type='button'
              onClick={handleSave}
              disabled={isSaving}
              className='rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-brand-900 shadow-sm transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-70'
            >
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type='button'
              onClick={handleSignOut}
              className='inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50'
            >
              <LogoutRounded className='size-5' /> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
