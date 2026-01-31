/**
 * HU-024: Patient Alerts Panel
 * Display and manage personalized patient alerts
 */
'use client'

import React from 'react'
import {
  AddRounded,
  CloseRounded,
  DeleteRounded,
  EditRounded,
  LocalHospitalRounded,
  NotificationsActiveRounded,
  WarningRounded
} from '@/components/icons/md3'
import { MD3Icon } from '@/components/icons/MD3Icon'
import {
  type PatientAlert,
  type PatientAlertType,
  type PatientAlertPriority,
  getAlertPriorityColor,
  getAlertTypeLabel,
  getAlertPriorityLabel
} from '@/context/PatientsContext'
import {
  SelectInput,
  TextArea
} from '@/components/pacientes/modals/add-patient/AddPatientInputs'

type PatientAlertsPanelProps = {
  alerts: PatientAlert[]
  onAddAlert?: (alert: Omit<PatientAlert, 'id' | 'createdAt'>) => void
  onUpdateAlert?: (id: string, alert: Partial<PatientAlert>) => void
  onDeleteAlert?: (id: string) => void
  onDismissAlert?: (id: string) => void
  readOnly?: boolean
}

// Priority badge colors
const PRIORITY_STYLES: Record<PatientAlertPriority, string> = {
  low: 'bg-info-100 text-info-700 border-info-200',
  medium: 'bg-warning-100 text-warning-700 border-warning-200',
  high: 'bg-error-100 text-error-700 border-error-200',
  critical: 'bg-error-200 text-error-800 border-error-400'
}

// Type badge colors
const TYPE_STYLES: Record<PatientAlertType, string> = {
  medical: 'bg-red-100 text-red-700',
  financial: 'bg-amber-100 text-amber-700',
  administrative: 'bg-blue-100 text-blue-700',
  recall: 'bg-purple-100 text-purple-700',
  custom: 'bg-neutral-100 text-neutral-700'
}

// Alert type icon mapping
function AlertTypeIcon({ type }: { type: PatientAlertType }) {
  switch (type) {
    case 'medical':
      return <LocalHospitalRounded className='size-5' />
    case 'recall':
      return <NotificationsActiveRounded className='size-5' />
    default:
      return <WarningRounded className='size-5' />
  }
}

// Single alert card
function AlertCard({
  alert,
  onEdit,
  onDelete,
  onDismiss,
  readOnly
}: {
  alert: PatientAlert
  onEdit?: () => void
  onDelete?: () => void
  onDismiss?: () => void
  readOnly?: boolean
}) {
  const isExpired = alert.expiresAt && new Date(alert.expiresAt) < new Date()
  
  return (
    <div
      className={`p-4 rounded-lg border ${
        !alert.isActive || isExpired
          ? 'bg-neutral-50 border-neutral-200 opacity-60'
          : `border-l-4 ${
              alert.priority === 'critical'
                ? 'border-l-error-600 bg-error-50 border-error-200'
                : alert.priority === 'high'
                  ? 'border-l-error-400 bg-error-50 border-error-100'
                  : alert.priority === 'medium'
                    ? 'border-l-warning-400 bg-warning-50 border-warning-100'
                    : 'border-l-info-400 bg-info-50 border-info-100'
            }`
      }`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          {/* Type icon */}
          <div className={`p-2 rounded-full ${TYPE_STYLES[alert.type]}`}>
            <AlertTypeIcon type={alert.type} />
          </div>
          
          {/* Content */}
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <h4 className='text-body-md font-medium text-neutral-900'>
                {alert.title}
              </h4>
              {/* Priority badge */}
              <span className={`px-2 py-0.5 rounded-full text-label-sm font-medium border ${PRIORITY_STYLES[alert.priority]}`}>
                {getAlertPriorityLabel(alert.priority)}
              </span>
              {/* Type badge */}
              <span className={`px-2 py-0.5 rounded-full text-label-sm ${TYPE_STYLES[alert.type]}`}>
                {getAlertTypeLabel(alert.type)}
              </span>
            </div>
            <p className='text-body-sm text-neutral-700'>{alert.message}</p>
            
            {/* Meta info */}
            <div className='flex items-center gap-4 mt-2'>
              {alert.showOnOpen && (
                <span className='text-label-sm text-neutral-500 flex items-center gap-1'>
                  <MD3Icon name='VisibilityRounded' size='sm' />
                  Al abrir ficha
                </span>
              )}
              {alert.showInAppointment && (
                <span className='text-label-sm text-neutral-500 flex items-center gap-1'>
                  <MD3Icon name='EventRounded' size='sm' />
                  En citas
                </span>
              )}
              {alert.expiresAt && (
                <span className={`text-label-sm ${isExpired ? 'text-error-600' : 'text-neutral-500'}`}>
                  {isExpired ? 'Expirada' : `Expira: ${new Date(alert.expiresAt).toLocaleDateString('es-ES')}`}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        {!readOnly && (
          <div className='flex items-center gap-1'>
            {onDismiss && alert.isActive && (
              <button
                type='button'
                onClick={onDismiss}
                className='p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors'
                title='Descartar temporalmente'
              >
                <CloseRounded className='size-4' />
              </button>
            )}
            {onEdit && (
              <button
                type='button'
                onClick={onEdit}
                className='p-1.5 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors'
                title='Editar alerta'
              >
                <EditRounded className='size-4' />
              </button>
            )}
            {onDelete && (
              <button
                type='button'
                onClick={onDelete}
                className='p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded transition-colors'
                title='Eliminar alerta'
              >
                <DeleteRounded className='size-4' />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Create/Edit alert form
function AlertForm({
  alert,
  onSave,
  onCancel
}: {
  alert?: PatientAlert
  onSave: (data: Omit<PatientAlert, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [type, setType] = React.useState<PatientAlertType>(alert?.type || 'custom')
  const [priority, setPriority] = React.useState<PatientAlertPriority>(alert?.priority || 'medium')
  const [title, setTitle] = React.useState(alert?.title || '')
  const [message, setMessage] = React.useState(alert?.message || '')
  const [showOnOpen, setShowOnOpen] = React.useState(alert?.showOnOpen ?? true)
  const [showInAppointment, setShowInAppointment] = React.useState(alert?.showInAppointment ?? true)
  const [hasExpiry, setHasExpiry] = React.useState(!!alert?.expiresAt)
  const [expiresAt, setExpiresAt] = React.useState(alert?.expiresAt || '')

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) return
    
    onSave({
      type,
      priority,
      title: title.trim(),
      message: message.trim(),
      isActive: true,
      showOnOpen,
      showInAppointment,
      expiresAt: hasExpiry && expiresAt ? expiresAt : undefined
    })
  }

  return (
    <div className='p-4 bg-neutral-50 rounded-lg border border-neutral-200'>
      <h4 className='text-body-md font-medium text-neutral-900 mb-4'>
        {alert ? 'Editar alerta' : 'Nueva alerta'}
      </h4>
      
      <div className='space-y-4'>
        {/* Type and Priority row */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='text-body-sm text-neutral-700 mb-1 block'>Tipo</label>
            <SelectInput
              value={type}
              onChange={(v) => setType(v as PatientAlertType)}
              options={[
                { value: 'medical', label: 'Médica' },
                { value: 'financial', label: 'Financiera' },
                { value: 'administrative', label: 'Administrativa' },
                { value: 'recall', label: 'Seguimiento' },
                { value: 'custom', label: 'Personalizada' }
              ]}
            />
          </div>
          <div>
            <label className='text-body-sm text-neutral-700 mb-1 block'>Prioridad</label>
            <SelectInput
              value={priority}
              onChange={(v) => setPriority(v as PatientAlertPriority)}
              options={[
                { value: 'low', label: 'Baja' },
                { value: 'medium', label: 'Media' },
                { value: 'high', label: 'Alta' },
                { value: 'critical', label: 'Crítica' }
              ]}
            />
          </div>
        </div>
        
        {/* Title */}
        <div>
          <label className='text-body-sm text-neutral-700 mb-1 block'>Título *</label>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Título de la alerta'
            className='w-full h-12 rounded-[0.5rem] bg-white border border-neutral-300 px-3 text-body-md text-neutral-900 placeholder-neutral-400 outline-none focus:border-brand-500'
          />
        </div>
        
        {/* Message */}
        <div>
          <label className='text-body-sm text-neutral-700 mb-1 block'>Mensaje *</label>
          <TextArea
            value={message}
            onChange={setMessage}
            placeholder='Descripción detallada de la alerta...'
          />
        </div>
        
        {/* Display options */}
        <div className='flex flex-wrap gap-4'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={showOnOpen}
              onChange={(e) => setShowOnOpen(e.target.checked)}
              className='h-4 w-4 rounded border-neutral-300 accent-brand-500'
            />
            <span className='text-body-sm text-neutral-700'>Mostrar al abrir ficha</span>
          </label>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={showInAppointment}
              onChange={(e) => setShowInAppointment(e.target.checked)}
              className='h-4 w-4 rounded border-neutral-300 accent-brand-500'
            />
            <span className='text-body-sm text-neutral-700'>Mostrar al gestionar citas</span>
          </label>
        </div>
        
        {/* Expiry */}
        <div className='flex items-center gap-4'>
          <label className='flex items-center gap-2 cursor-pointer'>
            <input
              type='checkbox'
              checked={hasExpiry}
              onChange={(e) => setHasExpiry(e.target.checked)}
              className='h-4 w-4 rounded border-neutral-300 accent-brand-500'
            />
            <span className='text-body-sm text-neutral-700'>Establecer fecha de expiración</span>
          </label>
          {hasExpiry && (
            <input
              type='date'
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className='h-10 rounded-[0.5rem] bg-white border border-neutral-300 px-3 text-body-sm text-neutral-900 outline-none focus:border-brand-500'
            />
          )}
        </div>
        
        {/* Actions */}
        <div className='flex justify-end gap-3 pt-2'>
          <button
            type='button'
            onClick={onCancel}
            className='px-4 py-2 rounded-full border border-neutral-300 text-body-sm text-neutral-700 hover:bg-neutral-100 transition-colors'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={!title.trim() || !message.trim()}
            className='px-4 py-2 rounded-full bg-brand-500 text-body-sm font-medium text-brand-900 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {alert ? 'Guardar cambios' : 'Crear alerta'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PatientAlertsPanel({
  alerts,
  onAddAlert,
  onUpdateAlert,
  onDeleteAlert,
  onDismissAlert,
  readOnly = false
}: PatientAlertsPanelProps) {
  const [showForm, setShowForm] = React.useState(false)
  const [editingAlert, setEditingAlert] = React.useState<PatientAlert | null>(null)

  // Sort alerts: active first, then by priority (critical > high > medium > low)
  const sortedAlerts = React.useMemo(() => {
    const priorityOrder: Record<PatientAlertPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    }
    
    return [...alerts].sort((a, b) => {
      // Active alerts first
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      // Then by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [alerts])

  const activeAlerts = sortedAlerts.filter(a => a.isActive)
  const inactiveAlerts = sortedAlerts.filter(a => !a.isActive)

  const handleSaveAlert = (data: Omit<PatientAlert, 'id' | 'createdAt'>) => {
    if (editingAlert) {
      onUpdateAlert?.(editingAlert.id, data)
    } else {
      onAddAlert?.(data)
    }
    setShowForm(false)
    setEditingAlert(null)
  }

  const handleEditAlert = (alert: PatientAlert) => {
    setEditingAlert(alert)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingAlert(null)
  }

  return (
    <div className='w-full h-full bg-neutral-50 flex flex-col p-8 overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <p className='font-inter text-headline-sm text-neutral-900'>
            Alertas del paciente
          </p>
          <p className='text-body-sm text-neutral-600 mt-1'>
            Configura alertas personalizadas que aparecerán al gestionar este paciente.
          </p>
        </div>
        {!readOnly && !showForm && (
          <button
            type='button'
            onClick={() => setShowForm(true)}
            className='flex items-center gap-2 rounded-full px-4 py-2 text-body-md text-neutral-900 bg-white border border-neutral-300 hover:bg-brand-50 hover:border-brand-300 transition-colors'
          >
            <AddRounded className='size-5' />
            <span className='font-medium'>Nueva alerta</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto space-y-4'>
        {/* Form */}
        {showForm && (
          <AlertForm
            alert={editingAlert || undefined}
            onSave={handleSaveAlert}
            onCancel={handleCancel}
          />
        )}

        {/* Active alerts */}
        {activeAlerts.length > 0 && (
          <div>
            <h3 className='text-body-md font-medium text-neutral-700 mb-3'>
              Alertas activas ({activeAlerts.length})
            </h3>
            <div className='space-y-3'>
              {activeAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onEdit={() => handleEditAlert(alert)}
                  onDelete={() => onDeleteAlert?.(alert.id)}
                  onDismiss={() => onDismissAlert?.(alert.id)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        )}

        {/* Inactive/Dismissed alerts */}
        {inactiveAlerts.length > 0 && (
          <div className='mt-6'>
            <h3 className='text-body-md font-medium text-neutral-500 mb-3'>
              Alertas inactivas ({inactiveAlerts.length})
            </h3>
            <div className='space-y-3'>
              {inactiveAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onEdit={() => handleEditAlert(alert)}
                  onDelete={() => onDeleteAlert?.(alert.id)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {alerts.length === 0 && !showForm && (
          <div className='flex-1 flex flex-col items-center justify-center py-12'>
            <div className='w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4'>
              <NotificationsActiveRounded className='size-8 text-neutral-400' />
            </div>
            <p className='text-body-md text-neutral-700 mb-2'>
              No hay alertas configuradas
            </p>
            <p className='text-body-sm text-neutral-500 text-center max-w-sm'>
              Las alertas personalizadas aparecerán al abrir la ficha del paciente o al gestionar sus citas.
            </p>
            {!readOnly && (
              <button
                type='button'
                onClick={() => setShowForm(true)}
                className='mt-4 flex items-center gap-2 rounded-full px-4 py-2 text-body-sm text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors'
              >
                <AddRounded className='size-4' />
                <span>Crear primera alerta</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// ALERT POPUP COMPONENT (for showing alerts on open)
// ============================================

type AlertPopupProps = {
  alerts: PatientAlert[]
  patientName: string
  onDismiss?: (id: string) => void
  onClose: () => void
}

export function PatientAlertPopup({
  alerts,
  patientName,
  onDismiss,
  onClose
}: AlertPopupProps) {
  // Filter to only show alerts that should show on open
  const visibleAlerts = alerts.filter(a => a.isActive && a.showOnOpen)
  
  if (visibleAlerts.length === 0) return null

  // Get highest priority
  const hasCritical = visibleAlerts.some(a => a.priority === 'critical')
  const hasHigh = visibleAlerts.some(a => a.priority === 'high')

  return (
    <div className='fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4'>
      <div
        className={`w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border-t-4 ${
          hasCritical
            ? 'border-t-error-600'
            : hasHigh
              ? 'border-t-error-400'
              : 'border-t-warning-400'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-neutral-200'>
          <div className='flex items-center gap-3'>
            <WarningRounded className={`size-6 ${hasCritical ? 'text-error-600' : 'text-warning-500'}`} />
            <div>
              <h3 className='text-title-md text-neutral-900'>Alertas del paciente</h3>
              <p className='text-body-sm text-neutral-600'>{patientName}</p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='p-1 text-neutral-400 hover:text-neutral-600 transition-colors'
          >
            <CloseRounded className='size-5' />
          </button>
        </div>

        {/* Alerts list */}
        <div className='p-4 max-h-[60vh] overflow-y-auto space-y-3'>
          {visibleAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 ${
                alert.priority === 'critical'
                  ? 'border-l-error-600 bg-error-50'
                  : alert.priority === 'high'
                    ? 'border-l-error-400 bg-error-50'
                    : alert.priority === 'medium'
                      ? 'border-l-warning-400 bg-warning-50'
                      : 'border-l-info-400 bg-info-50'
              }`}
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-body-md font-medium text-neutral-900'>
                      {alert.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-label-sm ${TYPE_STYLES[alert.type]}`}>
                      {getAlertTypeLabel(alert.type)}
                    </span>
                  </div>
                  <p className='text-body-sm text-neutral-700'>{alert.message}</p>
                </div>
                {onDismiss && (
                  <button
                    type='button'
                    onClick={() => onDismiss(alert.id)}
                    className='text-neutral-400 hover:text-neutral-600 transition-colors'
                    title='Descartar'
                  >
                    <CloseRounded className='size-4' />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-neutral-200 bg-neutral-50'>
          <button
            type='button'
            onClick={onClose}
            className='w-full py-2 rounded-full bg-brand-500 text-body-md font-medium text-brand-900 hover:bg-brand-400 transition-colors'
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
