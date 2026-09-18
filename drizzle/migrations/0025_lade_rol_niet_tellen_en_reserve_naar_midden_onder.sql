ALTER TABLE public.voorraad_lades DROP CONSTRAINT IF EXISTS voorraad_lades_rol_check;
ALTER TABLE public.voorraad_lades ADD CONSTRAINT voorraad_lades_rol_check
  CHECK (rol = ANY (ARRAY['werk'::text, 'reserve'::text, 'niet_tellen'::text]));

-- De reservebakjes liggen midden onder, niet midden boven.
UPDATE public.koelcel_check_items
SET lade_id = '0bf27550-4bd3-4ed8-b866-3f80471088fd'
WHERE lade_id = '4ad4f602-bc9d-4cac-a7b7-e63b289fc9d8';

-- Midden boven bevat de aangebroken werkbakjes: die tel je niet.
UPDATE public.voorraad_lades
SET rol = 'niet_tellen'
WHERE id = '4ad4f602-bc9d-4cac-a7b7-e63b289fc9d8';