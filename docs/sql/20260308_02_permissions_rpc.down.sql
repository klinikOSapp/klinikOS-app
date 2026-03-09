-- Rollback for 20260308_02_permissions_rpc.up.sql
-- Drops get_clinic_modules and restores has_permission without clinic_modules gating.

BEGIN;

DROP FUNCTION IF EXISTS public.get_clinic_modules(uuid);

CREATE OR REPLACE FUNCTION public.has_permission(
  p_clinic_id uuid,
  p_module text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.staff_clinics sc
    JOIN public.permissions p ON p.role_id = sc.role_id
    JOIN public.modules m ON m.id = p.module_id
    WHERE sc.staff_id = v_uid
      AND sc.clinic_id = p_clinic_id
      AND m.name = p_module
      AND (
        (p_action = 'view' AND p.can_view = true) OR
        (p_action = 'create' AND p.can_create = true) OR
        (p_action = 'edit' AND p.can_edit = true) OR
        (p_action = 'delete' AND p.can_delete = true)
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text, text) TO authenticated;

COMMIT;
