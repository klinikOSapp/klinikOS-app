'use client'

import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded'
import CloseRounded from '@mui/icons-material/CloseRounded'
import React from 'react'
import { createPortal } from 'react-dom'

const MODAL_WIDTH_REM = 68.25
const MODAL_HEIGHT_REM = 59.75
const SCALE_FORMULA =
  'min(1, calc(85vh / 59.75rem), calc((100vw - 4rem) / 68.25rem), calc(92vw / 68.25rem))'

const DEFAULT_SELECTED_TEETH = new Set([21, 15, 16, 17, 27, 47, 46, 35])

type LabelPosition = 'top' | 'bottom' | 'left' | 'right'

type ToothConfig = {
  id: number
  x: number
  y: number
  size: number
  labelPosition: LabelPosition
}

function pxToRem(value: number) {
  return `${value / 16}rem`
}

const ARCADA_HALF_WIDTH_PX = 170.5
const ARCADA_HALF_WIDTH_REM = `${ARCADA_HALF_WIDTH_PX / 16}rem`
const ARCADA_HEIGHT_PX = 277
const ARCADA_HEIGHT_REM = `${ARCADA_HEIGHT_PX / 16}rem`

const BASE_QUADRANT_POINTS: Array<{ x: number; y: number; size: number }> = [
  { x: 7.5, y: 221, size: 32 },
  { x: 40.5, y: 213, size: 32 },
  { x: 70.5, y: 198, size: 32 },
  { x: 87.5, y: 169, size: 32 },
  { x: 94.5, y: 135, size: 32 },
  { x: 95.5, y: 90, size: 40 },
  { x: 104.5, y: 45, size: 40 },
  { x: 110.5, y: 0, size: 40 }
]

const TOOTH_LABEL_POSITIONS: Record<number, LabelPosition> = {
  11: 'top',
  12: 'top',
  13: 'left',
  14: 'left',
  15: 'left',
  16: 'left',
  17: 'left',
  18: 'left',
  21: 'top',
  22: 'top',
  23: 'right',
  24: 'right',
  25: 'right',
  26: 'right',
  27: 'right',
  28: 'right',
  31: 'bottom',
  32: 'bottom',
  33: 'left',
  34: 'left',
  35: 'left',
  36: 'left',
  37: 'left',
  38: 'left',
  41: 'bottom',
  42: 'bottom',
  43: 'right',
  44: 'right',
  45: 'right',
  46: 'right',
  47: 'right',
  48: 'right'
}

const TOOTH_SIZES: Record<number, number> = {
  11: 32,
  12: 32,
  13: 32,
  14: 32,
  15: 32,
  16: 40,
  17: 40,
  18: 40,
  21: 32,
  22: 32,
  23: 32,
  24: 32,
  25: 32,
  26: 40,
  27: 40,
  28: 40,
  31: 32,
  32: 32,
  33: 32,
  34: 32,
  35: 32,
  36: 40,
  37: 40,
  38: 40,
  41: 32,
  42: 32,
  43: 32,
  44: 32,
  45: 32,
  46: 40,
  47: 40,
  48: 40
}

function buildQuadrantTeeth(
  ids: number[],
  mirrorX: boolean,
  mirrorY: boolean
): ToothConfig[] {
  return ids.map((id, index) => {
    const base = BASE_QUADRANT_POINTS[index]
    const x = mirrorX ? ARCADA_HALF_WIDTH_PX - base.x : base.x
    const y = mirrorY ? ARCADA_HEIGHT_PX - base.y : base.y

    return {
      id,
      x,
      y,
      size: TOOTH_SIZES[id],
      labelPosition: TOOTH_LABEL_POSITIONS[id]
    }
  })
}

type ToothRenderConfig = ToothConfig & {
  selected: boolean
  onToggle: (id: number) => void
}

function Tooth({
  id,
  x,
  y,
  size,
  labelPosition,
  selected,
  onToggle
}: ToothRenderConfig) {
  const labelBase = 'absolute text-title-sm'

  let labelStyle: React.CSSProperties = {}
  if (labelPosition === 'top') {
    labelStyle = {
      bottom: 'calc(100% + 0.25rem)',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  } else if (labelPosition === 'bottom') {
    labelStyle = {
      top: 'calc(100% + 0.25rem)',
      left: '50%',
      transform: 'translateX(-50%)'
    }
  } else if (labelPosition === 'left') {
    labelStyle = {
      right: 'calc(100% + 0.25rem)',
      top: '50%',
      transform: 'translateY(-50%)',
      textAlign: 'right'
    }
  } else {
    labelStyle = {
      left: 'calc(100% + 0.25rem)',
      top: '50%',
      transform: 'translateY(-50%)'
    }
  }

  const circleClasses = [
    'absolute inset-0 rounded-full border-[0.125rem] transition-colors duration-150',
    selected
      ? 'border-brand-500 bg-brand-500/10'
      : 'border-neutral-400 bg-transparent'
  ].join(' ')

  return (
    <div
      className='absolute'
      style={{
        left: pxToRem(x),
        top: pxToRem(y),
        width: pxToRem(size),
        height: pxToRem(size)
      }}
    >
      <button
        type='button'
        aria-pressed={selected}
        aria-label={`Seleccionar diente ${id}`}
        onClick={() => onToggle(id)}
        className='relative size-full rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
      >
        <div className='relative size-full'>
          <span className={circleClasses} />
          <span
            className={`${labelBase} ${
              selected ? 'text-brand-500' : 'text-neutral-600'
            }`}
            style={labelStyle}
          >
            {id}
          </span>
        </div>
      </button>
    </div>
  )
}

const arcadaQuadrants: Array<{
  key: string
  toothIds: number[]
  mirrorX: boolean
  mirrorY: boolean
  leftPx: number
  topPx: number
}> = [
  {
    key: 'upper-left',
    toothIds: [11, 12, 13, 14, 15, 16, 17, 18],
    mirrorX: true,
    mirrorY: true,
    leftPx: 81,
    topPx: 33
  },
  {
    key: 'upper-right',
    toothIds: [21, 22, 23, 24, 25, 26, 27, 28],
    mirrorX: false,
    mirrorY: true,
    leftPx: 81 + ARCADA_HALF_WIDTH_PX,
    topPx: 33
  },
  {
    key: 'lower-left',
    toothIds: [31, 32, 33, 34, 35, 36, 37, 38],
    mirrorX: true,
    mirrorY: false,
    leftPx: 80,
    topPx: 349
  },
  {
    key: 'lower-right',
    toothIds: [41, 42, 43, 44, 45, 46, 47, 48],
    mirrorX: false,
    mirrorY: false,
    leftPx: 80 + ARCADA_HALF_WIDTH_PX,
    topPx: 349
  }
]

type OdontogramaModalProps = {
  open: boolean
  onClose: () => void
  onContinue?: () => void
}

export default function OdontogramaModal({
  open,
  onClose,
  onContinue
}: OdontogramaModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const [selectedTeeth, setSelectedTeeth] = React.useState<Set<number>>(
    () => new Set(DEFAULT_SELECTED_TEETH)
  )

  const toggleTooth = React.useCallback((toothId: number) => {
    setSelectedTeeth((prev) => {
      const next = new Set(prev)
      if (next.has(toothId)) {
        next.delete(toothId)
      } else {
        next.add(toothId)
      }
      return next
    })
  }, [])

  const selectedTeethList = React.useMemo(
    () => Array.from(selectedTeeth).sort((a, b) => a - b),
    [selectedTeeth]
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!open) return undefined
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open || !mounted) return null

  const content = (
    <div
      className='fixed inset-0 z-[70] bg-neutral-900/40'
      onClick={onClose}
      aria-hidden='true'
    >
      <div className='absolute inset-0 flex items-center justify-center px-8'>
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Odontograma'
          className='relative overflow-hidden rounded-[0.5rem] bg-neutral-50'
          style={{
            width: `calc(${MODAL_WIDTH_REM}rem * ${SCALE_FORMULA})`,
            height: `calc(${MODAL_HEIGHT_REM}rem * ${SCALE_FORMULA})`
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className='relative bg-neutral-50'
            style={{
              width: `${MODAL_WIDTH_REM}rem`,
              height: `${MODAL_HEIGHT_REM}rem`,
              transform: `scale(${SCALE_FORMULA})`,
              transformOrigin: 'top left'
            }}
          >
            <header className='absolute left-0 top-0 flex h-[3.5rem] w-full items-center justify-between border-b border-neutral-300 px-[2rem]'>
              <p className='text-title-md text-neutral-900'>Odontograma</p>
              <button
                type='button'
                onClick={onClose}
                aria-label='Cerrar odontograma'
                className='flex size-[0.875rem] items-center justify-center text-neutral-900'
              >
                <CloseRounded fontSize='inherit' />
              </button>
            </header>

            <div className='absolute left-[2rem] top-[5.5rem] h-[41.625rem] w-[31.5rem]'>
              <div className='absolute left-[13.6875rem] top-0 flex h-full w-[4.0625rem] flex-col items-center'>
                <p className='text-title-sm text-neutral-900'>Superior</p>
                <div className='relative mt-[1.5rem] flex-1'>
                  <div
                    className='absolute left-1/2 top-[0.0625rem] h-[26.6875rem] -translate-x-1/2 bg-neutral-300'
                    style={{ width: '0.0625rem' }}
                  />
                </div>
                <p className='text-title-sm text-neutral-900'>Inferior</p>
              </div>
              <div className='absolute left-0 top-[20.5625rem] flex w-full items-center justify-between'>
                <p className='text-title-sm text-neutral-900'>Izquierda</p>
                <div className='h-[0.0625rem] w-[20.0625rem] bg-neutral-300' />
                <p className='text-title-sm text-neutral-900'>Derecha</p>
              </div>
              {arcadaQuadrants.map((quadrant) => (
                <div
                  key={quadrant.key}
                  className='absolute'
                  style={{
                    left: pxToRem(quadrant.leftPx),
                    top: pxToRem(quadrant.topPx),
                    width: ARCADA_HALF_WIDTH_REM,
                    height: ARCADA_HEIGHT_REM
                  }}
                >
                  <div className='relative size-full'>
                    {buildQuadrantTeeth(
                      quadrant.toothIds,
                      quadrant.mirrorX,
                      quadrant.mirrorY
                    ).map((tooth) => (
                      <Tooth
                        key={`${quadrant.key}-${tooth.id}`}
                        {...tooth}
                        selected={selectedTeeth.has(tooth.id)}
                        onToggle={toggleTooth}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className='absolute left-[34.75rem] top-[5.5rem] text-title-md text-neutral-900'>
              Diente(s) seleccionado:
            </p>

            <div className='absolute left-[34.75rem] top-[8.25rem] flex h-[5.625rem] w-[31.5rem] flex-wrap content-start gap-[0.5rem] overflow-y-auto pr-[0.25rem]'>
              {selectedTeethList.length === 0 ? (
                <p className='text-label-sm text-neutral-500'>
                  No hay dientes seleccionados.
                </p>
              ) : (
                selectedTeethList.map((toothId) => (
                  <div key={toothId} className='flex items-center gap-[0.5rem]'>
                    <span className='block size-[1rem] rounded-full bg-brand-500' />
                    <p className='text-label-sm text-neutral-900'>
                      Diente #{toothId}
                    </p>
                  </div>
                ))
              )}
            </div>

            <label className='absolute left-[34.75rem] top-[13.875rem] flex w-[31.5rem] flex-col gap-[0.5rem] text-body-sm text-neutral-900'>
              Observaciones
              <div className='border border-neutral-300 bg-neutral-50 px-[0.625rem] py-[0.5rem]'>
                <textarea
                  className='h-[5rem] w-full resize-none bg-transparent text-body-md text-neutral-900 placeholder:text-neutral-400 outline-none'
                  placeholder='Value'
                />
              </div>
              <span className='text-label-sm text-neutral-600'>
                Texto descriptivo
              </span>
            </label>

            <button
              type='button'
              onClick={onContinue}
              className='absolute left-[36.4375rem] top-[55.75rem] inline-flex h-[2.5rem] w-[13.4375rem] items-center justify-center gap-[0.5rem] rounded-full border border-brand-500 bg-brand-500 px-[1rem] text-body-md font-medium text-brand-900 transition-colors hover:bg-brand-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300'
            >
              Continuar
              <ArrowForwardRounded className='size-5' />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
