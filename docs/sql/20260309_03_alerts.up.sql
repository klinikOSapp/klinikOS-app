-- Personal alerts center (per-user) for agenda tasks/reminders.
-- Safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS public.alerts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  box_id uuid REFERENCES public.boxes(id) ON DELETE SET NULL,
  applies_to_all_boxes boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  due_time time without time zone,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS box_id uuid REFERENCES public.boxes(id) ON DELETE SET NULL;

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS applies_to_all_boxes boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_alerts_clinic_user_status_due
  ON public.alerts (clinic_id, created_by, completed, due_date, due_time);

CREATE INDEX IF NOT EXISTS idx_alerts_patient
  ON public.alerts (patient_id);

CREATE OR REPLACE FUNCTION public.touch_alerts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_alerts_updated_at ON public.alerts;
CREATE TRIGGER trg_touch_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.touch_alerts_updated_at();

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alerts_select_own ON public.alerts;
CREATE POLICY alerts_select_own
ON public.alerts
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

DROP POLICY IF EXISTS alerts_insert_own ON public.alerts;
CREATE POLICY alerts_insert_own
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS alerts_update_own ON public.alerts;
CREATE POLICY alerts_update_own
ON public.alerts
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS alerts_delete_own ON public.alerts;
CREATE POLICY alerts_delete_own
ON public.alerts
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

COMMIT;
