-- Additive only. Down: docs/bestelbot-fundament.md; never execute with live data.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
ALTER TABLE public.bestel_signalen
 ADD COLUMN IF NOT EXISTS leverancier_id uuid REFERENCES public.leveranciers(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS artikel_id uuid REFERENCES public.artikelen(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS bestelreferentie text,
 ADD COLUMN IF NOT EXISTS besteld_via text CHECK (besteld_via IN ('handmatig','bot')),
 ADD COLUMN IF NOT EXISTS match_zekerheid numeric CHECK (match_zekerheid BETWEEN 0 AND 1);
CREATE INDEX IF NOT EXISTS bestel_signalen_vestiging_status_idx ON public.bestel_signalen(vestiging,status);
CREATE TABLE IF NOT EXISTS public.artikel_aliassen (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
 alias text NOT NULL CHECK (length(trim(alias)) BETWEEN 1 AND 500), alias_norm text NOT NULL,
 artikel_id uuid NOT NULL REFERENCES public.artikelen(id), leverancier_id uuid REFERENCES public.leveranciers(id),
 bron text NOT NULL DEFAULT 'handmatig' CHECK (bron IN ('handmatig','bot','import','bord')),
 gebruik_aantal integer NOT NULL DEFAULT 0 CHECK (gebruik_aantal>=0), laatst_gebruikt timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
GRANT SELECT,INSERT,UPDATE ON public.artikel_aliassen TO authenticated;
GRANT ALL ON public.artikel_aliassen TO service_role;
ALTER TABLE public.artikel_aliassen ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.leverancier_artikel_vestiging (
 leverancier_id uuid NOT NULL REFERENCES public.leveranciers(id), artikel_id uuid NOT NULL REFERENCES public.artikelen(id),
 vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')), besteleenheid_id uuid REFERENCES public.eenheden(id),
 inhoud_per_besteleenheid numeric CHECK (inhoud_per_besteleenheid>0), artikelnummer text,
 is_voorkeur boolean NOT NULL DEFAULT false, actief boolean NOT NULL DEFAULT true, deleted_at timestamptz,
 PRIMARY KEY (leverancier_id,artikel_id,vestiging)
);
GRANT SELECT,INSERT,UPDATE ON public.leverancier_artikel_vestiging TO authenticated;
GRANT ALL ON public.leverancier_artikel_vestiging TO service_role;
ALTER TABLE public.leverancier_artikel_vestiging ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.bot_instellingen (
 sleutel text PRIMARY KEY, waarde jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE ON public.bot_instellingen TO authenticated;
GRANT ALL ON public.bot_instellingen TO service_role;
ALTER TABLE public.bot_instellingen ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.bot_audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tijdstip timestamptz NOT NULL DEFAULT clock_timestamp(), actie text NOT NULL,
 vestiging text CHECK (vestiging IN ('West','Midsland')), bestel_signaal_ids uuid[] NOT NULL DEFAULT '{}',
 resultaat jsonb NOT NULL, aanroeper_ip text, succes boolean NOT NULL
);
GRANT SELECT ON public.bot_audit_log TO authenticated;
GRANT ALL ON public.bot_audit_log TO service_role;
ALTER TABLE public.bot_audit_log ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS public.bestel_historie_import (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
 besteldatum date NOT NULL, leverancier_id uuid REFERENCES public.leveranciers(id),
 leverancier_naam_ruw text NOT NULL CHECK (length(trim(leverancier_naam_ruw)) BETWEEN 1 AND 500),
 artikel_id uuid REFERENCES public.artikelen(id), artikel_naam_ruw text NOT NULL CHECK (length(trim(artikel_naam_ruw)) BETWEEN 1 AND 500),
 aantal numeric NOT NULL CHECK (aantal>0), eenheid_ruw text, verpakking_ruw text, prijs numeric CHECK (prijs>=0),
 bonrol_flag boolean NOT NULL DEFAULT false, bron text, extern_ordernummer text,
 geimporteerd_op timestamptz NOT NULL DEFAULT now(), verwerkt boolean NOT NULL DEFAULT false
);
GRANT SELECT,INSERT,UPDATE ON public.bestel_historie_import TO authenticated;
GRANT ALL ON public.bestel_historie_import TO service_role;
ALTER TABLE public.bestel_historie_import ENABLE ROW LEVEL SECURITY;
DO $policies$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['artikel_aliassen','leverancier_artikel_vestiging'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_lezen') THEN
   EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.heeft_vestiging(auth.uid(),vestiging))',t||'_lezen',t);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_toevoegen') THEN
   EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_inkoop_beheerder() AND public.heeft_vestiging(auth.uid(),vestiging))',t||'_toevoegen',t);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_wijzigen') THEN
   EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_inkoop_beheerder() AND public.heeft_vestiging(auth.uid(),vestiging)) WITH CHECK (public.is_inkoop_beheerder() AND public.heeft_vestiging(auth.uid(),vestiging))',t||'_wijzigen',t);
  END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['bot_instellingen','bestel_historie_import'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_beheer_lezen') THEN
   EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_inkoop_beheerder())',t||'_beheer_lezen',t);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_beheer_toevoegen') THEN
   EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_inkoop_beheerder())',t||'_beheer_toevoegen',t);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=t||'_beheer_wijzigen') THEN
   EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_inkoop_beheerder()) WITH CHECK (public.is_inkoop_beheerder())',t||'_beheer_wijzigen',t);
  END IF;
 END LOOP;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bot_audit_log' AND policyname='bot_audit_log_beheer_lezen') THEN
  CREATE POLICY bot_audit_log_beheer_lezen ON public.bot_audit_log FOR SELECT TO authenticated USING (public.is_inkoop_beheerder());
 END IF;
END;
$policies$;
CREATE UNIQUE INDEX IF NOT EXISTS artikel_aliassen_actieve_norm_idx ON public.artikel_aliassen(vestiging,alias_norm) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS artikel_aliassen_trigram_idx ON public.artikel_aliassen USING gin(alias_norm extensions.gin_trgm_ops);
CREATE UNIQUE INDEX IF NOT EXISTS leverancier_artikel_vestiging_voorkeur_idx ON public.leverancier_artikel_vestiging(vestiging,artikel_id) WHERE is_voorkeur AND actief AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS bot_audit_log_tijdstip_idx ON public.bot_audit_log(tijdstip);
CREATE UNIQUE INDEX IF NOT EXISTS bestel_historie_import_dedupe_idx ON public.bestel_historie_import(vestiging,besteldatum,leverancier_naam_ruw,artikel_naam_ruw,coalesce(extern_ordernummer,''));
DO $functions$
BEGIN
 IF to_regprocedure('public.bestelbot_normaliseer(text)') IS NULL THEN
  EXECUTE $create$CREATE FUNCTION public.bestelbot_normaliseer(p_tekst text) RETURNS text LANGUAGE sql STABLE SET search_path=public,extensions AS $body$
   SELECT trim(regexp_replace(lower(extensions.unaccent(coalesce(p_tekst,''))),'[^[:alnum:]]+','','g'))
  $body$$create$;
 END IF;
 IF to_regprocedure('public.bestelbot_leverancier_actief(uuid,text)') IS NULL THEN
  EXECUTE $create$CREATE FUNCTION public.bestelbot_leverancier_actief(p_leverancier_id uuid,p_vestiging text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $body$
   SELECT p_vestiging IN ('West','Midsland') AND EXISTS (
    SELECT 1 FROM public.leverancier_vestiging_config c JOIN public.leveranciers l ON l.id=c.leverancier_id
    WHERE c.leverancier_id=p_leverancier_id AND c.vestiging=p_vestiging AND c.actief AND c.deleted_at IS NULL AND l.actief AND l.deleted_at IS NULL
   )
  $body$$create$;
 END IF;
 IF to_regprocedure('public.bestelbot_koppeling_bewaken()') IS NULL THEN
  EXECUTE $create$CREATE FUNCTION public.bestelbot_koppeling_bewaken() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
  BEGIN
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
  $body$$create$;
 END IF;
 IF to_regprocedure('public.rpc_zoek_artikel(text,text)') IS NULL THEN
  EXECUTE $create$CREATE FUNCTION public.rpc_zoek_artikel(p_vestiging text,p_tekst text)
   RETURNS TABLE(artikel_id uuid,naam text,alias text,leverancier_id uuid,score numeric)
   LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions AS $body$
  DECLARE q text;
  BEGIN
   IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
   IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),p_vestiging) THEN RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE='42501'; END IF;
   IF p_tekst IS NULL OR length(p_tekst)>500 THEN RAISE EXCEPTION 'Zoektekst ontbreekt of is te lang' USING ERRCODE='22023'; END IF;
   q:=public.bestelbot_normaliseer(p_tekst);
   IF q='' THEN RETURN; END IF;
   RETURN QUERY WITH kandidaten AS (
    SELECT a.id,a.naam,aa.alias,aa.leverancier_id,CASE WHEN aa.alias_norm=q THEN 1::numeric ELSE extensions.similarity(aa.alias_norm,q)::numeric END AS s
    FROM public.artikel_aliassen aa JOIN public.artikelen a ON a.id=aa.artikel_id
    WHERE aa.vestiging=p_vestiging AND aa.deleted_at IS NULL AND a.deleted_at IS NULL
     AND EXISTS (SELECT 1 FROM public.artikel_locaties al WHERE al.artikel_id=a.id AND al.vestiging=p_vestiging AND al.is_actief AND al.deleted_at IS NULL)
     AND (aa.leverancier_id IS NULL OR public.bestelbot_leverancier_actief(aa.leverancier_id,p_vestiging))
     AND (aa.alias_norm=q OR extensions.similarity(aa.alias_norm,q)>=0.15)
    UNION ALL
    SELECT a.id,a.naam,NULL::text,
     (SELECT lav.leverancier_id FROM public.leverancier_artikel_vestiging lav WHERE lav.artikel_id=a.id AND lav.vestiging=p_vestiging AND lav.actief AND lav.deleted_at IS NULL AND lav.is_voorkeur AND public.bestelbot_leverancier_actief(lav.leverancier_id,p_vestiging) LIMIT 1),
     CASE WHEN public.bestelbot_normaliseer(a.naam)=q THEN 1::numeric ELSE extensions.similarity(public.bestelbot_normaliseer(a.naam),q)::numeric END
    FROM public.artikelen a JOIN public.artikel_locaties al ON al.artikel_id=a.id
    WHERE al.vestiging=p_vestiging AND al.is_actief AND al.deleted_at IS NULL AND a.deleted_at IS NULL
     AND (public.bestelbot_normaliseer(a.naam)=q OR extensions.similarity(public.bestelbot_normaliseer(a.naam),q)>=0.15)
   ), uniek AS (SELECT DISTINCT ON (k.id) k.* FROM kandidaten k ORDER BY k.id,k.s DESC,(k.alias IS NOT NULL) DESC,k.alias)
   SELECT u.id,u.naam,u.alias,u.leverancier_id,u.s FROM uniek u ORDER BY u.s DESC,u.naam,u.id LIMIT 5;
  END;
  $body$$create$;
 END IF;
 IF to_regprocedure('public.bestelbot_aanroep_start(text,text,text)') IS NULL THEN
  EXECUTE $create$CREATE FUNCTION public.bestelbot_aanroep_start(p_actie text,p_vestiging text,p_ip text)
   RETURNS TABLE(audit_id uuid,toegestaan boolean,http_status integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
  DECLARE v_id uuid; v_actief boolean; v_aantal integer; v_status integer;
  BEGIN
   IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('bot-bestelbord-rate',0));
   SELECT waarde='true'::jsonb INTO v_actief FROM public.bot_instellingen WHERE sleutel='bot_bestelbord_actief';
   SELECT count(*) INTO v_aantal FROM public.bot_audit_log WHERE tijdstip>clock_timestamp()-interval '1 minute';
   v_status:=CASE WHEN NOT coalesce(v_actief,false) THEN 503 WHEN v_aantal>=60 THEN 429 ELSE 200 END;
   INSERT INTO public.bot_audit_log(actie,vestiging,aanroeper_ip,resultaat,succes) VALUES (
    left(coalesce(p_actie,'ongeldig'),80),CASE WHEN p_vestiging IN ('West','Midsland') THEN p_vestiging ELSE NULL END,
    left(p_ip,100),jsonb_build_object('http_status',v_status,'afgerond',false),false) RETURNING id INTO v_id;
   RETURN QUERY SELECT v_id,v_status=200,v_status;
  END;
  $body$$create$;
 END IF;
 IF to_regprocedure('public.bestelbot_import_historie(text,jsonb,uuid)') IS NULL THEN
  EXECUTE $create$CREATE FUNCTION public.bestelbot_import_historie(p_vestiging text,p_rijen jsonb,p_audit_id uuid)
   RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $body$
  DECLARE r jsonb; v_aantal integer:=0; v_toegevoegd integer:=0; v_resultaat jsonb;
  BEGIN
   IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
   IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
   IF p_rijen IS NULL OR jsonb_typeof(p_rijen)<>'array' THEN RAISE EXCEPTION 'Rijen moet een array zijn' USING ERRCODE='22023'; END IF;
   IF jsonb_array_length(p_rijen) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Maximaal 500 rijen per import' USING ERRCODE='22023'; END IF;
   IF NOT EXISTS (SELECT 1 FROM public.bot_audit_log WHERE id=p_audit_id AND vestiging=p_vestiging AND actie='import_historie' AND resultaat->>'http_status'='200' AND resultaat->>'afgerond'='false' FOR UPDATE) THEN
    RAISE EXCEPTION 'Geldige audit-aanroep ontbreekt' USING ERRCODE='22023';
   END IF;
   IF NOT EXISTS (SELECT 1 FROM public.bot_instellingen WHERE sleutel='bot_bestelbord_actief' AND waarde='true'::jsonb) THEN RAISE EXCEPTION 'Bot staat uit' USING ERRCODE='55000'; END IF;
   FOR r IN SELECT value FROM jsonb_array_elements(p_rijen) LOOP
    IF jsonb_typeof(r)<>'object' OR EXISTS (SELECT 1 FROM jsonb_object_keys(r) k WHERE k NOT IN ('vestiging','besteldatum','leverancier_id','leverancier_naam_ruw','artikel_id','artikel_naam_ruw','aantal','eenheid_ruw','verpakking_ruw','prijs','bonrol_flag','bron','extern_ordernummer')) THEN
     RAISE EXCEPTION 'Ongeldige importvelden' USING ERRCODE='22023';
    END IF;
    IF r?'vestiging' AND r->>'vestiging' IS DISTINCT FROM p_vestiging THEN RAISE EXCEPTION 'Vestiging van importregel wijkt af' USING ERRCODE='22023'; END IF;
    INSERT INTO public.bestel_historie_import(vestiging,besteldatum,leverancier_id,leverancier_naam_ruw,artikel_id,artikel_naam_ruw,aantal,eenheid_ruw,verpakking_ruw,prijs,bonrol_flag,bron,extern_ordernummer)
    VALUES(p_vestiging,(r->>'besteldatum')::date,(r->>'leverancier_id')::uuid,r->>'leverancier_naam_ruw',(r->>'artikel_id')::uuid,r->>'artikel_naam_ruw',(r->>'aantal')::numeric,r->>'eenheid_ruw',r->>'verpakking_ruw',(r->>'prijs')::numeric,coalesce((r->>'bonrol_flag')::boolean,false),r->>'bron',nullif(trim(r->>'extern_ordernummer'),'')) ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_aantal=ROW_COUNT; v_toegevoegd:=v_toegevoegd+v_aantal;
   END LOOP;
   v_resultaat:=jsonb_build_object('toegevoegd',v_toegevoegd,'overgeslagen',jsonb_array_length(p_rijen)-v_toegevoegd,'afgerond',true);
   UPDATE public.bot_audit_log SET resultaat=v_resultaat,succes=true WHERE id=p_audit_id;
   RETURN v_resultaat;
  END;
  $body$$create$;
 END IF;
END;
$functions$;
REVOKE ALL ON FUNCTION public.bestelbot_normaliseer(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bestelbot_normaliseer(text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.bestelbot_leverancier_actief(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.bestelbot_leverancier_actief(uuid,text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.bestelbot_koppeling_bewaken() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rpc_zoek_artikel(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rpc_zoek_artikel(text,text) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.bestelbot_aanroep_start(text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_aanroep_start(text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.bestelbot_import_historie(text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_import_historie(text,jsonb,uuid) TO service_role;
DO $triggers$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['artikel_aliassen','leverancier_artikel_vestiging','bestel_historie_import'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid=('public.'||t)::regclass AND tgname=t||'_bestelbot_bewaken') THEN
   EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bestelbot_koppeling_bewaken()',t||'_bestelbot_bewaken',t);
  END IF;
 END LOOP;
 IF to_regclass('public.v_bestel_historie_top') IS NULL THEN
  EXECUTE $view$CREATE VIEW public.v_bestel_historie_top WITH (security_invoker=true) AS
   SELECT vestiging,artikel_id,CASE WHEN artikel_id IS NULL THEN artikel_naam_ruw ELSE NULL END AS artikel_naam_ruw,
    count(*) AS hoe_vaak,max(besteldatum) AS laatst_besteld,
    (array_agg(aantal ORDER BY besteldatum DESC,geimporteerd_op DESC,id DESC))[1] AS laatste_aantal,
    (array_agg(eenheid_ruw ORDER BY besteldatum DESC,geimporteerd_op DESC,id DESC))[1] AS laatste_eenheid,
    (array_agg(verpakking_ruw ORDER BY besteldatum DESC,geimporteerd_op DESC,id DESC))[1] AS laatste_verpakking,
    (array_agg(leverancier_id ORDER BY besteldatum DESC,geimporteerd_op DESC,id DESC))[1] AS laatste_leverancier_id,
    (array_agg(leverancier_naam_ruw ORDER BY besteldatum DESC,geimporteerd_op DESC,id DESC))[1] AS laatste_leverancier_naam,
    bool_or(bonrol_flag) AS bonrol_flag
   FROM public.bestel_historie_import GROUP BY vestiging,artikel_id,CASE WHEN artikel_id IS NULL THEN artikel_naam_ruw ELSE NULL END
  $view$;
 END IF;
END;
$triggers$;
GRANT SELECT ON public.v_bestel_historie_top TO authenticated,service_role;