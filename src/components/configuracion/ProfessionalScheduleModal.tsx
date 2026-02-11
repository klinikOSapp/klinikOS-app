'use client'

import { AccessTimeFilledRounded, AddRounded, CloseRounded, ContentCopyRounded, DeleteRounded, CalendarMonthRounded } from '@/components/icons/md3'
import Portal from '@/components/ui/Portal'
import { DaySchedule, Professional, ScheduleBreak, TimeRange, WeekDay, WeeklySchedule, WEEKDAY_LABELS, WEEKDAYS_ORDER, professionalColorStyles, useConfiguration, ScheduleException, ScheduleExceptionType, EXCEPTION_TYPE_LABELS } from '@/context/ConfigurationContext'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

type Props = { open: boolean; onClose: () => void; professional: Professional | null }

const createEmptyDay = (): DaySchedule => ({ isWorking: false, shifts: [], breaks: [] })
const createWorkingDay = (): DaySchedule => ({ isWorking: true, shifts: [{ start: '09:00', end: '14:00' }], breaks: [] })

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 4) + 7, m = (i % 4) * 15
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}).filter((t) => { const h = parseInt(t.split(':')[0], 10); return h >= 7 && h <= 22 })

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-label-sm text-[var(--color-neutral-500)]'>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className='h-10 px-3 rounded-lg border border-neutral-300 bg-white text-body-sm outline-none'>
        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  )
}

function DayEditor({ day, schedule, onChange }: { day: WeekDay; schedule: DaySchedule; onChange: (s: DaySchedule) => void }) {
  const toggle = () => onChange(schedule.isWorking ? createEmptyDay() : createWorkingDay())
  const updateShift = (i: number, s: TimeRange) => { const arr = [...schedule.shifts]; arr[i] = s; onChange({ ...schedule, shifts: arr }) }
  const addShift = () => onChange({ ...schedule, shifts: [...schedule.shifts, { start: '15:00', end: '20:00' }] })
  const rmShift = (i: number) => onChange({ ...schedule, shifts: schedule.shifts.filter((_, x) => x !== i) })
  const addBreak = () => onChange({ ...schedule, breaks: [...schedule.breaks, { id: `b-${Date.now()}`, name: 'Pausa', start: '14:00', end: '15:00' }] })
  const rmBreak = (id: string) => onChange({ ...schedule, breaks: schedule.breaks.filter((b) => b.id !== id) })
  const updBreak = (u: ScheduleBreak) => onChange({ ...schedule, breaks: schedule.breaks.map((b) => b.id === u.id ? u : b) })
  return (
    <div className='border border-neutral-200 rounded-xl overflow-hidden'>
      <div className={`flex items-center justify-between px-4 py-3 ${schedule.isWorking ? 'bg-[var(--color-brand-50)]' : 'bg-[var(--color-neutral-100)]'}`}>
        <div className='flex items-center gap-3'>
          <button type='button' onClick={toggle} className={`relative w-12 h-6 rounded-full ${schedule.isWorking ? 'bg-[var(--color-brand-500)]' : 'bg-[var(--color-neutral-300)]'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${schedule.isWorking ? 'translate-x-6' : ''}`} />
          </button>
          <span className='text-body-md font-medium'>{WEEKDAY_LABELS[day]}</span>
        </div>
        {schedule.isWorking && schedule.shifts.length > 0 && <span className='text-body-sm text-neutral-600'>{schedule.shifts.map((s) => `${s.start}-${s.end}`).join(', ')}</span>}
      </div>
      {schedule.isWorking && (
        <div className='p-4 space-y-4'>
          <div className='space-y-3'>
            <p className='text-label-sm font-medium text-neutral-700'>Turnos</p>
            {schedule.shifts.map((sh, i) => (
              <div key={i} className='flex items-end gap-3'>
                <TimeSelect label='Inicio' value={sh.start} onChange={(v) => updateShift(i, { ...sh, start: v })} />
                <span className='pb-3 text-neutral-400'>—</span>
                <TimeSelect label='Fin' value={sh.end} onChange={(v) => updateShift(i, { ...sh, end: v })} />
                {schedule.shifts.length > 1 && <button type='button' onClick={() => rmShift(i)} className='p-2 text-red-500'><DeleteRounded className='size-5' /></button>}
              </div>
            ))}
            <button type='button' onClick={addShift} className='flex items-center gap-2 text-body-sm text-[var(--color-brand-600)]'><AddRounded className='size-4' />Añadir turno</button>
          </div>
          <div className='space-y-3 pt-3 border-t border-neutral-200'>
            <p className='text-label-sm font-medium text-neutral-700'>Pausas</p>
            {schedule.breaks.map((br) => (
              <div key={br.id} className='flex items-end gap-3 bg-neutral-50 p-3 rounded-lg'>
                <div className='flex flex-col gap-1 flex-1'>
                  <label className='text-label-sm text-neutral-500'>Nombre</label>
                  <input type='text' value={br.name} onChange={(e) => updBreak({ ...br, name: e.target.value })} className='h-10 px-3 rounded-lg border border-neutral-300 bg-white text-body-sm outline-none' />
                </div>
                <TimeSelect label='Desde' value={br.start} onChange={(v) => updBreak({ ...br, start: v })} />
                <TimeSelect label='Hasta' value={br.end} onChange={(v) => updBreak({ ...br, end: v })} />
                <button type='button' onClick={() => rmBreak(br.id)} className='p-2 text-red-500'><DeleteRounded className='size-5' /></button>
              </div>
            ))}
            <button type='button' onClick={addBreak} className='flex items-center gap-2 text-body-sm text-[var(--color-brand-600)]'><AddRounded className='size-4' />Añadir pausa</button>
          </div>
        </div>
      )}
    </div>
  )
}

const EXCEPTION_ICONS: Record<ScheduleExceptionType, string> = {
  vacation: 'beach_access',
  holiday: 'celebration',
  absence: 'person_off',
  special: 'edit_calendar'
}

const EXCEPTION_COLORS: Record<ScheduleExceptionType, { bg: string; text: string }> = {
  vacation: { bg: 'bg-blue-50', text: 'text-blue-600' },
  holiday: { bg: 'bg-purple-50', text: 'text-purple-600' },
  absence: { bg: 'bg-red-50', text: 'text-red-600' },
  special: { bg: 'bg-amber-50', text: 'text-amber-600' }
}

function ExceptionItem({ exception, onDelete }: { exception: ScheduleException; onDelete: () => void }) {
  const colors = EXCEPTION_COLORS[exception.type]
  const dateObj = new Date(exception.date)
  const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${colors.bg}`}>
      <div className='flex items-center gap-3'>
        <span className={`material-symbols-rounded text-xl ${colors.text}`}>{EXCEPTION_ICONS[exception.type]}</span>
        <div>
          <p className='text-body-sm font-medium text-neutral-800'>{dateStr}</p>
          <p className='text-label-sm text-neutral-600'>{EXCEPTION_TYPE_LABELS[exception.type]}{exception.reason ? ` - ${exception.reason}` : ''}</p>
        </div>
      </div>
      <button type='button' onClick={onDelete} className='p-1.5 hover:bg-white/50 rounded-lg'><DeleteRounded className='size-4 text-neutral-500' /></button>
    </div>
  )
}

function AddExceptionForm({ professionalId, onAdd, onCancel }: { professionalId: string; onAdd: (e: Omit<ScheduleException, 'id'>) => void; onCancel: () => void }) {
  const [date, setDate] = useState('')
  const [type, setType] = useState<ScheduleExceptionType>('vacation')
  const [reason, setReason] = useState('')
  const handleSubmit = () => {
    if (!date) return
    onAdd({ professionalId, date, type, reason: reason || undefined })
  }
  return (
    <div className='p-4 border border-neutral-200 rounded-xl space-y-4 bg-neutral-50'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1'>
          <label className='text-label-sm text-neutral-500'>Fecha</label>
          <input type='date' value={date} onChange={(e) => setDate(e.target.value)} className='h-10 px-3 rounded-lg border border-neutral-300 bg-white text-body-sm outline-none' />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-label-sm text-neutral-500'>Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as ScheduleExceptionType)} className='h-10 px-3 rounded-lg border border-neutral-300 bg-white text-body-sm outline-none'>
            {Object.entries(EXCEPTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className='flex flex-col gap-1'>
        <label className='text-label-sm text-neutral-500'>Motivo (opcional)</label>
        <input type='text' value={reason} onChange={(e) => setReason(e.target.value)} placeholder='Ej: Cita médica, congreso...' className='h-10 px-3 rounded-lg border border-neutral-300 bg-white text-body-sm outline-none' />
      </div>
      <div className='flex justify-end gap-2'>
        <button type='button' onClick={onCancel} className='px-4 py-2 text-body-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg'>Cancelar</button>
        <button type='button' onClick={handleSubmit} disabled={!date} className='px-4 py-2 text-body-sm font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg'>Añadir</button>
      </div>
    </div>
  )
}

function CopyDialog({ open, onClose, onSelect, profs, currentId }: { open: boolean; onClose: () => void; onSelect: (id: string) => void; profs: Professional[]; currentId: string }) {
  if (!open) return null
  const available = profs.filter((p) => p.id !== currentId)
  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/50'>
      <div className='bg-white rounded-xl w-[min(28rem,95vw)] max-h-[80vh] overflow-hidden'>
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
          <h3 className='text-title-md font-medium'>Copiar horario de...</h3>
          <button type='button' onClick={onClose} className='p-1 hover:bg-neutral-100 rounded-lg'><CloseRounded className='size-5' /></button>
        </div>
        <div className='p-4 max-h-[60vh] overflow-y-auto space-y-2'>
          {available.length === 0 ? <p className='text-center py-8 text-neutral-500'>No hay otros profesionales</p> : available.map((p) => (
            <button key={p.id} type='button' onClick={() => { onSelect(p.id); onClose() }} className='w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 text-left'>
              <div className='size-10 rounded-full flex items-center justify-center text-body-sm font-medium' style={{ backgroundColor: professionalColorStyles[p.colorTone]?.hex + '20', color: professionalColorStyles[p.colorTone]?.hex }}>
                {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div><p className='text-body-md font-medium'>{p.name}</p><p className='text-body-sm text-neutral-500'>{p.role}</p></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProfessionalScheduleModal({ open, onClose, professional }: Props) {
  const { professionalSchedules, scheduleTemplates, updateProfessionalSchedule, professionals, addScheduleException, removeScheduleException } = useConfiguration()
  const [local, setLocal] = useState<WeeklySchedule | null>(null)
  const [tplId, setTplId] = useState<string | null>(null)
  const [showCopy, setShowCopy] = useState(false)
  const [changed, setChanged] = useState(false)
  const [showAddException, setShowAddException] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedule' | 'exceptions'>('schedule')

  // Get current exceptions for this professional
  const currentExceptions = useMemo(() => {
    if (!professional) return []
    const schedule = professionalSchedules.find((s) => s.professionalId === professional.id)
    return schedule?.exceptions || []
  }, [professional, professionalSchedules])

  // Sort exceptions by date (upcoming first)
  const sortedExceptions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return [...currentExceptions].sort((a, b) => a.date.localeCompare(b.date)).filter((e) => e.date >= today)
  }, [currentExceptions])

  useEffect(() => {
    if (!open || !professional) { setLocal(null); setTplId(null); setChanged(false); setShowAddException(false); setActiveTab('schedule'); return }
    const ex = professionalSchedules.find((s) => s.professionalId === professional.id)
    if (ex) { setLocal(ex.weeklySchedule); setTplId(ex.appliedTemplateId || null) }
    else { const def = scheduleTemplates.find((t) => t.id === 'clinic-default'); if (def) { setLocal(def.weeklySchedule); setTplId('clinic-default') } }
  }, [open, professional, professionalSchedules, scheduleTemplates])

  const selectTpl = useCallback((id: string) => { const t = scheduleTemplates.find((x) => x.id === id); if (t) { setLocal(t.weeklySchedule); setTplId(id); setChanged(true) } }, [scheduleTemplates])
  const dayChange = useCallback((d: WeekDay, s: DaySchedule) => { setLocal((p) => p ? { ...p, [d]: s } : p); setTplId(null); setChanged(true) }, [])
  const copyFrom = useCallback((id: string) => { const src = professionalSchedules.find((s) => s.professionalId === id); if (src) { setLocal(src.weeklySchedule); setTplId(null); setChanged(true) } }, [professionalSchedules])
  const save = useCallback(() => { if (professional && local) { updateProfessionalSchedule(professional.id, local); onClose() } }, [professional, local, updateProfessionalSchedule, onClose])
  
  const handleAddException = useCallback((e: Omit<ScheduleException, 'id'>) => {
    addScheduleException(e)
    setShowAddException(false)
  }, [addScheduleException])
  
  const handleDeleteException = useCallback((exceptionId: string) => {
    removeScheduleException(exceptionId)
  }, [removeScheduleException])

  const summary = useMemo(() => {
    if (!local) return ''
    const w = WEEKDAYS_ORDER.filter((d) => local[d].isWorking)
    if (w.length === 0) return 'Sin horario'
    if (w.length === 5 && !local.saturday.isWorking && !local.sunday.isWorking) return 'Lunes a viernes'
    return w.map((d) => WEEKDAY_LABELS[d].slice(0, 3)).join(', ')
  }, [local])

  if (!open || !professional) return null

  return (
    <Portal>
      <div className='fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 py-8 overflow-y-auto' onClick={onClose}>
        <div className='relative w-[min(60rem,95vw)] my-auto bg-white rounded-xl shadow-xl' onClick={(e) => e.stopPropagation()}>
          <header className='border-b border-neutral-200'>
            <div className='flex items-center justify-between px-6 py-4'>
              <div className='flex items-center gap-3'>
                <div className='size-12 rounded-full flex items-center justify-center text-title-md font-medium' style={{ backgroundColor: professionalColorStyles[professional.colorTone]?.hex + '20', color: professionalColorStyles[professional.colorTone]?.hex }}>
                  {professional.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div><h2 className='text-title-md font-medium'>Horarios de {professional.name}</h2><p className='text-body-sm text-neutral-500'>{professional.role} • {summary}</p></div>
              </div>
              <button type='button' onClick={onClose} className='p-2 hover:bg-neutral-100 rounded-lg'><CloseRounded className='size-5' /></button>
            </div>
            <div className='flex px-6 gap-1'>
              <button type='button' onClick={() => setActiveTab('schedule')} className={`px-4 py-2.5 text-body-sm font-medium border-b-2 -mb-px ${activeTab === 'schedule' ? 'border-[var(--color-brand-500)] text-[var(--color-brand-600)]' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                <span className='flex items-center gap-2'><AccessTimeFilledRounded className='size-4' />Horario semanal</span>
              </button>
              <button type='button' onClick={() => setActiveTab('exceptions')} className={`px-4 py-2.5 text-body-sm font-medium border-b-2 -mb-px ${activeTab === 'exceptions' ? 'border-[var(--color-brand-500)] text-[var(--color-brand-600)]' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                <span className='flex items-center gap-2'><CalendarMonthRounded className='size-4' />Excepciones{sortedExceptions.length > 0 && <span className='px-1.5 py-0.5 text-label-xs bg-neutral-200 rounded-full'>{sortedExceptions.length}</span>}</span>
              </button>
            </div>
          </header>
          <div className='p-6 max-h-[calc(100vh-16rem)] overflow-y-auto'>
            {activeTab === 'schedule' ? (
              <>
                <div className='mb-6'>
                  <div className='flex items-center gap-2 mb-3'><AccessTimeFilledRounded className='size-5 text-[var(--color-brand-500)]' /><h3 className='text-body-md font-medium'>Plantillas rápidas</h3></div>
                  <div className='flex flex-wrap gap-2'>
                    {scheduleTemplates.map((t) => (
                      <button key={t.id} type='button' onClick={() => selectTpl(t.id)} className={`px-4 py-2 rounded-full text-body-sm font-medium ${tplId === t.id ? 'bg-[var(--color-brand-500)] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{t.name}</button>
                    ))}
                  </div>
                </div>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-body-md font-medium'>Horario semanal</h3>
                    <button type='button' onClick={() => setShowCopy(true)} className='flex items-center gap-2 px-3 py-1.5 text-body-sm text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] rounded-lg'><ContentCopyRounded className='size-4' />Copiar de otro</button>
                  </div>
                  {local && <div className='grid gap-4'>{WEEKDAYS_ORDER.map((d) => <DayEditor key={d} day={d} schedule={local[d]} onChange={(s) => dayChange(d, s)} />)}</div>}
                </div>
              </>
            ) : (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-body-md font-medium'>Excepciones de horario</h3>
                    <p className='text-body-sm text-neutral-500'>Vacaciones, festivos, ausencias y horarios especiales</p>
                  </div>
                  {!showAddException && (
                    <button type='button' onClick={() => setShowAddException(true)} className='flex items-center gap-2 px-4 py-2 text-body-sm font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] rounded-lg'>
                      <AddRounded className='size-4' />Añadir excepción
                    </button>
                  )}
                </div>
                {showAddException && professional && (
                  <AddExceptionForm professionalId={professional.id} onAdd={handleAddException} onCancel={() => setShowAddException(false)} />
                )}
                {sortedExceptions.length > 0 ? (
                  <div className='space-y-2'>
                    {sortedExceptions.map((e) => (
                      <ExceptionItem key={e.id} exception={e} onDelete={() => handleDeleteException(e.id)} />
                    ))}
                  </div>
                ) : !showAddException && (
                  <div className='text-center py-12'>
                    <CalendarMonthRounded className='size-12 text-neutral-300 mx-auto mb-3' />
                    <p className='text-body-md text-neutral-500'>No hay excepciones programadas</p>
                    <p className='text-body-sm text-neutral-400'>Añade vacaciones, festivos o ausencias</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <footer className='flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl'>
            <button type='button' onClick={onClose} className='px-6 py-2.5 text-body-md font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg'>{activeTab === 'schedule' ? 'Cancelar' : 'Cerrar'}</button>
            {activeTab === 'schedule' && (
              <button type='button' onClick={save} disabled={!changed} className='px-6 py-2.5 text-body-md font-medium text-white bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg'>Guardar horarios</button>
            )}
          </footer>
        </div>
      </div>
      <CopyDialog open={showCopy} onClose={() => setShowCopy(false)} onSelect={copyFrom} profs={professionals} currentId={professional.id} />
    </Portal>
  )
}
