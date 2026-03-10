BEGIN;

DROP POLICY IF EXISTS alerts_delete_own ON public.alerts;
DROP POLICY IF EXISTS alerts_update_own ON public.alerts;
DROP POLICY IF EXISTS alerts_insert_own ON public.alerts;
DROP POLICY IF EXISTS alerts_select_own ON public.alerts;

DROP TRIGGER IF EXISTS trg_touch_alerts_updated_at ON public.alerts;
DROP FUNCTION IF EXISTS public.touch_alerts_updated_at();

DROP TABLE IF EXISTS public.alerts;

COMMIT;
