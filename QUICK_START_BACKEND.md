# Quick Start: Backend Integration Checklist

## Files Generated for You
1. **KLINIKOS_ARCHITECTURE_ANALYSIS.md** - Complete 20-section deep dive
2. **LOOM_SCRIPT_OUTLINE.md** - 72-minute video script with timing
3. **QUICK_START_BACKEND.md** - This file (TL;DR)

---

## TL;DR: What Frontend Is Built

### Current State
- UI is 95% complete
- All styling done (Tailwind + CSS variables)
- All components built
- All modals functional (but no submission)
- **0% backend integration**

### Current Architecture
- React state + prop drilling (no Redux/Context)
- Mock data arrays (12 patients, 12 months of chart data)
- No API client layer
- No authentication persistence
- No database calls

---

## The 5 Major Features

### 1. AUTHENTICATION (3 pages)
**Files**: `src/app/login/page.tsx`, `src/app/register/page.tsx`
- Login form: Email/password validation (no API)
- Register flow: Multi-step (form → photo)
- **Status**: UI done, no backend

**You need**:
```
POST /auth/login → { token, user }
POST /auth/register → { token, user }  
GET /auth/me → { user }
```

---

### 2. PATIENT MANAGEMENT (THE BIG ONE)
**Files**: `src/app/pacientes/page.tsx`, `AddPatientModal.tsx` (6 steps), `PatientRecordModal.tsx` (5 tabs)

#### Patient List (/pacientes)
- 12 mock patient rows
- Search/filter (client-side)
- Pagination UI (non-functional)
- KPI cards (hardcoded)

**You need**:
```
GET /patients?skip=0&take=12&search=...&filter=deuda
→ { data: Patient[], total: number }
```

#### Add Patient Modal (MASSIVE MODAL)
- **6 sequential steps** collecting 30+ fields
- All data in single component state
- Renders summary → submit button does nothing

**Step breakdown**:
1. Paciente: name, surname, DOB, DNI, sex, language, avatar
2. Contacto: phone, email, contact prefs, reminders, marketing
3. Administrativo: professional, channel, coverage, country, payment, financing, CIF, address, notes
4. Salud: allergies, medications, pregnancy, smoking, history, fear
5. Consentimientos: consents + document uploads
6. Resumen: review all + submit

**You need**:
```
POST /patients {
  // All fields from the 6 steps
  nombre, apellidos, fechaNacimiento, dni, sexo, idioma,
  telefono, email, contactoPreferences,
  profesional, canal, cobertura, pais, pago1, pago2, financiacion, cif, direccion, notas,
  alergias, medicamentos, embarazo, tabaquismo, antecedentes, miedo,
  consentimientos, documentos
}
→ { patient: Patient }
```

#### Patient Record Modal
- **5 tabs**: Summary, Clinical history, X-rays, Budgets, Consents
- Most complex: BudgetsPayments (1393 lines)
- Opens on patient row click

**You need**:
```
GET /patients/:id → { patient + all related records }
GET /patients/:id/clinical → { clinical_records[] }
GET /patients/:id/budgets → { budgets[] }
GET /patients/:id/consents → { consents[] }
```

---

### 3. CALENDAR & APPOINTMENTS
**Files**: `src/app/agenda/page.tsx`, `WeekScheduler.tsx`

- Week view: Mon-Sun
- Time slots: 9:00 AM - 8:00 PM (30-min increments)
- Appointment cards with detail overlay
- All data hardcoded

**You need**:
```
GET /appointments?date=2024-11-27&week=true
→ { appointments: Appointment[] }

POST /appointments { date, time, duration, patientId, professionalId, notes }
→ { appointment: Appointment }
```

---

### 4. MANAGEMENT DASHBOARD
**Files**: `src/app/gestion/page.tsx` + 7 chart components

- 3 rows of metrics + charts
- Recharts integration (mock data)
- 12 months of billing data shown

**You need**:
```
GET /analytics/billing → 12-month data
GET /analytics/production → total + by-professional
GET /analytics/income-types → breakdown
GET /analytics/patient-summary → today, week, confirmed
```

---

### 5. FILE UPLOADS
**Files**: Avatar in `AddPatientStepPaciente.tsx`, Documents in `AddPatientStepConsentimientos.tsx`

- Avatar capture/upload (AvatarImageDropdown component)
- Consent documents (derivation, reports, X-rays, photos)
- Currently creates blob URLs (not sent anywhere)

**You need**:
```
POST /upload (multipart FormData)
→ { url: string, fileId: string }

POST /patients/:id/avatar (multipart FormData)
→ { avatarUrl: string }

POST /patients/:id/documents (multipart FormData)
→ { documents: Document[] }
```

---

## Database Schema Skeleton

```sql
-- Users (for authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  name VARCHAR,
  surname VARCHAR,
  role VARCHAR, -- 'admin', 'professional', 'receptionist'
  created_at TIMESTAMP
);

-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  clinic_id UUID, -- multi-tenant
  -- Basic
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
  contact_preferences JSONB, -- { whatsapp, sms, email, llamada }
  recordatorios BOOLEAN,
  marketing BOOLEAN,
  
  -- Admin
  profesional_id UUID REFERENCES users,
  canal VARCHAR,
  cobertura VARCHAR,
  pais VARCHAR,
  pago1 VARCHAR,
  pago2 VARCHAR,
  financiacion VARCHAR,
  factura_empresa BOOLEAN,
  cif VARCHAR,
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
  
  status VARCHAR, -- 'Activo', 'Hecho', 'Pausado'
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
  duration VARCHAR,
  title VARCHAR,
  status VARCHAR, -- 'confirmada', 'pendiente', 'completada', 'cancelada'
  economic_amount DECIMAL,
  notes TEXT,
  created_at TIMESTAMP
);

-- Clinical Records
CREATE TABLE clinical_records (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  date TIMESTAMP,
  title VARCHAR,
  soap_notes TEXT,
  created_by UUID REFERENCES users,
  created_at TIMESTAMP
);

-- Budgets/Proposals
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  professional_id UUID REFERENCES users,
  total DECIMAL,
  status VARCHAR, -- 'draft', 'sent', 'accepted', 'completed'
  line_items JSONB,
  created_at TIMESTAMP
);

-- Consents
CREATE TABLE consents (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  type VARCHAR, -- 'general_info', 'data_protection', 'image_rights'
  signed BOOLEAN,
  signed_at TIMESTAMP,
  document_url VARCHAR,
  created_at TIMESTAMP
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients,
  type VARCHAR, -- 'rx', 'photo', 'report', 'derivation'
  url VARCHAR,
  created_at TIMESTAMP
);
```

---

## Priority Order

### Phase 1 (Foundation)
- [ ] User authentication (login/register)
- [ ] JWT token handling
- [ ] User session persistence

### Phase 2 (Core)
- [ ] CRUD for Patients
- [ ] Patient list with pagination/search/filter
- [ ] AddPatient endpoint (collect all 6 steps)
- [ ] File uploads (avatar)

### Phase 3 (Features)
- [ ] Appointments CRUD
- [ ] Clinical records
- [ ] Budgets/proposals

### Phase 4 (Analytics)
- [ ] Dashboard endpoints
- [ ] Analytics calculations

---

## Where to Replace Mock Data

### Patients List
**File**: `src/app/pacientes/page.tsx`
**Line**: 169
```typescript
// OLD:
const MOCK_PATIENTS: PatientRow[] = Array.from({ length: 12 }).map(...)

// NEW:
const [patients, setPatients] = useState<PatientRow[]>([])
useEffect(() => {
  fetch('/api/patients').then(r => r.json()).then(setPatients)
}, [])
```

### Billing Chart
**File**: `src/components/gestion/BillingLineChart.tsx`
**Line**: 41
```typescript
// OLD:
const CHART_DATA = [
  { month: 'Ene', brand: 26000, accent: 24000 },
  ...
]

// NEW:
const [chartData, setChartData] = useState([])
useEffect(() => {
  fetch('/api/analytics/billing').then(r => r.json()).then(setChartData)
}, [])
```

### Calendar Events
**File**: `src/components/agenda/WeekScheduler.tsx`
- Hardcoded in component
- Replace with useEffect + API call

---

## Recommended Frontend Refactoring

After backend is ready, update frontend:

### 1. Create API Client Layer
```typescript
// src/lib/api/patients.ts
export const patientsAPI = {
  list: (filters?) => fetch('/api/patients', { /* ... */ }),
  create: (data) => fetch('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => fetch(`/api/patients/${id}`),
  update: (id, data) => fetch(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetch(`/api/patients/${id}`, { method: 'DELETE' })
}
```

### 2. Add Auth Context
```typescript
// src/context/AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Check if token exists, fetch /auth/me
  }, [])
  
  // Provide user, login, logout, isAuthenticated
}
```

### 3. Replace AddPatientModal State
```typescript
// Instead of 24+ useState, collect in object:
const [formData, setFormData] = useState({
  paciente: {},
  contacto: {},
  administrativo: {},
  // ...
})

// On submit:
const handleCreate = async () => {
  await patientsAPI.create(formData)
}
```

---

## Testing Checklist

Before calling it done:

- [ ] Login/register works + token stored
- [ ] Patient list loads from API
- [ ] Create patient submits all 6 steps
- [ ] Patient detail modal shows real data
- [ ] Calendar displays appointments
- [ ] Dashboard charts show real data
- [ ] File uploads work (avatar, documents)
- [ ] Search/filter on patient list works
- [ ] Pagination works
- [ ] Error handling (show error messages)
- [ ] Loading states (show spinners)

---

## Next Steps

1. **Read** `KLINIKOS_ARCHITECTURE_ANALYSIS.md` (detailed breakdown)
2. **Watch** the Loom video (reference: `LOOM_SCRIPT_OUTLINE.md`)
3. **Start with**: Authentication (login/register endpoints)
4. **Then tackle**: Patient CRUD (biggest feature)
5. **Finally**: Appointments + Dashboard

---

## Support

All component files are in `src/components/` organized by feature:
- `src/components/auth/` - Authentication forms
- `src/components/pacientes/` - Patient management
- `src/components/agenda/` - Calendar/appointments
- `src/components/gestion/` - Dashboard
- `src/components/layout/` - Navigation

Each component has clear prop types and input/output expectations.

Good luck! You've got this.
