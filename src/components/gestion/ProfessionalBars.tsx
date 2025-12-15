import type { CSSProperties } from 'react'

const imgFilterAlt =
  'http://localhost:3845/assets/622ee6e3207960b9a18935df21e77e84c84d7c28.svg'
const imgGrid =
  'http://localhost:3845/assets/1c7e662cc8affdff9c0a9a4d251f4fc6a1bd0385.svg'

const AXIS_LABELS = [350, 300, 250, 200, 150, 100, 50, 0]
const PROFESSIONAL_LABELS = [
  'Dr. Guille',
  'Dra. Laura',
  'Tamara (Hig.)',
  'Nerea (Hig.)'
]

// Medidas extraídas de Figma y convertidas a rem (px ÷ 16)
const CARD_WIDTH_REM = '33.0625rem' // 529px
const CARD_HEIGHT_REM = '21.375rem' // 342px
// Ratios relativos al contenedor base (529x342) para permitir escalado interno
const HEADER_LEFT = '3.025%' // 16 / 529
const HEADER_TOP = '4.678%' // 16 / 342
const HEADER_WIDTH = '93.951%' // 497 / 529
const HEADER_HEIGHT = '7.018%' // 24 / 342
const GRID_LEFT = '10.397%' // 55 / 529
const GRID_TOP = '24.561%' // 84 / 342
const GRID_WIDTH = '82.8%' // 438 / 529
const GRID_HEIGHT = '60.819%' // 208 / 342
const Y_LABEL_LEFT = '3.025%' // 16 / 529
const Y_LABEL_TOP = '21.053%' // 72 / 342
const Y_LABEL_HEIGHT = '64.327%' // 220 / 342
const X_LABEL_TOP = '88.362%' // 302 / 342
const BAR_WIDTH = '10.964%' // 58 / 529

const BARS = [
  {
    label: 'Dr. Guille',
    color: '#2A6B67',
    left: '10.397%', // 55 / 529
    top: '28.363%', // 97 / 342
    height: '57.018%' // 195 / 342
  },
  {
    label: 'Dra. Laura',
    color: '#51D6C7',
    left: '31.569%', // 167 / 529
    top: '38.012%', // 130 / 342
    height: '47.368%' // 162 / 342
  },
  {
    label: 'Tamara (Hig.)',
    color: '#D3F7F3',
    left: '55.955%', // 296 / 529
    top: '51.17%', // 175 / 342
    height: '34.211%' // 117 / 342
  },
  {
    label: 'Nerea (Hig.)',
    color: '#A8EFE7',
    left: '81.285%', // 430 / 529
    top: '46.491%', // 159 / 342
    height: '38.889%' // 133 / 342
  }
]

export default function ProfessionalBars() {
  const cardStyles: CSSProperties = {
    width: '100%',
    maxWidth: `min(${CARD_WIDTH_REM}, 95vw, var(--chart-prof-width-limit, ${CARD_WIDTH_REM}))`,
    height: `min(${CARD_HEIGHT_REM}, var(--chart-prof-height-limit, ${CARD_HEIGHT_REM}))`
  }

  return (
    <section
      className='relative overflow-visible rounded-[0.5rem] bg-white shadow-elevation-card'
      style={cardStyles}
    >
      <header
        className='absolute flex items-center justify-between'
        style={{
          left: HEADER_LEFT,
          top: HEADER_TOP,
          width: HEADER_WIDTH,
        height: HEADER_HEIGHT
        }}
      >
        <h3 className='text-[1rem] font-medium leading-[1.5rem] text-[#24282C]'>
          Facturación por profesional
        </h3>
        <img
          src={imgFilterAlt}
          alt=''
          className='h-[1.5rem] w-[1.5rem]'
          style={{ color: '#6D7783' }}
        />
      </header>

      {/* Área de gráfico */}
      <div
        className='relative h-full w-full'
        style={{ transform: 'translateY(-0.5rem)' }}
      >
        {/* Líneas de guía */}
        <div
          className='absolute'
          style={{
            left: GRID_LEFT,
            top: GRID_TOP,
            width: GRID_WIDTH,
            height: GRID_HEIGHT
          }}
        >
          <img
            src={imgGrid}
            alt=''
            className='h-full w-full max-w-none'
            style={{ opacity: 0.6 }}
          />
        </div>

        {/* Barras */}
        {BARS.map((bar) => (
          <div
            key={bar.label}
            className='absolute rounded-[1rem]'
            style={{
              left: bar.left,
              top: bar.top,
              width: BAR_WIDTH,
              height: bar.height,
              backgroundColor: bar.color
            }}
          />
        ))}

        {/* Eje Y */}
        <div
          className='absolute flex w-max flex-col justify-between text-[0.75rem] font-normal leading-[1rem] text-[#AEB8C2]'
          style={{
            left: Y_LABEL_LEFT,
            top: Y_LABEL_TOP,
            height: Y_LABEL_HEIGHT
          }}
        >
          {AXIS_LABELS.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* Eje X */}
        <div
          className='absolute flex justify-between text-[0.75rem] font-normal leading-[1rem] text-[#AEB8C2]'
          style={{
            left: GRID_LEFT,
            top: X_LABEL_TOP,
            width: GRID_WIDTH
          }}
        >
          {PROFESSIONAL_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
