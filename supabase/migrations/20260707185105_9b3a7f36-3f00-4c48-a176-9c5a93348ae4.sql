ALTER TABLE public.sync_runs DROP CONSTRAINT IF EXISTS sync_runs_type_check;
ALTER TABLE public.sync_runs ADD CONSTRAINT sync_runs_type_check
  CHECK (type = ANY (ARRAY['dagelijks'::text, 'backfill'::text, 'handmatig'::text, 'verkennen'::text, 'demo_wipe'::text, 'auto'::text]));