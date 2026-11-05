-- Bordzoeken: actieve artikelen plus historie en vrije bordnamen.
-- Kolom bron is 'artikel', 'historie' (import zonder actief artikel) of 'concept' (vrije bordnaam).
-- Standaardlimiet 8 → 15, maximum blijft 50. Historie en concept scoren maal 0.85.
-- DROP FUNCTION is nodig: PostgreSQL weigert CREATE OR REPLACE als de returntabel breder wordt.
-- Geen DROP of wijziging van tabellen. Niet uitvoeren op productie vanuit de agent die dit bestand toevoegde.
-- Rollback: docs/research/fn_rpc_bord_suggesties_huidig.sql (live definitie van 5 nov 2026).
-- Historie-factor 0.85 hoort gelijk te blijven aan HISTORIE_SCORE_FACTOR in src/lib/bordZoeken.ts.

DROP FUNCTION IF EXISTS public.rpc_bord_suggesties(text, text, integer);

CREATE OR REPLACE FUNCTION public.rpc_bord_suggesties(p_vestiging text, p_tekst text, p_limit integer DEFAULT 15)
 RETURNS TABLE(artikel_id uuid, naam text, leverancier_id uuid, score numeric, standaard_eenheid text, standaard_vorm text, vormen jsonb, bron text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE q text; lim int;
BEGIN
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
  IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),p_vestiging) THEN RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE='42501'; END IF;
  IF p_tekst IS NULL OR length(p_tekst)>500 THEN RAISE EXCEPTION 'Zoektekst ontbreekt of is te lang' USING ERRCODE='22023'; END IF;
  q := public.bestelbot_normaliseer(p_tekst);
  IF q = '' THEN RETURN; END IF;
  lim := LEAST(GREATEST(COALESCE(p_limit,15),1),50);
  RETURN QUERY
  WITH actief AS (
    SELECT a.id, a.naam FROM public.artikelen a
    WHERE a.deleted_at IS NULL
      AND a.soort IS DISTINCT FROM 'halffabricaat'
      AND EXISTS (
        SELECT 1 FROM public.artikel_locaties al
        WHERE al.artikel_id=a.id AND al.vestiging=p_vestiging AND al.is_actief AND al.deleted_at IS NULL
      )
  ), teksten AS (
    SELECT x.id AS artikel_id, x.naam AS tekst FROM actief x
    UNION ALL
    SELECT x.id, aa.alias FROM actief x
    JOIN public.artikel_aliassen aa ON aa.artikel_id=x.id
    WHERE aa.vestiging=p_vestiging AND aa.deleted_at IS NULL
    UNION ALL
    SELECT a.id, h.artikel_naam_ruw
    FROM public.bestel_historie_import h
    JOIN actief a ON a.id=h.artikel_id
    WHERE h.vestiging=p_vestiging
  ), artikel_norm AS (
    SELECT DISTINCT public.bestelbot_normaliseer(t.tekst) AS n
    FROM teksten t
    WHERE public.bestelbot_normaliseer(t.tekst) <> ''
  ), vrije AS (
    SELECT y.n,
      (array_agg(y.tekst ORDER BY y.keer DESC, y.laatst DESC, y.tekst))[1] AS toonnaam,
      sum(y.keer) AS keer,
      CASE WHEN bool_or(y.herkomst = 'historie') THEN 'historie'::text ELSE 'concept'::text END AS soort_bron
    FROM (
      SELECT public.bestelbot_normaliseer(h.artikel_naam_ruw) AS n,
        h.artikel_naam_ruw AS tekst,
        count(*)::numeric AS keer,
        max(h.besteldatum)::timestamptz AS laatst,
        'historie'::text AS herkomst
      FROM public.bestel_historie_import h
      WHERE h.vestiging=p_vestiging
        AND (h.artikel_id IS NULL OR NOT EXISTS (SELECT 1 FROM actief a WHERE a.id=h.artikel_id))
      GROUP BY h.artikel_naam_ruw
      UNION ALL
      SELECT public.bestelbot_normaliseer(s.naam),
        s.naam,
        count(*)::numeric,
        max(s.created_at),
        'concept'::text
      FROM public.bestel_signalen s
      WHERE s.vestiging=p_vestiging
        AND s.artikel_id IS NULL
        AND s.status IN ('open','besteld','geleverd')
      GROUP BY s.naam
    ) y
    WHERE y.n <> ''
    GROUP BY y.n
  ), vrije_zicht AS (
    SELECT v.n, v.toonnaam, v.keer, v.soort_bron
    FROM vrije v
    WHERE NOT EXISTS (SELECT 1 FROM artikel_norm an WHERE an.n=v.n)
  ), gescoord AS (
    SELECT bronnen.artikel_id, bronnen.soort_bron, nn.n,
      CASE
        WHEN nn.n = '' THEN NULL
        WHEN nn.n = q THEN 1.0
        WHEN nn.n LIKE q || '%' THEN 0.9
        WHEN EXISTS (
          SELECT 1 FROM regexp_split_to_table(lower(extensions.unaccent(coalesce(bronnen.tekst,''))), '[^[:alnum:]]+') w
          WHERE w <> '' AND w LIKE q || '%'
        ) THEN 0.8
        WHEN strpos(nn.n, q) > 0 THEN 0.6
        WHEN length(q) >= 3 AND extensions.similarity(nn.n, q) >= 0.25 THEN extensions.similarity(nn.n, q)::numeric
        ELSE NULL
      END AS s
    FROM (
      SELECT t.artikel_id, t.tekst, 'artikel'::text AS soort_bron FROM teksten t
      UNION ALL
      SELECT NULL::uuid, v.toonnaam, v.soort_bron FROM vrije_zicht v
    ) bronnen
    CROSS JOIN LATERAL (SELECT public.bestelbot_normaliseer(bronnen.tekst) AS n) nn
  ), best AS (
    SELECT g.artikel_id AS aid, g.soort_bron,
      CASE WHEN g.soort_bron = 'artikel' THEN NULL ELSE g.n END AS n,
      max(g.s) AS s
    FROM gescoord g
    WHERE g.s IS NOT NULL
    GROUP BY g.artikel_id, g.soort_bron, CASE WHEN g.soort_bron = 'artikel' THEN NULL ELSE g.n END
  ), rijk AS (
    SELECT b.aid, b.soort_bron, b.n,
      round((b.s * CASE WHEN b.soort_bron = 'artikel' THEN 1 ELSE 0.85 END)::numeric, 3) AS score_afgerond,
      CASE WHEN b.soort_bron = 'artikel' THEN x.naam ELSE v.toonnaam END AS toonnaam,
      CASE
        WHEN b.soort_bron = 'artikel' THEN COALESCE((
          SELECT sum(fv.keer_besteld) FROM public.artikel_vormen fv
          WHERE fv.artikel_id=b.aid AND fv.vestiging=p_vestiging AND fv.deleted_at IS NULL
        ), 0)
        ELSE COALESCE(v.keer, 0)
      END AS besteld
    FROM best b
    LEFT JOIN actief x ON b.soort_bron = 'artikel' AND x.id=b.aid
    LEFT JOIN vrije_zicht v ON b.soort_bron = v.soort_bron AND v.n=b.n
    WHERE (b.soort_bron = 'artikel' AND x.id IS NOT NULL)
       OR (b.soort_bron IN ('historie', 'concept') AND v.toonnaam IS NOT NULL)
    ORDER BY 4 DESC, 6 DESC, 5, b.aid, b.n
    LIMIT lim
  )
  SELECT r.aid, r.toonnaam,
    CASE WHEN r.soort_bron = 'artikel' THEN (
      SELECT lav.leverancier_id FROM public.leverancier_artikel_vestiging lav
      WHERE lav.artikel_id=r.aid AND lav.vestiging=p_vestiging AND lav.actief AND lav.deleted_at IS NULL
        AND lav.is_voorkeur AND public.bestelbot_leverancier_actief(lav.leverancier_id,p_vestiging)
      LIMIT 1
    ) ELSE NULL::uuid END,
    r.score_afgerond,
    CASE WHEN r.soort_bron = 'artikel' THEN (
      SELECT v.eenheid FROM public.artikel_vormen v
      WHERE v.artikel_id=r.aid AND v.vestiging=p_vestiging AND v.deleted_at IS NULL AND v.is_standaard
      LIMIT 1
    ) ELSE NULL::text END,
    CASE WHEN r.soort_bron = 'artikel' THEN (
      SELECT v.vorm FROM public.artikel_vormen v
      WHERE v.artikel_id=r.aid AND v.vestiging=p_vestiging AND v.deleted_at IS NULL AND v.is_standaard
      LIMIT 1
    ) ELSE NULL::text END,
    CASE WHEN r.soort_bron = 'artikel' THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id, 'vorm', v.vorm, 'eenheid', v.eenheid,
        'leverancier_id', v.leverancier_id, 'leverancier_naam', l.naam,
        'prijs', v.prijs, 'prijs_datum', v.prijs_datum, 'prijs_bron', v.prijs_bron,
        'is_standaard', v.is_standaard
      ) ORDER BY v.is_standaard DESC, v.keer_besteld DESC, v.vorm)
      FROM public.artikel_vormen v
      LEFT JOIN public.leveranciers l ON l.id=v.leverancier_id
      WHERE v.artikel_id=r.aid AND v.vestiging=p_vestiging AND v.deleted_at IS NULL
    ), '[]'::jsonb) ELSE '[]'::jsonb END,
    r.soort_bron
  FROM rijk r
  ORDER BY r.score_afgerond DESC, r.besteld DESC, r.toonnaam, r.aid, r.n;
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_bord_suggesties(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_bord_suggesties(text, text, integer) TO authenticated, service_role;

-- Normen die op deze vestiging minstens 2× vrij op het bord staan, of minstens 2× in de historie.
-- Alleen de genormaliseerde naam en het hoogste aantal; geen prijzen of leveranciers.
CREATE OR REPLACE FUNCTION public.rpc_bord_herhaal_namen(p_vestiging text)
 RETURNS TABLE(norm text, keer integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
  IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),p_vestiging) THEN RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE='42501'; END IF;
  RETURN QUERY
  WITH bord AS (
    SELECT public.bestelbot_normaliseer(s.naam) AS nm, count(*)::int AS kt
    FROM public.bestel_signalen s
    WHERE s.vestiging=p_vestiging AND s.artikel_id IS NULL AND s.status IN ('open','besteld','geleverd')
    GROUP BY 1
  ), hist AS (
    SELECT public.bestelbot_normaliseer(h.artikel_naam_ruw) AS nm, count(*)::int AS kt
    FROM public.bestel_historie_import h
    WHERE h.vestiging=p_vestiging
    GROUP BY 1
  )
  SELECT u.nm, u.top
  FROM (
    SELECT COALESCE(b.nm, h.nm) AS nm,
      GREATEST(COALESCE(b.kt, 0), COALESCE(h.kt, 0))::int AS top,
      COALESCE(b.kt, 0) AS bord_kt,
      COALESCE(h.kt, 0) AS hist_kt
    FROM bord b
    FULL JOIN hist h ON h.nm = b.nm
  ) u
  WHERE u.nm <> '' AND (u.bord_kt >= 2 OR u.hist_kt >= 2);
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_bord_herhaal_namen(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_bord_herhaal_namen(text) TO authenticated, service_role;

-- Ingrediënten: dezelfde normalisatie als het bord (bestelbot_normaliseer), geen browserfilter.
-- SECURITY INVOKER: de bestaande SELECT-policy op artikelen blijft gelden.
CREATE OR REPLACE FUNCTION public.rpc_ingredient_suggesties(p_tekst text, p_limit integer DEFAULT 15)
 RETURNS TABLE(id uuid, naam text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT a.id, a.naam
  FROM public.artikelen a
  WHERE p_tekst IS NOT NULL
    AND length(btrim(p_tekst)) BETWEEN 2 AND 500
    AND public.bestelbot_normaliseer(p_tekst) <> ''
    AND public.bestelbot_normaliseer(a.naam) LIKE '%' || public.bestelbot_normaliseer(p_tekst) || '%'
  ORDER BY a.naam, a.id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 15), 1), 50);
$function$;

REVOKE ALL ON FUNCTION public.rpc_ingredient_suggesties(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_ingredient_suggesties(text, integer) TO authenticated, service_role;
