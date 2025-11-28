# KlinikOS Loom Video Script Outline
## Frontend to Backend Integration Walkthrough

---

## INTRO (0:00-1:00)
"Hello! I'm going to walk you through the klinikOS frontend architecture. This is a dental clinic management system built with Next.js, React, and Tailwind CSS. By the end of this video, you'll understand how the UI is structured, where data flows, and exactly what backend endpoints you need to build."

---

## SECTION 1: HIGH-LEVEL ARCHITECTURE (1:00-4:00)

### Show the file structure
- **Key takeaway**: Next.js App Router with organized components
- Show: `src/app` (pages), `src/components` (organized by feature), `src/types`

### Tech Stack Overview (brief)
- Next.js 15.5.4 (App Router)
- React 19.1.0
- TypeScript 5.0
- Tailwind CSS 4.0 + Custom CSS variables
- Material-UI icons
- Recharts for data visualization

### App Routes
Show the routing structure:
```
/ (Landing)
/login (Mock - auth not connected)
/register (Multi-step registration)
/pacientes (Patient list & management)
/agenda (Calendar scheduler)
/gestion (Dashboard/analytics)
```

---

## SECTION 2: AUTHENTICATION FLOW (4:00-7:00)

### Show `/login` page
- **Demo**: Walk through form fields
  - Email input with regex validation
  - Password with show/hide toggle
  - Remember me checkbox
  - Error message: "La autenticación aún no está conectada"
- **Point**: This is a placeholder, no actual API calls
- **What backend needs**: JWT auth endpoint returning user + token

### Show `/register` flow
- Email submission → Opens modal
- Multi-step form: Account details → Password → Profile photo
- **Password validation rules**: 8+ chars, uppercase (Spanish), number, symbol
- **Files**: `RegisterLandingCard.tsx` + `EmailRegisterModal.tsx` + `AddProfilePhotoStep.tsx`

### Backend Integration Point
```
POST /auth/login → { token, user }
POST /auth/register → { token, user }
GET /auth/me → { user } (for session persistence)
```

---

## SECTION 3: PATIENT MANAGEMENT - THE CORE FEATURE (7:00-18:00)

### Show `/pacientes` page
**This is the largest, most complex part of the app**

#### Top Section: KPI Cards
- 4 metric cards (Today's patients, Week's patients, Check-ins, Confirmed appointments)
- **Point**: These are hardcoded, will need API endpoints for real data

#### Middle Section: Search & Filters
- Search by name/email/phone (client-side filter currently)
- Filter buttons: "En deuda", "Activos", "Recall"
- **Point**: Will need backend search/filter endpoint

#### Table
- 12 mock patient rows with columns:
  - Patient name, next appointment, status, phone, check-in, financing, debt, last contact
- Selectable rows (multi-select with checkboxes)
- Pagination UI implemented but not functional
- **Point**: All data is hardcoded (MOCK_PATIENTS array)
- **Backend needed**: GET /patients with pagination, search, filtering

#### "Añadir paciente" Button → AddPatientModal

---

## SECTION 4: THE GIANT FEATURE - ADD PATIENT MODAL (18:00-35:00)

### Overview
- **Single modal with 6 sequential steps**
- **68.25rem × 60rem** (scales to fit 85vh)
- **All state in parent component** (prop drilling pattern)
- **630 lines of code** in main modal file

### Demo Each Step:

#### Step 1: Paciente (Patient Basics) (20:00-23:00)
- Avatar photo (camera/upload)
- Name + Surname
- Date of birth (custom date picker, not MUI)
- DNI/NIE
- Biological sex (dropdown)
- Preferred language (dropdown)
- **Point**: Custom date picker shows the complexity of the UI

**Code snippet to show**:
```typescript
const [nombre, setNombre] = useState<string>('')
const [apellidos, setApellidos] = useState<string>('')
const [selectedDate, setSelectedDate] = useState<Date | null>(null)
const [dni, setDni] = useState<string>('')
// ... etc
```

**Point**: Every field has individual state - not ideal for backend integration

#### Step 2: Contacto (Contact Info) (23:00-25:00)
- Phone + country code selector
- Email
- Contact preference checkboxes: WhatsApp, SMS, Email, Llamada (Call)
- Recordatorios toggle (Reminders)
- Marketing toggle (Marketing communications)
- **Point**: All toggles are tracked separately

#### Step 3: Administrativo (Admin/Business) (25:00-28:00)
- Professional dropdown (Referring professional)
- Acquisition channel (Canal)
- Insurance coverage (Cobertura)
- Country
- Payment methods (2 selects)
- Financing options
- Company invoice toggle
- CIF/NIF field
- **Address**: Shows autocomplete using OpenStreetMap Nominatim API
- Administrative notes (textarea)
- **Point**: Shows 13+ fields just for admin data

#### Step 4: Salud (Health) (28:00-30:00)
- Allergies (textarea) - free text, comma-separated
- Medications (placeholder only)
- Pregnancy toggle
- Smoking status toggle
- Medical history (select)
- Fear/anxiety level (select)
- **Point**: Health data collection for clinical use

#### Step 5: Consentimientos (Consent & Documents) (30:00-32:00)
- Consent buttons: General info, Data protection, Image rights
- Document uploads: Referral, Reports, X-rays, Photos
- File preview with delete option
- **Point**: Shows document upload handling

#### Step 6: Resumen (Summary/Review) (32:00-35:00)
- Avatar + full name display
- Email + phone (with icons)
- Allergies (displayed as pills)
- Administrative notes
- Consent summary
- Reminder/marketing preferences
- **Create Patient button** triggers submission
- **Point**: All collected data displayed for review before submission

### Data Flow Diagram to Explain
```
User fills Step 1 → State updated → Step 2 validation → 
User fills Step 2 → State updated → Step 3 validation → 
... (repeat 6 times) → Step 6 Resumen → 
Submit button → POST /patients { all_collected_data }
```

### Backend Integration
```typescript
// What the modal needs to send:
POST /patients {
  // Paciente
  nombre: string
  apellidos: string
  fechaNacimiento: Date
  dni: string
  sexo: string
  idioma: string
  avatar: File
  
  // Contacto
  telefono: string
  email: string
  contactoPreferences: { whatsapp, sms, email, llamada }
  recordatorios: boolean
  marketing: boolean
  
  // Administrativo
  profesionalId: string
  canal: string
  cobertura: string
  pais: string
  pago1: string
  pago2: string
  financiacion: string
  facturaEmpresa: boolean
  cif: string
  direccion: { calle, ciudad, provincia, codigoPostal }
  notas: string
  
  // Salud
  alergias: string[]
  medicamentos: string[]
  antecedentes: string
  miedo: string
  embarazo: boolean
  tabaquismo: boolean
  
  // Consentimientos
  consentimientos: { general, datosPersonales, imagenes }
  documentos: { derivacion?, informes?, rx?, fotos? }
}
```

---

## SECTION 5: PATIENT RECORD MODAL (35:00-42:00)

### Overview
- **93.75rem × 56.25rem** modal
- **Split layout**: Left nav (5 tabs) + Right content
- Opens when clicking patient row

### 5 Tabs Demo:

#### 1. Resumen (Summary)
- Patient avatar, name, email, phone
- Status indicators
- Upcoming appointments
- Quick budget button

#### 2. Historial Clínico (Clinical History)
- Filter: Próximas, Pasadas, Confirmadas, Inasistencia
- SOAP notes
- Odontograma (dental chart) integration
- Attached files

#### 3. Imágenes RX (X-ray Images)
- Before/after gallery
- 3D scanner images
- Intraoral photos

#### 4. Presupuestos y Pagos (Budgets & Payments)
- **1393 lines** - most complex component
- Proposal list
- Payment tracking
- Financing options
- Invoices

#### 5. Consentimientos (Consents)
- Consent document list
- Upload consent
- Signature tracking

### Backend Needed
```
GET /patients/:id → Full patient data + all related records
GET /patients/:id/clinical → Clinical history
GET /patients/:id/appointments → Appointments
GET /patients/:id/budgets → Budget proposals
GET /patients/:id/consents → Consent documents
```

---

## SECTION 6: CALENDAR & APPOINTMENTS (42:00-48:00)

### `/agenda` page overview
- **Week scheduler** showing Mon-Sun
- **Time slots**: 9:00 AM - 8:00 PM, 30-min increments
- **Appointment cards** positioned by CSS (top, height)
- Click to see detail overlay
- Create appointment button

### Components Shown
- `WeekScheduler.tsx` - Main container
- `AppointmentDetailOverlay.tsx` - Event popup
- `CreateAppointmentModal.tsx` - New appointment form

### Event Type Definition
```typescript
type AgendaEvent = {
  id: string
  title: string
  patient: string
  professional: string
  date: string
  duration: string
  economicAmount?: string
  notes?: string
}
```

### Backend Needed
```
GET /appointments?date=2024-11-27 → List day/week appointments
POST /appointments → Create appointment
PUT /appointments/:id → Update appointment
DELETE /appointments/:id → Cancel appointment
```

---

## SECTION 7: MANAGEMENT DASHBOARD (48:00-55:00)

### `/gestion` page overview
- **Professional management dashboard**
- **3 rows of cards/charts**

#### Row 1: Stat Cards
- Income types breakdown
- Patient summary (today, week, etc.)
- Production total

#### Row 2: Charts
- Billing line chart (Recharts) - 12 months with brand vs comparison
- Specialty donut chart

#### Row 3: Analytics
- Accounting panel
- Professional productivity bars

### Show Recharts Integration
- Mock data array with 12 months
- Line chart rendering
- Data structure for backend

### Backend Needed
```
GET /analytics/production
GET /analytics/billing?month=...
GET /analytics/income-types
GET /analytics/patient-summary
GET /analytics/professional-stats
```

---

## SECTION 8: STATE MANAGEMENT & DATA FLOW (55:00-60:00)

### Current Pattern: Prop Drilling
- **No Redux, no Context, no global state**
- **All state in component** → Props passed down
- **Example**: AddPatientModal has 24+ state variables
- **Problem**: Not scalable for backend integration

```typescript
// Current approach:
const [nombre, setNombre] = useState('')
const [apellidos, setApellidos] = useState('')
const [email, setEmail] = useState('')
// ... 21 more state variables

// These all need to be collected and sent to backend
const handleSubmit = async () => {
  await fetch('/api/patients', {
    method: 'POST',
    body: JSON.stringify({ nombre, apellidos, email, ... })
  })
}
```

### Recommended Architecture for Backend
1. Create API client layer (`src/lib/api/patients.ts`)
2. Add Context for authentication
3. Use local state + API responses
4. Handle loading/error states

---

## SECTION 9: MOCK DATA & WHAT'S NOT CONNECTED (60:00-65:00)

### What's Mocked
- **Login**: No actual auth, shows error message
- **Patient list**: 12 hardcoded records
- **Calendar**: Static appointment cards
- **Dashboard charts**: Hardcoded data

### Where to Replace Mock Data
Show specific files:
- `src/app/pacientes/page.tsx` - Line 169: MOCK_PATIENTS array
- `src/components/gestion/BillingLineChart.tsx` - Line 41: CHART_DATA array
- `src/components/agenda/WeekScheduler.tsx` - Hardcoded events

### Conversion Example
```typescript
// Before (mock):
const MOCK_PATIENTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `p-${i}`,
  name: 'Laura Rivas',
  // ...
}))

// After (API):
const [patients, setPatients] = useState([])
useEffect(() => {
  fetch('/api/patients')
    .then(r => r.json())
    .then(setPatients)
}, [])
```

---

## SECTION 10: API CHECKLIST FOR BACKEND (65:00-70:00)

### Must-Have Endpoints
```
AUTHENTICATION:
- POST /auth/login
- POST /auth/register
- GET /auth/me

PATIENTS:
- GET /patients (with pagination, search, filter)
- POST /patients
- GET /patients/:id
- PUT /patients/:id
- DELETE /patients/:id

APPOINTMENTS:
- GET /appointments?date=...
- POST /appointments
- PUT /appointments/:id
- DELETE /appointments/:id

ANALYTICS:
- GET /analytics/production
- GET /analytics/billing
- GET /analytics/income-types
- GET /analytics/patient-summary

FILE UPLOADS:
- POST /upload (avatar, documents)
```

### Data Types Backend Should Return
Show the component prop types to explain data structure

---

## OUTRO (70:00-72:00)
"So that's the klinikOS frontend! The UI is 95% complete with mock data. Your job is to build the backend API to feed real data into these components. Start with authentication, then patients (the biggest feature), then appointments and dashboard endpoints. 

All the component files are organized by feature, the types are documented, and the mock data shows exactly what structure the backend needs to return. Good luck, and let me know if you have any questions!"

---

## TIME BREAKDOWN
- Intro: 1 min
- Architecture: 3 mins
- Auth: 3 mins
- Patient Mgmt: 3 mins
- AddPatient (THE BIG ONE): 17 mins
- Patient Record: 7 mins
- Calendar: 6 mins
- Dashboard: 7 mins
- State Management: 5 mins
- Mock Data: 5 mins
- API Checklist: 5 mins
- Outro: 2 mins
**Total: 72 minutes**

---

## Screen Recording Tips
1. Start at fullscreen zoom (no zoom in during recording)
2. Highlight code as you explain (use IDE highlighting)
3. Show network tab to explain API calls (or would show after backend is built)
4. Use annotations to point to important files/sections
5. Play with modals slowly so viewers see the interaction
6. Point out the "Crear paciente" button and explain what happens (nothing now, but will call API)

---

## Key Points to Emphasize
1. **AddPatient modal is THE feature** - 6 steps, 30+ fields, very complex data collection
2. **All state is client-side right now** - Backend needs to handle persistence
3. **No API integration layer yet** - Frontend needs refactoring for scale
4. **Table/list pagination UI exists** - Just needs backend endpoint to wire up
5. **TypeScript types exist** - Use them to define database schemas
6. **Mock data is clear** - Easy to find and replace with API calls
7. **No authentication state persisted** - Need JWT in localStorage/cookie
