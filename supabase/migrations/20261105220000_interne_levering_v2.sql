-- Interne levering v2: Midsland levert aan West.
-- Additief op de bestaande v1. Geen kolommen weg, geen hernoemen, geen gewijzigde
-- functiesignatuur. foh_tasks, horeko_artikelen en bestel_signalen blijven onaangeroerd.
-- De vlag interne_levering_v2 staat uit voor West en Midsland en aan voor Test.
-- Dit bestand wordt niet vanuit de PR op Supabase uitgevoerd.

-- Bestaande v1-producten blijven actief. Nieuwe beschikbaarheid voor v2 zet deze
-- kolom, met actief = false, zodat interne_producten_lijst ze niet gaat tonen.
ALTER TABLE public.interne_producten
  ADD COLUMN IF NOT EXISTS v2_beschikbaar boolean DEFAULT false;

COMMENT ON COLUMN public.interne_producten.v2_beschikbaar IS
  'Alleen de v2-route. Bestaande functies filteren hier niet op.';

CREATE TABLE IF NOT EXISTS public.interne_aanvraag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  van_vestiging text NOT NULL DEFAULT 'Midsland',
  naar_vestiging text NOT NULL DEFAULT 'West',
  proef boolean NOT NULL DEFAULT false,
  product_id uuid REFERENCES public.interne_producten (id) ON DELETE RESTRICT,
  artikel_id uuid REFERENCES public.artikelen (id) ON DELETE RESTRICT,
  vrije_naam text,
  besteld_aantal numeric(12, 3) NOT NULL,
  eenheid text NOT NULL,
  gewenste_leverdag date,
  verwachte_leverdag date,
  notitie text,
  aanvraag_sleutel text,
  status text NOT NULL DEFAULT 'besteld',
  mep_datum date,
  mep_taak_id uuid REFERENCES public.mep_taken (id) ON DELETE SET NULL,
  mep_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  mep_klaar_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  voorraad_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  klaar_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  klaar_op timestamptz,
  klaar_door uuid,
  meegegeven_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  meegegeven_op timestamptz,
  meegegeven_door uuid,
  ontvangen_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  ontvangen_op timestamptz,
  ontvangen_door uuid,
  ontvangst_opmerking text,
  ontvangst_regel_id uuid REFERENCES public.ontvangst_regel (id) ON DELETE SET NULL,
  geannuleerd_aantal numeric(12, 3) NOT NULL DEFAULT 0,
  geannuleerd_op timestamptz,
  geannuleerd_door uuid,
  besteld_door uuid,
  besteld_op timestamptz NOT NULL DEFAULT now(),
  bevestigd_op timestamptz,
  bevestigd_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interne_aanvraag_aantal_check CHECK (besteld_aantal > 0),
  CONSTRAINT interne_aanvraag_status_check CHECK (status IN (
    'artikel_controleren', 'besteld', 'bevestigd', 'klaar', 'meegegeven', 'ontvangen', 'geannuleerd'
  )),
  CONSTRAINT interne_aanvraag_naam_check CHECK (
    product_id IS NOT NULL OR length(btrim(COALESCE(vrije_naam, ''))) >= 2
  ),
  CONSTRAINT interne_aanvraag_route_check CHECK (
    van_vestiging = 'Midsland' AND naar_vestiging = 'West'
  )
);

COMMENT ON TABLE public.interne_aanvraag IS
  'Interne levering v2. Aantallen besteld, klaar, meegegeven en ontvangen blijven los. Geen prijzen.';

CREATE UNIQUE INDEX IF NOT EXISTS interne_aanvraag_sleutel_idx
  ON public.interne_aanvraag (aanvraag_sleutel)
  WHERE aanvraag_sleutel IS NOT NULL;

CREATE INDEX IF NOT EXISTS interne_aanvraag_open_idx
  ON public.interne_aanvraag (proef, status, besteld_op);

CREATE INDEX IF NOT EXISTS interne_aanvraag_taak_idx
  ON public.interne_aanvraag (mep_taak_id)
  WHERE mep_taak_id IS NOT NULL;

DROP TRIGGER IF EXISTS interne_aanvraag_updated_at ON public.interne_aanvraag;
CREATE TRIGGER interne_aanvraag_updated_at
  BEFORE UPDATE ON public.interne_aanvraag
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.interne_aanvraag ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interne_aanvraag_lezen ON public.interne_aanvraag;
CREATE POLICY interne_aanvraag_lezen ON public.interne_aanvraag
  FOR SELECT TO authenticated
  USING (
    (
      proef IS TRUE
      AND public.fase2_mag_vestiging(auth.uid(), 'Test')
    )
    OR (
      proef IS FALSE
      AND (
        public.fase2_mag_vestiging(auth.uid(), naar_vestiging)
        OR public.fase2_mag_vestiging(auth.uid(), van_vestiging)
      )
    )
  );

REVOKE ALL ON TABLE public.interne_aanvraag FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.interne_aanvraag TO authenticated;
GRANT ALL ON TABLE public.interne_aanvraag TO service_role;

INSERT INTO public.fase2_vlag (vestiging, vlag, aan, notitie)
SELECT v.vestiging, 'interne_levering_v2', v.aan, v.notitie
FROM (VALUES
  ('West', false, 'Interne levering v2, standaard uit'),
  ('Midsland', false, 'Interne levering v2, standaard uit'),
  ('Test', true, 'Interne levering v2, proef op Test')
) AS v(vestiging, aan, notitie)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fase2_vlag f
  WHERE f.vestiging = v.vestiging AND f.vlag = 'interne_levering_v2'
);

-- ---------------------------------------------------------------------------
-- Hulpen. Niet aan de browser geven: alleen de schrijffuncties hieronder.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.interne_v2_status_van(
  p_gekoppeld boolean,
  p_besteld numeric,
  p_klaar numeric,
  p_mee numeric,
  p_ontvangen numeric,
  p_geannuleerd numeric,
  p_bevestigd boolean
) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN NOT p_gekoppeld THEN 'artikel_controleren'
    WHEN p_ontvangen + p_geannuleerd >= p_besteld AND p_ontvangen <= 0 THEN 'geannuleerd'
    WHEN p_ontvangen + p_geannuleerd >= p_besteld THEN 'ontvangen'
    WHEN p_mee > p_ontvangen THEN 'meegegeven'
    WHEN p_klaar > p_mee THEN 'klaar'
    WHEN p_bevestigd THEN 'bevestigd'
    ELSE 'besteld'
  END;
$$;

CREATE OR REPLACE FUNCTION public.interne_v2_eis_rol(p_beheer boolean)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '28000';
  END IF;
  IF p_beheer THEN
    IF NOT (
      public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'team_lead')
    ) THEN
      RAISE EXCEPTION 'Alleen beheer mag dit' USING ERRCODE = '42501';
    END IF;
    RETURN;
  END IF;
  IF NOT (
    public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'team_lead')
    OR public.has_role(auth.uid(), 'kitchen_staff') OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'employee')
  ) THEN
    RAISE EXCEPTION 'Geen rol voor interne levering' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_eis_vestiging(p_vestiging text)
RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.interne_v2_eis_rol(false);
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

CREATE OR REPLACE FUNCTION public.interne_v2_zet_status(p_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_status text;
BEGIN
  SELECT * INTO r FROM public.interne_aanvraag WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aanvraag niet gevonden' USING ERRCODE = 'P0002';
  END IF;
  v_status := public.interne_v2_status_van(
    r.product_id IS NOT NULL,
    r.besteld_aantal,
    COALESCE(r.klaar_aantal, 0),
    COALESCE(r.meegegeven_aantal, 0),
    COALESCE(r.ontvangen_aantal, 0),
    COALESCE(r.geannuleerd_aantal, 0),
    r.bevestigd_op IS NOT NULL
  );
  UPDATE public.interne_aanvraag SET status = v_status, updated_at = now() WHERE id = p_id;
  RETURN v_status;
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_pak(p_vestiging text, p_id uuid)
RETURNS public.interne_aanvraag
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
BEGIN
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
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

CREATE OR REPLACE FUNCTION public.interne_v2_json(p_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', a.id,
    'naam', COALESCE(p.naam, a.vrije_naam),
    'vrije_naam', a.vrije_naam,
    'product_id', a.product_id,
    'eenheid', a.eenheid,
    'besteld_aantal', a.besteld_aantal,
    'gewenste_leverdag', a.gewenste_leverdag,
    'verwachte_leverdag', a.verwachte_leverdag,
    'mep_datum', a.mep_datum,
    'mep_taak_id', a.mep_taak_id,
    'mep_aantal', a.mep_aantal,
    'mep_klaar_aantal', a.mep_klaar_aantal,
    'voorraad_aantal', a.voorraad_aantal,
    'klaar_aantal', a.klaar_aantal,
    'meegegeven_aantal', a.meegegeven_aantal,
    'ontvangen_aantal', a.ontvangen_aantal,
    'geannuleerd_aantal', a.geannuleerd_aantal,
    'bevestigd', a.bevestigd_op IS NOT NULL,
    'notitie', a.notitie,
    'besteld_op', a.besteld_op,
    'status', a.status
  )
  FROM public.interne_aanvraag a
  LEFT JOIN public.interne_producten p ON p.id = a.product_id
  WHERE a.id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- Stap 1. Bestellen en artikelen intern beschikbaar maken.
-- ---------------------------------------------------------------------------

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
            AND a.proef IS (p_vestiging = 'Test')
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

CREATE OR REPLACE FUNCTION public.interne_v2_artikelen_zoeken(p_vestiging text, p_zoek text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_zoek text := btrim(COALESCE(p_zoek, ''));
BEGIN
  PERFORM public.interne_v2_eis_rol(true);
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  IF char_length(v_zoek) < 2 THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', s.id, 'naam', s.naam) ORDER BY s.naam)
    FROM (
      SELECT a.id, a.naam
      FROM public.artikelen a
      WHERE a.deleted_at IS NULL
        AND a.naam ILIKE '%' || v_zoek || '%'
      ORDER BY a.naam
      LIMIT 20
    ) s
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

CREATE OR REPLACE FUNCTION public.interne_v2_product_opslaan(
  p_vestiging text,
  p_artikel_id uuid,
  p_eenheid text,
  p_inhoud_per_eenheid numeric,
  p_inhoud_eenheid text,
  p_max numeric,
  p_beschikbaar boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_naam text;
  v_recept uuid;
  v_bestaand public.interne_producten;
  v_eenheid text := btrim(COALESCE(p_eenheid, ''));
  v_inhoud_eenheid text := NULLIF(btrim(COALESCE(p_inhoud_eenheid, '')), '');
  v_id uuid;
BEGIN
  PERFORM public.interne_v2_eis_rol(true);
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  IF p_artikel_id IS NULL THEN
    RAISE EXCEPTION 'Kies een bestaand artikel' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_eenheid) < 1 OR char_length(v_eenheid) > 20 THEN
    RAISE EXCEPTION 'Vul een eenheid in' USING ERRCODE = '22023';
  END IF;
  IF p_inhoud_per_eenheid IS NOT NULL AND p_inhoud_per_eenheid <= 0 THEN
    RAISE EXCEPTION 'Verpakkingsinhoud moet groter dan 0 zijn' USING ERRCODE = '22023';
  END IF;
  IF p_inhoud_per_eenheid IS NOT NULL AND v_inhoud_eenheid IS NULL THEN
    RAISE EXCEPTION 'Vul de eenheid van de verpakking in' USING ERRCODE = '22023';
  END IF;
  IF p_max IS NOT NULL AND p_max < 1 THEN
    RAISE EXCEPTION 'Het maximum is minstens 1' USING ERRCODE = '22023';
  END IF;

  SELECT a.naam, a.recept_id INTO v_naam, v_recept
  FROM public.artikelen a
  WHERE a.id = p_artikel_id AND a.deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dit artikel staat niet in de stam' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_bestaand
  FROM public.interne_producten
  WHERE artikel_id = p_artikel_id
    AND van_vestiging = 'Midsland'
    AND naar_vestiging = 'West'
    AND deleted_at IS NULL
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE;

  IF FOUND AND v_bestaand.actief IS TRUE THEN
    RETURN jsonb_build_object(
      'product_id', v_bestaand.id,
      'ongewijzigd', true,
      'reden', 'Dit artikel hoort al bij de huidige route'
    );
  END IF;

  IF FOUND THEN
    UPDATE public.interne_producten SET
      eenheid = v_eenheid,
      inhoud_per_eenheid = p_inhoud_per_eenheid,
      inhoud_eenheid = v_inhoud_eenheid,
      max_per_bestelling = p_max,
      v2_beschikbaar = COALESCE(p_beschikbaar, true),
      actief = false,
      recept_id = COALESCE(recept_id, v_recept),
      gewijzigd_door = auth.uid(),
      updated_at = now()
    WHERE id = v_bestaand.id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.interne_producten (
      naam, van_vestiging, naar_vestiging, artikel_id, recept_id,
      eenheid, inhoud_per_eenheid, inhoud_eenheid, max_per_bestelling,
      actief, v2_beschikbaar, gewijzigd_door
    ) VALUES (
      v_naam, 'Midsland', 'West', p_artikel_id, v_recept,
      v_eenheid, p_inhoud_per_eenheid, v_inhoud_eenheid, p_max,
      false, COALESCE(p_beschikbaar, true), auth.uid()
    ) RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object('product_id', v_id, 'ongewijzigd', false);
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_plaatsen(
  p_vestiging text,
  p_product_id uuid,
  p_vrije_naam text,
  p_aantal numeric,
  p_eenheid text,
  p_gewenste_leverdag date,
  p_notitie text,
  p_aanvraag_sleutel text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product public.interne_producten;
  v_id uuid;
  v_status text;
  v_proef boolean;
  v_naam text;
  v_eenheid text;
  v_artikel uuid;
  v_vandaag date := (timezone('Europe/Amsterdam', now()))::date;
  v_notitie text := NULLIF(btrim(COALESCE(p_notitie, '')), '');
  v_vrij text := NULLIF(btrim(COALESCE(p_vrije_naam, '')), '');
BEGIN
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  IF p_vestiging NOT IN ('West', 'Test') THEN
    RAISE EXCEPTION 'Bestellen doe je in West' USING ERRCODE = '42501';
  END IF;
  IF p_aantal IS NULL OR p_aantal <= 0 OR p_aantal > 100000 THEN
    RAISE EXCEPTION 'Vul een aantal groter dan 0 in' USING ERRCODE = '22023';
  END IF;
  IF p_gewenste_leverdag IS NOT NULL AND (p_gewenste_leverdag < v_vandaag OR p_gewenste_leverdag > v_vandaag + 60) THEN
    RAISE EXCEPTION 'Kies een gewenste dag in de komende twee maanden' USING ERRCODE = '22023';
  END IF;
  IF v_notitie IS NOT NULL AND char_length(v_notitie) > 500 THEN
    RAISE EXCEPTION 'De notitie is te lang' USING ERRCODE = '22023';
  END IF;

  v_proef := p_vestiging = 'Test';
  p_aanvraag_sleutel := NULLIF(btrim(COALESCE(p_aanvraag_sleutel, '')), '');

  IF p_aanvraag_sleutel IS NOT NULL THEN
    SELECT a.id INTO v_id
    FROM public.interne_aanvraag a
    WHERE a.aanvraag_sleutel = p_aanvraag_sleutel;
    IF FOUND THEN
      RETURN public.interne_v2_json(v_id) || jsonb_build_object('bestond_al', true);
    END IF;
  END IF;

  IF p_product_id IS NOT NULL THEN
    SELECT * INTO v_product
    FROM public.interne_producten
    WHERE id = p_product_id
      AND deleted_at IS NULL
      AND van_vestiging = 'Midsland'
      AND naar_vestiging = 'West'
      AND (actief IS TRUE OR v2_beschikbaar IS TRUE);
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Dit product is niet intern beschikbaar' USING ERRCODE = '22023';
    END IF;
    IF v_product.max_per_bestelling IS NOT NULL AND p_aantal > v_product.max_per_bestelling THEN
      RAISE EXCEPTION 'Hooguit % per keer', v_product.max_per_bestelling USING ERRCODE = '22023';
    END IF;
    v_naam := NULL;
    v_eenheid := v_product.eenheid;
    v_artikel := v_product.artikel_id;
    v_status := 'besteld';
  ELSE
    IF v_vrij IS NULL OR char_length(v_vrij) < 2 OR char_length(v_vrij) > 80 THEN
      RAISE EXCEPTION 'Vul een naam in' USING ERRCODE = '22023';
    END IF;
    v_eenheid := btrim(COALESCE(p_eenheid, ''));
    IF char_length(v_eenheid) < 1 OR char_length(v_eenheid) > 20 THEN
      RAISE EXCEPTION 'Kies een eenheid' USING ERRCODE = '22023';
    END IF;
    v_naam := v_vrij;
    v_status := 'artikel_controleren';
  END IF;

  INSERT INTO public.interne_aanvraag (
    van_vestiging, naar_vestiging, proef, product_id, artikel_id, vrije_naam,
    besteld_aantal, eenheid, gewenste_leverdag, notitie, aanvraag_sleutel,
    status, besteld_door
  ) VALUES (
    'Midsland', 'West', v_proef, p_product_id, v_artikel, v_naam,
    round(p_aantal, 3), v_eenheid, p_gewenste_leverdag, v_notitie, p_aanvraag_sleutel,
    v_status, auth.uid()
  ) RETURNING id INTO v_id;

  -- Bewust geen mep_datum: die kiest Midsland bij het inplannen. Geen verschuiving na 17:00.
  RETURN public.interne_v2_json(v_id) || jsonb_build_object('bestond_al', false, 'mep_datum', NULL);
EXCEPTION WHEN unique_violation THEN
  SELECT a.id INTO v_id FROM public.interne_aanvraag a WHERE a.aanvraag_sleutel = p_aanvraag_sleutel;
  RETURN public.interne_v2_json(v_id) || jsonb_build_object('bestond_al', true);
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_koppelen(
  p_vestiging text,
  p_aanvraag_id uuid,
  p_product_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_product public.interne_producten;
BEGIN
  IF p_vestiging NOT IN ('Midsland', 'Test') THEN
    RAISE EXCEPTION 'Koppelen doe je in Midsland' USING ERRCODE = '42501';
  END IF;
  r := public.interne_v2_pak(p_vestiging, p_aanvraag_id);
  IF r.product_id IS NOT NULL THEN
    RAISE EXCEPTION 'Dit artikel is al gekoppeld' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_product
  FROM public.interne_producten
  WHERE id = p_product_id
    AND deleted_at IS NULL
    AND van_vestiging = 'Midsland'
    AND naar_vestiging = 'West'
    AND (actief IS TRUE OR v2_beschikbaar IS TRUE);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kies een artikel dat intern beschikbaar is' USING ERRCODE = '22023';
  END IF;

  UPDATE public.interne_aanvraag SET
    product_id = v_product.id,
    artikel_id = v_product.artikel_id,
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id);
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_lezen(p_vestiging text, p_kant text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  IF p_kant NOT IN ('bord', 'mep') THEN
    RAISE EXCEPTION 'Onbekende lijst' USING ERRCODE = '22023';
  END IF;
  IF p_kant = 'bord' AND p_vestiging NOT IN ('West', 'Test') THEN
    RETURN '[]'::jsonb;
  END IF;
  IF p_kant = 'mep' AND p_vestiging NOT IN ('Midsland', 'Test') THEN
    RETURN '[]'::jsonb;
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(public.interne_v2_json(a.id) ORDER BY a.besteld_op, a.id)
    FROM public.interne_aanvraag a
    WHERE (
      (p_vestiging = 'Test' AND a.proef IS TRUE)
      OR (p_vestiging <> 'Test' AND a.proef IS FALSE)
    )
    AND (
      a.status NOT IN ('ontvangen', 'geannuleerd')
      OR a.besteld_op > now() - interval '14 days'
    )
  ), '[]'::jsonb);
END $$;

-- ---------------------------------------------------------------------------
-- Stap 2. Bevestigen: inplannen op de MEP of uit voorraad klaarzetten.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.interne_v2_inplannen(
  p_vestiging text,
  p_aanvraag_id uuid,
  p_mep_datum date,
  p_aantal numeric,
  p_verwachte_leverdag date
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_product public.interne_producten;
  v_ruimte numeric;
  v_taak uuid;
  v_taak_vestiging text;
  v_titel text;
  v_vandaag date := (timezone('Europe/Amsterdam', now()))::date;
BEGIN
  IF p_vestiging NOT IN ('Midsland', 'Test') THEN
    RAISE EXCEPTION 'Inplannen doe je op de MEP van Midsland' USING ERRCODE = '42501';
  END IF;
  r := public.interne_v2_pak(p_vestiging, p_aanvraag_id);
  IF r.product_id IS NULL THEN
    RAISE EXCEPTION 'Koppel eerst een bestaand artikel' USING ERRCODE = '22023';
  END IF;
  IF p_mep_datum IS NULL OR p_verwachte_leverdag IS NULL THEN
    RAISE EXCEPTION 'Kies een MEP-dag en de verwachte leverdag' USING ERRCODE = '22023';
  END IF;
  IF p_mep_datum < v_vandaag OR p_mep_datum > v_vandaag + 60
     OR p_verwachte_leverdag < v_vandaag OR p_verwachte_leverdag > v_vandaag + 60 THEN
    RAISE EXCEPTION 'Kies een dag in de komende twee maanden' USING ERRCODE = '22023';
  END IF;
  IF r.mep_datum IS NOT NULL AND r.mep_datum <> p_mep_datum THEN
    RAISE EXCEPTION 'Deze aanvraag staat al op een andere MEP-dag' USING ERRCODE = '22023';
  END IF;

  v_ruimte := round(GREATEST(0, r.besteld_aantal - r.geannuleerd_aantal - r.mep_aantal - r.voorraad_aantal), 3);
  IF p_aantal IS NULL OR p_aantal <= 0 OR p_aantal > v_ruimte THEN
    RAISE EXCEPTION 'Er is niets meer in te plannen' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_product FROM public.interne_producten WHERE id = r.product_id;
  v_taak_vestiging := CASE WHEN r.proef THEN 'Test' ELSE 'Midsland' END;
  v_titel := v_product.naam || ' voor West';

  PERFORM pg_advisory_xact_lock(hashtext('interne-v2:' || v_taak_vestiging || ':' || v_titel || ':' || p_mep_datum::text)::bigint);

  IF r.mep_taak_id IS NOT NULL THEN
    v_taak := r.mep_taak_id;
    UPDATE public.mep_taken
    SET doel_aantal = round(COALESCE(doel_aantal, 0) + p_aantal, 2), updated_at = now()
    WHERE id = v_taak AND status = 'open';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'De MEP-taak is al afgerond' USING ERRCODE = '22023';
    END IF;
  ELSE
    SELECT t.id INTO v_taak
    FROM public.mep_taken t
    WHERE t.vestiging = v_taak_vestiging
      AND t.taak_datum = p_mep_datum
      AND t.titel = v_titel
      AND t.status = 'open'
      AND t.handeling = 'Bereiden'
      AND t.doel_eenheid = r.eenheid
    ORDER BY t.created_at
    LIMIT 1
    FOR UPDATE;
    IF FOUND THEN
      UPDATE public.mep_taken
      SET doel_aantal = round(COALESCE(doel_aantal, 0) + p_aantal, 2), updated_at = now()
      WHERE id = v_taak;
    ELSE
      INSERT INTO public.mep_taken (
        vestiging, taak_datum, titel, categorie, handeling,
        doel_aantal, doel_eenheid, status, recept_id, created_by
      ) VALUES (
        v_taak_vestiging, p_mep_datum, v_titel, COALESCE(v_product.mep_categorie, 'Algemeen'), 'Bereiden',
        round(p_aantal, 2), r.eenheid, 'open', v_product.recept_id, auth.uid()
      ) RETURNING id INTO v_taak;
    END IF;
  END IF;

  UPDATE public.interne_aanvraag SET
    mep_datum = p_mep_datum,
    mep_taak_id = v_taak,
    mep_aantal = round(mep_aantal + p_aantal, 3),
    verwachte_leverdag = p_verwachte_leverdag,
    bevestigd_op = COALESCE(bevestigd_op, now()),
    bevestigd_door = COALESCE(bevestigd_door, auth.uid()),
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id) || jsonb_build_object('mep_taak_id', v_taak);
END $$;

CREATE OR REPLACE FUNCTION public.interne_v2_klaarzetten(
  p_vestiging text,
  p_aanvraag_id uuid,
  p_aantal numeric,
  p_verwachte_leverdag date,
  p_meegeven boolean
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_ruimte numeric;
  v_vandaag date := (timezone('Europe/Amsterdam', now()))::date;
BEGIN
  IF p_vestiging NOT IN ('Midsland', 'Test') THEN
    RAISE EXCEPTION 'Klaarzetten doe je in Midsland' USING ERRCODE = '42501';
  END IF;
  r := public.interne_v2_pak(p_vestiging, p_aanvraag_id);
  IF r.product_id IS NULL THEN
    RAISE EXCEPTION 'Koppel eerst een bestaand artikel' USING ERRCODE = '22023';
  END IF;
  IF p_verwachte_leverdag IS NULL OR p_verwachte_leverdag < v_vandaag OR p_verwachte_leverdag > v_vandaag + 60 THEN
    RAISE EXCEPTION 'Kies de verwachte leverdag' USING ERRCODE = '22023';
  END IF;
  v_ruimte := round(GREATEST(0, r.besteld_aantal - r.geannuleerd_aantal - r.mep_aantal - r.voorraad_aantal), 3);
  IF p_aantal IS NULL OR p_aantal <= 0 OR p_aantal > v_ruimte THEN
    RAISE EXCEPTION 'Er is niets meer uit voorraad klaar te zetten' USING ERRCODE = '22023';
  END IF;

  UPDATE public.interne_aanvraag SET
    voorraad_aantal = round(voorraad_aantal + p_aantal, 3),
    klaar_aantal = round(klaar_aantal + p_aantal, 3),
    klaar_op = now(),
    klaar_door = auth.uid(),
    meegegeven_aantal = CASE WHEN COALESCE(p_meegeven, false)
      THEN round(meegegeven_aantal + p_aantal, 3) ELSE meegegeven_aantal END,
    meegegeven_op = CASE WHEN COALESCE(p_meegeven, false) THEN now() ELSE meegegeven_op END,
    meegegeven_door = CASE WHEN COALESCE(p_meegeven, false) THEN auth.uid() ELSE meegegeven_door END,
    verwachte_leverdag = p_verwachte_leverdag,
    bevestigd_op = COALESCE(bevestigd_op, now()),
    bevestigd_door = COALESCE(bevestigd_door, auth.uid()),
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id);
END $$;

-- ---------------------------------------------------------------------------
-- Stap 3. Klaar, meegegeven en ontvangen als aparte aantallen.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.interne_v2_meegegeven(
  p_vestiging text,
  p_aanvraag_id uuid,
  p_aantal numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_ruimte numeric;
BEGIN
  IF p_vestiging NOT IN ('Midsland', 'Test') THEN
    RAISE EXCEPTION 'Meegeven doe je in Midsland' USING ERRCODE = '42501';
  END IF;
  r := public.interne_v2_pak(p_vestiging, p_aanvraag_id);
  IF r.product_id IS NULL THEN
    RAISE EXCEPTION 'Koppel eerst een bestaand artikel' USING ERRCODE = '22023';
  END IF;
  v_ruimte := round(GREATEST(0, r.klaar_aantal - r.meegegeven_aantal), 3);
  IF v_ruimte <= 0 OR p_aantal IS NULL OR p_aantal > v_ruimte THEN
    RAISE EXCEPTION 'Je kunt niet meer meegeven dan er klaarstaat' USING ERRCODE = '22023';
  END IF;
  IF p_aantal <= 0 THEN
    RAISE EXCEPTION 'Vul een aantal groter dan 0 in' USING ERRCODE = '22023';
  END IF;
  UPDATE public.interne_aanvraag SET
    meegegeven_aantal = round(meegegeven_aantal + p_aantal, 3),
    meegegeven_op = now(),
    meegegeven_door = auth.uid(),
    updated_at = now()
  WHERE id = r.id;
  PERFORM public.interne_v2_zet_status(r.id);
  RETURN public.interne_v2_json(r.id);
END $$;

-- Aangeroepen ná mep_taak_afronden. Wijzigt die functie niet en geeft niets mee.
CREATE OR REPLACE FUNCTION public.interne_v2_mep_klaar(
  p_vestiging text,
  p_taak_id uuid,
  p_aantal numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.interne_aanvraag;
  v_rest numeric;
  v_ruimte numeric;
  v_extra numeric;
  v_bijgewerkt int := 0;
BEGIN
  IF p_vestiging NOT IN ('Midsland', 'Test') THEN
    RETURN jsonb_build_object('bijgewerkt', 0);
  END IF;
  PERFORM public.interne_v2_eis_vestiging(p_vestiging);
  IF p_aantal IS NULL OR p_aantal <= 0 THEN
    RAISE EXCEPTION 'Aantal moet groter dan 0 zijn' USING ERRCODE = '22023';
  END IF;
  v_rest := round(p_aantal, 3);
  FOR r IN
    SELECT * FROM public.interne_aanvraag
    WHERE mep_taak_id = p_taak_id
      AND proef IS (p_vestiging = 'Test')
      AND status <> 'geannuleerd'
    ORDER BY besteld_op, id
    FOR UPDATE
  LOOP
    EXIT WHEN v_rest <= 0;
    v_ruimte := round(GREATEST(0, r.mep_aantal - r.mep_klaar_aantal), 3);
    v_extra := round(LEAST(v_rest, v_ruimte), 3);
    IF v_extra > 0 THEN
      UPDATE public.interne_aanvraag SET
        mep_klaar_aantal = round(mep_klaar_aantal + v_extra, 3),
        klaar_aantal = round(klaar_aantal + v_extra, 3),
        klaar_op = now(),
        klaar_door = auth.uid(),
        updated_at = now()
      WHERE id = r.id;
      PERFORM public.interne_v2_zet_status(r.id);
      v_rest := round(v_rest - v_extra, 3);
      v_bijgewerkt := v_bijgewerkt + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('bijgewerkt', v_bijgewerkt, 'over', v_rest);
END $$;

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
      uitkomst, ontvangen_op, geregistreerd_door, opmerking, telt_voorraad
    ) VALUES (
      r.id, 'intern-v2:' || r.id::text || ':' || gen_random_uuid()::text,
      v_vestiging, 'intern', 'Midsland', v_lev,
      r.artikel_id, COALESCE(v_naam, 'Intern'), round(p_aantal, 3), r.besteld_aantal, r.eenheid,
      'binnen', timezone('Europe/Amsterdam', now()), auth.uid(), v_opmerking, false
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

REVOKE ALL ON FUNCTION public.interne_v2_status_van(boolean, numeric, numeric, numeric, numeric, numeric, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_eis_rol(boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_eis_vestiging(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_zet_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_pak(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.interne_v2_json(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.interne_v2_producten_lijst(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_artikelen_zoeken(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_producten_beheer(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_product_opslaan(text, uuid, text, numeric, text, numeric, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_plaatsen(text, uuid, text, numeric, text, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_koppelen(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_lezen(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_inplannen(text, uuid, date, numeric, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_klaarzetten(text, uuid, numeric, date, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_meegegeven(text, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_mep_klaar(text, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_ontvangen(text, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.interne_v2_annuleren(text, uuid, numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.interne_v2_producten_lijst(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_artikelen_zoeken(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_producten_beheer(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_product_opslaan(text, uuid, text, numeric, text, numeric, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_plaatsen(text, uuid, text, numeric, text, date, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_koppelen(text, uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_lezen(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_inplannen(text, uuid, date, numeric, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_klaarzetten(text, uuid, numeric, date, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_meegegeven(text, uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_mep_klaar(text, uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_ontvangen(text, uuid, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.interne_v2_annuleren(text, uuid, numeric) FROM PUBLIC, anon;
