CREATE TABLE public.artikel_vormen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artikel_id uuid NOT NULL REFERENCES public.artikelen(id) ON DELETE CASCADE,
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  leverancier_id uuid REFERENCES public.leveranciers(id) ON DELETE SET NULL,
  vorm text NOT NULL,
  eenheid text NOT NULL CHECK (eenheid IN ('stuks','doos','zak','fles','pak','bak','emmer','kg','bos','tray','rol','fust')),
  is_standaard boolean NOT NULL DEFAULT false,
  keer_besteld integer NOT NULL DEFAULT 0,
  laatst_besteld date,
  prijs numeric(10,2),
  prijs_datum date,
  prijs_bron text CHECK (prijs_bron IN ('factuur','horeko','handmatig')),
  prijs_is_indicatie boolean NOT NULL DEFAULT true,
  artikelnummer text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (artikel_id, vestiging, leverancier_id, vorm)
);
CREATE UNIQUE INDEX artikel_vormen_een_standaard ON public.artikel_vormen(artikel_id, vestiging) WHERE is_standaard AND deleted_at IS NULL;
CREATE INDEX artikel_vormen_vestiging_artikel ON public.artikel_vormen(vestiging, artikel_id) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artikel_vormen TO authenticated;
GRANT ALL ON public.artikel_vormen TO service_role;
ALTER TABLE public.artikel_vormen ENABLE ROW LEVEL SECURITY;
CREATE POLICY artikel_vormen_select ON public.artikel_vormen FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), vestiging));
CREATE POLICY artikel_vormen_write ON public.artikel_vormen FOR ALL TO authenticated
  USING (public.heeft_vestiging(auth.uid(), vestiging) AND (public.has_role(auth.uid(),'owner'::app_role) OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role)))
  WITH CHECK (public.heeft_vestiging(auth.uid(), vestiging) AND (public.has_role(auth.uid(),'owner'::app_role) OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'manager'::app_role)));

CREATE TRIGGER artikel_vormen_vestiging BEFORE INSERT OR UPDATE ON public.artikel_vormen FOR EACH ROW EXECUTE FUNCTION public.validate_vestiging_kolom();
CREATE TRIGGER artikel_vormen_updated_at BEFORE UPDATE ON public.artikel_vormen FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.rpc_bord_suggesties(p_vestiging text, p_tekst text, p_limit integer DEFAULT 8)
RETURNS TABLE(artikel_id uuid, naam text, leverancier_id uuid, score numeric, standaard_eenheid text, standaard_vorm text, vormen jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE q text; lim int;
BEGIN
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
  IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),p_vestiging) THEN RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE='42501'; END IF;
  IF p_tekst IS NULL OR length(p_tekst)>500 THEN RAISE EXCEPTION 'Zoektekst ontbreekt of is te lang' USING ERRCODE='22023'; END IF;
  q := public.bestelbot_normaliseer(p_tekst);
  IF q = '' THEN RETURN; END IF;
  lim := LEAST(GREATEST(COALESCE(p_limit,8),1),50);
  RETURN QUERY
  WITH actief AS (
    SELECT a.id, a.naam FROM public.artikelen a
    WHERE a.deleted_at IS NULL AND EXISTS (SELECT 1 FROM public.artikel_locaties al WHERE al.artikel_id=a.id AND al.vestiging=p_vestiging AND al.is_actief AND al.deleted_at IS NULL)
  ), teksten AS (
    SELECT x.id, x.naam AS tekst FROM actief x
    UNION ALL
    SELECT x.id, aa.alias FROM actief x JOIN public.artikel_aliassen aa ON aa.artikel_id=x.id
    WHERE aa.vestiging=p_vestiging AND aa.deleted_at IS NULL
  ), gescoord AS (
    SELECT t.id, CASE
      WHEN n = q THEN 1.0
      WHEN n LIKE q || '%' THEN 0.9
      WHEN EXISTS (SELECT 1 FROM regexp_split_to_table(lower(extensions.unaccent(coalesce(t.tekst,''))), '[^[:alnum:]]+') w WHERE w <> '' AND w LIKE q || '%') THEN 0.8
      WHEN strpos(n, q) > 0 THEN 0.6
      WHEN length(q) >= 3 AND extensions.similarity(n, q) >= 0.25 THEN extensions.similarity(n, q)::numeric
      ELSE NULL END AS s
    FROM teksten t, LATERAL (SELECT public.bestelbot_normaliseer(t.tekst) AS n) nn
  ), best AS (
    SELECT g.id, max(g.s) AS s FROM gescoord g WHERE g.s IS NOT NULL GROUP BY g.id
  ), rijk AS (
    SELECT b.id, b.s, x.naam,
      COALESCE((SELECT sum(v.keer_besteld) FROM public.artikel_vormen v WHERE v.artikel_id=b.id AND v.vestiging=p_vestiging AND v.deleted_at IS NULL),0) AS besteld
    FROM best b JOIN actief x ON x.id=b.id
    ORDER BY b.s DESC, besteld DESC, x.naam, b.id
    LIMIT lim
  )
  SELECT r.id, r.naam,
    (SELECT lav.leverancier_id FROM public.leverancier_artikel_vestiging lav WHERE lav.artikel_id=r.id AND lav.vestiging=p_vestiging AND lav.actief AND lav.deleted_at IS NULL AND lav.is_voorkeur AND public.bestelbot_leverancier_actief(lav.leverancier_id,p_vestiging) LIMIT 1),
    round(r.s, 3),
    (SELECT v.eenheid FROM public.artikel_vormen v WHERE v.artikel_id=r.id AND v.vestiging=p_vestiging AND v.deleted_at IS NULL AND v.is_standaard LIMIT 1),
    (SELECT v.vorm FROM public.artikel_vormen v WHERE v.artikel_id=r.id AND v.vestiging=p_vestiging AND v.deleted_at IS NULL AND v.is_standaard LIMIT 1),
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',v.id,'vorm',v.vorm,'eenheid',v.eenheid,'leverancier_id',v.leverancier_id,'leverancier_naam',l.naam,'prijs',v.prijs,'prijs_datum',v.prijs_datum,'prijs_bron',v.prijs_bron,'is_standaard',v.is_standaard) ORDER BY v.is_standaard DESC, v.keer_besteld DESC, v.vorm)
      FROM public.artikel_vormen v LEFT JOIN public.leveranciers l ON l.id=v.leverancier_id
      WHERE v.artikel_id=r.id AND v.vestiging=p_vestiging AND v.deleted_at IS NULL), '[]'::jsonb)
  FROM rijk r
  ORDER BY r.s DESC, r.besteld DESC, r.naam, r.id;
END;
$function$;
REVOKE ALL ON FUNCTION public.rpc_bord_suggesties(text,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_bord_suggesties(text,text,integer) TO authenticated, service_role;