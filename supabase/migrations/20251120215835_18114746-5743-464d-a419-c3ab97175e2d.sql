-- Voeg description kolom toe aan foh_tasks
ALTER TABLE public.foh_tasks 
ADD COLUMN description TEXT;

-- Voeg description kolom toe aan foh_daily_templates
ALTER TABLE public.foh_daily_templates 
ADD COLUMN description TEXT;