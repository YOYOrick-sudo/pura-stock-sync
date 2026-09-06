CREATE INDEX IF NOT EXISTS idx_foh_tasks_loc_archived
  ON public.foh_tasks (location, archived) INCLUDE (category, department);

CREATE INDEX IF NOT EXISTS idx_foh_tasks_loc_due
  ON public.foh_tasks (location, due_date) INCLUDE (template_id);

CREATE OR REPLACE FUNCTION public.foh_tasks_archiveer_oud(_dagen integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _n integer;
BEGIN
  UPDATE public.foh_tasks
     SET archived = true
   WHERE archived = false
     AND due_date IS NOT NULL
     AND due_date < (current_date - _dagen);
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END;
$$;

REVOKE ALL ON FUNCTION public.foh_tasks_archiveer_oud(integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.foh_tasks_archiveer_oud(integer) TO service_role;

SELECT public.foh_tasks_archiveer_oud(90);
ANALYZE public.foh_tasks;