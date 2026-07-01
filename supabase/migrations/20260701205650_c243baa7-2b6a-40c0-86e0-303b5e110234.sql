ALTER TABLE public.foh_tasks DROP CONSTRAINT IF EXISTS foh_tasks_phase_check;
ALTER TABLE public.foh_tasks ADD CONSTRAINT foh_tasks_phase_check CHECK (phase IS NULL OR phase = ANY (ARRAY['open'::text,'tussen'::text,'borrel'::text,'sluit'::text]));

ALTER TABLE public.foh_daily_templates DROP CONSTRAINT IF EXISTS foh_daily_templates_phase_check;
ALTER TABLE public.foh_daily_templates ADD CONSTRAINT foh_daily_templates_phase_check CHECK (phase = ANY (ARRAY['open'::text,'tussen'::text,'borrel'::text,'sluit'::text]));