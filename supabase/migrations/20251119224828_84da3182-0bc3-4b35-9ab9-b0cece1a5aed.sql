-- Add estimated_minutes column to foh_tasks
ALTER TABLE public.foh_tasks 
ADD COLUMN estimated_minutes integer;

-- Add estimated_minutes column to foh_daily_templates
ALTER TABLE public.foh_daily_templates 
ADD COLUMN estimated_minutes integer;

COMMENT ON COLUMN public.foh_tasks.estimated_minutes IS 'Geschatte tijd in minuten voor deze taak';
COMMENT ON COLUMN public.foh_daily_templates.estimated_minutes IS 'Geschatte tijd in minuten voor deze taak template';