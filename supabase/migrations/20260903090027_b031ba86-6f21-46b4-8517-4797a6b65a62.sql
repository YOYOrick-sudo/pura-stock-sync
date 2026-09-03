CREATE OR REPLACE FUNCTION public.mep_taak_afronden(
  _taak_id uuid,
  _aantal_gemaakt numeric DEFAULT 1,
  _temperatuur numeric DEFAULT NULL::numeric,
  _notitie text DEFAULT NULL::text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_taak record;
  v_methode record;
  v_heeft_methode boolean := false;
  v_batch_nummer text;
  v_batch_id uuid;
  v_houdbaar_tot date;
  v_hoeveelheid numeric;
  v_eenheid text;
  v_afronding_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '28000';
  END IF;
  IF _aantal_gemaakt IS NULL OR _aantal_gemaakt <= 0 THEN
    RAISE EXCEPTION 'Aantal moet groter dan 0 zijn';
  END IF;

  SELECT * INTO v_taak FROM public.mep_taken WHERE id = _taak_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEP-taak niet gevonden'; END IF;
  IF v_taak.status = 'afgerond' THEN RAISE EXCEPTION 'Deze taak is al afgerond'; END IF;

  IF v_taak.methode_id IS NOT NULL THEN
    SELECT * INTO v_methode FROM public.halffabricaat_methodes WHERE id = v_taak.methode_id;
    v_heeft_methode := FOUND;
  END IF;

  v_batch_nummer := public.mep_genereer_batchnummer(v_taak.vestiging);

  IF v_heeft_methode THEN
    v_hoeveelheid := v_methode.output_hoeveelheid * _aantal_gemaakt;
    v_eenheid := v_methode.output_eenheid;
    IF v_methode.houdbaarheid IS NOT NULL THEN
      v_houdbaar_tot := CURRENT_DATE + v_methode.houdbaarheid;
    END IF;
  ELSE
    v_hoeveelheid := _aantal_gemaakt;
    v_eenheid := COALESCE(v_taak.doel_eenheid, 'stuks');
  END IF;

  IF v_houdbaar_tot IS NULL AND v_taak.recept_id IS NOT NULL THEN
    SELECT CASE WHEN r.tht_dagen IS NOT NULL THEN CURRENT_DATE + r.tht_dagen END
      INTO v_houdbaar_tot FROM public.recipes r WHERE r.id = v_taak.recept_id;
  END IF;

  INSERT INTO public.productie_batches (
    vestiging, batch_nummer, recept_id, methode_id, omschrijving,
    hoeveelheid, eenheid, houdbaar_tot, geproduceerd_door, notitie
  ) VALUES (
    v_taak.vestiging, v_batch_nummer, v_taak.recept_id, v_taak.methode_id, v_taak.titel,
    v_hoeveelheid, v_eenheid, v_houdbaar_tot, v_user, _notitie
  ) RETURNING id INTO v_batch_id;

  INSERT INTO public.mep_taak_afrondingen (
    taak_id, afgerond_door, aantal_gemaakt, temperatuur, batch_id, notitie
  ) VALUES (
    _taak_id, v_user, _aantal_gemaakt, _temperatuur, v_batch_id, _notitie
  ) RETURNING id INTO v_afronding_id;

  UPDATE public.mep_taken
  SET status = 'afgerond', updated_at = now()
  WHERE id = _taak_id;

  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'batch_nummer', v_batch_nummer,
    'afronding_id', v_afronding_id,
    'hoeveelheid', v_hoeveelheid,
    'eenheid', v_eenheid,
    'houdbaar_tot', v_houdbaar_tot
  );
END $function$;