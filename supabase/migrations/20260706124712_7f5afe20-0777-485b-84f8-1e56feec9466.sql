ALTER TABLE public.cijfers_instellingen
  ADD COLUMN IF NOT EXISTS wg_lasten_factor numeric NOT NULL DEFAULT 1.30
  CHECK (wg_lasten_factor > 0 AND wg_lasten_factor < 3);