# Technical Brief: Schedule Module - klinikOS

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** MVP (First complete version)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Architecture:** Multi-tenant from the start

---

## 1. Overview

### 1.1 Description

The **Schedule Module** is the clinic's daily operations center. It manages all appointments, patient flow during their visit, schedule blocks, and daily report generation for professionals.

### 1.2 Module Components

| Component         | Route           | Description                                        |
| ----------------- | --------------- | -------------------------------------------------- |
| **Calendar**      | `/agenda`       | Appointment view (day/week/month) with drag & drop |
| **Daily Report**  | `/parte-diario` | Daily appointments table with visit statuses       |
| **Export Report** | Modal           | PDF generation for professionals                   |

### 1.3 Main Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHEDULE MODULE                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📅 CALENDAR                       📋 DAILY REPORT                          │
│  ├─ Day view                       ├─ Daily appointments table              │
│  ├─ Week view                      ├─ Visit statuses                        │
│  ├─ Month view                     ├─ Wait/consultation times               │
│  ├─ Filter by professional         ├─ Advanced filters                      │
│  ├─ Filter by box                  ├─ Quick actions                         │
│  ├─ Drag & drop                    ├─ Quick payments                        │
│  └─ Schedule blocks                └─ Bulk status change                    │
│                                                                             │
│  ➕ CREATE APPOINTMENT             📤 EXPORT                                │
│  ├─ Patient selection              ├─ By professional                       │
│  ├─ Treatment selection            ├─ By date range                         │
│  ├─ Link treatments                ├─ PDF format                            │
│  └─ Recurrence                     └─ Individual/bulk download              │
│                                                                             │
│  🔒 BLOCKS                         ⏱️ TIMERS                                │
│  ├─ Cleaning                       ├─ Wait time                             │
│  ├─ Repair                         ├─ Consultation time                     │
│  ├─ Break                          ├─ Excess alerts                         │
│  ├─ Meeting                        └─ Daily KPIs                            │
│  └─ Recurrence                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Patient Visit Statuses

The system implements a status flow to track the patient within the clinic:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  SCHEDULED   │────►│ WAITING ROOM │────►│    CALL      │────►│IN CONSULT.   │────►│  COMPLETED   │
│  (scheduled) │     │(waiting_room)│     │(call_patient)│     │(in_consult.) │     │ (completed)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
      ⬜                   🟡                   🔵                   🟢                   🟣
    Gray                Yellow                Blue                Green               Purple
```

**Features:**

- Each status change records timestamp
- Calculates wait time (waiting_room → in_consultation)
- Calculates consultation time (in_consultation → completed)
- Visual alerts when exceeding thresholds

---

## 2. Data Architecture

### 2.1 Schedule Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLINICS                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     STAFF       │     │  APPOINTMENTS   │     │  AGENDA_BLOCKS  │
│ (Professionals) │     │                 │     │    (Blocks)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          │                    │    │                    │
          │                    │    │                    │
          │         ┌──────────┘    └──────────┐        │
          │         │                          │        │
          │         ▼                          ▼        │
          │  ┌─────────────┐           ┌─────────────┐  │
          │  │  PATIENTS   │           │VISIT_STATUS_│  │
          │  │             │           │   HISTORY   │  │
          │  └─────────────┘           └─────────────┘  │
          │         │                                   │
          │         │                                   │
          │         ▼                                   │
          │  ┌─────────────────────────────────────┐   │
          │  │         VISIT_RECORDS               │   │
          │  │   (Clinical visit records)          │   │
          │  └─────────────────────────────────────┘   │
          │                    │                       │
          │         ┌──────────┼──────────┐           │
          │         │          │          │           │
          │         ▼          ▼          ▼           │
          │  ┌───────────┐┌─────────┐┌───────────┐   │
          │  │SOAP_NOTES ││ATTACHM. ││LINKED_    │   │
          │  │           ││         ││TREATMENTS │   │
          │  └───────────┘└─────────┘└───────────┘   │
          │                                          │
          └──────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ TREATMENT_      │
                    │ CATALOG         │
                    │ (Configuration) │
                    └─────────────────┘
```

### 2.2 Related Entities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTITIES CONNECTING WITH SCHEDULE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FROM CONFIGURATION               TO PATIENT RECORD                         │
│  ├─ staff (professionals)         ├─ patients (patient data)                │
│  ├─ boxes (operatories)           ├─ patient_alerts (active alerts)         │
│  ├─ treatment_catalog             ├─ patient_allergies (allergies)          │
│  ├─ clinic_settings               ├─ patient_treatments (treatments)        │
│  └─ working_hours                 └─ budgets                                │
│                                                                             │
│  TO CASH                          TO DAILY REPORT                           │
│  ├─ payments                      ├─ daily_production                       │
│  └─ payment_records               └─ export_documents (PDFs)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 Main Table: `appointments`

```sql
CREATE TABLE appointments (
    -- Identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_number VARCHAR(20), -- Sequential number per clinic (APT-000001)

    -- Date and time
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,

    -- Patient
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    patient_name VARCHAR(255) NOT NULL, -- Denormalized for performance
    patient_phone VARCHAR(20),
    patient_age INTEGER,

    -- Professional and location
    professional_id UUID REFERENCES staff(id),
    professional_name VARCHAR(150), -- Denormalized
    box VARCHAR(20), -- "box 1", "box 2", "box 3"

    -- Appointment information
    reason TEXT NOT NULL, -- Consultation reason
    appointment_type VARCHAR(50), -- "First visit", "Follow-up", "Treatment", "Emergency"
    service_code VARCHAR(20), -- Main service/treatment code

    -- Statuses
    confirmation_status VARCHAR(20) NOT NULL DEFAULT 'Unconfirmed'
        CHECK (confirmation_status IN ('Confirmed', 'Unconfirmed', 'Reschedule')),
    visit_status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
        CHECK (visit_status IN ('scheduled', 'waiting_room', 'call_patient', 'in_consultation', 'completed', 'no_show', 'cancelled')),
    is_confirmed BOOLEAN DEFAULT FALSE, -- Patient confirmed attendance

    -- Visit flow timestamps
    arrived_at TIMESTAMPTZ, -- Arrival at reception
    waiting_started_at TIMESTAMPTZ, -- Entry to waiting room
    called_at TIMESTAMPTZ, -- Time patient was called
    consultation_started_at TIMESTAMPTZ, -- Consultation start
    consultation_ended_at TIMESTAMPTZ, -- Consultation end

    -- Calculated durations (in milliseconds for precision)
    waiting_duration_ms INTEGER, -- Time in waiting room
    consultation_duration_ms INTEGER, -- Consultation time

    -- Payment
    has_pending_charge BOOLEAN DEFAULT FALSE,
    charge_amount DECIMAL(10,2),

    -- Tags for quick filtering
    tags JSONB DEFAULT '[]', -- ["debt", "vip", "emergency"]

    -- Visual
    bg_color VARCHAR(50) DEFAULT 'var(--color-event-teal)',

    -- Notes
    notes TEXT,
    internal_notes TEXT, -- Staff only visible

    -- Cancellation (soft delete)
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,

    -- Appointment origin
    created_from VARCHAR(50), -- "calendar", "phone", "online", "walk_in"

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_appointment_number UNIQUE (clinic_id, appointment_number)
);

-- Critical performance indexes
CREATE INDEX idx_appointments_date ON appointments(clinic_id, appointment_date)
    WHERE is_cancelled = FALSE;
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id, appointment_date)
    WHERE is_cancelled = FALSE;
CREATE INDEX idx_appointments_status ON appointments(clinic_id, visit_status, appointment_date);
CREATE INDEX idx_appointments_box ON appointments(clinic_id, appointment_date, box)
    WHERE is_cancelled = FALSE;
CREATE INDEX idx_appointments_week ON appointments(clinic_id, appointment_date)
    WHERE is_cancelled = FALSE AND appointment_date >= CURRENT_DATE - INTERVAL '7 days';
```

### 3.2 Table: `visit_status_history`

```sql
CREATE TABLE visit_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Status change
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,

    -- Change timestamp
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    changed_by_name VARCHAR(150),

    -- Additional context
    notes TEXT,

    -- For duration calculations
    duration_since_previous_ms INTEGER -- Time since previous status
);

CREATE INDEX idx_visit_status_history_appointment ON visit_status_history(appointment_id);
CREATE INDEX idx_visit_status_history_date ON visit_status_history(changed_at DESC);
```

### 3.3 Table: `agenda_blocks` (Schedule Blocks)

```sql
CREATE TABLE agenda_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Date and time
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Block type
    block_type VARCHAR(30) NOT NULL
        CHECK (block_type IN ('cleaning', 'repair', 'break', 'meeting', 'maintenance', 'vacation', 'other')),

    -- Description
    title VARCHAR(200),
    description TEXT,

    -- Assignment (optional)
    responsible_id UUID REFERENCES staff(id),
    responsible_name VARCHAR(150),
    box VARCHAR(20), -- NULL = all boxes

    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- {type: "weekly", daysOfWeek: [1,3,5], endDate: "2026-12-31"}
    parent_block_id UUID REFERENCES agenda_blocks(id), -- For recurrence instances

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_block_time CHECK (end_time > start_time)
);

CREATE INDEX idx_agenda_blocks_date ON agenda_blocks(clinic_id, block_date)
    WHERE is_active = TRUE;
CREATE INDEX idx_agenda_blocks_recurring ON agenda_blocks(clinic_id, is_recurring)
    WHERE is_active = TRUE AND is_recurring = TRUE;
```

### 3.4 Table: `appointment_linked_treatments` (Treatments Linked to Appointment)

```sql
CREATE TABLE appointment_linked_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Reference to patient treatment
    patient_treatment_id UUID REFERENCES patient_treatments(id),

    -- Treatment data (for history)
    treatment_code VARCHAR(20),
    treatment_name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2),

    -- Dental detail
    tooth_number VARCHAR(10),
    tooth_face VARCHAR(20),

    -- Status in this appointment
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'rescheduled')),

    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    completed_by_name VARCHAR(150),

    -- Notes
    notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_linked_treatments_appointment ON appointment_linked_treatments(appointment_id);
CREATE INDEX idx_linked_treatments_patient ON appointment_linked_treatments(patient_treatment_id);
```

### 3.5 Table: `appointment_attachments` (Visit Attachments)

```sql
CREATE TABLE appointment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- File information
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_type VARCHAR(30) NOT NULL CHECK (file_type IN ('image', 'document', 'xray', 'dicom')),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,

    -- Storage
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,

    -- Metadata
    description TEXT,

    -- Audit
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_by_name VARCHAR(150)
);

CREATE INDEX idx_appointment_attachments ON appointment_attachments(appointment_id);
```

### 3.6 Table: `staff` (Professionals)

```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- If has user account

    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

    -- Role and specialization
    role VARCHAR(50) NOT NULL, -- "Doctor", "Hygienist", "Reception", "Assistant"
    specialization VARCHAR(100), -- "Orthodontics", "Endodontics", "Periodontics"
    license_number VARCHAR(50), -- License number

    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Visual
    avatar_url TEXT,
    calendar_color VARCHAR(50), -- Calendar color

    -- Availability
    default_box VARCHAR(20), -- Default assigned box
    working_hours JSONB, -- {monday: {start: "09:00", end: "14:00"}, ...}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_staff_clinic ON staff(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_staff_role ON staff(clinic_id, role) WHERE is_active = TRUE;
```

### 3.7 Table: `boxes` (Operatories/Treatment Rooms)

```sql
CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Identification
    box_number INTEGER NOT NULL,
    box_name VARCHAR(50) NOT NULL, -- "Box 1", "Main Operatory"

    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    calendar_color VARCHAR(50),
    default_professional_id UUID REFERENCES staff(id),

    -- Capabilities
    has_xray BOOLEAN DEFAULT FALSE,
    has_scanner BOOLEAN DEFAULT FALSE,
    specialization VARCHAR(100), -- "Surgery", "Orthodontics"

    -- Display order
    display_order INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_box_per_clinic UNIQUE (clinic_id, box_number)
);

CREATE INDEX idx_boxes_clinic ON boxes(clinic_id, display_order) WHERE is_active = TRUE;
```

---

## 4. Visit Status Configuration

### 4.1 Type and Visual Configuration

```sql
-- Enum type for statuses (or check constraint if preferred)
CREATE TYPE visit_status_enum AS ENUM (
    'scheduled',      -- Scheduled
    'waiting_room',   -- In waiting room
    'call_patient',   -- Call patient
    'in_consultation',-- In consultation
    'completed',      -- Completed
    'no_show',        -- No show
    'cancelled'       -- Cancelled
);

-- Status configuration table (for per-clinic customization)
CREATE TABLE visit_status_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL,
    label VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL, -- Indicator color
    bg_color VARCHAR(20) NOT NULL, -- Badge background color
    text_color VARCHAR(20) NOT NULL, -- Text color
    icon VARCHAR(50), -- MD3 icon name

    -- Display order
    display_order INTEGER DEFAULT 0,

    -- Alerts
    warning_threshold_minutes INTEGER, -- Time for yellow alert
    critical_threshold_minutes INTEGER, -- Time for red alert

    CONSTRAINT unique_status_per_clinic UNIQUE (clinic_id, status)
);

-- Insert default configuration
INSERT INTO visit_status_config (clinic_id, status, label, color, bg_color, text_color, icon, display_order, warning_threshold_minutes, critical_threshold_minutes)
VALUES
    (:clinic_id, 'scheduled', 'Scheduled', '#9CA3AF', '#F3F4F6', '#6B7280', 'CalendarMonthRounded', 1, NULL, NULL),
    (:clinic_id, 'waiting_room', 'In waiting room', '#F59E0B', '#FEF3C7', '#B45309', 'PeopleRounded', 2, 15, 30),
    (:clinic_id, 'call_patient', 'Call', '#3B82F6', '#DBEAFE', '#1D4ED8', 'CallRounded', 3, NULL, NULL),
    (:clinic_id, 'in_consultation', 'In consultation', '#10B981', '#D1FAE5', '#047857', 'MonitorHeartRounded', 4, 45, 90),
    (:clinic_id, 'completed', 'Completed', '#8B5CF6', '#EDE9FE', '#6D28D9', 'CheckCircleRounded', 5, NULL, NULL),
    (:clinic_id, 'no_show', 'No show', '#EF4444', '#FEE2E2', '#B91C1C', 'PersonOffRounded', 6, NULL, NULL),
    (:clinic_id, 'cancelled', 'Cancelled', '#6B7280', '#F3F4F6', '#4B5563', 'CancelRounded', 7, NULL, NULL);
```

---

## 5. Triggers and Functions

### 5.1 Trigger: Log Visit Status Changes

```sql
CREATE OR REPLACE FUNCTION log_visit_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_previous_entry visit_status_history%ROWTYPE;
    v_duration_ms INTEGER;
BEGIN
    -- Only process if status changed
    IF OLD.visit_status IS DISTINCT FROM NEW.visit_status THEN

        -- Get previous entry to calculate duration
        SELECT * INTO v_previous_entry
        FROM visit_status_history
        WHERE appointment_id = NEW.id
        ORDER BY changed_at DESC
        LIMIT 1;

        -- Calculate duration since previous status
        IF v_previous_entry.id IS NOT NULL THEN
            v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_previous_entry.changed_at)) * 1000;
        END IF;

        -- Insert new history record
        INSERT INTO visit_status_history (
            clinic_id,
            appointment_id,
            previous_status,
            new_status,
            changed_at,
            changed_by,
            duration_since_previous_ms
        ) VALUES (
            NEW.clinic_id,
            NEW.id,
            OLD.visit_status,
            NEW.visit_status,
            NOW(),
            auth.uid(),
            v_duration_ms
        );

        -- Update specific timestamps based on new status
        CASE NEW.visit_status
            WHEN 'waiting_room' THEN
                NEW.waiting_started_at := NOW();
                NEW.arrived_at := COALESCE(NEW.arrived_at, NOW());
            WHEN 'call_patient' THEN
                NEW.called_at := NOW();
            WHEN 'in_consultation' THEN
                NEW.consultation_started_at := NOW();
                -- Calculate wait time
                IF NEW.waiting_started_at IS NOT NULL THEN
                    NEW.waiting_duration_ms := EXTRACT(EPOCH FROM (NOW() - NEW.waiting_started_at)) * 1000;
                END IF;
            WHEN 'completed' THEN
                NEW.consultation_ended_at := NOW();
                -- Calculate consultation time
                IF NEW.consultation_started_at IS NOT NULL THEN
                    NEW.consultation_duration_ms := EXTRACT(EPOCH FROM (NOW() - NEW.consultation_started_at)) * 1000;
                END IF;
            ELSE
                NULL;
        END CASE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_visit_status
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_visit_status_change();
```

### 5.2 Trigger: Auto-generate Appointment Number

```sql
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR(10);
BEGIN
    -- Get clinic prefix
    SELECT COALESCE(appointment_number_prefix, 'APT') INTO v_prefix
    FROM clinic_settings
    WHERE clinic_id = NEW.clinic_id;

    -- Get next number
    SELECT COALESCE(MAX(
        CAST(NULLIF(regexp_replace(appointment_number, '[^0-9]', '', 'g'), '') AS INTEGER)
    ), 0) + 1
    INTO v_next_number
    FROM appointments
    WHERE clinic_id = NEW.clinic_id;

    NEW.appointment_number := v_prefix || '-' || LPAD(v_next_number::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appointment_number
    BEFORE INSERT ON appointments
    FOR EACH ROW
    WHEN (NEW.appointment_number IS NULL)
    EXECUTE FUNCTION generate_appointment_number();
```

### 5.3 Trigger: Check Schedule Conflicts

```sql
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- Check conflicts with other appointments for same professional and box
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments a
    WHERE a.clinic_id = NEW.clinic_id
    AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND a.appointment_date = NEW.appointment_date
    AND a.is_cancelled = FALSE
    AND (
        -- Same professional
        (a.professional_id = NEW.professional_id AND NEW.professional_id IS NOT NULL)
        OR
        -- Same box
        (a.box = NEW.box AND NEW.box IS NOT NULL)
    )
    AND (
        -- Time overlap
        (NEW.start_time, NEW.end_time) OVERLAPS (a.start_time, a.end_time)
    );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Schedule conflict detected: an appointment already exists at this time for the selected professional or box.';
    END IF;

    -- Check conflicts with blocks
    SELECT COUNT(*) INTO v_conflict_count
    FROM agenda_blocks b
    WHERE b.clinic_id = NEW.clinic_id
    AND b.block_date = NEW.appointment_date
    AND b.is_active = TRUE
    AND (b.box IS NULL OR b.box = NEW.box)
    AND (NEW.start_time, NEW.end_time) OVERLAPS (b.start_time, b.end_time);

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Conflict with schedule block: the selected time slot is blocked.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_conflicts
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
    WHEN (NEW.is_cancelled = FALSE)
    EXECUTE FUNCTION check_appointment_conflicts();
```

### 5.4 Function: Expand Block Recurrence

```sql
CREATE OR REPLACE FUNCTION expand_recurring_blocks(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS SETOF agenda_blocks AS $$
DECLARE
    v_block agenda_blocks%ROWTYPE;
    v_current_date DATE;
    v_pattern JSONB;
    v_day_of_week INTEGER;
BEGIN
    -- Get active recurring blocks
    FOR v_block IN
        SELECT * FROM agenda_blocks
        WHERE clinic_id = p_clinic_id
        AND is_recurring = TRUE
        AND is_active = TRUE
        AND parent_block_id IS NULL
    LOOP
        v_pattern := v_block.recurrence_pattern;

        -- Iterate through each day in the range
        v_current_date := p_start_date;
        WHILE v_current_date <= p_end_date LOOP
            v_day_of_week := EXTRACT(DOW FROM v_current_date)::INTEGER;

            -- Check if applies for this day according to pattern
            IF v_pattern->>'type' = 'weekly' AND
               v_day_of_week = ANY(ARRAY(SELECT jsonb_array_elements_text(v_pattern->'daysOfWeek')::INTEGER)) THEN

                -- Verify doesn't exceed recurrence end date
                IF v_pattern->>'endDate' IS NULL OR v_current_date <= (v_pattern->>'endDate')::DATE THEN
                    -- Create virtual block instance
                    v_block.id := gen_random_uuid();
                    v_block.block_date := v_current_date;
                    v_block.parent_block_id := v_block.id;

                    RETURN NEXT v_block;
                END IF;
            END IF;

            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Query Functions

### 6.1 Get Daily Appointments with Full Data

```sql
CREATE OR REPLACE FUNCTION get_appointments_for_day(
    p_clinic_id UUID,
    p_date DATE,
    p_professional_id UUID DEFAULT NULL,
    p_box VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    appointment_date DATE,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    patient_id UUID,
    patient_name VARCHAR,
    patient_phone VARCHAR,
    patient_age INTEGER,
    patient_has_alerts BOOLEAN,
    patient_critical_allergies TEXT[],
    professional_id UUID,
    professional_name VARCHAR,
    box VARCHAR,
    reason TEXT,
    confirmation_status VARCHAR,
    visit_status VARCHAR,
    is_confirmed BOOLEAN,
    waiting_duration_ms INTEGER,
    consultation_duration_ms INTEGER,
    has_pending_charge BOOLEAN,
    charge_amount DECIMAL,
    tags JSONB,
    bg_color VARCHAR,
    notes TEXT,
    linked_treatments_count INTEGER,
    payment_info JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.duration_minutes,
        a.patient_id,
        a.patient_name,
        a.patient_phone,
        a.patient_age,
        EXISTS (
            SELECT 1 FROM patient_alerts pa
            WHERE pa.patient_id = a.patient_id
            AND pa.is_active AND pa.priority IN ('high', 'critical')
        ) as patient_has_alerts,
        ARRAY(
            SELECT allergen_name FROM patient_allergies
            WHERE patient_id = a.patient_id
            AND severity IN ('severe', 'extreme')
            AND is_active
        ) as patient_critical_allergies,
        a.professional_id,
        a.professional_name,
        a.box,
        a.reason,
        a.confirmation_status,
        a.visit_status,
        a.is_confirmed,
        a.waiting_duration_ms,
        a.consultation_duration_ms,
        a.has_pending_charge,
        a.charge_amount,
        a.tags,
        a.bg_color,
        a.notes,
        (SELECT COUNT(*)::INTEGER FROM appointment_linked_treatments lt WHERE lt.appointment_id = a.id) as linked_treatments_count,
        CASE WHEN a.has_pending_charge THEN
            jsonb_build_object(
                'totalAmount', COALESCE(a.charge_amount, 0),
                'paidAmount', 0, -- TODO: Calculate from payments
                'pendingAmount', COALESCE(a.charge_amount, 0),
                'currency', '€'
            )
        ELSE NULL END as payment_info
    FROM appointments a
    WHERE a.clinic_id = p_clinic_id
    AND a.appointment_date = p_date
    AND a.is_cancelled = FALSE
    AND (p_professional_id IS NULL OR a.professional_id = p_professional_id)
    AND (p_box IS NULL OR a.box = p_box)
    ORDER BY a.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.2 Get Weekly Appointments

```sql
CREATE OR REPLACE FUNCTION get_appointments_for_week(
    p_clinic_id UUID,
    p_week_start DATE,
    p_professional_ids UUID[] DEFAULT NULL,
    p_box_filter VARCHAR[] DEFAULT NULL
)
RETURNS TABLE (
    -- Same columns as get_appointments_for_day
    appointment_json JSONB
) AS $$
DECLARE
    v_week_end DATE := p_week_start + INTERVAL '6 days';
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', a.id,
        'date', a.appointment_date,
        'startTime', a.start_time,
        'endTime', a.end_time,
        'patientName', a.patient_name,
        'patientPhone', a.patient_phone,
        'patientAge', a.patient_age,
        'professionalId', a.professional_id,
        'professionalName', a.professional_name,
        'box', a.box,
        'reason', a.reason,
        'visitStatus', a.visit_status,
        'isConfirmed', a.is_confirmed,
        'bgColor', a.bg_color,
        'tags', a.tags
    ) as appointment_json
    FROM appointments a
    WHERE a.clinic_id = p_clinic_id
    AND a.appointment_date BETWEEN p_week_start AND v_week_end
    AND a.is_cancelled = FALSE
    AND (p_professional_ids IS NULL OR a.professional_id = ANY(p_professional_ids))
    AND (p_box_filter IS NULL OR a.box = ANY(p_box_filter))
    ORDER BY a.appointment_date, a.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.3 Get Visit Status Counts

```sql
CREATE OR REPLACE FUNCTION get_visit_status_counts(
    p_clinic_id UUID,
    p_date DATE
)
RETURNS TABLE (
    status VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.visit_status::VARCHAR,
        COUNT(*)
    FROM appointments a
    WHERE a.clinic_id = p_clinic_id
    AND a.appointment_date = p_date
    AND a.is_cancelled = FALSE
    GROUP BY a.visit_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.4 Get Day/Week KPIs

```sql
CREATE OR REPLACE FUNCTION get_agenda_kpis(
    p_clinic_id UUID,
    p_date DATE
)
RETURNS TABLE (
    total_appointments_today INTEGER,
    total_appointments_week INTEGER,
    confirmed_today INTEGER,
    received_today INTEGER,
    in_waiting_room INTEGER,
    in_consultation INTEGER,
    completed_today INTEGER,
    no_shows_today INTEGER,
    avg_waiting_time_ms INTEGER,
    avg_consultation_time_ms INTEGER
) AS $$
DECLARE
    v_week_start DATE := p_date - EXTRACT(DOW FROM p_date)::INTEGER + 1;
    v_week_end DATE := v_week_start + 6;
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE appointment_date = p_date)::INTEGER as total_appointments_today,
        COUNT(*) FILTER (WHERE appointment_date BETWEEN v_week_start AND v_week_end)::INTEGER as total_appointments_week,
        COUNT(*) FILTER (WHERE appointment_date = p_date AND is_confirmed)::INTEGER as confirmed_today,
        COUNT(*) FILTER (WHERE appointment_date = p_date AND visit_status != 'scheduled')::INTEGER as received_today,
        COUNT(*) FILTER (WHERE appointment_date = p_date AND visit_status = 'waiting_room')::INTEGER as in_waiting_room,
        COUNT(*) FILTER (WHERE appointment_date = p_date AND visit_status = 'in_consultation')::INTEGER as in_consultation,
        COUNT(*) FILTER (WHERE appointment_date = p_date AND visit_status = 'completed')::INTEGER as completed_today,
        COUNT(*) FILTER (WHERE appointment_date = p_date AND visit_status = 'no_show')::INTEGER as no_shows_today,
        AVG(waiting_duration_ms) FILTER (WHERE appointment_date = p_date AND waiting_duration_ms IS NOT NULL)::INTEGER as avg_waiting_time_ms,
        AVG(consultation_duration_ms) FILTER (WHERE appointment_date = p_date AND consultation_duration_ms IS NOT NULL)::INTEGER as avg_consultation_time_ms
    FROM appointments
    WHERE clinic_id = p_clinic_id
    AND is_cancelled = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.5 Create Appointment with Validations

```sql
CREATE OR REPLACE FUNCTION create_appointment(
    p_clinic_id UUID,
    p_patient_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_professional_id UUID,
    p_box VARCHAR,
    p_reason TEXT,
    p_service_code VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_linked_treatment_ids UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_appointment_id UUID;
    v_patient_name VARCHAR;
    v_patient_phone VARCHAR;
    v_patient_age INTEGER;
    v_professional_name VARCHAR;
    v_treatment_id UUID;
BEGIN
    -- Get patient data
    SELECT full_name, phone,
           EXTRACT(YEAR FROM age(birth_date))::INTEGER
    INTO v_patient_name, v_patient_phone, v_patient_age
    FROM patients
    WHERE id = p_patient_id;

    IF v_patient_name IS NULL THEN
        RAISE EXCEPTION 'Patient not found';
    END IF;

    -- Get professional name
    SELECT full_name INTO v_professional_name
    FROM staff
    WHERE id = p_professional_id;

    -- Insert appointment
    INSERT INTO appointments (
        clinic_id,
        patient_id,
        patient_name,
        patient_phone,
        patient_age,
        appointment_date,
        start_time,
        end_time,
        professional_id,
        professional_name,
        box,
        reason,
        service_code,
        notes,
        created_by
    ) VALUES (
        p_clinic_id,
        p_patient_id,
        v_patient_name,
        v_patient_phone,
        v_patient_age,
        p_appointment_date,
        p_start_time,
        p_end_time,
        p_professional_id,
        v_professional_name,
        p_box,
        p_reason,
        p_service_code,
        p_notes,
        auth.uid()
    )
    RETURNING id INTO v_appointment_id;

    -- Link treatments if provided
    IF p_linked_treatment_ids IS NOT NULL THEN
        FOREACH v_treatment_id IN ARRAY p_linked_treatment_ids
        LOOP
            INSERT INTO appointment_linked_treatments (
                clinic_id,
                appointment_id,
                patient_treatment_id,
                treatment_code,
                treatment_name,
                amount,
                tooth_number
            )
            SELECT
                p_clinic_id,
                v_appointment_id,
                pt.id,
                pt.treatment_code,
                pt.treatment_name,
                pt.final_amount,
                pt.tooth_number
            FROM patient_treatments pt
            WHERE pt.id = v_treatment_id;
        END LOOP;
    END IF;

    RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.6 Update Visit Status

```sql
CREATE OR REPLACE FUNCTION update_visit_status(
    p_appointment_id UUID,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE appointments
    SET
        visit_status = p_new_status,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = p_appointment_id;

    -- If notes provided, add them to history
    IF p_notes IS NOT NULL THEN
        UPDATE visit_status_history
        SET notes = p_notes
        WHERE appointment_id = p_appointment_id
        AND new_status = p_new_status
        ORDER BY changed_at DESC
        LIMIT 1;
    END IF;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.7 Bulk Status Update

```sql
CREATE OR REPLACE FUNCTION bulk_update_visit_status(
    p_appointment_ids UUID[],
    p_new_status VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE appointments
    SET
        visit_status = p_new_status,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE id = ANY(p_appointment_ids)
    AND is_cancelled = FALSE;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. Daily Report Generation (Export)

### 7.1 Function: Get Export Data

```sql
CREATE OR REPLACE FUNCTION get_daily_report_data(
    p_clinic_id UUID,
    p_professional_ids UUID[],
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    professional_id UUID,
    professional_name VARCHAR,
    appointment_date DATE,
    appointments JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as professional_id,
        s.full_name as professional_name,
        a.appointment_date,
        jsonb_agg(
            jsonb_build_object(
                'startTime', a.start_time,
                'endTime', a.end_time,
                'patientName', a.patient_name,
                'patientPhone', a.patient_phone,
                'patientAge', a.patient_age,
                'reason', a.reason,
                'box', a.box,
                'notes', a.notes,
                'visitStatus', a.visit_status,
                'isConfirmed', a.is_confirmed
            ) ORDER BY a.start_time
        ) as appointments
    FROM staff s
    CROSS JOIN generate_series(p_start_date, p_end_date, '1 day'::INTERVAL) AS d(date)
    LEFT JOIN appointments a ON
        a.professional_id = s.id
        AND a.appointment_date = d.date::DATE
        AND a.is_cancelled = FALSE
        AND a.clinic_id = p_clinic_id
    WHERE s.clinic_id = p_clinic_id
    AND s.is_active = TRUE
    AND (p_professional_ids IS NULL OR s.id = ANY(p_professional_ids))
    GROUP BY s.id, s.full_name, a.appointment_date
    ORDER BY s.full_name, a.appointment_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.2 Function: Get Daily Production

```sql
CREATE OR REPLACE FUNCTION get_daily_production(
    p_clinic_id UUID,
    p_date DATE,
    p_professional_id UUID DEFAULT NULL
)
RETURNS TABLE (
    professional_name VARCHAR,
    treatments_completed INTEGER,
    total_production DECIMAL,
    treatments JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.full_name as professional_name,
        COUNT(*)::INTEGER as treatments_completed,
        SUM(lt.amount)::DECIMAL as total_production,
        jsonb_agg(
            jsonb_build_object(
                'treatmentName', lt.treatment_name,
                'patientName', a.patient_name,
                'amount', lt.amount,
                'completedAt', lt.completed_at
            )
        ) as treatments
    FROM appointment_linked_treatments lt
    JOIN appointments a ON a.id = lt.appointment_id
    JOIN staff s ON s.id = lt.completed_by
    WHERE a.clinic_id = p_clinic_id
    AND DATE(lt.completed_at) = p_date
    AND lt.status = 'completed'
    AND (p_professional_id IS NULL OR lt.completed_by = p_professional_id)
    GROUP BY s.id, s.full_name
    ORDER BY total_production DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 8. Row Level Security (RLS)

### 8.1 Policies for Appointments

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Read policy: only appointments from user's clinic
CREATE POLICY "Users can view appointments from their clinic"
ON appointments FOR SELECT
USING (clinic_id = get_user_clinic_id());

-- Insert policy
CREATE POLICY "Users can create appointments in their clinic"
ON appointments FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());

-- Update policy
CREATE POLICY "Users can update appointments in their clinic"
ON appointments FOR UPDATE
USING (clinic_id = get_user_clinic_id());

-- Professionals can only view/edit their own appointments (optional, if you want to restrict)
-- CREATE POLICY "Professionals can only see their appointments"
-- ON appointments FOR SELECT
-- USING (
--     clinic_id = get_user_clinic_id()
--     AND (has_role('Administrator') OR has_role('Reception') OR professional_id = get_user_staff_id())
-- );
```

### 8.2 Policies for Agenda Blocks

```sql
ALTER TABLE agenda_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blocks from their clinic"
ON agenda_blocks FOR SELECT
USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can manage blocks in their clinic"
ON agenda_blocks FOR ALL
USING (clinic_id = get_user_clinic_id());
```

---

## 9. Connections with Other Modules

### 9.1 Connection Map

```
                                    ┌─────────────────┐
                                    │  CONFIGURATION  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
          ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
          │      STAFF      │     │      BOXES      │     │   TREATMENT     │
          │ (Professionals) │     │  (Operatories)  │     │    CATALOG      │
          └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
                   │                       │                       │
                   └───────────────────────┼───────────────────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │                       │
                               │   SCHEDULE MODULE     │
                               │  ┌─────────────────┐  │
                               │  │  appointments   │  │
                               │  │  agenda_blocks  │  │
                               │  │  visit_status   │  │
                               │  └────────┬────────┘  │
                               │           │           │
                               └───────────┼───────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          │                                │                                │
          ▼                                ▼                                ▼
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ PATIENT RECORD  │             │      CASH       │             │  DAILY REPORT   │
│                 │             │                 │             │                 │
│ - View record   │             │ - Daily         │             │ - Production    │
│ - History       │             │   payments      │             │ - KPIs          │
│ - Treatments    │             │ - Appointment   │             │ - PDF           │
│ - SOAP Notes    │             │   payments      │             │   Export        │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

### 9.2 Connection Details

#### 9.2.1 SCHEDULE → PATIENT RECORD

| Action in Schedule        | Result in Record                    |
| ------------------------- | ----------------------------------- |
| Click on appointment card | Opens record in Summary             |
| "View record" from menu   | Opens patient record                |
| Status "In consultation"  | Opens Clinical History in edit mode |
| Complete appointment      | Creates record in visit_records     |

**Connection query:**

```sql
-- From Schedule, get data to open record
SELECT
    a.patient_id,
    a.id as appointment_id,
    p.full_name,
    p.phone,
    ARRAY(SELECT allergen_name FROM patient_allergies WHERE patient_id = p.id AND severity IN ('severe','extreme')) as critical_allergies,
    EXISTS(SELECT 1 FROM patient_alerts WHERE patient_id = p.id AND is_active AND priority = 'critical') as has_critical_alerts
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.id = :appointment_id;
```

#### 9.2.2 SCHEDULE → CASH

| Action in Schedule               | Result in Cash           |
| -------------------------------- | ------------------------ |
| Collect from appointment         | Registers payment        |
| Complete appointment with charge | Appears in daily closing |

**Connection query:**

```sql
-- Daily payments from appointments
SELECT
    pay.*,
    a.patient_name,
    a.reason as treatment
FROM payments pay
JOIN appointments a ON a.id = pay.appointment_id
WHERE pay.clinic_id = :clinic_id
AND pay.payment_date = CURRENT_DATE;
```

#### 9.2.3 SCHEDULE → DAILY REPORT

| Schedule Data             | Use in Daily Report |
| ------------------------- | ------------------- |
| Daily appointments        | Main table          |
| Visit statuses            | Status column       |
| Times (wait/consultation) | Time column         |
| Completed treatments      | Production          |

**Connection query:**

```sql
-- Data for daily report table
SELECT
    a.id,
    a.start_time as hour,
    a.is_confirmed as confirmed,
    a.box,
    a.visit_status,
    a.waiting_duration_ms,
    a.consultation_duration_ms,
    a.patient_name as name,
    a.patient_age as age,
    a.reason,
    a.professional_name as professional,
    a.patient_phone as phone,
    CASE WHEN a.has_pending_charge THEN 'Yes' ELSE 'No' END as charge,
    a.tags
FROM appointments a
WHERE a.clinic_id = :clinic_id
AND a.appointment_date = :date
AND a.is_cancelled = FALSE
ORDER BY a.start_time;
```

#### 9.2.4 CONFIGURATION → SCHEDULE

| Configuration       | Use in Schedule                              |
| ------------------- | -------------------------------------------- |
| staff               | Professional list for filters and assignment |
| boxes               | Operatory list for filters and assignment    |
| treatment_catalog   | Available services for appointment creation  |
| working_hours       | Available hours in calendar                  |
| visit_status_config | Colors and alert thresholds                  |

---

### 9.3 Permission Matrix by Role

| Feature                  | Reception | Hygienist | Doctor | Administrator |
| ------------------------ | --------- | --------- | ------ | ------------- |
| View calendar            | ✅        | ✅        | ✅     | ✅            |
| Create appointment       | ✅        | ✅        | ✅     | ✅            |
| Edit appointment         | ✅        | ✅        | ✅     | ✅            |
| Cancel appointment       | ✅        | ❌        | ✅     | ✅            |
| Change visit status      | ✅        | ✅        | ✅     | ✅            |
| View daily report        | ✅        | ✅        | ✅     | ✅            |
| Export report            | ✅        | ✅        | ✅     | ✅            |
| Create block             | ✅        | ❌        | ✅     | ✅            |
| Collect from appointment | ✅        | ❌        | ✅     | ✅            |
| View wait times          | ✅        | ✅        | ✅     | ✅            |
| Configure statuses       | ❌        | ❌        | ❌     | ✅            |

---

## 10. System Events

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCHEDULE EVENTS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

SCHEDULE emits:
├── appointment.created ──────────────► Patient Record (update next appointment)
│                                      └► Notifications (send confirmation)
│
├── appointment.updated ──────────────► Patient Record (update data)
│
├── appointment.cancelled ────────────► Patient Record (free slot)
│                                      └► Notifications (send cancellation)
│
├── visit_status.changed ─────────────► Daily Report (update table)
│   ├── scheduled → waiting_room       └► Record (if in_consultation, open)
│   ├── waiting_room → call_patient
│   ├── call_patient → in_consultation
│   └── in_consultation → completed ──► Cash (register charge if applicable)
│                                      └► Daily Report (update production)
│
├── appointment.confirmed ────────────► Daily Report (update counter)
│
├── treatment.completed ──────────────► Record (update treatments)
│                                      └► Daily Report (daily production)
│
└── block.created ────────────────────► Calendar (show block)

PATIENT RECORD emits to SCHEDULE:
├── appointment.requested ────────────► Open create appointment modal with patient
└── treatment.scheduled ──────────────► Link treatment to existing appointment

CASH emits to SCHEDULE:
└── payment.registered ───────────────► Update appointment charge status
```

---

## 11. Indexes and Optimization

### 11.1 Critical Indexes

```sql
-- Indexes for frequent queries
CREATE INDEX CONCURRENTLY idx_appointments_daily_view ON appointments(
    clinic_id,
    appointment_date,
    start_time
) WHERE is_cancelled = FALSE;

CREATE INDEX CONCURRENTLY idx_appointments_weekly_view ON appointments(
    clinic_id,
    appointment_date,
    professional_id,
    box
) WHERE is_cancelled = FALSE;

CREATE INDEX CONCURRENTLY idx_appointments_patient_upcoming ON appointments(
    patient_id,
    appointment_date
) WHERE is_cancelled = FALSE AND appointment_date >= CURRENT_DATE;

-- Index for conflict checking
CREATE INDEX CONCURRENTLY idx_appointments_conflict_check ON appointments(
    clinic_id,
    appointment_date,
    professional_id,
    box,
    start_time,
    end_time
) WHERE is_cancelled = FALSE;

-- Index for statistics
CREATE INDEX CONCURRENTLY idx_appointments_status_stats ON appointments(
    clinic_id,
    appointment_date,
    visit_status
) WHERE is_cancelled = FALSE;
```

### 11.2 Partitioning (Optional for high volume)

```sql
-- Partition by date for high-volume clinics
CREATE TABLE appointments_partitioned (
    LIKE appointments INCLUDING ALL
) PARTITION BY RANGE (appointment_date);

-- Create yearly partitions
CREATE TABLE appointments_2026 PARTITION OF appointments_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE appointments_2027 PARTITION OF appointments_partitioned
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

---

## 12. Supabase Realtime (Optional)

### 12.1 Real-Time Update Configuration

```sql
-- Enable Realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Configure clinic_id filter for efficiency
-- (Configured in client with Supabase JS)
```

**Frontend usage:**

```typescript
// Subscribe to daily appointment changes
const subscription = supabase
  .channel('appointments-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `clinic_id=eq.${clinicId}&appointment_date=eq.${today}`
    },
    (payload) => {
      // Update UI
      handleAppointmentChange(payload)
    }
  )
  .subscribe()
```

---

## 13. Suggested Implementation Plan

### Phase 1: Foundations (Week 1-2)

- [ ] Create tables: `staff`, `boxes`, `appointments`
- [ ] Configure multi-tenant RLS
- [ ] Implement appointment number trigger
- [ ] Basic appointment CRUD

### Phase 2: Visit Statuses (Week 3-4)

- [ ] Create `visit_status_history` table
- [ ] Implement status change trigger
- [ ] Calculate wait/consultation times
- [ ] Bulk change function

### Phase 3: Blocks (Week 5)

- [ ] Create `agenda_blocks` table
- [ ] Implement recurrence
- [ ] Conflict validation

### Phase 4: Integrations (Week 6-7)

- [ ] Connect with patient record
- [ ] Link treatments to appointments
- [ ] Connect with cash (payments)

### Phase 5: Daily Report (Week 8)

- [ ] Export functions
- [ ] Day/week KPIs
- [ ] PDF generation

### Phase 6: Optimization (Week 9)

- [ ] Additional indexes
- [ ] Configure Realtime (optional)
- [ ] Performance testing

---

## 14. References

### 14.1 Related Frontend Files

```
src/
├── app/
│   ├── agenda/page.tsx                    # Main calendar page
│   └── parte-diario/page.tsx              # Daily report page
│
├── components/agenda/
│   ├── WeekScheduler.tsx                  # Weekly calendar view
│   ├── DayCalendar.tsx                    # Daily view
│   ├── MonthCalendar.tsx                  # Monthly view
│   ├── AppointmentSummaryCard.tsx         # Appointment card
│   ├── AgendaBlockCard.tsx                # Block card
│   ├── VisitStatusMenu.tsx                # Status change menu
│   ├── VisitStatusCounters.tsx            # Status counters
│   ├── WaitTimeDisplay.tsx                # Time display
│   ├── modals/
│   │   ├── CreateAppointmentModal.tsx     # Create appointment modal
│   │   ├── AppointmentDetailOverlay.tsx   # Detail overlay
│   │   └── ParteDiarioModal.tsx           # Export report modal
│   └── types.ts                           # Schedule types
│
└── context/
    └── AppointmentsContext.tsx            # Appointments context (mock data)
```

### 14.2 TypeScript Reference Types

```typescript
// Visit statuses
type VisitStatus =
  | 'scheduled'
  | 'waiting_room'
  | 'call_patient'
  | 'in_consultation'
  | 'completed'
  | 'no_show'
  | 'cancelled'

// Visual status configuration
type VisitStatusConfig = {
  label: string
  color: string
  bgColor: string
  textColor: string
  icon: string
}

// Appointment data
type Appointment = {
  id: string
  date: string
  startTime: string
  endTime: string
  patientName: string
  patientPhone: string
  patientId?: string
  patientAge?: number
  professional: string
  reason: string
  status: 'Confirmed' | 'Unconfirmed' | 'Reschedule'
  box?: string
  visitStatus?: VisitStatus
  visitStatusHistory?: { status: VisitStatus; timestamp: Date }[]
  waitingDuration?: number
  consultationDuration?: number
  // ...other fields
}

// Schedule block
type AgendaBlock = {
  id: string
  date: string
  startTime: string
  endTime: string
  blockType: BlockType
  description: string
  responsibleId?: string
  recurrence?: RecurrencePattern
}
```

---

_Document generated on February 2, 2026_  
_Version 1.0 - Complete MVP_
