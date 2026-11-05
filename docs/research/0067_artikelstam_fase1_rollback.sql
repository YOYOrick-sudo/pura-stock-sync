-- Rollback van drizzle/migrations/0067_artikelstam_fase1.sql.
-- Niet automatisch draaien. Preview en productie delen één database.
--
-- Concept-artikelen die de app na livegang heeft aangemaakt blijven staan.
-- Dat zijn bestellingen, geen schema. Zoek ze vóór het droppen van status:
--   SELECT id, naam, created_at FROM public.artikelen WHERE status = 'concept';
-- Verwijder ze alleen met een aparte, nagekeken opruiming.

DROP FUNCTION IF EXISTS public.rpc_bord_maak_concept_artikel_v2(text, text, uuid);
DROP FUNCTION IF EXISTS public.artikel_zoek_v2(text, text, integer);

DROP INDEX IF EXISTS public.artikelen_status_idx;
DROP INDEX IF EXISTS public.artikel_vormen_ean_idx;
DROP INDEX IF EXISTS public.sticker_producten_artikel_id_idx;
DROP INDEX IF EXISTS public.mep_taken_artikel_id_idx;
DROP INDEX IF EXISTS public.koelcel_check_items_artikel_id_idx;
DROP INDEX IF EXISTS public.voorraad_artikel_artikel_id_idx;
DROP INDEX IF EXISTS public.bain_marie_bakken_artikel_id_idx;
DROP INDEX IF EXISTS public.print_jobs_artikel_id_idx;
DROP INDEX IF EXISTS public.print_jobs_herdruk_van_idx;

ALTER TABLE public.print_jobs DROP CONSTRAINT IF EXISTS print_jobs_tht_dagen_check;
ALTER TABLE public.print_jobs
  DROP COLUMN IF EXISTS herdruk_van,
  DROP COLUMN IF EXISTS tht_op,
  DROP COLUMN IF EXISTS bereid_op,
  DROP COLUMN IF EXISTS tht_dagen,
  DROP COLUMN IF EXISTS artikel_id;

ALTER TABLE public.bain_marie_bakken DROP COLUMN IF EXISTS artikel_id;
ALTER TABLE public.voorraad_artikel DROP COLUMN IF EXISTS artikel_id;
ALTER TABLE public.koelcel_check_items DROP COLUMN IF EXISTS artikel_id;
ALTER TABLE public.mep_taken DROP COLUMN IF EXISTS artikel_id;
ALTER TABLE public.sticker_producten DROP COLUMN IF EXISTS artikel_id;

ALTER TABLE public.artikel_vormen DROP COLUMN IF EXISTS ean;

ALTER TABLE public.artikelen DROP CONSTRAINT IF EXISTS artikelen_status_check;
ALTER TABLE public.artikelen DROP COLUMN IF EXISTS status;

-- Vestiging-checks terug naar West en Midsland, alleen als er geen Test-rij is.
-- Een Test-rij hoort bij deze fase; die moet eerst weg, anders faalt de oude check.
DO $vestiging$
DECLARE r record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.artikel_locaties WHERE vestiging = 'Test')
     OR EXISTS (SELECT 1 FROM public.artikel_aliassen WHERE vestiging = 'Test') THEN
    RAISE NOTICE 'Test-rijen blijven staan. Vestiging-checks niet teruggezet.';
    RETURN;
  END IF;
  FOR r IN
    SELECT c.conname, t.relname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname IN ('artikel_locaties', 'artikel_aliassen')
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%Test%'
      AND pg_get_constraintdef(c.oid) LIKE '%West%'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%bron_vestiging%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.relname, r.conname);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (vestiging IN (''West'', ''Midsland''))',
      r.relname, r.conname
    );
  END LOOP;
END
$vestiging$;
