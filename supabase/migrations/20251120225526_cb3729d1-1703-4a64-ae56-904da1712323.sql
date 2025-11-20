-- Add template_name and is_active columns to foh_daily_templates
ALTER TABLE public.foh_daily_templates 
ADD COLUMN IF NOT EXISTS template_name TEXT NOT NULL DEFAULT 'Standaard',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Set existing templates as active and name them properly
UPDATE public.foh_daily_templates
SET 
  template_name = CASE 
    WHEN phase = 'open' THEN 'Standaard Openlijst'
    WHEN phase = 'tussen' THEN 'Standaard Tussenlijst'
    WHEN phase = 'sluit' THEN 'Standaard Sluitlijst'
    ELSE 'Standaard'
  END,
  is_active = true
WHERE template_name = 'Standaard';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_foh_daily_templates_active 
ON public.foh_daily_templates(location, phase, is_active) 
WHERE is_active = true;