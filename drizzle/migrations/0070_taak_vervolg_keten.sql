-- Vaste aanvulketen per taak: welke voorraadstappen aan staan, en de eindactie.
-- Alleen toevoegen en aanvullen. Niet uitvoeren vanuit de agent:
-- preview en productie delen één database.
-- Rollback: docs/research/0070_taak_vervolg_keten_rollback.sql
--
-- Raakt foh_tasks, horeko_artikelen en bestel_signalen niet.
-- Bestaande rijen blijven. vervolgactie en vervolg_als_op blijven staan
-- en worden bij een nieuwe opslag meegeschreven, zodat niets weg is.
-- "Komt uit Midsland" krijgt geen eigen kolom: dat is interne_producten.

ALTER TABLE public.taak_vervolg_config
  ADD COLUMN IF NOT EXISTS stap_koelcel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stap_vriezer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stap_magazijn boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eindactie text;

ALTER TABLE public.taak_vervolg_config
  DROP CONSTRAINT IF EXISTS taak_vervolg_config_eindactie_check;

ALTER TABLE public.taak_vervolg_config
  ADD CONSTRAINT taak_vervolg_config_eindactie_check
  CHECK (eindactie IS NULL OR eindactie IN ('mep', 'bestelbord', 'intern_midsland'));

COMMENT ON COLUMN public.taak_vervolg_config.stap_koelcel IS
  'Na "op" op de werkbank: aanvullen uit de koelcel.';
COMMENT ON COLUMN public.taak_vervolg_config.stap_vriezer IS
  'Daarna, als de koelcel ook op is: uit de vriezer naar de koelcel.';
COMMENT ON COLUMN public.taak_vervolg_config.stap_magazijn IS
  'Daarna: aanvullen uit het magazijn.';
COMMENT ON COLUMN public.taak_vervolg_config.eindactie IS
  'Als de laatste voorraadstap ook op is: mep, bestelbord of intern_midsland.';

-- Oude keuze wordt de nieuwe keten. Alleen rijen die nog geen eindactie hebben.
UPDATE public.taak_vervolg_config
   SET stap_koelcel = (vervolgactie = 'vriezer_naar_koelcel'),
       stap_vriezer = (vervolgactie = 'vriezer_naar_koelcel'),
       stap_magazijn = false,
       eindactie = CASE
         WHEN vervolgactie IN ('mep', 'bestelbord', 'intern_midsland') THEN vervolgactie
         WHEN vervolg_als_op IN ('mep', 'bestelbord', 'intern_midsland') THEN vervolg_als_op
         WHEN vervolgactie = 'vriezer_naar_koelcel' THEN 'bestelbord'
         ELSE NULL
       END
 WHERE eindactie IS NULL;

-- Tahinidressing heeft geen backup. Een bestaande rij blijft staan.
INSERT INTO public.taak_vervolg_config (
  taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op,
  stap_koelcel, stap_vriezer, stap_magazijn, eindactie
)
SELECT 'tahinidressing', NULL, NULL, 'mep', NULL, false, false, false, 'mep'
WHERE NOT EXISTS (
  SELECT 1 FROM public.taak_vervolg_config
  WHERE taak_sleutel = 'tahinidressing' AND vestiging IS NULL
);

DROP FUNCTION IF EXISTS public.taak_vervolg_config_opslaan(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.taak_vervolg_config_opslaan(
  p_taak_sleutel text,
  p_vestiging text,
  p_instructie text,
  p_stap_koelcel boolean,
  p_stap_vriezer boolean,
  p_stap_magazijn boolean,
  p_eindactie text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(coalesce(auth.email(), ''));
  v_sleutel text := lower(btrim(coalesce(p_taak_sleutel, '')));
  v_vestiging text := nullif(btrim(coalesce(p_vestiging, '')), '');
  v_instructie text := nullif(btrim(coalesce(p_instructie, '')), '');
  v_eind text := lower(btrim(coalesce(p_eindactie, '')));
  v_koel boolean := coalesce(p_stap_koelcel, false);
  v_vries boolean := coalesce(p_stap_vriezer, false);
  v_mag boolean := coalesce(p_stap_magazijn, false);
  v_oud text;
  v_als text;
  v_id uuid;
  v_toegang boolean;
  v_fase2 boolean;
BEGIN
  IF auth.uid() IS NULL OR v_email NOT LIKE 'yorick@%' THEN
    RAISE EXCEPTION 'Alleen de eigenaar kan dit instellen' USING ERRCODE = '42501';
  END IF;
  IF v_sleutel = '' THEN
    RAISE EXCEPTION 'Kies een taak' USING ERRCODE = '22023';
  END IF;
  IF v_eind NOT IN ('mep', 'bestelbord', 'intern_midsland') THEN
    RAISE EXCEPTION 'Onbekende eindactie' USING ERRCODE = '22023';
  END IF;

  IF v_vestiging IS NOT NULL THEN
    v_toegang := public.heeft_vestiging(auth.uid(), v_vestiging);
    IF to_regprocedure('public.fase2_mag_vestiging(uuid,text)') IS NOT NULL THEN
      EXECUTE 'SELECT public.fase2_mag_vestiging($1, $2)'
        INTO v_fase2
        USING auth.uid(), v_vestiging;
      v_toegang := coalesce(v_toegang, false) OR coalesce(v_fase2, false);
    END IF;
    IF NOT coalesce(v_toegang, false) THEN
      RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Oude kolommen blijven gevuld. De nieuwe kolommen zijn de keten.
  IF v_koel AND v_vries THEN
    v_oud := 'vriezer_naar_koelcel';
    v_als := CASE WHEN v_eind = 'bestelbord' THEN NULL ELSE v_eind END;
  ELSE
    v_oud := v_eind;
    v_als := NULL;
  END IF;

  UPDATE public.taak_vervolg_config
     SET instructie = v_instructie,
         vervolgactie = v_oud,
         vervolg_als_op = v_als,
         stap_koelcel = v_koel,
         stap_vriezer = v_vries,
         stap_magazijn = v_mag,
         eindactie = v_eind,
         bijgewerkt_door = auth.uid(),
         updated_at = now()
   WHERE taak_sleutel = v_sleutel
     AND vestiging IS NOT DISTINCT FROM v_vestiging
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    INSERT INTO public.taak_vervolg_config (
      taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op,
      stap_koelcel, stap_vriezer, stap_magazijn, eindactie, bijgewerkt_door
    ) VALUES (
      v_sleutel, v_vestiging, v_instructie, v_oud, v_als,
      v_koel, v_vries, v_mag, v_eind, auth.uid()
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'taak_sleutel', v_sleutel,
    'vestiging', v_vestiging,
    'stap_koelcel', v_koel,
    'stap_vriezer', v_vries,
    'stap_magazijn', v_mag,
    'eindactie', v_eind
  );
END;
$$;

REVOKE ALL ON FUNCTION public.taak_vervolg_config_opslaan(text, text, text, boolean, boolean, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.taak_vervolg_config_opslaan(text, text, text, boolean, boolean, boolean, text) TO authenticated;
