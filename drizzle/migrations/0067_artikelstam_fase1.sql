-- Artikelstam fase 1. Alleen toevoegen.
-- Niet uitvoeren vanuit de agent: preview en productie delen één database.
-- Rollback: docs/research/0067_artikelstam_fase1_rollback.sql
--
-- Bestaande RPC-signaturen blijven staan. Nieuwe functies heten _v2.
-- Geen NOT NULL en geen triggers op print_jobs of mep_taken.
-- Geen prijskolommen, geen wijziging van RLS, foh_tasks, horeko_artikelen,
-- claim_next_print_job of de print-bridge.
-- bestel_signalen krijgt geen kolom en geen datawijziging in deze migratie.
-- De app koppelt later zelf alleen artikel_id, na Yoricks OK van 5 nov 15:59.

-- status is nullable met default actief, zodat de oude bundel niets merkt.
-- Een concept zet de kolom expliciet op 'concept'.
ALTER TABLE public.artikelen
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'actief';

DO $status$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'artikelen_status_check' AND conrelid = 'public.artikelen'::regclass
  ) THEN
    ALTER TABLE public.artikelen
      ADD CONSTRAINT artikelen_status_check
      CHECK (status IS NULL OR status IN ('actief', 'concept'));
  END IF;
END
$status$;

COMMENT ON COLUMN public.artikelen.status IS
  'actief of concept. Concept = nieuw na een bestelling, nog bevestigen. Leeg telt als actief.';

ALTER TABLE public.artikel_vormen
  ADD COLUMN IF NOT EXISTS ean text;

COMMENT ON COLUMN public.artikel_vormen.ean IS
  'EAN/GTIN van het leveranciersartikel. Leeg zolang onbekend.';

-- Nullable artikel_id. Bestaande rijen blijven leeg. Geen trigger, geen NOT NULL.
ALTER TABLE public.sticker_producten
  ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL;

ALTER TABLE public.mep_taken
  ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL;

ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL;

ALTER TABLE public.voorraad_artikel
  ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL;

ALTER TABLE public.bain_marie_bakken
  ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL;

-- Print: extra velden naast het bestaande pad. claim_next_print_job blijft onaangeroerd.
-- herdruk_van wijst naar de eerste job; de app vult dat later, deze migratie niet.
ALTER TABLE public.print_jobs
  ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tht_dagen integer,
  ADD COLUMN IF NOT EXISTS bereid_op date,
  ADD COLUMN IF NOT EXISTS tht_op date,
  ADD COLUMN IF NOT EXISTS herdruk_van uuid REFERENCES public.print_jobs(id) ON DELETE SET NULL;

DO $tht$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'print_jobs_tht_dagen_check' AND conrelid = 'public.print_jobs'::regclass
  ) THEN
    ALTER TABLE public.print_jobs
      ADD CONSTRAINT print_jobs_tht_dagen_check
      CHECK (tht_dagen IS NULL OR tht_dagen >= 0);
  END IF;
END
$tht$;

CREATE INDEX IF NOT EXISTS artikelen_status_idx
  ON public.artikelen (status)
  WHERE status IS NOT NULL AND status <> 'actief';

CREATE INDEX IF NOT EXISTS artikel_vormen_ean_idx
  ON public.artikel_vormen (ean)
  WHERE ean IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS sticker_producten_artikel_id_idx
  ON public.sticker_producten (artikel_id) WHERE artikel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS mep_taken_artikel_id_idx
  ON public.mep_taken (artikel_id) WHERE artikel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS koelcel_check_items_artikel_id_idx
  ON public.koelcel_check_items (artikel_id) WHERE artikel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS voorraad_artikel_artikel_id_idx
  ON public.voorraad_artikel (artikel_id) WHERE artikel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bain_marie_bakken_artikel_id_idx
  ON public.bain_marie_bakken (artikel_id) WHERE artikel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS print_jobs_artikel_id_idx
  ON public.print_jobs (artikel_id) WHERE artikel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS print_jobs_herdruk_van_idx
  ON public.print_jobs (herdruk_van) WHERE herdruk_van IS NOT NULL;

-- Test is de derde vestiging. Alleen de checks die deze migratie moet kunnen schrijven.
-- Bestaande policies blijven. Een alias met vestiging NULL blijft onzichtbaar en maken we niet.
DO $vestiging$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname, t.relname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname IN ('artikel_locaties', 'artikel_aliassen')
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%West%'
      AND pg_get_constraintdef(c.oid) LIKE '%Midsland%'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%Test%'
      AND pg_get_constraintdef(c.oid) NOT LIKE '%bron_vestiging%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.relname, r.conname);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (vestiging IN (''West'', ''Midsland'', ''Test''))',
      r.relname, r.conname
    );
  END LOOP;
END
$vestiging$;

-- Zoeken: naam, aliassen op West/Midsland/Test, concept-artikelen en eerdere bestellingen.
-- Vestiging rangschikt (op_vestiging) en filtert niet weg.
-- Geen prijzen in het resultaat. Historie-factor 0,85 = HISTORIE_SCORE_FACTOR in src/lib/bordZoeken.ts.
CREATE OR REPLACE FUNCTION public.artikel_zoek_v2(p_vestiging text, p_tekst text, p_limit integer DEFAULT 15)
 RETURNS TABLE(
   artikel_id uuid,
   naam text,
   score numeric,
   status text,
   bron text,
   standaard_vorm text,
   standaard_eenheid text,
   op_vestiging boolean
 )
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE q text; lim int;
BEGIN
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West', 'Midsland', 'Test') THEN
    RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE = '22023';
  END IF;
  IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(), p_vestiging) THEN
    RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE = '42501';
  END IF;
  IF p_tekst IS NULL OR length(p_tekst) > 500 THEN
    RAISE EXCEPTION 'Zoektekst ontbreekt of is te lang' USING ERRCODE = '22023';
  END IF;
  q := public.bestelbot_normaliseer(p_tekst);
  IF q = '' THEN RETURN; END IF;
  lim := LEAST(GREATEST(COALESCE(p_limit, 15), 1), 50);

  RETURN QUERY
  WITH artikel_norm AS (
    SELECT DISTINCT public.bestelbot_normaliseer(a.naam) AS n
    FROM public.artikelen a
    WHERE a.deleted_at IS NULL AND public.bestelbot_normaliseer(a.naam) <> ''
    UNION
    SELECT DISTINCT aa.alias_norm
    FROM public.artikel_aliassen aa
    JOIN public.artikelen a ON a.id = aa.artikel_id
    WHERE aa.deleted_at IS NULL AND a.deleted_at IS NULL AND aa.alias_norm <> ''
      AND aa.vestiging IN ('West', 'Midsland', 'Test')
  ), bronnen AS (
    SELECT a.id AS aid,
           a.naam AS tekst,
           a.naam AS toonnaam,
           COALESCE(a.status, 'actief') AS artikelstatus,
           'artikel'::text AS soort_bron,
           EXISTS (
             SELECT 1 FROM public.artikel_locaties al
             WHERE al.artikel_id = a.id AND al.vestiging = p_vestiging
               AND al.is_actief AND al.deleted_at IS NULL
           ) AS lokaal
    FROM public.artikelen a
    WHERE a.deleted_at IS NULL
    UNION ALL
    SELECT a.id, aa.alias, a.naam, COALESCE(a.status, 'actief'), 'artikel',
           EXISTS (
             SELECT 1 FROM public.artikel_locaties al
             WHERE al.artikel_id = a.id AND al.vestiging = p_vestiging
               AND al.is_actief AND al.deleted_at IS NULL
           )
    FROM public.artikel_aliassen aa
    JOIN public.artikelen a ON a.id = aa.artikel_id
    WHERE aa.deleted_at IS NULL AND a.deleted_at IS NULL
      AND aa.vestiging IN ('West', 'Midsland', 'Test')
    UNION ALL
    SELECT NULL::uuid, h.artikel_naam_ruw, h.artikel_naam_ruw, NULL::text, 'historie', false
    FROM public.bestel_historie_import h
    WHERE h.vestiging = p_vestiging AND h.artikel_id IS NULL
    UNION ALL
    SELECT NULL::uuid, s.naam, s.naam, NULL::text, 'historie', false
    FROM public.bestel_signalen s
    WHERE s.vestiging = p_vestiging
      AND s.artikel_id IS NULL
      AND s.status IN ('besteld', 'geleverd')
  ), gescoord AS (
    SELECT b.aid, b.toonnaam, b.artikelstatus, b.soort_bron, b.lokaal, nn.n,
      CASE
        WHEN nn.n = '' THEN NULL
        WHEN nn.n = q THEN 1.0
        WHEN nn.n LIKE q || '%' THEN 0.9
        WHEN EXISTS (
          SELECT 1 FROM regexp_split_to_table(lower(extensions.unaccent(coalesce(b.tekst, ''))), '[^[:alnum:]]+') w
          WHERE w <> '' AND w LIKE q || '%'
        ) THEN 0.8
        WHEN strpos(nn.n, q) > 0 THEN 0.6
        WHEN length(q) >= 3 AND extensions.similarity(nn.n, q) >= 0.25 THEN extensions.similarity(nn.n, q)::numeric
        ELSE NULL
      END AS s
    FROM bronnen b
    CROSS JOIN LATERAL (SELECT public.bestelbot_normaliseer(b.tekst) AS n) nn
    WHERE b.soort_bron = 'artikel'
       OR NOT EXISTS (SELECT 1 FROM artikel_norm an WHERE an.n = public.bestelbot_normaliseer(b.tekst))
  ), best AS (
    SELECT g.aid, g.soort_bron,
      CASE WHEN g.soort_bron = 'artikel' THEN NULL ELSE g.n END AS n,
      max(g.s) AS s,
      bool_or(g.lokaal) AS lokaal,
      (array_agg(g.toonnaam ORDER BY g.s DESC NULLS LAST, g.toonnaam))[1] AS toonnaam,
      (array_agg(g.artikelstatus ORDER BY g.s DESC NULLS LAST))[1] AS artikelstatus
    FROM gescoord g
    WHERE g.s IS NOT NULL
    GROUP BY g.aid, g.soort_bron, CASE WHEN g.soort_bron = 'artikel' THEN NULL ELSE g.n END
  ), rijk AS (
    SELECT b.aid, b.soort_bron, b.n, b.lokaal, b.toonnaam, b.artikelstatus,
      round((b.s * CASE WHEN b.soort_bron = 'artikel' THEN 1 ELSE 0.85 END)::numeric, 3) AS score_afgerond
    FROM best b
  )
  SELECT r.aid,
         r.toonnaam,
         r.score_afgerond,
         CASE WHEN r.soort_bron = 'artikel' THEN r.artikelstatus ELSE NULL::text END,
         r.soort_bron,
         CASE WHEN r.soort_bron = 'artikel' THEN (
           SELECT v.vorm FROM public.artikel_vormen v
           WHERE v.artikel_id = r.aid AND v.deleted_at IS NULL AND v.is_standaard
           ORDER BY (v.vestiging = p_vestiging) DESC, v.vorm
           LIMIT 1
         ) ELSE NULL::text END,
         CASE WHEN r.soort_bron = 'artikel' THEN (
           SELECT v.eenheid FROM public.artikel_vormen v
           WHERE v.artikel_id = r.aid AND v.deleted_at IS NULL AND v.is_standaard
           ORDER BY (v.vestiging = p_vestiging) DESC, v.eenheid
           LIMIT 1
         ) ELSE NULL::text END,
         r.lokaal
  FROM rijk r
  ORDER BY r.score_afgerond DESC, r.lokaal DESC, r.toonnaam, r.aid
  LIMIT lim;
END;
$function$;

REVOKE ALL ON FUNCTION public.artikel_zoek_v2(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.artikel_zoek_v2(text, text, integer) TO authenticated, service_role;

-- Concept na een bestelling zonder sterke treffer.
-- Idempotent op genormaliseerde naam: dezelfde naam levert hetzelfde artikel.
-- Nieuw: status concept, een actieve locatie en een alias op West, Midsland én Test.
-- Bestaand: alleen de gevraagde vestiging erbij, zonder een inactieve locatie weer aan te zetten.
-- De alias-trigger eist een actieve locatie, daarom hoort bij elke alias een locatie.
-- Leverancier alleen als die op die vestiging actief is. Test heeft die check niet, dus daar blijft hij leeg.
-- Deze functie schrijft niet naar bestel_signalen.
CREATE OR REPLACE FUNCTION public.rpc_bord_maak_concept_artikel_v2(
  p_vestiging text,
  p_naam text,
  p_leverancier_id uuid
) RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  q text;
  v_id uuid;
  v_nieuw boolean := false;
  v_locs text[];
  v_loc text;
BEGIN
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West', 'Midsland', 'Test') THEN
    RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE = '22023';
  END IF;
  IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(), p_vestiging) THEN
    RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE = '42501';
  END IF;
  IF p_naam IS NULL OR length(btrim(p_naam)) > 500 THEN
    RAISE EXCEPTION 'Naam ontbreekt of is te lang' USING ERRCODE = '22023';
  END IF;
  q := public.bestelbot_normaliseer(p_naam);
  IF q = '' THEN
    RAISE EXCEPTION 'Naam moet letters of cijfers bevatten' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('artikelstam:' || q, 0));

  SELECT a.id INTO v_id
  FROM public.artikelen a
  WHERE a.deleted_at IS NULL
    AND (
      public.bestelbot_normaliseer(a.naam) = q
      OR EXISTS (
        SELECT 1 FROM public.artikel_aliassen aa
        WHERE aa.artikel_id = a.id AND aa.deleted_at IS NULL AND aa.alias_norm = q
          AND aa.vestiging IN ('West', 'Midsland', 'Test')
      )
    )
  ORDER BY
    EXISTS (
      SELECT 1 FROM public.artikel_locaties al
      WHERE al.artikel_id = a.id AND al.vestiging = p_vestiging AND al.deleted_at IS NULL
    ) DESC,
    (COALESCE(a.status, 'actief') = 'actief') DESC,
    a.created_at
  LIMIT 1;

  IF v_id IS NULL THEN
    BEGIN
      INSERT INTO public.artikelen (naam, soort, status)
      VALUES (btrim(p_naam), 'ingekocht', 'concept')
      RETURNING id INTO v_id;
      v_nieuw := true;
    EXCEPTION
      WHEN unique_violation THEN
        -- Zelfde naam bestaat al (ook zacht verwijderd). Geen tweede stamregel.
        SELECT a.id INTO v_id
        FROM public.artikelen a
        WHERE lower(a.naam) = lower(btrim(p_naam))
           OR public.bestelbot_normaliseer(a.naam) = q
        ORDER BY (a.deleted_at IS NULL) DESC, a.created_at
        LIMIT 1;
        IF v_id IS NULL THEN
          RAISE;
        END IF;
    END;
  END IF;

  UPDATE public.artikelen
  SET deleted_at = NULL
  WHERE id = v_id AND deleted_at IS NOT NULL;

  IF v_nieuw THEN
    v_locs := ARRAY['West', 'Midsland', 'Test'];
  ELSE
    v_locs := ARRAY[p_vestiging];
  END IF;

  FOREACH v_loc IN ARRAY v_locs LOOP
    INSERT INTO public.artikel_locaties (artikel_id, vestiging, is_actief)
    VALUES (v_id, v_loc, true)
    ON CONFLICT (artikel_id, vestiging) DO NOTHING;

    BEGIN
      INSERT INTO public.artikel_aliassen (vestiging, alias, alias_norm, artikel_id, leverancier_id, bron)
      VALUES (
        v_loc,
        btrim(p_naam),
        q,
        v_id,
        CASE
          WHEN p_leverancier_id IS NOT NULL AND public.bestelbot_leverancier_actief(p_leverancier_id, v_loc)
          THEN p_leverancier_id
          ELSE NULL
        END,
        'bord'
      );
    EXCEPTION
      WHEN unique_violation OR check_violation THEN
        NULL;
    END;
  END LOOP;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_bord_maak_concept_artikel_v2(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_bord_maak_concept_artikel_v2(text, text, uuid) TO authenticated, service_role;
