-- Besteld & levering: verwachte leverdatum, leveringsafhandeling, bot-uitbreidingen.
-- Terugdraaien: DROP TRIGGER bestel_signalen_verwachte_levering ON public.bestel_signalen;
--   DROP FUNCTION bestel_signalen_vul_verwachte_levering(), bestel_verwachte_levering(text,uuid,timestamptz), bestelbot_lees_besteld(text);
--   herstel bestelbot_lees_open/bestelbot_markeer_besteld uit 0033; verwijder nieuwe kolommen en constraints.

-- 1. Nieuwe kolommen (allemaal nullable, additief)
ALTER TABLE public.bestel_signalen
  ADD COLUMN verwachte_levering date,
  ADD COLUMN geleverd_op timestamptz,
  ADD COLUMN geleverd_door uuid,
  ADD COLUMN levering_status text,
  ADD COLUMN levering_opmerking text,
  ADD COLUMN restant_van uuid REFERENCES public.bestel_signalen(id) ON DELETE SET NULL;

ALTER TABLE public.bestel_signalen
  ADD CONSTRAINT bestel_signalen_status_check CHECK (status IN ('open','besteld','geleverd','vervallen')),
  ADD CONSTRAINT bestel_signalen_levering_status_check CHECK (levering_status IN ('geleverd','niet_geleverd','deels'));

CREATE INDEX bestel_signalen_levering_idx ON public.bestel_signalen (vestiging, status, verwachte_levering);

-- 2. Standaard verwachte leverdatum: leverdag leverancier, anders morgen; dichte dag -> volgende open dag.
CREATE OR REPLACE FUNCTION public.bestel_verwachte_levering(_vestiging text, _leverancier_id uuid, _besteld_op timestamptz)
RETURNS date LANGUAGE plpgsql STABLE SET search_path=public AS $body$
DECLARE
  v_basis date := (_besteld_op AT TIME ZONE 'Europe/Amsterdam')::date;
  v_levering date;
  v_guard int := 0;
BEGIN
  IF _leverancier_id IS NOT NULL THEN
    -- eerstvolgende besteldag (weekdag = extract(dow), 0=zondag) vanaf vandaag + leverdag_offset
    SELECT min(d.dag + COALESCE(b.leverdag_offset, 0)) INTO v_levering
    FROM public.leverancier_besteldagen b
    CROSS JOIN LATERAL (
      SELECT v_basis + ((b.weekdag - EXTRACT(dow FROM v_basis)::int + 7) % 7) AS dag
    ) d
    WHERE b.leverancier_id = _leverancier_id AND b.vestiging = _vestiging AND b.actief AND b.deleted_at IS NULL;
  END IF;
  IF v_levering IS NULL THEN v_levering := v_basis + 1; END IF;
  WHILE v_guard < 14 AND NOT public.mep_is_open(_vestiging, v_levering) LOOP
    v_levering := v_levering + 1;
    v_guard := v_guard + 1;
  END LOOP;
  RETURN v_levering;
END
$body$;

-- 3. Trigger: vul verwachte_levering bij overgang naar 'besteld' als die leeg is (ook handmatig bestellen).
CREATE OR REPLACE FUNCTION public.bestel_signalen_vul_verwachte_levering()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
BEGIN
  IF NEW.status = 'besteld' AND OLD.status IS DISTINCT FROM 'besteld' AND NEW.verwachte_levering IS NULL THEN
    NEW.verwachte_levering := public.bestel_verwachte_levering(NEW.vestiging, NEW.leverancier_id, COALESCE(NEW.besteld_op, now()));
  END IF;
  RETURN NEW;
END
$body$;

DROP TRIGGER IF EXISTS bestel_signalen_verwachte_levering ON public.bestel_signalen;
CREATE TRIGGER bestel_signalen_verwachte_levering
  BEFORE UPDATE ON public.bestel_signalen
  FOR EACH ROW EXECUTE FUNCTION public.bestel_signalen_vul_verwachte_levering();

-- 4. Bot leest open regels nu ook met levering_opmerking en restant_van (herbestellingen zichtbaar).
DROP FUNCTION public.bestelbot_lees_open(text);
CREATE FUNCTION public.bestelbot_lees_open(p_vestiging text)
RETURNS TABLE(id uuid,naam text,aantal numeric,eenheid text,notitie text,created_at timestamptz,leverancier_id uuid,leverancier_naam text,artikel_id uuid,match_zekerheid numeric,levering_opmerking text,restant_van uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $body$
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT s.id,s.naam,s.aantal::numeric,s.eenheid::text,s.notitie,s.created_at,s.leverancier_id,l.naam::text,s.artikel_id,s.match_zekerheid,s.levering_opmerking,s.restant_van
  FROM public.bestel_signalen s LEFT JOIN public.leveranciers l ON l.id=s.leverancier_id
  WHERE s.vestiging=p_vestiging AND s.status='open' ORDER BY s.created_at;
END;
$body$;

-- 5. Bot bestellen: optionele verwachte_levering per regel (YYYY-MM-DD, niet in verleden, max +30 dagen).
CREATE OR REPLACE FUNCTION public.bestelbot_markeer_besteld(p_vestiging text,p_regels jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
DECLARE r jsonb; v_id uuid; v_ref text; v_lev text; v_lev_date date; s record; v_uit jsonb:='[]'::jsonb;
 v_vandaag date := (now() AT TIME ZONE 'Europe/Amsterdam')::date;
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
 IF p_regels IS NULL OR jsonb_typeof(p_regels)<>'array' OR jsonb_array_length(p_regels) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Tussen 1 en 100 regels' USING ERRCODE='22023'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_regels) LOOP
  v_id:=(r->>'id')::uuid; v_ref:=left(nullif(trim(r->>'bestelreferentie'),''),200);
  v_lev:=nullif(trim(r->>'verwachte_levering'),'');
  IF v_lev IS NOT NULL AND v_lev !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','verwachte_levering geen YYYY-MM-DD');
   CONTINUE;
  END IF;
  v_lev_date:=v_lev::date;
  IF v_lev_date IS NOT NULL AND (v_lev_date < v_vandaag OR v_lev_date > v_vandaag + 30) THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','verwachte_levering buiten bereik (vandaag t/m +30 dagen)');
   CONTINUE;
  END IF;
  SELECT * INTO s FROM public.bestel_signalen WHERE bestel_signalen.id=v_id FOR UPDATE;
  IF NOT FOUND OR s.vestiging<>p_vestiging THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','niet gevonden voor deze vestiging');
  ELSIF s.status='besteld' AND s.besteld_via='bot' AND s.bestelreferentie IS NOT DISTINCT FROM v_ref THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','ok','reden','al besteld','verwachte_levering',s.verwachte_levering);
  ELSIF s.status<>'open' THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','status is '||s.status);
  ELSIF s.leverancier_id IS NOT NULL AND NOT public.bestelbot_leverancier_actief(s.leverancier_id,p_vestiging) THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','leverancier niet actief voor deze vestiging');
  ELSE
   UPDATE public.bestel_signalen SET status='besteld',besteld_op=now(),bestelreferentie=v_ref,besteld_via='bot',
     verwachte_levering=v_lev_date WHERE bestel_signalen.id=v_id;
   SELECT verwachte_levering INTO v_lev_date FROM public.bestel_signalen WHERE bestel_signalen.id=v_id;
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','ok','verwachte_levering',v_lev_date);
  END IF;
 END LOOP;
 RETURN v_uit;
END;
$body$;

-- 6. Bot leest bestelde regels (achterstand-melding, nooit opnieuw bestellen).
CREATE OR REPLACE FUNCTION public.bestelbot_lees_besteld(p_vestiging text)
RETURNS TABLE(id uuid,naam text,aantal numeric,eenheid text,leverancier_id uuid,leverancier_naam text,artikel_id uuid,bestelreferentie text,besteld_op timestamptz,verwachte_levering date,te_laat boolean,dagen_te_laat integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $body$
DECLARE v_vandaag date := (now() AT TIME ZONE 'Europe/Amsterdam')::date;
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
 RETURN QUERY
 SELECT s.id,s.naam,s.aantal::numeric,s.eenheid::text,s.leverancier_id,l.naam::text,s.artikel_id,s.bestelreferentie,s.besteld_op,s.verwachte_levering,
   COALESCE(t.n,0)>0, COALESCE(t.n,0)::integer
 FROM public.bestel_signalen s
 LEFT JOIN public.leveranciers l ON l.id=s.leverancier_id
 LEFT JOIN LATERAL (
   SELECT count(*) AS n FROM generate_series(s.verwachte_levering + 1, v_vandaag, interval '1 day') AS d
   WHERE public.mep_is_open(p_vestiging, d::date)
 ) t ON (s.verwachte_levering IS NOT NULL AND s.verwachte_levering < v_vandaag)
 WHERE s.vestiging=p_vestiging AND s.status='besteld'
 ORDER BY s.verwachte_levering NULLS LAST, s.besteld_op;
END;
$body$;

-- 7. Rechten zoals de andere bot-functies: alleen service role.
REVOKE ALL ON FUNCTION public.bestel_verwachte_levering(text,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestel_verwachte_levering(text,uuid,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.bestel_signalen_vul_verwachte_levering() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestel_signalen_vul_verwachte_levering() TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_lees_open(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_lees_open(text) TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_markeer_besteld(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_markeer_besteld(text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_lees_besteld(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_lees_besteld(text) TO service_role;