CREATE OR REPLACE FUNCTION public.bestelbot_prijzen_opslaan(p_rijen jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r jsonb; i int := 0; nieuw int := 0; bij int := 0; gek int := 0; v text; lev uuid; art uuid; b record; ins boolean; dt date; e_inh numeric; e_bas text;
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
    art := NULL;
    IF coalesce(r->>'artikel_id','') ~* '^[0-9a-f-]{36}$' THEN SELECT id INTO art FROM public.artikelen WHERE id = (r->>'artikel_id')::uuid; END IF;
    IF art IS NULL THEN art := public.prijs_artikel_zoeken(v, lev, r->>'artikelnummer', r->>'naam'); END IF;
    e_inh := CASE WHEN jsonb_typeof(r->'inhoud') = 'number' AND (r->>'inhoud')::numeric > 0 THEN (r->>'inhoud')::numeric END;
    e_bas := CASE WHEN r->>'basis_eenheid' IN ('kg','l','st') THEN r->>'basis_eenheid' END;
    IF e_inh IS NOT NULL AND e_bas IS NOT NULL THEN
      SELECT e_inh AS inhoud, e_bas AS basis INTO b;
    ELSE
      SELECT * INTO b FROM public.prijs_inhoud(lev, art, coalesce(v,'Midsland'), r->>'verpakking', r->>'naam');
    END IF;
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
END $function$;

CREATE OR REPLACE VIEW public.v_prijs_aankoop WITH (security_invoker = true) AS
 SELECT h.id, h.vestiging, h.leverancier_id, COALESCE(l.naam, h.leverancier_naam_ruw) AS leverancier, h.artikel_id, h.artikel_naam_ruw AS naam,
    vb.verpakking, besteleenheid_norm(h.eenheid_ruw) AS eenheid, h.besteldatum AS datum,
    h.prijs / x.deler AS prijs_excl, vb.inhoud, vb.basis AS basis_eenheid,
    h.prijs / x.deler / NULLIF(vb.inhoud, 0::numeric) AS prijs_per_basis, h.aantal, h.bron, (x.deler <> 1) AS btw_omgerekend
   FROM bestel_historie_import h
     LEFT JOIN leveranciers l ON l.id = h.leverancier_id
     LEFT JOIN artikelen ar ON ar.id = h.artikel_id
     CROSS JOIN LATERAL (SELECT CASE WHEN h.bron ILIKE '%incl btw%' THEN CASE WHEN ar.categorie IN ('Wijn & sterke drank','Bier') THEN 1.21 ELSE 1.09 END ELSE 1 END::numeric AS deler) x
     CROSS JOIN LATERAL prijs_inhoud(h.leverancier_id, h.artikel_id, h.vestiging, h.verpakking_ruw, h.artikel_naam_ruw) vb(inhoud, basis, verpakking)
  WHERE h.prijs > 0::numeric AND h.aantal > 0::numeric AND h.bron !~~* '%emballage%'::text AND NOT (h.bron ~~ 'kooyman_factuur_drive%'::text AND (EXISTS ( SELECT 1
           FROM bestel_historie_import a
          WHERE a.vestiging = h.vestiging AND a.bron ~~ 'kooyman_api%'::text AND a.aantal = h.aantal AND abs(a.besteldatum - h.besteldatum) <= 7 AND lower(a.artikel_naam_ruw) = lower(h.artikel_naam_ruw))));

CREATE OR REPLACE FUNCTION public.voorraad_bewegingen_lezen(p_vestiging text)
 RETURNS TABLE(voorraad_artikel_id uuid, vestiging text, datum date, soort text, hoeveelheid numeric, bron_ref text, bronkwaliteit text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ BEGIN
IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),p_vestiging) THEN RAISE EXCEPTION 'Geen vestigingstoegang' USING ERRCODE='42501'; END IF;
RETURN QUERY WITH hist_match AS(SELECT a.id aid,h.*,k.factor,count(*) OVER(PARTITION BY h.id) matches FROM public.bestel_historie_import h JOIN public.voorraad_artikel a ON a.vestiging=h.vestiging JOIN public.voorraad_ontvangst_koppeling k ON k.voorraad_artikel_id=a.id WHERE h.vestiging=p_vestiging AND h.leverancier_naam_ruw ILIKE k.leverancier_naam AND h.artikel_naam_ruw ~* k.naam_patroon AND (k.uitsluit_patroon IS NULL OR h.artikel_naam_ruw !~* k.uitsluit_patroon)),
bord_match AS(SELECT a.id aid,b.*,k.factor,a.tel_eenheid,v.vorm,v.eenheid vorm_eenheid,count(*) OVER(PARTITION BY b.id) matches,(SELECT count(*) FROM public.bestel_signalen r WHERE r.restant_van=b.id) rest_count,(SELECT r.aantal FROM public.bestel_signalen r WHERE r.restant_van=b.id AND r.status='open' AND r.eenheid=b.eenheid AND r.artikel_vorm_id IS NOT DISTINCT FROM b.artikel_vorm_id AND r.vestiging=b.vestiging LIMIT 1) rest_aantal FROM public.bestel_signalen b JOIN public.voorraad_artikel a ON a.vestiging=b.vestiging JOIN public.voorraad_ontvangst_koppeling k ON k.voorraad_artikel_id=a.id AND k.artikel_id=b.artikel_id LEFT JOIN public.artikel_vormen v ON v.id=b.artikel_vorm_id AND v.vestiging=b.vestiging AND v.artikel_id=b.artikel_id LEFT JOIN public.leveranciers l ON l.id=b.leverancier_id WHERE b.vestiging=p_vestiging AND b.geleverd_op IS NOT NULL AND coalesce(l.naam,'') ILIKE k.leverancier_naam AND NOT EXISTS(SELECT 1 FROM public.bestel_historie_import h WHERE h.vestiging=b.vestiging AND nullif(trim(b.bestelreferentie),'') IS NOT NULL AND nullif(trim(h.extern_ordernummer),'')=trim(b.bestelreferentie) AND ((b.leverancier_id IS NOT NULL AND h.leverancier_id=b.leverancier_id) OR (b.leverancier_id IS NULL AND lower(h.leverancier_naam_ruw)=lower(l.naam))))),
bord_qty AS(SELECT b.*,CASE WHEN b.eenheid=b.tel_eenheid THEN 1::numeric WHEN b.eenheid='doos' AND b.vorm_eenheid='doos' AND b.vorm ~ '24[×x]' AND b.factor=24 THEN b.factor ELSE NULL END conv,CASE WHEN b.levering_status='deels' THEN CASE WHEN b.rest_count=1 AND b.rest_aantal>0 AND b.rest_aantal<b.aantal THEN b.aantal-b.rest_aantal ELSE NULL END ELSE b.aantal END qty FROM bord_match b)
SELECT h.aid,h.vestiging,h.besteldatum,'ontvangst'::text,CASE WHEN h.matches=1 THEN h.aantal*h.factor END,'hist:'||h.id,CASE WHEN h.matches=1 THEN 'besteldatum_benadering' ELSE 'onvolledig:ambigue_koppeling' END FROM hist_match h WHERE NOT (h.bron LIKE 'kooyman_factuur_drive%' AND EXISTS(SELECT 1 FROM hist_match x WHERE x.aid=h.aid AND x.bron LIKE 'kooyman_api_v2_orders%' AND x.aantal=h.aantal AND abs(x.besteldatum-h.besteldatum)<=3))
UNION ALL SELECT b.aid,b.vestiging,(b.geleverd_op AT TIME ZONE 'Europe/Amsterdam')::date,'ontvangst',CASE WHEN b.matches=1 THEN b.qty*b.conv END,'bord:'||b.id,CASE WHEN b.matches<>1 THEN 'onvolledig:ambigue_koppeling' WHEN b.qty IS NULL THEN 'onvolledig:deellevering' WHEN b.conv IS NULL THEN 'onvolledig:conversie' ELSE 'geleverd' END FROM bord_qty b
UNION ALL SELECT a.id,a.vestiging,c.datum,'kassa',CASE WHEN (SELECT count(*) FROM public.voorraad_verbruik_koppeling kk JOIN public.voorraad_artikel aa ON aa.id=kk.voorraad_artikel_id WHERE aa.vestiging=a.vestiging AND kk.lightspeed_product_id=c.lightspeed_product_id)=1 THEN -c.aantal*k.factor END,'kassa:'||a.vestiging||':'||c.datum||':'||c.lightspeed_product_id,CASE WHEN (SELECT count(*) FROM public.voorraad_verbruik_koppeling kk JOIN public.voorraad_artikel aa ON aa.id=kk.voorraad_artikel_id WHERE aa.vestiging=a.vestiging AND kk.lightspeed_product_id=c.lightspeed_product_id)=1 THEN 'werkdag_0600' ELSE 'onvolledig:ambigue_kassa' END FROM public.kassa_verkoop_dag c JOIN public.voorraad_artikel a ON a.vestiging=c.vestiging JOIN public.voorraad_verbruik_koppeling k ON k.voorraad_artikel_id=a.id AND k.lightspeed_product_id=c.lightspeed_product_id WHERE a.vestiging=p_vestiging
UNION ALL SELECT a.id,a.vestiging,c.datum,'correctie',c.hoeveelheid,'corr:'||c.id,'handmatig' FROM public.voorraad_correctie c JOIN public.voorraad_artikel a ON a.id=c.voorraad_artikel_id WHERE a.vestiging=p_vestiging;
END $function$;