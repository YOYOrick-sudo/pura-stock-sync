ALTER TABLE public.voorraad_artikel DROP CONSTRAINT voorraad_artikel_telmoment_check;
ALTER TABLE public.voorraad_artikel ADD CONSTRAINT voorraad_artikel_telmoment_check CHECK (telmoment IN ('voor_opening','na_sluiting','dagelijks roulerend'));

CREATE TABLE public.voorraad_telvraag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  voorraad_artikel_id uuid NOT NULL REFERENCES public.voorraad_artikel(id),
  datum date NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','geteld','doorgeschoven')),
  prioriteit_reden text,
  telling_id uuid REFERENCES public.voorraad_telling(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (voorraad_artikel_id, datum)
);
CREATE INDEX voorraad_telvraag_vest_datum ON public.voorraad_telvraag (vestiging, datum);
GRANT SELECT ON public.voorraad_telvraag TO authenticated;
GRANT ALL ON public.voorraad_telvraag TO service_role;
ALTER TABLE public.voorraad_telvraag ENABLE ROW LEVEL SECURITY;
CREATE POLICY telvraag_lezen ON public.voorraad_telvraag FOR SELECT TO authenticated USING (public.heeft_vestiging(auth.uid(), vestiging));
COMMENT ON TABLE public.voorraad_telvraag IS 'Dagelijkse roulerende telvragen (max 3 per vestiging per open dag). Alleen server schrijft: voorraad_telvragen_plannen en trigger op voorraad_telling.';

CREATE OR REPLACE FUNCTION public.voorraad_telvragen_plannen(p_datum date DEFAULT (now() AT TIME ZONE 'Europe/Amsterdam')::date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v text; bestaand int; vrij int; n int; totaal int := 0;
BEGIN
  FOREACH v IN ARRAY ARRAY['Midsland','West'] LOOP
    PERFORM pg_advisory_xact_lock(hashtext('voorraad_telvraag:'||v));
    IF NOT public.mep_is_open(v, p_datum) THEN CONTINUE; END IF;
    UPDATE public.voorraad_telvraag SET status='doorgeschoven'
      WHERE vestiging=v AND status='open' AND datum < p_datum;
    SELECT count(*) INTO bestaand FROM public.voorraad_telvraag WHERE vestiging=v AND datum=p_datum;
    vrij := 3 - bestaand;
    IF vrij <= 0 THEN CONTINUE; END IF;
    WITH kand AS (
      SELECT a.id,
        (SELECT min(q.datum) FROM public.voorraad_telvraag q WHERE q.voorraad_artikel_id=a.id AND q.status='doorgeschoven') doorgeschoven_sinds,
        lt.datum laatste_datum, lt.afw,
        (SELECT coalesce(sum(c.aantal*k.factor),0) FROM public.voorraad_verbruik_koppeling k
           JOIN public.kassa_verkoop_dag c ON c.lightspeed_product_id=k.lightspeed_product_id AND c.vestiging=v
          WHERE k.voorraad_artikel_id=a.id AND c.datum >= p_datum-28 AND c.datum < p_datum) verbruik28
      FROM public.voorraad_artikel a
      LEFT JOIN LATERAL (SELECT t.datum,
          CASE WHEN t.berekend_op_moment IS NULL THEN NULL
               ELSE abs(t.totaal-t.berekend_op_moment)/greatest(abs(t.berekend_op_moment),1)*100 END afw
        FROM public.voorraad_telling t WHERE t.voorraad_artikel_id=a.id AND t.betrouwbaar
        ORDER BY t.geteld_op DESC, t.id DESC LIMIT 1) lt ON true
      WHERE a.vestiging=v AND a.actief
        AND NOT EXISTS (SELECT 1 FROM public.voorraad_telvraag q WHERE q.voorraad_artikel_id=a.id AND q.datum=p_datum)
        AND NOT EXISTS (SELECT 1 FROM public.voorraad_telling t WHERE t.voorraad_artikel_id=a.id AND t.datum=p_datum)
    ), geordend AS (
      SELECT k.*, CASE WHEN doorgeschoven_sinds IS NOT NULL THEN 1 WHEN laatste_datum IS NULL THEN 2 WHEN afw IS NOT NULL THEN 3 ELSE 4 END groep
      FROM kand k
    )
    INSERT INTO public.voorraad_telvraag (vestiging, voorraad_artikel_id, datum, prioriteit_reden)
    SELECT v, id, p_datum,
      CASE groep WHEN 1 THEN 'doorgeschoven sinds '||to_char(doorgeschoven_sinds,'DD-MM')
                 WHEN 2 THEN 'begintelling'
                 WHEN 3 THEN 'afwijking '||round(afw)||'%'
                 ELSE 'langst niet geteld' END
    FROM geordend
    ORDER BY groep, doorgeschoven_sinds NULLS LAST,
      CASE WHEN groep=2 THEN -verbruik28 END NULLS LAST,
      CASE WHEN groep=3 THEN -afw END NULLS LAST,
      laatste_datum NULLS FIRST, id
    LIMIT vrij
    ON CONFLICT (voorraad_artikel_id, datum) DO NOTHING;
    GET DIAGNOSTICS n = ROW_COUNT; totaal := totaal + n;
  END LOOP;
  RETURN totaal;
END $$;
REVOKE ALL ON FUNCTION public.voorraad_telvragen_plannen(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.voorraad_telvragen_plannen(date) TO service_role;

CREATE OR REPLACE FUNCTION public.voorraad_telvraag_afvinken()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.betrouwbaar THEN
    UPDATE public.voorraad_telvraag SET status='geteld', telling_id=NEW.id
     WHERE voorraad_artikel_id=NEW.voorraad_artikel_id AND status IN ('open','doorgeschoven') AND datum <= NEW.datum;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.voorraad_telvraag_afvinken() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER voorraad_telvraag_afvinken AFTER INSERT ON public.voorraad_telling FOR EACH ROW EXECUTE FUNCTION public.voorraad_telvraag_afvinken();

CREATE OR REPLACE VIEW public.v_voorraad_stand WITH (security_invoker = true) AS
 SELECT a.id, a.vestiging, a.naam, a.tel_eenheid, a.telrol, a.bestelbuffer, a.verbruiksopslag_pct, a.opslagplekken, a.telmoment, a.actief, a.notitie, a.created_at,
    s.laatste_telling_id, s.laatste_telling, s.geteld, s.ontvangen, s.correcties, s.kassa, s.opslag, s.stand, s.volledig,
    CASE WHEN s.stand IS NULL THEN 'voorraad onbekend'::text WHEN NOT s.volledig THEN 'onvolledig'::text ELSE 'berekend'::text END AS status,
    EXISTS (SELECT 1 FROM public.voorraad_telvraag q WHERE q.voorraad_artikel_id=a.id AND q.datum=(now() AT TIME ZONE 'Europe/Amsterdam')::date AND q.status='open') AS tellen_nodig,
    lt.geteld_op AS laatst_geteld_op,
    ((now() AT TIME ZONE 'Europe/Amsterdam')::date - lt.datum) AS dagen_sinds_telling,
    EXISTS (SELECT 1 FROM public.voorraad_telvraag q WHERE q.voorraad_artikel_id=a.id AND q.datum=(now() AT TIME ZONE 'Europe/Amsterdam')::date) AS telvraag_vandaag
 FROM public.voorraad_artikel a
 CROSS JOIN LATERAL public.voorraad_stand_berekenen(a.id, (now() AT TIME ZONE 'Europe/Amsterdam')::date) s(laatste_telling_id, laatste_telling, geteld, ontvangen, correcties, kassa, opslag, stand, volledig)
 LEFT JOIN LATERAL (SELECT t.geteld_op, t.datum FROM public.voorraad_telling t WHERE t.voorraad_artikel_id=a.id AND t.betrouwbaar ORDER BY t.geteld_op DESC LIMIT 1) lt ON true;

CREATE OR REPLACE FUNCTION public.voorraad_telachterstand_dagen(p_vestiging text, p_tot date)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE d date := p_tot; n int := 0; i int := 0;
BEGIN
  WHILE i < 120 LOOP
    i := i + 1;
    IF public.mep_is_open(p_vestiging, d) THEN
      IF NOT EXISTS (SELECT 1 FROM public.voorraad_telvraag WHERE vestiging=p_vestiging AND datum=d) THEN EXIT; END IF;
      IF EXISTS (SELECT 1 FROM public.voorraad_telling t JOIN public.voorraad_artikel a ON a.id=t.voorraad_artikel_id WHERE a.vestiging=p_vestiging AND t.datum=d) THEN EXIT; END IF;
      n := n + 1;
    END IF;
    d := d - 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.voorraad_telachterstand_dagen(text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.voorraad_telachterstand_dagen(text, date) TO authenticated, service_role;

CREATE OR REPLACE VIEW public.v_voorraad_telachterstand WITH (security_invoker = true) AS
 SELECT v.vestiging,
   (SELECT max(t.geteld_op) FROM public.voorraad_telling t JOIN public.voorraad_artikel a ON a.id=t.voorraad_artikel_id WHERE a.vestiging=v.vestiging) AS laatste_telling_op,
   (SELECT count(*) FROM public.voorraad_telvraag q WHERE q.vestiging=v.vestiging AND q.datum=(now() AT TIME ZONE 'Europe/Amsterdam')::date AND q.status='open')::int AS open_telvragen_vandaag,
   x.dagen AS opeenvolgende_dagen_niet_geteld,
   x.dagen >= 3 AS drie_dagen_niet_geteld
 FROM (VALUES ('Midsland'::text), ('West'::text)) v(vestiging)
 CROSS JOIN LATERAL (SELECT public.voorraad_telachterstand_dagen(v.vestiging, (now() AT TIME ZONE 'Europe/Amsterdam')::date - 1) AS dagen) x
 WHERE public.is_service_call() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin');
COMMENT ON VIEW public.v_voorraad_telachterstand IS 'Signaal voor de bestelbot: per vestiging laatste telling, open telvragen vandaag en het aantal opeenvolgende open dagen (t/m gisteren) met telvragen maar zonder enige telling. drie_dagen_niet_geteld = >=3. Alleen service_role en owner.';
REVOKE ALL ON public.v_voorraad_telachterstand FROM anon;
GRANT SELECT ON public.v_voorraad_telachterstand TO authenticated, service_role;