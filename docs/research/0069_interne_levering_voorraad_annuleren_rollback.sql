-- Rollback van drizzle/migrations/0069_interne_levering_voorraad_annuleren.sql.
-- Niet automatisch draaien. Preview en productie delen één database.
-- Zet de twee v2-functies terug naar de stand van na PR #16.
-- v1, foh_tasks, horeko_artikelen en bestel_signalen blijven onaangeroerd.

DROP FUNCTION IF EXISTS public.interne_v2_pak_iedereen(text, uuid);
DROP FUNCTION IF EXISTS public.interne_v2_eis_vestiging_iedereen(text);

CREATE OR REPLACE FUNCTION public.interne_v2_ontvangen(
  p_vestiging text,
  p_aanvraag_id uuid,
  p_aantal numeric,
  p_opmerking text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_ruimte numeric;
  v_naam text;
  v_regel uuid;
  v_lev uuid;
  v_opmerking text := NULLIF(btrim(COALESCE(p_opmerking, '')), '');
  v_vestiging text;
BEGIN
  IF p_vestiging NOT IN ('West', 'Test') THEN
    RAISE EXCEPTION 'Ontvangen doe je in West' USING ERRCODE = '42501';
  END IF;
  r := public.interne_v2_pak(p_vestiging, p_aanvraag_id);
  v_ruimte := round(GREATEST(0, r.meegegeven_aantal - r.ontvangen_aantal), 3);
  IF v_ruimte <= 0 THEN
    RAISE EXCEPTION 'Er is nog niets onderweg' USING ERRCODE = '22023';
  END IF;
  IF p_aantal IS NULL THEN
    p_aantal := v_ruimte;
  END IF;
  IF p_aantal < 0 OR p_aantal > v_ruimte THEN
    RAISE EXCEPTION 'Hooguit % onderweg', v_ruimte USING ERRCODE = '22023';
  END IF;
  IF v_opmerking IS NOT NULL AND char_length(v_opmerking) > 500 THEN
    RAISE EXCEPTION 'De opmerking is te lang' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(p.naam, r.vrije_naam) INTO v_naam
  FROM (SELECT 1) s
  LEFT JOIN public.interne_producten p ON p.id = r.product_id;

  v_vestiging := CASE WHEN r.proef THEN 'Test' ELSE 'West' END;

  IF p_aantal > 0 THEN
    SELECT l.id INTO v_lev
    FROM public.leveranciers l
    WHERE l.deleted_at IS NULL
      AND l.naam = 'Midsland (intern)'
    ORDER BY l.created_at
    LIMIT 1;

    -- Zelfde ontvangstregel als v1, zonder prijs of verrekening. Sleutel per boeking,
    -- zodat een deelontvangst de vorige niet overschrijft.
    INSERT INTO public.ontvangst_regel (
      levering_id, sleutel, vestiging, bron, bron_vestiging, leverancier_id,
      artikel_id, omschrijving, aantal, besteld_aantal, eenheid,
      uitkomst, ontvangen_op, geregistreerd_door, opmerking
      -- telt_voorraad is een gegenereerde kolom (binnen => true); niet invullen.
    ) VALUES (
      r.id, 'intern-v2:' || r.id::text || ':' || gen_random_uuid()::text,
      v_vestiging, 'eindcheck', 'West', v_lev,
      r.artikel_id, COALESCE(v_naam, 'Intern'), round(p_aantal, 3), r.besteld_aantal, r.eenheid,
      'binnen', (timezone('Europe/Amsterdam', now()))::date, auth.uid(), v_opmerking
    ) RETURNING id INTO v_regel;
  END IF;

  UPDATE public.interne_aanvraag SET
    ontvangen_aantal = round(ontvangen_aantal + p_aantal, 3),
    ontvangen_op = now(),
    ontvangen_door = auth.uid(),
    ontvangst_opmerking = COALESCE(v_opmerking, ontvangst_opmerking),
    ontvangst_regel_id = COALESCE(v_regel, ontvangst_regel_id),
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id);
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_annuleren(
  p_vestiging text,
  p_aanvraag_id uuid,
  p_aantal numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_ruimte numeric;
  v_minder_mep numeric;
  v_doel numeric;
BEGIN
  r := public.interne_v2_pak(p_vestiging, p_aanvraag_id);
  v_ruimte := round(GREATEST(0, r.besteld_aantal - r.ontvangen_aantal - r.geannuleerd_aantal), 3);
  IF p_aantal IS NULL THEN
    p_aantal := v_ruimte;
  END IF;
  IF p_aantal <= 0 OR p_aantal > v_ruimte THEN
    RAISE EXCEPTION 'Er is niets meer te annuleren' USING ERRCODE = '22023';
  END IF;
  v_minder_mep := round(LEAST(p_aantal, GREATEST(0, r.mep_aantal - r.mep_klaar_aantal)), 3);

  IF v_minder_mep > 0 AND r.mep_taak_id IS NOT NULL THEN
    SELECT doel_aantal INTO v_doel FROM public.mep_taken WHERE id = r.mep_taak_id FOR UPDATE;
    IF FOUND THEN
      IF round(COALESCE(v_doel, 0) - v_minder_mep, 2) <= 0 THEN
        UPDATE public.mep_taken
        SET doel_aantal = 0, status = 'geannuleerd', updated_at = now()
        WHERE id = r.mep_taak_id AND status = 'open';
      ELSE
        UPDATE public.mep_taken
        SET doel_aantal = round(COALESCE(doel_aantal, 0) - v_minder_mep, 2), updated_at = now()
        WHERE id = r.mep_taak_id AND status = 'open';
      END IF;
    END IF;
  END IF;

  UPDATE public.interne_aanvraag SET
    geannuleerd_aantal = round(geannuleerd_aantal + p_aantal, 3),
    geannuleerd_op = now(),
    geannuleerd_door = auth.uid(),
    mep_aantal = round(mep_aantal - v_minder_mep, 3),
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id);
END $$;

GRANT EXECUTE ON FUNCTION public.interne_v2_ontvangen(text, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_annuleren(text, uuid, numeric) TO authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_ontvangen(text, uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_annuleren(text, uuid, numeric) FROM PUBLIC, anon;
