-- 1. Dagelijkse opruiming cron-logboek
SELECT cron.schedule(
  'cleanup-cron-history',
  '10 3 * * *',
  $$DELETE FROM cron.job_run_details WHERE start_time < now() - interval '7 days'$$
);

-- 2. Geschiedenistabel voor oude taken
CREATE TABLE IF NOT EXISTS public.foh_tasks_archief (LIKE public.foh_tasks INCLUDING DEFAULTS INCLUDING STORAGE);
ALTER TABLE public.foh_tasks_archief ADD COLUMN IF NOT EXISTS verplaatst_op timestamptz NOT NULL DEFAULT now();

GRANT SELECT ON public.foh_tasks_archief TO authenticated;
GRANT ALL ON public.foh_tasks_archief TO service_role;

ALTER TABLE public.foh_tasks_archief ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Managers lezen taakarchief" ON public.foh_tasks_archief;
CREATE POLICY "Managers lezen taakarchief"
ON public.foh_tasks_archief
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);

CREATE INDEX IF NOT EXISTS idx_foh_tasks_archief_loc_due
  ON public.foh_tasks_archief (location, due_date);

-- 3. Index voor de dagelijkse lijst
CREATE INDEX IF NOT EXISTS idx_foh_tasks_dag
  ON public.foh_tasks (location, due_date, sort_order)
  WHERE archived = false;