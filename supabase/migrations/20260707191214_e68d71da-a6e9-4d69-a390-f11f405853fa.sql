ALTER TABLE public.cijfers_instellingen
  ADD COLUMN IF NOT EXISTS loon_pct_doel numeric NOT NULL DEFAULT 30;

ALTER TABLE public.cijfers_instellingen
  DROP CONSTRAINT IF EXISTS cijfers_instellingen_loon_pct_doel_check;

ALTER TABLE public.cijfers_instellingen
  ADD CONSTRAINT cijfers_instellingen_loon_pct_doel_check
  CHECK (loon_pct_doel > 0 AND loon_pct_doel < 100);