# Route ↔ Supabase Connection Map

> Audit date: 2026-03-06 | Branch: `main` (commit `2589f82`)

## Summary

**All routes are connected to real Supabase data.** No active mock data is in use. Dead mock constants remain in 3 context files but are never imported/referenced.

---

## Core Pages

| Route | UI Features | Data Source | Tables / RPCs | Status |
|-------|------------|-------------|---------------|--------|
| `/login` | User authentication | Supabase Auth | `auth.users` | ✅ |
| `/register` | User registration | Supabase Auth | `auth.users` | ✅ |
| `/pacientes` | Patient list, search, add/edit | PatientsContext → DB | `patients`, `patient_treatments`, `patient_health_profiles`, `contacts`, `invoices` | ✅ |
| `/agenda` | Weekly/daily calendar, appointments | AppointmentsContext → DB | `appointments`, `appointment_holds`, `appointment_staff`, `agenda_blocks` | ✅ |
| `/parte-diario` | Daily report, visit status | AppointmentsContext → DB | `appointments`, `patient_treatments` | ✅ |
| `/caja` | Cash summary, movements, closings | CashClosingContext → DB + API | `daily_cash_closings`, `payments`, `invoices` + RPCs: `get_caja_resumen`, `get_caja_movements_in_time_range` | ✅ |
| `/gestion` | Analytics dashboard, KPIs | API route → DB | `/api/gestion/overview` → aggregated queries across multiple tables | ✅ |
| `/agente-voz` | Voice call logs, transcripts | DB | `calls`, `webhook_events`, `appointments`, `patients`, `contacts`, `clinics` | ✅ |
| `/manager` | Voice agent dashboard, KPIs | DB | same as `/agente-voz` | ✅ |

## Configuración (Settings)

| Route | UI Features | Data Source | Tables / RPCs | Status |
|-------|------------|-------------|---------------|--------|
| `/configuracion` | Main settings hub, clinic info | ConfigurationContext → DB | `clinics`, `clinic_working_hours` | ✅ |
| `/configuracion/especialistas` | Specialists list, add/edit/schedule | ConfigurationContext → DB | `staff`, `staff_clinics`, `staff_working_hours`, `staff_absences`, `external_specialist_schedules`, `roles` | ✅ |
| `/configuracion/tratamientos` | Treatment catalog management | ConfigurationContext → DB | `service_catalog`, `service_packages` | ✅ |
| `/configuracion/roles` | Roles & permissions management | ConfigurationContext → DB | `roles`, `permissions`, `modules` | ✅ |
| `/configuracion/finanzas` | Financial config, expenses | ConfigurationContext → DB | `expenses` | ✅ |
| `/configuracion/facturacion` | Document templates | ConfigurationContext → DB | `document_templates` | ✅ |
| `/configuracion/gabinetes` | Treatment rooms (boxes) | ConfigurationContext → DB | `boxes` | ✅ |

## Patient Record Modal (tabs)

| Tab | UI Features | Data Source | Tables / RPCs | Status |
|-----|------------|-------------|---------------|--------|
| Resumen | Patient overview, stats | DB | `patients`, `patient_health_profiles`, `patient_medical_alerts`, `appointments` | ✅ |
| Información General | Personal data, contacts | DB | `patients`, `contacts` | ✅ |
| Historial clínico | SOAP notes, odontogram | DB | `clinical_notes`, `clinical_attachments`, `patient_odontogram_states` | ✅ |
| Tratamientos | Treatment plans, history | DB | `patient_treatments`, `treatment_plans`, `treatment_plan_items` | ✅ |
| Imágenes RX | X-rays, photos | Storage + DB | `patient-docs` bucket, `clinical_attachments` | ✅ |
| Finanzas | Budgets, payments, invoices | DB | `quotes`, `quote_items`, `invoices`, `payments` | ✅ |
| Documentos | Consents, templates, preview | DB + Storage | `patient_consents`, `patients`, `patient-docs` bucket | ✅ |
| Recetas | Prescriptions | DB | `prescriptions`, `prescription_items` | ✅ |

## RPC Functions in Use

| RPC Function | Used In | Purpose |
|-------------|---------|---------|
| `get_my_clinics` | Auth, permissions, multiple contexts | Get user's clinic IDs |
| `has_permission` | RLS policies, permission checks | Check module:action permission |
| `get_my_role_info` | Layout, permissions UI | Get role + all permissions |
| `get_my_role_in_clinic` | Layout sidebar | Get user's role enum |
| `get_my_role_id_in_clinic` | Staff route, permission checks | Get numeric role ID |
| `get_clinic_staff` | Appointments, add-patient, caja | Get staff for a clinic |
| `get_clinic_boxes` | ConfigurationContext | Get treatment rooms |
| `get_appointments_calendar` | AppointmentsContext | Calendar data |
| `get_caja_resumen` | Caja summary API | Cash summary stats |
| `get_caja_movements_in_time_range` | Caja movements API, context | Cash movements |
| `get_caja_pending_collections_by_patient` | Caja pending API | Outstanding payments |
| `get_invoice_totals_by_day` | Caja APIs | Daily invoice totals |
| `get_invoices_in_time_range` | Caja APIs | Invoice list |
| `get_next_invoice_number` | Invoice creation | Sequential invoice numbering |
| `get_quote_items_for_cash` | Treatment details API | Quote items for cash view |
| `get_voice_agent_calls_feed` | Voice agent API | Call feed data |
| `assign_staff_to_appointment` | AppointmentsContext | Appointment-staff assignment |
| `toggle_quote_production` | Production API | Toggle production status |
| `create_staff_for_clinic` | ConfigurationContext | Create new staff member |

## Storage

| Bucket | Operations | Used In |
|--------|-----------|---------|
| `patient-docs` | Upload, signed URL, delete | `src/lib/storage.ts` — patient files, consents, RX images, staff avatars |

## Auth Operations

| Method | Used In |
|--------|---------|
| `signInWithPassword` | Login page |
| `signInWithOAuth` (Google) | Login page |
| `signUp` | Register page |
| `signOut` | Account panel |
| `getUser` | 13+ locations (session checks) |
| `getSession` | 8+ locations (auth guards) |
| `exchangeCodeForSession` | OAuth callback |
| `onAuthStateChange` | Auth context listener |

---

## Dead Mock Data (safe to delete)

These constants are exported but **never imported or used** anywhere in the codebase:

| File | Constant | ~Lines | Notes |
|------|----------|--------|-------|
| `src/context/CashClosingContext.tsx` | `MOCK_TRANSACTIONS` | 115-862 | 46 hardcoded transactions — context uses `[]` + DB hydration |
| `src/context/CashClosingContext.tsx` | `INITIAL_MOCK_CLOSINGS` | 865+ | 6 hardcoded closings — never referenced |
| `src/context/CashClosingContext.tsx` | `MOCK_CLINIC_ID`, `MOCK_USER_ID` | 107-108 | Never imported |
| `src/context/PatientsContext.tsx` | `INITIAL_PATIENTS` | ~545 lines | Defined but `.slice(0, 0)` — always empty |
| `src/context/PatientFilesContext.tsx` | `INITIAL_PATIENT_FILES` | 44-85 | 3 sample files — not used |

## Minor Code Issue

| File | Issue | Impact |
|------|-------|--------|
| `src/context/ConfigurationContext.tsx` (~line 1530) | Fallback query to non-existent `discounts` table (correct table `clinic_discounts` is queried first) | Silent error in console if primary query fails — non-blocking |
