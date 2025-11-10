-- Add category column to foh_tasks table
ALTER TABLE public.foh_tasks 
ADD COLUMN category text NOT NULL DEFAULT 'Algemeen';

-- Add category column to foh_daily_templates table
ALTER TABLE public.foh_daily_templates 
ADD COLUMN category text NOT NULL DEFAULT 'Algemeen';

-- Add check constraint for valid categories (optional but recommended)
ALTER TABLE public.foh_tasks
ADD CONSTRAINT foh_tasks_category_check 
CHECK (category IN ('Bar', 'Keuken', 'Terras', 'Algemeen', 'Toilet', 'Entree'));

ALTER TABLE public.foh_daily_templates
ADD CONSTRAINT foh_daily_templates_category_check 
CHECK (category IN ('Bar', 'Keuken', 'Terras', 'Algemeen', 'Toilet', 'Entree'));