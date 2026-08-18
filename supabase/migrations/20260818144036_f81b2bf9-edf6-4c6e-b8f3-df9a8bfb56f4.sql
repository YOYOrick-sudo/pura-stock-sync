ALTER TABLE public.foh_daily_templates ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.foh_tasks ADD COLUMN IF NOT EXISTS foto_url text;