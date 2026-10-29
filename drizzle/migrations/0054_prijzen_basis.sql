-- B. Prijzen
CREATE OR REPLACE FUNCTION public.verpakking_naar_basis(p_verpakking text, p_naam text)
RETURNS TABLE(inhoud numeric, basis text, verpakking text)
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE tok text; s text; m text[]; q numeric; u text;
BEGIN
  tok := nullif(trim(p_verpakking), '');
  IF tok IS NULL OR tok !~ '[0-9]' THEN
    SELECT r.x[1] INTO tok FROM regexp_matches(coalesce(p_naam,''),
      '((?:[0-9]+\s*[x×]\s*){0,2}[0-9]+(?:[.,][0-9]+)?\s*(?:kg|gram|gr|g|liter|ltr|lt|l|cl|ml|stuks|stk|st))(?![[:alpha:]])', 'gi')
      WITH ORDINALITY AS r(x, i) ORDER BY r.i DESC LIMIT 1;
  END IF;
  IF tok IS NULL THEN RETURN QUERY SELECT NULL::numeric, NULL::text, NULL::text; RETURN; END IF;
  s := replace(lower(regexp_replace(tok, '\s+', '', 'g')), '×', 'x');
  m := regexp_match(s, '^(?:([0-9]+)x)?(?:([0-9]+)x)?([0-9]+(?:[.,][0-9]+)?)(kg|gram|gr|g|liter|ltr|lt|l|cl|ml|stuks|stk|st)$');
  IF m IS NULL THEN RETURN QUERY SELECT NULL::numeric, NULL::text, tok; RETURN; END IF;
  q := replace(m[3], ',', '.')::numeric * coalesce(m[1]::numeric, 1) * coalesce(m[2]::numeric, 1);
  u := m[4];
  RETURN QUERY SELECT
    CASE WHEN u = 'kg' THEN q WHEN u IN ('gram','gr','g') THEN q/1000 WHEN u IN ('liter','ltr','lt','l') THEN q
         WHEN u = 'cl' THEN q/100 WHEN u = 'ml' THEN q/1000 ELSE q END,
    CASE WHEN u IN ('kg','gram','gr','g') THEN 'kg' WHEN u IN ('liter','ltr','lt','l','cl','ml') THEN 'l' ELSE 'st' END,
    tok;
END $$;
GRANT EXECUTE ON FUNCTION public.verpakking_naar_basis(text, text) TO authenticated, service_role;

-- Inhoud per besteleenheid: bekende leveranciersinhoud gaat voor tekst uit verpakking/naam.
CREATE OR REPLACE FUNCTION public.prijs_inhoud(p_leverancier uuid, p_artikel uuid, p_vestiging text, p_verpakking text, p_naam text)
RETURNS TABLE(inhoud numeric, basis text, verpakking text)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH t AS (SELECT * FROM public.verpakking_naar_basis(p_verpakking, p_naam)),
  bekend AS (
    SELECT x.inh * e.factor_naar_basis / CASE WHEN e.basis_code IN ('g','ml') THEN 1000 ELSE 1 END AS inhoud,
           CASE e.basis_code WHEN 'g' THEN 'kg' WHEN 'ml' THEN 'l' WHEN 'stuk' THEN 'st' END AS basis
    FROM (SELECT coalesce(
            (SELECT lav.inhoud_per_besteleenheid FROM public.leverancier_artikel_vestiging lav WHERE lav.leverancier_id = p_leverancier AND lav.artikel_id = p_artikel AND lav.vestiging = p_vestiging AND lav.deleted_at IS NULL AND lav.inhoud_per_besteleenheid > 0 LIMIT 1),
            (SELECT la.inhoud_per_besteleenheid FROM public.leverancier_artikelen la WHERE la.leverancier_id = p_leverancier AND la.artikel_id = p_artikel AND la.deleted_at IS NULL AND la.inhoud_per_besteleenheid > 0 LIMIT 1)) inh) x
    JOIN public.artikelen a ON a.id = p_artikel
    JOIN public.eenheden e ON e.id = a.basis_eenheid_id
    WHERE x.inh IS NOT NULL AND e.basis_code IN ('g','ml','stuk'))
  SELECT coalesce((SELECT inhoud FROM bekend), t.inhoud), coalesce((SELECT basis FROM bekend), t.basis), t.verpakking FROM t
$$;

-- Artikel zoeken: artikelnummer bij leverancier, anders alias, anders exacte naam uit gekoppelde historie (vestiging-gebonden).
CREATE OR REPLACE FUNCTION public.prijs_artikel_zoeken(p_vestiging text, p_leverancier uuid, p_artikelnummer text, p_naam text)
RETURNS uuid LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE ids uuid[]; n text := public.bestelbot_normaliseer(p_naam);
BEGIN
  IF nullif(trim(p_artikelnummer),'') IS NOT NULL AND p_leverancier IS NOT NULL THEN
    SELECT array_agg(DISTINCT artikel_id) INTO ids FROM (
      SELECT artikel_id FROM public.leverancier_artikel_vestiging WHERE leverancier_id = p_leverancier AND artikelnummer = trim(p_artikelnummer) AND deleted_at IS NULL AND (p_vestiging IS NULL OR vestiging = p_vestiging)
      UNION SELECT artikel_id FROM public.leverancier_artikelen WHERE leverancier_id = p_leverancier AND artikelnummer = trim(p_artikelnummer) AND deleted_at IS NULL) x;
    IF cardinality(ids) = 1 THEN RETURN ids[1]; END IF;
  END IF;
  IF n = '' THEN RETURN NULL; END IF;
  SELECT array_agg(DISTINCT artikel_id) INTO ids FROM public.artikel_aliassen
   WHERE alias_norm = n AND deleted_at IS NULL AND (p_vestiging IS NULL OR vestiging = p_vestiging) AND (leverancier_id IS NULL OR p_leverancier IS NULL OR leverancier_id = p_leverancier);
  IF cardinality(ids) = 1 THEN RETURN ids[1]; END IF;
  SELECT array_agg(DISTINCT artikel_id) INTO ids FROM public.bestel_historie_import
   WHERE artikel_id IS NOT NULL AND (p_vestiging IS NULL OR vestiging = p_vestiging) AND public.bestelbot_normaliseer(artikel_naam_ruw) = n;
  IF cardinality(ids) = 1 THEN RETURN ids[1]; END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.prijs_artikel_zoeken(text, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prijs_artikel_zoeken(text, uuid, text, text) TO service_role;

CREATE TABLE public.prijs_waarneming (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text CHECK (vestiging IN ('West','Midsland')),
  leverancier_id uuid REFERENCES public.leveranciers(id),
  leverancier_naam text NOT NULL,
  artikel_id uuid REFERENCES public.artikelen(id),
  artikelnummer text,
  naam text NOT NULL,
  verpakking text,
  eenheid text,
  inhoud numeric,
  basis_eenheid text CHECK (basis_eenheid IN ('kg','l','st')),
  prijs_excl numeric NOT NULL CHECK (prijs_excl > 0),
  prijs_per_basis numeric,
  waargenomen_op date NOT NULL,
  bron text NOT NULL CHECK (bron IN ('kooyman_api','catalogus','factuur','handmatig')),
  geverifieerd boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX prijs_waarneming_uniek ON public.prijs_waarneming
  (coalesce(vestiging,''), leverancier_naam, coalesce(artikelnummer, lower(naam)), coalesce(verpakking,''), waargenomen_op, bron);
CREATE INDEX prijs_waarneming_artikel ON public.prijs_waarneming (artikel_id, leverancier_id, waargenomen_op DESC);
GRANT SELECT, INSERT, UPDATE ON public.prijs_waarneming TO authenticated;
GRANT ALL ON public.prijs_waarneming TO service_role;
ALTER TABLE public.prijs_waarneming ENABLE ROW LEVEL SECURITY;
CREATE POLICY prijs_waarneming_lezen ON public.prijs_waarneming FOR SELECT TO authenticated USING (true);
CREATE POLICY prijs_waarneming_eigenaar_insert ON public.prijs_waarneming FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY prijs_waarneming_eigenaar_update ON public.prijs_waarneming FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
COMMENT ON TABLE public.prijs_waarneming IS 'Prijswaarnemingen per besteleenheid excl. btw (Kooyman API, catalogus, factuur, handmatig). vestiging NULL = beide. Bot schrijft via actie prijzen.';

CREATE OR REPLACE FUNCTION public.bestelbot_prijzen_opslaan(p_rijen jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE r jsonb; i int := 0; nieuw int := 0; bij int := 0; gek int := 0; v text; lev uuid; art uuid; b record; ins boolean; dt date;
BEGIN
  IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_rijen) <> 'array' OR jsonb_array_length(p_rijen) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'rijen: 1-1000 items'; END IF;
  FOR r IN SELECT * FROM jsonb_array_elements(p_rijen) LOOP
    i := i + 1;
    v := nullif(r->>'vestiging','');
    IF v IS NOT NULL AND v NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'rij %: vestiging moet West, Midsland of leeg zijn', i; END IF;
    IF nullif(trim(r->>'naam'),'') IS NULL OR length(r->>'naam') > 300 THEN RAISE EXCEPTION 'rij %: naam verplicht (max 300)', i; END IF;
    IF nullif(trim(r->>'leverancier_naam'),'') IS NULL OR length(r->>'leverancier_naam') > 200 THEN RAISE EXCEPTION 'rij %: leverancier_naam verplicht', i; END IF;
    IF jsonb_typeof(r->'prijs_excl') IS DISTINCT FROM 'number' OR (r->>'prijs_excl')::numeric <= 0 OR (r->>'prijs_excl')::numeric > 100000 THEN RAISE EXCEPTION 'rij %: prijs_excl moet een getal > 0 zijn', i; END IF;
    IF coalesce(r->>'bron','') NOT IN ('kooyman_api','catalogus','factuur','handmatig') THEN RAISE EXCEPTION 'rij %: ongeldige bron', i; END IF;
    IF coalesce(r->>'waargenomen_op','') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'rij %: waargenomen_op moet YYYY-MM-DD zijn', i; END IF;
    dt := (r->>'waargenomen_op')::date;
    IF length(coalesce(r->>'artikelnummer','')) > 100 OR length(coalesce(r->>'verpakking','')) > 100 OR length(coalesce(r->>'eenheid','')) > 40 THEN RAISE EXCEPTION 'rij %: tekstveld te lang', i; END IF;
    SELECT id INTO lev FROM public.leveranciers WHERE deleted_at IS NULL AND lower(naam) = lower(trim(r->>'leverancier_naam')) LIMIT 1;
    art := public.prijs_artikel_zoeken(v, lev, r->>'artikelnummer', r->>'naam');
    SELECT * INTO b FROM public.prijs_inhoud(lev, art, coalesce(v,'Midsland'), r->>'verpakking', r->>'naam');
    IF art IS NOT NULL THEN gek := gek + 1; END IF;
    INSERT INTO public.prijs_waarneming (vestiging, leverancier_id, leverancier_naam, artikel_id, artikelnummer, naam, verpakking, eenheid, inhoud, basis_eenheid, prijs_excl, prijs_per_basis, waargenomen_op, bron, geverifieerd)
    VALUES (v, lev, trim(r->>'leverancier_naam'), art, nullif(trim(r->>'artikelnummer'),''), trim(r->>'naam'), nullif(trim(r->>'verpakking'),''), nullif(trim(r->>'eenheid'),''),
      b.inhoud, b.basis, (r->>'prijs_excl')::numeric, (r->>'prijs_excl')::numeric / nullif(b.inhoud,0), dt, r->>'bron',
      coalesce((r->>'geverifieerd')::boolean, r->>'bron' IN ('kooyman_api','factuur')))
    ON CONFLICT (coalesce(vestiging,''), leverancier_naam, coalesce(artikelnummer, lower(naam)), coalesce(verpakking,''), waargenomen_op, bron)
    DO UPDATE SET prijs_excl = excluded.prijs_excl, prijs_per_basis = excluded.prijs_per_basis, inhoud = excluded.inhoud, basis_eenheid = excluded.basis_eenheid,
      artikel_id = coalesce(excluded.artikel_id, prijs_waarneming.artikel_id), leverancier_id = coalesce(excluded.leverancier_id, prijs_waarneming.leverancier_id),
      eenheid = excluded.eenheid, geverifieerd = excluded.geverifieerd
    RETURNING (xmax = 0) INTO ins;
    IF ins THEN nieuw := nieuw + 1; ELSE bij := bij + 1; END IF;
  END LOOP;
  RETURN jsonb_build_object('ok', true, 'nieuw', nieuw, 'bijgewerkt', bij, 'gekoppeld', gek);
END $$;
REVOKE ALL ON FUNCTION public.bestelbot_prijzen_opslaan(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_prijzen_opslaan(jsonb) TO service_role;

CREATE OR REPLACE VIEW public.v_prijs_aankoop WITH (security_invoker = true) AS
SELECT h.id, h.vestiging, h.leverancier_id, coalesce(l.naam, h.leverancier_naam_ruw) AS leverancier, h.artikel_id, h.artikel_naam_ruw AS naam,
  vb.verpakking, public.besteleenheid_norm(h.eenheid_ruw) AS eenheid, h.besteldatum AS datum, h.prijs AS prijs_excl,
  vb.inhoud, vb.basis AS basis_eenheid, h.prijs / nullif(vb.inhoud, 0) AS prijs_per_basis, h.aantal, h.bron
FROM public.bestel_historie_import h
LEFT JOIN public.leveranciers l ON l.id = h.leverancier_id
CROSS JOIN LATERAL public.prijs_inhoud(h.leverancier_id, h.artikel_id, h.vestiging, h.verpakking_ruw, h.artikel_naam_ruw) vb
WHERE h.prijs > 0 AND h.aantal > 0 AND h.bron NOT ILIKE '%emballage%'
  AND NOT (h.bron LIKE 'kooyman_factuur_drive%' AND EXISTS (
    SELECT 1 FROM public.bestel_historie_import a WHERE a.vestiging = h.vestiging AND a.bron LIKE 'kooyman_api%'
      AND a.aantal = h.aantal AND abs(a.besteldatum - h.besteldatum) <= 7 AND lower(a.artikel_naam_ruw) = lower(h.artikel_naam_ruw)));
COMMENT ON VIEW public.v_prijs_aankoop IS 'Aankopen met prijs>0 en aantal>0 (prijs per besteleenheid excl. btw). Kooyman-factuurregels die al als API-order bestaan (zelfde naam/aantal, ≤7 dagen) en emballage tellen niet mee.';

CREATE OR REPLACE FUNCTION public.euro_nl(p numeric) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT '€' || replace(to_char(round(p, 2), 'FM999999990.00'), '.', ',')
$$;

CREATE OR REPLACE VIEW public.v_prijs_signaal WITH (security_invoker = true) AS
WITH a AS (
  SELECT p.*, coalesce(p.artikel_id::text, lower(p.naam)) AS sleutel, coalesce(p.verpakking, '') AS vp,
    row_number() OVER (PARTITION BY p.vestiging, p.leverancier_id, coalesce(p.artikel_id::text, lower(p.naam)), coalesce(p.verpakking, '') ORDER BY p.datum DESC, p.id DESC) AS rn
  FROM public.v_prijs_aankoop p),
live AS (
  SELECT v.vestiging, w.leverancier_id, w.leverancier_naam, w.artikel_id, w.naam, w.prijs_excl, w.waargenomen_op, w.eenheid,
    coalesce(w.artikel_id::text, lower(w.naam)) AS sleutel, coalesce(w.verpakking, '') AS vp,
    row_number() OVER (PARTITION BY v.vestiging, w.leverancier_id, coalesce(w.artikel_id::text, lower(w.naam)), coalesce(w.verpakking, '') ORDER BY w.waargenomen_op DESC, w.created_at DESC) AS rn
  FROM public.prijs_waarneming w CROSS JOIN (VALUES ('West'), ('Midsland')) v(vestiging)
  WHERE (w.vestiging IS NULL OR w.vestiging = v.vestiging) AND w.bron = 'kooyman_api'
    AND w.waargenomen_op >= (now() AT TIME ZONE 'Europe/Amsterdam')::date - 3),
k AS (SELECT DISTINCT vestiging, leverancier_id, sleutel, vp FROM a UNION SELECT vestiging, leverancier_id, sleutel, vp FROM live WHERE rn = 1),
s AS (
  SELECT k.vestiging, k.leverancier_id, k.sleutel, k.vp,
    coalesce(la.leverancier, li.leverancier_naam) AS leverancier, coalesce(la.artikel_id, li.artikel_id) AS artikel_id, coalesce(la.naam, li.naam) AS naam,
    coalesce(la.eenheid, li.eenheid) AS eenheid, li.prijs_excl AS live_prijs, la.prijs_excl AS laatste_prijs, la.datum AS laatste_datum,
    vg.normale, vg.n
  FROM k
  LEFT JOIN live li ON li.rn = 1 AND li.vestiging = k.vestiging AND li.leverancier_id IS NOT DISTINCT FROM k.leverancier_id AND li.sleutel = k.sleutel AND li.vp = k.vp
  LEFT JOIN a la ON la.rn = 1 AND la.vestiging = k.vestiging AND la.leverancier_id IS NOT DISTINCT FROM k.leverancier_id AND la.sleutel = k.sleutel AND la.vp = k.vp
  LEFT JOIN LATERAL (
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x.prijs_excl)::numeric AS normale, count(*) AS n
    FROM a x WHERE x.vestiging = k.vestiging AND x.leverancier_id IS NOT DISTINCT FROM k.leverancier_id AND x.sleutel = k.sleutel AND x.vp = k.vp
      AND x.rn BETWEEN CASE WHEN li.prijs_excl IS NULL THEN 2 ELSE 1 END AND CASE WHEN li.prijs_excl IS NULL THEN 4 ELSE 3 END) vg ON true)
SELECT s.vestiging, s.leverancier_id, s.leverancier, s.artikel_id, s.naam, nullif(s.vp, '') AS verpakking, s.eenheid,
  coalesce(s.live_prijs, s.laatste_prijs) AS nu_prijs,
  CASE WHEN s.live_prijs IS NOT NULL THEN 'kooyman_live' ELSE 'laatste_factuur' END AS nu_bron,
  s.laatste_datum, round(s.normale, 4) AS normale_prijs, coalesce(s.n, 0)::int AS n_vergelijk,
  round(coalesce(s.live_prijs, s.laatste_prijs) - s.normale, 2) AS verschil_eur,
  round(100 * (coalesce(s.live_prijs, s.laatste_prijs) - s.normale) / nullif(s.normale, 0), 1) AS verschil_pct,
  CASE WHEN s.normale IS NULL THEN NULL
       WHEN round(coalesce(s.live_prijs, s.laatste_prijs), 2) < round(s.normale, 2) THEN 'omlaag'
       WHEN round(coalesce(s.live_prijs, s.laatste_prijs), 2) > round(s.normale, 2) THEN 'omhoog' ELSE 'gelijk' END AS richting,
  coalesce(s.n >= 2 AND abs(100 * (coalesce(s.live_prijs, s.laatste_prijs) - s.normale) / nullif(s.normale, 0)) >= 3, false) AS pijl,
  CASE WHEN s.normale IS NOT NULL THEN 'was ' || public.euro_nl(s.normale) || ', nu ' || public.euro_nl(coalesce(s.live_prijs, s.laatste_prijs)) END AS tooltip
FROM s;
COMMENT ON VIEW public.v_prijs_signaal IS 'Prijssignaal per besteleenheid excl. btw. nu = Kooyman live (≤3 dagen) anders laatste factuur; normaal = mediaan laatste 3 vergelijkbare aankopen (zonder de nu-factuur). pijl bij n_vergelijk ≥ 2 en |verschil| ≥ 3%.';

-- Bord leest signalen via deze functie: medewerkers zien alleen prijsniveau, geen inkoophistorie.
CREATE OR REPLACE FUNCTION public.prijs_signalen_bord(p_vestiging text)
RETURNS SETOF public.v_prijs_signaal LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(), p_vestiging) THEN RAISE EXCEPTION 'Geen vestigingstoegang' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT * FROM public.v_prijs_signaal WHERE vestiging = p_vestiging AND normale_prijs IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.prijs_signalen_bord(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prijs_signalen_bord(text) TO authenticated, service_role;
GRANT SELECT ON public.v_prijs_aankoop, public.v_prijs_signaal TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.voorraad_effectieve_opslag_pct(uuid), public.opslag_groep_voor(uuid, text), public.verpakking_naar_basis(text, text) FROM PUBLIC, anon;