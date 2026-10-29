-- Additive correction for the bestelbot foundation. Down: drop functions bestelbot_lees_open, bestelbot_markeer_besteld, bestelbot_koppel, bestelbot_aanroep_afsluiten; restore previous trigger body/grants from 0032.
CREATE OR REPLACE FUNCTION public.bestelbot_koppeling_bewaken() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
BEGIN
 IF TG_TABLE_NAME='bestel_historie_import' THEN
  IF NEW.leverancier_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.leverancier_vestiging_config c WHERE c.leverancier_id=NEW.leverancier_id AND c.vestiging=NEW.vestiging) THEN
   RAISE EXCEPTION 'Leverancier hoort niet bij deze vestiging' USING ERRCODE='23514';
  END IF;
  IF NEW.artikel_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.artikel_locaties al WHERE al.artikel_id=NEW.artikel_id AND al.vestiging=NEW.vestiging) THEN
   RAISE EXCEPTION 'Artikel hoort niet bij deze vestiging' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
 END IF;
 IF NEW.leverancier_id IS NOT NULL AND NOT public.bestelbot_leverancier_actief(NEW.leverancier_id,NEW.vestiging) THEN
  RAISE EXCEPTION 'Leverancier is niet actief voor deze vestiging' USING ERRCODE='23514';
 END IF;
 IF NEW.artikel_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM public.artikel_locaties al JOIN public.artikelen a ON a.id=al.artikel_id
  WHERE al.artikel_id=NEW.artikel_id AND al.vestiging=NEW.vestiging AND al.is_actief AND al.deleted_at IS NULL AND a.deleted_at IS NULL
 ) THEN RAISE EXCEPTION 'Artikel is niet actief voor deze vestiging' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='artikel_aliassen' THEN
  NEW.alias_norm:=public.bestelbot_normaliseer(NEW.alias);
  IF NEW.alias_norm='' THEN RAISE EXCEPTION 'Alias moet letters of cijfers bevatten' USING ERRCODE='23514'; END IF;
  NEW.updated_at:=now();
 END IF;
 RETURN NEW;
END;
$body$;
REVOKE ALL ON FUNCTION public.bestelbot_koppeling_bewaken() FROM PUBLIC,anon,authenticated;

REVOKE INSERT,UPDATE,DELETE ON public.bestel_historie_import FROM authenticated;
DROP POLICY IF EXISTS bestel_historie_import_beheer_toevoegen ON public.bestel_historie_import;
DROP POLICY IF EXISTS bestel_historie_import_beheer_wijzigen ON public.bestel_historie_import;

CREATE OR REPLACE FUNCTION public.bestelbot_aanroep_afsluiten(p_audit_id uuid,p_succes boolean,p_resultaat jsonb,p_ids uuid[] DEFAULT '{}')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 UPDATE public.bot_audit_log SET succes=p_succes,resultaat=resultaat||coalesce(p_resultaat,'{}'::jsonb)||jsonb_build_object('afgerond',true),
  bestel_signaal_ids=coalesce(p_ids,'{}') WHERE id=p_audit_id;
END;
$body$;

CREATE OR REPLACE FUNCTION public.bestelbot_lees_open(p_vestiging text)
RETURNS TABLE(id uuid,naam text,aantal numeric,eenheid text,notitie text,created_at timestamptz,leverancier_id uuid,leverancier_naam text,artikel_id uuid,match_zekerheid numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $body$
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT s.id,s.naam,s.aantal::numeric,s.eenheid::text,s.notitie,s.created_at,s.leverancier_id,l.naam::text,s.artikel_id,s.match_zekerheid
  FROM public.bestel_signalen s LEFT JOIN public.leveranciers l ON l.id=s.leverancier_id
  WHERE s.vestiging=p_vestiging AND s.status='open' ORDER BY s.created_at;
END;
$body$;

CREATE OR REPLACE FUNCTION public.bestelbot_markeer_besteld(p_vestiging text,p_regels jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
DECLARE r jsonb; v_id uuid; v_ref text; s record; v_uit jsonb:='[]'::jsonb;
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
 IF p_regels IS NULL OR jsonb_typeof(p_regels)<>'array' OR jsonb_array_length(p_regels) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Tussen 1 en 100 regels' USING ERRCODE='22023'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p_regels) LOOP
  v_id:=(r->>'id')::uuid; v_ref:=left(nullif(trim(r->>'bestelreferentie'),''),200);
  SELECT * INTO s FROM public.bestel_signalen WHERE bestel_signalen.id=v_id FOR UPDATE;
  IF NOT FOUND OR s.vestiging<>p_vestiging THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','niet gevonden voor deze vestiging');
  ELSIF s.status='besteld' AND s.besteld_via='bot' AND s.bestelreferentie IS NOT DISTINCT FROM v_ref THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','ok','reden','al besteld');
  ELSIF s.status<>'open' THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','status is '||s.status);
  ELSIF s.leverancier_id IS NOT NULL AND NOT public.bestelbot_leverancier_actief(s.leverancier_id,p_vestiging) THEN
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','overgeslagen','reden','leverancier niet actief voor deze vestiging');
  ELSE
   UPDATE public.bestel_signalen SET status='besteld',besteld_op=now(),bestelreferentie=v_ref,besteld_via='bot' WHERE bestel_signalen.id=v_id;
   v_uit:=v_uit||jsonb_build_object('id',v_id,'status','ok');
  END IF;
 END LOOP;
 RETURN v_uit;
END;
$body$;

CREATE OR REPLACE FUNCTION public.bestelbot_koppel(p_vestiging text,p_id uuid,p_leverancier_id uuid,p_artikel_id uuid,p_match numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
DECLARE s record;
BEGIN
 IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
 IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
 SELECT * INTO s FROM public.bestel_signalen WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR s.vestiging<>p_vestiging THEN RETURN jsonb_build_object('id',p_id,'status','overgeslagen','reden','niet gevonden voor deze vestiging'); END IF;
 IF s.status<>'open' THEN RETURN jsonb_build_object('id',p_id,'status','overgeslagen','reden','status is '||s.status); END IF;
 IF p_leverancier_id IS NOT NULL AND NOT public.bestelbot_leverancier_actief(p_leverancier_id,p_vestiging) THEN
  RETURN jsonb_build_object('id',p_id,'status','overgeslagen','reden','leverancier niet actief voor deze vestiging'); END IF;
 IF p_artikel_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.artikel_locaties al JOIN public.artikelen a ON a.id=al.artikel_id
   WHERE al.artikel_id=p_artikel_id AND al.vestiging=p_vestiging AND al.is_actief AND al.deleted_at IS NULL AND a.deleted_at IS NULL) THEN
  RETURN jsonb_build_object('id',p_id,'status','overgeslagen','reden','artikel niet actief voor deze vestiging'); END IF;
 IF p_match IS NOT NULL AND (p_match<0 OR p_match>1) THEN RETURN jsonb_build_object('id',p_id,'status','overgeslagen','reden','match_zekerheid buiten 0..1'); END IF;
 UPDATE public.bestel_signalen SET leverancier_id=p_leverancier_id,artikel_id=p_artikel_id,match_zekerheid=p_match WHERE id=p_id;
 RETURN jsonb_build_object('id',p_id,'status','ok');
END;
$body$;

REVOKE ALL ON FUNCTION public.bestelbot_aanroep_afsluiten(uuid,boolean,jsonb,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_aanroep_afsluiten(uuid,boolean,jsonb,uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_lees_open(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_lees_open(text) TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_markeer_besteld(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_markeer_besteld(text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_koppel(text,uuid,uuid,uuid,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_koppel(text,uuid,uuid,uuid,numeric) TO service_role;