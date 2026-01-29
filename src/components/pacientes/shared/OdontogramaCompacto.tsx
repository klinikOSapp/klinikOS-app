'use client'

import type { OdontogramaState, ToothStatus } from './treatmentTypes'

// Configuración de dientes según diseño Figma
// Cuadrante superior: 18-11 (izq) | 21-28 (der)
// Cuadrante inferior: 38-31 (izq) | 41-48 (der)

const UPPER_LEFT = [18, 17, 16, 15, 14, 13, 12, 11] // Superior izquierdo
const UPPER_RIGHT = [21, 22, 23, 24, 25, 26, 27, 28] // Superior derecho
const LOWER_LEFT = [38, 37, 36, 35, 34, 33, 32, 31] // Inferior izquierdo
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48] // Inferior derecho

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
  // Colores según diseño Figma
  const borderColors: Record<ToothStatus, string> = {
    normal: 'border-[#CBD3D9]', // Neutral/300
    pendiente: 'border-[#D97706]', // Aviso/600
    finalizado: 'border-[#338F88]' // Brand/700
  }

  const borderWidth =
    status === 'normal' && !isSelected ? 'border' : 'border-[1.4px]'

  // Border radius según posición (superior: redondeado arriba, inferior: redondeado abajo)
  const borderRadius =
    position === 'upper'
      ? 'rounded-tl-[0.875rem] rounded-tr-[0.875rem] rounded-bl-[0.375rem] rounded-br-[0.375rem]'
      : 'rounded-tl-[0.375rem] rounded-tr-[0.375rem] rounded-bl-[0.875rem] rounded-br-[0.875rem]'

  // Estilo especial cuando está seleccionada temporalmente
  const selectedStyles = isSelected
    ? 'bg-[#E9FBF9] border-[var(--color-brand-500)] ring-2 ring-[var(--color-brand-300)] ring-offset-1'
    : ''

  // Estilo especial cuando está en modo selección (pero no seleccionada)
  const selectionModeStyles =
    isSelectionMode && status === 'normal' && !isSelected
      ? 'hover:bg-[#E9FBF9] hover:border-[var(--color-brand-300)]'
      : ''

  return (
    <button
      type='button'
      onClick={() => onClick?.(id)}
      className={[
        'w-[1.875rem] h-[3.625rem] flex items-center justify-center',
        isSelected ? '' : 'bg-[#F4F8FA]',
        'border-solid transition-all',
        isSelected ? '' : borderColors[status],
        borderWidth,
        borderRadius,
        selectedStyles,
        selectionModeStyles,
        'cursor-pointer hover:opacity-80'
      ].join(' ')}
    >
      <span
        className={`text-[0.875rem] font-medium leading-[1.25rem] ${isSelected ? 'text-[var(--color-brand-700)]' : 'text-[#5E5E5E]'}`}
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
        <div className='flex gap-[1rem] items-center'>
          <div className='flex gap-[0.25rem] items-center'>
            <span className='w-[0.5625rem] h-[0.5625rem] rounded-full bg-[#D97706]' />
            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
              Pendiente
            </span>
          </div>
          <div className='flex gap-[0.25rem] items-center'>
            <span className='w-[0.5625rem] h-[0.5625rem] rounded-full bg-[#338F88]' />
            <span className='text-[0.75rem] leading-[1rem] text-[#535C66]'>
              Finalizado
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
