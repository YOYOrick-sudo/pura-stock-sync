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
        (SELECT coalesce(sum(c.aantal),0) FROM public.voorraad_verbruik_koppeling k
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
COMMENT ON FUNCTION public.voorraad_telvragen_plannen(date) IS 'Begintelling-volgorde op aantal kassaverkopen laatste 28 dagen (eenheidsonafhankelijk).';