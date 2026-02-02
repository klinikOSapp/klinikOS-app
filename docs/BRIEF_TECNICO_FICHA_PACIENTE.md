# Brief Técnico: Ficha del Paciente - klinikOS

**Fecha:** 2 de Febrero de 2026  
**Versión:** 1.0  
**Estado:** MVP (Primera versión completa)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Arquitectura:** Multi-tenant desde el inicio

---

## 1. Visión General

### 1.1 Descripción

La **Ficha del Paciente** es el componente central del sistema klinikOS. Concentra toda la información de un paciente y se conecta con prácticamente todas las demás funcionalidades del sistema.

### 1.2 Módulos de la Ficha

La ficha está organizada en **8 secciones principales**:

| #   | Sección                 | Descripción                                                       |
| --- | ----------------------- | ----------------------------------------------------------------- |
| 1   | **Resumen**             | Vista general con información clave, alertas, próxima cita, deuda |
| 2   | **Información General** | Datos personales, contacto, emergencia, datos administrativos     |
| 3   | **Historial Clínico**   | Visitas, notas SOAP, odontograma por visita, adjuntos             |
| 4   | **Tratamientos**        | Tratamientos pendientes, en curso, completados                    |
| 5   | **Imágenes RX**         | Radiografías, fotos intraorales, archivos DICOM                   |
| 6   | **Finanzas**            | Presupuestos, pagos, facturas, planes de financiación             |
| 7   | **Documentos**          | Consentimientos informados (PDF firmados)                         |
| 8   | **Recetas**             | Prescripciones médicas (generación PDF)                           |

### 1.3 Principios de Diseño

- **Multi-tenant**: Todas las tablas incluyen `clinic_id` para aislamiento de datos
- **Auditoría completa**: Log de todos los cambios con usuario y timestamp
- **Cumplimiento RGPD**: Registro de accesos a datos sensibles
- **Inmutabilidad selectiva**: Notas SOAP finalizadas no pueden editarse
- **Soft delete**: Los registros se marcan como eliminados, no se borran físicamente

---

## 2. Arquitectura de Datos

### 2.1 Diagrama de Entidades Principal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLINICS                                         │
│                         (Tabla principal tenant)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PATIENTS                                        │
│                        (Entidad central del sistema)                         │
└─────────────────────────────────────────────────────────────────────────────┘
         │              │              │              │              │
         │ 1:N          │ 1:N          │ 1:N          │ 1:N          │ 1:N
         ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ APPOINTMENTS│ │ TREATMENTS  │ │  BUDGETS    │ │  CONSENTS   │ │PRESCRIPTIONS│
│   (Citas)   │ │(Tratamientos)│ │(Presupuestos)│ │(Consenti.)  │ │  (Recetas)  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
      │                │              │
      │ 1:N            │              │ 1:N
      ▼                │              ▼
┌─────────────┐        │        ┌─────────────┐
│VISIT_RECORDS│        │        │  PAYMENTS   │
│(Hist. Visita)│       │        │   (Pagos)   │
└─────────────┘        │        └─────────────┘
      │                │              │
      │ 1:N            │              │ 1:N
      ▼                ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ SOAP_NOTES  │ │ODONTOGRAM_  │ │  INVOICES   │
│(Notas SOAP) │ │  HISTORY    │ │ (Facturas)  │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 2.2 Entidades Auxiliares

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTIDADES DE CONFIGURACIÓN                         │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ TREATMENT_      │ CONSENT_        │ STAFF           │ CLINIC_               │
│ CATALOG         │ TEMPLATES       │ (Profesionales) │ SETTINGS              │
│ (Catálogo trat.)│ (Plantillas)    │                 │ (Config. clínica)     │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTIDADES DE SOPORTE                               │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ PATIENT_        │ PATIENT_        │ PATIENT_        │ PATIENT_              │
│ ALLERGIES       │ ALERTS          │ FILES           │ MEDICAL_HISTORY       │
│ (Alergias)      │ (Alertas)       │ (Archivos/RX)   │ (Antecedentes)        │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTIDADES DE AUDITORÍA                             │
├─────────────────────────────────────┬───────────────────────────────────────┤
│ AUDIT_LOG                           │ ACCESS_LOG                            │
│ (Log de cambios)                    │ (Log de accesos - RGPD)               │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Definición de Tablas

### 3.1 Tabla Principal: `patients`

```sql
CREATE TABLE patients (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_number VARCHAR(20), -- Número interno de paciente (auto-generado por clínica)

    -- Información personal básica
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

    -- Documentación
    document_type VARCHAR(20) CHECK (document_type IN ('DNI', 'NIE', 'Pasaporte', 'Otro')),
    document_number VARCHAR(50),

    -- Datos demográficos
    gender VARCHAR(20) CHECK (gender IN ('Masculino', 'Femenino', 'Otro', 'No especificado')),
    birth_date DATE,
    nationality VARCHAR(100),
    preferred_language VARCHAR(50) DEFAULT 'Español',

    -- Contacto principal
    phone VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    preferred_contact_method VARCHAR(20) CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp', 'sms')),

    -- Dirección
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_province VARCHAR(100),
    address_country VARCHAR(100) DEFAULT 'España',

    -- Contacto de emergencia
    emergency_contact_name VARCHAR(150),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),

    -- Estado del paciente
    status VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Alta')),
    is_vip BOOLEAN DEFAULT FALSE,

    -- Origen y marketing
    source VARCHAR(100), -- "Google", "Recomendación", "Redes sociales", etc.
    referred_by_patient_id UUID REFERENCES patients(id),
    referred_by_name VARCHAR(150),
    allows_marketing_communications BOOLEAN DEFAULT FALSE,
    allows_appointment_reminders BOOLEAN DEFAULT TRUE,

    -- Pre-registro
    pre_registration_complete BOOLEAN DEFAULT FALSE,
    pre_registration_date TIMESTAMPTZ,

    -- Información administrativa
    occupation VARCHAR(100),
    consultation_reason TEXT, -- Motivo inicial de consulta

    -- Facturación empresa (opcional)
    billing_to_company BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(200),
    company_cif VARCHAR(20),
    company_address TEXT,

    -- Métodos de pago preferidos
    preferred_payment_method_1 VARCHAR(50),
    preferred_payment_method_2 VARCHAR(50),
    has_financing BOOLEAN DEFAULT FALSE,

    -- Notas
    notes TEXT,
    internal_notes TEXT, -- Notas internas (no visibles para el paciente)

    -- Avatar/Foto
    avatar_url TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT unique_document_per_clinic UNIQUE (clinic_id, document_type, document_number),
    CONSTRAINT unique_patient_number_per_clinic UNIQUE (clinic_id, patient_number)
);

-- Índices
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_document ON patients(document_type, document_number);
CREATE INDEX idx_patients_status ON patients(clinic_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('spanish', full_name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));
```

### 3.2 Tabla: `patient_allergies`

```sql
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Información de la alergia
    allergen_name VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('leve', 'moderada', 'grave', 'extrema')),
    reaction_description TEXT,
    notes TEXT,

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    confirmed_by_doctor BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES auth.users(id),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_allergies_patient ON patient_allergies(patient_id) WHERE is_active = TRUE;
CREATE INDEX idx_patient_allergies_severity ON patient_allergies(patient_id, severity);
```

### 3.3 Tabla: `patient_medical_history`

```sql
CREATE TABLE patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Condiciones médicas (array para flexibilidad)
    conditions JSONB DEFAULT '[]', -- [{name: "Diabetes", notes: "Tipo 2", since: "2020"}]

    -- Medicación actual
    medications JSONB DEFAULT '[]', -- [{name: "Metformina", dosage: "850mg", frequency: "2/día"}]

    -- Antecedentes médicos relevantes
    medical_background TEXT,
    surgical_history TEXT,
    family_history TEXT,

    -- Hábitos
    is_smoker BOOLEAN DEFAULT FALSE,
    smoking_details VARCHAR(200),
    alcohol_consumption VARCHAR(100),

    -- Embarazo (si aplica)
    is_pregnant BOOLEAN DEFAULT FALSE,
    pregnancy_weeks INTEGER,

    -- Otros
    dental_fear_level VARCHAR(20) CHECK (dental_fear_level IN ('ninguno', 'leve', 'moderado', 'severo')),
    dental_fear_notes TEXT,

    -- Control
    last_medical_review TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_patient_medical_history_unique ON patient_medical_history(patient_id);
```

### 3.4 Tabla: `patient_alerts`

```sql
CREATE TABLE patient_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo y prioridad
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('medical', 'financial', 'administrative', 'recall', 'custom')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Contenido
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Configuración de visualización
    is_active BOOLEAN DEFAULT TRUE,
    show_on_file_open BOOLEAN DEFAULT TRUE, -- Mostrar al abrir ficha
    show_on_appointment BOOLEAN DEFAULT TRUE, -- Mostrar al gestionar cita

    -- Caducidad
    expires_at TIMESTAMPTZ,

    -- Auto-generación
    is_auto_generated BOOLEAN DEFAULT FALSE,
    auto_generation_rule VARCHAR(100), -- "debt_over_30_days", "severe_allergy", etc.

    -- Dismissal (descarte temporal)
    dismissed_at TIMESTAMPTZ,
    dismissed_by UUID REFERENCES auth.users(id),
    dismiss_until TIMESTAMPTZ, -- Hasta cuándo está descartada

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_alerts_active ON patient_alerts(patient_id, is_active, priority);
CREATE INDEX idx_patient_alerts_show ON patient_alerts(patient_id)
    WHERE is_active = TRUE AND (dismissed_at IS NULL OR dismiss_until < NOW());
```

### 3.5 Tabla: `treatment_catalog` (Configuración)

```sql
CREATE TABLE treatment_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Identificación
    code VARCHAR(20) NOT NULL, -- "LDE", "EMP", "END"
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Categorización
    category VARCHAR(100), -- "Higiene", "Conservadora", "Endodoncia", "Cirugía"
    subcategory VARCHAR(100),

    -- Precios
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Configuración
    requires_tooth_selection BOOLEAN DEFAULT FALSE,
    requires_face_selection BOOLEAN DEFAULT FALSE, -- Cara del diente
    default_duration_minutes INTEGER DEFAULT 30,

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_treatment_code_per_clinic UNIQUE (clinic_id, code)
);

CREATE INDEX idx_treatment_catalog_clinic ON treatment_catalog(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_treatment_catalog_category ON treatment_catalog(clinic_id, category);
```

### 3.6 Tabla: `patient_treatments`

```sql
CREATE TABLE patient_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Referencia al catálogo
    treatment_catalog_id UUID REFERENCES treatment_catalog(id),
    treatment_code VARCHAR(20), -- Copia del código para histórico
    treatment_name VARCHAR(200) NOT NULL,

    -- Detalle dental
    tooth_number VARCHAR(10), -- "36", "11-21" para rangos
    tooth_face VARCHAR(20), -- "mesial", "distal", "oclusal", etc.
    quadrant VARCHAR(5), -- "Q1", "Q2", "Q3", "Q4"

    -- Precio y pagos
    amount DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    paid_amount DECIMAL(10,2) DEFAULT 0,

    -- Estado
    status VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (status IN ('Pendiente', 'En curso', 'Completado', 'Cancelado')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Sin pagar'
        CHECK (payment_status IN ('Sin pagar', 'Parcial', 'Pagado')),

    -- Programación
    scheduled_date DATE,
    scheduled_appointment_id UUID REFERENCES appointments(id),

    -- Realización
    completed_date TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    completed_by_name VARCHAR(150),

    -- Presupuesto asociado
    budget_id UUID REFERENCES budgets(id),
    budget_item_id UUID,

    -- Notas
    notes TEXT,

    -- Marcado para próxima cita
    marked_for_next_appointment BOOLEAN DEFAULT FALSE,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_treatments_patient ON patient_treatments(patient_id);
CREATE INDEX idx_patient_treatments_status ON patient_treatments(patient_id, status);
CREATE INDEX idx_patient_treatments_scheduled ON patient_treatments(scheduled_date) WHERE status = 'Pendiente';
CREATE INDEX idx_patient_treatments_budget ON patient_treatments(budget_id);
```

### 3.7 Tabla: `appointments` (Citas)

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Fecha y hora
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Asignación
    professional_id UUID REFERENCES staff(id),
    professional_name VARCHAR(150),
    box VARCHAR(20), -- "box 1", "box 2"

    -- Información de la cita
    reason TEXT NOT NULL, -- Motivo de consulta
    appointment_type VARCHAR(50), -- "Primera visita", "Revisión", "Tratamiento"

    -- Estados
    confirmation_status VARCHAR(20) DEFAULT 'No confirmada'
        CHECK (confirmation_status IN ('Confirmada', 'No confirmada', 'Reagendar')),
    visit_status VARCHAR(30) DEFAULT 'scheduled'
        CHECK (visit_status IN ('scheduled', 'confirmed', 'in_waiting_room', 'in_consultation', 'completed', 'no_show', 'cancelled')),

    -- Timestamps del flujo de visita
    arrived_at TIMESTAMPTZ,
    consultation_started_at TIMESTAMPTZ,
    consultation_ended_at TIMESTAMPTZ,

    -- Duraciones calculadas (en minutos)
    waiting_duration_minutes INTEGER,
    consultation_duration_minutes INTEGER,

    -- Cobro
    has_pending_charge BOOLEAN DEFAULT FALSE,

    -- Tags
    tags JSONB DEFAULT '[]', -- ["deuda", "vip"]

    -- Notas
    notes TEXT,

    -- Color para calendario
    bg_color VARCHAR(20),

    -- Soft delete
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_appointments_date ON appointments(clinic_id, appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(clinic_id, visit_status, appointment_date);
```

### 3.8 Tabla: `visit_records` (Historial de Visitas)

```sql
CREATE TABLE visit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Profesional que atendió
    attending_professional_id UUID REFERENCES staff(id),
    attending_professional_name VARCHAR(150),

    -- Fecha de la visita
    visit_date DATE NOT NULL,

    -- Estado del odontograma en esta visita (snapshot JSON)
    odontogram_snapshot JSONB,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_visit_records_patient ON visit_records(patient_id);
CREATE INDEX idx_visit_records_date ON visit_records(patient_id, visit_date DESC);
```

### 3.9 Tabla: `soap_notes` (Notas Clínicas SOAP)

```sql
CREATE TABLE soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_record_id UUID NOT NULL REFERENCES visit_records(id) ON DELETE CASCADE,

    -- Contenido SOAP
    subjective TEXT, -- Síntomas reportados por el paciente
    objective TEXT, -- Hallazgos clínicos
    assessment TEXT, -- Diagnóstico/evaluación
    plan TEXT, -- Plan de tratamiento

    -- Estado de las notas
    is_draft BOOLEAN DEFAULT TRUE,
    is_finalized BOOLEAN DEFAULT FALSE, -- Una vez finalizado, NO se puede editar

    -- Finalización (inmutabilidad)
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES auth.users(id),
    finalized_by_name VARCHAR(150),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraint: solo una nota SOAP por visita
    CONSTRAINT unique_soap_per_visit UNIQUE (visit_record_id)
);

-- RLS: Bloquear updates cuando is_finalized = TRUE
-- Se implementa via trigger
```

### 3.10 Tabla: `patient_files` (Archivos/Imágenes RX)

```sql
CREATE TABLE patient_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Puede estar asociado a una visita específica
    visit_record_id UUID REFERENCES visit_records(id),
    appointment_id UUID REFERENCES appointments(id),

    -- Información del archivo
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    file_type VARCHAR(50) NOT NULL, -- "image", "document", "xray", "dicom", "3d_scan"
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,

    -- Almacenamiento
    storage_path TEXT NOT NULL, -- Path en Supabase Storage
    storage_bucket VARCHAR(100) DEFAULT 'patient-files',

    -- Categorización
    category VARCHAR(50), -- "panoramica", "periapical", "intraoral", "foto", "documento"
    subcategory VARCHAR(50),

    -- Metadata para DICOM
    dicom_metadata JSONB, -- Almacena metadata DICOM si aplica

    -- Descripción
    description TEXT,
    notes TEXT,

    -- Diente asociado (si aplica)
    tooth_number VARCHAR(10),

    -- Thumbnails
    thumbnail_path TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_files_patient ON patient_files(patient_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_patient_files_type ON patient_files(patient_id, file_type);
CREATE INDEX idx_patient_files_visit ON patient_files(visit_record_id);
```

### 3.11 Tabla: `budgets` (Presupuestos)

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Identificación
    budget_number VARCHAR(50), -- Número de presupuesto (auto-generado)
    budget_name VARCHAR(200), -- Nombre descriptivo opcional

    -- Estado
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente'
        CHECK (status IN ('Borrador', 'Pendiente', 'Enviado', 'Aceptado', 'Rechazado', 'En curso', 'Completado', 'Cancelado')),

    -- Fechas
    created_date DATE DEFAULT CURRENT_DATE,
    sent_date DATE,
    accepted_date DATE,
    valid_until DATE, -- Fecha de validez

    -- Totales
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Pagos
    paid_amount DECIMAL(12,2) DEFAULT 0,
    pending_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

    -- Profesional que creó
    created_by_professional_id UUID REFERENCES staff(id),
    created_by_professional_name VARCHAR(150),

    -- Notas
    notes TEXT,
    internal_notes TEXT,
    terms_and_conditions TEXT,

    -- PDF generado
    pdf_storage_path TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_budget_number_per_clinic UNIQUE (clinic_id, budget_number)
);

CREATE INDEX idx_budgets_patient ON budgets(patient_id);
CREATE INDEX idx_budgets_status ON budgets(clinic_id, status);
```

### 3.12 Tabla: `budget_items` (Líneas de Presupuesto)

```sql
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Tratamiento
    treatment_catalog_id UUID REFERENCES treatment_catalog(id),
    treatment_code VARCHAR(20),
    treatment_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Detalle dental
    tooth_number VARCHAR(10),
    tooth_face VARCHAR(20),

    -- Cantidades
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,

    -- Orden de visualización
    sort_order INTEGER DEFAULT 0,

    -- Estado de producción
    is_produced BOOLEAN DEFAULT FALSE,
    produced_at TIMESTAMPTZ,
    produced_by UUID REFERENCES auth.users(id),

    -- Referencia al tratamiento del paciente (cuando se acepta)
    patient_treatment_id UUID REFERENCES patient_treatments(id),

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
```

### 3.13 Tabla: `payments` (Pagos)

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Referencias opcionales
    budget_id UUID REFERENCES budgets(id),
    appointment_id UUID REFERENCES appointments(id),
    invoice_id UUID REFERENCES invoices(id),

    -- Detalles del pago
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(50) NOT NULL, -- "Efectivo", "Tarjeta", "Transferencia", "Bizum", etc.

    -- Referencia/Concepto
    reference VARCHAR(100),
    concept TEXT,

    -- Fecha
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_time TIME DEFAULT CURRENT_TIME,

    -- Estado
    status VARCHAR(20) DEFAULT 'Completado' CHECK (status IN ('Pendiente', 'Completado', 'Anulado', 'Devuelto')),

    -- Anulación
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES auth.users(id),
    void_reason TEXT,

    -- Notas
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_date ON payments(clinic_id, payment_date);
CREATE INDEX idx_payments_budget ON payments(budget_id);
```

### 3.14 Tabla: `patient_consents` (Consentimientos)

```sql
CREATE TABLE patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Tipo de consentimiento
    consent_template_id UUID REFERENCES consent_templates(id),
    consent_type VARCHAR(100) NOT NULL, -- "Consentimiento general", "Ortodoncia", etc.

    -- Estado
    status VARCHAR(30) NOT NULL DEFAULT 'Pendiente'
        CHECK (status IN ('Pendiente', 'Enviado', 'Firmado', 'Rechazado', 'Caducado')),

    -- Fechas
    sent_date TIMESTAMPTZ,
    signed_date TIMESTAMPTZ,
    expiry_date DATE,

    -- Documento firmado
    signed_document_path TEXT, -- Path al PDF firmado en Storage
    signed_document_name VARCHAR(255),

    -- Tratamiento relacionado (opcional)
    related_treatment_id UUID REFERENCES patient_treatments(id),

    -- Notas
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_consents_patient ON patient_consents(patient_id);
CREATE INDEX idx_patient_consents_status ON patient_consents(patient_id, status);
```

### 3.15 Tabla: `prescriptions` (Recetas)

```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Número de receta
    prescription_number VARCHAR(50),

    -- Profesional que prescribe
    prescribing_professional_id UUID REFERENCES staff(id),
    prescribing_professional_name VARCHAR(150) NOT NULL,
    prescribing_professional_license VARCHAR(50), -- Número de colegiado

    -- Visita relacionada (opcional)
    visit_record_id UUID REFERENCES visit_records(id),
    appointment_id UUID REFERENCES appointments(id),

    -- Fecha
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Estado
    status VARCHAR(30) DEFAULT 'Emitida' CHECK (status IN ('Borrador', 'Emitida', 'Enviada', 'Anulada')),

    -- PDF generado
    pdf_storage_path TEXT,

    -- Notas
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_prescription_number_per_clinic UNIQUE (clinic_id, prescription_number)
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date DESC);
```

### 3.16 Tabla: `prescription_items` (Medicamentos de Receta)

```sql
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,

    -- Medicamento
    medication_name VARCHAR(200) NOT NULL,
    active_ingredient VARCHAR(200),

    -- Posología
    dosage VARCHAR(100), -- "500mg"
    frequency VARCHAR(100), -- "Cada 8 horas"
    duration VARCHAR(100), -- "7 días"
    administration_route VARCHAR(50), -- "Oral", "Tópico", etc.

    -- Cantidad
    quantity INTEGER DEFAULT 1,

    -- Instrucciones adicionales
    instructions TEXT,

    -- Orden
    sort_order INTEGER DEFAULT 0,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
```

### 3.17 Tabla: `odontogram_history` (Historial de Odontograma)

```sql
CREATE TABLE odontogram_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_record_id UUID REFERENCES visit_records(id),

    -- Snapshot del odontograma
    odontogram_data JSONB NOT NULL, -- Estado completo del odontograma

    -- Cambio específico (si es incremental)
    tooth_number VARCHAR(5),
    change_type VARCHAR(50), -- "treatment_added", "condition_updated", etc.
    change_details JSONB,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_odontogram_history_patient ON odontogram_history(patient_id);
CREATE INDEX idx_odontogram_history_visit ON odontogram_history(visit_record_id);
```

---

## 4. Tablas de Auditoría

### 4.1 Tabla: `audit_log` (Log de Cambios)

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id),

    -- Qué se modificó
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,

    -- Tipo de operación
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE')),

    -- Datos
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[], -- Lista de campos que cambiaron

    -- Quién y cuándo
    performed_by UUID REFERENCES auth.users(id),
    performed_by_email VARCHAR(255),
    performed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contexto adicional
    ip_address INET,
    user_agent TEXT,

    -- Para pacientes específicamente
    patient_id UUID REFERENCES patients(id)
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_patient ON audit_log(patient_id);
CREATE INDEX idx_audit_log_date ON audit_log(performed_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(performed_by);
```

### 4.2 Tabla: `access_log` (Log de Accesos - RGPD)

```sql
CREATE TABLE access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),

    -- Quién accedió
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- A qué accedió
    resource_type VARCHAR(50) NOT NULL, -- "patient_file", "medical_history", etc.
    resource_id UUID,
    patient_id UUID REFERENCES patients(id),

    -- Tipo de acceso
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT')),

    -- Detalles
    access_details JSONB,

    -- Cuándo
    accessed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contexto
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_access_log_patient ON access_log(patient_id);
CREATE INDEX idx_access_log_user ON access_log(user_id);
CREATE INDEX idx_access_log_date ON access_log(accessed_at DESC);
```

---

## 5. Row Level Security (RLS)

### 5.1 Política Base Multi-Tenant

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener clinic_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT clinic_id
        FROM user_clinic_assignments
        WHERE user_id = auth.uid()
        AND is_active = TRUE
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política ejemplo para patients
CREATE POLICY "Users can view patients from their clinic"
ON patients FOR SELECT
USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can insert patients in their clinic"
ON patients FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can update patients in their clinic"
ON patients FOR UPDATE
USING (clinic_id = get_user_clinic_id());

-- Soft delete policy
CREATE POLICY "Users can soft delete patients in their clinic"
ON patients FOR UPDATE
USING (clinic_id = get_user_clinic_id())
WITH CHECK (clinic_id = get_user_clinic_id());
```

### 5.2 Políticas por Rol

```sql
-- Función helper para verificar rol
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_clinic_assignments uca
        JOIN roles r ON uca.role_id = r.id
        WHERE uca.user_id = auth.uid()
        AND uca.is_active = TRUE
        AND r.name = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Solo admin puede ver audit_log completo
CREATE POLICY "Only admins can view audit log"
ON audit_log FOR SELECT
USING (
    clinic_id = get_user_clinic_id()
    AND has_role('Administrador')
);
```

---

## 6. Triggers

### 6.1 Trigger de Auditoría

```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_changed_fields TEXT[];
    v_patient_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_patient_id := CASE
            WHEN TG_TABLE_NAME = 'patients' THEN OLD.id
            ELSE OLD.patient_id
        END;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_patient_id := CASE
            WHEN TG_TABLE_NAME = 'patients' THEN NEW.id
            ELSE NEW.patient_id
        END;
        -- Calcular campos cambiados
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_old_data) old_kv
        WHERE v_new_data->key IS DISTINCT FROM old_kv.value;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_data := NULL;
        v_new_data := to_jsonb(NEW);
        v_patient_id := CASE
            WHEN TG_TABLE_NAME = 'patients' THEN NEW.id
            ELSE NEW.patient_id
        END;
    END IF;

    INSERT INTO audit_log (
        clinic_id,
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_fields,
        performed_by,
        patient_id
    ) VALUES (
        COALESCE(NEW.clinic_id, OLD.clinic_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_data,
        v_new_data,
        v_changed_fields,
        auth.uid(),
        v_patient_id
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a tablas principales
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patient_treatments
    AFTER INSERT OR UPDATE OR DELETE ON patient_treatments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ... aplicar a otras tablas según necesidad
```

### 6.2 Trigger de Inmutabilidad SOAP Notes

```sql
CREATE OR REPLACE FUNCTION prevent_finalized_soap_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_finalized = TRUE THEN
        RAISE EXCEPTION 'No se pueden modificar notas SOAP finalizadas. Las notas fueron finalizadas el % por %.',
            OLD.finalized_at, OLD.finalized_by_name;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soap_notes_immutability
    BEFORE UPDATE ON soap_notes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_finalized_soap_update();
```

### 6.3 Trigger de Alertas Automáticas

```sql
CREATE OR REPLACE FUNCTION check_auto_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Alerta por deuda > 30 días
    IF TG_TABLE_NAME = 'payments' OR TG_TABLE_NAME = 'budgets' THEN
        -- Verificar deuda pendiente
        PERFORM create_debt_alert_if_needed(NEW.patient_id);
    END IF;

    -- Alerta por alergia grave
    IF TG_TABLE_NAME = 'patient_allergies' THEN
        IF NEW.severity IN ('grave', 'extrema') THEN
            INSERT INTO patient_alerts (
                clinic_id, patient_id, alert_type, priority, title, message,
                is_auto_generated, auto_generation_rule
            ) VALUES (
                NEW.clinic_id, NEW.patient_id, 'medical', 'critical',
                'Alergia ' || NEW.severity || ': ' || NEW.allergen_name,
                'El paciente tiene una alergia ' || NEW.severity || ' a ' || NEW.allergen_name || '. ' || COALESCE(NEW.reaction_description, ''),
                TRUE, 'severe_allergy'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 6.4 Trigger de Actualización de updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER set_updated_at_patients
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... repetir para otras tablas
```

### 6.5 Trigger de Número de Paciente Auto-generado

```sql
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR(10);
BEGIN
    -- Obtener prefijo de la clínica (configurable)
    SELECT COALESCE(patient_number_prefix, 'PAC') INTO v_prefix
    FROM clinic_settings
    WHERE clinic_id = NEW.clinic_id;

    -- Obtener siguiente número
    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO v_next_number
    FROM patients
    WHERE clinic_id = NEW.clinic_id;

    NEW.patient_number := v_prefix || '-' || LPAD(v_next_number::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_patient_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    WHEN (NEW.patient_number IS NULL)
    EXECUTE FUNCTION generate_patient_number();
```

---

## 7. Funciones de Base de Datos (Supabase Edge Functions / PostgreSQL Functions)

### 7.1 Función: Obtener Resumen Financiero del Paciente

```sql
CREATE OR REPLACE FUNCTION get_patient_financial_summary(p_patient_id UUID)
RETURNS TABLE (
    total_budgeted DECIMAL,
    total_paid DECIMAL,
    total_pending DECIMAL,
    active_budgets_count INTEGER,
    pending_treatments_count INTEGER,
    overdue_invoices_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.status IN ('Aceptado', 'En curso')), 0)::DECIMAL as total_budgeted,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0)::DECIMAL as total_paid,
        COALESCE(SUM(b.pending_amount) FILTER (WHERE b.status IN ('Aceptado', 'En curso')), 0)::DECIMAL as total_pending,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('Aceptado', 'En curso'))::INTEGER as active_budgets_count,
        COUNT(DISTINCT pt.id) FILTER (WHERE pt.status = 'Pendiente')::INTEGER as pending_treatments_count,
        0::INTEGER as overdue_invoices_count -- Implementar cuando exista tabla invoices
    FROM patients pat
    LEFT JOIN budgets b ON b.patient_id = pat.id
    LEFT JOIN payments p ON p.patient_id = pat.id
    LEFT JOIN patient_treatments pt ON pt.patient_id = pat.id
    WHERE pat.id = p_patient_id
    GROUP BY pat.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.2 Función: Obtener Alertas Activas del Paciente

```sql
CREATE OR REPLACE FUNCTION get_active_patient_alerts(
    p_patient_id UUID,
    p_context VARCHAR DEFAULT 'all' -- 'all', 'file_open', 'appointment'
)
RETURNS TABLE (
    id UUID,
    alert_type VARCHAR,
    priority VARCHAR,
    title VARCHAR,
    message TEXT,
    expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pa.id,
        pa.alert_type,
        pa.priority,
        pa.title,
        pa.message,
        pa.expires_at
    FROM patient_alerts pa
    WHERE pa.patient_id = p_patient_id
    AND pa.is_active = TRUE
    AND (pa.expires_at IS NULL OR pa.expires_at > NOW())
    AND (pa.dismissed_at IS NULL OR pa.dismiss_until < NOW())
    AND (
        p_context = 'all'
        OR (p_context = 'file_open' AND pa.show_on_file_open = TRUE)
        OR (p_context = 'appointment' AND pa.show_on_appointment = TRUE)
    )
    ORDER BY
        CASE pa.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            ELSE 4
        END,
        pa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.3 Función: Buscar Pacientes

```sql
CREATE OR REPLACE FUNCTION search_patients(
    p_clinic_id UUID,
    p_search_term VARCHAR,
    p_status VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    patient_number VARCHAR,
    full_name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    status VARCHAR,
    birth_date DATE,
    last_appointment_date DATE,
    pending_amount DECIMAL,
    has_critical_alerts BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.patient_number,
        p.full_name,
        p.phone,
        p.email,
        p.status,
        p.birth_date,
        (SELECT MAX(a.appointment_date) FROM appointments a WHERE a.patient_id = p.id) as last_appointment_date,
        COALESCE((
            SELECT SUM(b.pending_amount)
            FROM budgets b
            WHERE b.patient_id = p.id AND b.status IN ('Aceptado', 'En curso')
        ), 0)::DECIMAL as pending_amount,
        EXISTS (
            SELECT 1 FROM patient_alerts pa
            WHERE pa.patient_id = p.id
            AND pa.is_active = TRUE
            AND pa.priority = 'critical'
        ) as has_critical_alerts
    FROM patients p
    WHERE p.clinic_id = p_clinic_id
    AND p.is_deleted = FALSE
    AND (p_status IS NULL OR p.status = p_status)
    AND (
        p_search_term IS NULL
        OR p.full_name ILIKE '%' || p_search_term || '%'
        OR p.phone ILIKE '%' || p_search_term || '%'
        OR p.email ILIKE '%' || p_search_term || '%'
        OR p.document_number ILIKE '%' || p_search_term || '%'
        OR p.patient_number ILIKE '%' || p_search_term || '%'
    )
    ORDER BY p.full_name
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.4 Función: Finalizar Notas SOAP

```sql
CREATE OR REPLACE FUNCTION finalize_soap_notes(p_soap_notes_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_name VARCHAR;
BEGIN
    -- Obtener nombre del usuario
    SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
    FROM auth.users
    WHERE id = auth.uid();

    UPDATE soap_notes
    SET
        is_draft = FALSE,
        is_finalized = TRUE,
        finalized_at = NOW(),
        finalized_by = auth.uid(),
        finalized_by_name = v_user_name
    WHERE id = p_soap_notes_id
    AND is_finalized = FALSE;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.5 Función: Importar Pacientes desde CSV

```sql
CREATE OR REPLACE FUNCTION import_patients_from_csv(
    p_clinic_id UUID,
    p_csv_data JSONB -- Array de objetos con datos de pacientes
)
RETURNS TABLE (
    total_processed INTEGER,
    total_imported INTEGER,
    total_errors INTEGER,
    errors JSONB
) AS $$
DECLARE
    v_patient JSONB;
    v_total_processed INTEGER := 0;
    v_total_imported INTEGER := 0;
    v_total_errors INTEGER := 0;
    v_errors JSONB := '[]'::JSONB;
BEGIN
    FOR v_patient IN SELECT * FROM jsonb_array_elements(p_csv_data)
    LOOP
        v_total_processed := v_total_processed + 1;

        BEGIN
            INSERT INTO patients (
                clinic_id,
                first_name,
                last_name,
                document_type,
                document_number,
                phone,
                email,
                birth_date,
                gender,
                address_street,
                address_city,
                address_postal_code,
                notes,
                created_by
            ) VALUES (
                p_clinic_id,
                v_patient->>'first_name',
                v_patient->>'last_name',
                COALESCE(v_patient->>'document_type', 'DNI'),
                v_patient->>'document_number',
                v_patient->>'phone',
                v_patient->>'email',
                (v_patient->>'birth_date')::DATE,
                v_patient->>'gender',
                v_patient->>'address',
                v_patient->>'city',
                v_patient->>'postal_code',
                v_patient->>'notes',
                auth.uid()
            );

            v_total_imported := v_total_imported + 1;

        EXCEPTION WHEN OTHERS THEN
            v_total_errors := v_total_errors + 1;
            v_errors := v_errors || jsonb_build_object(
                'row', v_total_processed,
                'data', v_patient,
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN QUERY SELECT v_total_processed, v_total_imported, v_total_errors, v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 8. Flujos de Datos entre Pantallas

### 8.1 Flujo: Creación de Paciente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO: CREACIÓN DE PACIENTE                          │
└─────────────────────────────────────────────────────────────────────────────┘

1. AddPatientModal (Frontend)
   │
   ├─→ Paso 1: Datos Paciente
   │   └─→ [first_name, last_name, document_type, document_number, birth_date, gender]
   │
   ├─→ Paso 2: Contacto
   │   └─→ [phone, email, allows_reminders, allows_marketing]
   │
   ├─→ Paso 3: Administrativo
   │   └─→ [professional_id, source, address, billing_company, payment_methods]
   │
   ├─→ Paso 4: Salud
   │   └─→ [allergies[], conditions[], medications[], is_pregnant, is_smoker]
   │
   ├─→ Paso 5: Consentimientos
   │   └─→ [consent_ids[] - selección de plantillas]
   │
   └─→ Paso 6: Resumen → SUBMIT
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    TRANSACCIÓN EN BASE DE DATOS                       │
├──────────────────────────────────────────────────────────────────────┤
│  BEGIN;                                                              │
│                                                                      │
│  1. INSERT INTO patients (...) RETURNING id;                         │
│     └─→ Trigger: generate_patient_number()                           │
│     └─→ Trigger: audit_trigger_function()                            │
│                                                                      │
│  2. INSERT INTO patient_allergies (patient_id, ...) -- por cada      │
│     └─→ Trigger: check_auto_alerts() -- si es grave/extrema          │
│                                                                      │
│  3. INSERT INTO patient_medical_history (patient_id, ...)            │
│                                                                      │
│  4. INSERT INTO patient_consents (patient_id, ...) -- por cada       │
│                                                                      │
│  COMMIT;                                                             │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
   Retorna patient_id → Redirigir a Ficha o Crear Cita
```

### 8.2 Flujo: Abrir Ficha del Paciente

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO: ABRIR FICHA DEL PACIENTE                        │
└─────────────────────────────────────────────────────────────────────────────┘

PatientRecordModal.open(patientId)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    QUERIES INICIALES (PARALELO)                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. get_patient_details(patient_id)                                  │
│     └─→ patients + patient_medical_history + patient_allergies       │
│                                                                      │
│  2. get_active_patient_alerts(patient_id, 'file_open')               │
│     └─→ Mostrar alertas críticas inmediatamente                      │
│     └─→ INSERT INTO access_log (RGPD)                                │
│                                                                      │
│  3. get_patient_financial_summary(patient_id)                        │
│     └─→ totales, deuda, presupuestos activos                         │
│                                                                      │
│  4. get_next_appointment(patient_id)                                 │
│     └─→ próxima cita programada                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    RENDER: PESTAÑA RESUMEN                            │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│  │   Avatar    │  │  Alertas    │  │Próxima Cita │                   │
│  │   Nombre    │  │  Críticas   │  │             │                   │
│  │   Contacto  │  │             │  │             │                   │
│  └─────────────┘  └─────────────┘  └─────────────┘                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  Info Crítica: Alergias | Enfermedades | Medicación        │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌───────────────────┐  ┌───────────────────┐                        │
│  │ Trat. Pendientes  │  │  Saldo Pendiente  │                        │
│  └───────────────────┘  └───────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.3 Flujo: Registrar Visita Clínica

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLUJO: REGISTRAR VISITA CLÍNICA                        │
└─────────────────────────────────────────────────────────────────────────────┘

Agenda → Click en cita → Cambiar estado a "En consulta"
   │
   ▼
UPDATE appointments SET visit_status = 'in_consultation', consultation_started_at = NOW()
   │
   ▼
Abrir Ficha → Pestaña "Historial Clínico"
   │
   ├─→ Cargar visitas anteriores
   │   └─→ SELECT FROM visit_records + soap_notes WHERE patient_id = ?
   │
   └─→ Crear registro de visita actual
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    DURANTE LA CONSULTA                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INSERT INTO visit_records (appointment_id, patient_id, ...)      │
│                                                                      │
│  2. Doctor escribe notas SOAP (is_draft = TRUE)                      │
│     └─→ INSERT/UPDATE soap_notes                                     │
│     └─→ Auto-save cada 30 segundos                                   │
│                                                                      │
│  3. Doctor modifica odontograma                                      │
│     └─→ INSERT INTO odontogram_history (snapshot)                    │
│     └─→ UPDATE visit_records SET odontogram_snapshot = ?             │
│                                                                      │
│  4. Doctor sube archivos/radiografías                                │
│     └─→ Upload a Supabase Storage                                    │
│     └─→ INSERT INTO patient_files                                    │
│                                                                      │
│  5. Doctor marca tratamientos como realizados                        │
│     └─→ UPDATE patient_treatments SET status = 'Completado'          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Finalizar consulta
   │
   ├─→ finalize_soap_notes(soap_id) -- Inmutabilidad
   │
   ├─→ UPDATE appointments SET
   │       visit_status = 'completed',
   │       consultation_ended_at = NOW()
   │
   └─→ Calcular duraciones (waiting, consultation)
```

### 8.4 Flujo: Crear Presupuesto

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO: CREAR PRESUPUESTO                             │
└─────────────────────────────────────────────────────────────────────────────┘

Ficha Paciente → Pestaña Finanzas → "Nuevo Presupuesto"
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    MODAL CREACIÓN PRESUPUESTO                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Cargar catálogo de tratamientos                                  │
│     └─→ SELECT FROM treatment_catalog WHERE clinic_id = ?            │
│                                                                      │
│  2. Usuario selecciona tratamientos                                  │
│     └─→ Cada item: {treatment_id, tooth, quantity, discount}         │
│                                                                      │
│  3. Calcular totales en tiempo real (frontend)                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
GUARDAR PRESUPUESTO
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    TRANSACCIÓN EN BASE DE DATOS                       │
├──────────────────────────────────────────────────────────────────────┤
│  BEGIN;                                                              │
│                                                                      │
│  1. INSERT INTO budgets (...) RETURNING id;                          │
│     └─→ Trigger: generate_budget_number()                            │
│                                                                      │
│  2. INSERT INTO budget_items (...) -- por cada tratamiento           │
│                                                                      │
│  3. Si estado = 'Aceptado':                                          │
│     └─→ INSERT INTO patient_treatments -- crear tratamientos         │
│     └─→ UPDATE budget_items SET patient_treatment_id = ?             │
│                                                                      │
│  COMMIT;                                                             │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Opcionalmente: Generar PDF → Upload a Storage → UPDATE budgets SET pdf_path
```

---

## 9. Consideraciones Técnicas

### 9.1 Supabase Storage Buckets

```
storage/
├── patient-files/           # Archivos generales de pacientes
│   └── {clinic_id}/
│       └── {patient_id}/
│           ├── documents/   # Documentos PDF
│           ├── images/      # Fotos intraorales, etc.
│           ├── xrays/       # Radiografías
│           └── dicom/       # Archivos DICOM
│
├── consents/                # Consentimientos firmados
│   └── {clinic_id}/
│       └── {patient_id}/
│
├── prescriptions/           # PDFs de recetas generadas
│   └── {clinic_id}/
│       └── {patient_id}/
│
├── budgets/                 # PDFs de presupuestos
│   └── {clinic_id}/
│       └── {patient_id}/
│
└── avatars/                 # Fotos de perfil de pacientes
    └── {clinic_id}/
        └── {patient_id}/
```

### 9.2 Índices Recomendados para Performance

```sql
-- Búsqueda full-text de pacientes
CREATE INDEX idx_patients_fts ON patients
USING gin(to_tsvector('spanish', full_name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));

-- Citas por fecha (muy usado en agenda)
CREATE INDEX idx_appointments_agenda ON appointments(clinic_id, appointment_date, professional_id)
WHERE is_cancelled = FALSE;

-- Tratamientos pendientes
CREATE INDEX idx_treatments_pending ON patient_treatments(patient_id, status)
WHERE status IN ('Pendiente', 'En curso');

-- Alertas activas
CREATE INDEX idx_alerts_active ON patient_alerts(patient_id)
WHERE is_active = TRUE AND (dismissed_at IS NULL OR dismiss_until < NOW());

-- Presupuestos activos
CREATE INDEX idx_budgets_active ON budgets(patient_id, status)
WHERE status IN ('Pendiente', 'Aceptado', 'En curso');
```

### 9.3 Manejo de Archivos DICOM

```sql
-- Estructura de metadata DICOM almacenada en patient_files.dicom_metadata
{
    "patientId": "string",           -- ID del paciente en el equipo DICOM
    "studyDate": "YYYYMMDD",         -- Fecha del estudio
    "studyDescription": "string",    -- Descripción
    "modality": "CR|DX|IO|PX",       -- Tipo de imagen
    "manufacturer": "string",        -- Fabricante del equipo
    "institutionName": "string",     -- Nombre de la institución
    "rows": 1024,                    -- Dimensiones
    "columns": 1024,
    "bitsStored": 12,
    "windowCenter": 2048,            -- Para visualización
    "windowWidth": 4096
}
```

### 9.4 Consideraciones RGPD

1. **Registro de accesos**: Toda visualización de datos sensibles se registra en `access_log`
2. **Derecho al olvido**: Implementar función de anonimización en lugar de eliminación
3. **Exportación de datos**: Función para exportar todos los datos de un paciente
4. **Consentimiento explícito**: Campos `allows_marketing_communications`, `allows_appointment_reminders`

```sql
-- Función para anonimizar paciente (RGPD - Derecho al olvido)
CREATE OR REPLACE FUNCTION anonymize_patient(p_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE patients SET
        first_name = 'ANONIMIZADO',
        last_name = 'ANONIMIZADO',
        full_name = 'ANONIMIZADO',
        document_number = NULL,
        phone = 'ANONIMIZADO',
        phone_secondary = NULL,
        email = NULL,
        address_street = NULL,
        address_city = NULL,
        address_postal_code = NULL,
        emergency_contact_name = NULL,
        emergency_contact_phone = NULL,
        notes = NULL,
        internal_notes = NULL,
        avatar_url = NULL,
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = p_patient_id;

    -- Log de anonimización
    INSERT INTO audit_log (table_name, record_id, operation, performed_by, patient_id)
    VALUES ('patients', p_patient_id, 'ANONYMIZE', auth.uid(), p_patient_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 10. Plan de Implementación Sugerido

### Fase 1: Fundamentos (Semana 1-2)

- [ ] Crear tablas base: `clinics`, `patients`, `staff`, `roles`
- [ ] Configurar RLS multi-tenant
- [ ] Implementar triggers de auditoría
- [ ] Configurar Storage buckets

### Fase 2: Paciente Core (Semana 3-4)

- [ ] Tablas: `patient_allergies`, `patient_medical_history`, `patient_alerts`
- [ ] Funciones de búsqueda de pacientes
- [ ] Importación CSV
- [ ] CRUD completo de pacientes

### Fase 3: Catálogo y Tratamientos (Semana 5-6)

- [ ] Tablas: `treatment_catalog`, `patient_treatments`
- [ ] Funciones de gestión de tratamientos
- [ ] Flujo de estados de tratamiento

### Fase 4: Citas y Visitas (Semana 7-8)

- [ ] Tablas: `appointments`, `visit_records`, `soap_notes`
- [ ] Trigger de inmutabilidad SOAP
- [ ] Funciones de historial clínico
- [ ] Odontograma: `odontogram_history`

### Fase 5: Finanzas (Semana 9-10)

- [ ] Tablas: `budgets`, `budget_items`, `payments`, `invoices`
- [ ] Funciones de resumen financiero
- [ ] Generación de números de presupuesto

### Fase 6: Documentos y Archivos (Semana 11-12)

- [ ] Tablas: `patient_files`, `patient_consents`, `prescriptions`
- [ ] Integración con Storage
- [ ] Soporte DICOM básico
- [ ] Generación de PDFs

### Fase 7: Auditoría y RGPD (Semana 13-14)

- [ ] Completar `audit_log` y `access_log`
- [ ] Función de anonimización
- [ ] Exportación de datos del paciente
- [ ] Revisión de seguridad

---

## 11. Notas para el Equipo

### 11.1 Convenciones de Código

- **UUIDs**: Usar `gen_random_uuid()` para todas las PKs
- **Timestamps**: Siempre `TIMESTAMPTZ`, nunca `TIMESTAMP`
- **Soft Delete**: Usar `is_deleted` + `deleted_at` + `deleted_by`
- **Montos**: `DECIMAL(10,2)` para precios, `DECIMAL(12,2)` para totales

### 11.2 Manejo de Errores

- Usar códigos de error PostgreSQL personalizados para errores de negocio
- Siempre retornar mensajes en español para el frontend

### 11.3 Testing

- Crear datos de prueba para cada clínica de desarrollo
- Probar RLS con diferentes usuarios/roles
- Verificar triggers de auditoría

### 11.4 Decisiones Pendientes (para el equipo)

1. ¿Estructura normalizada o JSONB para conditions/medications?
2. ¿Facturación integrada o sistema externo?
3. ¿Notificaciones en tiempo real (Supabase Realtime)?

---

## 12. Conexiones con Otros Módulos del Sistema

La ficha del paciente es el **núcleo central** de klinikOS. A continuación se detalla cómo se conecta con cada módulo de la aplicación:

### 12.1 Mapa de Conexiones

```
                                    ┌─────────────────┐
                                    │   CONFIGURACIÓN │
                                    │  /configuracion │
                                    └────────┬────────┘
                                             │
            ┌────────────────────────────────┼────────────────────────────────┐
            │                                │                                │
            ▼                                ▼                                ▼
┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
│ treatment_catalog │             │      staff        │             │ consent_templates │
│  (Tratamientos)   │             │  (Profesionales)  │             │   (Plantillas)    │
└─────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
          │                                 │                                 │
          │    ┌────────────────────────────┼────────────────────────────┐   │
          │    │                            │                            │   │
          │    │                            ▼                            │   │
          │    │              ┌─────────────────────────┐                │   │
          │    │              │                         │                │   │
          ▼    ▼              │    FICHA DEL PACIENTE   │                ▼   │
┌───────────────────┐         │       /pacientes       │         ┌──────────┴──────────┐
│  patient_        │◄────────│                         │────────►│  patient_consents   │
│  treatments      │         │  ┌─────────────────┐   │         │                     │
└───────────────────┘         │  │    patients     │   │         └─────────────────────┘
          │                   │  └────────┬────────┘   │
          │                   │           │            │
          │                   └───────────┼────────────┘
          │                               │
          │         ┌─────────────────────┼─────────────────────┐
          │         │                     │                     │
          ▼         ▼                     ▼                     ▼
┌───────────────────┐         ┌───────────────────┐   ┌───────────────────┐
│      AGENDA       │         │      GESTIÓN      │   │       CAJA        │
│     /agenda       │         │     /gestion      │   │      /caja        │
│                   │         │                   │   │                   │
│ - appointments    │         │ - Estadísticas    │   │ - Pagos del día   │
│ - visit_records   │         │ - KPIs pacientes  │   │ - Cobros          │
│ - soap_notes      │         │ - Deuda global    │   │ - Arqueo          │
└─────────┬─────────┘         └───────────────────┘   └─────────┬─────────┘
          │                                                     │
          │                                                     │
          └──────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      PARTE DIARIO       │
                    │     /parte-diario       │
                    │                         │
                    │ - Producción del día    │
                    │ - Tratamientos hechos   │
                    │ - Cobros realizados     │
                    └─────────────────────────┘
```

### 12.2 Detalle de Conexiones por Módulo

#### 12.2.1 AGENDA (`/agenda`) ↔ Ficha Paciente

| Dirección      | Acción                                       | Datos Involucrados                          |
| -------------- | -------------------------------------------- | ------------------------------------------- |
| Agenda → Ficha | Click en cita abre ficha del paciente        | `patient_id` de la cita                     |
| Agenda → Ficha | "Ver ficha" desde tarjeta de cita            | `patient_id`, abre en pestaña Resumen       |
| Agenda → Ficha | Cambiar estado visita abre historial clínico | `appointment_id`, abre en Historial Clínico |
| Ficha → Agenda | "Añadir cita" desde ficha                    | `patient_id`, datos pre-rellenados          |
| Ficha → Agenda | Ver próxima cita (click)                     | Navega a la fecha en agenda                 |

**Tablas involucradas:**

```sql
-- Desde Agenda, obtener datos del paciente para mostrar en tarjeta de cita
SELECT
    a.*,
    p.full_name,
    p.phone,
    p.avatar_url,
    (SELECT array_agg(allergen_name) FROM patient_allergies pa
     WHERE pa.patient_id = p.id AND pa.severity IN ('grave', 'extrema')) as critical_allergies,
    EXISTS (SELECT 1 FROM patient_alerts al
            WHERE al.patient_id = p.id AND al.is_active AND al.priority = 'critical') as has_critical_alert
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.appointment_date = :date AND a.clinic_id = :clinic_id;
```

**Flujo de Estados de Visita:**

```
AGENDA                              FICHA PACIENTE
───────                             ──────────────
scheduled ──────────────────────────► (no interacción)
    │
    ▼
confirmed ──────────────────────────► Mostrar confirmación
    │
    ▼
in_waiting_room ────────────────────► (no interacción)
    │
    ▼
in_consultation ────────────────────► Abre Historial Clínico
    │                                     │
    │                                     ├─► Editar notas SOAP
    │                                     ├─► Actualizar odontograma
    │                                     ├─► Subir archivos
    │                                     └─► Marcar tratamientos realizados
    ▼
completed ◄─────────────────────────────── Finalizar notas SOAP
```

---

#### 12.2.2 GESTIÓN (`/gestion`) ↔ Ficha Paciente

| Dirección       | Acción                                    | Datos Involucrados             |
| --------------- | ----------------------------------------- | ------------------------------ |
| Gestión → Ficha | Click en paciente del listado             | `patient_id`                   |
| Gestión → Ficha | Click en paciente con deuda               | `patient_id`, abre en Finanzas |
| Gestión ← Ficha | Actualización de datos se refleja en KPIs | Estadísticas actualizadas      |

**Datos que Gestión obtiene de pacientes:**

```sql
-- KPIs para Dashboard de Gestión
SELECT
    COUNT(*) as total_patients,
    COUNT(*) FILTER (WHERE status = 'Activo') as active_patients,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as new_this_month,
    COUNT(*) FILTER (WHERE id IN (
        SELECT DISTINCT patient_id FROM budgets
        WHERE status IN ('Aceptado', 'En curso') AND pending_amount > 0
    )) as patients_with_debt,
    COALESCE(SUM(b.pending_amount), 0) as total_pending_debt
FROM patients p
LEFT JOIN budgets b ON b.patient_id = p.id AND b.status IN ('Aceptado', 'En curso')
WHERE p.clinic_id = :clinic_id AND p.is_deleted = FALSE;

-- Pacientes con citas hoy
SELECT
    p.id, p.full_name, p.avatar_url,
    a.start_time, a.reason, a.visit_status
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.appointment_date = CURRENT_DATE
AND a.clinic_id = :clinic_id
AND a.is_cancelled = FALSE
ORDER BY a.start_time;
```

---

#### 12.2.3 CAJA (`/caja`) ↔ Ficha Paciente

| Dirección    | Acción                                | Datos Involucrados             |
| ------------ | ------------------------------------- | ------------------------------ |
| Caja → Ficha | Click en pago muestra paciente        | `patient_id`, abre en Finanzas |
| Caja → Ficha | "Ver ficha" desde línea de cobro      | `patient_id`                   |
| Ficha → Caja | Registrar pago actualiza caja del día | `payment` se suma al arqueo    |

**Datos que Caja obtiene de pacientes:**

```sql
-- Pagos del día para Caja
SELECT
    pay.id,
    pay.amount,
    pay.payment_method,
    pay.payment_date,
    pay.payment_time,
    pay.concept,
    pay.reference,
    p.id as patient_id,
    p.full_name as patient_name,
    b.budget_number,
    u.email as created_by_email
FROM payments pay
JOIN patients p ON p.id = pay.patient_id
LEFT JOIN budgets b ON b.id = pay.budget_id
LEFT JOIN auth.users u ON u.id = pay.created_by
WHERE pay.clinic_id = :clinic_id
AND pay.payment_date = CURRENT_DATE
AND pay.status = 'Completado'
ORDER BY pay.payment_time DESC;

-- Resumen por método de pago
SELECT
    payment_method,
    COUNT(*) as count,
    SUM(amount) as total
FROM payments
WHERE clinic_id = :clinic_id
AND payment_date = CURRENT_DATE
AND status = 'Completado'
GROUP BY payment_method;
```

**Registro de Pago desde Ficha:**

```sql
-- Cuando se registra un pago en la ficha del paciente
INSERT INTO payments (
    clinic_id, patient_id, budget_id, amount, currency,
    payment_method, reference, concept, payment_date, payment_time,
    created_by
) VALUES (
    :clinic_id, :patient_id, :budget_id, :amount, 'EUR',
    :payment_method, :reference, :concept, CURRENT_DATE, CURRENT_TIME,
    auth.uid()
);

-- Actualizar presupuesto
UPDATE budgets
SET paid_amount = paid_amount + :amount,
    updated_at = NOW(),
    updated_by = auth.uid()
WHERE id = :budget_id;
```

---

#### 12.2.4 PARTE DIARIO (`/parte-diario`) ↔ Ficha Paciente

| Dirección     | Acción                            | Datos Involucrados                 |
| ------------- | --------------------------------- | ---------------------------------- |
| Parte → Ficha | Click en tratamiento realizado    | `patient_id`, abre en Tratamientos |
| Parte → Ficha | Click en paciente                 | `patient_id`                       |
| Ficha → Parte | Marcar tratamiento como producido | Se refleja en parte diario         |

**Datos que Parte Diario obtiene:**

```sql
-- Producción del día (tratamientos completados)
SELECT
    pt.id,
    pt.treatment_name,
    pt.treatment_code,
    pt.tooth_number,
    pt.final_amount,
    pt.completed_date,
    pt.completed_by_name,
    p.id as patient_id,
    p.full_name as patient_name,
    a.id as appointment_id,
    a.start_time
FROM patient_treatments pt
JOIN patients p ON p.id = pt.patient_id
LEFT JOIN appointments a ON a.id = pt.scheduled_appointment_id
WHERE pt.clinic_id = :clinic_id
AND DATE(pt.completed_date) = CURRENT_DATE
AND pt.status = 'Completado'
ORDER BY pt.completed_date DESC;

-- Resumen de producción por profesional
SELECT
    pt.completed_by_name as professional,
    COUNT(*) as treatments_count,
    SUM(pt.final_amount) as total_production
FROM patient_treatments pt
WHERE pt.clinic_id = :clinic_id
AND DATE(pt.completed_date) = CURRENT_DATE
AND pt.status = 'Completado'
GROUP BY pt.completed_by_name;
```

---

#### 12.2.5 CONFIGURACIÓN (`/configuracion`) → Ficha Paciente

La configuración **NO recibe datos** de la ficha del paciente, pero **proporciona datos maestros** que la ficha utiliza:

| Módulo Config                  | Tabla                                | Uso en Ficha Paciente                          |
| ------------------------------ | ------------------------------------ | ---------------------------------------------- |
| `/configuracion/tratamientos`  | `treatment_catalog`                  | Selector de tratamientos al crear presupuesto  |
| `/configuracion/especialistas` | `staff`                              | Asignación de profesional a citas/tratamientos |
| `/configuracion/roles`         | `roles`, `permissions`               | Control de acceso a secciones de la ficha      |
| `/configuracion/facturacion`   | `invoice_settings`                   | Formato de facturas, numeración                |
| `/configuracion/finanzas`      | `payment_methods`, `financing_plans` | Métodos de pago disponibles                    |

```sql
-- Cargar catálogo de tratamientos para selector en presupuesto
SELECT id, code, name, category, base_price,
       requires_tooth_selection, default_duration_minutes
FROM treatment_catalog
WHERE clinic_id = :clinic_id AND is_active = TRUE
ORDER BY category, name;

-- Cargar profesionales para selector en cita
SELECT id, full_name, role, specialization, avatar_url
FROM staff
WHERE clinic_id = :clinic_id AND is_active = TRUE
ORDER BY full_name;

-- Cargar plantillas de consentimientos
SELECT id, name, description, category, template_url
FROM consent_templates
WHERE clinic_id = :clinic_id AND is_active = TRUE
ORDER BY category, name;
```

---

### 12.3 Matriz de Permisos por Módulo

| Módulo                        | Recepción     | Higienista    | Doctor        | Administrador   |
| ----------------------------- | ------------- | ------------- | ------------- | --------------- |
| **Ficha - Resumen**           | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Info General**      | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Historial Clínico** | 👁️ Solo ver   | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Tratamientos**      | 👁️ Solo ver   | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Imágenes RX**       | ✅ Ver/Subir  | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Finanzas**          | ✅ Ver/Editar | 👁️ Solo ver   | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Documentos**        | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Ficha - Recetas**           | 👁️ Solo ver   | ❌ No acceso  | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Agenda**                    | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Gestión (Dashboard)**       | ❌ No acceso  | ❌ No acceso  | ❌ No acceso  | ✅ Acceso total |
| **Caja**                      | ✅ Ver/Editar | 👁️ Solo ver   | 👁️ Solo ver   | ✅ Ver/Editar   |
| **Parte Diario**              | 👁️ Solo ver   | ✅ Ver/Editar | ✅ Ver/Editar | ✅ Ver/Editar   |
| **Configuración**             | ❌ No acceso  | ❌ No acceso  | ❌ No acceso  | ✅ Acceso total |

---

### 12.4 Eventos y Notificaciones entre Módulos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVENTOS DEL SISTEMA                                  │
└─────────────────────────────────────────────────────────────────────────────┘

FICHA PACIENTE emite:
├── patient.created ──────────────► Gestión (actualizar contadores)
├── patient.updated ──────────────► Agenda (si cambió teléfono/nombre)
├── treatment.completed ──────────► Parte Diario (nueva producción)
│                                 └► Caja (si hay cobro asociado)
├── payment.registered ───────────► Caja (actualizar arqueo)
│                                 └► Gestión (actualizar deuda)
├── budget.accepted ──────────────► Tratamientos (crear patient_treatments)
├── alert.created ────────────────► Agenda (mostrar en tarjeta de cita)
└── soap_notes.finalized ─────────► Historial (inmutabilidad activada)

AGENDA emite:
├── appointment.created ──────────► Ficha (actualizar próxima cita)
├── appointment.status_changed ───► Ficha (si in_consultation, abrir historial)
└── appointment.completed ────────► Parte Diario (registrar visita)

CAJA emite:
├── payment.voided ───────────────► Ficha (actualizar saldos)
└── cash_closing.completed ───────► Gestión (actualizar reportes)
```

---

### 12.5 Queries Críticas de Conexión

#### Query: Abrir ficha con todos los datos relacionados

```sql
-- Función que obtiene TODO lo necesario al abrir la ficha
CREATE OR REPLACE FUNCTION get_patient_full_record(p_patient_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'patient', (
            SELECT row_to_json(p.*) FROM patients p WHERE p.id = p_patient_id
        ),
        'allergies', (
            SELECT json_agg(row_to_json(a.*))
            FROM patient_allergies a
            WHERE a.patient_id = p_patient_id AND a.is_active = TRUE
        ),
        'medical_history', (
            SELECT row_to_json(mh.*)
            FROM patient_medical_history mh
            WHERE mh.patient_id = p_patient_id
        ),
        'active_alerts', (
            SELECT json_agg(row_to_json(al.*))
            FROM patient_alerts al
            WHERE al.patient_id = p_patient_id
            AND al.is_active = TRUE
            AND (al.expires_at IS NULL OR al.expires_at > NOW())
        ),
        'next_appointment', (
            SELECT row_to_json(a.*)
            FROM appointments a
            WHERE a.patient_id = p_patient_id
            AND a.appointment_date >= CURRENT_DATE
            AND a.is_cancelled = FALSE
            ORDER BY a.appointment_date, a.start_time
            LIMIT 1
        ),
        'pending_treatments_count', (
            SELECT COUNT(*) FROM patient_treatments pt
            WHERE pt.patient_id = p_patient_id AND pt.status = 'Pendiente'
        ),
        'financial_summary', (
            SELECT json_build_object(
                'total_debt', COALESCE(SUM(b.pending_amount), 0),
                'active_budgets', COUNT(*) FILTER (WHERE b.status IN ('Aceptado', 'En curso'))
            )
            FROM budgets b WHERE b.patient_id = p_patient_id
        ),
        'pending_consents_count', (
            SELECT COUNT(*) FROM patient_consents pc
            WHERE pc.patient_id = p_patient_id AND pc.status = 'Pendiente'
        )
    ) INTO v_result;

    -- Registrar acceso (RGPD)
    INSERT INTO access_log (clinic_id, user_id, resource_type, resource_id, patient_id, access_type)
    SELECT clinic_id, auth.uid(), 'patient_file', p_patient_id, p_patient_id, 'VIEW'
    FROM patients WHERE id = p_patient_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Query: Datos para tarjeta de cita en Agenda

```sql
-- Obtener datos del paciente necesarios para mostrar en tarjeta de cita
CREATE OR REPLACE FUNCTION get_appointment_patient_preview(p_appointment_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'patient_id', p.id,
            'full_name', p.full_name,
            'phone', p.phone,
            'avatar_url', p.avatar_url,
            'age', EXTRACT(YEAR FROM age(p.birth_date)),
            'is_vip', p.is_vip,
            'critical_allergies', (
                SELECT array_agg(allergen_name)
                FROM patient_allergies pa
                WHERE pa.patient_id = p.id
                AND pa.severity IN ('grave', 'extrema')
                AND pa.is_active = TRUE
            ),
            'has_debt', EXISTS (
                SELECT 1 FROM budgets b
                WHERE b.patient_id = p.id
                AND b.pending_amount > 0
            ),
            'critical_alerts', (
                SELECT json_agg(json_build_object('title', title, 'priority', priority))
                FROM patient_alerts al
                WHERE al.patient_id = p.id
                AND al.is_active = TRUE
                AND al.show_on_appointment = TRUE
                AND al.priority IN ('high', 'critical')
            )
        )
        FROM appointments a
        JOIN patients p ON p.id = a.patient_id
        WHERE a.id = p_appointment_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 13. Referencias

- **Frontend actual**: Ver `src/context/PatientsContext.tsx` para modelo de datos mock
- **Documentación UI**: Ver `docs/FICHA_PACIENTE_CHANGELOG.md`
- **Componentes**: Ver `src/components/pacientes/modals/patient-record/`

---

_Documento generado el 2 de Febrero de 2026_  
_Versión 1.0 - MVP Completo_
