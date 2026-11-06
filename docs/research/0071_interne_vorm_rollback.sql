-- Rollback van drizzle/migrations/0071_interne_vorm.sql.
-- Niet automatisch draaien. Preview en productie delen één database.
-- Zet de lijsten en de twee ontvangstfuncties terug naar de stand van vóór 0071.
-- De twee artikel_vormen-rijen van deze migratie blijven staan. Er gaat geen rij uit een tabel.
-- Daarna valt alleen de koppelkolom weg. foh_tasks, horeko_artikelen en bestel_signalen blijven onaangeroerd.

CREATE OR REPLACE FUNCTION public.interne_producten_lijst(p_vestiging text)
 RETURNS TABLE(product_id uuid, naam text, van_vestiging text, eenheid text, inhoud_per_eenheid numeric, inhoud_eenheid text, max_per_bestelling numeric, open_aantal numeric, volgende_mep_datum date, volgorde integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL AND NOT public.is_service_call() THEN RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE='42501'; END IF;
  IF NOT public.fase2_mag_vestiging(auth.uid(), p_vestiging) THEN RAISE EXCEPTION 'Geen toegang tot vestiging %', p_vestiging USING ERRCODE='42501'; END IF;
  IF NOT public.fase2_vlag_aan(p_vestiging,'interne_levering') THEN RAISE EXCEPTION 'Interne levering staat uit voor %', p_vestiging USING ERRCODE='55000'; END IF;
  RETURN QUERY
  SELECT p.id, p.naam, p.van_vestiging, p.eenheid, p.inhoud_per_eenheid, p.inhoud_eenheid, p.max_per_bestelling,
         coalesce((SELECT sum(b.aantal) FROM public.interne_bestelling b WHERE b.product_id = p.id AND b.status IN ('besteld','geleverd')), 0),
         public.interne_levering_mep_datum(p.van_vestiging), p.volgorde
    FROM public.interne_producten p
   WHERE p.naar_vestiging = p_vestiging AND p.actief AND p.deleted_at IS NULL
     AND public.fase2_vlag_aan(p.van_vestiging,'interne_levering')
   ORDER BY p.volgorde, p.naam;
END $function$;

CREATE OR REPLACE FUNCTION public.interne_v2_producten_lijst(p_vestiging text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  IF p_vestiging NOT IN ('West', 'Midsland', 'Test') THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(rij.obj ORDER BY rij.volgorde, rij.naam)
    FROM (
      SELECT p.volgorde, p.naam, jsonb_build_object(
        'product_id', p.id,
        'artikel_id', p.artikel_id,
        'naam', p.naam,
        'eenheid', p.eenheid,
        'inhoud_per_eenheid', p.inhoud_per_eenheid,
        'inhoud_eenheid', p.inhoud_eenheid,
        'max_per_bestelling', p.max_per_bestelling,
        'volgorde', p.volgorde,
        'open_aantal', COALESCE((
          SELECT round(sum(GREATEST(0, a.besteld_aantal - a.ontvangen_aantal - a.geannuleerd_aantal)), 3)
          FROM public.interne_aanvraag a
          WHERE a.product_id = p.id
            AND a.proef IS NOT DISTINCT FROM (p_vestiging = 'Test')  -- FIX Programmeerbot 5-11: 'IS (expr)' is geen geldige SQL
            AND a.besteld_aantal > a.ontvangen_aantal + a.geannuleerd_aantal
        ), 0)
      ) AS obj
      FROM public.interne_producten p
      WHERE p.deleted_at IS NULL
        AND p.van_vestiging = 'Midsland'
        AND p.naar_vestiging = 'West'
        AND (p.actief IS TRUE OR p.v2_beschikbaar IS TRUE)
    ) rij
  ), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_producten_beheer(p_vestiging text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.interne_v2_eis_rol(true);
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'product_id', p.id,
      'artikel_id', p.artikel_id,
      'naam', p.naam,
      'eenheid', p.eenheid,
      'inhoud_per_eenheid', p.inhoud_per_eenheid,
      'inhoud_eenheid', p.inhoud_eenheid,
      'max_per_bestelling', p.max_per_bestelling,
      'v2_beschikbaar', COALESCE(p.v2_beschikbaar, false),
      'huidige_route', p.actief
    ) ORDER BY p.naam)
    FROM public.interne_producten p
    WHERE p.deleted_at IS NULL
      AND p.van_vestiging = 'Midsland'
      AND p.naar_vestiging = 'West'
      AND (p.actief IS TRUE OR p.v2_beschikbaar IS TRUE)
  ), '[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.interne_bestelling_ontvangen(p_bestelling_id uuid, p_aantal numeric DEFAULT NULL::numeric, p_opmerking text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE b public.interne_bestelling; p public.interne_producten; v_aantal numeric; v_lev uuid; v_regel uuid;
BEGIN
  SELECT * INTO b FROM public.interne_bestelling WHERE id = p_bestelling_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bestelling niet gevonden' USING ERRCODE='22023'; END IF;
  PERFORM public.interne_levering_check(b.van_vestiging, b.naar_vestiging, b.naar_vestiging);
  IF b.status = 'ontvangen' THEN RETURN jsonb_build_object('bestelling_id', b.id, 'status', b.status, 'ontvangen_aantal', b.ontvangen_aantal, 'ontvangst_regel_id', b.ontvangst_regel_id, 'al_gedaan', true); END IF;
  IF b.status NOT IN ('besteld','geleverd') THEN RAISE EXCEPTION 'Bestelling is %', b.status USING ERRCODE='22023'; END IF;
  SELECT * INTO p FROM public.interne_producten WHERE id = b.product_id;
  v_aantal := coalesce(p_aantal, b.geleverd_aantal, b.aantal);
  IF v_aantal < 0 THEN RAISE EXCEPTION 'Aantal kan niet negatief zijn' USING ERRCODE='22023'; END IF;
  SELECT l.id INTO v_lev FROM public.leveranciers l WHERE l.soort = 'intern' AND l.naam = b.van_vestiging || ' (intern)' AND l.deleted_at IS NULL LIMIT 1;
  IF v_aantal > 0 THEN
    INSERT INTO public.ontvangst_regel (sleutel, vestiging, bron_vestiging, levering_id, leverancier_id, bestel_signaal_id, artikel_id,
                                        omschrijving, besteld_aantal, aantal, eenheid, inhoud_per_verpakking, basis_eenheid, uitkomst,
                                        ontvangen_op, bron, opmerking, geregistreerd_door)
    VALUES ('intern:' || b.id, b.naar_vestiging, b.naar_vestiging, b.id, v_lev, b.bestel_signaal_id, p.artikel_id,
            p.naam, b.aantal, v_aantal, b.eenheid, p.inhoud_per_eenheid, p.inhoud_eenheid, 'binnen',
            (now() AT TIME ZONE 'Europe/Amsterdam')::date, 'eindcheck',
            'Interne levering van ' || b.van_vestiging || ' (klus 10)' || coalesce(': ' || nullif(trim(p_opmerking),''), ''), auth.uid())
    RETURNING id INTO v_regel;
  END IF;
  UPDATE public.interne_bestelling SET status = 'ontvangen', ontvangen_aantal = v_aantal, ontvangen_door = auth.uid(), ontvangen_op = now(),
         ontvangst_regel_id = v_regel, ontvangst_opmerking = nullif(trim(p_opmerking),'') WHERE id = b.id;
  RETURN jsonb_build_object('bestelling_id', b.id, 'status', 'ontvangen', 'ontvangen_aantal', v_aantal, 'besteld_aantal', b.aantal,
                            'ontvangst_regel_id', v_regel, 'al_gedaan', false);
END $function$;

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


DROP FUNCTION IF EXISTS public.interne_vorm_opslaan(uuid, text, numeric, text);

ALTER TABLE public.interne_producten
  DROP CONSTRAINT IF EXISTS interne_producten_artikel_vorm_id_fkey;

DROP INDEX IF EXISTS public.interne_producten_artikel_vorm_id_idx;

ALTER TABLE public.interne_producten
  DROP COLUMN IF EXISTS artikel_vorm_id;
