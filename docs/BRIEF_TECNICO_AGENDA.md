# Brief Técnico: Módulo de Agenda - klinikOS

**Fecha:** 2 de Febrero de 2026  
**Versión:** 1.0  
**Estado:** MVP (Primera versión completa)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Arquitectura:** Multi-tenant desde el inicio

---

## 1. Visión General

### 1.1 Descripción

El **Módulo de Agenda** es el centro de operaciones diario de la clínica. Gestiona todas las citas, el flujo de pacientes durante su visita, los bloqueos de agenda y la generación del parte diario para los profesionales.

### 1.2 Componentes del Módulo

| Componente         | Ruta            | Descripción                                     |
| ------------------ | --------------- | ----------------------------------------------- |
| **Calendario**     | `/agenda`       | Vista de citas (día/semana/mes) con drag & drop |
| **Parte Diario**   | `/parte-diario` | Tabla de citas del día con estados de visita    |
| **Exportar Parte** | Modal           | Generación de PDFs para profesionales           |

### 1.3 Funcionalidades Principales

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MÓDULO DE AGENDA                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📅 CALENDARIO                    📋 PARTE DIARIO                           │
│  ├─ Vista día                     ├─ Tabla de citas del día                 │
│  ├─ Vista semana                  ├─ Estados de visita                      │
│  ├─ Vista mes                     ├─ Tiempos de espera/consulta             │
│  ├─ Filtro por profesional        ├─ Filtros avanzados                      │
│  ├─ Filtro por box                ├─ Acciones rápidas                       │
│  ├─ Drag & drop                   ├─ Cobros rápidos                         │
│  └─ Bloqueos de agenda            └─ Cambio de estados masivo               │
│                                                                             │
│  ➕ CREAR CITA                    📤 EXPORTAR                               │
│  ├─ Selección de paciente         ├─ Por profesional                        │
│  ├─ Selección de tratamiento      ├─ Por rango de fechas                    │
│  ├─ Vincular tratamientos         ├─ Formato PDF                            │
│  └─ Recurrencia                   └─ Descarga individual/masiva             │
│                                                                             │
│  🔒 BLOQUEOS                      ⏱️ TIEMPOS                                │
│  ├─ Limpieza                      ├─ Tiempo de espera                       │
│  ├─ Reparación                    ├─ Tiempo de consulta                     │
│  ├─ Descanso                      ├─ Alertas por exceso                     │
│  ├─ Reunión                       └─ KPIs diarios                           │
│  └─ Recurrencia                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Estados de Visita del Paciente

El sistema implementa un flujo de estados para trackear al paciente dentro de la clínica:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PROGRAMADA  │────►│ SALA ESPERA  │────►│   LLAMAR     │────►│ EN CONSULTA  │────►│  REALIZADA   │
│  (scheduled) │     │(waiting_room)│     │(call_patient)│     │(in_consult.) │     │ (completed)  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
      ⬜                   🟡                   🔵                   🟢                   🟣
   Gris                Amarillo               Azul                Verde               Morado
```

**Características:**

- Cada cambio de estado registra timestamp
- Calcula tiempo de espera (waiting_room → in_consultation)
- Calcula tiempo de consulta (in_consultation → completed)
- Alertas visuales cuando excede umbrales

---

## 2. Arquitectura de Datos

### 2.1 Diagrama de Entidades de Agenda

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
│ (Profesionales) │     │    (Citas)      │     │   (Bloqueos)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          │                    │    │                    │
          │                    │    │                    │
          │         ┌──────────┘    └──────────┐        │
          │         │                          │        │
          │         ▼                          ▼        │
          │  ┌─────────────┐           ┌─────────────┐  │
          │  │  PATIENTS   │           │VISIT_STATUS_│  │
          │  │ (Pacientes) │           │   HISTORY   │  │
          │  └─────────────┘           └─────────────┘  │
          │         │                                   │
          │         │                                   │
          │         ▼                                   │
          │  ┌─────────────────────────────────────┐   │
          │  │         VISIT_RECORDS               │   │
          │  │   (Registros de visita clínica)     │   │
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
                    │ (Configuración) │
                    └─────────────────┘
```

### 2.2 Entidades Relacionadas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ENTIDADES QUE CONECTAN CON AGENDA                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DESDE CONFIGURACIÓN              HACIA FICHA PACIENTE                      │
│  ├─ staff (profesionales)         ├─ patients (datos del paciente)          │
│  ├─ boxes (gabinetes)             ├─ patient_alerts (alertas activas)       │
│  ├─ treatment_catalog             ├─ patient_allergies (alergias)           │
│  ├─ clinic_settings               ├─ patient_treatments (tratamientos)      │
│  └─ working_hours                 └─ budgets (presupuestos)                 │
│                                                                             │
│  HACIA CAJA                       HACIA PARTE DIARIO                        │
│  ├─ payments (cobros)             ├─ daily_production (producción)          │
│  └─ payment_records               └─ export_documents (PDFs)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Definición de Tablas

### 3.1 Tabla Principal: `appointments`

```sql
CREATE TABLE appointments (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_number VARCHAR(20), -- Número secuencial por clínica (APT-000001)

    -- Fecha y hora
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,

    -- Paciente
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    patient_name VARCHAR(255) NOT NULL, -- Desnormalizado para rendimiento
    patient_phone VARCHAR(20),
    patient_age INTEGER,

    -- Profesional y ubicación
    professional_id UUID REFERENCES staff(id),
    professional_name VARCHAR(150), -- Desnormalizado
    box VARCHAR(20), -- "box 1", "box 2", "box 3"

    -- Información de la cita
    reason TEXT NOT NULL, -- Motivo de consulta
    appointment_type VARCHAR(50), -- "Primera visita", "Revisión", "Tratamiento", "Urgencia"
    service_code VARCHAR(20), -- Código del servicio/tratamiento principal

    -- Estados
    confirmation_status VARCHAR(20) NOT NULL DEFAULT 'No confirmada'
        CHECK (confirmation_status IN ('Confirmada', 'No confirmada', 'Reagendar')),
    visit_status VARCHAR(30) NOT NULL DEFAULT 'scheduled'
        CHECK (visit_status IN ('scheduled', 'waiting_room', 'call_patient', 'in_consultation', 'completed', 'no_show', 'cancelled')),
    is_confirmed BOOLEAN DEFAULT FALSE, -- Paciente confirmó asistencia

    -- Timestamps del flujo de visita
    arrived_at TIMESTAMPTZ, -- Llegada a recepción
    waiting_started_at TIMESTAMPTZ, -- Entrada a sala de espera
    called_at TIMESTAMPTZ, -- Momento de llamar al paciente
    consultation_started_at TIMESTAMPTZ, -- Inicio de consulta
    consultation_ended_at TIMESTAMPTZ, -- Fin de consulta

    -- Duraciones calculadas (en milisegundos para precisión)
    waiting_duration_ms INTEGER, -- Tiempo en sala de espera
    consultation_duration_ms INTEGER, -- Tiempo de consulta

    -- Cobro
    has_pending_charge BOOLEAN DEFAULT FALSE,
    charge_amount DECIMAL(10,2),

    -- Tags para filtrado rápido
    tags JSONB DEFAULT '[]', -- ["deuda", "vip", "urgencia"]

    -- Visual
    bg_color VARCHAR(50) DEFAULT 'var(--color-event-teal)',

    -- Notas
    notes TEXT,
    internal_notes TEXT, -- Solo visible para staff

    -- Cancelación (soft delete)
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,

    -- Origen de la cita
    created_from VARCHAR(50), -- "calendar", "phone", "online", "walk_in"

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_appointment_number UNIQUE (clinic_id, appointment_number)
);

-- Índices críticos para rendimiento
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

### 3.2 Tabla: `visit_status_history`

```sql
CREATE TABLE visit_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Cambio de estado
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,

    -- Timestamp del cambio
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id),
    changed_by_name VARCHAR(150),

    -- Contexto adicional
    notes TEXT,

    -- Para cálculos de duración
    duration_since_previous_ms INTEGER -- Tiempo desde el estado anterior
);

CREATE INDEX idx_visit_status_history_appointment ON visit_status_history(appointment_id);
CREATE INDEX idx_visit_status_history_date ON visit_status_history(changed_at DESC);
```

### 3.3 Tabla: `agenda_blocks` (Bloqueos de Agenda)

```sql
CREATE TABLE agenda_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Fecha y hora
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    -- Tipo de bloqueo
    block_type VARCHAR(30) NOT NULL
        CHECK (block_type IN ('cleaning', 'repair', 'break', 'meeting', 'maintenance', 'vacation', 'other')),

    -- Descripción
    title VARCHAR(200),
    description TEXT,

    -- Asignación (opcional)
    responsible_id UUID REFERENCES staff(id),
    responsible_name VARCHAR(150),
    box VARCHAR(20), -- NULL = todos los boxes

    -- Recurrencia
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- {type: "weekly", daysOfWeek: [1,3,5], endDate: "2026-12-31"}
    parent_block_id UUID REFERENCES agenda_blocks(id), -- Para instancias de recurrencia

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,

    -- Auditoría
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

### 3.4 Tabla: `linked_treatments` (Tratamientos Vinculados a Cita)

```sql
CREATE TABLE appointment_linked_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

    -- Referencia al tratamiento del paciente
    patient_treatment_id UUID REFERENCES patient_treatments(id),

    -- Datos del tratamiento (para histórico)
    treatment_code VARCHAR(20),
    treatment_name VARCHAR(200) NOT NULL,
    amount DECIMAL(10,2),

    -- Detalle dental
    tooth_number VARCHAR(10),
    tooth_face VARCHAR(20),

    -- Estado en esta cita
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'rescheduled')),

    -- Realización
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    completed_by_name VARCHAR(150),

    -- Notas
    notes TEXT,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_linked_treatments_appointment ON appointment_linked_treatments(appointment_id);
CREATE INDEX idx_linked_treatments_patient ON appointment_linked_treatments(patient_treatment_id);
```

### 3.5 Tabla: `appointment_attachments` (Adjuntos de Visita)

```sql
CREATE TABLE appointment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- Información del archivo
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

    -- Auditoría
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_by_name VARCHAR(150)
);

CREATE INDEX idx_appointment_attachments ON appointment_attachments(appointment_id);
```

### 3.6 Tabla: `staff` (Profesionales)

```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id), -- Si tiene cuenta de usuario

    -- Información personal
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

    -- Rol y especialización
    role VARCHAR(50) NOT NULL, -- "Doctor", "Higienista", "Recepción", "Auxiliar"
    specialization VARCHAR(100), -- "Ortodoncia", "Endodoncia", "Periodoncia"
    license_number VARCHAR(50), -- Número de colegiado

    -- Contacto
    phone VARCHAR(20),
    email VARCHAR(255),

    -- Visual
    avatar_url TEXT,
    calendar_color VARCHAR(50), -- Color en el calendario

    -- Disponibilidad
    default_box VARCHAR(20), -- Box asignado por defecto
    working_hours JSONB, -- {monday: {start: "09:00", end: "14:00"}, ...}

    -- Estado
    is_active BOOLEAN DEFAULT TRUE,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_staff_clinic ON staff(clinic_id) WHERE is_active = TRUE;
CREATE INDEX idx_staff_role ON staff(clinic_id, role) WHERE is_active = TRUE;
```

### 3.7 Tabla: `boxes` (Gabinetes/Consultorios)

```sql
CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Identificación
    box_number INTEGER NOT NULL,
    box_name VARCHAR(50) NOT NULL, -- "Box 1", "Consulta Principal"

    -- Configuración
    is_active BOOLEAN DEFAULT TRUE,
    calendar_color VARCHAR(50),
    default_professional_id UUID REFERENCES staff(id),

    -- Capacidades
    has_xray BOOLEAN DEFAULT FALSE,
    has_scanner BOOLEAN DEFAULT FALSE,
    specialization VARCHAR(100), -- "Cirugía", "Ortodoncia"

    -- Orden de visualización
    display_order INTEGER DEFAULT 0,

    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_box_per_clinic UNIQUE (clinic_id, box_number)
);

CREATE INDEX idx_boxes_clinic ON boxes(clinic_id, display_order) WHERE is_active = TRUE;
```

---

## 4. Configuración de Estados de Visita

### 4.1 Tipo y Configuración Visual

```sql
-- Enum type para estados (o check constraint si prefieres)
CREATE TYPE visit_status_enum AS ENUM (
    'scheduled',      -- Programada
    'waiting_room',   -- En sala de espera
    'call_patient',   -- Llamar paciente
    'in_consultation',-- En consulta
    'completed',      -- Realizada
    'no_show',        -- No asistió
    'cancelled'       -- Cancelada
);

-- Tabla de configuración de estados (para personalización por clínica)
CREATE TABLE visit_status_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    status VARCHAR(30) NOT NULL,
    label VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL, -- Color del indicador
    bg_color VARCHAR(20) NOT NULL, -- Color de fondo del badge
    text_color VARCHAR(20) NOT NULL, -- Color del texto
    icon VARCHAR(50), -- Nombre del icono MD3

    -- Orden de visualización
    display_order INTEGER DEFAULT 0,

    -- Alertas
    warning_threshold_minutes INTEGER, -- Tiempo para alerta amarilla
    critical_threshold_minutes INTEGER, -- Tiempo para alerta roja

    CONSTRAINT unique_status_per_clinic UNIQUE (clinic_id, status)
);

-- Insertar configuración por defecto
INSERT INTO visit_status_config (clinic_id, status, label, color, bg_color, text_color, icon, display_order, warning_threshold_minutes, critical_threshold_minutes)
VALUES
    (:clinic_id, 'scheduled', 'Programada', '#9CA3AF', '#F3F4F6', '#6B7280', 'CalendarMonthRounded', 1, NULL, NULL),
    (:clinic_id, 'waiting_room', 'En sala espera', '#F59E0B', '#FEF3C7', '#B45309', 'PeopleRounded', 2, 15, 30),
    (:clinic_id, 'call_patient', 'Llamar', '#3B82F6', '#DBEAFE', '#1D4ED8', 'CallRounded', 3, NULL, NULL),
    (:clinic_id, 'in_consultation', 'En consulta', '#10B981', '#D1FAE5', '#047857', 'MonitorHeartRounded', 4, 45, 90),
    (:clinic_id, 'completed', 'Realizada', '#8B5CF6', '#EDE9FE', '#6D28D9', 'CheckCircleRounded', 5, NULL, NULL),
    (:clinic_id, 'no_show', 'No asistió', '#EF4444', '#FEE2E2', '#B91C1C', 'PersonOffRounded', 6, NULL, NULL),
    (:clinic_id, 'cancelled', 'Cancelada', '#6B7280', '#F3F4F6', '#4B5563', 'CancelRounded', 7, NULL, NULL);
```

---

## 5. Triggers y Funciones

### 5.1 Trigger: Registrar Historial de Cambios de Estado

```sql
CREATE OR REPLACE FUNCTION log_visit_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_previous_entry visit_status_history%ROWTYPE;
    v_duration_ms INTEGER;
BEGIN
    -- Solo procesar si el estado cambió
    IF OLD.visit_status IS DISTINCT FROM NEW.visit_status THEN

        -- Obtener la entrada anterior para calcular duración
        SELECT * INTO v_previous_entry
        FROM visit_status_history
        WHERE appointment_id = NEW.id
        ORDER BY changed_at DESC
        LIMIT 1;

        -- Calcular duración desde el estado anterior
        IF v_previous_entry.id IS NOT NULL THEN
            v_duration_ms := EXTRACT(EPOCH FROM (NOW() - v_previous_entry.changed_at)) * 1000;
        END IF;

        -- Insertar nuevo registro de historial
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

        -- Actualizar timestamps específicos según el nuevo estado
        CASE NEW.visit_status
            WHEN 'waiting_room' THEN
                NEW.waiting_started_at := NOW();
                NEW.arrived_at := COALESCE(NEW.arrived_at, NOW());
            WHEN 'call_patient' THEN
                NEW.called_at := NOW();
            WHEN 'in_consultation' THEN
                NEW.consultation_started_at := NOW();
                -- Calcular tiempo de espera
                IF NEW.waiting_started_at IS NOT NULL THEN
                    NEW.waiting_duration_ms := EXTRACT(EPOCH FROM (NOW() - NEW.waiting_started_at)) * 1000;
                END IF;
            WHEN 'completed' THEN
                NEW.consultation_ended_at := NOW();
                -- Calcular tiempo de consulta
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

### 5.2 Trigger: Auto-generar Número de Cita

```sql
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR(10);
BEGIN
    -- Obtener prefijo de la clínica
    SELECT COALESCE(appointment_number_prefix, 'APT') INTO v_prefix
    FROM clinic_settings
    WHERE clinic_id = NEW.clinic_id;

    -- Obtener siguiente número
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

### 5.3 Trigger: Verificar Conflictos de Horario

```sql
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INTEGER;
BEGIN
    -- Verificar conflictos con otras citas del mismo profesional y box
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments a
    WHERE a.clinic_id = NEW.clinic_id
    AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND a.appointment_date = NEW.appointment_date
    AND a.is_cancelled = FALSE
    AND (
        -- Mismo profesional
        (a.professional_id = NEW.professional_id AND NEW.professional_id IS NOT NULL)
        OR
        -- Mismo box
        (a.box = NEW.box AND NEW.box IS NOT NULL)
    )
    AND (
        -- Overlap de horario
        (NEW.start_time, NEW.end_time) OVERLAPS (a.start_time, a.end_time)
    );

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Conflicto de horario detectado: ya existe una cita en este horario para el profesional o box seleccionado.';
    END IF;

    -- Verificar conflictos con bloqueos
    SELECT COUNT(*) INTO v_conflict_count
    FROM agenda_blocks b
    WHERE b.clinic_id = NEW.clinic_id
    AND b.block_date = NEW.appointment_date
    AND b.is_active = TRUE
    AND (b.box IS NULL OR b.box = NEW.box)
    AND (NEW.start_time, NEW.end_time) OVERLAPS (b.start_time, b.end_time);

    IF v_conflict_count > 0 THEN
        RAISE EXCEPTION 'Conflicto con bloqueo de agenda: el horario seleccionado está bloqueado.';
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

### 5.4 Función: Expandir Recurrencia de Bloqueos

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
    -- Obtener bloqueos recurrentes activos
    FOR v_block IN
        SELECT * FROM agenda_blocks
        WHERE clinic_id = p_clinic_id
        AND is_recurring = TRUE
        AND is_active = TRUE
        AND parent_block_id IS NULL
    LOOP
        v_pattern := v_block.recurrence_pattern;

        -- Iterar por cada día en el rango
        v_current_date := p_start_date;
        WHILE v_current_date <= p_end_date LOOP
            v_day_of_week := EXTRACT(DOW FROM v_current_date)::INTEGER;

            -- Verificar si aplica para este día según el patrón
            IF v_pattern->>'type' = 'weekly' AND
               v_day_of_week = ANY(ARRAY(SELECT jsonb_array_elements_text(v_pattern->'daysOfWeek')::INTEGER)) THEN

                -- Verificar que no exceda la fecha fin de recurrencia
                IF v_pattern->>'endDate' IS NULL OR v_current_date <= (v_pattern->>'endDate')::DATE THEN
                    -- Crear instancia virtual del bloqueo
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

## 6. Funciones de Consulta

### 6.1 Obtener Citas del Día con Datos Completos

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
            AND severity IN ('grave', 'extrema')
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
                'paidAmount', 0, -- TODO: Calcular desde payments
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

### 6.2 Obtener Citas de la Semana

```sql
CREATE OR REPLACE FUNCTION get_appointments_for_week(
    p_clinic_id UUID,
    p_week_start DATE,
    p_professional_ids UUID[] DEFAULT NULL,
    p_box_filter VARCHAR[] DEFAULT NULL
)
RETURNS TABLE (
    -- Mismas columnas que get_appointments_for_day
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

### 6.3 Obtener Conteo de Estados de Visita

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

### 6.4 Obtener KPIs del Día/Semana

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

### 6.5 Crear Cita con Validaciones

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
    -- Obtener datos del paciente
    SELECT full_name, phone,
           EXTRACT(YEAR FROM age(birth_date))::INTEGER
    INTO v_patient_name, v_patient_phone, v_patient_age
    FROM patients
    WHERE id = p_patient_id;

    IF v_patient_name IS NULL THEN
        RAISE EXCEPTION 'Paciente no encontrado';
    END IF;

    -- Obtener nombre del profesional
    SELECT full_name INTO v_professional_name
    FROM staff
    WHERE id = p_professional_id;

    -- Insertar cita
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

    -- Vincular tratamientos si se proporcionaron
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

### 6.6 Cambiar Estado de Visita

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

    -- Si hay notas, añadirlas al historial
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

### 6.7 Cambio Masivo de Estados

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

## 7. Generación del Parte Diario (Exportación)

### 7.1 Función: Obtener Datos para Exportación

```sql
CREATE OR REPLACE FUNCTION get_parte_diario_data(
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

### 7.2 Función: Obtener Producción del Día

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

### 8.1 Políticas para Appointments

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política de lectura: solo citas de la clínica del usuario
CREATE POLICY "Users can view appointments from their clinic"
ON appointments FOR SELECT
USING (clinic_id = get_user_clinic_id());

-- Política de inserción
CREATE POLICY "Users can create appointments in their clinic"
ON appointments FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());

-- Política de actualización
CREATE POLICY "Users can update appointments in their clinic"
ON appointments FOR UPDATE
USING (clinic_id = get_user_clinic_id());

-- Los profesionales solo pueden ver/editar sus propias citas (opcional, si se quiere restringir)
-- CREATE POLICY "Professionals can only see their appointments"
-- ON appointments FOR SELECT
-- USING (
--     clinic_id = get_user_clinic_id()
--     AND (has_role('Administrador') OR has_role('Recepción') OR professional_id = get_user_staff_id())
-- );
```

### 8.2 Políticas para Agenda Blocks

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

## 9. Conexiones con Otros Módulos

### 9.1 Mapa de Conexiones

```
                                    ┌─────────────────┐
                                    │   CONFIGURACIÓN │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
          ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
          │      STAFF      │     │      BOXES      │     │   TREATMENT     │
          │ (Profesionales) │     │   (Gabinetes)   │     │    CATALOG      │
          └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
                   │                       │                       │
                   └───────────────────────┼───────────────────────┘
                                           │
                                           ▼
                               ┌───────────────────────┐
                               │                       │
                               │    MÓDULO AGENDA      │
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
│ FICHA PACIENTE  │             │      CAJA       │             │   PARTE DIARIO  │
│                 │             │                 │             │                 │
│ - Ver ficha     │             │ - Cobros del    │             │ - Producción    │
│ - Historial     │             │   día           │             │ - KPIs          │
│ - Tratamientos  │             │ - Pagos de      │             │ - Exportación   │
│ - SOAP Notes    │             │   citas         │             │   PDF           │
└─────────────────┘             └─────────────────┘             └─────────────────┘
```

### 9.2 Detalle de Conexiones

#### 9.2.1 AGENDA → FICHA PACIENTE

| Acción en Agenda         | Resultado en Ficha                     |
| ------------------------ | -------------------------------------- |
| Click en tarjeta de cita | Abre ficha en Resumen                  |
| "Ver ficha" del menú     | Abre ficha del paciente                |
| Estado "En consulta"     | Abre Historial Clínico en modo edición |
| Completar cita           | Crea registro en visit_records         |

**Query de conexión:**

```sql
-- Desde Agenda, obtener datos para abrir ficha
SELECT
    a.patient_id,
    a.id as appointment_id,
    p.full_name,
    p.phone,
    ARRAY(SELECT allergen_name FROM patient_allergies WHERE patient_id = p.id AND severity IN ('grave','extrema')) as critical_allergies,
    EXISTS(SELECT 1 FROM patient_alerts WHERE patient_id = p.id AND is_active AND priority = 'critical') as has_critical_alerts
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.id = :appointment_id;
```

#### 9.2.2 AGENDA → CAJA

| Acción en Agenda         | Resultado en Caja         |
| ------------------------ | ------------------------- |
| Cobrar desde cita        | Registra pago             |
| Completar cita con cobro | Aparece en arqueo del día |

**Query de conexión:**

```sql
-- Pagos del día provenientes de citas
SELECT
    pay.*,
    a.patient_name,
    a.reason as treatment
FROM payments pay
JOIN appointments a ON a.id = pay.appointment_id
WHERE pay.clinic_id = :clinic_id
AND pay.payment_date = CURRENT_DATE;
```

#### 9.2.3 AGENDA → PARTE DIARIO

| Dato en Agenda            | Uso en Parte Diario |
| ------------------------- | ------------------- |
| Citas del día             | Tabla principal     |
| Estados de visita         | Columna de estado   |
| Tiempos (espera/consulta) | Columna de tiempo   |
| Tratamientos completados  | Producción          |

**Query de conexión:**

```sql
-- Datos para tabla del parte diario
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
    CASE WHEN a.has_pending_charge THEN 'Si' ELSE 'No' END as charge,
    a.tags
FROM appointments a
WHERE a.clinic_id = :clinic_id
AND a.appointment_date = :date
AND a.is_cancelled = FALSE
ORDER BY a.start_time;
```

#### 9.2.4 CONFIGURACIÓN → AGENDA

| Configuración       | Uso en Agenda                                    |
| ------------------- | ------------------------------------------------ |
| staff               | Lista de profesionales para filtros y asignación |
| boxes               | Lista de gabinetes para filtros y asignación     |
| treatment_catalog   | Servicios disponibles para crear cita            |
| working_hours       | Horarios disponibles en el calendario            |
| visit_status_config | Colores y umbrales de alertas                    |

---

### 9.3 Matriz de Permisos por Rol

| Funcionalidad         | Recepción | Higienista | Doctor | Administrador |
| --------------------- | --------- | ---------- | ------ | ------------- |
| Ver calendario        | ✅        | ✅         | ✅     | ✅            |
| Crear cita            | ✅        | ✅         | ✅     | ✅            |
| Editar cita           | ✅        | ✅         | ✅     | ✅            |
| Cancelar cita         | ✅        | ❌         | ✅     | ✅            |
| Cambiar estado visita | ✅        | ✅         | ✅     | ✅            |
| Ver parte diario      | ✅        | ✅         | ✅     | ✅            |
| Exportar parte        | ✅        | ✅         | ✅     | ✅            |
| Crear bloqueo         | ✅        | ❌         | ✅     | ✅            |
| Cobrar desde cita     | ✅        | ❌         | ✅     | ✅            |
| Ver tiempos de espera | ✅        | ✅         | ✅     | ✅            |
| Configurar estados    | ❌        | ❌         | ❌     | ✅            |

---

## 10. Eventos del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EVENTOS DE AGENDA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

AGENDA emite:
├── appointment.created ──────────────► Ficha Paciente (actualizar próxima cita)
│                                      └► Notificaciones (enviar confirmación)
│
├── appointment.updated ──────────────► Ficha Paciente (actualizar datos)
│
├── appointment.cancelled ────────────► Ficha Paciente (liberar slot)
│                                      └► Notificaciones (enviar cancelación)
│
├── visit_status.changed ─────────────► Parte Diario (actualizar tabla)
│   ├── scheduled → waiting_room       └► Ficha (si es in_consultation, abrir)
│   ├── waiting_room → call_patient
│   ├── call_patient → in_consultation
│   └── in_consultation → completed ──► Caja (registrar cobro si aplica)
│                                      └► Parte Diario (actualizar producción)
│
├── appointment.confirmed ────────────► Parte Diario (actualizar contador)
│
├── treatment.completed ──────────────► Ficha (actualizar tratamientos)
│                                      └► Parte Diario (producción del día)
│
└── block.created ────────────────────► Calendario (mostrar bloqueo)

FICHA PACIENTE emite hacia AGENDA:
├── appointment.requested ────────────► Abrir modal crear cita con paciente
└── treatment.scheduled ──────────────► Vincular tratamiento a cita existente

CAJA emite hacia AGENDA:
└── payment.registered ───────────────► Actualizar estado de cobro en cita
```

---

## 11. Índices y Optimización

### 11.1 Índices Críticos

```sql
-- Índices para consultas frecuentes
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

-- Índice para búsqueda de conflictos
CREATE INDEX CONCURRENTLY idx_appointments_conflict_check ON appointments(
    clinic_id,
    appointment_date,
    professional_id,
    box,
    start_time,
    end_time
) WHERE is_cancelled = FALSE;

-- Índice para estadísticas
CREATE INDEX CONCURRENTLY idx_appointments_status_stats ON appointments(
    clinic_id,
    appointment_date,
    visit_status
) WHERE is_cancelled = FALSE;
```

### 11.2 Particionamiento (Opcional para alto volumen)

```sql
-- Particionar por fecha para clínicas con alto volumen
CREATE TABLE appointments_partitioned (
    LIKE appointments INCLUDING ALL
) PARTITION BY RANGE (appointment_date);

-- Crear particiones por año
CREATE TABLE appointments_2026 PARTITION OF appointments_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE appointments_2027 PARTITION OF appointments_partitioned
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

---

## 12. Supabase Realtime (Opcional)

### 12.1 Configuración para Actualizaciones en Tiempo Real

```sql
-- Habilitar Realtime para appointments
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Configurar filtro por clinic_id para eficiencia
-- (Se configura en el cliente con Supabase JS)
```

**Uso en Frontend:**

```typescript
// Suscripción a cambios en citas del día
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
      // Actualizar UI
      handleAppointmentChange(payload)
    }
  )
  .subscribe()
```

---

## 13. Plan de Implementación Sugerido

### Fase 1: Fundamentos (Semana 1-2)

- [ ] Crear tablas: `staff`, `boxes`, `appointments`
- [ ] Configurar RLS multi-tenant
- [ ] Implementar trigger de número de cita
- [ ] CRUD básico de citas

### Fase 2: Estados de Visita (Semana 3-4)

- [ ] Crear tabla `visit_status_history`
- [ ] Implementar trigger de cambio de estado
- [ ] Calcular tiempos de espera/consulta
- [ ] Función de cambio masivo

### Fase 3: Bloqueos (Semana 5)

- [ ] Crear tabla `agenda_blocks`
- [ ] Implementar recurrencia
- [ ] Validación de conflictos

### Fase 4: Integraciones (Semana 6-7)

- [ ] Conectar con ficha paciente
- [ ] Vincular tratamientos a citas
- [ ] Conectar con caja (pagos)

### Fase 5: Parte Diario (Semana 8)

- [ ] Funciones de exportación
- [ ] KPIs del día/semana
- [ ] Generación de PDFs

### Fase 6: Optimización (Semana 9)

- [ ] Índices adicionales
- [ ] Configurar Realtime (opcional)
- [ ] Testing de rendimiento

---

## 14. Referencias

### 14.1 Archivos Frontend Relacionados

```
src/
├── app/
│   ├── agenda/page.tsx                    # Página principal del calendario
│   └── parte-diario/page.tsx              # Página del parte diario
│
├── components/agenda/
│   ├── WeekScheduler.tsx                  # Vista semanal del calendario
│   ├── DayCalendar.tsx                    # Vista diaria
│   ├── MonthCalendar.tsx                  # Vista mensual
│   ├── AppointmentSummaryCard.tsx         # Tarjeta de cita
│   ├── AgendaBlockCard.tsx                # Tarjeta de bloqueo
│   ├── VisitStatusMenu.tsx                # Menú de cambio de estado
│   ├── VisitStatusCounters.tsx            # Contadores de estados
│   ├── WaitTimeDisplay.tsx                # Display de tiempos
│   ├── modals/
│   │   ├── CreateAppointmentModal.tsx     # Modal crear cita
│   │   ├── AppointmentDetailOverlay.tsx   # Overlay de detalle
│   │   └── ParteDiarioModal.tsx           # Modal exportar parte
│   └── types.ts                           # Tipos de agenda
│
└── context/
    └── AppointmentsContext.tsx            # Contexto de citas (mock data)
```

### 14.2 Tipos TypeScript de Referencia

```typescript
// Estados de visita
type VisitStatus =
  | 'scheduled'
  | 'waiting_room'
  | 'call_patient'
  | 'in_consultation'
  | 'completed'
  | 'no_show'
  | 'cancelled'

// Configuración visual de estados
type VisitStatusConfig = {
  label: string
  color: string
  bgColor: string
  textColor: string
  icon: string
}

// Datos de cita
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
  status: 'Confirmada' | 'No confirmada' | 'Reagendar'
  box?: string
  visitStatus?: VisitStatus
  visitStatusHistory?: { status: VisitStatus; timestamp: Date }[]
  waitingDuration?: number
  consultationDuration?: number
  // ...otros campos
}

// Bloqueo de agenda
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

_Documento generado el 2 de Febrero de 2026_  
_Versión 1.0 - MVP Completo_
