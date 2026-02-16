# Technical Brief: Configuration Module - klinikOS

**Date:** February 12, 2026  
**Version:** 1.2  
**Status:** UI Complete (Frontend only — no backend persistence)  
**Backend:** Supabase (PostgreSQL + Edge Functions) — Planned  
**Architecture:** Multi-tenant from the start  
**Access:** Administrator only

---

## 1. Overview

### 1.1 Description

The **Configuration Module** (`/configuracion`) is the central administration hub of klinikOS. It provides master data management for the entire system — clinic information, professionals, treatment catalogs, document templates, financial settings, and role-based permissions. All other modules (Agenda, Patients, Cash, Management, Voice Agent) consume data defined here.

Configuration is a **write-once, consume-everywhere** module: changes made here propagate instantly to all dependent modules via `ConfigurationContext`.

### 1.2 Configuration Sections

| #   | Section                                          | Route                          | Description                                           |
| --- | ------------------------------------------------ | ------------------------------ | ----------------------------------------------------- |
| 1   | **Datos de la clínica**                          | `/configuracion`               | Clinic info, multi-clinic list, working hours          |
| 2   | **Plantillas de documentos**                     | `/configuracion/facturacion`   | Invoice, prescription, budget, consent, report templates |
| 3   | **Lista de especialistas**                       | `/configuracion/especialistas` | Professionals CRUD, schedules, employment type (autónomo/empleado), commissions/salaries |
| 4   | **Gabinetes**                                    | `/configuracion/gabinetes`     | Treatment rooms/boxes CRUD                             |
| 5   | **Tratamientos, precios, presupuestos y descuentos** | `/configuracion/tratamientos` | Treatment catalog, budget types, discounts           |
| 6   | **Finanzas: gastos fijos y variables**           | `/configuracion/finanzas`      | Fixed/variable expense tracking                        |
| 7   | **Recordatorios & comunicación**                 | —                              | *Próximamente* (disabled)                              |
| 8   | **Roles y permisos**                             | `/configuracion/roles`         | Role management, permission matrix                     |

### 1.3 Design Principles

- **Administrator-only access**: Only users with Administrator role can access configuration
- **Centralized state**: All config data flows through `ConfigurationContext`
- **No persistence yet**: All data is in-memory (React state with mock initial data)
- **Multi-tenant ready**: All planned tables include `clinic_id`
- **Instant propagation**: Changes reflect immediately in all consuming modules
- **Modular layout**: Left navigation rail + right content area

---

## 2. Data Architecture

### 2.1 Current State (Frontend Mock)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT STATE: IN-MEMORY CONTEXT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ConfigurationContext (~1950 lines)                                          │
│  ├── clinicInfo: ClinicInfo (1 object)                                      │
│  ├── clinics: Clinic[] (3 clinics)                                          │
│  ├── professionals: Professional[] (5 professionals)                        │
│  ├── boxes: Box[] (3 boxes)                                                │
│  ├── workingHours: WorkingHoursConfig (1 config)                            │
│  ├── documentTemplates: DocumentTemplate[] (8 templates)                    │
│  ├── professionalSchedules: ProfessionalSchedule[] (5 schedules)            │
│  ├── scheduleTemplates: ScheduleTemplate[] (5 templates)                    │
│  ├── treatmentCategories: ConfigCategory[] (from TreatmentsPage)            │
│  ├── discounts: ConfigDiscount[] (from treatmentConfigData)                 │
│  ├── budgetTypes: BudgetTypeData[] (6 budget types)                         │
│  ├── expenses: ConfigExpense[] (15 expenses)                                │
│  ├── roles: ConfigRole[] (from rolesData)                                   │
│  └── permissions: ConfigPermission[] (from rolesData)                       │
│                                                                             │
│  No Supabase queries. No API routes. No persistence.                        │
│  All data resets on page reload.                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Planned Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLINICS                                         │
│                         (Main tenant table)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
         │              │              │              │              │
         │ 1:1          │ 1:N          │ 1:N          │ 1:N          │ 1:N
         ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ CLINIC_     │ │   STAFF     │ │   BOXES     │ │ TREATMENT_  │ │ DOCUMENT_   │
│ SETTINGS    │ │(Specialists)│ │ (Gabinetes) │ │ CATALOG     │ │ TEMPLATES   │
└─────────────┘ └──────┬──────┘ └─────────────┘ └──────┬──────┘ └─────────────┘
                       │                               │
                       │ 1:1                           │ N:1
                       ▼                               ▼
               ┌─────────────┐                 ┌─────────────┐
               │PROFESSIONAL_│                 │ TREATMENT_  │
               │ SCHEDULES   │                 │ CATEGORIES  │
               └──────┬──────┘                 └─────────────┘
                      │
                      │ 1:N
                      ▼
               ┌─────────────┐
               │ SCHEDULE_   │
               │ EXCEPTIONS  │
               └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        ADDITIONAL ENTITIES                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ BUDGET_TYPES    │ DISCOUNTS       │ EXPENSES        │ ROLES &               │
│ (Templates)     │                 │ (Fixed/Variable)│ PERMISSIONS           │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## 3. Section Details

### 3.1 Datos de la Clínica (`/configuracion`)

#### 3.1.1 Description

Main clinic configuration page with three tabs: **General**, **Clínicas**, and **Horarios**.

#### 3.1.2 Tab: General — Clinic Info

Manages the main clinic entity's commercial and legal information.

**Type: `ClinicInfo`**

```typescript
export type ClinicInfo = {
  id: string
  nombreComercial: string   // "Clínica Morales"
  razonSocial: string       // "Clínica Morales S.L."
  cif: string               // "B12345678"
  direccion: string         // "C/ Universidad, 2"
  poblacion: string         // "Valencia"
  codigoPostal: string      // "46001"
  telefono: string          // "608020203"
  email: string             // "clinicamorales@morales.es"
  iban: string              // "ES12 1234 5678 9012 3456 7890"
  emailBancario: string     // "facturacion@morales.es"
  logo?: string             // Base64 or URL
  web?: string              // Website URL
}
```

**Consumers:** Document templates (placeholders `{{clinica.nombre}}`, `{{clinica.direccion}}`, etc.), Voice Agent (AI greeting), PDF generation.

#### 3.1.3 Tab: Clínicas — Multi-Clinic Management

Supports multi-location clinics. Each clinic has its own name, address, hours, and contact info.

**Type: `Clinic`**

```typescript
export type Clinic = {
  id: string
  nombre: string       // "Clínica Morales Ruzafa"
  direccion: string    // "C/ Universidad, 2, Valencia"
  horario: string      // "08:00 - 20:00"
  telefono: string
  email: string
  isActive: boolean
}
```

**Operations:** Add (via `AddClinicModal`), Edit, Delete, Toggle Active.

#### 3.1.4 Tab: Horarios — Working Hours

Global clinic working hours that define the calendar grid in Agenda.

**Type: `WorkingHoursConfig`**

```typescript
export type WorkingHoursConfig = {
  defaultStartHour: number      // 9 (09:00)
  defaultEndHour: number        // 20 (20:00)
  slotDurationMinutes: number   // 15 (minute intervals)
  workingDays: DayOfWeek[]      // ['lunes', 'martes', ..., 'viernes']
  morningShift: TimeRange       // { start: '09:00', end: '14:00' }
  afternoonShift: TimeRange     // { start: '15:00', end: '20:00' }
}
```

**Consumers:** Agenda (calendar grid start/end hours, slot duration, period filters), Voice Agent Advanced (booking hours).

#### 3.1.5 Planned Table: `clinic_settings`

```sql
CREATE TABLE clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Commercial info
    commercial_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(200),
    tax_id VARCHAR(20), -- CIF/NIF
    address VARCHAR(500),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Banking
    iban VARCHAR(50),
    billing_email VARCHAR(255),

    -- Branding
    logo_url TEXT,
    website_url VARCHAR(500),

    -- Working Hours
    default_start_hour INTEGER DEFAULT 9,
    default_end_hour INTEGER DEFAULT 20,
    slot_duration_minutes INTEGER DEFAULT 15,
    working_days TEXT[] DEFAULT ARRAY['lunes','martes','miercoles','jueves','viernes'],
    morning_shift_start TIME DEFAULT '09:00',
    morning_shift_end TIME DEFAULT '14:00',
    afternoon_shift_start TIME DEFAULT '15:00',
    afternoon_shift_end TIME DEFAULT '20:00',

    -- Patient numbering
    patient_number_prefix VARCHAR(10) DEFAULT 'PAT',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_clinic_settings UNIQUE (clinic_id)
);
```

---

### 3.2 Plantillas de Documentos (`/configuracion/facturacion`)

#### 3.2.1 Description

Manages HTML templates for all clinic documents. Each template supports dynamic placeholders that are replaced with patient/clinic/treatment data at generation time.

#### 3.2.2 Document Template Types

| Type              | Label            | Default Templates  | Use Case                          |
| ----------------- | ---------------- | ------------------ | --------------------------------- |
| `factura`         | Factura          | 1                  | Patient invoices                  |
| `receta`          | Receta           | 1                  | Medical prescriptions             |
| `presupuesto`     | Presupuesto      | 1                  | Treatment budgets/quotes          |
| `consentimiento`  | Consentimiento   | 3                  | Informed consent forms            |
| `justificante`    | Justificante     | 1                  | Attendance certificates           |
| `informe`         | Informe          | 1                  | Clinical reports                  |

#### 3.2.3 Template Placeholders

All templates support these dynamic placeholders:

| Category     | Placeholder                        | Description                    |
| ------------ | ---------------------------------- | ------------------------------ |
| **Clínica**  | `{{clinica.nombre}}`               | Clinic commercial name         |
|              | `{{clinica.nif}}`                  | Tax ID (CIF)                   |
|              | `{{clinica.direccion}}`            | Clinic address                 |
|              | `{{clinica.telefono}}`             | Clinic phone                   |
|              | `{{clinica.email}}`                | Clinic email                   |
|              | `{{clinica.web}}`                  | Clinic website                 |
| **Paciente** | `{{paciente.nombre}}`              | Patient full name              |
|              | `{{paciente.dni}}`                 | Patient document number        |
|              | `{{paciente.direccion}}`           | Patient address                |
|              | `{{paciente.sexo}}`                | Patient gender                 |
|              | `{{paciente.edad}}`                | Patient age                    |
|              | `{{paciente.fecha_nacimiento}}`    | Patient birth date             |
| **Documento**| `{{documento.numero}}`             | Document number                |
|              | `{{documento.fecha}}`              | Document date                  |
| **Tratamiento** | `{{tratamiento.nombre}}`        | Treatment name                 |
|              | `{{tratamiento.precio}}`           | Treatment price                |
|              | `{{tratamiento.pieza}}`            | Tooth number                   |
|              | `{{tratamiento.descripcion}}`      | Treatment description          |
| **Presupuesto** | `{{presupuesto.total}}`         | Budget total                   |
|              | `{{presupuesto.subtotal}}`         | Budget subtotal                |
|              | `{{presupuesto.descuento}}`        | Budget discount                |
|              | `{{presupuesto.validez}}`          | Budget validity period         |
| **Profesional** | `{{profesional.nombre}}`        | Professional name              |
|              | `{{profesional.especialidad}}`     | Professional specialty         |
|              | `{{profesional.num_colegiado}}`    | License number                 |
| **Receta**   | `{{receta.medicamento}}`           | Medication name                |
|              | `{{receta.dosis}}`                 | Dosage                         |
|              | `{{receta.frecuencia}}`            | Frequency                      |
|              | `{{receta.duracion}}`              | Duration                       |
|              | `{{receta.via}}`                   | Administration route           |
|              | `{{receta.notas}}`                 | Prescription notes             |

#### 3.2.4 Type: `DocumentTemplate`

```typescript
export type DocumentTemplateType =
  | 'factura' | 'receta' | 'justificante'
  | 'consentimiento' | 'presupuesto' | 'informe'

export type DocumentTemplate = {
  id: string
  title: string
  type: DocumentTemplateType
  content: string          // Full HTML template content
  logoUrl?: string
  logoPosition?: { x: number; y: number }
  isDefault: boolean
  lastModified?: string
}
```

**Operations:** Add, Edit (via `TemplateEditorModal`), Delete, Reset to Default, Filter by type, Search.

**Consumers:** Patient Record (prescriptions, consents, invoices), Cash (receipts).

#### 3.2.5 Planned Table: `document_templates`

```sql
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL
        CHECK (type IN ('factura', 'receta', 'justificante', 'consentimiento', 'presupuesto', 'informe')),
    content TEXT NOT NULL, -- HTML template content
    logo_url TEXT,
    logo_position JSONB, -- {x: number, y: number}
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_document_templates_clinic_type ON document_templates(clinic_id, type);
```

---

### 3.3 Lista de Especialistas (`/configuracion/especialistas`)

#### 3.3.1 Description

CRUD management for clinic professionals (dentists, orthodontists, hygienists, etc.). Each professional has a color for calendar identification, an employment type (autónomo or empleado), and an individual weekly schedule.

**Employment Types:**

| Type | Label (UI) | Badge Style | Compensation | Description |
| --- | --- | --- | --- | --- |
| `autonomo` | Autónomo | `bg-amber-50 text-amber-700` | Commission (%) | Freelance professionals paid by commission per treatment |
| `nomina` | Empleado | `bg-blue-50 text-blue-700` | Monthly salary (€) | Salaried employees with fixed monthly pay |

The employment type badge is displayed inline next to the professional's name in the specialists table. The "Compensación" column conditionally shows either the commission percentage (for autónomos) or the monthly salary (for empleados).

#### 3.3.2 Types: `Professional` & `EmploymentType`

```typescript
export type ProfessionalColorTone = 'morado' | 'naranja' | 'verde' | 'azul' | 'rojo'

export type EmploymentType = 'autonomo' | 'nomina'

export type Professional = {
  id: string
  name: string                      // "Dr. Antonio Ruiz"
  role: string                      // "Odontólogo", "Ortodoncista", "Higienista"
  phone: string
  email: string
  colorLabel: string                // "Morado"
  colorTone: ProfessionalColorTone  // Calendar color
  employmentType: EmploymentType    // "autonomo" or "nomina"
  commission?: string               // Only for autónomos (e.g., "30%")
  salary?: string                   // Only for empleados (monthly gross, e.g., "2.500")
  status: 'Activo' | 'Inactivo'
  photoUrl?: string
}
```

**Compensation Logic:**
- If `employmentType === 'autonomo'`: `commission` is required, `salary` is `undefined`
- If `employmentType === 'nomina'`: `salary` is required, `commission` is `undefined`
- The `AddProfessionalModal` conditionally renders either a commission input or a salary input based on the selected employment type

**Color Styles:**

| Tone       | Background     | Text Color  | Hex       |
| ---------- | -------------- | ----------- | --------- |
| `morado`   | `#f3eaff`      | `#7725eb`   | `#7725eb` |
| `naranja`  | `#fff7e8`      | `#d97706`   | `#d97706` |
| `verde`    | `#e9f8f1`      | `#2e7d5b`   | `#2e7d5b` |
| `azul`     | `#e0f2fe`      | `#0369a1`   | `#0369a1` |
| `rojo`     | `#fee2e2`      | `#dc2626`   | `#dc2626` |

**Operations:** Add (via `AddProfessionalModal`), Edit, Delete, Filter by status, Search.

**Consumers:** Agenda (professional columns, color coding), Patient Record (doctor assignment in treatments/budgets), Cash (commission calculations for autónomos, salary tracking for empleados), Voice Agent (professional assignment), Management (staff KPIs differentiated by employment type).

#### 3.3.3 Professional Schedules

Each professional has a weekly schedule with shifts and breaks, plus schedule exceptions for vacations/holidays.

**Types:**

```typescript
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type DaySchedule = {
  isWorking: boolean
  shifts: TimeRange[]       // [{start: '09:00', end: '14:00'}, {start: '15:00', end: '18:00'}]
  breaks: ScheduleBreak[]   // [{id, name: 'Comida', start: '14:00', end: '15:00'}]
}

export type WeeklySchedule = Record<WeekDay, DaySchedule>

export type ScheduleException = {
  id: string
  professionalId: string
  date: string              // "2026-02-10" ISO format
  type: 'vacation' | 'holiday' | 'absence' | 'special'
  reason?: string
  customSchedule?: DaySchedule
}

export type ProfessionalSchedule = {
  professionalId: string
  weeklySchedule: WeeklySchedule
  exceptions: ScheduleException[]
  appliedTemplateId?: string
}
```

**Schedule Templates (5 predefined):**

| ID            | Name                         | Description                                                |
| ------------- | ---------------------------- | ---------------------------------------------------------- |
| `full-day`    | Jornada completa 9-18h       | L-V, 9:00-14:00 + 15:00-18:00, lunch break                |
| `morning`     | Media jornada mañana         | L-V, 9:00-14:00                                            |
| `afternoon`   | Media jornada tarde          | L-V, 15:00-20:00                                           |
| `clinic-default` | Horario de clínica        | L-V, 9:00-14:00 + 15:00-20:00, clinic hours               |
| `alternating` | Semana alternada             | L/X/V morning, M/J afternoon                               |

**Schedule Operations:** Apply template, Copy from another professional, Add exception, Remove exception, Check availability.

**Key Helper Functions:**

```typescript
// Check if a professional is available at a specific date/time
isProfessionalAvailable(professionalId: string, date: Date, time: string): boolean

// Get the schedule for a specific date (checks exceptions first)
getProfessionalScheduleForDate(professionalId: string, date: Date): DaySchedule | null

// Get all available professionals for a given date
getAvailableProfessionalsForDate(date: Date): Professional[]
```

#### 3.3.4 Planned Table: `staff`

```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Linked auth user (optional)

    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL, -- "Odontólogo", "Ortodoncista", "Higienista"
    specialization VARCHAR(200),
    license_number VARCHAR(50), -- Nº Colegiado
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Calendar appearance
    color_tone VARCHAR(20) CHECK (color_tone IN ('morado', 'naranja', 'verde', 'azul', 'rojo')),
    color_hex VARCHAR(10),

    -- Employment & Compensation
    employment_type VARCHAR(20) NOT NULL DEFAULT 'autonomo'
        CHECK (employment_type IN ('autonomo', 'nomina')),
    commission_percent DECIMAL(5,2), -- Only for autonomo
    monthly_salary DECIMAL(10,2),    -- Only for nomina (gross monthly)

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Photo
    photo_url TEXT,

    -- Schedule
    weekly_schedule JSONB, -- WeeklySchedule object
    applied_template_id VARCHAR(50),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_staff_email_per_clinic UNIQUE (clinic_id, email),
    CONSTRAINT valid_compensation CHECK (
        (employment_type = 'autonomo' AND commission_percent IS NOT NULL)
        OR (employment_type = 'nomina' AND monthly_salary IS NOT NULL)
    )
);

CREATE INDEX idx_staff_clinic ON staff(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_staff_employment_type ON staff(clinic_id, employment_type);

-- Schedule exceptions table
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,

    exception_date DATE NOT NULL,
    exception_type VARCHAR(20) NOT NULL
        CHECK (exception_type IN ('vacation', 'holiday', 'absence', 'special')),
    reason TEXT,
    custom_schedule JSONB, -- DaySchedule for 'special' type

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_exception_per_day UNIQUE (professional_id, exception_date)
);

CREATE INDEX idx_schedule_exceptions_professional ON schedule_exceptions(professional_id, exception_date);
```

---

### 3.4 Gabinetes (`/configuracion/gabinetes`)

#### 3.4.1 Description

Manages treatment rooms (boxes/cabinets). Each box has a label, a color tone for identification, and an active/inactive status.

#### 3.4.2 Type: `Box`

```typescript
export type Box = {
  id: string
  label: string          // "BOX 1", "BOX 2"
  tone: 'neutral' | 'brand' | 'success' | 'warning' | 'error'
  isActive: boolean
}
```

**Operations:** Add, Edit, Delete, Toggle Active.

**Consumers:** Agenda (room column assignment), Voice Agent Advanced (room assignment for AI-created appointments).

#### 3.4.3 Planned Table: `boxes`

```sql
CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    label VARCHAR(50) NOT NULL,
    tone VARCHAR(20) DEFAULT 'neutral'
        CHECK (tone IN ('neutral', 'brand', 'success', 'warning', 'error')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_box_label_per_clinic UNIQUE (clinic_id, label)
);

CREATE INDEX idx_boxes_clinic ON boxes(clinic_id) WHERE is_active = TRUE;
```

---

### 3.5 Tratamientos, Precios, Presupuestos y Descuentos (`/configuracion/tratamientos`)

#### 3.5.1 Description

The most complex configuration section with **three tabs**: Tratamientos, Presupuestos Tipo, and Descuentos.

#### 3.5.2 Tab: Tratamientos — Treatment Catalog

Manages the treatment catalog organized by categories. Each category contains multiple treatments with codes, prices, and estimated times.

**Types:**

```typescript
export type ConfigTreatment = {
  id: string
  name: string           // "Limpieza dental"
  code: string           // "LDE"
  basePrice: number      // 72
  estimatedTime: string  // "45 min"
  iva: string            // "21%"
  selected: boolean
}

export type ConfigCategory = {
  id: string
  name: string                    // "Higiene", "Ortodoncia", "Endodoncia"
  treatments: ConfigTreatment[]   // Treatments within this category
}
```

**Operations:** Add category, Edit category, Delete category, Add treatment to category, Edit treatment, Delete treatment, Search.

**Consumers:** Patient Record (treatment selection in budgets, CatalogoTratamientos component), Budget creation.

#### 3.5.3 Tab: Presupuestos Tipo — Budget Templates

Pre-defined budget packages that can be quickly applied to patients.

**Type: `BudgetTypeData`**

```typescript
export type BudgetTypeTreatment = {
  codigo: string          // "LDE"
  tratamiento: string     // "Limpieza dental"
  precio: number          // 72
  pieza?: number          // 36 (tooth number, optional)
  cara?: ToothFace        // "Vestibular" (tooth face, optional)
}

export type BudgetTypeData = {
  id: string
  name: string            // "Pack Revisión Completa"
  description: string     // "Limpieza + consulta + radiografía"
  treatments: BudgetTypeTreatment[]
  totalPrice: number      // 322
  isActive: boolean
}
```

**Mock Data (6 budget types):**

| ID       | Name                       | Treatments                              | Total   |
| -------- | -------------------------- | --------------------------------------- | ------- |
| `bt-001` | Pack Revisión Completa     | Limpieza + Consulta + Radiografía       | 322€    |
| `bt-002` | Pack Blanqueamiento Premium| Limpieza + Blanqueamiento               | 272€    |
| `bt-003` | Pack Implante Unitario     | Implante + Corona                       | 1,800€  |
| `bt-004` | Pack Endodoncia + Corona   | Endodoncia + Corona                     | 1,000€  |
| `bt-005` | Pack Estética Dental       | 4 Carillas + Blanqueamiento             | 1,600€  |
| `bt-006` | Pack Infantil              | Consulta + Limpieza                     | 222€    |

**Operations:** Add (via `BudgetTypeEditorModal`), Edit, Delete, Toggle Active.

**Consumers:** Patient Record (quick budget creation via `BudgetTypeModal`, `QuickBudgetModal`).

#### 3.5.4 Tab: Descuentos — Discount Management

**Type: `ConfigDiscount`**

```typescript
export type DiscountType = 'percentage' | 'fixed'

export type ConfigDiscount = {
  id: string
  name: string           // "Descuento Familia"
  type: DiscountType     // 'percentage' or 'fixed'
  value: number          // 10 (10% or 10€)
  notes: string
  isActive: boolean
}
```

**Operations:** Add, Edit, Delete, Toggle Active.

**Consumers:** Patient Record (discount dropdown in budget line items). The context exposes `discountOptions` as formatted strings: `['Sin descuento', '10% Descuento Familia', '50€ Dto. Empleado', ...]`.

#### 3.5.5 Planned Table: `treatment_catalog`

```sql
-- See TECHNICAL_BRIEF_PATIENT_RECORD.md section 3.5 for full table definition
CREATE TABLE treatment_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    requires_tooth_selection BOOLEAN DEFAULT FALSE,
    requires_face_selection BOOLEAN DEFAULT FALSE,
    default_duration_minutes INTEGER DEFAULT 30,
    iva_percent DECIMAL(5,2) DEFAULT 21,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_treatment_code_per_clinic UNIQUE (clinic_id, code)
);

-- Budget type templates
CREATE TABLE budget_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    treatments JSONB NOT NULL, -- Array of {codigo, tratamiento, precio, pieza?, cara?}
    total_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discounts
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.6 Finanzas: Gastos Fijos y Variables (`/configuracion/finanzas`)

#### 3.6.1 Description

Tracks recurring and one-time clinic expenses for financial reporting.

#### 3.6.2 Type: `ConfigExpense`

```typescript
export type ExpenseStatus = 'activo' | 'inactivo'

export type ExpenseCategory =
  | 'Servicios' | 'Material' | 'Nóminas'
  | 'Alquiler' | 'Suministros' | 'Otros'

export type ConfigExpense = {
  id: string
  nombre: string          // "Alquiler local"
  importe: number         // 2500
  frecuencia: string      // "Mensual", "Trimestral", "Anual"
  categoria: ExpenseCategory
  fechaInicio: string     // "2025-01-01"
  fechaFin: string        // "2026-12-31"
  notas: string
  estado: ExpenseStatus
}
```

**Operations:** Add, Edit, Delete, Filter by category, Filter by status.

**Consumers:** Management dashboard (expense KPIs, profitability calculations).

#### 3.6.3 Planned Table: `expenses`

```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(30) NOT NULL, -- 'Mensual', 'Trimestral', 'Anual', 'Puntual'
    category VARCHAR(50) NOT NULL
        CHECK (category IN ('Servicios', 'Material', 'Nóminas', 'Alquiler', 'Suministros', 'Otros')),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'activo'
        CHECK (status IN ('activo', 'inactivo')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_clinic ON expenses(clinic_id) WHERE status = 'activo';
```

---

### 3.7 Recordatorios & Comunicación (Planned)

Currently disabled in navigation (`href: undefined`). Planned features:

- SMS/WhatsApp appointment reminders
- Email appointment confirmations
- Birthday greetings
- Recall/follow-up reminders
- Communication templates
- Provider configuration (Twilio, etc.)

---

### 3.8 Roles y Permisos (`/configuracion/roles`)

#### 3.8.1 Description

Manages user roles and their associated permissions across all system modules. The page has two tabs: **Roles** (list of roles with user counts) and **Permisos** (permission matrix showing which permissions each role has).

#### 3.8.2 Types

```typescript
export type ConfigRole = {
  id: string
  nombre: string              // "Doctor", "Administrativo", "Higienista", "Auxiliar"
  usuariosAsignados: number   // Number of users with this role
  permisos: string[]          // Array of ConfigPermission IDs assigned to this role
}

export type ConfigPermission = {
  id: string
  nombre: string              // "Gestión de pacientes", "Ver agenda"
  descripcion: string         // "Crear, editar y eliminar pacientes"
  modulo: string              // "Pacientes", "Agenda", "Facturación", "Caja", "Sistema"
  activo: boolean
}
```

#### 3.8.3 Tab: Roles

Displays a table of roles with columns: **Nombre del rol**, **Nº de usuarios asignados**, and **Lista usuarios asignados** (link to view specialists with that role via `SpecialistListModal`).

**Default Roles (4):**

| ID   | Name           | Users | Permissions                                             |
| ---- | -------------- | ----- | ------------------------------------------------------- |
| `r1` | Doctor         | 32    | Gestión pacientes, historial, citas, agenda, facturación |
| `r2` | Administrativo | 4     | Gestión pacientes, citas, agenda, facturación, caja     |
| `r3` | Higienista     | 8     | Historial clínico, ver agenda                            |
| `r4` | Auxiliar       | 2     | Ver agenda                                               |

#### 3.8.4 Tab: Permisos — Permission Matrix

Displays a **matrix view** where:
- **Rows** are permissions, grouped by module (Pacientes, Agenda, Facturación, Caja, Sistema)
- **Columns** are roles (Doctor, Administrativo, Higienista, Auxiliar)
- **Cells** are checkbox toggles to enable/disable a permission for a role

Each permission row shows both the name and description. Module group headers separate permissions visually.

**Permissions (8):**

| ID   | Permission              | Module       | Description                              |
| ---- | ----------------------- | ------------ | ---------------------------------------- |
| `p1` | Gestión de pacientes    | Pacientes    | Crear, editar y eliminar pacientes       |
| `p2` | Ver historial clínico   | Pacientes    | Acceso a historiales clínicos            |
| `p3` | Gestión de citas        | Agenda       | Crear, modificar y cancelar citas        |
| `p4` | Ver agenda              | Agenda       | Visualizar la agenda de citas            |
| `p5` | Gestión de facturación  | Facturación  | Crear y gestionar facturas               |
| `p6` | Acceso a caja           | Caja         | Gestionar movimientos de caja            |
| `p7` | Configuración           | Sistema      | Acceso a configuración del sistema       |
| `p8` | Gestión de usuarios     | Sistema      | Crear y gestionar usuarios del sistema   |

**Context API:** `toggleRolePermission(roleId, permissionId)` — adds or removes a permission ID from the role's `permisos` array.

**Operations:** Toggle permission per role (via matrix checkboxes), View specialists per role (via `SpecialistListModal`).

**Consumers:** All modules (access control), RLS policies (planned).

#### 3.8.3 Planned Tables

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_role_name_per_clinic UNIQUE (clinic_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- 'Agenda', 'Pacientes', 'Caja', etc.
    action VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete'

    CONSTRAINT unique_permission_per_clinic UNIQUE (clinic_id, module, action)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_clinic_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_clinic UNIQUE (user_id, clinic_id)
);
```

---

## 4. Component Architecture

### 4.1 Layout Structure

```
/configuracion (layout.tsx)
├── ClientLayout (sidebar + topbar)
│   └── Page Container
│       ├── Header: "Configuración"
│       └── Content Area (flex row)
│           ├── Left Navigation Rail (16rem)
│           │   └── configNavItems (8 items, 1 disabled)
│           └── Right Content (flex-1)
│               └── {children} — route-specific page
```

### 4.2 Component Tree

```
src/app/configuracion/
├── layout.tsx ─── Left nav rail + content wrapper
├── page.tsx ──── ConfigPage.tsx
│   └── Tabs: General | Clínicas | Horarios
│       ├── AddClinicModal.tsx (add/edit clinic)
│       └── Clinic info form, working hours form
│
├── facturacion/page.tsx ──── Documents.tsx
│   ├── Template cards grid
│   ├── Type filter, search
│   └── TemplateEditorModal.tsx (WYSIWYG HTML editor)
│
├── especialistas/page.tsx ──── SpecialistsListPage.tsx
│   ├── Professionals table
│   ├── Status filter, search
│   ├── AddProfessionalModal.tsx (add/edit)
│   └── ProfessionalScheduleModal.tsx (weekly schedule + exceptions)
│
├── gabinetes/page.tsx ──── BoxesConfigPage.tsx
│   └── Boxes table with inline editing
│
├── tratamientos/page.tsx ──── TreatmentsPage.tsx
│   └── Tabs: Tratamientos | Presupuestos Tipo | Descuentos
│       ├── Treatment categories accordion
│       ├── BudgetTypeEditorModal.tsx (add/edit budget type)
│       └── Discounts table
│
├── finanzas/page.tsx ──── FinancesExpensesPage.tsx
│   └── Expenses table with CRUD
│
└── roles/page.tsx ──── RolesPermissionsPage.tsx
    ├── Roles list
    ├── Permissions matrix
    └── SpecialistListModal.tsx (view users per role)
```

### 4.3 File Map

| File                              | Lines  | Purpose                                           |
| --------------------------------- | ------ | ------------------------------------------------- |
| `ConfigurationContext.tsx`         | ~1950  | Central context with all config state + operations |
| `configNavItems.ts`               | 18     | Navigation items array                            |
| `ConfigPage.tsx`                  | ~600   | Clinic info, multi-clinic, working hours           |
| `Documents.tsx`                   | ~400   | Document template management                      |
| `SpecialistsListPage.tsx`         | ~500   | Professionals table + filters                      |
| `TreatmentsPage.tsx`             | ~4200  | Treatments, budget types, discounts (largest file) |
| `BoxesConfigPage.tsx`             | ~300   | Boxes CRUD                                         |
| `FinancesExpensesPage.tsx`        | ~400   | Expenses CRUD table                               |
| `RolesPermissionsPage.tsx`        | ~500   | Roles + permissions matrix                         |
| `AddClinicModal.tsx`              | ~200   | Add/edit clinic modal                              |
| `AddProfessionalModal.tsx`        | ~300   | Add/edit professional modal                        |
| `ProfessionalScheduleModal.tsx`   | ~500   | Weekly schedule editor with templates              |
| `TemplateEditorModal.tsx`         | ~400   | HTML template editor with placeholders             |
| `BudgetTypeEditorModal.tsx`       | ~300   | Budget type editor                                 |
| `SpecialistListModal.tsx`         | ~150   | View specialists by role                           |
| `BillingLegalPage.tsx`            | ~200   | *Not imported/used* — legacy component             |

### 4.4 Data Source Files

| File                          | Exports                       | Purpose                          |
| ----------------------------- | ----------------------------- | -------------------------------- |
| `src/data/rolesData.ts`       | `initialRoles`, `initialPermissions` | Default roles and permissions |
| `src/data/expensesData.ts`    | `initialExpenses`             | 15 default expenses              |
| `src/data/treatmentConfigData.ts` | `initialDiscounts`        | Default discounts                |
| `src/components/pacientes/shared/budgetTypeData.ts` | `BUDGET_TYPES_DATA`, `BudgetTypeData` | Budget type templates |
| `src/types/treatments.ts`     | `ConfigTreatment`, `ConfigCategory`, `ConfigDiscount` | Treatment types |
| `src/types/configExpenses.ts` | `ConfigExpense`, `ExpenseCategory` | Expense types                |
| `src/types/configRoles.ts`    | `ConfigRole`, `ConfigPermission` | Role/permission types          |

---

## 5. Connections with Other Modules

### 5.1 Connection Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONFIGURATION MODULE                                  │
│                        /configuracion                                         │
│                                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐│
│  │Datos       │ │Plantillas  │ │Especialistas│ │Tratamientos│ │Roles &    ││
│  │Clínica     │ │Documentos  │ │+ Gabinetes │ │+ Descuentos│ │Permisos   ││
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬─────┘│
│        │              │              │              │              │        │
└────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────┘
         │              │              │              │              │
         ▼              ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ConfigurationContext                                    │
│                     (Central state provider)                                   │
└────────┬──────────────┬──────────────┬──────────────┬──────────────┬─────────┘
         │              │              │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    ▼         ▼    ▼         ▼    ▼         ▼    ▼         ▼    ▼         ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│AGENDA  ││PATIENTS││ CASH   ││DAILY   ││MGMT    ││VOICE   ││PDF     ││ALL     │
│/agenda ││/pacient││/caja   ││REPORT  ││/gestion││AGENT   ││GEN     ││MODULES │
│        ││        ││        ││/parte- ││        ││/agente-││        ││        │
│Profess.││Treats  ││Receipts││diario  ││KPIs    ││voz     ││Templat.││Roles   │
│Boxes   ││Budgets ││Templat.││Profess.││Expenses││Profess.││Placeh. ││Permiss.│
│Hours   ││Discnts ││        ││        ││        ││Boxes   ││        ││        │
│Schedule││Consents││        ││        ││        ││Hours   ││        ││        │
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
```

### 5.2 Connection Details by Module

#### 5.2.1 AGENDA (`/agenda`) ← Configuration

| Config Data               | How Agenda Uses It                                          |
| ------------------------- | ----------------------------------------------------------- |
| `professionals`           | Column headers in week/day view, professional filter        |
| `professionalOptions`     | Dropdown in `CreateAppointmentModal`                        |
| `professionalColorStyles` | Color-coded appointment cards per professional              |
| `boxes` / `boxOptions`    | Room assignment dropdown in appointment creation            |
| `workingHours`            | Calendar grid start/end hours, slot duration, period filter |
| `professionalSchedules`   | Availability checking, grayed-out slots for non-working     |
| `getPeriodConfig()`       | Morning/afternoon/full period toggle                        |
| `isProfessionalAvailable()`| Validate appointment time against professional schedule    |
| `getAvailableProfessionalsForDate()` | Filter professionals for date selection          |

```typescript
// Example: Agenda uses config for calendar setup
const { workingHours, getPeriodConfig, professionalOptions, boxOptions } = useConfiguration()
const { startHour, endHour } = getPeriodConfig(currentPeriod)
```

#### 5.2.2 PATIENT RECORD (`/pacientes`) ← Configuration

| Config Data               | How Patient Module Uses It                                  |
| ------------------------- | ----------------------------------------------------------- |
| `treatmentCategories`     | Treatment catalog selector (`CatalogoTratamientos`)         |
| `budgetTypes`             | Quick budget creation (`BudgetTypeModal`, `QuickBudgetModal`)|
| `discounts` / `discountOptions` | Discount dropdown in budget line items               |
| `professionalNames`       | Doctor assignment in treatments                             |
| `professionalNameOptions` | Professional dropdown (value/label format)                  |
| `documentTemplates`       | Prescription, consent, invoice generation                   |
| `clinicInfo`              | Template placeholder replacement (`{{clinica.nombre}}`)     |

```typescript
// Example: Patient module uses config for treatment selection
const { treatmentCategories, discountOptions, professionalNames } = useConfiguration()
```

#### 5.2.3 CASH (`/caja`) ← Configuration

| Config Data             | How Cash Uses It                              |
| ----------------------- | --------------------------------------------- |
| `documentTemplates`     | Receipt template for payment confirmation     |
| `clinicInfo`            | Clinic info in receipt headers                |
| `professionals`         | Commission calculations (autónomos only), salary tracking (empleados) |
| `professionals.employmentType` | Determines compensation model per professional |

#### 5.2.4 DAILY REPORT (`/parte-diario`) ← Configuration

| Config Data             | How Daily Report Uses It                      |
| ----------------------- | --------------------------------------------- |
| `professionals`         | Production per professional breakdown         |
| `activeProfessionals`   | Filter for active staff only                  |

#### 5.2.5 MANAGEMENT (`/gestion`) ← Configuration

| Config Data             | How Management Uses It                        |
| ----------------------- | --------------------------------------------- |
| `expenses`              | Profitability calculations, expense tracking  |
| `professionals`         | Staff KPIs, commission reports (autónomos), payroll costs (empleados) |
| `professionals.employmentType` | Differentiates compensation in financial reports |
| `clinicInfo`            | Dashboard header                              |

#### 5.2.6 VOICE AGENT (`/agente-voz`) ← Configuration

| Config Data             | How Voice Agent Uses It                       |
| ----------------------- | --------------------------------------------- |
| `professionals`         | `AssignProfessionalModal` — assign staff to call |
| `boxes`                 | Room assignment for AI-created appointments (advanced) |
| `workingHours`          | AI booking hours for slot checking (advanced) |
| `clinicInfo`            | AI greeting message (planned)                 |

---

## 6. Data Flows

### 6.1 Flow: Update Treatment Price

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FLOW: UPDATE TREATMENT PRICE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Admin opens /configuracion/tratamientos
   │
   ├─→ Navigates to "Tratamientos" tab
   ├─→ Expands category (e.g., "Higiene")
   ├─→ Clicks edit on treatment "Limpieza dental"
   ├─→ Changes basePrice from 72€ to 80€
   └─→ Clicks Save
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ConfigurationContext.updateTreatmentCategory()                      │
│  └─→ setTreatmentCategories(prev => prev.map(...))                  │
│                                                                      │
│  Instant propagation to all consuming components:                    │
│  ├─→ CatalogoTratamientos (patient module) — shows 80€              │
│  ├─→ Budget creation — new budgets use 80€                           │
│  └─→ Existing budgets NOT affected (prices are copied at creation)  │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Flow: Add New Professional

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FLOW: ADD NEW PROFESSIONAL                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Admin opens /configuracion/especialistas
   │
   ├─→ Clicks "Añadir especialista"
   ├─→ AddProfessionalModal opens
   │   ├─→ Fills: name, role, phone, email, colorTone
   │   ├─→ Selects employment type: "Autónomo" or "Empleado"
   │   │   ├─→ If Autónomo: fills commission (e.g., "30%")
   │   │   └─→ If Empleado: fills monthly salary (e.g., "2.500€")
   │   └─→ Clicks Save
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ConfigurationContext.addProfessional()                               │
│  └─→ setProfessionals(prev => [...prev, newProfessional])            │
│  └─→ Sets commission/salary based on employmentType                  │
│       (one is set, the other is undefined)                           │
│                                                                      │
│  Automatic derived state updates:                                    │
│  ├─→ activeProfessionals (useMemo) — new professional added          │
│  ├─→ professionalOptions (useMemo) — new dropdown option             │
│  ├─→ professionalNameOptions (useMemo) — new name option             │
│  └─→ professionalNames (useMemo) — new name in array                 │
│                                                                      │
│  Instant propagation:                                                │
│  ├─→ Agenda — new column appears in week/day view                    │
│  ├─→ CreateAppointmentModal — new professional in dropdown           │
│  ├─→ Patient treatments — new doctor option                          │
│  ├─→ Voice Agent — new professional for call assignment              │
│  └─→ Specialists table — shows badge (Autónomo/Empleado) +          │
│       compensation column (commission % or salary €/mes)             │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Admin opens ProfessionalScheduleModal
   │
   ├─→ Applies schedule template (e.g., "Jornada completa")
   └─→ Save
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ConfigurationContext.applyTemplateToProfessional()                   │
│  └─→ setProfessionalSchedules(prev => prev.map(...))                 │
│                                                                      │
│  Instant propagation:                                                │
│  ├─→ Agenda — new professional has availability                      │
│  ├─→ isProfessionalAvailable() — returns correct results             │
│  └─→ getAvailableProfessionalsForDate() — includes new prof         │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3 Flow: Edit Document Template

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FLOW: EDIT DOCUMENT TEMPLATE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Admin opens /configuracion/facturacion
   │
   ├─→ Clicks "Editar" on "Facturas" template
   ├─→ TemplateEditorModal opens with WYSIWYG HTML editor
   │   ├─→ Modifies HTML layout, adds clinic logo
   │   ├─→ Uses placeholder buttons: {{clinica.nombre}}, {{paciente.nombre}}, etc.
   │   └─→ Clicks Save
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ConfigurationContext.updateDocumentTemplate()                        │
│  └─→ setDocumentTemplates(prev => prev.map(...))                     │
│  └─→ Updates lastModified timestamp                                  │
│                                                                      │
│  Instant propagation:                                                │
│  ├─→ Patient Record: Prescriptions use updated receta template       │
│  ├─→ Patient Record: Consents use updated consentimiento template    │
│  ├─→ Patient Record: Invoices use updated factura template           │
│  └─→ Cash: Receipts use updated template                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Permission Matrix

| Module / Action                    | Reception      | Hygienist      | Doctor         | Administrator  |
| ---------------------------------- | -------------- | -------------- | -------------- | -------------- |
| **Access /configuracion**          | ❌ No access   | ❌ No access   | ❌ No access   | ✅ Full access |
| **Edit clinic info**               | ❌             | ❌             | ❌             | ✅             |
| **Manage clinics**                 | ❌             | ❌             | ❌             | ✅             |
| **Edit working hours**             | ❌             | ❌             | ❌             | ✅             |
| **Manage document templates**      | ❌             | ❌             | ❌             | ✅             |
| **Manage professionals**           | ❌             | ❌             | ❌             | ✅             |
| **Manage professional schedules**  | ❌             | ❌             | ❌             | ✅             |
| **Manage boxes**                   | ❌             | ❌             | ❌             | ✅             |
| **Manage treatment catalog**       | ❌             | ❌             | ❌             | ✅             |
| **Manage budget types**            | ❌             | ❌             | ❌             | ✅             |
| **Manage discounts**               | ❌             | ❌             | ❌             | ✅             |
| **Manage expenses**                | ❌             | ❌             | ❌             | ✅             |
| **Manage roles & permissions**     | ❌             | ❌             | ❌             | ✅             |

---

## 8. Context API Reference

### 8.1 Hook: `useConfiguration()`

The `useConfiguration()` hook provides access to all configuration state and operations. Must be used within `ConfigurationProvider`.

#### Clinic Info

| Property / Method           | Type                                  | Description                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| `clinicInfo`                | `ClinicInfo`                          | Current clinic info            |
| `updateClinicInfo()`        | `(updates: Partial<ClinicInfo>) => void` | Update clinic info          |

#### Clinics

| Property / Method           | Type                                  | Description                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| `clinics`                   | `Clinic[]`                            | All clinics                    |
| `addClinic()`               | `(clinic: Omit<Clinic, 'id'>) => void` | Add new clinic              |
| `updateClinic()`            | `(id, updates) => void`              | Update clinic                  |
| `deleteClinic()`            | `(id) => void`                        | Delete clinic                  |

#### Professionals

| Property / Method                  | Type                               | Description                          |
| ---------------------------------- | ---------------------------------- | ------------------------------------ |
| `professionals`                    | `Professional[]`                   | All professionals                    |
| `activeProfessionals`              | `Professional[]`                   | Only active (derived)                |
| `addProfessional()`                | `(prof) => void`                   | Add new professional                 |
| `updateProfessional()`             | `(id, updates) => void`           | Update professional                  |
| `deleteProfessional()`             | `(id) => void`                     | Delete professional                  |
| `getProfessionalById()`            | `(id) => Professional \| undefined`| Find by ID                           |
| `getProfessionalByName()`          | `(name) => Professional \| undefined`| Find by name                      |
| `professionalOptions`              | `{id, label, color}[]`            | For agenda dropdowns                 |
| `professionalNameOptions`          | `{value, label}[]`                | For patient module dropdowns         |
| `professionalNames`                | `string[]`                         | Simple name array                    |

#### Boxes

| Property / Method           | Type                                  | Description                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| `boxes`                     | `Box[]`                               | All boxes                      |
| `activeBoxes`               | `Box[]`                               | Only active (derived)          |
| `addBox()`                  | `(box) => void`                       | Add box                        |
| `updateBox()`               | `(id, updates) => void`              | Update box                     |
| `deleteBox()`               | `(id) => void`                        | Delete box                     |
| `boxOptions`                | `{id, label}[]`                       | For agenda dropdowns           |

#### Working Hours

| Property / Method           | Type                                  | Description                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| `workingHours`              | `WorkingHoursConfig`                  | Clinic working hours           |
| `updateWorkingHours()`      | `(updates) => void`                  | Update hours                   |
| `getPeriodConfig()`         | `(period) => {startHour, endHour}`   | Get period boundaries          |

#### Schedules

| Property / Method                       | Type                                  | Description                         |
| --------------------------------------- | ------------------------------------- | ----------------------------------- |
| `professionalSchedules`                 | `ProfessionalSchedule[]`              | All schedules                       |
| `scheduleTemplates`                     | `ScheduleTemplate[]`                  | 5 predefined templates              |
| `getProfessionalSchedule()`             | `(profId) => ProfessionalSchedule`    | Get schedule for professional       |
| `updateProfessionalSchedule()`          | `(profId, schedule) => void`          | Set weekly schedule                 |
| `applyTemplateToProfessional()`         | `(profId, templateId) => void`        | Apply template                      |
| `addScheduleException()`               | `(exception) => void`                 | Add vacation/holiday/absence        |
| `removeScheduleException()`             | `(exceptionId) => void`              | Remove exception                    |
| `copySchedule()`                        | `(fromId, toId) => void`             | Copy schedule between professionals |
| `isProfessionalAvailable()`             | `(profId, date, time) => boolean`    | Check availability                  |
| `getProfessionalScheduleForDate()`      | `(profId, date) => DaySchedule`      | Get schedule for specific date      |
| `getAvailableProfessionalsForDate()`    | `(date) => Professional[]`           | Get available professionals         |

#### Treatments & Catalog

| Property / Method              | Type                                  | Description                    |
| ------------------------------ | ------------------------------------- | ------------------------------ |
| `treatmentCategories`          | `ConfigCategory[]`                    | All categories + treatments    |
| `setTreatmentCategories`       | `Dispatch<SetStateAction<...>>`       | Direct setter                  |
| `addTreatmentCategory()`       | `(category) => void`                 | Add category                   |
| `updateTreatmentCategory()`    | `(id, updates) => void`             | Update category                |
| `deleteTreatmentCategory()`    | `(id) => void`                       | Delete category                |

#### Discounts

| Property / Method           | Type                                  | Description                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| `discounts`                 | `ConfigDiscount[]`                    | All discounts                  |
| `activeDiscounts`           | `ConfigDiscount[]`                    | Only active (derived)          |
| `discountOptions`           | `string[]`                            | Formatted for dropdowns        |
| `addDiscount()`             | `(discount) => void`                 | Add discount                   |
| `updateDiscount()`          | `(id, updates) => void`             | Update discount                |
| `deleteDiscount()`          | `(id) => void`                       | Delete discount                |

#### Budget Types

| Property / Method           | Type                                  | Description                    |
| --------------------------- | ------------------------------------- | ------------------------------ |
| `budgetTypes`               | `BudgetTypeData[]`                    | All budget types               |
| `addBudgetType()`           | `(bt) => void`                       | Add budget type                |
| `updateBudgetType()`        | `(id, updates) => void`             | Update budget type             |
| `deleteBudgetType()`        | `(id) => void`                       | Delete budget type             |

#### Expenses

Similar CRUD patterns for `expenses` (see Context file for full API).

#### Roles & Permissions

| Property / Method              | Type                                  | Description                    |
| ------------------------------ | ------------------------------------- | ------------------------------ |
| `roles`                        | `ConfigRole[]`                        | All roles (with `permisos[]`)  |
| `setRoles`                     | `Dispatch<SetStateAction<...>>`       | Direct setter                  |
| `addRole()`                    | `(role) => void`                     | Add role                       |
| `updateRole()`                 | `(id, updates) => void`             | Update role                    |
| `deleteRole()`                 | `(id) => void`                       | Delete role                    |
| `toggleRolePermission()`       | `(roleId, permissionId) => void`    | Toggle permission for a role   |
| `permissions`                  | `ConfigPermission[]`                  | All permissions                |
| `setPermissions`               | `Dispatch<SetStateAction<...>>`       | Direct setter                  |
| `updatePermission()`           | `(id, updates) => void`             | Update permission              |

---

## 9. Notes for the Team

### 9.1 Configuration as the Foundation

Configuration is the **first module that must have backend persistence** because all other modules depend on it. Without configuration data, the agenda has no professionals, the patient module has no treatments, and the cash register has no templates.

**Implementation priority:**
1. `staff` + `boxes` (Agenda depends on these)
2. `treatment_catalog` + `discounts` (Patient module depends on these)
3. `document_templates` (PDF generation depends on these)
4. `clinic_settings` (Everything uses clinic info)
5. `roles` + `permissions` (Access control)
6. `expenses` (Management module)

### 9.2 Context Size Concern

`ConfigurationContext.tsx` at ~1950 lines is the largest context file. Consider splitting into sub-contexts in the future:

```
ConfigurationContext (meta)
├── ClinicContext (clinic info, clinics, working hours)
├── StaffContext (professionals, schedules)
├── CatalogContext (treatments, discounts, budget types)
├── TemplateContext (document templates)
└── AdminContext (roles, permissions, expenses)
```

### 9.3 No Persistence — Critical Limitation

All configuration data resets on page reload. This is the most critical technical debt in the project. Every `useState` with initial mock data needs to be replaced with Supabase queries + real-time subscriptions.

### 9.4 Template System

The HTML template system with placeholders (`{{...}}`) is custom-built. Consider using a proper template engine (Handlebars, Mustache) when moving to production for:
- Conditional rendering
- Loop support (multiple treatments/medications)
- Nested data access
- Template validation

---

## 10. References

- **Layout**: `src/app/configuracion/layout.tsx`
- **Navigation**: `src/components/configuracion/configNavItems.ts`
- **Context**: `src/context/ConfigurationContext.tsx`
- **Components**: `src/components/configuracion/`
- **Types**: `src/types/treatments.ts`, `src/types/configExpenses.ts`, `src/types/configRoles.ts`
- **Data**: `src/data/rolesData.ts`, `src/data/expensesData.ts`, `src/data/treatmentConfigData.ts`
- **Budget Types**: `src/components/pacientes/shared/budgetTypeData.ts`
- **Related Brief**: `docs/TECHNICAL_BRIEF_PATIENT_RECORD.md` (sections 3.5, 11.2.5)

---

_Document generated on February 11, 2026_  
_Updated on February 12, 2026_  
_Version 1.2 — Configuration Module (v1.1: employment type differentiation; v1.2: role-permission matrix)_
