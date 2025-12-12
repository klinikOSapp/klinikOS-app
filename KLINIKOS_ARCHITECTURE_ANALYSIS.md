# KlinikOS Frontend Architecture Analysis
## Complete Project Structure & Database Integration Guide

---

## 1. OVERALL ARCHITECTURE

### 1.1 Tech Stack
- **Framework**: Next.js 15.5.4 (App Router)
- **React**: 19.1.0 (with 'use client' for client components)
- **UI Framework**: Material-UI (MUI) 7.3.3 (@mui/icons-material, @mui/material)
- **Styling**: Tailwind CSS 4.0 + Custom CSS variables
- **Charts**: Recharts 3.4.0
- **Language**: TypeScript 5.0
- **Package Manager**: pnpm 10.15.1
- **Development**: TurboPack (next dev --turbopack)

### 1.2 Project Structure
```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Landing page (pre-auth)
│   ├── client-layout.tsx         # Client-side layout wrapper
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Registration flow
│   ├── pacientes/page.tsx        # Patients management
│   ├── pacientes/ficha/page.tsx  # Patient detail view
│   ├── agenda/page.tsx           # Appointment calendar
│   ├── gestion/page.tsx          # Management/Dashboard
│   ├── globals.css               # Global styles & CSS variables
│   └── favicon.ico               # App icon
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── pacientes/                # Patient-related components
│   ├── gestion/                  # Management/dashboard components
│   ├── agenda/                   # Calendar/appointment components
│   ├── layout/                   # Layout components (Sidebar, TopBar, etc.)
│   └── MainLayout.tsx            # Responsive layout wrapper
├── types/                        # TypeScript type definitions
│   └── layout.ts                 # Layout-related types
└── globals.css                   # Global styles

public/
├── logo.svg                      # Main logo
├── logo-expanded.svg             # Expanded logo
├── Logo login.svg                # Login page logo
└── favicon/                      # Multi-format favicons
```

### 1.3 App Router Structure
The app follows Next.js 15 App Router with route-based pages:

```
/ (Landing)
├── /login → Login form (mock auth)
├── /register → Registration flow with multi-step modal
├── /pacientes → Patient list with filtering
│   └── /ficha → Individual patient record modal
├── /agenda → Weekly calendar scheduler
└── /gestion → Management dashboard
```

---

## 2. KEY ROUTES & PAGE STRUCTURE

### 2.1 Authentication Pages

#### `/login` - Login Page
- **File**: `src/app/login/page.tsx`
- **Features**:
  - Email/password form (mock implementation)
  - Show/hide password toggle
  - Remember me checkbox
  - Password recovery link
  - Error message display
  - Loading state on submit
  - **Note**: "La autenticación aún no está conectada" (Auth not connected)
- **Related Components**:
  - Form validation (regex email check)
  - Button states (loading/disabled)

#### `/register` - Registration Page
- **File**: `src/app/register/page.tsx`
- **Flow**:
  1. Landing card with email submission
  2. Opens EmailRegisterModal with multi-step registration
- **Components**:
  - `RegisterLandingCard` - Initial email capture
  - `EmailRegisterModal` - Multi-step form (form → photo)
  - `AddProfilePhotoStep` - Profile photo capture

### 2.2 Main Application Pages (Protected)

#### `/pacientes` - Patient Management
- **File**: `src/app/pacientes/page.tsx`
- **Layout**: ClientLayout wrapper with full app shell
- **Key Features**:
  - **KPI Cards**: (4 cards with metrics)
    - Pacientes hoy: 2 (24% trend)
    - Pacientes semana: 16 (8% trend)
    - Pacientes recibidos: 4/16 (25% progress)
    - Citas confirmadas: 12/16 (75% progress)
  
  - **Data Table**:
    - Columns: Patient name, next date, status, phone, check-in, financing, debt, last contact
    - Rows: 12 mock patients (pagination UI implemented)
    - Selectable rows with multi-selection
    - Status indicators (Activo/Hecho)
    - Check-in indicators
  
  - **Search & Filter**:
    - Search by name, email, phone
    - Filter buttons: "En deuda", "Activos", "Recall"
    - Filter state tracking
  
  - **Actions**:
    - "Añadir paciente" button → Opens AddPatientModal
    - Bulk actions: Status change, Check-in, Delete, More options
  
  - **Modals**:
    - AddPatientModal (see section 3.1)
    - PatientRecordModal (see section 3.2)

#### `/pacientes/ficha` - Patient Record
- **File**: `src/app/pacientes/ficha/page.tsx`
- **Implementation**: Currently routes to `/pacientes` with modal state
- **Opens**: PatientRecordModal (multi-tab interface)

#### `/agenda` - Calendar & Appointments
- **File**: `src/app/agenda/page.tsx`
- **Components**:
  - `WeekScheduler` - Main calendar view with:
    - Time slots (9:00-20:00 in 30-min increments)
    - 7 columns for weekdays (Mon-Sun)
    - Appointment cards with styling
    - Event detail overlay
    - Click to create appointment
    - Appointment details showing:
      - Title, patient full name
      - Date, duration
      - Professional assigned
      - Phone/email
      - Economic amount & status
      - Location, notes

#### `/gestion` - Management Dashboard
- **File**: `src/app/gestion/page.tsx`
- **Layout Structure**:
  - HeaderControls: Date navigator + Range selector + Report button
  - Row 1 - Stats: IncomeTypes + PatientsSummary + ProductionTotalCard
  - Row 2 - Charts: BillingLineChart + SpecialtyDonut
  - Row 3 - Analytics: AccountingPanel + ProfessionalBars
- **Components Used**:
  - `BillingLineChart` - Recharts line chart (brand vs accent comparison)
  - `SpecialtyDonut` - Donut chart by specialty
  - `ProfessionalBars` - Bar chart by professional
  - `AccountingPanel` - Accounting metrics
  - `PatientsSummary` - Patient statistics
  - `ProductionTotalCard` - Production KPI

---

## 3. PATIENT MANAGEMENT - AddPatient Multi-Step Modal

### 3.1 AddPatientModal Architecture
- **File**: `src/components/pacientes/modals/add-patient/AddPatientModal.tsx`
- **Size**: 68.25rem × 60rem (scales to fit 85vh max)
- **State Management**: All state in parent component with prop drilling
- **Step Flow**:
  1. Paciente (Patient basics)
  2. Contacto (Contact info)
  3. Administrativo (Admin/business info)
  4. Salud (Health info)
  5. Consentimientos (Consent & documents)
  6. Resumen (Summary/review)

### 3.2 Step Components & Data Models

#### Step 1: AddPatientStepPaciente
**File**: `src/components/pacientes/modals/add-patient/AddPatientStepPaciente.tsx`
**Collects**:
```typescript
{
  nombre: string                    // Patient name
  apellidos: string                 // Surname
  fechaNacimiento: Date | null      // Date of birth (custom date picker)
  dni: string                       // DNI/NIE number
  sexo: string                      // Biological sex (select)
  idioma: string                    // Preferred language (select)
  imageProfile?: File               // Avatar photo (camera/upload)
}
```
**Features**:
- Avatar capture/upload via `AvatarImageDropdown`
- Custom date picker with month/year navigation
- Popover positioning calculations

#### Step 2: AddPatientStepContacto
**File**: `src/components/pacientes/modals/add-patient/AddPatientStepContacto.tsx`
**Collects**:
```typescript
{
  telefono: string                  // Phone number (with country code selector)
  email: string                     // Email address
  contactPreferences: {             // Contact methods (checkboxes)
    whatsapp: boolean
    sms: boolean
    email: boolean
    llamada: boolean
  }
  recordatorios: boolean            // Reminders toggle
  marketing: boolean                // Marketing communications toggle
  referidoPor?: string              // Referred by (optional)
}
```
**Features**:
- Country code dropdown (+34, +1, +33, +44)
- Contact preference checkboxes (grid layout)
- Toggle switches for reminders/marketing

#### Step 3: AddPatientStepAdministrativo
**File**: `src/components/pacientes/modals/add-patient/AddPatientStepAdministrativo.tsx`
**Collects**:
```typescript
{
  profesional: string               // Referring professional (select)
  canal: string                     // Acquisition channel (select)
  cobertura: string                 // Insurance coverage (select)
  pais: string                      // Country (select)
  pago1: string                     // Primary payment method (select)
  pago2: string                     // Secondary payment method (select)
  financiacion: string              // Financing option (select)
  cif: string                       // Company CIF/NIF
  facturaEmpresa: boolean           // Invoice to company toggle
  calle: string                     // Street address
  ciudad: string                    // City
  provincia: string                 // Province/Region
  codigoPostal: string              // Postal code
  notas: string                     // Administrative notes (textarea)
}
```
**Features**:
- Multiple select dropdowns with predefined options
- Address autocomplete using Nominatim API (OpenStreetMap)
- Company invoice toggle
- Scrollable content area

#### Step 4: AddPatientStepSalud
**File**: `src/components/pacientes/modals/add-patient/AddPatientStepSalud.tsx`
**Collects**:
```typescript
{
  alergiasText: string              // Allergies (textarea)
  medicamentos: string              // Medications (textarea) - placeholder only
  embarazo: boolean                 // Pregnancy toggle
  tabaquismo: boolean               // Smoking status toggle
  antecedentes: string              // Medical history (select)
  miedo: string                     // Fear/anxiety level (select)
}
```
**Features**:
- Health history toggles
- Medical condition selects
- Allergies free-text entry

#### Step 5: AddPatientStepConsentimientos
**File**: `src/components/pacientes/modals/add-patient/AddPatientStepConsentimientos.tsx`
**Collects**:
```typescript
{
  consentimientos: {
    informativoGeneral: boolean     // General info consent
    proteccionDatos: boolean        // Data protection consent
    cisionImagenes: boolean         // Image rights consent
  }
  documentos: {
    derivacion?: File               // Referral document
    informes?: File                 // Reports
    rx?: File                       // X-ray images
    fotos?: File                    // Photos
  }
  marketing: boolean                // Marketing materials consent
}
```
**Features**:
- Document upload (derivation, reports, RX, photos)
- File preview with delete option
- Consent toggles for marketing/images

#### Step 6: AddPatientStepResumen
**File**: `src/components/pacientes/modals/add-patient/AddPatientStepResumen.tsx`
**Displays**:
- Patient avatar + full name
- Email + phone (with icons)
- Allergies (pills)
- Administrative notes
- Consent status summary
- Reminder/marketing preferences

### 3.3 Shared Input Components
**File**: `src/components/pacientes/modals/add-patient/AddPatientInputs.tsx`

**Exported Components**:
```typescript
TextInput({
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: (v: string) => void
})

SelectInput({
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  options?: { label: string; value: string }[]
})

TextArea({
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
})

AutocompleteInput({
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: (v: string) => void
  onSelect?: (suggestion: {
    display: string
    street: string
    city: string
    postcode: string
    province: string
    country: string
    countryCode: string
  }) => void
})

ToggleInput({
  ariaLabel: string
  checked: boolean
  onChange: (v: boolean) => void
})

FieldLabel({ children: React.ReactNode })
```

**Input Features**:
- Custom styling with CSS variables
- Keyboard support (Escape to close dropdowns)
- Outside-click detection for dropdowns
- Address autocomplete (Nominatim OpenStreetMap API)
- All state managed by parent (controlled components)

### 3.4 Date Picker Component
**File**: `src/components/pacientes/modals/add-patient/AddPatientDatePicker.tsx`
- Custom date picker (not Material-UI)
- Month/year navigation
- 6-week calendar grid
- Scale adjustments for viewport fitting
- Popover positioning logic

### 3.5 Modal State Management
**Prop Drilling Pattern** in AddPatientModal:
```typescript
// Step-specific state
const [step, setStep] = useState<'paciente' | 'contacto' | ... | 'resumen'>()

// Calendar state (date picker)
const [selectedDate, setSelectedDate] = useState<Date | null>(null)
const [viewMonth, setViewMonth] = useState<number>()
const [viewYear, setViewYear] = useState<number>()

// Step data state (24+ individual state variables)
const [nombre, setNombre] = useState<string>('')
const [apellidos, setApellidos] = useState<string>('')
// ... (one state for each field)

// Toggle states
const [contactoToggles, setContactoToggles] = useState({
  recordatorios: false,
  marketing: false
})
const [adminFacturaEmpresa, setAdminFacturaEmpresa] = useState(false)
const [saludToggles, setSaludToggles] = useState({
  embarazo: false,
  tabaquismo: false
})
```

**No Context/Redux**: All state lives in AddPatientModal parent, passed down as props.

---

## 4. PATIENT RECORD MODAL

### 4.1 PatientRecordModal
**File**: `src/components/pacientes/modals/patient-record/PatientRecordModal.tsx`
- **Size**: 93.75rem × 56.25rem
- **Layout**: Split view (left nav + right content)
- **Tabs**:
  1. Resumen (Summary)
  2. Historial clínico (Clinical history)
  3. Imágenes RX (X-ray images)
  4. Presupuestos y pagos (Budgets & payments)
  5. Consentimientos (Consents)

### 4.2 Tab Components

#### ClientSummary
**File**: `src/components/pacientes/modals/patient-record/ClientSummary.tsx`
- Patient avatar + profile photo editing
- Name, email, phone display
- Alert/notes section
- Upcoming appointments section
- Patient status indicators
- Quick budget button

#### ClinicalHistory
**File**: `src/components/pacientes/modals/patient-record/ClinicalHistory.tsx`
- Tab filter: Próximas, Pasadas, Confirmadas, Inasistencia
- SOAP notes display
- Odontograma integration (dental chart)
- Attached files (procedures, notes)
- Keyboard navigation support

#### RxImages
**File**: `src/components/pacientes/modals/patient-record/RxImages.tsx`
- Before/after photo gallery
- 3D scanner images
- Intraoral capture
- Photo upload/management

#### BudgetsPayments
**File**: `src/components/pacientes/modals/patient-record/BudgetsPayments.tsx` (1393 lines)
- Budget proposals list
- Payment tracking
- Embedded financing options
- Invoices/receipts management
- Payment reconciliation
- **Nested Modal**: QuickBudgetModal (quick proposal creation)

#### Consents
**File**: `src/components/pacientes/modals/patient-record/Consents.tsx`
- Consent document list
- Upload new consent
- Consent signatures
- Compliance tracking
- **Nested Modal**: UploadConsentModal

### 4.3 Specialized Modals
- **OdontogramaModal** (16.6KB) - Dental chart interactive editor
- **ProposalCreationModal** (55KB) - Complex budget creation with line items
- **QuickBudgetModal** - Simplified proposal form
- **UploadConsentModal** - Consent document upload

---

## 5. CALENDAR & APPOINTMENTS (AGENDA)

### 5.1 WeekScheduler
**File**: `src/components/agenda/WeekScheduler.tsx`
- **Time Grid**:
  - Hours: 9:00 - 20:00
  - 30-min increments (23 time slots)
  - 7 days (Mon-Sun)
- **Event Management**:
  - Drag-drop positioning (via CSS positioning)
  - Click event to show detail overlay
  - Create appointment modal
  - Event styling by status/type

### 5.2 Related Components
- **DayCalendar** - Single day view
- **MonthCalendar** - Month overview
- **AppointmentDetailOverlay** - Event detail popup
- **AppointmentSummaryCard** - Event card preview
- **CreateAppointmentModal** - New appointment form
- **ParteDiarioModal** - Daily report form
- **MultiDatePickerInput** - Multi-date selection
- **DateTimeInput** - Date/time combined input

### 5.3 Event Type Definition
**File**: `src/components/agenda/types.ts`
```typescript
export type EventDetail = {
  title: string
  date: string
  duration?: string
  patientFull: string
  patientPhone?: string
  patientEmail?: string
  referredBy?: string
  professional: string
  professionalAvatar?: string
  economicAmount?: string
  economicStatus?: string
  notes?: string
  locationLabel: string
  patientLabel: string
  professionalLabel: string
  economicLabel?: string
  notesLabel?: string
}

export type AgendaEvent = {
  id: string
  top: string                    // CSS positioning
  height: string
  title: string
  patient: string
  box: string
  timeRange: string
  backgroundClass: string
  borderClass?: string
  detail?: EventDetail
}
```

---

## 6. MANAGEMENT DASHBOARD (GESTION)

### 6.1 Layout & Components
**File**: `src/app/gestion/page.tsx`
**Grid Structure**:
```
Row 1: [IncomeTypes] [PatientsSummary] [ProductionTotalCard]
Row 2: [BillingLineChart    ] [SpecialtyDonut          ]
Row 3: [AccountingPanel      ] [ProfessionalBars       ]
```

### 6.2 Dashboard Components

#### BillingLineChart
- Recharts line chart
- Mock data (12 months: Jan-Dec)
- Brand line (actual) vs Accent line (comparison)
- Y-axis labels: 90K, 70K, 50K, 30K, 10K, 0
- Current month highlight

#### SpecialtyDonut
- Donut chart by dental specialty
- Legend with percentages

#### ProfessionalBars
- Bar chart showing production by professional
- Recent updates tracking

#### AccountingPanel
- Financial metrics
- Income/expense tracking

#### HeaderControls
- DateNavigator (custom date range selector)
- Range filter dropdown (Día/Semana/Mes/Año)
- Add report button

---

## 7. AUTHENTICATION & LAYOUT

### 7.1 Pre-Auth Pages

#### Landing (/)
**File**: `src/app/page.tsx`
- Logo animation component
- Background gradient overlay
- Link to login/register

#### Login (/login)
- Mock form (not connected to backend)
- Email/password validation
- Remember me option
- Error message: "La autenticación aún no está conectada"

#### Register (/register)
- RegisterLandingCard: Email capture
- EmailRegisterModal: Multi-step registration (form + photo)
- AddProfilePhotoStep: Camera/file upload

### 7.2 Layout Components

#### MainLayout
**File**: `src/components/layout/Layout.tsx`
- TopBar with logo + user profile
- Sidebar with navigation
- Navigation structure:
  - Top items: Agenda, Caja (Cash), Pacientes
  - Bottom items: Gestión (Management)
- CTA button: "Añadir" dropdown menu
  - Nueva cita
  - Nuevo presupuesto
  - Nuevo paciente

#### TopBar
**File**: `src/components/layout/TopBar.tsx`
- Logo (32x32)
- Logo expanded (96x20)
- User avatar (8x8, rounded)
- User name display
- Settings button

#### Sidebar
**File**: `src/components/layout/Sidebar.tsx`
- Navigation items (NavElement)
- CTA button (CTANav) with dropdown menu
- Sections: "Administración", "Gestión"
- Collapsible state support

#### NavElement
**File**: `src/components/layout/NavElement.tsx`
- Individual nav item with icon + label
- Active state highlighting
- Link to routes

#### CTANav
**File**: `src/components/layout/CTANav.tsx`
- Dropdown menu button
- Menu items list
- Click-outside detection

---

## 8. DATA TYPES & MODELS

### 8.1 Layout Types
**File**: `src/types/layout.ts`
```typescript
export type NavState = 'Default' | 'Hover' | 'Clicked'

export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
}

export interface SidebarProps {
  itemsTop: NavItem[]
  itemsBottom?: NavItem[]
  cta?: {
    label: string
    onClick?: () => void
  }
  collapsed?: boolean
  onToggleCollapsed?: (next: boolean) => void
}

export interface TopBarProps {
  userName: string
  userAvatarUrl?: string
}

export interface LayoutProps {
  children: React.ReactNode
}
```

### 8.2 Patient Record Types
**Inferred from components** (no centralized type file):
```typescript
// Patient basic info
type Patient = {
  id: string
  nombre: string
  apellidos: string
  dni: string
  fechaNacimiento: Date
  sexo: string
  idioma: string
  avatar?: string
}

// Contact info
type ContactInfo = {
  telefono: string
  email: string
  contactPreferences: {
    whatsapp: boolean
    sms: boolean
    email: boolean
    llamada: boolean
  }
}

// Clinical data
type ClinicalRecord = {
  alergias: string[]
  medicamentos: string[]
  antecedentes: string
  miedo: string
  embarazo: boolean
  tabaquismo: boolean
}

// Administrative
type AdminInfo = {
  profesional: string
  canal: string
  cobertura: string
  pais: string
  pago1: string
  pago2: string
  financiacion: string
  cif: string
  direccion: {
    calle: string
    ciudad: string
    provincia: string
    codigoPostal: string
  }
  notas: string
  facturaEmpresa: boolean
}

// Appointment
type Appointment = {
  id: string
  patientId: string
  date: Date
  startTime: string
  duration: string
  professional: string
  status: 'confirmada' | 'pendiente' | 'completada' | 'cancelada'
  notes?: string
  economicAmount?: string
}
```

---

## 9. STYLING & THEMING

### 9.1 Design System
**File**: `src/app/globals.css`
- CSS Custom Properties (variables) for all colors, spacing, typography
- Dark mode ready (CSS variables)

**Color Palette**:
```
Brand (Primary):   #F0FAFA - #1E4947 (10 shades)
Neutral (Gray):    #FFFFFF - #24282C (10 shades)
Success (Green):   #E9F8F1, #A0E3C3, #2E7D5B, #1D4F3A
Warning (Amber):   #FFF7E8, #FFD188, #D97706, #92400E
Error (Red):       #FEEBEC, #F7B7BA, #B91C1C, #7F1D1D
Info (Purple):     #F3EAFF, #D4B5FF, #7825EB, #5A1EAF
```

**Spacing System**:
- topbar: 64px
- sidebar (expanded): 256px
- sidebar (collapsed): 80px
- navItem height: 48px
- CTA button height: 56px
- gapSm: 8px
- gapMd: 16px
- plNav (padding-left nav): 24px

**Typography**:
- Title/Medium: Inter 18/28 500
- Body/Medium: Inter 16/24 400
- Label/Small: Inter 12/16 400

**Border Radius**:
- Rounded: 8px (default)
- Pill: 136px (for buttons)
- XL: 16px (content area)

### 9.2 Tailwind Configuration
**File**: `tailwind.config.ts`
- Extended color palette
- Custom container sizes (dashboard: 104rem, content: 100rem, narrow: 80rem)
- Responsive utilities
- Custom CSS grid utilities
- Dashboard-specific utility classes

### 9.3 CSS-in-JS Patterns
- Inline styles for calculated values
- Inline className strings with conditional logic
- CSS variables for responsive scaling
- Transform origin for scaled modals

---

## 10. COMPONENT PATTERNS & BEST PRACTICES

### 10.1 Component Patterns Used

**1. Controlled Components** (AddPatient inputs)
- All state in parent (AddPatientModal)
- Props for value + onChange callback
- Enables data collection and step navigation

**2. Render Props / Composition**
- Tab components receive onClose callback
- Allows parent modal to control closing

**3. Portal-based Dropdowns**
- createPortal for select dropdowns
- Prevents z-index stacking issues

**4. Prop Drilling for Configuration**
- Layout components accept config props
- Main layout wrapper supports container/padding strategies

**5. State Lifting**
- Filter state in pacientes page (not table component)
- Selection state in table parent

### 10.2 Accessibility Features
- Semantic HTML (buttons, inputs, labels)
- aria-label for icon buttons
- aria-pressed for toggle states
- aria-modal for modals
- aria-hidden for decorative elements
- Keyboard navigation (Escape to close modals)
- Focus management (no automatic focus trapping currently)

### 10.3 Performance Patterns
- React.useCallback for event handlers
- React.useMemo for computed values (calendar grids)
- Ref-based state for DOM measurements
- Image lazy loading (loading="lazy")
- Object URL management for file previews

---

## 11. FORM VALIDATION

### 11.1 Email Registration
**File**: `src/components/auth/EmailRegisterModal.tsx`
**Password validation** (regex-based):
```typescript
const isPasswordValid = useMemo(() => {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-ZÁÉÍÓÚÜÑ]/.test(password)      // Spanish uppercase
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^\p{L}\p{N}\s]/u.test(password)     // Unicode symbols
  return hasMinLength && hasUppercase && hasNumber && hasSymbol
}, [password])
```

### 11.2 Login Form
**File**: `src/app/login/page.tsx`
```typescript
function validateEmail(value: string) {
  return /.+@.+\..+/.test(value)
}
```

### 11.3 AddPatient Validation
- Most fields optional (no required validation shown)
- Address autocomplete with OpenStreetMap Nominatim API
- Date validation via date picker component

---

## 12. STATE MANAGEMENT APPROACH

### 12.1 Current Pattern: Local State + Prop Drilling
- **No Redux/Zustand/Recoil**: Simple local React state
- **No Context API**: State lives in component
- **Prop drilling**: Parent passes state + setters to children
- **Example**: AddPatientModal manages all 6 steps + 24+ fields

### 12.2 Implications for Backend Integration

**Challenge**: Current architecture difficult to scale
- No centralized data store
- Each modal/page manages its own state
- No persistence layer
- Would need:
  - Context provider for user session
  - API client layer for requests
  - Global state manager (Redux/Zustand) for cached data
  - Error boundary for API failures

---

## 13. MOCK DATA & CURRENT STATE

### 13.1 Pacientes Page
- **MOCK_PATIENTS**: 12 hardcoded patient records
- **Tags**: 'deuda', 'activo', 'recall' (distributed across records)
- **No API calls**: Filter/search on client side only

### 13.2 Gestion Dashboard
- **CHART_DATA**: 12 months of mock billing data
- **Recharts**: Direct mock data (no data fetching)
- **Professional bars**: Mock data passed directly

### 13.3 Agenda
- **Time grid**: Static (9:00-20:00, 30-min slots)
- **Sample events**: Hardcoded appointment cards
- **No data persistence**: State only in component memory

---

## 14. API INTEGRATION POINTS (FOR BACKEND)

### 14.1 Authentication Endpoints Needed
```
POST /auth/login
  request: { email: string, password: string }
  response: { token: string, user: User }

POST /auth/register
  request: { email, name, surname, password }
  response: { token: string, user: User }

POST /auth/logout
  response: { success: boolean }

GET /auth/me
  response: { user: User }
```

### 14.2 Patient Endpoints Needed
```
GET /patients                        # List all patients
  query: { skip?, take?, search?, filter? }
  response: { data: Patient[], total: number }

POST /patients                       # Create patient
  request: { AddPatientFormData }
  response: { patient: Patient }

GET /patients/:id                    # Get patient detail
  response: { patient: PatientWithRecords }

PUT /patients/:id                    # Update patient
  request: { Partial<Patient> }
  response: { patient: Patient }

DELETE /patients/:id                 # Delete patient
  response: { success: boolean }

POST /patients/bulk-update          # Bulk actions
  request: { ids: string[], action: string, data: any }
  response: { success: boolean }
```

### 14.3 Appointment Endpoints Needed
```
GET /appointments                    # List appointments
  query: { date?, patientId?, professionalId? }
  response: { appointments: Appointment[] }

POST /appointments                   # Create appointment
  request: { CreateAppointmentDTO }
  response: { appointment: Appointment }

PUT /appointments/:id                # Update appointment
  request: { Partial<Appointment> }
  response: { appointment: Appointment }

DELETE /appointments/:id             # Cancel appointment
  response: { success: boolean }
```

### 14.4 Dashboard/Gestion Endpoints Needed
```
GET /analytics/production            # Production metrics
  response: { productionTotal: number, byProfessional: {...}, bySpecialty: {...} }

GET /analytics/billing               # Billing data
  response: { data: { month: string, brand: number, accent: number }[] }

GET /analytics/income-types          # Income breakdown
  response: { incomeBreakdown: {...} }

GET /analytics/patient-summary       # Patient statistics
  response: { today: number, week: number, confirmed: number }
```

### 14.5 File Upload Endpoints Needed
```
POST /upload                         # General file upload
  request: FormData { file: File }
  response: { url: string, fileId: string }

POST /patients/:id/avatar            # Avatar upload
  request: FormData { file: File }
  response: { avatarUrl: string }

POST /patients/:id/documents         # Document upload (consent, RX, etc.)
  request: FormData { files: File[], type: string }
  response: { documents: Document[] }
```

---

## 15. KEY FEATURES ALREADY BUILT

### 15.1 Patient Management
- [x] Patient list with filtering
- [x] Multi-step patient creation wizard (6 steps)
- [x] Patient record modal with 5 tabs
- [x] Clinical history tracking
- [x] Consent management
- [x] Budget/proposal creation
- [x] Invoice tracking
- [x] Patient search & filtering
- [x] Avatar/photo management

### 15.2 Calendar & Appointments
- [x] Week view scheduler
- [x] Month calendar view
- [x] Day calendar view
- [x] Appointment details overlay
- [x] Appointment creation modal
- [x] Time slot management
- [x] Professional assignment
- [x] Daily report (Parte Diario) modal

### 15.3 Management Dashboard
- [x] Production analytics
- [x] Billing line chart (Recharts)
- [x] Specialty breakdown donut chart
- [x] Professional productivity bars
- [x] KPI cards (income types, patient summary)
- [x] Date range navigation
- [x] Report generation UI

### 15.4 Authentication
- [x] Login page with validation
- [x] Registration flow with photo upload
- [x] Password strength validation (8 chars, uppercase, number, symbol)
- [x] Email validation
- [x] Remember me option

### 15.5 UI/UX
- [x] Responsive layout (sidebar + main content)
- [x] Color-coded status indicators
- [x] Search functionality
- [x] Filter pills
- [x] Modal overlay system
- [x] Multi-step form navigation
- [x] Table with pagination UI
- [x] Data visualization (charts)
- [x] Icon library (Material-UI)

---

## 16. FEATURES NOT YET BUILT / PLACEHOLDER

### 16.1 Missing Features
- [ ] Backend API integration (all endpoints)
- [ ] Authentication persistence (JWT/session storage)
- [ ] Real data fetching (all using mocks)
- [ ] Database persistence
- [ ] User profile/settings page
- [ ] Notifications/alerts system
- [ ] Real-time updates (WebSocket)
- [ ] Email sending (confirmations, reminders)
- [ ] Document generation (invoices, proposals as PDFs)
- [ ] Multi-user/permissions system
- [ ] Audit logging
- [ ] Backup/export functionality

### 16.2 Mock Implementations
- Login: Shows "La autenticación aún no está conectada"
- Pacientes table: 12 hardcoded records
- Agenda: Static event list
- Charts: Mock monthly data
- All modals: State only (no submission)

---

## 17. DIRECTORY REFERENCE

### Component Files (by feature)

**Authentication**:
- `/src/components/auth/LoginPage.tsx` - Main login (is page actually)
- `/src/components/auth/RegisterLandingCard.tsx`
- `/src/components/auth/EmailRegisterModal.tsx`
- `/src/components/auth/AddProfilePhotoStep.tsx`
- `/src/components/auth/LandingAnimation.tsx`

**Patient Management**:
- `/src/components/pacientes/SelectorCard.tsx`
- `/src/components/pacientes/PatientFichaModal.tsx`
- `/src/components/pacientes/UserModal.tsx`
- `/src/components/pacientes/AvatarImageDropdown.tsx`
- `/src/components/pacientes/ClientSummary.tsx`
- `/src/components/pacientes/Consents.tsx`

**Add Patient Modal (6 steps)**:
- `/src/components/pacientes/modals/add-patient/AddPatientModal.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientStepPaciente.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientStepContacto.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientStepAdministrativo.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientStepSalud.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientStepConsentimientos.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientStepResumen.tsx`
- `/src/components/pacientes/modals/add-patient/AddPatientInputs.tsx` (shared inputs)
- `/src/components/pacientes/modals/add-patient/AddPatientDatePicker.tsx`

**Patient Record Modal (5 tabs)**:
- `/src/components/pacientes/modals/patient-record/PatientRecordModal.tsx`
- `/src/components/pacientes/modals/patient-record/ClientSummary.tsx`
- `/src/components/pacientes/modals/patient-record/ClinicalHistory.tsx`
- `/src/components/pacientes/modals/patient-record/RxImages.tsx`
- `/src/components/pacientes/modals/patient-record/BudgetsPayments.tsx`
- `/src/components/pacientes/modals/patient-record/Consents.tsx`
- `/src/components/pacientes/modals/patient-record/OdontogramaModal.tsx`
- `/src/components/pacientes/modals/patient-record/ProposalCreationModal.tsx`
- `/src/components/pacientes/modals/patient-record/QuickBudgetModal.tsx`
- `/src/components/pacientes/modals/patient-record/UploadConsentModal.tsx`

**Calendar & Agenda**:
- `/src/components/agenda/WeekScheduler.tsx` (main)
- `/src/components/agenda/DayCalendar.tsx`
- `/src/components/agenda/MonthCalendar.tsx`
- `/src/components/agenda/modals/AppointmentDetailOverlay.tsx`
- `/src/components/agenda/AppointmentSummaryCard.tsx`
- `/src/components/agenda/modals/CreateAppointmentModal.tsx`
- `/src/components/agenda/modals/ParteDiarioModal.tsx`
- `/src/components/agenda/MultiDatePickerInput.tsx`
- `/src/components/agenda/DateTimeInput.tsx`
- `/src/components/agenda/InputText.tsx`
- `/src/components/agenda/SelectField.tsx`
- `/src/components/agenda/types.ts`

**Management Dashboard**:
- `/src/components/gestion/HeaderControls.tsx`
- `/src/components/gestion/DateNavigator.tsx`
- `/src/components/gestion/BillingLineChart.tsx`
- `/src/components/gestion/SpecialtyDonut.tsx`
- `/src/components/gestion/ProfessionalBars.tsx`
- `/src/components/gestion/AccountingPanel.tsx`
- `/src/components/gestion/PatientsSummary.tsx`
- `/src/components/gestion/IncomeTypes.tsx`
- `/src/components/gestion/ProductionTotalCard.tsx`

**Layout**:
- `/src/components/layout/Layout.tsx` (main layout)
- `/src/components/layout/TopBar.tsx`
- `/src/components/layout/Sidebar.tsx`
- `/src/components/layout/NavElement.tsx`
- `/src/components/layout/CTANav.tsx`
- `/src/components/layout/MobileLayout.tsx`
- `/src/components/layout/BottomBar.tsx`

**Other**:
- `/src/components/MainLayout.tsx` (responsive wrapper)
- `/src/components/LogoAnimation.tsx`

---

## 18. SCRIPTS & BUILD

### 18.1 NPM Scripts
```json
{
  "dev": "next dev --turbopack",           # Development with TurboPack
  "build": "next build --turbopack",       # Production build
  "start": "next start",                   # Production server
  "lint": "eslint",                        # Linting
  "clean": "rm -rf node_modules .next && pnpm install",
  "typecheck": "tsc --noEmit"              # TypeScript check
}
```

### 18.2 Environment
- Node: >= 18.0.0
- pnpm: >= 8.0.0

---

## 19. RECOMMENDATIONS FOR BACKEND DEVELOPER

### 19.1 Database Schema Overview
```sql
-- Users (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  name VARCHAR,
  surname VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  clinic_id UUID,  -- multi-tenant
  nombre VARCHAR,
  apellidos VARCHAR,
  dni VARCHAR UNIQUE,
  fecha_nacimiento DATE,
  sexo VARCHAR,
  idioma VARCHAR,
  avatar_url VARCHAR,
  -- Contact
  telefono VARCHAR,
  email VARCHAR,
  contact_preferences JSONB,
  recordatorios BOOLEAN,
  marketing BOOLEAN,
  -- Admin
  profesional_id UUID,
  canal VARCHAR,
  cobertura VARCHAR,
  pais VARCHAR,
  pago1 VARCHAR,
  pago2 VARCHAR,
  financiacion VARCHAR,
  factura_empresa BOOLEAN,
  cif VARCHAR,
  -- Address
  calle VARCHAR,
  ciudad VARCHAR,
  provincia VARCHAR,
  codigo_postal VARCHAR,
  notas TEXT,
  -- Health
  alergias TEXT[],
  medicamentos TEXT[],
  antecedentes VARCHAR,
  miedo VARCHAR,
  embarazo BOOLEAN,
  tabaquismo BOOLEAN,
  status VARCHAR,  -- Activo/Hecho/Pausado
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  professional_id UUID REFERENCES users,
  date DATE,
  start_time TIME,
  end_time TIME,
  title VARCHAR,
  status VARCHAR,  -- confirmada/pendiente/completada/cancelada
  economicAmount DECIMAL,
  economicStatus VARCHAR,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Clinical records
CREATE TABLE clinical_records (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  date TIMESTAMP,
  title VARCHAR,
  soap_notes TEXT,
  attached_files JSONB,
  created_by UUID REFERENCES users,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Budgets/Proposals
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  professional_id UUID REFERENCES users,
  total DECIMAL,
  status VARCHAR,  -- draft/sent/accepted/completed
  line_items JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Consents
CREATE TABLE consents (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  type VARCHAR,  -- general_info/data_protection/image_rights
  signed BOOLEAN,
  signed_at TIMESTAMP,
  document_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Documents (RX, photos, etc.)
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  type VARCHAR,  -- rx/photo/report/derivation
  url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 19.2 Priority Order for Integration
1. **Authentication**: Login/Register endpoints + JWT
2. **Patients API**: CRUD + list with search/filter
3. **Appointments API**: CRUD for calendar
4. **File uploads**: Avatar, documents, images
5. **Dashboard endpoints**: Analytics data
6. **Consents & Budgets**: Document management

### 19.3 Frontend Data Flow Adaptation
1. Create API client layer:
   ```typescript
   // src/lib/api/patients.ts
   export const patientsAPI = {
     list: (filters?) => fetch('/api/patients?...'),
     create: (data) => fetch('/api/patients', { method: 'POST', body: data }),
     get: (id) => fetch(`/api/patients/${id}`),
     update: (id, data) => fetch(`/api/patients/${id}`, { method: 'PUT', body: data }),
     delete: (id) => fetch(`/api/patients/${id}`, { method: 'DELETE' })
   }
   ```

2. Add Context for session:
   ```typescript
   // src/context/AuthContext.tsx
   export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null)
     // Fetch user on mount, handle logout, etc.
   }
   ```

3. Replace mock data with API calls:
   ```typescript
   // Before (mock):
   const MOCK_PATIENTS = [...]
   
   // After (API):
   const [patients, setPatients] = useState([])
   useEffect(() => {
     patientsAPI.list().then(setPatients)
   }, [])
   ```

4. Update form submissions:
   ```typescript
   // AddPatientModal onContinue (step 6):
   const handleCreatePatient = async () => {
     const formData = { nome, apellidos, ...allFieldsCollected }
     await patientsAPI.create(formData)
     setIsOpen(false)
   }
   ```

---

## 20. SUMMARY

**Frontend Status**: 
- ~95% UI complete with mock data
- Component structure ready for backend
- No API integration layer yet
- No authentication persistence
- No database connection

**For Backend Developer**:
- UI screens are finalized (minimal changes expected)
- Focus on building RESTful API matching the modal/table structures
- File upload handling needed for avatars & documents
- Multi-tenant support recommended (clinic_id field)
- Implement standard CRUD operations for all resources

**Loom Script Notes**:
- Show the 6-step AddPatient modal (largest feature, demonstrates complexity)
- Show patient list with filters and pagination UI
- Show calendar week view with appointment details
- Show dashboard analytics (demonstrates Recharts integration)
- Walk through the type definitions and component props
- Explain the prop drilling pattern and data flow
- Show mock data locations (where to replace with API calls)
- Demonstrate adding an API call to pacients list (before/after)

