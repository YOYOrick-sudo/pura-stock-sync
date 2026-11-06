-- Interne levering v2: ontvangst telt in de voorraad, en iedereen met vestigingstoegang mag annuleren.
-- Alleen de v2-functies. v1 (interne_bestelling_*) blijft staan.
-- Geen wijziging aan foh_tasks, horeko_artikelen of bestel_signalen.
-- Niet uitvoeren vanuit de agent: preview en productie delen één database.
-- Rollback: docs/research/0069_interne_levering_voorraad_annuleren_rollback.sql

-- Zelfde toegang als fase2_mag_vestiging, zonder de rollijst van interne_v2_eis_rol.
-- Andere v2-acties blijven via interne_v2_pak achter die rollijst.
CREATE OR REPLACE FUNCTION public.interne_v2_eis_vestiging_iedereen(p_vestiging text)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '28000';
  END IF;
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West', 'Midsland', 'Test') THEN
    RAISE EXCEPTION 'Onbekende vestiging' USING ERRCODE = '22023';
  END IF;
  IF NOT public.fase2_mag_vestiging(auth.uid(), p_vestiging) THEN
    RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fase2_vlag
    WHERE vestiging = p_vestiging AND vlag = 'interne_levering_v2' AND aan IS TRUE
  ) THEN
    RAISE EXCEPTION 'Interne levering v2 staat uit' USING ERRCODE = '55000';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_pak_iedereen(p_vestiging text, p_id uuid)
RETURNS public.interne_aanvraag
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
BEGIN
  PERFORM public.interne_v2_eis_vestiging_iedereen(p_vestiging);
  SELECT * INTO r FROM public.interne_aanvraag WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aanvraag niet gevonden' USING ERRCODE = 'P0002';
  END IF;
  IF p_vestiging = 'Test' THEN
    IF r.proef IS NOT TRUE THEN
      RAISE EXCEPTION 'Geen toegang tot deze aanvraag' USING ERRCODE = '42501';
    END IF;
  ELSIF p_vestiging = 'West' THEN
    IF r.proef IS TRUE OR r.naar_vestiging <> 'West' THEN
      RAISE EXCEPTION 'Geen toegang tot deze aanvraag' USING ERRCODE = '42501';
    END IF;
  ELSIF p_vestiging = 'Midsland' THEN
    IF r.proef IS TRUE OR r.van_vestiging <> 'Midsland' THEN
      RAISE EXCEPTION 'Geen toegang tot deze aanvraag' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN r;
END $$;

-- Zelfde boeking als een leveranciersontvangst: een ontvangstregel met uitkomst binnen.
-- telt_voorraad is gegenereerd (binnen of ander_product => true) en blijft oningevuld.
-- keuken_voorraad_stand telt aantal * inhoud_per_verpakking, op artikel en eenheid.
-- De sleutel is het nieuwe ontvangen totaal, zodat dezelfde ontvangst geen tweede regel schrijft.
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
  v_artikel uuid;
  v_inhoud numeric;
  v_basis text;
  v_nieuw numeric;
  v_sleutel text;
  v_reden text;
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

  SELECT p.naam, p.artikel_id, p.inhoud_per_eenheid, p.inhoud_eenheid
  INTO v_naam, v_artikel, v_inhoud, v_basis
  FROM public.interne_producten p
  WHERE p.id = r.product_id;

  v_naam := COALESCE(v_naam, r.vrije_naam, 'Intern');
  v_artikel := COALESCE(r.artikel_id, v_artikel);
  v_vestiging := CASE WHEN r.proef THEN 'Test' ELSE 'West' END;
  v_nieuw := round(r.ontvangen_aantal + p_aantal, 3);

  IF v_artikel IS NULL THEN
    v_reden := 'geen artikel: telt niet in voorraad';
  ELSIF v_inhoud IS NULL OR v_inhoud <= 0 OR NULLIF(btrim(COALESCE(v_basis, '')), '') IS NULL THEN
    v_reden := 'geen inhoud per verpakking: telt niet in voorraad';
  ELSIF NOT EXISTS (
    SELECT 1 FROM public.keuken_telartikel t
    WHERE t.actief IS TRUE
      AND t.vestiging = v_vestiging
      AND t.bron_vestiging = 'West'
      AND t.artikel_id = v_artikel
      AND replace(t.basis_eenheid, 'stuk', 'st') = replace(v_basis, 'stuk', 'st')
  ) THEN
    v_reden := 'geen telartikel met dezelfde eenheid: telt niet in voorraad';
  END IF;

  IF p_aantal > 0 THEN
    SELECT l.id INTO v_lev
    FROM public.leveranciers l
    WHERE l.deleted_at IS NULL
      AND l.naam = 'Midsland (intern)'
    ORDER BY l.created_at
    LIMIT 1;

    v_sleutel := 'intern-v2:' || r.id::text || ':tot:' || to_char(v_nieuw, 'FM999999990.000');

    INSERT INTO public.ontvangst_regel (
      levering_id, sleutel, vestiging, bron, bron_vestiging, leverancier_id,
      artikel_id, omschrijving, aantal, besteld_aantal, eenheid,
      inhoud_per_verpakking, basis_eenheid,
      uitkomst, ontvangen_op, geregistreerd_door, opmerking
    ) VALUES (
      r.id, v_sleutel,
      v_vestiging, 'eindcheck', 'West', v_lev,
      v_artikel, v_naam, round(p_aantal, 3), r.besteld_aantal, r.eenheid,
      v_inhoud, NULLIF(btrim(COALESCE(v_basis, '')), ''),
      'binnen', (timezone('Europe/Amsterdam', now()))::date, auth.uid(), v_opmerking
    )
    ON CONFLICT (sleutel) DO NOTHING
    RETURNING id INTO v_regel;

    IF v_regel IS NULL THEN
      -- De regel voor dit totaal bestaat al. Niet nog een keer optellen.
      SELECT id INTO v_regel FROM public.ontvangst_regel WHERE sleutel = v_sleutel;
      IF r.ontvangen_aantal < v_nieuw THEN
        UPDATE public.interne_aanvraag SET
          ontvangen_aantal = v_nieuw,
          ontvangen_op = now(),
          ontvangen_door = auth.uid(),
          ontvangst_opmerking = COALESCE(v_opmerking, ontvangst_opmerking),
          ontvangst_regel_id = COALESCE(v_regel, ontvangst_regel_id),
          updated_at = now()
        WHERE id = r.id;
        PERFORM public.interne_v2_zet_status(r.id);
      END IF;
      RETURN public.interne_v2_json(r.id) || jsonb_build_object(
        'al_gedaan', true,
        'voorraad_reden', v_reden,
        'voorraad_telt', v_reden IS NULL
      );
    END IF;
  END IF;

  UPDATE public.interne_aanvraag SET
    ontvangen_aantal = v_nieuw,
    ontvangen_op = now(),
    ontvangen_door = auth.uid(),
    ontvangst_opmerking = COALESCE(v_opmerking, ontvangst_opmerking),
    ontvangst_regel_id = COALESCE(v_regel, ontvangst_regel_id),
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id) || jsonb_build_object(
    'al_gedaan', false,
    'voorraad_reden', v_reden,
    'voorraad_telt', v_reden IS NULL
  );
END $$;

-- Annuleren mag voor elke ingelogde gebruiker met toegang tot de vestiging,
-- ook als de status al meegegeven (onderweg) is. Alleen het nog niet ontvangen deel.
-- Voorraad: ontvangstregels van wat al binnen is blijven meetellen.
-- Een surplus boven dat ontvangen aantal gaat op vervallen als de regel past,
-- anders blijft het bedrag in voorraad_niet_gesplitst staan.
-- MEP: een open of bezige taak gaat omlaag met wat nog niet gemaakt is.
-- Een afgeronde taak blijft afgerond.
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
  v_houden numeric;
  v_geboekt numeric;
  v_terug numeric := 0;
  v_rij record;
BEGIN
  r := public.interne_v2_pak_iedereen(p_vestiging, p_aanvraag_id);
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
        WHERE id = r.mep_taak_id AND status IN ('open', 'bezig');
      ELSE
        UPDATE public.mep_taken
        SET doel_aantal = round(COALESCE(doel_aantal, 0) - v_minder_mep, 2), updated_at = now()
        WHERE id = r.mep_taak_id AND status IN ('open', 'bezig');
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

  v_houden := round(COALESCE(r.ontvangen_aantal, 0), 3);
  SELECT COALESCE(round(sum(aantal), 3), 0) INTO v_geboekt
  FROM public.ontvangst_regel
  WHERE levering_id = r.id
    AND sleutel LIKE 'intern-v2:' || r.id::text || ':%'
    AND vervallen_op IS NULL
    AND uitkomst IN ('binnen', 'ander_product');

  IF v_geboekt > v_houden THEN
    FOR v_rij IN
      SELECT id, aantal
      FROM public.ontvangst_regel
      WHERE levering_id = r.id
        AND sleutel LIKE 'intern-v2:' || r.id::text || ':%'
        AND vervallen_op IS NULL
        AND uitkomst IN ('binnen', 'ander_product')
      ORDER BY geregistreerd_op DESC, id DESC
      FOR UPDATE
    LOOP
      EXIT WHEN round(v_geboekt - v_houden, 3) <= 0;
      IF v_rij.aantal <= round(v_geboekt - v_houden, 3) + 0.0001 THEN
        UPDATE public.ontvangst_regel
        SET vervallen_op = now()
        WHERE id = v_rij.id;
        v_geboekt := round(v_geboekt - v_rij.aantal, 3);
        v_terug := round(v_terug + v_rij.aantal, 3);
      END IF;
    END LOOP;
  END IF;

  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id) || jsonb_build_object(
    'voorraad_blijft', v_houden,
    'voorraad_teruggedraaid', v_terug,
    'voorraad_niet_gesplitst', round(GREATEST(0, v_geboekt - v_houden), 3),
    'mep_minder', v_minder_mep
  );
END $$;

REVOKE ALL ON FUNCTION public.interne_v2_eis_vestiging_iedereen(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_pak_iedereen(text, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.interne_v2_ontvangen(text, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_annuleren(text, uuid, numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.interne_v2_ontvangen(text, uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_annuleren(text, uuid, numeric) FROM PUBLIC, anon;
