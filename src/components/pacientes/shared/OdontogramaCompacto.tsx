'use client'

import type { OdontogramaState, ToothStatus } from './treatmentTypes'
import { TOOTH_STATUS_COLORS } from './treatmentTypes'

// Configuración de dientes según diseño Figma
// Cuadrante superior: 18-11 (izq) | 21-28 (der)
// Cuadrante inferior: 38-31 (izq) | 41-48 (der)

export const UPPER_LEFT = [18, 17, 16, 15, 14, 13, 12, 11] // Superior izquierdo
export const UPPER_RIGHT = [21, 22, 23, 24, 25, 26, 27, 28] // Superior derecho
export const LOWER_LEFT = [38, 37, 36, 35, 34, 33, 32, 31] // Inferior izquierdo
export const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48] // Inferior derecho

type ToothProps = {
  id: number
  status: ToothStatus
  position: 'upper' | 'lower'
  isSelectionMode?: boolean
  isSelected?: boolean // Pieza seleccionada temporalmente
  onClick?: (id: number) => void
}

function Tooth({
  id,
  status,
  position,
  isSelectionMode,
  isSelected,
  onClick
}: ToothProps) {
  // Colores según estado del diente
  const statusColor = TOOTH_STATUS_COLORS[status]?.fill || TOOTH_STATUS_COLORS.normal.fill

  const borderWidth =
    status === 'normal' && !isSelected ? 'border' : 'border-[1.4px]'

  // Border radius según posición (superior: redondeado arriba, inferior: redondeado abajo)
  const borderRadius =
    position === 'upper'
      ? 'rounded-tl-[0.875rem] rounded-tr-[0.875rem] rounded-bl-[0.375rem] rounded-br-[0.375rem]'
      : 'rounded-tl-[0.375rem] rounded-tr-[0.375rem] rounded-bl-[0.875rem] rounded-br-[0.875rem]'

  // Estilo especial cuando está seleccionada temporalmente
  const selectedStyles = isSelected
    ? 'bg-[#E9FBF9] ring-2 ring-[var(--color-brand-300)] ring-offset-1'
    : ''

  // Estilo especial cuando está en modo selección (pero no seleccionada)
  const selectionModeStyles =
    isSelectionMode && status === 'normal' && !isSelected
      ? 'hover:bg-[#E9FBF9] hover:border-[var(--color-brand-300)]'
      : ''

  // Fondo especial para dientes ausentes (tachado visual)
  const absentStyles = status === 'ausente' 
    ? 'bg-[#E5E7EB] bg-stripes' 
    : ''
  
  // Fondo especial para prótesis
  const prosthesisStyles = status === 'protesis'
    ? 'bg-[#EDE9FE]'
    : ''

  return (
    <button
      type='button'
      onClick={() => onClick?.(id)}
      style={{
        borderColor: isSelected ? 'var(--color-brand-500)' : statusColor
      }}
      className={[
        'w-[1.875rem] h-[3.625rem] flex items-center justify-center',
        isSelected ? '' : (absentStyles || prosthesisStyles || 'bg-[#F4F8FA]'),
        'border-solid transition-all',
        borderWidth,
        borderRadius,
        selectedStyles,
        selectionModeStyles,
        status === 'ausente' ? 'opacity-60' : '',
        'cursor-pointer hover:opacity-80'
      ].join(' ')}
      title={TOOTH_STATUS_COLORS[status]?.label}
    >
      <span
        className={`text-[0.875rem] font-medium leading-[1.25rem] ${
          isSelected 
            ? 'text-[var(--color-brand-700)]' 
            : status === 'ausente' 
              ? 'text-[#9CA3AF] line-through' 
              : 'text-[#5E5E5E]'
        }`}
      >
        {id}
      </span>
    </button>
  )
}

type OdontogramaCompactoProps = {
  state: OdontogramaState
  onToothClick?: (toothId: number) => void
  isSelectionMode?: boolean // Indica si hay un tratamiento seleccionado esperando piezas
  selectedTeeth?: number[] // Piezas seleccionadas temporalmente
  showLegend?: boolean // Mostrar leyenda Pendiente/Finalizado (default: true)
}

export default function OdontogramaCompacto({
  state,
  onToothClick,
  isSelectionMode,
  selectedTeeth = [],
  showLegend = true
}: OdontogramaCompactoProps) {
  const getToothStatus = (id: number): ToothStatus => {
    return state[id] || 'normal'
  }

  return (
    <div className='flex flex-col gap-[1.875rem]'>
      {/* Sección superior (18-11 | 21-28) */}
      <div className='flex gap-[0.75rem] items-center'>
        {/* Cuadrante superior izquierdo: 18-11 */}
        <div className='flex gap-[0.4375rem]'>
          {UPPER_LEFT.map((id) => (
            <Tooth
              key={id}
              id={id}
              status={getToothStatus(id)}
              position='upper'
              isSelectionMode={isSelectionMode}
              isSelected={selectedTeeth.includes(id)}
              onClick={onToothClick}
            />
          ))}
        </div>

        {/* Cuadrante superior derecho: 21-28 */}
        <div className='flex gap-[0.4375rem]'>
          {UPPER_RIGHT.map((id) => (
            <Tooth
              key={id}
              id={id}
              status={getToothStatus(id)}
              position='upper'
              isSelectionMode={isSelectionMode}
              isSelected={selectedTeeth.includes(id)}
              onClick={onToothClick}
            />
          ))}
        </div>
      </div>

      {/* Línea divisoria */}
      <div className='w-[min(35.9375rem,100%)] h-0 border-t border-[#CBD3D9]' />

      {/* Sección inferior (38-31 | 41-48) */}
      <div className='flex gap-[0.75rem] items-center'>
        {/* Cuadrante inferior izquierdo: 38-31 */}
        <div className='flex gap-[0.4375rem]'>
          {LOWER_LEFT.map((id) => (
            <Tooth
              key={id}
              id={id}
              status={getToothStatus(id)}
              position='lower'
              isSelectionMode={isSelectionMode}
              isSelected={selectedTeeth.includes(id)}
              onClick={onToothClick}
            />
          ))}
        </div>

        {/* Cuadrante inferior derecho: 41-48 */}
        <div className='flex gap-[0.4375rem]'>
          {LOWER_RIGHT.map((id) => (
            <Tooth
              key={id}
              id={id}
              status={getToothStatus(id)}
              position='lower'
              isSelectionMode={isSelectionMode}
              isSelected={selectedTeeth.includes(id)}
              onClick={onToothClick}
            />
          ))}
        </div>
      </div>

      {/* Leyenda (opcional) */}
      {showLegend && (
        <div className='flex flex-wrap gap-[1rem] items-center'>
          <div className='flex gap-[0.25rem] items-center'>
            <span 
              className='w-[0.5625rem] h-[0.5625rem] rounded-full' 
              style={{ backgroundColor: TOOTH_STATUS_COLORS.pendiente.fill }}
            />
            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
              {TOOTH_STATUS_COLORS.pendiente.label}
            </span>
          </div>
          <div className='flex gap-[0.25rem] items-center'>
            <span 
              className='w-[0.5625rem] h-[0.5625rem] rounded-full' 
              style={{ backgroundColor: TOOTH_STATUS_COLORS.finalizado.fill }}
            />
            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
              {TOOTH_STATUS_COLORS.finalizado.label}
            </span>
          </div>
          <div className='flex gap-[0.25rem] items-center'>
            <span 
              className='w-[0.5625rem] h-[0.5625rem] rounded-full' 
              style={{ backgroundColor: TOOTH_STATUS_COLORS.ausente.fill }}
            />
            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
              {TOOTH_STATUS_COLORS.ausente.label}
            </span>
          </div>
          <div className='flex gap-[0.25rem] items-center'>
            <span 
              className='w-[0.5625rem] h-[0.5625rem] rounded-full' 
              style={{ backgroundColor: TOOTH_STATUS_COLORS.protesis.fill }}
            />
            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
              {TOOTH_STATUS_COLORS.protesis.label}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
