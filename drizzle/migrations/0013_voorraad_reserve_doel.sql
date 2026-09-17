ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS reserve_doel integer NOT NULL DEFAULT 0;

ALTER TABLE public.voorraad_lades
  ADD COLUMN IF NOT EXISTS rol text NOT NULL DEFAULT 'werk';

ALTER TABLE public.voorraad_lades
  DROP CONSTRAINT IF EXISTS voorraad_lades_rol_check;
ALTER TABLE public.voorraad_lades
  ADD CONSTRAINT voorraad_lades_rol_check CHECK (rol IN ('werk', 'reserve'));

-- Alle actieve koelwerkbankproducten in West krijgen standaard 1 reservebakje.
UPDATE public.koelcel_check_items
SET reserve_doel = 1
WHERE vestiging = 'West' AND actief = true AND plek = 'werkbank' AND reserve_doel = 0;