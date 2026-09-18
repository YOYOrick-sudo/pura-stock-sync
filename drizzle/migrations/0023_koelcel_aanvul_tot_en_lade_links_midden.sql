-- 1. Generiek veld: tot welk aantal je in één keer aanvult bij een Midsland-bestelling.
ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS aanvul_tot numeric;

COMMENT ON COLUMN public.koelcel_check_items.aanvul_tot IS
  'Tot welk aantal in een keer wordt aangevuld zodra het bestelpunt is bereikt (Midsland-bestellingen).';

-- 2. Lade Links midden: vier bakken uit de foto, in volgorde.
-- 2a. Nieuw werkbank-item: geroosterde bloemkool.
INSERT INTO public.koelcel_check_items
  (vestiging, naam, doel_aantal, eenheid, type, volgorde, actief, bron, plek,
   bak_maat, product_sleutel, categorie, formaat, lade_id, vulnorm, batch_aantal)
SELECT 'West', 'Geroosterde bloemkool', 1, 'bakje', 'koelwerkbank', 410, true, 'zelf_west', 'werkbank',
   'gn_1_4', 'geroosterde_bloemkool', 'Groenten', '1 GN 1/4 midden',
   '94b711e5-93ca-4b4b-b078-8cd1e2ece4ab'::uuid, 'half', 1
WHERE NOT EXISTS (
  SELECT 1 FROM public.koelcel_check_items
  WHERE vestiging = 'West' AND plek = 'werkbank' AND naam = 'Geroosterde bloemkool'
);

-- 2b. Aubergine naar Links midden.
UPDATE public.koelcel_check_items
SET lade_id = '94b711e5-93ca-4b4b-b078-8cd1e2ece4ab', volgorde = 411, vulnorm = 'half'
WHERE id = '37fe62dd-11cf-4ce2-bfae-54b8bc8260d9';

-- 2c. Rode kool naar Links midden.
UPDATE public.koelcel_check_items
SET lade_id = '94b711e5-93ca-4b4b-b078-8cd1e2ece4ab', volgorde = 412
WHERE id = 'fb634b17-dd5f-4109-a961-fe47800d312d';

-- 2d. Gegrilde groenten: hernoemen en naar Links midden.
UPDATE public.koelcel_check_items
SET naam = 'Gegrilde groenten (paprika, venkel, courgette)',
    lade_id = '94b711e5-93ca-4b4b-b078-8cd1e2ece4ab',
    volgorde = 413,
    vulnorm = 'half'
WHERE id = 'ea3d43d7-f320-41fa-b1a2-db3c6c89a0e9';

-- 3. Koelcelregels die niet meer nodig zijn: archiveren, niet verwijderen.
UPDATE public.koelcel_check_items
SET actief = false
WHERE id IN (
  'af043ced-d7c2-4082-b738-67b0a8a4d498', -- aubergine koelcel
  'bdae1af6-8b7d-44b9-a7f4-67c9cc80df4a'  -- geroosterde groenten koelcel
);

-- 4. Rode kool koelcel: op peil 4, melden vanaf 2, in een keer aanvullen tot 5.
UPDATE public.koelcel_check_items
SET doel_aantal = 4, bestelpunt = 2, aanvul_tot = 5
WHERE id = '4a4ef847-49ca-47d2-a068-b89a748ef861';