-- Add repeat_type column to foh_daily_templates
ALTER TABLE public.foh_daily_templates
ADD COLUMN IF NOT EXISTS repeat_type text DEFAULT 'daily';

-- Add repeat_type column to foh_tasks
ALTER TABLE public.foh_tasks
ADD COLUMN IF NOT EXISTS repeat_type text DEFAULT NULL;