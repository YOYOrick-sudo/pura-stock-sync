CREATE OR REPLACE FUNCTION public.rpc_zoek_artikel(p_vestiging text, p_tekst text)
 RETURNS TABLE(artikel_id uuid, naam text, alias text, leverancier_id uuid, score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  DECLARE q text;
  BEGIN
   IF p_vestiging IS NULL OR p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE='22023'; END IF;
   IF NOT public.is_service_call() AND NOT public.heeft_vestiging(auth.uid(),p_vestiging) THEN RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE='42501'; END IF;
   IF p_tekst IS NULL OR length(p_tekst)>500 THEN RAISE EXCEPTION 'Zoektekst ontbreekt of is te lang' USING ERRCODE='22023'; END IF;
   q:=public.bestelbot_normaliseer(p_tekst);
   IF q='' THEN RETURN; END IF;
   RETURN QUERY WITH kandidaten AS (
    SELECT a.id,a.naam,aa.alias,COALESCE(aa.leverancier_id,(SELECT lav.leverancier_id FROM public.leverancier_artikel_vestiging lav WHERE lav.artikel_id=a.id AND lav.vestiging=p_vestiging AND lav.actief AND lav.deleted_at IS NULL AND lav.is_voorkeur AND public.bestelbot_leverancier_actief(lav.leverancier_id,p_vestiging) LIMIT 1)),CASE WHEN aa.alias_norm=q THEN 1::numeric ELSE extensions.similarity(aa.alias_norm,q)::numeric END AS s
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
  $function$;