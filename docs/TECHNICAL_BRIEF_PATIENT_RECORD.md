# Technical Brief: Patient Record - klinikOS

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** MVP (First complete version)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Architecture:** Multi-tenant from the start

---

## 1. Overview

### 1.1 Description

The **Patient Record** is the central component of the klinikOS system. It concentrates all patient information and connects with virtually all other system functionalities.

### 1.2 Record Modules

The record is organized into **8 main sections**:

| #   | Section              | Description                                                   |
| --- | -------------------- | ------------------------------------------------------------- |
| 1   | **Summary**          | Overview with key information, alerts, next appointment, debt |
| 2   | **General Info**     | Personal data, contact, emergency, administrative data        |
| 3   | **Clinical History** | Visits, SOAP notes, odontogram per visit, attachments         |
| 4   | **Treatments**       | Pending, in progress, completed treatments                    |
| 5   | **X-Ray Images**     | Radiographs, intraoral photos, DICOM files                    |
| 6   | **Finances**         | Budgets, payments, invoices, financing plans                  |
| 7   | **Documents**        | Informed consents (signed PDFs)                               |
| 8   | **Prescriptions**    | Medical prescriptions (PDF generation)                        |

### 1.3 Design Principles

- **Multi-tenant**: All tables include `clinic_id` for data isolation
- **Full audit**: Log of all changes with user and timestamp
- **GDPR compliance**: Access logging for sensitive data
- **Selective immutability**: Finalized SOAP notes cannot be edited
- **Soft delete**: Records are marked as deleted, not physically removed

---

## 2. Data Architecture

### 2.1 Main Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLINICS                                         │
│                         (Main tenant table)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PATIENTS                                        │
│                        (Central system entity)                               │
└─────────────────────────────────────────────────────────────────────────────┘
         │              │              │              │              │
         │ 1:N          │ 1:N          │ 1:N          │ 1:N          │ 1:N
         ▼              ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ APPOINTMENTS│ │ TREATMENTS  │ │  BUDGETS    │ │  CONSENTS   │ │PRESCRIPTIONS│
│  (Appts)    │ │             │ │             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
      │                │              │
      │ 1:N            │              │ 1:N
      ▼                │              ▼
┌─────────────┐        │        ┌─────────────┐
│VISIT_RECORDS│        │        │  PAYMENTS   │
│(Visit Hist.)│        │        │             │
└─────────────┘        │        └─────────────┘
      │                │              │
      │ 1:N            │              │ 1:N
      ▼                ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ SOAP_NOTES  │ │ODONTOGRAM_  │ │  INVOICES   │
│             │ │  HISTORY    │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

### 2.2 Auxiliary Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONFIGURATION ENTITIES                                │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ TREATMENT_      │ CONSENT_        │ STAFF           │ CLINIC_               │
│ CATALOG         │ TEMPLATES       │ (Professionals) │ SETTINGS              │
│ (Treat. catalog)│ (Templates)     │                 │ (Clinic config)       │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPPORT ENTITIES                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│ PATIENT_        │ PATIENT_        │ PATIENT_        │ PATIENT_              │
│ ALLERGIES       │ ALERTS          │ FILES           │ MEDICAL_HISTORY       │
│                 │                 │ (Files/X-Rays)  │ (Medical history)     │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT ENTITIES                                     │
├─────────────────────────────────────┬───────────────────────────────────────┤
│ AUDIT_LOG                           │ ACCESS_LOG                            │
│ (Change log)                        │ (Access log - GDPR)                   │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 Main Table: `patients`

```sql
CREATE TABLE patients (
    -- Identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_number VARCHAR(20), -- Internal patient number (auto-generated per clinic)

    -- Basic personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

    -- Documentation
    document_type VARCHAR(20) CHECK (document_type IN ('DNI', 'NIE', 'Passport', 'Other')),
    document_number VARCHAR(50),

    -- Demographic data
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Not specified')),
    birth_date DATE,
    nationality VARCHAR(100),
    preferred_language VARCHAR(50) DEFAULT 'Spanish',

    -- Primary contact
    phone VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    preferred_contact_method VARCHAR(20) CHECK (preferred_contact_method IN ('phone', 'email', 'whatsapp', 'sms')),

    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_province VARCHAR(100),
    address_country VARCHAR(100) DEFAULT 'Spain',

    -- Emergency contact
    emergency_contact_name VARCHAR(150),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(20),

    -- Patient status
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Discharged')),
    is_vip BOOLEAN DEFAULT FALSE,

    -- Origin and marketing
    source VARCHAR(100), -- "Google", "Referral", "Social media", etc.
    referred_by_patient_id UUID REFERENCES patients(id),
    referred_by_name VARCHAR(150),
    allows_marketing_communications BOOLEAN DEFAULT FALSE,
    allows_appointment_reminders BOOLEAN DEFAULT TRUE,

    -- Pre-registration
    pre_registration_complete BOOLEAN DEFAULT FALSE,
    pre_registration_date TIMESTAMPTZ,

    -- Administrative information
    occupation VARCHAR(100),
    consultation_reason TEXT, -- Initial consultation reason

    -- Company billing (optional)
    billing_to_company BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(200),
    company_tax_id VARCHAR(20),
    company_address TEXT,

    -- Preferred payment methods
    preferred_payment_method_1 VARCHAR(50),
    preferred_payment_method_2 VARCHAR(50),
    has_financing BOOLEAN DEFAULT FALSE,

    -- Notes
    notes TEXT,
    internal_notes TEXT, -- Internal notes (not visible to patient)

    -- Avatar/Photo
    avatar_url TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT unique_document_per_clinic UNIQUE (clinic_id, document_type, document_number),
    CONSTRAINT unique_patient_number_per_clinic UNIQUE (clinic_id, patient_number)
);

-- Indexes
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_full_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_document ON patients(document_type, document_number);
CREATE INDEX idx_patients_status ON patients(clinic_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('spanish', full_name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));
```

### 3.2 Table: `patient_allergies`

```sql
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Allergy information
    allergen_name VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'extreme')),
    reaction_description TEXT,
    notes TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    confirmed_by_doctor BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES auth.users(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_allergies_patient ON patient_allergies(patient_id) WHERE is_active = TRUE;
CREATE INDEX idx_patient_allergies_severity ON patient_allergies(patient_id, severity);
```

### 3.3 Table: `patient_medical_history`

```sql
CREATE TABLE patient_medical_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Medical conditions (array for flexibility)
    conditions JSONB DEFAULT '[]', -- [{name: "Diabetes", notes: "Type 2", since: "2020"}]

    -- Current medication
    medications JSONB DEFAULT '[]', -- [{name: "Metformin", dosage: "850mg", frequency: "2/day"}]

    -- Relevant medical history
    medical_background TEXT,
    surgical_history TEXT,
    family_history TEXT,

    -- Habits
    is_smoker BOOLEAN DEFAULT FALSE,
    smoking_details VARCHAR(200),
    alcohol_consumption VARCHAR(100),

    -- Pregnancy (if applicable)
    is_pregnant BOOLEAN DEFAULT FALSE,
    pregnancy_weeks INTEGER,

    -- Other
    dental_fear_level VARCHAR(20) CHECK (dental_fear_level IN ('none', 'mild', 'moderate', 'severe')),
    dental_fear_notes TEXT,

    -- Review control
    last_medical_review TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_patient_medical_history_unique ON patient_medical_history(patient_id);
```

### 3.4 Table: `patient_alerts`

```sql
CREATE TABLE patient_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Type and priority
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('medical', 'financial', 'administrative', 'recall', 'custom')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    -- Content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    -- Display configuration
    is_active BOOLEAN DEFAULT TRUE,
    show_on_file_open BOOLEAN DEFAULT TRUE, -- Show when opening record
    show_on_appointment BOOLEAN DEFAULT TRUE, -- Show when managing appointment

    -- Expiration
    expires_at TIMESTAMPTZ,

    -- Auto-generation
    is_auto_generated BOOLEAN DEFAULT FALSE,
    auto_generation_rule VARCHAR(100), -- "debt_over_30_days", "severe_allergy", etc.

    -- Dismissal (temporary dismissal)
    dismissed_at TIMESTAMPTZ,
    dismissed_by UUID REFERENCES auth.users(id),
    dismiss_until TIMESTAMPTZ, -- Until when it's dismissed

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_alerts_active ON patient_alerts(patient_id, is_active, priority);
CREATE INDEX idx_patient_alerts_show ON patient_alerts(patient_id)
    WHERE is_active = TRUE AND (dismissed_at IS NULL OR dismiss_until < NOW());
```

### 3.5 Table: `treatment_catalog` (Configuration)

```sql
CREATE TABLE treatment_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Identification
    code VARCHAR(20) NOT NULL, -- "CLN", "FIL", "RCT"
    name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Categorization
    category VARCHAR(100), -- "Hygiene", "Restorative", "Endodontics", "Surgery"
    subcategory VARCHAR(100),

    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Configuration
    requires_tooth_selection BOOLEAN DEFAULT FALSE,
    requires_face_selection BOOLEAN DEFAULT FALSE, -- Tooth surface
    default_duration_minutes INTEGER DEFAULT 30,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_treatment_code_per_clinic UNIQUE (clinic_id, code)
);

CREATE INDEX idx_treatment_catalog_clinic ON treatment_catalog(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_treatment_catalog_category ON treatment_catalog(clinic_id, category);
```

### 3.6 Table: `patient_treatments`

```sql
CREATE TABLE patient_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Catalog reference
    treatment_catalog_id UUID REFERENCES treatment_catalog(id),
    treatment_code VARCHAR(20), -- Code copy for historical purposes
    treatment_name VARCHAR(200) NOT NULL,

    -- Dental detail
    tooth_number VARCHAR(10), -- "36", "11-21" for ranges
    tooth_face VARCHAR(20), -- "mesial", "distal", "occlusal", etc.
    quadrant VARCHAR(5), -- "Q1", "Q2", "Q3", "Q4"

    -- Price and payments
    amount DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    paid_amount DECIMAL(10,2) DEFAULT 0,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid'
        CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')),

    -- Scheduling
    scheduled_date DATE,
    scheduled_appointment_id UUID REFERENCES appointments(id),

    -- Completion
    completed_date TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    completed_by_name VARCHAR(150),

    -- Associated budget
    budget_id UUID REFERENCES budgets(id),
    budget_item_id UUID,

    -- Notes
    notes TEXT,

    -- Marked for next appointment
    marked_for_next_appointment BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_treatments_patient ON patient_treatments(patient_id);
CREATE INDEX idx_patient_treatments_status ON patient_treatments(patient_id, status);
CREATE INDEX idx_patient_treatments_scheduled ON patient_treatments(scheduled_date) WHERE status = 'Pending';
CREATE INDEX idx_patient_treatments_budget ON patient_treatments(budget_id);
```

### 3.7 Table: `appointments`

```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Date and time
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Assignment
    professional_id UUID REFERENCES staff(id),
    professional_name VARCHAR(150),
    box VARCHAR(20), -- "box 1", "box 2"

    -- Appointment information
    reason TEXT NOT NULL, -- Consultation reason
    appointment_type VARCHAR(50), -- "First visit", "Follow-up", "Treatment"

    -- Statuses
    confirmation_status VARCHAR(20) DEFAULT 'Unconfirmed'
        CHECK (confirmation_status IN ('Confirmed', 'Unconfirmed', 'Reschedule')),
    visit_status VARCHAR(30) DEFAULT 'scheduled'
        CHECK (visit_status IN ('scheduled', 'confirmed', 'in_waiting_room', 'in_consultation', 'completed', 'no_show', 'cancelled')),

    -- Visit flow timestamps
    arrived_at TIMESTAMPTZ,
    consultation_started_at TIMESTAMPTZ,
    consultation_ended_at TIMESTAMPTZ,

    -- Calculated durations (in minutes)
    waiting_duration_minutes INTEGER,
    consultation_duration_minutes INTEGER,

    -- Payment
    has_pending_charge BOOLEAN DEFAULT FALSE,

    -- Tags
    tags JSONB DEFAULT '[]', -- ["debt", "vip"]

    -- Notes
    notes TEXT,

    -- Calendar color
    bg_color VARCHAR(20),

    -- Soft delete
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,

    -- Audit
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

### 3.8 Table: `visit_records` (Visit History)

```sql
CREATE TABLE visit_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Attending professional
    attending_professional_id UUID REFERENCES staff(id),
    attending_professional_name VARCHAR(150),

    -- Visit date
    visit_date DATE NOT NULL,

    -- Odontogram state at this visit (JSON snapshot)
    odontogram_snapshot JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_visit_records_patient ON visit_records(patient_id);
CREATE INDEX idx_visit_records_date ON visit_records(patient_id, visit_date DESC);
```

### 3.9 Table: `soap_notes` (Clinical SOAP Notes)

```sql
CREATE TABLE soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_record_id UUID NOT NULL REFERENCES visit_records(id) ON DELETE CASCADE,

    -- SOAP content
    subjective TEXT, -- Symptoms reported by patient
    objective TEXT, -- Clinical findings
    assessment TEXT, -- Diagnosis/evaluation
    plan TEXT, -- Treatment plan

    -- Notes status
    is_draft BOOLEAN DEFAULT TRUE,
    is_finalized BOOLEAN DEFAULT FALSE, -- Once finalized, cannot be edited

    -- Finalization (immutability)
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES auth.users(id),
    finalized_by_name VARCHAR(150),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraint: only one SOAP note per visit
    CONSTRAINT unique_soap_per_visit UNIQUE (visit_record_id)
);

-- RLS: Block updates when is_finalized = TRUE
-- Implemented via trigger
```

### 3.10 Table: `patient_files` (Files/X-Ray Images)

```sql
CREATE TABLE patient_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- May be associated with a specific visit
    visit_record_id UUID REFERENCES visit_records(id),
    appointment_id UUID REFERENCES appointments(id),

    -- File information
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255),
    file_type VARCHAR(50) NOT NULL, -- "image", "document", "xray", "dicom", "3d_scan"
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,

    -- Storage
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    storage_bucket VARCHAR(100) DEFAULT 'patient-files',

    -- Categorization
    category VARCHAR(50), -- "panoramic", "periapical", "intraoral", "photo", "document"
    subcategory VARCHAR(50),

    -- DICOM metadata
    dicom_metadata JSONB, -- Stores DICOM metadata if applicable

    -- Description
    description TEXT,
    notes TEXT,

    -- Associated tooth (if applicable)
    tooth_number VARCHAR(10),

    -- Thumbnails
    thumbnail_path TEXT,

    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_files_patient ON patient_files(patient_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_patient_files_type ON patient_files(patient_id, file_type);
CREATE INDEX idx_patient_files_visit ON patient_files(visit_record_id);
```

### 3.11 Table: `budgets`

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Identification
    budget_number VARCHAR(50), -- Budget number (auto-generated)
    budget_name VARCHAR(200), -- Optional descriptive name

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Draft', 'Pending', 'Sent', 'Accepted', 'Rejected', 'In Progress', 'Completed', 'Cancelled')),

    -- Dates
    created_date DATE DEFAULT CURRENT_DATE,
    sent_date DATE,
    accepted_date DATE,
    valid_until DATE, -- Validity date

    -- Totals
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Payments
    paid_amount DECIMAL(12,2) DEFAULT 0,
    pending_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,

    -- Creating professional
    created_by_professional_id UUID REFERENCES staff(id),
    created_by_professional_name VARCHAR(150),

    -- Notes
    notes TEXT,
    internal_notes TEXT,
    terms_and_conditions TEXT,

    -- Generated PDF
    pdf_storage_path TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_budget_number_per_clinic UNIQUE (clinic_id, budget_number)
);

CREATE INDEX idx_budgets_patient ON budgets(patient_id);
CREATE INDEX idx_budgets_status ON budgets(clinic_id, status);
```

### 3.12 Table: `budget_items` (Budget Line Items)

```sql
CREATE TABLE budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Treatment
    treatment_catalog_id UUID REFERENCES treatment_catalog(id),
    treatment_code VARCHAR(20),
    treatment_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Dental detail
    tooth_number VARCHAR(10),
    tooth_face VARCHAR(20),

    -- Quantities
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,

    -- Display order
    sort_order INTEGER DEFAULT 0,

    -- Production status
    is_produced BOOLEAN DEFAULT FALSE,
    produced_at TIMESTAMPTZ,
    produced_by UUID REFERENCES auth.users(id),

    -- Reference to patient treatment (when accepted)
    patient_treatment_id UUID REFERENCES patient_treatments(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_items_budget ON budget_items(budget_id);
```

### 3.13 Table: `payments`

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Optional references
    budget_id UUID REFERENCES budgets(id),
    appointment_id UUID REFERENCES appointments(id),
    invoice_id UUID REFERENCES invoices(id),

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(50) NOT NULL, -- "Cash", "Card", "Transfer", "Bizum", etc.

    -- Reference/Concept
    reference VARCHAR(100),
    concept TEXT,

    -- Date
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_time TIME DEFAULT CURRENT_TIME,

    -- Status
    status VARCHAR(20) DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Voided', 'Refunded')),

    -- Voiding
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES auth.users(id),
    void_reason TEXT,

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_date ON payments(clinic_id, payment_date);
CREATE INDEX idx_payments_budget ON payments(budget_id);
```

### 3.14 Table: `patient_consents`

```sql
CREATE TABLE patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Consent type
    consent_template_id UUID REFERENCES consent_templates(id),
    consent_type VARCHAR(100) NOT NULL, -- "General consent", "Orthodontics", etc.

    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Sent', 'Signed', 'Rejected', 'Expired')),

    -- Dates
    sent_date TIMESTAMPTZ,
    signed_date TIMESTAMPTZ,
    expiry_date DATE,

    -- Signed document
    signed_document_path TEXT, -- Path to signed PDF in Storage
    signed_document_name VARCHAR(255),

    -- Related treatment (optional)
    related_treatment_id UUID REFERENCES patient_treatments(id),

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_patient_consents_patient ON patient_consents(patient_id);
CREATE INDEX idx_patient_consents_status ON patient_consents(patient_id, status);
```

### 3.15 Table: `prescriptions`

```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Prescription number
    prescription_number VARCHAR(50),

    -- Prescribing professional
    prescribing_professional_id UUID REFERENCES staff(id),
    prescribing_professional_name VARCHAR(150) NOT NULL,
    prescribing_professional_license VARCHAR(50), -- License number

    -- Related visit (optional)
    visit_record_id UUID REFERENCES visit_records(id),
    appointment_id UUID REFERENCES appointments(id),

    -- Date
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Status
    status VARCHAR(30) DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Sent', 'Voided')),

    -- Generated PDF
    pdf_storage_path TEXT,

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_prescription_number_per_clinic UNIQUE (clinic_id, prescription_number)
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescription_date DESC);
```

### 3.16 Table: `prescription_items` (Prescription Medications)

```sql
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,

    -- Medication
    medication_name VARCHAR(200) NOT NULL,
    active_ingredient VARCHAR(200),

    -- Dosage
    dosage VARCHAR(100), -- "500mg"
    frequency VARCHAR(100), -- "Every 8 hours"
    duration VARCHAR(100), -- "7 days"
    administration_route VARCHAR(50), -- "Oral", "Topical", etc.

    -- Quantity
    quantity INTEGER DEFAULT 1,

    -- Additional instructions
    instructions TEXT,

    -- Order
    sort_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);
```

### 3.17 Table: `odontogram_history` (Odontogram History)

```sql
CREATE TABLE odontogram_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_record_id UUID REFERENCES visit_records(id),

    -- Odontogram snapshot
    odontogram_data JSONB NOT NULL, -- Complete odontogram state

    -- Specific change (if incremental)
    tooth_number VARCHAR(5),
    change_type VARCHAR(50), -- "treatment_added", "condition_updated", etc.
    change_details JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_odontogram_history_patient ON odontogram_history(patient_id);
CREATE INDEX idx_odontogram_history_visit ON odontogram_history(visit_record_id);
```

---

## 4. Audit Tables

### 4.1 Table: `audit_log` (Change Log)

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id),

    -- What was modified
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,

    -- Operation type
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE')),

    -- Data
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[], -- List of fields that changed

    -- Who and when
    performed_by UUID REFERENCES auth.users(id),
    performed_by_email VARCHAR(255),
    performed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Additional context
    ip_address INET,
    user_agent TEXT,

    -- For patients specifically
    patient_id UUID REFERENCES patients(id)
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_patient ON audit_log(patient_id);
CREATE INDEX idx_audit_log_date ON audit_log(performed_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(performed_by);
```

### 4.2 Table: `access_log` (Access Log - GDPR)

```sql
CREATE TABLE access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),

    -- Who accessed
    user_id UUID NOT NULL REFERENCES auth.users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),

    -- What was accessed
    resource_type VARCHAR(50) NOT NULL, -- "patient_file", "medical_history", etc.
    resource_id UUID,
    patient_id UUID REFERENCES patients(id),

    -- Access type
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('VIEW', 'DOWNLOAD', 'PRINT', 'EXPORT')),

    -- Details
    access_details JSONB,

    -- When
    accessed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Context
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_access_log_patient ON access_log(patient_id);
CREATE INDEX idx_access_log_user ON access_log(user_id);
CREATE INDEX idx_access_log_date ON access_log(accessed_at DESC);
```

---

## 5. Row Level Security (RLS)

### 5.1 Base Multi-Tenant Policy

```sql
-- Enable RLS on all tables
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

-- Helper function to get current user's clinic_id
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

-- Example policy for patients
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

### 5.2 Role-Based Policies

```sql
-- Helper function to verify role
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

-- Only admin can view full audit_log
CREATE POLICY "Only admins can view audit log"
ON audit_log FOR SELECT
USING (
    clinic_id = get_user_clinic_id()
    AND has_role('Administrator')
);
```

---

## 6. Triggers

### 6.1 Audit Trigger

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
        -- Calculate changed fields
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

-- Apply trigger to main tables
CREATE TRIGGER audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patient_treatments
    AFTER INSERT OR UPDATE OR DELETE ON patient_treatments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ... apply to other tables as needed
```

### 6.2 SOAP Notes Immutability Trigger

```sql
CREATE OR REPLACE FUNCTION prevent_finalized_soap_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_finalized = TRUE THEN
        RAISE EXCEPTION 'Cannot modify finalized SOAP notes. Notes were finalized on % by %.',
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

### 6.3 Auto Alerts Trigger

```sql
CREATE OR REPLACE FUNCTION check_auto_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Alert for debt > 30 days
    IF TG_TABLE_NAME = 'payments' OR TG_TABLE_NAME = 'budgets' THEN
        -- Check pending debt
        PERFORM create_debt_alert_if_needed(NEW.patient_id);
    END IF;

    -- Alert for severe allergy
    IF TG_TABLE_NAME = 'patient_allergies' THEN
        IF NEW.severity IN ('severe', 'extreme') THEN
            INSERT INTO patient_alerts (
                clinic_id, patient_id, alert_type, priority, title, message,
                is_auto_generated, auto_generation_rule
            ) VALUES (
                NEW.clinic_id, NEW.patient_id, 'medical', 'critical',
                NEW.severity || ' allergy: ' || NEW.allergen_name,
                'Patient has a ' || NEW.severity || ' allergy to ' || NEW.allergen_name || '. ' || COALESCE(NEW.reaction_description, ''),
                TRUE, 'severe_allergy'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 6.4 Updated_at Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at_patients
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... repeat for other tables
```

### 6.5 Auto-generated Patient Number Trigger

```sql
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR(10);
BEGIN
    -- Get prefix from clinic (configurable)
    SELECT COALESCE(patient_number_prefix, 'PAT') INTO v_prefix
    FROM clinic_settings
    WHERE clinic_id = NEW.clinic_id;

    -- Get next number
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

## 7. Database Functions (Supabase Edge Functions / PostgreSQL Functions)

### 7.1 Function: Get Patient Financial Summary

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
        COALESCE(SUM(b.total_amount) FILTER (WHERE b.status IN ('Accepted', 'In Progress')), 0)::DECIMAL as total_budgeted,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completed'), 0)::DECIMAL as total_paid,
        COALESCE(SUM(b.pending_amount) FILTER (WHERE b.status IN ('Accepted', 'In Progress')), 0)::DECIMAL as total_pending,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('Accepted', 'In Progress'))::INTEGER as active_budgets_count,
        COUNT(DISTINCT pt.id) FILTER (WHERE pt.status = 'Pending')::INTEGER as pending_treatments_count,
        0::INTEGER as overdue_invoices_count -- Implement when invoices table exists
    FROM patients pat
    LEFT JOIN budgets b ON b.patient_id = pat.id
    LEFT JOIN payments p ON p.patient_id = pat.id
    LEFT JOIN patient_treatments pt ON pt.patient_id = pat.id
    WHERE pat.id = p_patient_id
    GROUP BY pat.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.2 Function: Get Active Patient Alerts

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

### 7.3 Function: Search Patients

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
            WHERE b.patient_id = p.id AND b.status IN ('Accepted', 'In Progress')
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

### 7.4 Function: Finalize SOAP Notes

```sql
CREATE OR REPLACE FUNCTION finalize_soap_notes(p_soap_notes_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_name VARCHAR;
BEGIN
    -- Get user name
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

### 7.5 Function: Import Patients from CSV

```sql
CREATE OR REPLACE FUNCTION import_patients_from_csv(
    p_clinic_id UUID,
    p_csv_data JSONB -- Array of objects with patient data
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

## 8. Data Flows Between Screens

### 8.1 Flow: Patient Creation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOW: PATIENT CREATION                                │
└─────────────────────────────────────────────────────────────────────────────┘

1. AddPatientModal (Frontend)
   │
   ├─→ Step 1: Patient Data
   │   └─→ [first_name, last_name, document_type, document_number, birth_date, gender]
   │
   ├─→ Step 2: Contact
   │   └─→ [phone, email, allows_reminders, allows_marketing]
   │
   ├─→ Step 3: Administrative
   │   └─→ [professional_id, source, address, billing_company, payment_methods]
   │
   ├─→ Step 4: Health
   │   └─→ [allergies[], conditions[], medications[], is_pregnant, is_smoker]
   │
   ├─→ Step 5: Consents
   │   └─→ [consent_ids[] - template selection]
   │
   └─→ Step 6: Summary → SUBMIT
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    DATABASE TRANSACTION                               │
├──────────────────────────────────────────────────────────────────────┤
│  BEGIN;                                                              │
│                                                                      │
│  1. INSERT INTO patients (...) RETURNING id;                         │
│     └─→ Trigger: generate_patient_number()                           │
│     └─→ Trigger: audit_trigger_function()                            │
│                                                                      │
│  2. INSERT INTO patient_allergies (patient_id, ...) -- for each      │
│     └─→ Trigger: check_auto_alerts() -- if severe/extreme            │
│                                                                      │
│  3. INSERT INTO patient_medical_history (patient_id, ...)            │
│                                                                      │
│  4. INSERT INTO patient_consents (patient_id, ...) -- for each       │
│                                                                      │
│  COMMIT;                                                             │
└──────────────────────────────────────────────────────────────────────┘
       │
       ▼
   Returns patient_id → Redirect to Record or Create Appointment
```

### 8.2 Flow: Open Patient Record

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLOW: OPEN PATIENT RECORD                               │
└─────────────────────────────────────────────────────────────────────────────┘

PatientRecordModal.open(patientId)
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    INITIAL QUERIES (PARALLEL)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. get_patient_details(patient_id)                                  │
│     └─→ patients + patient_medical_history + patient_allergies       │
│                                                                      │
│  2. get_active_patient_alerts(patient_id, 'file_open')               │
│     └─→ Show critical alerts immediately                             │
│     └─→ INSERT INTO access_log (GDPR)                                │
│                                                                      │
│  3. get_patient_financial_summary(patient_id)                        │
│     └─→ totals, debt, active budgets                                 │
│                                                                      │
│  4. get_next_appointment(patient_id)                                 │
│     └─→ next scheduled appointment                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    RENDER: SUMMARY TAB                                │
├──────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│  │   Avatar    │  │  Critical   │  │    Next     │                   │
│  │   Name      │  │   Alerts    │  │ Appointment │                   │
│  │   Contact   │  │             │  │             │                   │
│  └─────────────┘  └─────────────┘  └─────────────┘                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │  Critical Info: Allergies | Diseases | Medication           │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌───────────────────┐  ┌───────────────────┐                        │
│  │ Pending Treatments│  │ Pending Balance   │                        │
│  └───────────────────┘  └───────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.3 Flow: Register Clinical Visit

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLOW: REGISTER CLINICAL VISIT                           │
└─────────────────────────────────────────────────────────────────────────────┘

Schedule → Click on appointment → Change status to "In consultation"
   │
   ▼
UPDATE appointments SET visit_status = 'in_consultation', consultation_started_at = NOW()
   │
   ▼
Open Record → "Clinical History" Tab
   │
   ├─→ Load previous visits
   │   └─→ SELECT FROM visit_records + soap_notes WHERE patient_id = ?
   │
   └─→ Create current visit record
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    DURING CONSULTATION                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INSERT INTO visit_records (appointment_id, patient_id, ...)      │
│                                                                      │
│  2. Doctor writes SOAP notes (is_draft = TRUE)                       │
│     └─→ INSERT/UPDATE soap_notes                                     │
│     └─→ Auto-save every 30 seconds                                   │
│                                                                      │
│  3. Doctor modifies odontogram                                       │
│     └─→ INSERT INTO odontogram_history (snapshot)                    │
│     └─→ UPDATE visit_records SET odontogram_snapshot = ?             │
│                                                                      │
│  4. Doctor uploads files/x-rays                                      │
│     └─→ Upload to Supabase Storage                                   │
│     └─→ INSERT INTO patient_files                                    │
│                                                                      │
│  5. Doctor marks treatments as completed                             │
│     └─→ UPDATE patient_treatments SET status = 'Completed'           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
End consultation
   │
   ├─→ finalize_soap_notes(soap_id) -- Immutability
   │
   ├─→ UPDATE appointments SET
   │       visit_status = 'completed',
   │       consultation_ended_at = NOW()
   │
   └─→ Calculate durations (waiting, consultation)
```

### 8.4 Flow: Create Budget

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLOW: CREATE BUDGET                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Patient Record → Finances Tab → "New Budget"
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    BUDGET CREATION MODAL                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Load treatment catalog                                           │
│     └─→ SELECT FROM treatment_catalog WHERE clinic_id = ?            │
│                                                                      │
│  2. User selects treatments                                          │
│     └─→ Each item: {treatment_id, tooth, quantity, discount}         │
│                                                                      │
│  3. Calculate totals in real time (frontend)                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
SAVE BUDGET
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    DATABASE TRANSACTION                               │
├──────────────────────────────────────────────────────────────────────┤
│  BEGIN;                                                              │
│                                                                      │
│  1. INSERT INTO budgets (...) RETURNING id;                          │
│     └─→ Trigger: generate_budget_number()                            │
│                                                                      │
│  2. INSERT INTO budget_items (...) -- for each treatment             │
│                                                                      │
│  3. If status = 'Accepted':                                          │
│     └─→ INSERT INTO patient_treatments -- create treatments          │
│     └─→ UPDATE budget_items SET patient_treatment_id = ?             │
│                                                                      │
│  COMMIT;                                                             │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Optionally: Generate PDF → Upload to Storage → UPDATE budgets SET pdf_path
```

---

## 9. Technical Considerations

### 9.1 Supabase Storage Buckets

```
storage/
├── patient-files/           # General patient files
│   └── {clinic_id}/
│       └── {patient_id}/
│           ├── documents/   # PDF documents
│           ├── images/      # Intraoral photos, etc.
│           ├── xrays/       # X-rays
│           └── dicom/       # DICOM files
│
├── consents/                # Signed consents
│   └── {clinic_id}/
│       └── {patient_id}/
│
├── prescriptions/           # Generated prescription PDFs
│   └── {clinic_id}/
│       └── {patient_id}/
│
├── budgets/                 # Budget PDFs
│   └── {clinic_id}/
│       └── {patient_id}/
│
└── avatars/                 # Patient profile photos
    └── {clinic_id}/
        └── {patient_id}/
```

### 9.2 Recommended Indexes for Performance

```sql
-- Patient full-text search
CREATE INDEX idx_patients_fts ON patients
USING gin(to_tsvector('spanish', full_name || ' ' || COALESCE(phone, '') || ' ' || COALESCE(email, '')));

-- Appointments by date (heavily used in schedule)
CREATE INDEX idx_appointments_agenda ON appointments(clinic_id, appointment_date, professional_id)
WHERE is_cancelled = FALSE;

-- Pending treatments
CREATE INDEX idx_treatments_pending ON patient_treatments(patient_id, status)
WHERE status IN ('Pending', 'In Progress');

-- Active alerts
CREATE INDEX idx_alerts_active ON patient_alerts(patient_id)
WHERE is_active = TRUE AND (dismissed_at IS NULL OR dismiss_until < NOW());

-- Active budgets
CREATE INDEX idx_budgets_active ON budgets(patient_id, status)
WHERE status IN ('Pending', 'Accepted', 'In Progress');
```

### 9.3 DICOM File Handling

```sql
-- DICOM metadata structure stored in patient_files.dicom_metadata
{
    "patientId": "string",           -- Patient ID in DICOM equipment
    "studyDate": "YYYYMMDD",         -- Study date
    "studyDescription": "string",    -- Description
    "modality": "CR|DX|IO|PX",       -- Image type
    "manufacturer": "string",        -- Equipment manufacturer
    "institutionName": "string",     -- Institution name
    "rows": 1024,                    -- Dimensions
    "columns": 1024,
    "bitsStored": 12,
    "windowCenter": 2048,            -- For visualization
    "windowWidth": 4096
}
```

### 9.4 GDPR Considerations

1. **Access logging**: All access to sensitive data is recorded in `access_log`
2. **Right to erasure**: Implement anonymization function instead of deletion
3. **Data export**: Function to export all patient data
4. **Explicit consent**: Fields `allows_marketing_communications`, `allows_appointment_reminders`

```sql
-- Function to anonymize patient (GDPR - Right to erasure)
CREATE OR REPLACE FUNCTION anonymize_patient(p_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE patients SET
        first_name = 'ANONYMIZED',
        last_name = 'ANONYMIZED',
        full_name = 'ANONYMIZED',
        document_number = NULL,
        phone = 'ANONYMIZED',
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

    -- Anonymization log
    INSERT INTO audit_log (table_name, record_id, operation, performed_by, patient_id)
    VALUES ('patients', p_patient_id, 'ANONYMIZE', auth.uid(), p_patient_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 10. Suggested Implementation Plan

### Phase 1: Foundations (Week 1-2)

- [ ] Create base tables: `clinics`, `patients`, `staff`, `roles`
- [ ] Configure multi-tenant RLS
- [ ] Implement audit triggers
- [ ] Configure Storage buckets

### Phase 2: Core Patient (Week 3-4)

- [ ] Tables: `patient_allergies`, `patient_medical_history`, `patient_alerts`
- [ ] Patient search functions
- [ ] CSV import
- [ ] Complete patient CRUD

### Phase 3: Catalog and Treatments (Week 5-6)

- [ ] Tables: `treatment_catalog`, `patient_treatments`
- [ ] Treatment management functions
- [ ] Treatment status flow

### Phase 4: Appointments and Visits (Week 7-8)

- [ ] Tables: `appointments`, `visit_records`, `soap_notes`
- [ ] SOAP immutability trigger
- [ ] Clinical history functions
- [ ] Odontogram: `odontogram_history`

### Phase 5: Finances (Week 9-10)

- [ ] Tables: `budgets`, `budget_items`, `payments`, `invoices`
- [ ] Financial summary functions
- [ ] Budget number generation

### Phase 6: Documents and Files (Week 11-12)

- [ ] Tables: `patient_files`, `patient_consents`, `prescriptions`
- [ ] Storage integration
- [ ] Basic DICOM support
- [ ] PDF generation

### Phase 7: Audit and GDPR (Week 13-14)

- [ ] Complete `audit_log` and `access_log`
- [ ] Anonymization function
- [ ] Patient data export
- [ ] Security review

---

## 11. Notes for the Team

### 11.1 Code Conventions

- **UUIDs**: Use `gen_random_uuid()` for all PKs
- **Timestamps**: Always `TIMESTAMPTZ`, never `TIMESTAMP`
- **Soft Delete**: Use `is_deleted` + `deleted_at` + `deleted_by`
- **Amounts**: `DECIMAL(10,2)` for prices, `DECIMAL(12,2)` for totals

### 11.2 Error Handling

- Use custom PostgreSQL error codes for business errors
- Always return messages in Spanish for the frontend

### 11.3 Testing

- Create test data for each development clinic
- Test RLS with different users/roles
- Verify audit triggers

### 11.4 Pending Decisions (for the team)

1. Normalized structure or JSONB for conditions/medications?
2. Integrated invoicing or external system?
3. Real-time notifications (Supabase Realtime)?

---

## 12. Connections with Other System Modules

The patient record is the **central core** of klinikOS. Below is how it connects with each application module:

### 12.1 Connection Map

```
                                    ┌─────────────────┐
                                    │  CONFIGURATION  │
                                    │  /settings      │
                                    └────────┬────────┘
                                             │
            ┌────────────────────────────────┼────────────────────────────────┐
            │                                │                                │
            ▼                                ▼                                ▼
┌───────────────────┐             ┌───────────────────┐             ┌───────────────────┐
│ treatment_catalog │             │      staff        │             │ consent_templates │
│  (Treatments)     │             │  (Professionals)  │             │   (Templates)     │
└─────────┬─────────┘             └─────────┬─────────┘             └─────────┬─────────┘
          │                                 │                                 │
          │    ┌────────────────────────────┼────────────────────────────┐   │
          │    │                            │                            │   │
          │    │                            ▼                            │   │
          │    │              ┌─────────────────────────┐                │   │
          │    │              │                         │                │   │
          ▼    ▼              │    PATIENT RECORD       │                ▼   │
┌───────────────────┐         │       /patients        │         ┌──────────┴──────────┐
│  patient_         │◄────────│                         │────────►│  patient_consents   │
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
│     SCHEDULE      │         │    MANAGEMENT     │   │      CASH         │
│    /schedule      │         │   /management     │   │     /cash         │
│                   │         │                   │   │                   │
│ - appointments    │         │ - Statistics      │   │ - Daily payments  │
│ - visit_records   │         │ - Patient KPIs    │   │ - Collections     │
│ - soap_notes      │         │ - Global debt     │   │ - Cash closing    │
└─────────┬─────────┘         └───────────────────┘   └─────────┬─────────┘
          │                                                     │
          │                                                     │
          └──────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      DAILY REPORT       │
                    │     /daily-report       │
                    │                         │
                    │ - Daily production      │
                    │ - Treatments done       │
                    │ - Payments collected    │
                    └─────────────────────────┘
```

### 12.2 Connection Details by Module

#### 12.2.1 SCHEDULE (`/schedule`) ↔ Patient Record

| Direction         | Action                                     | Data Involved                            |
| ----------------- | ------------------------------------------ | ---------------------------------------- |
| Schedule → Record | Click on appointment opens patient record  | `patient_id` from appointment            |
| Schedule → Record | "View record" from appointment card        | `patient_id`, opens Summary tab          |
| Schedule → Record | Change visit status opens clinical history | `appointment_id`, opens Clinical History |
| Record → Schedule | "Add appointment" from record              | `patient_id`, pre-filled data            |
| Record → Schedule | View next appointment (click)              | Navigates to date in schedule            |

**Tables involved:**

```sql
-- From Schedule, get patient data to display in appointment card
SELECT
    a.*,
    p.full_name,
    p.phone,
    p.avatar_url,
    (SELECT array_agg(allergen_name) FROM patient_allergies pa
     WHERE pa.patient_id = p.id AND pa.severity IN ('severe', 'extreme')) as critical_allergies,
    EXISTS (SELECT 1 FROM patient_alerts al
            WHERE al.patient_id = p.id AND al.is_active AND al.priority = 'critical') as has_critical_alert
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.appointment_date = :date AND a.clinic_id = :clinic_id;
```

**Visit Status Flow:**

```
SCHEDULE                            PATIENT RECORD
────────                            ──────────────
scheduled ──────────────────────────► (no interaction)
    │
    ▼
confirmed ──────────────────────────► Show confirmation
    │
    ▼
in_waiting_room ────────────────────► (no interaction)
    │
    ▼
in_consultation ────────────────────► Opens Clinical History
    │                                     │
    │                                     ├─► Edit SOAP notes
    │                                     ├─► Update odontogram
    │                                     ├─► Upload files
    │                                     └─► Mark treatments completed
    ▼
completed ◄─────────────────────────────── Finalize SOAP notes
```

---

#### 12.2.2 MANAGEMENT (`/management`) ↔ Patient Record

| Direction           | Action                       | Data Involved                |
| ------------------- | ---------------------------- | ---------------------------- |
| Management → Record | Click on patient in list     | `patient_id`                 |
| Management → Record | Click on patient with debt   | `patient_id`, opens Finances |
| Management ← Record | Data update reflects in KPIs | Updated statistics           |

**Data that Management gets from patients:**

```sql
-- KPIs for Management Dashboard
SELECT
    COUNT(*) as total_patients,
    COUNT(*) FILTER (WHERE status = 'Active') as active_patients,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as new_this_month,
    COUNT(*) FILTER (WHERE id IN (
        SELECT DISTINCT patient_id FROM budgets
        WHERE status IN ('Accepted', 'In Progress') AND pending_amount > 0
    )) as patients_with_debt,
    COALESCE(SUM(b.pending_amount), 0) as total_pending_debt
FROM patients p
LEFT JOIN budgets b ON b.patient_id = p.id AND b.status IN ('Accepted', 'In Progress')
WHERE p.clinic_id = :clinic_id AND p.is_deleted = FALSE;

-- Patients with appointments today
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

#### 12.2.3 CASH (`/cash`) ↔ Patient Record

| Direction     | Action                              | Data Involved                  |
| ------------- | ----------------------------------- | ------------------------------ |
| Cash → Record | Click on payment shows patient      | `patient_id`, opens Finances   |
| Cash → Record | "View record" from payment line     | `patient_id`                   |
| Record → Cash | Register payment updates daily cash | `payment` adds to cash closing |

**Data that Cash gets from patients:**

```sql
-- Daily payments for Cash
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
AND pay.status = 'Completed'
ORDER BY pay.payment_time DESC;

-- Summary by payment method
SELECT
    payment_method,
    COUNT(*) as count,
    SUM(amount) as total
FROM payments
WHERE clinic_id = :clinic_id
AND payment_date = CURRENT_DATE
AND status = 'Completed'
GROUP BY payment_method;
```

**Payment Registration from Record:**

```sql
-- When a payment is registered in patient record
INSERT INTO payments (
    clinic_id, patient_id, budget_id, amount, currency,
    payment_method, reference, concept, payment_date, payment_time,
    created_by
) VALUES (
    :clinic_id, :patient_id, :budget_id, :amount, 'EUR',
    :payment_method, :reference, :concept, CURRENT_DATE, CURRENT_TIME,
    auth.uid()
);

-- Update budget
UPDATE budgets
SET paid_amount = paid_amount + :amount,
    updated_at = NOW(),
    updated_by = auth.uid()
WHERE id = :budget_id;
```

---

#### 12.2.4 DAILY REPORT (`/daily-report`) ↔ Patient Record

| Direction       | Action                       | Data Involved                  |
| --------------- | ---------------------------- | ------------------------------ |
| Report → Record | Click on completed treatment | `patient_id`, opens Treatments |
| Report → Record | Click on patient             | `patient_id`                   |
| Record → Report | Mark treatment as produced   | Reflects in daily report       |

**Data that Daily Report gets:**

```sql
-- Daily production (completed treatments)
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
AND pt.status = 'Completed'
ORDER BY pt.completed_date DESC;

-- Production summary by professional
SELECT
    pt.completed_by_name as professional,
    COUNT(*) as treatments_count,
    SUM(pt.final_amount) as total_production
FROM patient_treatments pt
WHERE pt.clinic_id = :clinic_id
AND DATE(pt.completed_date) = CURRENT_DATE
AND pt.status = 'Completed'
GROUP BY pt.completed_by_name;
```

---

#### 12.2.5 CONFIGURATION (`/settings`) → Patient Record

Configuration **does NOT receive data** from the patient record, but **provides master data** that the record uses:

| Config Module           | Table                                | Use in Patient Record                              |
| ----------------------- | ------------------------------------ | -------------------------------------------------- |
| `/settings/treatments`  | `treatment_catalog`                  | Treatment selector when creating budget            |
| `/settings/specialists` | `staff`                              | Professional assignment to appointments/treatments |
| `/settings/roles`       | `roles`, `permissions`               | Access control to record sections                  |
| `/settings/invoicing`   | `invoice_settings`                   | Invoice format, numbering                          |
| `/settings/finances`    | `payment_methods`, `financing_plans` | Available payment methods                          |

```sql
-- Load treatment catalog for budget selector
SELECT id, code, name, category, base_price,
       requires_tooth_selection, default_duration_minutes
FROM treatment_catalog
WHERE clinic_id = :clinic_id AND is_active = TRUE
ORDER BY category, name;

-- Load professionals for appointment selector
SELECT id, full_name, role, specialization, avatar_url
FROM staff
WHERE clinic_id = :clinic_id AND is_active = TRUE
ORDER BY full_name;

-- Load consent templates
SELECT id, name, description, category, template_url
FROM consent_templates
WHERE clinic_id = :clinic_id AND is_active = TRUE
ORDER BY category, name;
```

---

### 12.3 Permission Matrix by Module

| Module                        | Reception      | Hygienist    | Doctor       | Administrator  |
| ----------------------------- | -------------- | ------------ | ------------ | -------------- |
| **Record - Summary**          | ✅ View/Edit   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Record - General Info**     | ✅ View/Edit   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Record - Clinical History** | 👁️ View only   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Record - Treatments**       | 👁️ View only   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Record - X-Ray Images**     | ✅ View/Upload | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Record - Finances**         | ✅ View/Edit   | 👁️ View only | ✅ View/Edit | ✅ View/Edit   |
| **Record - Documents**        | ✅ View/Edit   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Record - Prescriptions**    | 👁️ View only   | ❌ No access | ✅ View/Edit | ✅ View/Edit   |
| **Schedule**                  | ✅ View/Edit   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Management (Dashboard)**    | ❌ No access   | ❌ No access | ❌ No access | ✅ Full access |
| **Cash**                      | ✅ View/Edit   | 👁️ View only | 👁️ View only | ✅ View/Edit   |
| **Daily Report**              | 👁️ View only   | ✅ View/Edit | ✅ View/Edit | ✅ View/Edit   |
| **Configuration**             | ❌ No access   | ❌ No access | ❌ No access | ✅ Full access |

---

### 12.4 Events and Notifications Between Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM EVENTS                                        │
└─────────────────────────────────────────────────────────────────────────────┘

PATIENT RECORD emits:
├── patient.created ──────────────► Management (update counters)
├── patient.updated ──────────────► Schedule (if phone/name changed)
├── treatment.completed ──────────► Daily Report (new production)
│                                 └► Cash (if associated payment)
├── payment.registered ───────────► Cash (update closing)
│                                 └► Management (update debt)
├── budget.accepted ──────────────► Treatments (create patient_treatments)
├── alert.created ────────────────► Schedule (show in appointment card)
└── soap_notes.finalized ─────────► History (immutability activated)

SCHEDULE emits:
├── appointment.created ──────────► Record (update next appointment)
├── appointment.status_changed ───► Record (if in_consultation, open history)
└── appointment.completed ────────► Daily Report (register visit)

CASH emits:
├── payment.voided ───────────────► Record (update balances)
└── cash_closing.completed ───────► Management (update reports)
```

---

### 12.5 Critical Connection Queries

#### Query: Open record with all related data

```sql
-- Function that gets EVERYTHING needed when opening the record
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
            WHERE pt.patient_id = p_patient_id AND pt.status = 'Pending'
        ),
        'financial_summary', (
            SELECT json_build_object(
                'total_debt', COALESCE(SUM(b.pending_amount), 0),
                'active_budgets', COUNT(*) FILTER (WHERE b.status IN ('Accepted', 'In Progress'))
            )
            FROM budgets b WHERE b.patient_id = p_patient_id
        ),
        'pending_consents_count', (
            SELECT COUNT(*) FROM patient_consents pc
            WHERE pc.patient_id = p_patient_id AND pc.status = 'Pending'
        )
    ) INTO v_result;

    -- Log access (GDPR)
    INSERT INTO access_log (clinic_id, user_id, resource_type, resource_id, patient_id, access_type)
    SELECT clinic_id, auth.uid(), 'patient_file', p_patient_id, p_patient_id, 'VIEW'
    FROM patients WHERE id = p_patient_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Query: Data for appointment card in Schedule

```sql
-- Get patient data needed to display in appointment card
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
                AND pa.severity IN ('severe', 'extreme')
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

## 13. References

- **Current frontend**: See `src/context/PatientsContext.tsx` for mock data model
- **UI documentation**: See `docs/FICHA_PACIENTE_CHANGELOG.md`
- **Components**: See `src/components/pacientes/modals/patient-record/`

---

_Document generated on February 2, 2026_  
_Version 1.0 - Complete MVP_
