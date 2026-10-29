-- C. Leverancierskeuze (basis)
CREATE TABLE public.leverancier_levering (
  leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id),
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  levert boolean NOT NULL DEFAULT true,
  leverdagen int[] CHECK (leverdagen IS NULL OR leverdagen <@ ARRAY[0,1,2,3,4,5,6]),
  bezorgkosten numeric,
  minimumorder numeric,
  gratis_vanaf numeric,
  bron text,
  notitie text,
  PRIMARY KEY (leverancier_id, vestiging)
);
GRANT SELECT, INSERT, UPDATE ON public.leverancier_levering TO authenticated;
GRANT ALL ON public.leverancier_levering TO service_role;
ALTER TABLE public.leverancier_levering ENABLE ROW LEVEL SECURITY;
CREATE POLICY lev_levering_lezen ON public.leverancier_levering FOR SELECT TO authenticated USING (true);
CREATE POLICY lev_levering_eigenaar_insert ON public.leverancier_levering FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY lev_levering_eigenaar_update ON public.leverancier_levering FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
COMMENT ON TABLE public.leverancier_levering IS 'Of en wanneer een leverancier per vestiging levert. leverdagen 0=zo..6=za, NULL = onbekend. Kosten/minimum NULL = onbekend.';

CREATE TABLE public.leverancier_keuze_regel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soort text NOT NULL CHECK (soort IN ('vast','alternatief_goedgekeurd')),
  artikel_id uuid REFERENCES public.artikelen(id),
  categorie text,
  leverancier_id uuid REFERENCES public.leveranciers(id),
  reden text NOT NULL,
  goedgekeurd_door uuid,
  goedgekeurd_op timestamptz,
  CHECK (artikel_id IS NOT NULL OR categorie IS NOT NULL OR leverancier_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE ON public.leverancier_keuze_regel TO authenticated;
GRANT ALL ON public.leverancier_keuze_regel TO service_role;
ALTER TABLE public.leverancier_keuze_regel ENABLE ROW LEVEL SECURITY;
CREATE POLICY lev_keuze_lezen ON public.leverancier_keuze_regel FOR SELECT TO authenticated USING (true);
CREATE POLICY lev_keuze_eigenaar_insert ON public.leverancier_keuze_regel FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY lev_keuze_eigenaar_update ON public.leverancier_keuze_regel FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
COMMENT ON TABLE public.leverancier_keuze_regel IS 'vast = niet van leverancier wisselen (artikel, categorie of hele leverancier). alternatief_goedgekeurd = door eigenaar goedgekeurde alternatieve leverancier.';

CREATE OR REPLACE VIEW public.v_leverancier_opties WITH (security_invoker = true) AS
WITH vandaag AS (SELECT (now() AT TIME ZONE 'Europe/Amsterdam')::date AS d),
a AS (
  SELECT p.*, row_number() OVER (PARTITION BY p.vestiging, p.artikel_id, p.leverancier_id ORDER BY p.datum DESC, p.id DESC) AS rn
  FROM public.v_prijs_aankoop p, vandaag
  WHERE p.artikel_id IS NOT NULL AND p.leverancier_id IS NOT NULL AND p.prijs_per_basis IS NOT NULL AND p.datum >= vandaag.d - 180),
w AS (
  SELECT v.vestiging, x.artikel_id, x.leverancier_id, x.prijs_per_basis, x.basis_eenheid, x.prijs_excl, x.verpakking, x.bron, x.waargenomen_op, x.geverifieerd,
    row_number() OVER (PARTITION BY v.vestiging, x.artikel_id, x.leverancier_id ORDER BY x.waargenomen_op DESC, x.created_at DESC) AS rn
  FROM public.prijs_waarneming x CROSS JOIN (VALUES ('West'), ('Midsland')) v(vestiging)
  WHERE (x.vestiging IS NULL OR x.vestiging = v.vestiging) AND x.artikel_id IS NOT NULL AND x.leverancier_id IS NOT NULL AND x.prijs_per_basis IS NOT NULL),
k AS (SELECT DISTINCT vestiging, artikel_id, leverancier_id FROM a UNION SELECT vestiging, artikel_id, leverancier_id FROM w WHERE rn = 1),
r AS (
  SELECT k.*, al.basis_eenheid AS a_basis, al.prijs_excl AS a_prijs, al.verpakking AS a_vp, al.bron AS a_bron, al.datum AS a_datum,
    (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY x.prijs_per_basis)::numeric FROM a x
      WHERE x.vestiging = k.vestiging AND x.artikel_id = k.artikel_id AND x.leverancier_id = k.leverancier_id AND x.rn <= 3 AND x.basis_eenheid = al.basis_eenheid) AS a_ppb,
    wl.prijs_per_basis AS w_ppb, wl.basis_eenheid AS w_basis, wl.prijs_excl AS w_prijs, wl.verpakking AS w_vp, wl.bron AS w_bron, wl.waargenomen_op AS w_datum, wl.geverifieerd AS w_ver
  FROM k
  LEFT JOIN a al ON al.rn = 1 AND al.vestiging = k.vestiging AND al.artikel_id = k.artikel_id AND al.leverancier_id = k.leverancier_id
  LEFT JOIN w wl ON wl.rn = 1 AND wl.vestiging = k.vestiging AND wl.artikel_id = k.artikel_id AND wl.leverancier_id = k.leverancier_id)
SELECT r.vestiging, r.artikel_id, ar.naam AS artikel_naam, ar.categorie, r.leverancier_id, l.naam AS leverancier,
  coalesce(r.a_ppb, r.w_ppb) AS prijs_per_basis,
  CASE WHEN r.a_ppb IS NOT NULL THEN r.a_basis ELSE r.w_basis END AS basis_eenheid,
  CASE WHEN r.a_ppb IS NOT NULL THEN r.a_prijs ELSE r.w_prijs END AS prijs_excl,
  CASE WHEN r.a_ppb IS NOT NULL THEN r.a_vp ELSE r.w_vp END AS verpakking,
  CASE WHEN r.a_ppb IS NOT NULL THEN r.a_bron ELSE r.w_bron END AS bron,
  CASE WHEN r.a_ppb IS NOT NULL THEN r.a_datum ELSE r.w_datum END AS bron_datum,
  coalesce((r.a_datum >= (SELECT d FROM vandaag) - 120) OR (r.w_bron = 'kooyman_api' AND r.w_datum >= (SELECT d FROM vandaag) - 120) OR (r.w_bron = 'factuur' AND coalesce(r.w_ver, false)), false) AS geverifieerd,
  ll.levert,
  EXISTS (SELECT 1 FROM public.leverancier_keuze_regel kr WHERE kr.soort = 'vast'
    AND (kr.artikel_id = r.artikel_id OR kr.categorie = ar.categorie OR (kr.artikel_id IS NULL AND kr.categorie IS NULL AND kr.leverancier_id = r.leverancier_id))) AS vast
FROM r
JOIN public.artikelen ar ON ar.id = r.artikel_id
JOIN public.leveranciers l ON l.id = r.leverancier_id
LEFT JOIN public.leverancier_levering ll ON ll.leverancier_id = r.leverancier_id AND ll.vestiging = r.vestiging;
COMMENT ON VIEW public.v_leverancier_opties IS 'Per vestiging × artikel × leverancier: prijs per kg/l/st (mediaan laatste 3 aankopen ≤180 dagen, anders nieuwste waarneming). vast = keuzeregel zegt niet wisselen.';

CREATE OR REPLACE VIEW public.v_prijsverschil_leverancier WITH (security_invoker = true) AS
WITH vandaag AS (SELECT (now() AT TIME ZONE 'Europe/Amsterdam')::date AS d),
vol AS (
  SELECT p.vestiging, p.artikel_id, p.leverancier_id, p.basis_eenheid, sum(p.aantal * p.inhoud) AS vol_basis, sum(p.aantal) AS vol_be, count(*) AS n, min(p.datum) AS van, max(p.datum) AS tot
  FROM public.v_prijs_aankoop p, vandaag
  WHERE p.artikel_id IS NOT NULL AND p.leverancier_id IS NOT NULL AND p.inhoud IS NOT NULL AND p.datum >= vandaag.d - 365
  GROUP BY 1, 2, 3, 4),
cur AS (SELECT DISTINCT ON (vestiging, artikel_id) * FROM vol ORDER BY vestiging, artikel_id, vol_basis DESC),
tot AS (
  SELECT v.vestiging, v.artikel_id, sum(v.vol_basis) AS vol_basis, sum(v.vol_be) AS vol_be, sum(v.n) AS n, min(v.van) AS van, max(v.tot) AS tot
  FROM vol v JOIN cur c ON c.vestiging = v.vestiging AND c.artikel_id = v.artikel_id AND c.basis_eenheid = v.basis_eenheid GROUP BY 1, 2),
opt AS (SELECT * FROM public.v_leverancier_opties WHERE prijs_per_basis IS NOT NULL),
huidig AS (SELECT o.* FROM opt o JOIN cur c ON c.vestiging = o.vestiging AND c.artikel_id = o.artikel_id AND c.leverancier_id = o.leverancier_id AND c.basis_eenheid = o.basis_eenheid),
best AS (
  SELECT DISTINCT ON (o.vestiging, o.artikel_id) o.* FROM opt o JOIN cur c ON c.vestiging = o.vestiging AND c.artikel_id = o.artikel_id AND c.basis_eenheid = o.basis_eenheid
  WHERE o.levert IS DISTINCT FROM false ORDER BY o.vestiging, o.artikel_id, o.prijs_per_basis),
x AS (
  SELECT h.vestiging, h.artikel_id, h.artikel_naam, h.categorie, h.leverancier AS huidige_leverancier, h.prijs_per_basis AS huidige_prijs_per_basis,
    b.leverancier AS goedkoopste_leverancier, b.prijs_per_basis AS goedkoopste_prijs_per_basis, h.basis_eenheid,
    round(100 * (h.prijs_per_basis - b.prijs_per_basis) / nullif(h.prijs_per_basis, 0), 1) AS verschil_pct,
    t.n::int AS n_aankopen, (t.tot - t.van + 1) AS periode_dagen,
    CASE WHEN t.tot - t.van + 1 < 365 THEN 365.0 / greatest(t.tot - t.van + 1, 30) ELSE 1 END AS factor,
    t.vol_basis, t.vol_be, coalesce(h.geverifieerd, false) AND coalesce(b.geverifieerd, false) AS geverifieerd,
    EXISTS (SELECT 1 FROM opt k JOIN public.leveranciers kl ON kl.id = k.leverancier_id AND kl.naam = 'Kooyman'
      WHERE k.vestiging = h.vestiging AND k.artikel_id = h.artikel_id AND k.basis_eenheid = h.basis_eenheid AND k.prijs_per_basis > b.prijs_per_basis) AS kooyman_duurder
  FROM huidig h JOIN best b ON b.vestiging = h.vestiging AND b.artikel_id = h.artikel_id JOIN tot t ON t.vestiging = h.vestiging AND t.artikel_id = h.artikel_id)
SELECT vestiging, artikel_id, artikel_naam, categorie, huidige_leverancier, round(huidige_prijs_per_basis, 4) AS huidige_prijs_per_basis,
  goedkoopste_leverancier, round(goedkoopste_prijs_per_basis, 4) AS goedkoopste_prijs_per_basis, basis_eenheid, verschil_pct, n_aankopen, periode_dagen,
  round(vol_basis * factor, 2) AS jaarvolume_basis, round(vol_be * factor, 1) AS jaarvolume_besteleenheden,
  round(vol_basis * factor * huidige_prijs_per_basis, 2) AS jaar_uitgave,
  round(vol_basis * factor * (huidige_prijs_per_basis - goedkoopste_prijs_per_basis), 2) AS mogelijke_besparing_jaar,
  (n_aankopen >= 3 AND verschil_pct >= 5) AS structureel, geverifieerd, kooyman_duurder
FROM x
ORDER BY mogelijke_besparing_jaar DESC NULLS LAST;
COMMENT ON VIEW public.v_prijsverschil_leverancier IS 'Structurele prijsverschillen per vestiging × artikel (alleen vergelijkbare basis-eenheid). Jaarvolume geëxtrapoleerd naar 365 dagen (minimaal 30 dagen periode). Basis voor prijsgesprek; bestelt niets.';
GRANT SELECT ON public.v_leverancier_opties, public.v_prijsverschil_leverancier TO authenticated, service_role;