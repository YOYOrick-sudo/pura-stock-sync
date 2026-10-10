ALTER TABLE public.foh_daily_templates
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.foh_tasks
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

ALTER TABLE public.foh_category_order
  ADD COLUMN IF NOT EXISTS category_en TEXT;

COMMENT ON COLUMN public.foh_daily_templates.title_en IS 'Optional English task title shown when the device language is EN.';
COMMENT ON COLUMN public.foh_daily_templates.description_en IS 'Optional English task description shown when the device language is EN.';
COMMENT ON COLUMN public.foh_tasks.title_en IS 'English snapshot of the task title; falls back to title when absent.';
COMMENT ON COLUMN public.foh_tasks.description_en IS 'English snapshot of the task description; falls back to description when absent.';
COMMENT ON COLUMN public.foh_category_order.category_en IS 'Optional English display label; category remains the stable internal key.';