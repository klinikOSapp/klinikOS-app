# Technical Brief: Cash Register Module - klinikOS

**Date:** February 2, 2026  
**Version:** 1.0  
**Status:** MVP (First complete version)  
**Backend:** Supabase (PostgreSQL + Edge Functions)  
**Architecture:** Multi-tenant from the start

---

## ⚠️ FUNDAMENTAL PRINCIPLE

> **ALL INFORMATION IN THE CASH REGISTER MODULE COMES FROM THE PATIENT RECORD'S FINANCE MODULE.**

The Cash Register module **DOES NOT generate its own data**. It is an **aggregated and management view** over financial data that originates from:

- **Budgets** (`budgets`) → Patient Record > Finances
- **Payments** (`payments`) → Patient Record > Finances
- **Financing installments** (`installments`) → Patient Record > Finances
- **Invoices** (`invoices`) → Patient Record > Finances

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PATIENT RECORD                          CASH REGISTER MODULE              │
│   (Finance Module)                        (Aggregated View)                 │
│                                                                             │
│   ┌─────────────┐                                                           │
│   │   Accepted  │──┐                                                        │
│   │   Budget    │  │     ┌──────────────┐     ┌──────────────────────┐     │
│   └─────────────┘  │     │              │     │                      │     │
│                    ├────►│   payments   │────►│  cash_transactions   │     │
│   ┌─────────────┐  │     │   (table)    │     │  (aggregated view)   │     │
│   │  Registered │──┤     │              │     │                      │     │
│   │   Payment   │  │     └──────────────┘     └──────────────────────┘     │
│   └─────────────┘  │            ▲                      │                   │
│                    │            │                      ▼                   │
│   ┌─────────────┐  │            │             ┌──────────────────────┐     │
│   │    Paid     │──┘            │             │   cash_closings      │     │
│   │ Installment │               │             │   (daily closings)   │     │
│   └─────────────┘               │             └──────────────────────┘     │
│                                 │                                          │
│                    DATA         │                                          │
│                    SOURCE       │                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Overview

### 1.1 Description

The **Cash Register Module** is the clinic's daily financial control center. It provides a consolidated view of all money movements, enabling payment tracking, daily cash closing, and report generation.

### 1.2 Module Components

| Component           | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| **Daily Summary**   | Day's KPIs: income, collected vs invoiced, breakdown by method |
| **Movements Table** | List of all transactions for the selected period               |
| **Cash Closing**    | Modal to close the day with summary and export                 |
| **Trend**           | Income evolution chart                                         |

### 1.3 Main Functionalities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CASH REGISTER MODULE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 DASHBOARD                        📋 MOVEMENTS                           │
│  ├─ Period income                    ├─ Transactions table                  │
│  ├─ Collected vs Invoiced            ├─ Date filters                        │
│  ├─ By payment method                ├─ Method filters                      │
│  ├─ By professional                  ├─ Patient search                      │
│  └─ Period comparison                └─ Quick actions                       │
│                                                                             │
│  💰 CASH CLOSING                     🧾 INVOICING                           │
│  ├─ Day summary                      ├─ View invoice                        │
│  ├─ Method breakdown                 ├─ Generate invoice                    │
│  ├─ Cash withdrawal                  ├─ Print receipt                       │
│  ├─ Export to Excel                  └─ Send by email                       │
│  └─ Reopen closing                                                          │
│                                                                             │
│  🔗 CONNECTIONS                      📈 METRICS                             │
│  ├─ Patient Record → Finances        ├─ Collection rate                     │
│  ├─ Schedule → Appointment payments  ├─ Preferred method                    │
│  ├─ Budgets → Installments           ├─ Temporal evolution                  │
│  └─ Daily Report → Production        └─ Pending collection                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Supported Payment Methods

| Method            | Code            | Description         |
| ----------------- | --------------- | ------------------- |
| **Cash**          | `efectivo`      | Cash payment        |
| **Card Terminal** | `tpv`           | Credit/debit card   |
| **Bank Transfer** | `transferencia` | Bank transfer       |
| **Financing**     | `financiacion`  | Installment payment |
| **Other**         | `otros`         | Bizum, check, etc.  |

### 1.5 Transaction States

| Payment Status        | Production Status               |
| --------------------- | ------------------------------- |
| `cobrado` - Collected | `hecho` - Treatment done        |
| `pendiente` - Pending | `pendiente` - Treatment pending |

---

## 2. Data Architecture

### 2.1 Data Source Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SOURCE: PATIENT RECORD > FINANCES                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     BUDGETS     │     │    PAYMENTS     │     │   INSTALLMENTS  │
│                 │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         └─────────────►│ cash_transactions│◄─────────────┘
                        │   (View/Query)  │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  cash_closings  │
                        │(Cash closings)  │
                        └─────────────────┘
```

### 2.2 Relationship with Other Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CASH REGISTER MODULE RELATIONSHIPS                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                      ┌─────────────────┐               │
│  │ PATIENT RECORD  │                      │    SCHEDULE     │               │
│  │   (Finances)    │                      │                 │               │
│  ├─────────────────┤                      ├─────────────────┤               │
│  │ • payments      │─────────┬───────────►│ • appointment   │               │
│  │ • budgets       │         │            │   payments      │               │
│  │ • installments  │         │            └─────────────────┘               │
│  │ • invoices      │         │                                              │
│  └────────┬────────┘         │                                              │
│           │                  │                                              │
│           │    SINGLE        │                                              │
│           │    SOURCE        ▼                                              │
│           │    OF       ┌───────────────┐                                   │
│           │    DATA     │ CASH REGISTER │                                   │
│           └────────────►│    MODULE     │                                   │
│                         │               │                                   │
│                         │ Aggregated    │                                   │
│                         │ view of       │                                   │
│                         │ payments      │                                   │
│                         └───────┬───────┘                                   │
│                                 │                                           │
│                                 ▼                                           │
│                         ┌─────────────────┐                                 │
│                         │  DAILY REPORT   │                                 │
│                         │  (Production)   │                                 │
│                         └─────────────────┘                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 Table: `payments` (Source - Defined in Patient Record)

**NOTE:** This table is already defined in the Patient Record Brief. Shown here for reference.

```sql
-- See complete definition in TECHNICAL_BRIEF_PATIENT_RECORD.md
-- This table is the DATA SOURCE for Cash Register

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- References to payment source
    budget_id UUID REFERENCES budgets(id),
    appointment_id UUID REFERENCES appointments(id),
    invoice_id UUID REFERENCES invoices(id),
    installment_id UUID REFERENCES installments(id), -- Specific installment paid

    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(50) NOT NULL
        CHECK (payment_method IN ('efectivo', 'tpv', 'transferencia', 'financiacion', 'otros')),

    -- External reference (e.g.: transfer number)
    reference VARCHAR(100),
    concept TEXT,

    -- Date and time
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_time TIME DEFAULT CURRENT_TIME,

    -- States
    status VARCHAR(20) DEFAULT 'Completado'
        CHECK (status IN ('Pendiente', 'Completado', 'Anulado', 'Devuelto')),
    production_status VARCHAR(20) DEFAULT 'pendiente'
        CHECK (production_status IN ('hecho', 'pendiente')),

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

-- Indexes for Cash Register
CREATE INDEX idx_payments_date ON payments(clinic_id, payment_date);
CREATE INDEX idx_payments_method ON payments(clinic_id, payment_date, payment_method);
CREATE INDEX idx_payments_status ON payments(clinic_id, status, payment_date);
```

### 3.2 Table: `cash_closings` (Cash Closings)

```sql
CREATE TABLE cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Closing day (unique per clinic)
    closing_date DATE NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by UUID NOT NULL REFERENCES auth.users(id),
    closed_by_name VARCHAR(150),

    -- Cash data
    initial_cash DECIMAL(10,2) NOT NULL DEFAULT 0, -- Opening cash balance
    total_income DECIMAL(10,2) NOT NULL DEFAULT 0, -- Total collected income
    total_expenses DECIMAL(10,2) NOT NULL DEFAULT 0, -- Total expenses (if applicable)
    cash_outflow DECIMAL(10,2) NOT NULL DEFAULT 0, -- Cash withdrawn
    final_balance DECIMAL(10,2) NOT NULL DEFAULT 0, -- Final balance

    -- Breakdown by payment method (JSONB for flexibility)
    income_by_method JSONB NOT NULL DEFAULT '{
        "efectivo": 0,
        "tpv": 0,
        "transferencia": 0,
        "financiacion": 0,
        "otros": 0
    }',

    -- Counters
    transaction_count INTEGER NOT NULL DEFAULT 0,
    collected_count INTEGER DEFAULT 0, -- Collected transactions
    pending_count INTEGER DEFAULT 0, -- Pending transactions

    -- Closing status
    status VARCHAR(20) NOT NULL DEFAULT 'closed'
        CHECK (status IN ('open', 'closed', 'reopened')),

    -- Reopening
    reopened_at TIMESTAMPTZ,
    reopened_by UUID REFERENCES auth.users(id),
    reopen_reason TEXT,

    -- Closing notes
    notes TEXT,

    -- Constraint: one closing per day per clinic
    CONSTRAINT unique_closing_per_clinic_date UNIQUE (clinic_id, closing_date)
);

CREATE INDEX idx_cash_closings_clinic_date ON cash_closings(clinic_id, closing_date DESC);
CREATE INDEX idx_cash_closings_status ON cash_closings(clinic_id, status);
```

### 3.3 Table: `receipts` (Receipts)

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

    -- Receipt number (unique per clinic)
    receipt_number VARCHAR(50) NOT NULL,

    -- Relationships
    payment_id UUID NOT NULL REFERENCES payments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- Receipt data (copy for history)
    patient_name VARCHAR(255) NOT NULL,
    concept TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100),

    -- Clinic data (for the receipt)
    clinic_name VARCHAR(200) NOT NULL,
    clinic_nif VARCHAR(20),
    clinic_address TEXT,

    -- Issue date
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),

    -- Generated PDF
    pdf_storage_path TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_receipt_number_per_clinic UNIQUE (clinic_id, receipt_number)
);

CREATE INDEX idx_receipts_payment ON receipts(payment_id);
CREATE INDEX idx_receipts_patient ON receipts(patient_id);
CREATE INDEX idx_receipts_date ON receipts(clinic_id, issued_date DESC);
```

### 3.4 View: `cash_transactions_view` (Aggregated View for Cash Register)

```sql
-- This view aggregates payment data with patient and appointment information
-- This is the DATA SOURCE for the Cash Register movements table

CREATE OR REPLACE VIEW cash_transactions_view AS
SELECT
    p.id,
    p.clinic_id,
    p.payment_date AS transaction_date,
    p.payment_time AS transaction_time,
    p.created_at,

    -- Patient data
    p.patient_id,
    pat.full_name AS patient_name,
    pat.phone AS patient_phone,

    -- Payment data
    p.concept,
    p.amount,
    p.currency,
    p.payment_method,
    p.reference,
    p.status AS payment_status,
    p.production_status,

    -- References
    p.budget_id,
    p.appointment_id,
    p.invoice_id,
    p.installment_id,

    -- Additional budget data (if applicable)
    b.budget_number,
    b.budget_name AS budget_description,

    -- Appointment data (if applicable)
    a.appointment_date,
    a.professional_name,
    a.reason AS appointment_reason,

    -- Invoice data (if exists)
    inv.invoice_number,

    -- Associated cash closing
    cc.id AS closing_id,
    cc.status AS closing_status

FROM payments p
JOIN patients pat ON pat.id = p.patient_id
LEFT JOIN budgets b ON b.id = p.budget_id
LEFT JOIN appointments a ON a.id = p.appointment_id
LEFT JOIN invoices inv ON inv.id = p.invoice_id
LEFT JOIN cash_closings cc ON cc.clinic_id = p.clinic_id
    AND cc.closing_date = p.payment_date
    AND cc.status = 'closed'
WHERE p.status != 'Anulado';

-- Index to improve view performance
CREATE INDEX idx_payments_for_cash_view ON payments(clinic_id, payment_date, status)
WHERE status != 'Anulado';
```

---

## 4. Triggers

### 4.1 Trigger: Auto-generate Receipt Number

```sql
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
    v_next_number INTEGER;
    v_prefix VARCHAR(10);
    v_year VARCHAR(4);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Get clinic prefix
    SELECT COALESCE(receipt_number_prefix, 'REC') INTO v_prefix
    FROM clinic_settings
    WHERE clinic_id = NEW.clinic_id;

    -- Get next number for the year
    SELECT COALESCE(MAX(
        CAST(NULLIF(regexp_replace(receipt_number, '[^0-9]', '', 'g'), '') AS INTEGER)
    ), 0) + 1
    INTO v_next_number
    FROM receipts
    WHERE clinic_id = NEW.clinic_id
    AND issued_date >= DATE_TRUNC('year', CURRENT_DATE);

    NEW.receipt_number := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 6, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    WHEN (NEW.receipt_number IS NULL)
    EXECUTE FUNCTION generate_receipt_number();
```

### 4.2 Trigger: Update Closing Totals When Payments are Modified

```sql
CREATE OR REPLACE FUNCTION update_closing_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_closing_id UUID;
    v_totals RECORD;
BEGIN
    -- Find day's closing (if exists and is reopened)
    SELECT id INTO v_closing_id
    FROM cash_closings
    WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
    AND closing_date = COALESCE(NEW.payment_date, OLD.payment_date)
    AND status = 'reopened';

    -- If there's a reopened closing, update totals
    IF v_closing_id IS NOT NULL THEN
        SELECT
            COUNT(*) AS transaction_count,
            COUNT(*) FILTER (WHERE status = 'Completado') AS collected_count,
            COUNT(*) FILTER (WHERE status = 'Pendiente') AS pending_count,
            COALESCE(SUM(amount) FILTER (WHERE status = 'Completado'), 0) AS total_income,
            jsonb_build_object(
                'efectivo', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'efectivo' AND status = 'Completado'), 0),
                'tpv', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'tpv' AND status = 'Completado'), 0),
                'transferencia', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'transferencia' AND status = 'Completado'), 0),
                'financiacion', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'financiacion' AND status = 'Completado'), 0),
                'otros', COALESCE(SUM(amount) FILTER (WHERE payment_method = 'otros' AND status = 'Completado'), 0)
            ) AS income_by_method
        INTO v_totals
        FROM payments
        WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
        AND payment_date = COALESCE(NEW.payment_date, OLD.payment_date)
        AND status != 'Anulado';

        UPDATE cash_closings
        SET
            transaction_count = v_totals.transaction_count,
            collected_count = v_totals.collected_count,
            pending_count = v_totals.pending_count,
            total_income = v_totals.total_income,
            income_by_method = v_totals.income_by_method,
            final_balance = initial_cash + v_totals.total_income - total_expenses - cash_outflow,
            updated_at = NOW()
        WHERE id = v_closing_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_closing_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_closing_totals();
```

---

## 5. Database Functions

### 5.1 Function: Get Day Summary

```sql
CREATE OR REPLACE FUNCTION get_day_summary(
    p_clinic_id UUID,
    p_date DATE
)
RETURNS TABLE (
    transaction_date DATE,
    initial_cash DECIMAL,
    total_income DECIMAL,
    total_expenses DECIMAL,
    final_balance DECIMAL,
    income_by_method JSONB,
    transaction_count INTEGER,
    collected_count INTEGER,
    pending_count INTEGER,
    is_closed BOOLEAN,
    closing_id UUID
) AS $$
DECLARE
    v_closing cash_closings%ROWTYPE;
BEGIN
    -- Check if closing exists
    SELECT * INTO v_closing
    FROM cash_closings cc
    WHERE cc.clinic_id = p_clinic_id
    AND cc.closing_date = p_date;

    IF v_closing.id IS NOT NULL AND v_closing.status = 'closed' THEN
        -- Return closing data
        RETURN QUERY
        SELECT
            p_date,
            v_closing.initial_cash,
            v_closing.total_income,
            v_closing.total_expenses,
            v_closing.final_balance,
            v_closing.income_by_method,
            v_closing.transaction_count,
            v_closing.collected_count,
            v_closing.pending_count,
            TRUE,
            v_closing.id;
    ELSE
        -- Calculate real-time data from payments
        RETURN QUERY
        SELECT
            p_date,
            COALESCE(v_closing.initial_cash, 100.00)::DECIMAL, -- Default initial
            COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0)::DECIMAL,
            0::DECIMAL, -- Expenses (to be implemented)
            (COALESCE(v_closing.initial_cash, 100.00) +
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0))::DECIMAL,
            jsonb_build_object(
                'efectivo', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'efectivo' AND p.status = 'Completado'), 0),
                'tpv', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'tpv' AND p.status = 'Completado'), 0),
                'transferencia', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'transferencia' AND p.status = 'Completado'), 0),
                'financiacion', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'financiacion' AND p.status = 'Completado'), 0),
                'otros', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'otros' AND p.status = 'Completado'), 0)
            ),
            COUNT(*)::INTEGER,
            COUNT(*) FILTER (WHERE p.status = 'Completado')::INTEGER,
            COUNT(*) FILTER (WHERE p.status = 'Pendiente')::INTEGER,
            FALSE,
            v_closing.id
        FROM payments p
        WHERE p.clinic_id = p_clinic_id
        AND p.payment_date = p_date
        AND p.status != 'Anulado';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 Function: Get Day Transactions

```sql
CREATE OR REPLACE FUNCTION get_day_transactions(
    p_clinic_id UUID,
    p_date DATE,
    p_payment_method VARCHAR DEFAULT NULL,
    p_search_query VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    transaction_time TIME,
    patient_id UUID,
    patient_name VARCHAR,
    concept TEXT,
    amount DECIMAL,
    payment_method VARCHAR,
    payment_status VARCHAR,
    production_status VARCHAR,
    invoice_id UUID,
    budget_id UUID,
    appointment_id UUID,
    budget_description VARCHAR,
    professional_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ctv.id,
        ctv.transaction_time,
        ctv.patient_id,
        ctv.patient_name,
        ctv.concept,
        ctv.amount,
        ctv.payment_method,
        ctv.payment_status,
        ctv.production_status,
        ctv.invoice_id,
        ctv.budget_id,
        ctv.appointment_id,
        ctv.budget_description,
        ctv.professional_name
    FROM cash_transactions_view ctv
    WHERE ctv.clinic_id = p_clinic_id
    AND ctv.transaction_date = p_date
    AND (p_payment_method IS NULL OR ctv.payment_method = p_payment_method)
    AND (
        p_search_query IS NULL
        OR ctv.patient_name ILIKE '%' || p_search_query || '%'
        OR ctv.concept ILIKE '%' || p_search_query || '%'
    )
    ORDER BY ctv.transaction_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.3 Function: Close Cash Day

```sql
CREATE OR REPLACE FUNCTION close_cash_day(
    p_clinic_id UUID,
    p_date DATE,
    p_cash_outflow DECIMAL DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS cash_closings AS $$
DECLARE
    v_summary RECORD;
    v_closing cash_closings;
    v_user_name VARCHAR;
BEGIN
    -- Verify not already closed
    IF EXISTS (
        SELECT 1 FROM cash_closings
        WHERE clinic_id = p_clinic_id
        AND closing_date = p_date
        AND status = 'closed'
    ) THEN
        RAISE EXCEPTION 'Day % is already closed', p_date;
    END IF;

    -- Get day summary
    SELECT * INTO v_summary
    FROM get_day_summary(p_clinic_id, p_date);

    -- Get user name
    SELECT COALESCE(raw_user_meta_data->>'full_name', email) INTO v_user_name
    FROM auth.users
    WHERE id = auth.uid();

    -- Insert or update closing
    INSERT INTO cash_closings (
        clinic_id,
        closing_date,
        closed_by,
        closed_by_name,
        initial_cash,
        total_income,
        total_expenses,
        cash_outflow,
        final_balance,
        income_by_method,
        transaction_count,
        collected_count,
        pending_count,
        status,
        notes
    ) VALUES (
        p_clinic_id,
        p_date,
        auth.uid(),
        v_user_name,
        v_summary.initial_cash,
        v_summary.total_income,
        v_summary.total_expenses,
        p_cash_outflow,
        v_summary.final_balance - p_cash_outflow,
        v_summary.income_by_method,
        v_summary.transaction_count,
        v_summary.collected_count,
        v_summary.pending_count,
        'closed',
        p_notes
    )
    ON CONFLICT (clinic_id, closing_date)
    DO UPDATE SET
        closed_by = auth.uid(),
        closed_by_name = v_user_name,
        total_income = EXCLUDED.total_income,
        cash_outflow = EXCLUDED.cash_outflow,
        final_balance = EXCLUDED.final_balance,
        income_by_method = EXCLUDED.income_by_method,
        transaction_count = EXCLUDED.transaction_count,
        collected_count = EXCLUDED.collected_count,
        pending_count = EXCLUDED.pending_count,
        status = 'closed',
        notes = EXCLUDED.notes,
        updated_at = NOW()
    RETURNING * INTO v_closing;

    RETURN v_closing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 Function: Reopen Cash Day

```sql
CREATE OR REPLACE FUNCTION reopen_cash_day(
    p_clinic_id UUID,
    p_date DATE,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE cash_closings
    SET
        status = 'reopened',
        reopened_at = NOW(),
        reopened_by = auth.uid(),
        reopen_reason = p_reason,
        updated_at = NOW()
    WHERE clinic_id = p_clinic_id
    AND closing_date = p_date
    AND status = 'closed';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.5 Function: Get Period KPIs

```sql
CREATE OR REPLACE FUNCTION get_cash_kpis(
    p_clinic_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_income DECIMAL,
    total_pending DECIMAL,
    total_collected DECIMAL,
    collection_rate DECIMAL,
    by_method JSONB,
    by_day JSONB,
    transaction_count INTEGER,
    avg_transaction_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(p.amount), 0)::DECIMAL AS total_income,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Pendiente'), 0)::DECIMAL AS total_pending,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'Completado'), 0)::DECIMAL AS total_collected,
        CASE
            WHEN SUM(p.amount) > 0
            THEN (SUM(p.amount) FILTER (WHERE p.status = 'Completado') / SUM(p.amount) * 100)
            ELSE 0
        END::DECIMAL AS collection_rate,
        jsonb_build_object(
            'efectivo', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'efectivo'), 0),
            'tpv', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'tpv'), 0),
            'transferencia', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'transferencia'), 0),
            'financiacion', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'financiacion'), 0),
            'otros', COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'otros'), 0)
        ) AS by_method,
        (
            SELECT jsonb_agg(day_data ORDER BY day_data->>'date')
            FROM (
                SELECT jsonb_build_object(
                    'date', payment_date,
                    'total', SUM(amount),
                    'collected', SUM(amount) FILTER (WHERE status = 'Completado')
                ) AS day_data
                FROM payments
                WHERE clinic_id = p_clinic_id
                AND payment_date BETWEEN p_start_date AND p_end_date
                AND status != 'Anulado'
                GROUP BY payment_date
            ) daily
        ) AS by_day,
        COUNT(*)::INTEGER AS transaction_count,
        AVG(p.amount)::DECIMAL AS avg_transaction_amount
    FROM payments p
    WHERE p.clinic_id = p_clinic_id
    AND p.payment_date BETWEEN p_start_date AND p_end_date
    AND p.status != 'Anulado';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.6 Function: Generate Receipt

```sql
CREATE OR REPLACE FUNCTION generate_receipt(
    p_payment_id UUID
)
RETURNS receipts AS $$
DECLARE
    v_payment payments%ROWTYPE;
    v_patient patients%ROWTYPE;
    v_clinic clinic_settings%ROWTYPE;
    v_receipt receipts;
BEGIN
    -- Get payment data
    SELECT * INTO v_payment
    FROM payments
    WHERE id = p_payment_id;

    IF v_payment.id IS NULL THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    -- Verify receipt doesn't exist
    IF EXISTS (SELECT 1 FROM receipts WHERE payment_id = p_payment_id) THEN
        SELECT * INTO v_receipt FROM receipts WHERE payment_id = p_payment_id;
        RETURN v_receipt;
    END IF;

    -- Get patient data
    SELECT * INTO v_patient
    FROM patients
    WHERE id = v_payment.patient_id;

    -- Get clinic data
    SELECT * INTO v_clinic
    FROM clinic_settings
    WHERE clinic_id = v_payment.clinic_id;

    -- Create receipt
    INSERT INTO receipts (
        clinic_id,
        payment_id,
        patient_id,
        patient_name,
        concept,
        amount,
        payment_method,
        payment_reference,
        clinic_name,
        clinic_nif,
        clinic_address,
        created_by
    ) VALUES (
        v_payment.clinic_id,
        v_payment.id,
        v_payment.patient_id,
        v_patient.full_name,
        v_payment.concept,
        v_payment.amount,
        v_payment.payment_method,
        v_payment.reference,
        v_clinic.clinic_name,
        v_clinic.clinic_nif,
        v_clinic.clinic_address,
        auth.uid()
    )
    RETURNING * INTO v_receipt;

    RETURN v_receipt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Row Level Security (RLS)

### 6.1 Policies for cash_closings

```sql
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;

-- Read: only closings from user's clinic
CREATE POLICY "Users can view closings from their clinic"
ON cash_closings FOR SELECT
USING (clinic_id = get_user_clinic_id());

-- Insert: only in their clinic
CREATE POLICY "Users can create closings in their clinic"
ON cash_closings FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());

-- Update: only users with appropriate role
CREATE POLICY "Only authorized users can update closings"
ON cash_closings FOR UPDATE
USING (
    clinic_id = get_user_clinic_id()
    AND (has_role('Administrador') OR has_role('Recepción'))
);
```

### 6.2 Policies for receipts

```sql
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view receipts from their clinic"
ON receipts FOR SELECT
USING (clinic_id = get_user_clinic_id());

CREATE POLICY "Users can create receipts in their clinic"
ON receipts FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id());
```

---

## 7. Connections with Other Modules

### 7.1 Connection Map

```
                              ┌─────────────────────────────────────────┐
                              │           PATIENT RECORD                │
                              │           (Finance Module)              │
                              │                                         │
                              │  ┌─────────────────────────────────┐   │
                              │  │ payments (SINGLE SOURCE)        │   │
                              │  │ budgets                         │   │
                              │  │ installments                    │   │
                              │  │ invoices                        │   │
                              │  └─────────────┬───────────────────┘   │
                              │                │                       │
                              └────────────────┼───────────────────────┘
                                               │
                                               │ SOURCE OF
                                               │ ALL DATA
                                               ▼
                              ┌─────────────────────────────────────────┐
                              │          CASH REGISTER MODULE           │
                              │                                         │
                              │  ┌─────────────────────────────────┐   │
                              │  │ cash_transactions_view (View)   │   │
                              │  │ cash_closings (Closings)        │   │
                              │  │ receipts (Receipts)             │   │
                              │  └─────────────────────────────────┘   │
                              │                                         │
                              └────────────────┬───────────────────────┘
                                               │
              ┌────────────────────────────────┼────────────────────────────────┐
              │                                │                                │
              ▼                                ▼                                ▼
┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
│      SCHEDULE       │          │    DAILY REPORT     │          │     MANAGEMENT      │
│                     │          │                     │          │                     │
│ • Appointment       │          │ • Day production    │          │ • Financial KPIs    │
│   payments          │          │ • Production status │          │ • Reports           │
│ • Paid status       │          │                     │          │                     │
└─────────────────────┘          └─────────────────────┘          └─────────────────────┘
```

### 7.2 Connection Details

#### 7.2.1 PATIENT RECORD (Finances) → CASH REGISTER

| Action in Patient Record | Result in Cash Register                   |
| ------------------------ | ----------------------------------------- |
| Register payment         | Appears in movements table                |
| Pay budget installment   | Appears with budget reference             |
| Issue invoice            | Links invoice_id to payment               |
| Void payment             | Disappears from view (status = 'Anulado') |

**Main query (data source):**

```sql
-- ALL Cash Register information comes from this query
SELECT
    p.*,
    pat.full_name AS patient_name,
    b.budget_number,
    b.budget_name AS budget_description,
    a.professional_name,
    inv.invoice_number
FROM payments p
JOIN patients pat ON pat.id = p.patient_id
LEFT JOIN budgets b ON b.id = p.budget_id
LEFT JOIN appointments a ON a.id = p.appointment_id
LEFT JOIN invoices inv ON inv.id = p.invoice_id
WHERE p.clinic_id = :clinic_id
AND p.payment_date BETWEEN :start_date AND :end_date
AND p.status != 'Anulado'
ORDER BY p.payment_date DESC, p.payment_time DESC;
```

#### 7.2.2 CASH REGISTER → PATIENT RECORD

| Action in Cash Register            | Result in Patient Record          |
| ---------------------------------- | --------------------------------- |
| Click on movement → "View patient" | Opens record on Finances tab      |
| Update status to "Collected"       | Updates payment.status            |
| Generate invoice                   | Creates invoice linked to payment |

**Navigation query:**

```sql
-- When clicking "View patient" from Cash Register
-- Redirect to: /pacientes?id={patient_id}&tab=Finanzas
SELECT patient_id FROM payments WHERE id = :payment_id;
```

#### 7.2.3 SCHEDULE → CASH REGISTER

| Action in Schedule                | Result in Cash Register                 |
| --------------------------------- | --------------------------------------- |
| Complete appointment with payment | Creates payment with appointment_id     |
| Charge from appointment           | Appears in Cash Register with reference |

**Appointment payment query:**

```sql
-- Payments that come from appointments
SELECT
    p.*,
    a.appointment_date,
    a.start_time,
    a.reason AS appointment_reason,
    a.professional_name
FROM payments p
JOIN appointments a ON a.id = p.appointment_id
WHERE p.clinic_id = :clinic_id
AND p.payment_date = CURRENT_DATE;
```

#### 7.2.4 CASH REGISTER → DAILY REPORT

| Cash Register Data | Use in Daily Report |
| ------------------ | ------------------- |
| Day payments       | Collected column    |
| Production status  | "Produced" filter   |

---

### 7.3 Permission Matrix

| Functionality            | Reception | Hygienist    | Doctor       | Administrator |
| ------------------------ | --------- | ------------ | ------------ | ------------- |
| View movements table     | ✅        | 👁️ View only | 👁️ View only | ✅            |
| Change payment status    | ✅        | ❌           | ✅           | ✅            |
| Change production status | ✅        | ✅           | ✅           | ✅            |
| Close cash               | ✅        | ❌           | ❌           | ✅            |
| Reopen closing           | ❌        | ❌           | ❌           | ✅            |
| Export data              | ✅        | ❌           | ✅           | ✅            |
| Generate receipt         | ✅        | ❌           | ✅           | ✅            |
| View/Generate invoice    | ✅        | ❌           | ✅           | ✅            |

---

## 8. System Events

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CASH REGISTER EVENTS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

PATIENT RECORD emits to CASH REGISTER:
├── payment.created ──────────────► Appears in movements table
├── payment.updated ──────────────► Updates status in table
├── payment.voided ───────────────► Disappears from view
└── installment.paid ─────────────► Appears as installment payment

CASH REGISTER emits:
├── cash_closing.completed ───────► Management (reports)
│                                 └► History (archived)
│
├── cash_closing.reopened ────────► Allows new modifications
│
├── payment_status.changed ───────► Patient Record (updates payment)
│                                 └► Daily Report (updates status)
│
├── production_status.changed ────► Daily Report (updates production)
│
├── receipt.generated ────────────► PDF available for printing
│
└── invoice.generated ────────────► Patient Record (links invoice)

SCHEDULE emits to CASH REGISTER:
├── appointment.payment_registered ►New payment in movements
└── appointment.completed ─────────► Updates production if applicable
```

---

## 9. Indexes and Optimization

### 9.1 Critical Indexes for Cash Register

```sql
-- Composite index for main movements query
CREATE INDEX CONCURRENTLY idx_payments_cash_main
ON payments(clinic_id, payment_date, payment_time DESC)
WHERE status != 'Anulado';

-- Index for payment method filter
CREATE INDEX CONCURRENTLY idx_payments_method_date
ON payments(clinic_id, payment_method, payment_date)
WHERE status != 'Anulado';

-- Index for patient search (JOIN with patients)
CREATE INDEX CONCURRENTLY idx_payments_patient_lookup
ON payments(patient_id, payment_date DESC);

-- Index for cash closings
CREATE INDEX CONCURRENTLY idx_closings_lookup
ON cash_closings(clinic_id, closing_date DESC, status);

-- Index for period KPIs
CREATE INDEX CONCURRENTLY idx_payments_kpi_period
ON payments(clinic_id, payment_date, status, payment_method)
WHERE status != 'Anulado';
```

### 9.2 Daily Summary Materialization (Optional)

```sql
-- Materialized view for daily summaries (improves performance)
CREATE MATERIALIZED VIEW daily_cash_summary AS
SELECT
    clinic_id,
    payment_date AS date,
    COUNT(*) AS transaction_count,
    COUNT(*) FILTER (WHERE status = 'Completado') AS collected_count,
    SUM(amount) FILTER (WHERE status = 'Completado') AS total_collected,
    SUM(amount) FILTER (WHERE status = 'Pendiente') AS total_pending,
    jsonb_build_object(
        'efectivo', SUM(amount) FILTER (WHERE payment_method = 'efectivo' AND status = 'Completado'),
        'tpv', SUM(amount) FILTER (WHERE payment_method = 'tpv' AND status = 'Completado'),
        'transferencia', SUM(amount) FILTER (WHERE payment_method = 'transferencia' AND status = 'Completado'),
        'financiacion', SUM(amount) FILTER (WHERE payment_method = 'financiacion' AND status = 'Completado'),
        'otros', SUM(amount) FILTER (WHERE payment_method = 'otros' AND status = 'Completado')
    ) AS by_method
FROM payments
WHERE status != 'Anulado'
GROUP BY clinic_id, payment_date;

CREATE UNIQUE INDEX idx_daily_cash_summary
ON daily_cash_summary(clinic_id, date);

-- Refresh at end of each day or on demand
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_cash_summary;
```

---

## 10. Suggested Implementation Plan

### Phase 1: Foundations (Week 1)

- [ ] Verify `payments` table exists (from Patient Record)
- [ ] Create `cash_closings` table
- [ ] Create `receipts` table
- [ ] Create `cash_transactions_view` view
- [ ] Configure RLS

### Phase 2: Core Functions (Week 2)

- [ ] Implement `get_day_summary()`
- [ ] Implement `get_day_transactions()`
- [ ] Implement `close_cash_day()`
- [ ] Implement `reopen_cash_day()`

### Phase 3: Business Functions (Week 3)

- [ ] Implement `get_cash_kpis()`
- [ ] Implement `generate_receipt()`
- [ ] Auto-update triggers
- [ ] Excel export

### Phase 4: Optimization (Week 4)

- [ ] Create performance indexes
- [ ] Implement materialized view (optional)
- [ ] Performance testing
- [ ] Integration testing with Patient Record

---

## 11. References

### 11.1 Related Frontend Files

```
src/
├── app/
│   └── caja/page.tsx                      # Main page
│
├── components/caja/
│   ├── CashMovementsTable.tsx             # Movements table
│   ├── CashSummaryCard.tsx                # Summary card
│   ├── CashTrendCard.tsx                  # Trend chart
│   ├── CashToolbar.tsx                    # Toolbar with navigation
│   ├── CashClosingModal.tsx               # Closing modal
│   ├── NewPaymentModal.tsx                # New payment modal
│   ├── ReceiptPreviewModal.tsx            # Receipt preview
│   └── cajaTypes.ts                       # Types
│
└── context/
    └── CashClosingContext.tsx             # Cash context
```

### 11.2 Related Documents

- **TECHNICAL_BRIEF_PATIENT_RECORD.md** - Definition of `payments`, `budgets`, `invoices`
- **TECHNICAL_BRIEF_SCHEDULE.md** - Connection with `appointments`

---

## 12. Important Notes

### 12.1 Single Source Principle

⚠️ **CRITICAL:** The Cash Register module should **NEVER** create records in the `payments` table directly. All payments must be registered through:

1. **Patient Record > Finances** → Manual payment
2. **Patient Record > Finances** → Installment payment
3. **Schedule** → Appointment charge

Cash Register can only:

- **Read** data from `payments`
- **Update** statuses (`status`, `production_status`)
- **Create** records in `cash_closings` and `receipts`

### 12.2 Data Consistency

```sql
-- Verify all payments have valid source
SELECT
    CASE
        WHEN budget_id IS NOT NULL THEN 'budget_payment'
        WHEN appointment_id IS NOT NULL THEN 'appointment_payment'
        WHEN installment_id IS NOT NULL THEN 'installment_payment'
        ELSE 'direct_payment'
    END AS payment_source,
    COUNT(*)
FROM payments
WHERE clinic_id = :clinic_id
GROUP BY payment_source;
```

---

_Document generated on February 2, 2026_  
_Version 1.0 - Complete MVP_
