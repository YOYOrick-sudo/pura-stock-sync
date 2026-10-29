CREATE OR REPLACE VIEW public.v_prijs_signaal WITH (security_invoker = true) AS
WITH a AS (
  SELECT p.*, coalesce(p.artikel_id::text, lower(p.naam)) AS sleutel, coalesce(p.verpakking, lower(p.naam)) AS vp,
    row_number() OVER (PARTITION BY p.vestiging, p.leverancier_id, coalesce(p.artikel_id::text, lower(p.naam)), coalesce(p.verpakking, lower(p.naam)) ORDER BY p.datum DESC, p.id DESC) AS rn
  FROM public.v_prijs_aankoop p),
live AS (
  SELECT v.vestiging, w.leverancier_id, w.leverancier_naam, w.artikel_id, w.naam, w.prijs_excl, w.waargenomen_op, w.eenheid,
    coalesce(w.artikel_id::text, lower(w.naam)) AS sleutel, coalesce(w.verpakking, lower(w.naam)) AS vp,
    row_number() OVER (PARTITION BY v.vestiging, w.leverancier_id, coalesce(w.artikel_id::text, lower(w.naam)), coalesce(w.verpakking, lower(w.naam)) ORDER BY w.waargenomen_op DESC, w.created_at DESC) AS rn
  FROM public.prijs_waarneming w CROSS JOIN (VALUES ('West'), ('Midsland')) v(vestiging)
  WHERE (w.vestiging IS NULL OR w.vestiging = v.vestiging) AND w.bron = 'kooyman_api'
    AND w.waargenomen_op >= (now() AT TIME ZONE 'Europe/Amsterdam')::date - 3),
k AS (SELECT DISTINCT vestiging, leverancier_id, sleutel, vp FROM a UNION SELECT vestiging, leverancier_id, sleutel, vp FROM live WHERE rn = 1),
s AS (
  SELECT k.vestiging, k.leverancier_id, k.sleutel, k.vp,
    coalesce(la.leverancier, li.leverancier_naam) AS leverancier, coalesce(la.artikel_id, li.artikel_id) AS artikel_id, coalesce(la.naam, li.naam) AS naam,
    coalesce(la.verpakking, CASE WHEN k.vp <> lower(coalesce(la.naam, li.naam)) THEN k.vp END) AS verpakking,
    coalesce(la.eenheid, li.eenheid) AS eenheid, li.prijs_excl AS live_prijs, la.prijs_excl AS laatste_prijs, la.datum AS laatste_datum,
    vg.normale, vg.n
  FROM k
  LEFT JOIN live li ON li.rn = 1 AND li.vestiging = k.vestiging AND li.leverancier_id IS NOT DISTINCT FROM k.leverancier_id AND li.sleutel = k.sleutel AND li.vp = k.vp
  LEFT JOIN a la ON la.rn = 1 AND la.vestiging = k.vestiging AND la.leverancier_id IS NOT DISTINCT FROM k.leverancier_id AND la.sleutel = k.sleutel AND la.vp = k.vp
  LEFT JOIN LATERAL (
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x.prijs_excl)::numeric AS normale, count(*) AS n
    FROM a x WHERE x.vestiging = k.vestiging AND x.leverancier_id IS NOT DISTINCT FROM k.leverancier_id AND x.sleutel = k.sleutel AND x.vp = k.vp
      AND x.rn BETWEEN CASE WHEN li.prijs_excl IS NULL THEN 2 ELSE 1 END AND CASE WHEN li.prijs_excl IS NULL THEN 4 ELSE 3 END) vg ON true)
SELECT s.vestiging, s.leverancier_id, s.leverancier, s.artikel_id, s.naam, s.verpakking, s.eenheid,
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
COMMENT ON VIEW public.v_prijs_signaal IS 'Prijssignaal per besteleenheid excl. btw, per verpakking (zonder herkenbare verpakking: per productnaam). nu = Kooyman live (≤3 dagen) anders laatste factuur; normaal = mediaan laatste 3 vergelijkbare aankopen (zonder de nu-factuur). pijl bij n_vergelijk ≥ 2 en |verschil| ≥ 3%.';