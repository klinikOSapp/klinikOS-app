# Technical Brief: Voice Agent — Basic Mode (Receptionist) - klinikOS

**Date:** February 11, 2026  
**Version:** 1.0  
**Status:** UI Prototype (Frontend only — no backend integration)  
**Backend:** Supabase (PostgreSQL + Edge Functions) — Planned  
**Architecture:** Multi-tenant from the start  
**Tier:** Basic (included in base subscription plan)

---

## 1. Overview

### 1.1 Description

The **Voice Agent (Basic Mode)** is an AI-powered telephone receptionist that answers incoming calls to the clinic, collects caller information, detects the caller's intent, and generates a structured summary for the clinic staff to act upon manually.

In **basic mode**, the agent **does NOT create appointments automatically**. Instead, it serves as an intelligent call logger: it captures patient name, phone number, reason for calling, and sentiment analysis, then presents this information to reception staff who must call back to schedule appointments or resolve the request.

### 1.2 Key Concept: "Smart Call Logger"

```
┌────────────────────────────────────────────────────────────────────┐
│                     BASIC MODE PHILOSOPHY                          │
│                                                                    │
│  Patient calls → AI answers → Collects info → Logs call           │
│                                                                    │
│  Staff reviews → Calls back → Schedules manually → Marks resolved │
│                                                                    │
│  The AI does NOT interact with the clinic calendar.                │
│  The AI does NOT create, modify, or cancel appointments.           │
│  The AI is a sophisticated answering machine + transcription tool. │
└────────────────────────────────────────────────────────────────────┘
```

### 1.3 Module Sections

| #   | Section                 | Description                                                    |
| --- | ----------------------- | -------------------------------------------------------------- |
| 1   | **KPI Dashboard**       | 6 weekly KPI cards (calls pending, received, avg time, etc.)   |
| 2   | **Distribution Chart**  | Donut chart showing call distribution by intent type           |
| 3   | **Volume Chart**        | Line chart showing call volume trends over the week            |
| 4   | **Calls Table**         | Main table listing all calls with status, patient, intent      |
| 5   | **Call Detail Modal**   | Full call details, timeline, patient info, callback actions    |
| 6   | **Listen Call Modal**   | Audio player to listen to call recordings                      |
| 7   | **Transcription Modal** | Full text transcription of the call                            |
| 8   | **Call Modal**          | Quick callback modal to return patient calls                   |
| 9   | **Assign Professional** | Assign a staff member to handle a specific call                |

### 1.4 Design Principles

- **Manual workflow**: Staff must take action on every call — nothing is automated
- **Time-based urgency**: Calls auto-transition from "nueva" → "pendiente" after 2 hours
- **No calendar integration**: Basic mode has no read/write access to the agenda
- **Subscription-gated**: Tier is controlled by `SubscriptionContext`
- **Multi-tenant**: All future tables will include `clinic_id` for data isolation

---

## 2. Data Architecture

### 2.1 Current State (Frontend Mock)

The basic mode currently operates entirely with mock data. No database tables or API calls exist yet.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CURRENT STATE: MOCK DATA ONLY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CallsTable.tsx ──► MOCK_DATA (9 hardcoded CallRecord objects)              │
│  VoiceAgentPendingWidget.tsx ──► MOCK_PENDING_CALLS (5 hardcoded calls)    │
│  VoiceAgentPage.tsx ──► KPI_DATA_BASIC (6 hardcoded KPI values)            │
│  CallDetailModal.tsx ──► MOCK_TIMELINE + MOCK_COMMUNICATIONS               │
│                                                                             │
│  No Supabase queries. No API routes. No external service integrations.     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Planned Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLINICS                                         │
│                         (Main tenant table)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                          ┌─────────┴──────────┐
                          │ 1:N                │ 1:1
                          ▼                    ▼
                ┌───────────────────┐  ┌───────────────────┐
                │    VOICE_CALLS    │  │ CLINIC_VOICE_     │
                │  (Call records)   │  │ AGENT_CONFIG      │
                │                   │  │ (Agent settings)  │
                └───────────────────┘  └───────────────────┘
                    │           │
                    │ 1:1       │ 1:N
                    ▼           ▼
          ┌──────────────┐ ┌──────────────────┐
          │ VOICE_CALL_  │ │ VOICE_CALL_      │
          │ TRANSCRIPT   │ │ NOTES            │
          │ (Full text)  │ │ (Staff notes)    │
          └──────────────┘ └──────────────────┘
                    │
                    │ N:1 (optional)
                    ▼
          ┌──────────────────┐
          │    PATIENTS       │
          │ (Link by phone)   │
          └──────────────────┘
```

### 2.3 Planned Tables

#### 2.3.1 Table: `voice_calls`

```sql
CREATE TABLE voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Call identification
    call_external_id VARCHAR(100), -- ID from voice provider (Vapi, Twilio, etc.)
    call_number VARCHAR(50), -- Auto-generated call number per clinic

    -- Caller information
    caller_phone VARCHAR(20) NOT NULL,
    caller_name VARCHAR(200), -- Detected or provided by caller
    patient_id UUID REFERENCES patients(id), -- Linked patient (if identified)

    -- Call timing
    call_date DATE NOT NULL DEFAULT CURRENT_DATE,
    call_time TIME NOT NULL DEFAULT CURRENT_TIME,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- AI Analysis
    intent VARCHAR(50) NOT NULL
        CHECK (intent IN (
            'pedir_cita_higiene', 'consulta_financiacion', 'urgencia_dolor',
            'cancelar_cita', 'confirmar_cita', 'consulta_general'
        )),
    summary TEXT NOT NULL, -- AI-generated summary
    sentiment VARCHAR(30)
        CHECK (sentiment IN ('aliviado', 'nervioso', 'enfadado', 'contento', 'preocupado')),

    -- Status management (BASIC MODE)
    status VARCHAR(20) NOT NULL DEFAULT 'nueva'
        CHECK (status IN ('nueva', 'pendiente', 'en_curso', 'resuelta', 'urgente')),
    auto_pending_at TIMESTAMPTZ, -- When auto-transitioned to 'pendiente'

    -- Staff assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_to_name VARCHAR(150),
    assigned_at TIMESTAMPTZ,

    -- Resolution
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,

    -- Recording
    recording_url TEXT, -- URL to call recording in storage
    recording_duration_seconds INTEGER,

    -- Voice agent tier at time of call
    voice_agent_tier VARCHAR(20) DEFAULT 'basic'
        CHECK (voice_agent_tier IN ('basic', 'advanced')),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_call_external_id UNIQUE (clinic_id, call_external_id)
);

-- Indexes
CREATE INDEX idx_voice_calls_clinic_date ON voice_calls(clinic_id, call_date DESC);
CREATE INDEX idx_voice_calls_status ON voice_calls(clinic_id, status) WHERE status != 'resuelta';
CREATE INDEX idx_voice_calls_patient ON voice_calls(patient_id);
CREATE INDEX idx_voice_calls_phone ON voice_calls(caller_phone);
CREATE INDEX idx_voice_calls_pending ON voice_calls(clinic_id, status, call_date)
    WHERE status IN ('nueva', 'pendiente', 'urgente');
```

#### 2.3.2 Table: `voice_call_transcripts`

```sql
CREATE TABLE voice_call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Transcript content
    full_text TEXT NOT NULL,
    segments JSONB, -- [{speaker: "agent"|"caller", text: "...", start_ms: 0, end_ms: 5000}]

    -- Language
    detected_language VARCHAR(10) DEFAULT 'es',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_voice_call_transcripts_call ON voice_call_transcripts(voice_call_id);
```

#### 2.3.3 Table: `voice_call_notes`

```sql
CREATE TABLE voice_call_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Note content
    note_text TEXT NOT NULL,

    -- Author
    created_by UUID REFERENCES auth.users(id),
    created_by_name VARCHAR(150),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_call_notes_call ON voice_call_notes(voice_call_id);
```

#### 2.3.4 Table: `clinic_voice_agent_config`

```sql
CREATE TABLE clinic_voice_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Tier
    voice_agent_tier VARCHAR(20) NOT NULL DEFAULT 'basic'
        CHECK (voice_agent_tier IN ('basic', 'advanced')),

    -- Basic mode settings
    auto_pending_hours INTEGER DEFAULT 2, -- Hours before 'nueva' → 'pendiente'
    notify_on_new_call BOOLEAN DEFAULT TRUE,
    notify_on_urgent BOOLEAN DEFAULT TRUE,

    -- Voice provider credentials (encrypted)
    voice_provider VARCHAR(50), -- 'vapi', 'twilio', etc.
    voice_provider_config JSONB, -- Provider-specific configuration

    -- AI model settings
    ai_model VARCHAR(50) DEFAULT 'gpt-4o',
    ai_language VARCHAR(10) DEFAULT 'es',
    ai_greeting_message TEXT, -- Custom greeting
    ai_clinic_name VARCHAR(200), -- Clinic name for the agent to use

    -- Credits
    monthly_credit_limit INTEGER DEFAULT 500,
    credits_used_this_month INTEGER DEFAULT 0,
    credit_reset_day INTEGER DEFAULT 1, -- Day of month to reset credits

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_clinic_voice_config UNIQUE (clinic_id)
);
```

---

## 3. Type System

### 3.1 Core Types (`voiceAgentTypes.ts`)

```typescript
// Voice agent tier (from SubscriptionContext)
export type VoiceAgentTier = 'basic' | 'advanced'

// Call statuses
export type CallStatus =
  | 'nueva'       // Just received, not yet reviewed
  | 'pendiente'   // Auto-transitioned or manually set as pending
  | 'en_curso'    // Being handled by staff
  | 'resuelta'    // Resolved (staff called back, issue handled)
  | 'urgente'     // Flagged as urgent (pain, emergency)

// Caller intent (detected by AI)
export type CallIntent =
  | 'pedir_cita_higiene'       // Request hygiene appointment
  | 'consulta_financiacion'    // Finance/payment inquiry
  | 'urgencia_dolor'           // Pain emergency
  | 'cancelar_cita'            // Cancel existing appointment
  | 'confirmar_cita'           // Confirm existing appointment
  | 'consulta_general'         // General inquiry

// Sentiment analysis
export type Sentiment =
  | 'aliviado'     // Relieved
  | 'nervioso'     // Nervous
  | 'enfadado'     // Angry
  | 'contento'     // Happy
  | 'preocupado'   // Worried

// Main call record
export interface CallRecord {
  id: string
  status: CallStatus
  time: string
  patient: string | null    // null = "Pendiente de asignar"
  phone: string
  intent: CallIntent
  duration: string          // Format: "MM:SS"
  summary: string
  sentiment: Sentiment
  appointmentId?: string    // NOT USED in basic mode
}
```

### 3.2 Constants

```typescript
// Time threshold for auto-transitioning 'nueva' → 'pendiente' (BASIC MODE ONLY)
export const AUTO_PENDING_HOURS = 2

// Status display labels
export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  nueva: 'Nueva',
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  resuelta: 'Resuelta',
  urgente: 'Urgente'
}

// Intent display labels
export const CALL_INTENT_LABELS: Record<CallIntent, string> = {
  pedir_cita_higiene: 'Pedir cita higiene',
  consulta_financiacion: 'Consulta financiación',
  urgencia_dolor: 'Urgencia dolor',
  cancelar_cita: 'Cancelar cita',
  confirmar_cita: 'Confirmar cita',
  consulta_general: 'Consulta general'
}
```

---

## 4. Call Status Flow (Basic Mode)

### 4.1 Status Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BASIC MODE: CALL STATUS FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │   INCOMING   │
                        │    CALL      │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                ┌──────►│   NUEVA      │ (AI answers, logs call)
                │       └──────┬──────┘
                │              │
                │              │ Auto after 2h (AUTO_PENDING_HOURS)
                │              ▼
                │       ┌─────────────┐
                │       │  PENDIENTE   │ (Awaiting staff action)
                │       └──────┬──────┘
                │              │
                │              │ Staff picks up
                │              ▼
                │       ┌─────────────┐
                │       │  EN_CURSO    │ (Staff handling it)
                │       └──────┬──────┘
                │              │
                │              │ Staff resolves
                │              ▼
                │       ┌─────────────┐
                └───────│  RESUELTA    │ (Done)
                        └─────────────┘

  At any point, AI or staff can flag as:
                        ┌─────────────┐
                        │   URGENTE    │ (Pain, emergency keywords detected)
                        └─────────────┘
```

### 4.2 Auto-Pending Mechanism

In basic mode, calls that remain as "nueva" for more than `AUTO_PENDING_HOURS` (default: 2 hours) are automatically transitioned to "pendiente" to increase visibility.

```typescript
// Runs every 60 seconds (client-side check with mock data)
// In production: server-side cron job or Supabase function
useEffect(() => {
  if (voiceAgentTier !== 'basic') return

  const checkInterval = setInterval(() => {
    setLocalCalls(prevCalls => prevCalls.map(call => {
      if (call.status !== 'nueva') return call
      const hoursSinceCall = calculateHoursSince(call.time)
      if (hoursSinceCall >= AUTO_PENDING_HOURS) {
        return { ...call, status: 'pendiente' }
      }
      return call
    }))
  }, 60000)

  return () => clearInterval(checkInterval)
}, [voiceAgentTier])
```

### 4.3 No Appointment Sync

In basic mode, there is **NO** event listener for appointment status changes. The call status is entirely managed by staff manually:

```
BASIC MODE:
  ✅ Staff manually marks calls as 'resuelta'
  ✅ Auto-transition 'nueva' → 'pendiente' after 2h
  ❌ NO sync with appointments table
  ❌ NO CustomEvent listeners for 'appointment:status-change'
  ❌ NO CustomEvent listeners for 'appointment:visit-status-change'
```

---

## 5. KPI Dashboard (Basic Mode)

### 5.1 KPI Cards

The basic mode displays **6 KPI cards** in a 2×3 grid, designed to tell a complete operational story:
**Demand → Urgency → Backlog → Output → Efficiency → Speed**

| #   | KPI Label                       | Description                                                        | Unique to Basic? | Down = Good? |
| --- | ------------------------------- | ------------------------------------------------------------------ | ----------------- | ------------ |
| 1   | **Llamadas pendientes**         | Count of calls with status `nueva` + `pendiente`                   | Yes (replaces "Citas creadas") | Yes (invertTrend) |
| 2   | **Llamadas recibidas**          | Total calls received this week                                     | No               | No           |
| 3   | **Llamadas urgentes**           | Count of calls with status `urgente` this week                     | Yes              | Yes (invertTrend) |
| 4   | **Llamadas resueltas**          | Calls marked as resolved this week                                 | No               | No           |
| 5   | **Tasa de resolución**          | Percentage of calls resolved: `resueltas / recibidas × 100`       | Yes              | No           |
| 6   | **Tiempo medio de respuesta**   | Average time (minutes) from call received to staff action          | No (renamed)     | Yes (invertTrend) |

### 5.2 KPI Design Rationale

KPIs were selected to be **actionable for reception staff** in their daily workflow:

- **Llamadas pendientes**: The most critical metric — shows the backlog staff needs to clear.
- **Llamadas recibidas**: Volume awareness for capacity planning and trend detection.
- **Llamadas urgentes**: In a medical/dental clinic, urgency (pain, emergencies) requires immediate visibility. Helps prioritize.
- **Llamadas resueltas**: Productivity metric — how much the team has accomplished this week.
- **Tasa de resolución**: Efficiency ratio — if the rate drops, the team is falling behind. More actionable than raw counts.
- **Tiempo medio de respuesta**: Speed metric — measures how quickly staff responds to calls. Lower is better.

**Removed from Basic mode:**
- **Tiempo medio llamada**: Duration of the AI call itself. Not actionable for staff — this is an AI performance metric better suited for admin/config dashboards.
- **Créditos usados**: Billing/admin concern. Staff cannot control credit consumption. Moved to Configuration > Billing section.

### 5.3 Trend Color Logic (invertTrend)

The `VoiceAgentKPI` type includes an optional `invertTrend` boolean. When `true`, the color logic is reversed:
- `changeDirection: 'down'` + `invertTrend: true` → **green** (positive, e.g., fewer pending calls is good)
- `changeDirection: 'up'` + `invertTrend: true` → **red** (negative, e.g., more pending calls is bad)

KPIs with `invertTrend: true` in Basic mode: Llamadas pendientes, Llamadas urgentes, Tiempo medio de respuesta.

### 5.4 Key Difference from Advanced

The first KPI changes depending on the tier:
- **Basic**: "Llamadas pendientes" — emphasizes the backlog staff needs to handle
- **Advanced**: "Citas creadas" — emphasizes automated appointment creation

---

## 6. Available Actions (Basic Mode)

### 6.1 Quick Actions Menu

When clicking the `⋮` button on a call row, the following actions are available:

| Action                  | Icon               | Description                                        | Available? |
| ----------------------- | ------------------ | -------------------------------------------------- | ---------- |
| **Llamar**              | `call`             | Open callback modal to return the patient's call   | Yes        |
| **Ver en agenda**       | `calendar_month`   | View linked appointment in calendar                | **NO**     |
| **Crear cita**          | `add_circle`       | Create appointment from call data                  | **NO**     |
| **Marcar resuelta**     | `check_box`        | Change call status to "resuelta"                   | Yes        |
| **Escuchar llamada**    | `adaptive_audio_mic` | Open audio player modal                          | Yes        |
| **Transcripción**       | `dictionary`       | View full call transcription                       | Yes        |
| **Asignar profesional** | `person_add`       | Assign a staff member to handle the call           | Yes        |
| **Más información**     | `info`             | Open full call detail modal                        | Yes        |

### 6.2 Call Detail Modal (Basic Mode)

The detail modal in basic mode differs from advanced:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BASIC MODE: Call Detail Modal                                               │
│  Header: "Detalle de llamada" (NOT "Detalle de cita agendada")              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐          │
│  │  LEFT COLUMN    │  │  RIGHT COLUMN                           │          │
│  │                 │  │                                         │          │
│  │  Timeline:      │  │  Patient Info Card                      │          │
│  │  1. Recibida    │  │  ├── Avatar                             │          │
│  │  2. Intención   │  │  ├── Name                               │          │
│  │  3. Paciente    │  │  ├── Email                              │          │
│  │  4. Preferencias│  │  └── Phone                              │          │
│  │  5. Verificados │  │                                         │          │
│  │  6. Propuesta   │  │  Call Info (3 cards):                   │          │
│  │  7. Confirmación│  │  ├── Hora                               │          │
│  │  8. Finalizada  │  │  ├── Duración                           │          │
│  │                 │  │  └── Teléfono                           │          │
│  │  Call Stats:    │  │                                         │          │
│  │  ├── Duración   │  │  ℹ️ Info Banner:                        │          │
│  │  └── Sentimiento│  │  "Llama al paciente para agendar la     │          │
│  │                 │  │   cita manualmente. Una vez gestionada,  │          │
│  │                 │  │   marca la llamada como resuelta."       │          │
│  │                 │  │                                         │          │
│  │                 │  │  ❌ NO "Información de la cita" section  │          │
│  │                 │  │                                         │          │
│  │                 │  │  Motivo de la llamada                   │          │
│  │                 │  │  Comunicaciones enviadas                │          │
│  └─────────────────┘  └─────────────────────────────────────────┘          │
│                                                                             │
│  Footer: [Cerrar] [Marcar como resuelta] [Llamar]                          │
│                                                                             │
│  ❌ NO "Ver en agenda" button                                               │
│  ❌ NO "Crear cita" button                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Component Architecture

### 7.1 Component Tree

```
src/app/agente-voz/page.tsx
└── ClientLayout (shared layout with sidebar + topbar)
    └── VoiceAgentPage.tsx (main page component)
        ├── Week Navigator (prev/next week, "Esta semana" button)
        ├── Tier Toggle (Básico ↔ Avanzado — testing only)
        ├── VoiceAgentKPICard.tsx × 6 (KPI grid)
        ├── CallDistributionDonut.tsx (donut chart by intent)
        ├── CallVolumeChart.tsx (line chart of call volume)
        └── CallsTable.tsx (main calls table/cards)
            ├── Toolbar (view toggle, search, filters)
            ├── Table View or CallCardsView.tsx
            │   └── CallCard.tsx × N (individual call cards)
            ├── Pagination
            └── Modals (portals):
                ├── CallQuickActionsMenu (context menu)
                ├── CallDetailModal.tsx (full detail view)
                ├── CallModal.tsx (callback modal)
                ├── ListenCallModal.tsx (audio player)
                ├── TranscriptionModal.tsx (transcript viewer)
                └── AssignProfessionalModal.tsx (staff assignment)
```

### 7.2 File Map

| File                              | Lines | Purpose                                          |
| --------------------------------- | ----- | ------------------------------------------------ |
| `voiceAgentTypes.ts`              | 111   | Types, constants, helpers                        |
| `VoiceAgentPage.tsx`              | 355   | Main page layout, KPIs, charts, week nav         |
| `CallsTable.tsx`                  | 1251  | Table/cards view, filters, pagination, all modals|
| `CallDetailModal.tsx`             | 674   | Full call detail with timeline                   |
| `CallModal.tsx`                   | ~150  | Compact callback modal                           |
| `CallCard.tsx`                    | ~200  | Individual call card for cards view              |
| `CallCardsView.tsx`               | ~100  | Grid wrapper for call cards                      |
| `CallStatusBadge.tsx`             | ~50   | Status badge component                           |
| `CallDistributionDonut.tsx`       | ~150  | Recharts donut chart                             |
| `CallVolumeChart.tsx`             | ~200  | Recharts line chart                              |
| `VoiceAgentKPICard.tsx`           | ~80   | Individual KPI card                              |
| `AssignProfessionalModal.tsx`     | ~150  | Professional assignment modal                    |
| `ListenCallModal.tsx`             | ~200  | Audio playback modal                             |
| `TranscriptionModal.tsx`          | ~150  | Transcription viewer modal                       |
| `AudioWaveform.tsx`               | ~100  | Audio waveform visualization                     |

### 7.3 State Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STATE MANAGEMENT (BASIC MODE)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SubscriptionContext (global)                                                │
│  ├── voiceAgentTier: 'basic'                                                │
│  ├── canAutoCreateAppointments: false                                       │
│  └── setVoiceAgentTier() — testing toggle only                              │
│                                                                             │
│  VoiceAgentPage (local state)                                               │
│  └── selectedWeekStart: Date — for week navigation                          │
│                                                                             │
│  CallsTable (local state)                                                   │
│  ├── localCalls: CallRecord[] — mutable copy of call data                   │
│  ├── filter: 'todos' | 'pendientes' | 'urgentes'                           │
│  ├── searchQuery: string                                                    │
│  ├── viewMode: 'table' | 'cards'                                           │
│  ├── currentPage: number                                                    │
│  └── Modal states: detailRow, listenCallRow, callModalRow, etc.             │
│                                                                             │
│  NO dedicated VoiceAgent context (state is component-local)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Connections with Other Modules

### 8.1 Connection Map (Basic Mode)

```
                              ┌─────────────────────────┐
                              │     SUBSCRIPTION         │
                              │     CONTEXT              │
                              │  voiceAgentTier: 'basic' │
                              └────────────┬────────────┘
                                           │
                                           ▼
┌─────────────────────┐          ┌─────────────────────────┐
│     SIDEBAR          │─────────►│     VOICE AGENT PAGE    │
│  Layout.tsx          │          │     /agente-voz          │
│  "Agente de Voz"     │          │                         │
└─────────────────────┘          │  KPIs + Charts + Table   │
                                  └────────────┬────────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                              ▼                ▼                ▼
                    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                    │  AGENDA       │  │  PATIENTS     │  │  CONFIG      │
                    │  /agenda      │  │  /pacientes   │  │  /config     │
                    │              │  │              │  │              │
                    │  Widget only │  │  Phone match │  │  Agent       │
                    │  (read-only) │  │  (future)    │  │  settings    │
                    └──────────────┘  └──────────────┘  └──────────────┘

  BASIC MODE CONNECTIONS:
  ✅ Sidebar → Voice Agent Page (navigation)
  ✅ Agenda → Voice Agent (VoiceAgentPendingWidget — read-only)
  ❌ Voice Agent → Agenda (NO appointment creation/navigation)
  ❌ Voice Agent → Patient Record (NO direct link — future)
  ✅ Config → Voice Agent (tier setting — future)
```

### 8.2 Connection Details by Module

#### 8.2.1 AGENDA (`/agenda`) → Voice Agent (Read-Only)

| Direction         | Action                                      | Data Involved                   |
| ----------------- | ------------------------------------------- | ------------------------------- |
| Agenda → V.Agent  | Widget shows pending calls count            | Pending calls (mock data)       |
| Agenda → V.Agent  | Click on pending call → opens call detail   | `callId` via URL param          |
| Agenda → V.Agent  | "Ver todas en Agente de Voz" button         | Navigates to `/agente-voz`      |
| V.Agent → Agenda  | **NOT AVAILABLE IN BASIC MODE**             | —                               |

**VoiceAgentPendingWidget:**

The agenda header includes a `VoiceAgentPendingWidget` that shows a badge with the count of pending calls. Clicking it opens a dropdown with call summaries. This widget is **read-only** — it displays information but basic mode cannot navigate back to the agenda to create appointments.

```
AGENDA HEADER:
┌──────────────────────────────────────────────────────────────────┐
│  ← →  27 - 2 Feb 2026  [Esta semana]  [🤖 3 pendientes]        │
│                                         ▲                        │
│                                         │                        │
│                             VoiceAgentPendingWidget              │
│                             (shared between both tiers)          │
└──────────────────────────────────────────────────────────────────┘
```

#### 8.2.2 PATIENTS (`/pacientes`) ↔ Voice Agent (Future)

| Direction         | Action                              | Data Involved                    | Status   |
| ----------------- | ----------------------------------- | -------------------------------- | -------- |
| V.Agent → Patient | Link call to patient by phone       | `caller_phone` → `patients.phone`| Planned  |
| Patient → V.Agent | View call history from patient file | `patient_id` in `voice_calls`    | Planned  |

In production, the voice agent will attempt to match incoming calls to existing patients by phone number:

```sql
-- Future: Match caller to patient
SELECT id, full_name, phone, avatar_url
FROM patients
WHERE clinic_id = :clinic_id
AND (phone = :caller_phone OR phone_secondary = :caller_phone)
AND is_deleted = FALSE
LIMIT 1;
```

#### 8.2.3 CONFIGURATION (`/configuracion`) → Voice Agent (Future)

| Config Area                  | Data                           | Use in Voice Agent                      |
| ---------------------------- | ------------------------------ | --------------------------------------- |
| Voice Agent Settings         | `clinic_voice_agent_config`    | Tier, greeting, AI model, credits       |
| Staff                        | `staff`                        | Professional list for assignment        |
| Clinic Info                  | `clinics`                      | Clinic name for AI greeting             |

#### 8.2.4 MANAGEMENT (`/gestion`) ← Voice Agent (Future)

| Direction         | Action                              | Data Involved                    |
| ----------------- | ----------------------------------- | -------------------------------- |
| Mgmt ← V.Agent   | Voice agent KPIs in dashboard       | Call counts, resolution rates    |
| Mgmt ← V.Agent   | Credits usage tracking              | Monthly credit consumption       |

#### 8.2.5 CASH (`/caja`) — No Connection

Basic mode has **no financial connection**. Calls are informational only.

#### 8.2.6 DAILY REPORT (`/parte-diario`) — No Connection

Basic mode calls do not appear in the daily report as they don't generate treatments or appointments.

---

## 9. Data Flows

### 9.1 Flow: Incoming Call (Basic Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FLOW: INCOMING CALL (BASIC MODE)                             │
└─────────────────────────────────────────────────────────────────────────────┘

Patient calls clinic phone number
   │
   ▼
Voice Provider (Vapi/Twilio) → AI Agent answers
   │
   ├─→ Greeting: "Buenos días, clínica [nombre]. ¿En qué puedo ayudarle?"
   │
   ├─→ AI detects intent (NLP)
   │   └─→ Maps to: pedir_cita_higiene | consulta_financiacion | urgencia_dolor | ...
   │
   ├─→ AI collects information
   │   └─→ Name, phone, reason, urgency
   │
   ├─→ AI analyzes sentiment
   │   └─→ Maps to: aliviado | nervioso | enfadado | contento | preocupado
   │
   ├─→ AI generates summary
   │   └─→ "Paciente solicita cita para limpieza dental. Última limpieza hace 8 meses."
   │
   └─→ AI ends call with:
       "Hemos registrado su solicitud. Un miembro de nuestro equipo
        se pondrá en contacto con usted lo antes posible."
   │
   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    INSERT INTO voice_calls                            │
│  status: 'nueva'                                                     │
│  intent: detected_intent                                             │
│  summary: ai_generated_summary                                       │
│  sentiment: detected_sentiment                                       │
│  ❌ NO appointment creation                                          │
│  ❌ NO calendar check                                                │
└──────────────────────────────────────────────────────────────────────┘
   │
   ▼
Call appears in:
   ├─→ VoiceAgentPendingWidget (agenda header badge)
   └─→ CallsTable (voice agent page, status: 'nueva')
```

### 9.2 Flow: Staff Resolves Call

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FLOW: STAFF RESOLVES CALL (BASIC MODE)                       │
└─────────────────────────────────────────────────────────────────────────────┘

Staff opens /agente-voz
   │
   ├─→ Reviews pending calls in table
   │
   ├─→ Clicks "Más información" → Opens CallDetailModal
   │   ├─→ Reads call summary, intent, sentiment
   │   ├─→ Listens to recording (optional)
   │   └─→ Views transcription (optional)
   │
   ├─→ Clicks "Llamar" → Opens CallModal
   │   └─→ Staff calls patient back manually (via phone)
   │
   ├─→ Staff schedules appointment MANUALLY in /agenda
   │   └─→ ❌ No automatic link between call and appointment
   │
   └─→ Clicks "Marcar como resuelta"
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  UPDATE voice_calls SET status = 'resuelta', resolved_at = NOW()    │
│  WHERE id = :call_id                                                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Permission Matrix

| Module / Action              | Reception      | Hygienist      | Doctor         | Administrator  |
| ---------------------------- | -------------- | -------------- | -------------- | -------------- |
| **View Voice Agent page**    | ✅ Full access | 👁️ View only  | 👁️ View only  | ✅ Full access |
| **Listen to recordings**     | ✅ Yes         | ✅ Yes         | ✅ Yes         | ✅ Yes         |
| **View transcriptions**      | ✅ Yes         | ✅ Yes         | ✅ Yes         | ✅ Yes         |
| **Mark call as resolved**    | ✅ Yes         | ❌ No          | ❌ No          | ✅ Yes         |
| **Assign professional**      | ✅ Yes         | ❌ No          | ❌ No          | ✅ Yes         |
| **Callback (Llamar)**        | ✅ Yes         | ❌ No          | ❌ No          | ✅ Yes         |
| **View KPIs/Charts**         | ✅ Yes         | ✅ Yes         | ✅ Yes         | ✅ Yes         |
| **Change agent tier**        | ❌ No          | ❌ No          | ❌ No          | ✅ Yes         |
| **Configure agent settings** | ❌ No          | ❌ No          | ❌ No          | ✅ Yes         |

---

## 11. Planned External Integrations

### 11.1 Voice Provider (Planned)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLANNED: VOICE PROVIDER INTEGRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Options under evaluation:                                                  │
│  ├── Vapi.ai — AI voice agent platform (leading candidate)                  │
│  ├── Twilio + OpenAI Whisper — Custom pipeline                              │
│  └── ElevenLabs + Custom NLP — Custom pipeline                              │
│                                                                             │
│  Requirements:                                                              │
│  ├── Phone number provisioning (Spanish +34 numbers)                        │
│  ├── Real-time speech-to-text                                               │
│  ├── Intent detection (6 categories)                                        │
│  ├── Sentiment analysis (5 categories)                                      │
│  ├── Summary generation                                                     │
│  ├── Call recording storage                                                 │
│  ├── Transcript generation                                                  │
│  └── Webhook for call completion → Supabase Edge Function                   │
│                                                                             │
│  Architecture:                                                              │
│                                                                             │
│  Patient ──► Phone ──► Voice Provider ──► Webhook ──► Edge Function         │
│                                                        │                    │
│                                                        ▼                    │
│                                              INSERT INTO voice_calls        │
│                                              INSERT INTO voice_call_transcripts │
│                                              Upload recording to Storage    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Supabase Storage Buckets (Planned)

```
storage/
├── voice-recordings/           # Call recordings
│   └── {clinic_id}/
│       └── {YYYY-MM}/
│           └── {call_id}.mp3
│
└── voice-transcripts/          # Transcript files (backup)
    └── {clinic_id}/
        └── {YYYY-MM}/
            └── {call_id}.json
```

---

## 12. Notes for the Team

### 12.1 What Basic Mode Does NOT Do

- Does NOT create appointments
- Does NOT check calendar availability
- Does NOT navigate to the agenda
- Does NOT interact with `appointments` table
- Does NOT use CustomEvent listeners for appointment sync
- Does NOT show "Ver en agenda" or "Crear cita" buttons
- Does NOT show "Información de la cita" section in detail modal

### 12.2 Upgrade Path to Advanced

Upgrading from basic to advanced is controlled by `SubscriptionContext.voiceAgentTier`. Changing this value instantly:
1. Swaps KPI card #1 ("Llamadas pendientes" → "Citas creadas")
2. Enables appointment actions in quick menu and detail modal
3. Activates appointment sync via CustomEvents
4. Disables auto-pending timer (replaced by appointment sync)

### 12.3 Testing

- Use the tier toggle in the page header to switch between modes
- In basic mode, verify no appointment-related UI appears
- Test auto-pending transition by checking calls after 2+ hours

---

## 13. References

- **Frontend components**: `src/components/agente-voz/`
- **Subscription context**: `src/context/SubscriptionContext.tsx`
- **Agenda widget**: `src/components/agenda/VoiceAgentPendingWidget.tsx`
- **Agenda integration**: `src/components/agenda/WeekScheduler.tsx`
- **Types**: `src/components/agente-voz/voiceAgentTypes.ts`
- **Route**: `src/app/agente-voz/page.tsx`

---

_Document generated on February 11, 2026_  
_Version 1.0 — Basic Mode (Receptionist)_
