-- A. Opslag derving + personeelseten per productgroep
CREATE TABLE public.verbruik_opslag_groep (
  groep text PRIMARY KEY,
  naam text NOT NULL,
  opslag_pct numeric NOT NULL CHECK (opslag_pct >= 0 AND opslag_pct < 100),
  categorieen text[] NOT NULL DEFAULT '{}',
  besteleenheden text[],
  notitie text,
  bijgewerkt_op timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.verbruik_opslag_groep TO authenticated;
GRANT ALL ON public.verbruik_opslag_groep TO service_role;
ALTER TABLE public.verbruik_opslag_groep ENABLE ROW LEVEL SECURITY;
CREATE POLICY opslag_groep_lezen ON public.verbruik_opslag_groep FOR SELECT TO authenticated USING (true);
CREATE POLICY opslag_groep_eigenaar ON public.verbruik_opslag_groep FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
COMMENT ON TABLE public.verbruik_opslag_groep IS 'Opslag voor derving en personeelseten per productgroep (% bovenop verwacht kassaverbruik). Wijzigen alleen door eigenaar; leercurve doet alleen voorstellen (soort opslag_groep).';

CREATE OR REPLACE FUNCTION public.besteleenheid_norm(p text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT nullif(trim(regexp_replace(regexp_replace(lower(coalesce(p,'')),'\s*\(.*\)',''),'^over','')),'')
$$;

CREATE OR REPLACE FUNCTION public.opslag_groep_voor(p_artikel_id uuid, p_besteleenheid text) RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH c AS (SELECT categorie FROM public.artikelen WHERE id = p_artikel_id),
  e AS (SELECT public.besteleenheid_norm(p_besteleenheid) e),
  drank AS (SELECT array_agg(DISTINCT x) cats FROM public.verbruik_opslag_groep g, unnest(g.categorieen) x WHERE g.besteleenheden IS NOT NULL)
  SELECT coalesce(
    -- vat/fust gaat altijd voor categorie (tapbier)
    (SELECT g.groep FROM public.verbruik_opslag_groep g, e WHERE e.e = ANY(g.besteleenheden) AND g.besteleenheden && ARRAY['vat','fust'] LIMIT 1),
    -- tray/doos/krat bij drank
    (SELECT g.groep FROM public.verbruik_opslag_groep g, e, c, drank WHERE e.e = ANY(g.besteleenheden) AND c.categorie = ANY(drank.cats) LIMIT 1),
    (SELECT g.groep FROM public.verbruik_opslag_groep g, c WHERE c.categorie = ANY(g.categorieen) ORDER BY g.groep LIMIT 1)
  )
$$;
GRANT EXECUTE ON FUNCTION public.opslag_groep_voor(uuid, text) TO authenticated, service_role;

ALTER TABLE public.voorraad_artikel ADD COLUMN opslag_groep text REFERENCES public.verbruik_opslag_groep(groep);
COMMENT ON COLUMN public.voorraad_artikel.opslag_groep IS 'Automatisch gevuld: via gekoppeld artikel (opslag_groep_voor), anders koffie (kg) of flesjes/blikjes (fles/blik).';

CREATE OR REPLACE FUNCTION public.voorraad_artikel_groep_bepalen(p_id uuid, p_naam text, p_tel_eenheid text) RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce(
    (SELECT public.opslag_groep_voor(k.artikel_id, CASE WHEN p_tel_eenheid IN ('fles','blik') THEN 'tray' END)
       FROM public.voorraad_ontvangst_koppeling k WHERE k.voorraad_artikel_id = p_id AND k.artikel_id IS NOT NULL LIMIT 1),
    CASE WHEN p_naam ~* '(koffie|thee)' THEN 'koffie_thee'
         WHEN p_tel_eenheid IN ('fles','blik') THEN 'flesjes_blikjes' END)
$$;

CREATE OR REPLACE FUNCTION public.voorraad_artikel_groep_vullen() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.opslag_groep IS NULL THEN
    NEW.opslag_groep := public.voorraad_artikel_groep_bepalen(NEW.id, NEW.naam, NEW.tel_eenheid);
    IF NEW.opslag_groep IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.verbruik_opslag_groep WHERE groep = NEW.opslag_groep) THEN NEW.opslag_groep := NULL; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER voorraad_artikel_opslag_groep BEFORE INSERT OR UPDATE OF naam, tel_eenheid, opslag_groep ON public.voorraad_artikel
  FOR EACH ROW EXECUTE FUNCTION public.voorraad_artikel_groep_vullen();

-- Eén plek voor de effectieve opslag: artikel-eigen % als die > 0, anders groeps-%.
CREATE OR REPLACE FUNCTION public.voorraad_effectieve_opslag_pct(p_artikel uuid) RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN coalesce(a.verbruiksopslag_pct,0) > 0 THEN a.verbruiksopslag_pct ELSE coalesce(g.opslag_pct,0) END
  FROM public.voorraad_artikel a LEFT JOIN public.verbruik_opslag_groep g ON g.groep = a.opslag_groep WHERE a.id = p_artikel
$$;
GRANT EXECUTE ON FUNCTION public.voorraad_effectieve_opslag_pct(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.voorraad_stand_berekenen(p_artikel uuid, p_tot date, p_exclusief uuid DEFAULT NULL::uuid)
 RETURNS TABLE(laatste_telling_id uuid, laatste_telling date, geteld numeric, ontvangen numeric, correcties numeric, kassa numeric, opslag numeric, stand numeric, volledig boolean)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE a public.voorraad_artikel;t public.voorraad_telling;r numeric;c numeric;k numeric;o numeric;ok boolean;
BEGIN SELECT * INTO a FROM public.voorraad_artikel WHERE id=p_artikel; IF NOT FOUND THEN RETURN; END IF;
IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),a.vestiging) THEN RAISE EXCEPTION 'Geen vestigingstoegang' USING ERRCODE='42501'; END IF;
SELECT * INTO t FROM public.voorraad_telling WHERE voorraad_artikel_id=p_artikel AND betrouwbaar AND id IS DISTINCT FROM p_exclusief AND (datum<=p_tot OR (datum=p_tot+1 AND moment='voor_opening')) ORDER BY geteld_op DESC,id DESC LIMIT 1;
IF NOT FOUND THEN RETURN QUERY SELECT NULL::uuid,NULL::date,NULL::numeric,0::numeric,0::numeric,0::numeric,0::numeric,NULL::numeric,false; RETURN; END IF;
SELECT coalesce(sum(b.hoeveelheid) FILTER(WHERE b.soort='ontvangst'),0),coalesce(sum(b.hoeveelheid) FILTER(WHERE b.soort='correctie'),0),-coalesce(sum(b.hoeveelheid) FILTER(WHERE b.soort='kassa'),0),coalesce(bool_and(b.hoeveelheid IS NOT NULL AND b.bronkwaliteit NOT LIKE 'onvolledig%'),true) INTO r,c,k,ok FROM public.voorraad_bewegingen_lezen(a.vestiging)b WHERE b.voorraad_artikel_id=p_artikel AND b.datum>=public.voorraad_daggrens(t.datum,t.moment) AND b.datum<=p_tot;
o:=k*public.voorraad_effectieve_opslag_pct(a.id)/100; RETURN QUERY SELECT t.id,t.datum,t.totaal,r,c,k,o,t.totaal+r+c-k-o,ok;
END $function$;

CREATE OR REPLACE VIEW public.v_voorraad_stand WITH (security_invoker = true) AS
 SELECT a.id, a.vestiging, a.naam, a.tel_eenheid, a.telrol, a.bestelbuffer, a.verbruiksopslag_pct, a.opslagplekken, a.telmoment, a.actief, a.notitie, a.created_at,
    s.laatste_telling_id, s.laatste_telling, s.geteld, s.ontvangen, s.correcties, s.kassa, s.opslag, s.stand, s.volledig,
    CASE WHEN s.stand IS NULL THEN 'voorraad onbekend'::text WHEN NOT s.volledig THEN 'onvolledig'::text ELSE 'berekend'::text END AS status,
    (EXISTS (SELECT 1 FROM public.voorraad_telvraag q WHERE q.voorraad_artikel_id = a.id AND q.datum = (now() AT TIME ZONE 'Europe/Amsterdam')::date AND q.status = 'open')) AS tellen_nodig,
    lt.geteld_op AS laatst_geteld_op,
    ((now() AT TIME ZONE 'Europe/Amsterdam')::date - lt.datum) AS dagen_sinds_telling,
    (EXISTS (SELECT 1 FROM public.voorraad_telvraag q WHERE q.voorraad_artikel_id = a.id AND q.datum = (now() AT TIME ZONE 'Europe/Amsterdam')::date)) AS telvraag_vandaag,
    a.opslag_groep,
    public.voorraad_effectieve_opslag_pct(a.id) AS effectieve_opslag_pct
   FROM public.voorraad_artikel a
     CROSS JOIN LATERAL public.voorraad_stand_berekenen(a.id, (now() AT TIME ZONE 'Europe/Amsterdam')::date) s(laatste_telling_id, laatste_telling, geteld, ontvangen, correcties, kassa, opslag, stand, volledig)
     LEFT JOIN LATERAL (SELECT t.geteld_op, t.datum FROM public.voorraad_telling t WHERE t.voorraad_artikel_id = a.id AND t.betrouwbaar ORDER BY t.geteld_op DESC LIMIT 1) lt ON true;

ALTER TABLE public.leer_voorstel DROP CONSTRAINT IF EXISTS leer_voorstel_soort_check;
ALTER TABLE public.leer_voorstel ADD CONSTRAINT leer_voorstel_soort_check CHECK (soort IN ('verbruiksopslag_pct','onderzoeken','advies_controleren','opslag_groep'));

-- Nauwkeurigheid: kassa-verwachting (vóór opslag) tegen kassa-werkelijk, zodat opslag geen modelfout is.
CREATE OR REPLACE VIEW public.v_advies_nauwkeurigheid WITH (security_invoker = true) AS
 WITH l AS (
   SELECT vestiging, artikel, artikel_id, later_verkocht,
     CASE WHEN jsonb_typeof(gegevens->'verwacht_kassa') = 'number' AND later_verkocht IS NOT NULL
          THEN (gegevens->>'verwacht_kassa')::numeric - later_verkocht ELSE afwijking END AS afwijking
   FROM public.advies_log)
 SELECT vestiging, artikel, artikel_id,
    count(*) FILTER (WHERE later_verkocht <> 0 AND afwijking IS NOT NULL) AS n,
    avg(afwijking) FILTER (WHERE later_verkocht IS NOT NULL) AS gemiddelde_afwijking,
    100::numeric * avg(abs(afwijking) / abs(NULLIF(later_verkocht, 0))) AS mape,
    count(*) FILTER (WHERE later_verkocht IS NULL OR afwijking IS NULL) AS niet_vergelijkbaar,
    count(*) FILTER (WHERE later_verkocht = 0) AS nulverbruik
 FROM l GROUP BY vestiging, artikel, artikel_id;