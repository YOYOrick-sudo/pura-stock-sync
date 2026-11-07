-- Portal: open bordregels op besteld zetten, met leverdag en optioneel ordernummer.
-- Doet hetzelfde als bestelbot_markeer_besteld (status, besteld_op, referentie,
-- verwachte_levering, alleen open regels van deze vestiging, datum vandaag t/m +30,
-- actieve leverancier), maar voor een ingelogde gebruiker met vestigingstoegang.
-- besteld_via wordt 'handmatig' en besteld_door de gebruiker.
-- bestelbot_markeer_besteld blijft onaangeroerd: alleen service role, besteld_via = bot.
-- Terugdraaien: supabase/rollbacks/bord_markeer_besteld_rollback.sql

CREATE OR REPLACE FUNCTION public.bord_markeer_besteld(p_vestiging text, p_regels jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  v_id uuid;
  v_ref text;
  v_lev text;
  v_lev_date date;
  s record;
  v_uit jsonb := '[]'::jsonb;
  v_vandaag date := (now() AT TIME ZONE 'Europe/Amsterdam')::date;
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '42501';
  END IF;
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West', 'Midsland') THEN
    RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE = '22023';
  END IF;
  IF NOT public.heeft_vestiging(v_user, p_vestiging) THEN
    RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE = '42501';
  END IF;
  IF p_regels IS NULL OR jsonb_typeof(p_regels) <> 'array' OR jsonb_array_length(p_regels) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Tussen 1 en 100 regels' USING ERRCODE = '22023';
  END IF;

  FOR r IN SELECT value FROM jsonb_array_elements(p_regels) LOOP
    v_id := (r->>'id')::uuid;
    v_ref := left(nullif(trim(r->>'bestelreferentie'), ''), 200);
    v_lev := nullif(trim(r->>'verwachte_levering'), '');
    IF v_lev IS NOT NULL AND v_lev !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'verwachte_levering geen YYYY-MM-DD');
      CONTINUE;
    END IF;
    v_lev_date := v_lev::date;
    IF v_lev_date IS NOT NULL AND (v_lev_date < v_vandaag OR v_lev_date > v_vandaag + 30) THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'verwachte_levering buiten bereik (vandaag t/m +30 dagen)');
      CONTINUE;
    END IF;

    SELECT * INTO s FROM public.bestel_signalen WHERE bestel_signalen.id = v_id FOR UPDATE;
    IF NOT FOUND OR s.vestiging <> p_vestiging THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'niet gevonden voor deze vestiging');
    ELSIF s.status = 'besteld' AND s.besteld_via = 'handmatig' AND s.bestelreferentie IS NOT DISTINCT FROM v_ref THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'ok', 'reden', 'al besteld', 'verwachte_levering', s.verwachte_levering);
    ELSIF s.status <> 'open' THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'status is ' || s.status);
    ELSIF s.leverancier_id IS NOT NULL AND NOT public.bestelbot_leverancier_actief(s.leverancier_id, p_vestiging) THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'leverancier niet actief voor deze vestiging');
    ELSE
      UPDATE public.bestel_signalen
      SET status = 'besteld',
          besteld_op = now(),
          besteld_door = v_user,
          bestelreferentie = v_ref,
          besteld_via = 'handmatig',
          verwachte_levering = v_lev_date
      WHERE bestel_signalen.id = v_id;
      SELECT verwachte_levering INTO v_lev_date FROM public.bestel_signalen WHERE bestel_signalen.id = v_id;
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'ok', 'verwachte_levering', v_lev_date);
    END IF;
  END LOOP;

  RETURN v_uit;
END;
$$;

REVOKE ALL ON FUNCTION public.bord_markeer_besteld(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bord_markeer_besteld(text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.bord_markeer_besteld(text, jsonb) IS
  'Portal markeert open bordregels als besteld (handmatig). De bestelbot blijft bestelbot_markeer_besteld gebruiken.';
