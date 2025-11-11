// Figma tokens extracted from @figma/Layout (exact hex/px values)
// Colors
// brand: {
//   0:  #F0FAFA,
//   50: #E9FBF9,
//   100:#D3F7F3,
//   200:#A8EFE7,
//   300:#7DE7DC,
//   400:#59DED2,
//   500:#51D6C7,
//   600:#3FB7AB,
//   700:#338F88,
//   800:#2A6B67,
//   900:#1E4947,
// }
// neutral: {
//   0:  #FFFFFF,
//   50: #F8FAFB,
//   100:#EEF2F4,
//   200:#E2E7EA,
//   300:#CBD3D9,
//   400:#AEB8C2,
//   500:#8A95A1,
//   600:#6D7783,
//   700:#535C66,
//   800:#3D434A,
//   900:#24282C,
// }
// success (Éxito): { 50:#E9F8F1, 200:#A0E3C3, 600:#2E7D5B, 800:#1D4F3A }
// warning (Aviso): { 50:#FFF7E8, 200:#FFD188, 600:#D97706, 800:#92400E } // 600/800 mapped from Figma's amber-600/amber-800
// error: { 50:#FEEBEC, 200:#F7B7BA, 600:#B91C1C, 800:#7F1D1D } // 600/800 mapped from Figma's red-700/red-900
// info: { 50:#F3EAFF, 200:#D4B5FF, 600:#7825EB, 800:#5A1EAF }
// Spacing: topbar=64px, sidebar(expanded)=256px, sidebar(collapsed)=80px, navItem=48px, cta=56px, gapSm=8px, gapMd=16px, plNav=24px
// Typography: Title/Medium: Inter 18/28 500; Body/Medium: Inter 16/24 400
// Radii: 16px (CTA, content top-left),
// Shadows: CTA => 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)
// Active indicator (nav clicked): inset 4px 0 0 0 #A8EFE7

export default {
  theme: {
    extend: {
      colors: {
        brand: {
          0: '#F0FAFA',
          50: '#E9FBF9',
          100: '#D3F7F3',
          200: '#A8EFE7',
          300: '#7DE7DC',
          400: '#59DED2',
          500: '#51D6C7',
          600: '#3FB7AB',
          700: '#338F88',
          800: '#2A6B67',
          900: '#1E4947'
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F8FAFB',
          100: '#EEF2F4',
          200: '#E2E7EA',
          300: '#CBD3D9',
          400: '#AEB8C2',
          500: '#8A95A1',
          600: '#6D7783',
          700: '#535C66',
          800: '#3D434A',
          900: '#24282C'
        },
        success: {
          50: '#E9F8F1',
          200: '#A0E3C3',
          600: '#2E7D5B',
          800: '#1D4F3A'
        },
        warning: {
          50: '#FFF7E8',
          200: '#FFD188',
          600: '#D97706', // amber-600
          800: '#92400E' // amber-800
        },
        error: {
          50: '#FEEBEC',
          200: '#F7B7BA',
          600: '#B91C1C', // red-700
          800: '#7F1D1D' // red-900
        },
        info: {
          50: '#F3EAFF',
          200: '#D4B5FF',
          600: '#7825EB',
          800: '#5A1EAF'
        },
        surface: {
          app: 'var(--color-page-bg)',
          DEFAULT: 'var(--color-surface)',
          accent: 'var(--color-surface-accent)',
          popover: 'var(--color-surface-popover)'
        },
        fg: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          link: 'var(--color-link)'
        },
        border: {
          DEFAULT: 'var(--color-border)'
        },
        brandSemantic: {
          DEFAULT: 'var(--color-brand)',
          strong: 'var(--color-brand-strong)',
          weak: 'var(--color-brand-weak)'
        },
        state: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          info: 'var(--color-info)',
          danger: 'var(--color-danger)'
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          accent: 'var(--chart-accent)',
          grid: 'var(--chart-grid)',
          axis: 'var(--chart-axis)',
          negative: 'var(--chart-negative)',
          threshold: 'var(--chart-threshold)'
        }
      },
      spacing: {
        // Layout spacing in rem - scales with fluid base
        topbar: '4rem', // 64px ÷ 16
        sidebar: '16rem', // 256px ÷ 16
        'sidebar-collapsed': '5rem', // 80px ÷ 16
        'nav-item': '3rem', // 48px ÷ 16
        cta: '3.5rem', // 56px ÷ 16
        'topbar-mobile': '3.5rem', // 56px ÷ 16
        'bottombar-mobile': '4rem', // 64px ÷ 16
        gapsm: '0.5rem', // 8px ÷ 16
        gapmd: '1rem', // 16px ÷ 16
        plnav: '1.5rem', // 24px ÷ 16

        // Dashboard spacing tokens (CSS variables)
        'card-pad': 'var(--space-card-pad)',
        'card-gap': 'var(--space-card-gap)',
        'card-gap2': 'var(--space-card-gap2)',
        'card-inner': 'var(--space-card-inner)',
        'header-cards': 'var(--space-header-cards)',
        'card-row': 'var(--space-card-row)',
        'card-metric': 'var(--space-card-metric)',

        // Dashboard vertical spacing offsets
        'section-gap': 'var(--spacing-section-gap)',
        'stats-offset': 'var(--spacing-stats-offset)',
        'charts-offset': 'var(--spacing-charts-offset)',

        // Gap between main dashboard cards (horizontal)
        'cards-gap': 'var(--spacing-card-gap)',

        // Fluid spacing - usando vh para escalar verticalmente
        'fluid-sm': 'clamp(0.5rem, 1.5vh, 1rem)',
        'fluid-md': 'clamp(1rem, 2vh, 1.5rem)',
        'fluid-lg': 'clamp(1.5rem, 2.5vh, 2rem)',
        'fluid-xl': 'clamp(2rem, 4vh, 3rem)'
      },
      borderRadius: {
        xl: '1rem', // 16px ÷ 16
        'tl-16': '1rem', // 16px ÷ 16
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-full)'
      },
      boxShadow: {
        cta: '0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)',
        'nav-active': 'inset 4px 0 0 0 #A8EFE7',
        'elevation-card': 'var(--shadow-elevation-card)',
        'elevation-popover': 'var(--shadow-elevation-popover)'
      },
      ringColor: {
        focus: 'var(--color-focus)'
      },
      fontFamily: {
        inter: [
          'var(--font-inter)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif'
        ]
      },
      fontSize: {
        kpi: [
          'var(--text-kpi)',
          { lineHeight: 'var(--leading-kpi)', fontWeight: '500' }
        ],
        'display-lg': [
          'var(--text-display-lg)',
          { lineHeight: 'var(--leading-display-lg)', fontWeight: '400' }
        ],
        'display-md': [
          'var(--text-display-md)',
          { lineHeight: 'var(--leading-display-md)', fontWeight: '400' }
        ],
        'headline-lg': [
          'var(--text-headline-lg)',
          { lineHeight: 'var(--leading-headline-lg)', fontWeight: '400' }
        ],
        'headline-sm': [
          'var(--text-headline-sm)',
          { lineHeight: 'var(--leading-headline-sm)', fontWeight: '400' }
        ],
        'title-lg': [
          'var(--text-title-lg)',
          { lineHeight: 'var(--leading-title-lg)', fontWeight: '500' }
        ],
        'title-md': [
          'var(--text-title-md)',
          { lineHeight: 'var(--leading-title-md)', fontWeight: '500' }
        ],
        'title-sm': [
          'var(--text-title-sm)',
          { lineHeight: 'var(--leading-title-sm)', fontWeight: '500' }
        ],
        'body-lg': [
          'var(--text-body-lg)',
          { lineHeight: 'var(--leading-body-lg)', fontWeight: '400' }
        ],
        'body-md': [
          'var(--text-body-md)',
          { lineHeight: 'var(--leading-body-md)', fontWeight: '400' }
        ],
        'body-sm': [
          'var(--text-body-sm)',
          { lineHeight: 'var(--leading-body-sm)', fontWeight: '400' }
        ],
        'label-sm': [
          'var(--text-label-sm)',
          { lineHeight: 'var(--leading-label-sm)', fontWeight: '500' }
        ],
        'label-md': [
          'var(--text-label-md)',
          { lineHeight: 'var(--leading-label-md)', fontWeight: '500' }
        ]
      },
      screens: {
        mobile: '360px',
        desktop: '905px'
      },

      // Container max-widths for responsive layout constraints
      // Usage: max-w-content, max-w-layout
      maxWidth: {
        content: '100rem', // 1600px ÷ 16
        layout: '120rem' // 1920px ÷ 16
      },

      // Dashboard component dimensions
      height: {
        'card-stat': 'var(--height-card-stat)', // 163px - cards de estadísticas (fijo)
        'card-chart': 'var(--height-card-chart)', // 393.3px (+15%) - cards con gráficos (fijo)
        'card-stat-fluid': 'var(--height-card-stat-fluid)', // Altura fluid reducida 20% (≈130px base)
        'card-chart-fluid': 'var(--height-card-chart-fluid)', // 294.4px → 393.3px (+15%) (fluido)
        'income-card': 'var(--height-income-card)' // 100px - tarjeta Tipos de ingreso
      },
      width: {
        'card-stat': 'var(--width-card-stat)', // 523px - ancho card estadística (fijo)
        'card-chart-lg': 'var(--width-card-chart-lg)', // 1069px - ancho card grande (fijo)
        'card-chart-md': 'var(--width-card-chart-md)', // 529px - ancho card mediano (fijo)
        'card-stat-fluid': 'var(--width-card-stat-fluid)', // 320px → 523px (fluido)
        'card-chart-lg-fluid': 'var(--width-card-chart-lg-fluid)', // 640px → 1069px (fluido)
        'card-chart-md-fluid': 'var(--width-card-chart-md-fluid)', // 320px → 529px (fluido)
        'income-card': 'var(--width-income-card)' // 156px - tarjeta Tipos de ingreso
      }
    }
  }
} satisfies import('tailwindcss').Config
