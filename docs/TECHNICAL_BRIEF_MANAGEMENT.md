# Technical Brief: Management Module (Dashboard) - klinikOS

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** MVP (First complete version)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Architecture:** Multi-tenant from the start

---

## ⚠️ FUNDAMENTAL PRINCIPLE

> **THE MANAGEMENT MODULE IS A READ-ONLY DASHBOARD THAT AGGREGATES DATA FROM ALL OTHER MODULES.**

The Management module **DOES NOT generate its own data**. It is an **aggregation and visualization layer** that consumes data from:

- **Patient Record** → `payments`, `budgets`, `invoices`, `treatments`
- **Schedule** → `appointments`, `visit_status_history`
- **Cash Register** → `cash_closings`, `cash_transactions_view`
- **Configuration** → `staff`, `specialties`, `clinic_settings`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW TO DASHBOARD                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ PATIENT RECORD  │──┐                                                     │
│  │ payments        │  │                                                     │
│  │ budgets         │  │                                                     │
│  │ treatments      │  │                                                     │
│  └─────────────────┘  │                                                     │
│                       │      ┌────────────────────────────────────┐         │
│  ┌─────────────────┐  │      │                                    │         │
│  │    SCHEDULE     │──┼─────►│     MANAGEMENT MODULE (Dashboard)  │         │
│  │ appointments    │  │      │                                    │         │
│  │ visit_status    │  │      │  • Read-only                       │         │
│  └─────────────────┘  │      │  • Data aggregation                │         │
│                       │      │  • Visualizations and KPIs         │         │
│  ┌─────────────────┐  │      │  • Filters by period/specialty     │         │
│  │ CASH REGISTER   │──┤      │                                    │         │
│  │ cash_closings   │  │      └────────────────────────────────────┘         │
│  │ transactions    │  │                                                     │
│  └─────────────────┘  │                                                     │
│                       │                                                     │
│  ┌─────────────────┐  │                                                     │
│  │ CONFIGURATION   │──┘                                                     │
│  │ staff           │                                                        │
│  │ specialties     │                                                        │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Overview

### 1.1 Description

The **Management Module** (Dashboard) is the clinic's business intelligence center. It provides an executive view of all key metrics: revenue, production, patients, performance by professional and by specialty.

### 1.2 Restricted Access

⚠️ **Only accessible to the Administrator role**. Other roles (Reception, Hygienist, Doctor) do not have access to this module.

### 1.3 Dashboard Components

| Component               | Description                  | Data Source                  |
| ----------------------- | ---------------------------- | ---------------------------- |
| **IncomeTypes**         | Breakdown by payment method  | `payments.payment_method`    |
| **PatientsSummary**     | Active patients, new, growth | `patients`, `appointments`   |
| **ProductionTotalCard** | Produced vs Invoiced         | `treatments`, `invoices`     |
| **BillingLineChart**    | Temporal billing evolution   | `invoices`, historical       |
| **SpecialtyDonut**      | Distribution by specialty    | `treatments.specialty`       |
| **AccountingPanel**     | Complete accounting KPIs     | `payments`, `invoices`       |
| **ProfessionalBars**    | Production by professional   | `appointments`, `treatments` |

### 1.4 Main Functionalities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MANAGEMENT MODULE (DASHBOARD)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 FINANCIAL METRICS                    📈 TEMPORAL ANALYSIS               │
│  ├─ Produced (work performed)            ├─ Billing evolution               │
│  ├─ Invoiced (budgets issued)            ├─ Previous year comparison        │
│  ├─ Collected (money received)           ├─ Trends by period                │
│  ├─ Pending collection                   └─ Projections                     │
│  └─ Breakdown by payment method                                             │
│                                                                             │
│  👥 PATIENT METRICS                      👨‍⚕️ PROFESSIONAL PERFORMANCE        │
│  ├─ Active patients                      ├─ Production per doctor           │
│  ├─ New patients                         ├─ Production per hygienist        │
│  ├─ Growth rate                          └─ Performance ranking             │
│  └─ Patient retention                                                       │
│                                                                             │
│  🏥 ANALYSIS BY SPECIALTY                🔍 AVAILABLE FILTERS               │
│  ├─ Conservative                         ├─ Period: Day / Week / Month      │
│  ├─ Orthodontics                         ├─ Specialty (interactive)         │
│  ├─ Implants                             └─ Temporal navigation             │
│  └─ Aesthetics                                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Time Periods

| Scale   | Description                    |
| ------- | ------------------------------ |
| `day`   | Daily view (selected day data) |
| `week`  | Weekly view (Monday to Sunday) |
| `month` | Monthly view (complete month)  |

### 1.6 Supported Specialties

```typescript
type Specialty = 'Conservadora' | 'Ortodoncia' | 'Implantes' | 'Estética'
// Conservative | Orthodontics | Implants | Aesthetics
```

---

## 2. Metrics and KPIs

### 2.1 Financial Metrics Definition

| Metric        | Definition                                     | Calculation                                              |
| ------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **Produced**  | Value of work performed (completed treatments) | `SUM(treatments.price) WHERE status = 'completed'`       |
| **Invoiced**  | Value of issued/accepted budgets               | `SUM(invoices.total) WHERE status IN ('issued', 'paid')` |
| **Collected** | Money effectively received                     | `SUM(payments.amount) WHERE status = 'Completado'`       |
| **Pending**   | Difference between invoiced and collected      | `Invoiced - Collected`                                   |

### 2.2 Metrics Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│                       FINANCIAL METRICS FLOW                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. PRODUCED (Work performed)                                             │
│     │                                                                     │
│     │  Treatment completed ────► Adds to "Produced"                       │
│     │                                                                     │
│     ▼                                                                     │
│  2. INVOICED (Budget issued)                                              │
│     │                                                                     │
│     │  Invoice/budget generated ────► Adds to "Invoiced"                  │
│     │                                                                     │
│     │  ⚠️ RATIO: Invoiced / Produced = % billing                          │
│     │                                                                     │
│     ▼                                                                     │
│  3. COLLECTED (Payment received)                                          │
│     │                                                                     │
│     │  Patient pays ────► Adds to "Collected"                             │
│     │                                                                     │
│     │  ⚠️ RATIO: Collected / Invoiced = % collection                      │
│     │                                                                     │
│     ▼                                                                     │
│  4. PENDING (Outstanding)                                                 │
│                                                                           │
│     Invoiced - Collected = "Pending"                                      │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Patient Metrics

| Metric     | Definition                           | Calculation                                                         |
| ---------- | ------------------------------------ | ------------------------------------------------------------------- |
| **Active** | Patients with activity in the period | `COUNT(DISTINCT patient_id) FROM appointments WHERE date IN period` |
| **New**    | Patients created in the period       | `COUNT(*) FROM patients WHERE created_at IN period`                 |
| **Growth** | Variation vs previous period         | `(New_current / New_previous - 1) * 100`                            |

### 2.4 Professional Metrics

| Metric                    | Definition                                    | Calculation                                                                           |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Production**            | Value of treatments performed by professional | `SUM(treatments.price) WHERE professional_id = X AND status = 'completed'`            |
| **Appointments attended** | Number of completed appointments              | `COUNT(*) FROM appointments WHERE professional_id = X AND visit_status = 'completed'` |

---

## 3. Data Architecture

### 3.1 Data Sources

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES FOR DASHBOARD                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│     payments       │     │    appointments    │     │    treatments      │
│                    │     │                    │     │                    │
│ • amount           │     │ • patient_id       │     │ • price            │
│ • payment_method   │     │ • professional_id  │     │ • specialty        │
│ • payment_date     │     │ • appointment_date │     │ • status           │
│ • status           │     │ • visit_status     │     │ • professional_id  │
└─────────┬──────────┘     └─────────┬──────────┘     └─────────┬──────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │   DASHBOARD AGGREGATION LAYER  │
                    │                                │
                    │   Materialized Views           │
                    │   Aggregation Functions        │
                    │   Metrics Cache                │
                    └────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│ financial_summary  │     │ patient_metrics    │     │ professional_stats │
│                    │     │                    │     │                    │
│ • produced         │     │ • active_count     │     │ • production       │
│ • invoiced         │     │ • new_count        │     │ • appointments     │
│ • collected        │     │ • growth_rate      │     │ • by_specialty     │
│ • pending          │     │                    │     │                    │
└────────────────────┘     └────────────────────┘     └────────────────────┘
```

### 3.2 No Own Tables Required

The Management module **DOES NOT need its own tables**. It uses:

1. **Views** to aggregate data in real-time
2. **Materialized Views** for pre-calculated metrics (performance)
3. **Functions** for complex calculations on demand

---

## 4. Database Functions

### 4.1 Function: Get Period Financial Metrics

```sql
CREATE OR REPLACE FUNCTION get_financial_metrics(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    produced DECIMAL,
    invoiced DECIMAL,
    collected DECIMAL,
    pending DECIMAL,
    produced_delta DECIMAL,
    invoiced_delta DECIMAL,
    collected_delta DECIMAL,
    by_method JSONB
) AS $$
DECLARE
    v_prev_start DATE;
    v_prev_end DATE;
    v_period_days INTEGER;
BEGIN
    -- Calculate previous period for comparison
    v_period_days := p_end_date - p_start_date + 1;
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1);

    RETURN QUERY
    WITH current_period AS (
        -- PRODUCED: Completed treatments
        SELECT
            COALESCE(SUM(t.price), 0) AS produced
        FROM patient_treatments t
        JOIN appointments a ON a.id = t.appointment_id
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        AND t.status = 'completed'
        AND (p_specialty IS NULL OR t.specialty = p_specialty)
    ),
    current_invoiced AS (
        -- INVOICED: Issued invoices
        SELECT
            COALESCE(SUM(i.total_amount), 0) AS invoiced
        FROM invoices i
        WHERE i.clinic_id = p_clinic_id
        AND i.invoice_date BETWEEN p_start_date AND p_end_date
        AND i.status IN ('issued', 'paid', 'partial')
        AND (p_specialty IS NULL OR EXISTS (
            SELECT 1 FROM invoice_items ii
            JOIN patient_treatments pt ON pt.id = ii.treatment_id
            WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
        ))
    ),
    current_collected AS (
        -- COLLECTED: Received payments
        SELECT
            COALESCE(SUM(p.amount), 0) AS collected,
            jsonb_build_object(
                'efectivo', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'efectivo'), 0),
                'tpv', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'tpv'), 0),
                'transferencia', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'transferencia'), 0),
                'financiacion', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'financiacion'), 0),
                'otros', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'otros'), 0)
            ) AS by_method
        FROM payments p
        WHERE p.clinic_id = p_clinic_id
        AND p.payment_date BETWEEN p_start_date AND p_end_date
        AND p.status = 'Completado'
        -- Filter by specialty through associated treatment
        AND (p_specialty IS NULL OR EXISTS (
            SELECT 1 FROM patient_treatments pt
            WHERE pt.budget_id = p.budget_id AND pt.specialty = p_specialty
        ))
    ),
    prev_period AS (
        -- Previous period for calculating deltas
        SELECT
            COALESCE(SUM(t.price), 0) AS prev_produced,
            (SELECT COALESCE(SUM(total_amount), 0)
             FROM invoices
             WHERE clinic_id = p_clinic_id
             AND invoice_date BETWEEN v_prev_start AND v_prev_end
             AND status IN ('issued', 'paid', 'partial')) AS prev_invoiced,
            (SELECT COALESCE(SUM(amount), 0)
             FROM payments
             WHERE clinic_id = p_clinic_id
             AND payment_date BETWEEN v_prev_start AND v_prev_end
             AND status = 'Completado') AS prev_collected
        FROM patient_treatments t
        JOIN appointments a ON a.id = t.appointment_id
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN v_prev_start AND v_prev_end
        AND t.status = 'completed'
        AND (p_specialty IS NULL OR t.specialty = p_specialty)
    )
    SELECT
        cp.produced,
        ci.invoiced,
        cc.collected,
        (ci.invoiced - cc.collected) AS pending,
        -- Deltas (% change)
        CASE WHEN pp.prev_produced > 0
            THEN ((cp.produced - pp.prev_produced) / pp.prev_produced * 100)
            ELSE 0
        END AS produced_delta,
        CASE WHEN pp.prev_invoiced > 0
            THEN ((ci.invoiced - pp.prev_invoiced) / pp.prev_invoiced * 100)
            ELSE 0
        END AS invoiced_delta,
        CASE WHEN pp.prev_collected > 0
            THEN ((cc.collected - pp.prev_collected) / pp.prev_collected * 100)
            ELSE 0
        END AS collected_delta,
        cc.by_method
    FROM current_period cp
    CROSS JOIN current_invoiced ci
    CROSS JOIN current_collected cc
    CROSS JOIN prev_period pp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Function: Get Patient Metrics

```sql
CREATE OR REPLACE FUNCTION get_patient_metrics(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    active_patients INTEGER,
    new_patients INTEGER,
    growth_rate DECIMAL,
    active_percent DECIMAL,
    new_percent DECIMAL
) AS $$
DECLARE
    v_prev_start DATE;
    v_prev_end DATE;
    v_period_days INTEGER;
    v_total_patients INTEGER;
BEGIN
    v_period_days := p_end_date - p_start_date + 1;
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1);

    -- Total clinic patients
    SELECT COUNT(*) INTO v_total_patients
    FROM patients
    WHERE clinic_id = p_clinic_id
    AND is_deleted = FALSE;

    RETURN QUERY
    WITH current_metrics AS (
        -- Active patients (with appointment in period)
        SELECT COUNT(DISTINCT a.patient_id) AS active_count
        FROM appointments a
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        AND a.is_cancelled = FALSE
        AND (p_specialty IS NULL OR EXISTS (
            SELECT 1 FROM appointment_linked_treatments alt
            JOIN patient_treatments pt ON pt.id = alt.treatment_id
            WHERE alt.appointment_id = a.id AND pt.specialty = p_specialty
        ))
    ),
    new_patients AS (
        -- New patients (created in period)
        SELECT COUNT(*) AS new_count
        FROM patients p
        WHERE p.clinic_id = p_clinic_id
        AND p.created_at::DATE BETWEEN p_start_date AND p_end_date
        AND p.is_deleted = FALSE
    ),
    prev_metrics AS (
        -- Previous period metrics
        SELECT
            COUNT(DISTINCT a.patient_id) AS prev_active,
            (SELECT COUNT(*) FROM patients
             WHERE clinic_id = p_clinic_id
             AND created_at::DATE BETWEEN v_prev_start AND v_prev_end
             AND is_deleted = FALSE) AS prev_new
        FROM appointments a
        WHERE a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN v_prev_start AND v_prev_end
        AND a.is_cancelled = FALSE
    )
    SELECT
        cm.active_count::INTEGER,
        np.new_count::INTEGER,
        CASE WHEN pm.prev_new > 0
            THEN ((np.new_count - pm.prev_new)::DECIMAL / pm.prev_new * 100)
            ELSE 0
        END AS growth_rate,
        CASE WHEN v_total_patients > 0
            THEN (cm.active_count::DECIMAL / v_total_patients * 100)
            ELSE 0
        END AS active_percent,
        CASE WHEN (cm.active_count + np.new_count) > 0
            THEN (np.new_count::DECIMAL / (cm.active_count + np.new_count) * 100)
            ELSE 0
        END AS new_percent
    FROM current_metrics cm
    CROSS JOIN new_patients np
    CROSS JOIN prev_metrics pm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 Function: Get Professional Production

```sql
CREATE OR REPLACE FUNCTION get_professional_production(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    professional_id UUID,
    professional_name VARCHAR,
    role VARCHAR,
    production DECIMAL,
    appointments_count INTEGER,
    specialties JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS professional_id,
        s.full_name AS professional_name,
        s.role,
        COALESCE(SUM(t.price), 0)::DECIMAL AS production,
        COUNT(DISTINCT a.id)::INTEGER AS appointments_count,
        (
            SELECT jsonb_agg(DISTINCT t2.specialty)
            FROM patient_treatments t2
            JOIN appointments a2 ON a2.id = t2.appointment_id
            WHERE a2.professional_id = s.id
            AND t2.specialty IS NOT NULL
        ) AS specialties
    FROM staff s
    LEFT JOIN appointments a ON a.professional_id = s.id
        AND a.clinic_id = p_clinic_id
        AND a.appointment_date BETWEEN p_start_date AND p_end_date
        AND a.visit_status = 'completed'
    LEFT JOIN patient_treatments t ON t.appointment_id = a.id
        AND t.status = 'completed'
        AND (p_specialty IS NULL OR t.specialty = p_specialty)
    WHERE s.clinic_id = p_clinic_id
    AND s.is_active = TRUE
    AND s.role IN ('Doctor', 'Higienista')
    GROUP BY s.id, s.full_name, s.role
    ORDER BY production DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.4 Function: Get Specialty Distribution

```sql
CREATE OR REPLACE FUNCTION get_specialty_distribution(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    specialty VARCHAR,
    invoiced DECIMAL,
    percentage DECIMAL,
    delta DECIMAL
) AS $$
DECLARE
    v_total_invoiced DECIMAL;
    v_prev_start DATE;
    v_prev_end DATE;
    v_period_days INTEGER;
BEGIN
    v_period_days := p_end_date - p_start_date + 1;
    v_prev_end := p_start_date - INTERVAL '1 day';
    v_prev_start := v_prev_end - (v_period_days - 1);

    -- Total invoiced for period
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_invoiced
    FROM invoices
    WHERE clinic_id = p_clinic_id
    AND invoice_date BETWEEN p_start_date AND p_end_date
    AND status IN ('issued', 'paid', 'partial');

    RETURN QUERY
    WITH specialty_invoiced AS (
        SELECT
            pt.specialty,
            COALESCE(SUM(ii.amount), 0) AS amount
        FROM invoices i
        JOIN invoice_items ii ON ii.invoice_id = i.id
        JOIN patient_treatments pt ON pt.id = ii.treatment_id
        WHERE i.clinic_id = p_clinic_id
        AND i.invoice_date BETWEEN p_start_date AND p_end_date
        AND i.status IN ('issued', 'paid', 'partial')
        AND pt.specialty IS NOT NULL
        GROUP BY pt.specialty
    ),
    prev_specialty AS (
        SELECT
            pt.specialty,
            COALESCE(SUM(ii.amount), 0) AS prev_amount
        FROM invoices i
        JOIN invoice_items ii ON ii.invoice_id = i.id
        JOIN patient_treatments pt ON pt.id = ii.treatment_id
        WHERE i.clinic_id = p_clinic_id
        AND i.invoice_date BETWEEN v_prev_start AND v_prev_end
        AND i.status IN ('issued', 'paid', 'partial')
        AND pt.specialty IS NOT NULL
        GROUP BY pt.specialty
    )
    SELECT
        si.specialty,
        si.amount AS invoiced,
        CASE WHEN v_total_invoiced > 0
            THEN (si.amount / v_total_invoiced * 100)
            ELSE 0
        END AS percentage,
        CASE WHEN COALESCE(ps.prev_amount, 0) > 0
            THEN ((si.amount - COALESCE(ps.prev_amount, 0)) / ps.prev_amount * 100)
            ELSE 0
        END AS delta
    FROM specialty_invoiced si
    LEFT JOIN prev_specialty ps ON ps.specialty = si.specialty
    ORDER BY si.amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.5 Function: Get Billing Evolution

```sql
CREATE OR REPLACE FUNCTION get_billing_evolution(
    p_clinic_id UUID,
    p_time_scale VARCHAR, -- 'week' | 'month'
    p_anchor_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    period_label VARCHAR,
    period_start DATE,
    current_value DECIMAL,
    previous_year_value DECIMAL
) AS $$
BEGIN
    IF p_time_scale = 'month' THEN
        RETURN QUERY
        WITH periods AS (
            SELECT
                generate_series(
                    DATE_TRUNC('month', p_anchor_date) - INTERVAL '9 months',
                    DATE_TRUNC('month', p_anchor_date) + INTERVAL '2 months',
                    INTERVAL '1 month'
                )::DATE AS period_start
        )
        SELECT
            TO_CHAR(p.period_start, 'Mon') AS period_label,
            p.period_start,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND DATE_TRUNC('month', i.invoice_date) = p.period_start
                AND i.status IN ('issued', 'paid', 'partial')
                AND p.period_start <= DATE_TRUNC('month', CURRENT_DATE)
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS current_value,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND DATE_TRUNC('month', i.invoice_date) = p.period_start - INTERVAL '1 year'
                AND i.status IN ('issued', 'paid', 'partial')
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS previous_year_value
        FROM periods p
        ORDER BY p.period_start;
    ELSE -- week
        RETURN QUERY
        WITH periods AS (
            SELECT
                generate_series(
                    DATE_TRUNC('week', p_anchor_date) - INTERVAL '9 weeks',
                    DATE_TRUNC('week', p_anchor_date) + INTERVAL '2 weeks',
                    INTERVAL '1 week'
                )::DATE AS period_start
        )
        SELECT
            'W' || EXTRACT(WEEK FROM p.period_start)::TEXT AS period_label,
            p.period_start,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND i.invoice_date >= p.period_start
                AND i.invoice_date < p.period_start + INTERVAL '1 week'
                AND i.status IN ('issued', 'paid', 'partial')
                AND p.period_start <= DATE_TRUNC('week', CURRENT_DATE)
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS current_value,
            COALESCE((
                SELECT SUM(i.total_amount)
                FROM invoices i
                WHERE i.clinic_id = p_clinic_id
                AND i.invoice_date >= p.period_start - INTERVAL '1 year'
                AND i.invoice_date < p.period_start - INTERVAL '1 year' + INTERVAL '1 week'
                AND i.status IN ('issued', 'paid', 'partial')
                AND (p_specialty IS NULL OR EXISTS (
                    SELECT 1 FROM invoice_items ii
                    JOIN patient_treatments pt ON pt.id = ii.treatment_id
                    WHERE ii.invoice_id = i.id AND pt.specialty = p_specialty
                ))
            ), 0)::DECIMAL AS previous_year_value
        FROM periods p
        ORDER BY p.period_start;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.6 Function: Get Complete Dashboard

```sql
-- Main function that returns all dashboard data
CREATE OR REPLACE FUNCTION get_dashboard_data(
    p_clinic_id UUID,
    p_time_scale VARCHAR, -- 'day' | 'week' | 'month'
    p_anchor_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_result JSONB;
BEGIN
    -- Calculate date range based on scale
    CASE p_time_scale
        WHEN 'day' THEN
            v_start_date := p_anchor_date;
            v_end_date := p_anchor_date;
        WHEN 'week' THEN
            v_start_date := DATE_TRUNC('week', p_anchor_date)::DATE;
            v_end_date := v_start_date + INTERVAL '6 days';
        WHEN 'month' THEN
            v_start_date := DATE_TRUNC('month', p_anchor_date)::DATE;
            v_end_date := (DATE_TRUNC('month', p_anchor_date) + INTERVAL '1 month - 1 day')::DATE;
        ELSE
            v_start_date := DATE_TRUNC('week', p_anchor_date)::DATE;
            v_end_date := v_start_date + INTERVAL '6 days';
    END CASE;

    -- Build JSON response with all data
    SELECT jsonb_build_object(
        'period', jsonb_build_object(
            'start_date', v_start_date,
            'end_date', v_end_date,
            'time_scale', p_time_scale,
            'specialty_filter', p_specialty
        ),
        'financial', (
            SELECT row_to_json(f.*)
            FROM get_financial_metrics(p_clinic_id, v_start_date, v_end_date, p_specialty) f
        ),
        'patients', (
            SELECT row_to_json(p.*)
            FROM get_patient_metrics(p_clinic_id, v_start_date, v_end_date, p_specialty) p
        ),
        'professionals', (
            SELECT jsonb_agg(row_to_json(pr.*))
            FROM get_professional_production(p_clinic_id, v_start_date, v_end_date, p_specialty) pr
        ),
        'specialties', (
            SELECT jsonb_agg(row_to_json(s.*))
            FROM get_specialty_distribution(p_clinic_id, v_start_date, v_end_date) s
        ),
        'billing_evolution', (
            SELECT jsonb_agg(row_to_json(b.*))
            FROM get_billing_evolution(p_clinic_id, p_time_scale, p_anchor_date, p_specialty) b
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Materialized Views (Optimization)

### 5.1 Materialized View: Daily Summary

```sql
-- To improve performance in dashboards querying historical data
CREATE MATERIALIZED VIEW daily_dashboard_summary AS
SELECT
    clinic_id,
    date,
    -- Financial metrics
    produced,
    invoiced,
    collected,
    (invoiced - collected) AS pending,
    -- Patient metrics
    active_patients,
    new_patients,
    -- Payment method breakdown
    by_payment_method,
    -- Specialty breakdown
    by_specialty,
    -- Professional breakdown
    by_professional
FROM (
    SELECT
        a.clinic_id,
        a.appointment_date AS date,
        -- Produced
        COALESCE(SUM(t.price) FILTER (WHERE t.status = 'completed'), 0) AS produced,
        -- Invoiced (simplified)
        (SELECT COALESCE(SUM(total_amount), 0)
         FROM invoices
         WHERE clinic_id = a.clinic_id
         AND invoice_date = a.appointment_date) AS invoiced,
        -- Collected
        (SELECT COALESCE(SUM(amount), 0)
         FROM payments
         WHERE clinic_id = a.clinic_id
         AND payment_date = a.appointment_date
         AND status = 'Completado') AS collected,
        -- Patients
        COUNT(DISTINCT a.patient_id) AS active_patients,
        (SELECT COUNT(*) FROM patients
         WHERE clinic_id = a.clinic_id
         AND created_at::DATE = a.appointment_date) AS new_patients,
        -- Payment method breakdown
        (SELECT jsonb_object_agg(payment_method, total)
         FROM (
             SELECT payment_method, SUM(amount) AS total
             FROM payments
             WHERE clinic_id = a.clinic_id
             AND payment_date = a.appointment_date
             AND status = 'Completado'
             GROUP BY payment_method
         ) pm) AS by_payment_method,
        -- Specialty breakdown
        (SELECT jsonb_object_agg(specialty, total)
         FROM (
             SELECT t2.specialty, SUM(t2.price) AS total
             FROM patient_treatments t2
             JOIN appointments a2 ON a2.id = t2.appointment_id
             WHERE a2.clinic_id = a.clinic_id
             AND a2.appointment_date = a.appointment_date
             AND t2.status = 'completed'
             GROUP BY t2.specialty
         ) sp) AS by_specialty,
        -- Professional breakdown
        (SELECT jsonb_object_agg(professional_id::TEXT, total)
         FROM (
             SELECT a3.professional_id, SUM(t3.price) AS total
             FROM appointments a3
             JOIN patient_treatments t3 ON t3.appointment_id = a3.id
             WHERE a3.clinic_id = a.clinic_id
             AND a3.appointment_date = a.appointment_date
             AND t3.status = 'completed'
             GROUP BY a3.professional_id
         ) prof) AS by_professional
    FROM appointments a
    LEFT JOIN patient_treatments t ON t.appointment_id = a.id
    WHERE a.is_cancelled = FALSE
    GROUP BY a.clinic_id, a.appointment_date
) aggregated;

CREATE UNIQUE INDEX idx_daily_dashboard_summary
ON daily_dashboard_summary(clinic_id, date);

-- Refresh daily (cron job or trigger)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_dashboard_summary;
```

---

## 6. Row Level Security (RLS)

### 6.1 Administrator-Only Access

```sql
-- Dashboard functions use SECURITY DEFINER
-- Access control is done at application level

-- Helper function to verify administrator role
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'Administrador'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security wrapper for dashboard
CREATE OR REPLACE FUNCTION get_dashboard_data_secure(
    p_clinic_id UUID,
    p_time_scale VARCHAR,
    p_anchor_date DATE,
    p_specialty VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    -- Verify user is administrator
    IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Access denied: Administrator role required';
    END IF;

    -- Verify user belongs to clinic
    IF p_clinic_id != get_user_clinic_id() THEN
        RAISE EXCEPTION 'Access denied: unauthorized clinic';
    END IF;

    RETURN get_dashboard_data(p_clinic_id, p_time_scale, p_anchor_date, p_specialty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. Connections with Other Modules

### 7.1 Connection Map (Read-Only)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              MANAGEMENT MODULE CONNECTIONS (READ-ONLY)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │ PATIENT RECORD  │                      │    SCHEDULE     │               │
│  │                 │                      │                 │               │
│  │ payments ───────┼──────────────────────┼─► appointments  │               │
│  │ budgets ────────┼──────┐               │   visit_status  │               │
│  │ treatments ─────┼──────┤               └────────┬────────┘               │
│  │ invoices ───────┼──────┤                        │                        │
│  └─────────────────┘      │                        │                        │
│                           │                        │                        │
│                           ▼                        ▼                        │
│                    ┌─────────────────────────────────────┐                  │
│                    │                                     │                  │
│                    │       MANAGEMENT MODULE             │                  │
│                    │         (Dashboard)                 │                  │
│                    │                                     │                  │
│                    │  ┌─────────────────────────────┐   │                  │
│                    │  │  READ-ONLY from:            │   │                  │
│                    │  │  • payments                 │   │                  │
│                    │  │  • invoices                 │   │                  │
│                    │  │  • treatments               │   │                  │
│                    │  │  • appointments             │   │                  │
│                    │  │  • patients                 │   │                  │
│                    │  │  • staff                    │   │                  │
│                    │  └─────────────────────────────┘   │                  │
│                    │                                     │                  │
│                    └─────────────────────────────────────┘                  │
│                           ▲                        ▲                        │
│                           │                        │                        │
│  ┌─────────────────┐      │                        │                        │
│  │ CASH REGISTER   │──────┘               ┌────────┴────────┐               │
│  │                 │                      │ CONFIGURATION   │               │
│  │ cash_closings   │                      │                 │               │
│  │ transactions    │                      │ staff           │               │
│  └─────────────────┘                      │ specialties     │               │
│                                           │ clinic_settings │               │
│                                           └─────────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Connection Queries

#### 7.2.1 Patient Record Data

```sql
-- Patient financial metrics
SELECT
    p.id AS patient_id,
    p.full_name,
    COALESCE(SUM(pay.amount), 0) AS total_paid,
    COALESCE(SUM(b.total_amount), 0) AS total_budgeted,
    COUNT(DISTINCT t.id) AS treatments_count
FROM patients p
LEFT JOIN payments pay ON pay.patient_id = p.id AND pay.status = 'Completado'
LEFT JOIN budgets b ON b.patient_id = p.id
LEFT JOIN patient_treatments t ON t.patient_id = p.id
WHERE p.clinic_id = :clinic_id
GROUP BY p.id, p.full_name;
```

#### 7.2.2 Schedule Data

```sql
-- Appointment and professional metrics
SELECT
    s.id AS professional_id,
    s.full_name,
    s.role,
    COUNT(a.id) AS total_appointments,
    COUNT(a.id) FILTER (WHERE a.visit_status = 'completed') AS completed,
    COUNT(a.id) FILTER (WHERE a.visit_status = 'no_show') AS no_shows
FROM staff s
LEFT JOIN appointments a ON a.professional_id = s.id
    AND a.appointment_date BETWEEN :start_date AND :end_date
WHERE s.clinic_id = :clinic_id
AND s.is_active = TRUE
GROUP BY s.id, s.full_name, s.role;
```

#### 7.2.3 Cash Register Data

```sql
-- Cash closing metrics
SELECT
    DATE_TRUNC(:time_scale, closing_date) AS period,
    SUM(total_income) AS total_income,
    SUM(total_expenses) AS total_expenses,
    AVG(final_balance) AS avg_balance,
    jsonb_object_agg(
        closing_date::TEXT,
        income_by_method
    ) AS daily_breakdown
FROM cash_closings
WHERE clinic_id = :clinic_id
AND closing_date BETWEEN :start_date AND :end_date
AND status = 'closed'
GROUP BY DATE_TRUNC(:time_scale, closing_date);
```

---

## 8. Indexes and Optimization

### 8.1 Critical Indexes for Dashboard

```sql
-- Index for financial metrics by period
CREATE INDEX CONCURRENTLY idx_payments_dashboard
ON payments(clinic_id, payment_date, status, payment_method)
WHERE status = 'Completado';

-- Index for production metrics
CREATE INDEX CONCURRENTLY idx_treatments_dashboard
ON patient_treatments(appointment_id, status, specialty, price)
WHERE status = 'completed';

-- Index for patient metrics
CREATE INDEX CONCURRENTLY idx_appointments_dashboard
ON appointments(clinic_id, appointment_date, professional_id, visit_status)
WHERE is_cancelled = FALSE;

-- Index for invoicing
CREATE INDEX CONCURRENTLY idx_invoices_dashboard
ON invoices(clinic_id, invoice_date, status, total_amount)
WHERE status IN ('issued', 'paid', 'partial');

-- Index for new patients
CREATE INDEX CONCURRENTLY idx_patients_created
ON patients(clinic_id, created_at)
WHERE is_deleted = FALSE;
```

### 8.2 Caching Strategy

```sql
-- Configure function caching (if Supabase supports it)
-- Alternatively, use Redis or application cache

-- Materialized views are refreshed:
-- - daily_dashboard_summary: Once daily (midnight)
-- - Or on demand when day's cash register is closed

-- Trigger to invalidate cache when significant changes occur
CREATE OR REPLACE FUNCTION invalidate_dashboard_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark cache as invalid (implementation specific)
    PERFORM pg_notify('dashboard_cache_invalidate',
        json_build_object(
            'clinic_id', COALESCE(NEW.clinic_id, OLD.clinic_id),
            'date', CURRENT_DATE
        )::TEXT
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER trg_invalidate_dashboard_payments
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION invalidate_dashboard_cache();

CREATE TRIGGER trg_invalidate_dashboard_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION invalidate_dashboard_cache();
```

---

## 9. Suggested Implementation Plan

### Phase 1: Foundations (Week 1)

- [ ] Verify all source tables exist
- [ ] Create helper functions (`is_admin_user`, etc.)
- [ ] Implement `get_financial_metrics()`
- [ ] Implement `get_patient_metrics()`

### Phase 2: Analysis Functions (Week 2)

- [ ] Implement `get_professional_production()`
- [ ] Implement `get_specialty_distribution()`
- [ ] Implement `get_billing_evolution()`
- [ ] Create main function `get_dashboard_data()`

### Phase 3: Optimization (Week 3)

- [ ] Create performance indexes
- [ ] Implement materialized view `daily_dashboard_summary`
- [ ] Configure automatic refresh
- [ ] Performance testing

### Phase 4: Security and API (Week 4)

- [ ] Implement `get_dashboard_data_secure()`
- [ ] Create API endpoints (Edge Functions)
- [ ] Security testing
- [ ] API documentation

---

## 10. References

### 10.1 Related Frontend Files

```
src/
├── app/
│   └── gestion/page.tsx                   # Main dashboard page
│
├── components/gestion/
│   ├── AccountingPanel.tsx                # Accounting panel
│   ├── BillingLineChart.tsx               # Billing chart
│   ├── IncomeTypes.tsx                    # Payment methods
│   ├── PatientsSummary.tsx                # Patient metrics
│   ├── ProductionTotalCard.tsx            # Produced vs Invoiced
│   ├── ProfessionalBars.tsx               # Bars by professional
│   ├── SpecialtyDonut.tsx                 # Donut by specialty
│   └── gestionTypes.ts                    # Types
│
└── components/caja/
    └── CashToolbar.tsx                    # Reused for navigation
```

### 10.2 Related Documents

- **TECHNICAL_BRIEF_PATIENT_RECORD.md** - Tables: `payments`, `budgets`, `treatments`, `invoices`
- **TECHNICAL_BRIEF_SCHEDULE.md** - Tables: `appointments`, `staff`
- **TECHNICAL_BRIEF_CASH_REGISTER.md** - Tables: `cash_closings`

---

## 11. Important Notes

### 11.1 Read-Only Principle

⚠️ **CRITICAL:** The Management module should **NEVER**:

- Create records in any table
- Modify existing data
- Delete information

It only has **SELECT** permissions on the tables it queries.

### 11.2 Data Consistency

The dashboard shows real-time data. If historical consistency is required:

1. Use the materialized view `daily_dashboard_summary` for closed days data
2. Query real-time only for current day
3. Cash closings (`cash_closings`) provide official "snapshots"

### 11.3 Performance

For clinics with high data volume:

1. Always use date filters (`WHERE date BETWEEN...`)
2. Avoid queries without time limits
3. Consider table partitioning by date if volume grows

---

_Document generated on February 2, 2026_  
_Version 1.0 - Complete MVP_
