-- Interne verpakking hoort in de artikelstam. Lijsten lezen de vorm eerst.
-- Alleen toevoegen. Niet uitvoeren vanuit de agent:
-- preview en productie delen één database.
-- Rollback: docs/research/0071_interne_vorm_rollback.sql
--
-- Raakt foh_tasks, horeko_artikelen en bestel_signalen niet.
-- Geen verwijdering van bestaande rijen.
--
-- Vandaag binnen wordt in de app gesplitst. ontvangst_vandaag geeft de datum
-- al terug in verwachte_levering: bij een bordregel de verwachte levering,
-- bij een pakbon zonder bordregel de pakbon_datum. te_laat is die datum
-- vóór vandaag in Europe/Amsterdam. Daarom geen nieuwe kolom op die functie.

ALTER TABLE public.interne_producten
  ADD COLUMN IF NOT EXISTS artikel_vorm_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'interne_producten_artikel_vorm_id_fkey'
  ) THEN
    ALTER TABLE public.interne_producten
      ADD CONSTRAINT interne_producten_artikel_vorm_id_fkey
      FOREIGN KEY (artikel_vorm_id) REFERENCES public.artikel_vormen(id) ON DELETE SET NULL; -- alleen de koppeling leegmaken, geen product wissen
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS interne_producten_artikel_vorm_id_idx
  ON public.interne_producten (artikel_vorm_id)
  WHERE artikel_vorm_id IS NOT NULL;

COMMENT ON COLUMN public.interne_producten.artikel_vorm_id IS
  'Verpakking in de artikelstam. Lijsten lezen eenheid en inhoud daar. De kolommen op dit product blijven de reserve als er nog geen vorm is.';

-- Wortelspread (artikel Wortelwalnoot) en Granola huisgemaakt, vestiging West.
INSERT INTO public.artikel_vormen (
  id, artikel_id, vestiging, leverancier_id, vorm, eenheid, is_standaard,
  inhoud_basis, inhoud_eenheid, inhoud_bron
)
SELECT
  '00710000-0000-4000-8000-000000000001'::uuid,
  '7949ba5b-0f19-4047-9376-e8406347d75c'::uuid,
  'West', NULL, 'bak', 'bak', false,
  3200, 'g', 'Migratie 0071, interne levering West'
WHERE EXISTS (
  SELECT 1 FROM public.artikelen a
  WHERE a.id = '7949ba5b-0f19-4047-9376-e8406347d75c'::uuid
)
AND NOT EXISTS (
  SELECT 1 FROM public.artikel_vormen v
  WHERE v.artikel_id = '7949ba5b-0f19-4047-9376-e8406347d75c'::uuid
    AND v.vestiging = 'West'
    AND v.leverancier_id IS NULL
    AND v.vorm = 'bak'
    AND v.deleted_at IS NULL
);

INSERT INTO public.artikel_vormen (
  id, artikel_id, vestiging, leverancier_id, vorm, eenheid, is_standaard,
  inhoud_basis, inhoud_eenheid, inhoud_bron
)
SELECT
  '00710000-0000-4000-8000-000000000002'::uuid,
  'efc069dd-a960-4902-98c9-9471d43fcca5'::uuid,
  'West', NULL, 'emmer', 'emmer', false,
  NULL, NULL, 'Migratie 0071, interne levering West'
WHERE EXISTS (
  SELECT 1 FROM public.artikelen a
  WHERE a.id = 'efc069dd-a960-4902-98c9-9471d43fcca5'::uuid
)
AND NOT EXISTS (
  SELECT 1 FROM public.artikel_vormen v
  WHERE v.artikel_id = 'efc069dd-a960-4902-98c9-9471d43fcca5'::uuid
    AND v.vestiging = 'West'
    AND v.leverancier_id IS NULL
    AND v.vorm = 'emmer'
    AND v.deleted_at IS NULL
);

UPDATE public.interne_producten p
   SET artikel_vorm_id = (
     SELECT v.id
       FROM public.artikel_vormen v
      WHERE v.artikel_id = p.artikel_id
        AND v.vestiging = 'West'
        AND v.leverancier_id IS NULL
        AND v.vorm = 'bak'
        AND v.deleted_at IS NULL
      ORDER BY (v.id = '00710000-0000-4000-8000-000000000001'::uuid) DESC, v.created_at
      LIMIT 1
   )
 WHERE p.artikel_id = '7949ba5b-0f19-4047-9376-e8406347d75c'::uuid
   AND p.van_vestiging = 'Midsland'
   AND p.naar_vestiging = 'West'
   AND p.deleted_at IS NULL
   AND p.artikel_vorm_id IS NULL
   AND EXISTS (
     SELECT 1 FROM public.artikel_vormen v
      WHERE v.artikel_id = p.artikel_id
        AND v.vestiging = 'West'
        AND v.leverancier_id IS NULL
        AND v.vorm = 'bak'
        AND v.deleted_at IS NULL
   );

UPDATE public.interne_producten p
   SET artikel_vorm_id = (
     SELECT v.id
       FROM public.artikel_vormen v
      WHERE v.artikel_id = p.artikel_id
        AND v.vestiging = 'West'
        AND v.leverancier_id IS NULL
        AND v.vorm = 'emmer'
        AND v.deleted_at IS NULL
      ORDER BY (v.id = '00710000-0000-4000-8000-000000000002'::uuid) DESC, v.created_at
      LIMIT 1
   )
 WHERE p.artikel_id = 'efc069dd-a960-4902-98c9-9471d43fcca5'::uuid
   AND p.van_vestiging = 'Midsland'
   AND p.naar_vestiging = 'West'
   AND p.deleted_at IS NULL
   AND p.artikel_vorm_id IS NULL
   AND EXISTS (
     SELECT 1 FROM public.artikel_vormen v
      WHERE v.artikel_id = p.artikel_id
        AND v.vestiging = 'West'
        AND v.leverancier_id IS NULL
        AND v.vorm = 'emmer'
        AND v.deleted_at IS NULL
   );

-- Gekoppelde vorm wint, ook als de inhoud nog leeg is. Zonder vorm blijven de kolommen de reserve.
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
  SELECT p.id, p.naam, p.van_vestiging,
         COALESCE(v.eenheid, p.eenheid),
         CASE WHEN v.id IS NULL THEN p.inhoud_per_eenheid ELSE v.inhoud_basis END,
         CASE WHEN v.id IS NULL THEN p.inhoud_eenheid ELSE v.inhoud_eenheid END,
         p.max_per_bestelling,
         coalesce((SELECT sum(b.aantal) FROM public.interne_bestelling b WHERE b.product_id = p.id AND b.status IN ('besteld','geleverd')), 0),
         public.interne_levering_mep_datum(p.van_vestiging), p.volgorde
    FROM public.interne_producten p
    LEFT JOIN public.artikel_vormen v ON v.id = p.artikel_vorm_id AND v.deleted_at IS NULL
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
        'eenheid', COALESCE(v.eenheid, p.eenheid),
        'inhoud_per_eenheid', CASE WHEN v.id IS NULL THEN p.inhoud_per_eenheid ELSE v.inhoud_basis END,
        'inhoud_eenheid', CASE WHEN v.id IS NULL THEN p.inhoud_eenheid ELSE v.inhoud_eenheid END,
        'max_per_bestelling', p.max_per_bestelling,
        'volgorde', p.volgorde,
        'open_aantal', COALESCE((
          SELECT round(sum(GREATEST(0, a.besteld_aantal - a.ontvangen_aantal - a.geannuleerd_aantal)), 3)
          FROM public.interne_aanvraag a
          WHERE a.product_id = p.id
            AND a.proef IS NOT DISTINCT FROM (p_vestiging = 'Test')
            AND a.besteld_aantal > a.ontvangen_aantal + a.geannuleerd_aantal
        ), 0)
      ) AS obj
      FROM public.interne_producten p
      LEFT JOIN public.artikel_vormen v ON v.id = p.artikel_vorm_id AND v.deleted_at IS NULL
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
      'eenheid', COALESCE(v.eenheid, p.eenheid),
      'inhoud_per_eenheid', CASE WHEN v.id IS NULL THEN p.inhoud_per_eenheid ELSE v.inhoud_basis END,
      'inhoud_eenheid', CASE WHEN v.id IS NULL THEN p.inhoud_eenheid ELSE v.inhoud_eenheid END,
      'max_per_bestelling', p.max_per_bestelling,
      'v2_beschikbaar', COALESCE(p.v2_beschikbaar, false),
      'huidige_route', p.actief
    ) ORDER BY p.naam)
    FROM public.interne_producten p
    LEFT JOIN public.artikel_vormen v ON v.id = p.artikel_vorm_id AND v.deleted_at IS NULL
    WHERE p.deleted_at IS NULL
      AND p.van_vestiging = 'Midsland'
      AND p.naar_vestiging = 'West'
      AND (p.actief IS TRUE OR p.v2_beschikbaar IS TRUE)
  ), '[]'::jsonb);
END $$;

-- Eigenaar bewaart eenheid en inhoud op de gekoppelde artikelvorm.
-- Basis blijft g, ml of stuk. kg en L worden omgerekend.
CREATE OR REPLACE FUNCTION public.interne_vorm_opslaan(
  p_product_id uuid,
  p_eenheid text,
  p_inhoud numeric,
  p_inhoud_eenheid text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(coalesce(auth.email(), ''));
  v_product public.interne_producten;
  v_eenheid text := btrim(coalesce(p_eenheid, ''));
  v_invoer text := lower(btrim(coalesce(p_inhoud_eenheid, '')));
  v_basis numeric;
  v_basis_eenheid text;
  v_vestiging text;
  v_vorm uuid;
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR v_email NOT LIKE 'yorick@%' THEN
    RAISE EXCEPTION 'Alleen de eigenaar kan dit instellen' USING ERRCODE = '42501';
  END IF;
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'Kies een product' USING ERRCODE = '22023';
  END IF;
  IF v_eenheid NOT IN ('stuks', 'doos', 'zak', 'fles', 'pak', 'bak', 'emmer', 'kg', 'bos', 'tray', 'rol', 'fust') THEN
    RAISE EXCEPTION 'Kies een eenheid uit de artikelstam' USING ERRCODE = '22023';
  END IF;

  IF p_inhoud IS NULL OR btrim(coalesce(p_inhoud_eenheid, '')) = '' THEN
    IF p_inhoud IS NOT NULL OR btrim(coalesce(p_inhoud_eenheid, '')) <> '' THEN
      RAISE EXCEPTION 'Vul inhoud en inhoud-eenheid samen in, of laat beide leeg' USING ERRCODE = '22023';
    END IF;
    v_basis := NULL;
    v_basis_eenheid := NULL;
  ELSIF p_inhoud <= 0 THEN
    RAISE EXCEPTION 'Verpakkingsinhoud moet groter dan 0 zijn' USING ERRCODE = '22023';
  ELSIF v_invoer = 'g' THEN
    v_basis := round(p_inhoud, 3);
    v_basis_eenheid := 'g';
  ELSIF v_invoer = 'kg' THEN
    v_basis := round(p_inhoud * 1000, 3);
    v_basis_eenheid := 'g';
  ELSIF v_invoer = 'ml' THEN
    v_basis := round(p_inhoud, 3);
    v_basis_eenheid := 'ml';
  ELSIF v_invoer IN ('l', 'liter') THEN
    v_basis := round(p_inhoud * 1000, 3);
    v_basis_eenheid := 'ml';
  ELSIF v_invoer IN ('st', 'stuk', 'stuks') THEN
    v_basis := round(p_inhoud, 3);
    v_basis_eenheid := 'stuk';
  ELSE
    RAISE EXCEPTION 'Inhoud-eenheid is g, ml of stuk' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_product
  FROM public.interne_producten
  WHERE id = p_product_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product niet gevonden' USING ERRCODE = 'P0002';
  END IF;
  IF v_product.artikel_id IS NULL THEN
    RAISE EXCEPTION 'Dit product heeft geen artikel in de stam' USING ERRCODE = '22023';
  END IF;

  v_vestiging := CASE
    WHEN v_product.naar_vestiging IN ('West', 'Midsland') THEN v_product.naar_vestiging
    ELSE 'West'
  END;

  SELECT v.id INTO v_vorm
  FROM public.artikel_vormen v
  WHERE v.id = v_product.artikel_vorm_id AND v.deleted_at IS NULL;

  IF v_vorm IS NULL THEN
    INSERT INTO public.artikel_vormen (
      artikel_id, vestiging, leverancier_id, vorm, eenheid, is_standaard,
      inhoud_basis, inhoud_eenheid, inhoud_bron
    ) VALUES (
      v_product.artikel_id, v_vestiging, NULL, v_eenheid, v_eenheid, false,
      v_basis, v_basis_eenheid, 'Eigenaar, intern beschikbaar'
    )
    RETURNING id INTO v_id;

    UPDATE public.interne_producten
       SET artikel_vorm_id = v_id,
           updated_at = now()
     WHERE id = v_product.id;
  ELSE
    UPDATE public.artikel_vormen
       SET eenheid = v_eenheid,
           inhoud_basis = v_basis,
           inhoud_eenheid = v_basis_eenheid,
           updated_at = now()
     WHERE id = v_vorm
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object(
    'product_id', v_product.id,
    'artikel_vorm_id', v_id,
    'eenheid', v_eenheid,
    'inhoud_basis', v_basis,
    'inhoud_eenheid', v_basis_eenheid
  );
END;
$$;

REVOKE ALL ON FUNCTION public.interne_vorm_opslaan(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.interne_vorm_opslaan(uuid, text, numeric, text) TO authenticated;

-- Nieuwe ontvangst: inhoud per verpakking uit de vorm. Voorraad telt aantal × die inhoud.
CREATE OR REPLACE FUNCTION public.interne_bestelling_ontvangen(p_bestelling_id uuid, p_aantal numeric DEFAULT NULL::numeric, p_opmerking text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  b public.interne_bestelling;
  p public.interne_producten;
  v_aantal numeric;
  v_lev uuid;
  v_regel uuid;
  v_inhoud numeric;
  v_basis text;
BEGIN
  SELECT * INTO b FROM public.interne_bestelling WHERE id = p_bestelling_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bestelling niet gevonden' USING ERRCODE='22023'; END IF;
  PERFORM public.interne_levering_check(b.van_vestiging, b.naar_vestiging, b.naar_vestiging);
  IF b.status = 'ontvangen' THEN
    RETURN jsonb_build_object('bestelling_id', b.id, 'status', b.status, 'ontvangen_aantal', b.ontvangen_aantal, 'ontvangst_regel_id', b.ontvangst_regel_id, 'al_gedaan', true);
  END IF;
  IF b.status NOT IN ('besteld','geleverd') THEN RAISE EXCEPTION 'Bestelling is %', b.status USING ERRCODE='22023'; END IF;
  SELECT * INTO p FROM public.interne_producten WHERE id = b.product_id;
  v_inhoud := p.inhoud_per_eenheid;
  v_basis := p.inhoud_eenheid;
  IF p.artikel_vorm_id IS NOT NULL THEN
    SELECT v.inhoud_basis, v.inhoud_eenheid
      INTO v_inhoud, v_basis
      FROM public.artikel_vormen v
     WHERE v.id = p.artikel_vorm_id AND v.deleted_at IS NULL;
    IF NOT FOUND THEN
      v_inhoud := p.inhoud_per_eenheid;
      v_basis := p.inhoud_eenheid;
    END IF;
  END IF;
  v_aantal := coalesce(p_aantal, b.geleverd_aantal, b.aantal);
  IF v_aantal < 0 THEN RAISE EXCEPTION 'Aantal kan niet negatief zijn' USING ERRCODE='22023'; END IF;
  SELECT l.id INTO v_lev FROM public.leveranciers l WHERE l.soort = 'intern' AND l.naam = b.van_vestiging || ' (intern)' AND l.deleted_at IS NULL LIMIT 1;
  IF v_aantal > 0 THEN
    INSERT INTO public.ontvangst_regel (sleutel, vestiging, bron_vestiging, levering_id, leverancier_id, bestel_signaal_id, artikel_id,
                                        omschrijving, besteld_aantal, aantal, eenheid, inhoud_per_verpakking, basis_eenheid, uitkomst,
                                        ontvangen_op, bron, opmerking, geregistreerd_door)
    VALUES ('intern:' || b.id, b.naar_vestiging, b.naar_vestiging, b.id, v_lev, b.bestel_signaal_id, p.artikel_id,
            p.naam, b.aantal, v_aantal, b.eenheid, v_inhoud, v_basis, 'binnen',
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

  -- Inhoud per stuk verpakking komt uit de vorm. aantal × die inhoud is de voorraad.
  SELECT p.naam, p.artikel_id,
         CASE WHEN v.id IS NULL THEN p.inhoud_per_eenheid ELSE v.inhoud_basis END,
         CASE WHEN v.id IS NULL THEN p.inhoud_eenheid ELSE v.inhoud_eenheid END
  INTO v_naam, v_artikel, v_inhoud, v_basis
  FROM public.interne_producten p
  LEFT JOIN public.artikel_vormen v ON v.id = p.artikel_vorm_id AND v.deleted_at IS NULL
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
