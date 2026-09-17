-- 1. Legacy verzamelregel archiveren
UPDATE public.koelcel_check_items
SET actief = false, updated_at = now()
WHERE vestiging = 'West' AND product_sleutel = 'zoet-alleen-als-echt-op-';

-- 2. Dubbele vriescelregels archiveren (één regel per product houden)
UPDATE public.koelcel_check_items
SET actief = false, updated_at = now()
WHERE vestiging = 'West' AND plek = 'vriezer' AND actief
  AND (
    (product_sleutel = 'avocado-spread' AND volgorde = 200)
    OR (product_sleutel = 'tomatenjam' AND volgorde = 80)
    OR (product_sleutel = 'tomatenrelish' AND volgorde = 90)
    OR (product_sleutel = 'wortelspread' AND volgorde = 100)
  );

-- 3. Herkomst gelijktrekken: spreads komen uit Midsland
UPDATE public.koelcel_check_items
SET bron = 'midsland', updated_at = now()
WHERE vestiging = 'West' AND plek = 'vriezer' AND actief
  AND product_sleutel IN ('avocado-spread','tomatenjam','tomatenrelish','wortelspread');

-- 4. Doorgezet aantal vastleggen op de dagcheck
ALTER TABLE public.koelcel_checks
  ADD COLUMN IF NOT EXISTS aantal_doorgezet numeric;