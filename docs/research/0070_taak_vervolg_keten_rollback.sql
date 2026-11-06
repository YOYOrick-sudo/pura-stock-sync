-- Rollback van drizzle/migrations/0070_taak_vervolg_keten.sql.
-- Niet automatisch draaien. Preview en productie delen één database.
--
-- Haalt de ketenkolommen en de nieuwe opslagfunctie weg.
-- De tabel, de oude kolommen en de rijen blijven. foh_tasks,
-- horeko_artikelen en bestel_signalen blijven onaangeroerd.

DROP FUNCTION IF EXISTS public.taak_vervolg_config_opslaan(text, text, text, boolean, boolean, boolean, text);

CREATE OR REPLACE FUNCTION public.taak_vervolg_config_opslaan(
  p_taak_sleutel text,
  p_vestiging text,
  p_instructie text,
  p_vervolgactie text,
  p_vervolg_als_op text
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
  v_actie text := lower(btrim(coalesce(p_vervolgactie, 'geen')));
  v_als text := nullif(lower(btrim(coalesce(p_vervolg_als_op, ''))), '');
  v_id uuid;
  v_mag boolean;
  v_fase2 boolean;
BEGIN
  IF auth.uid() IS NULL OR v_email NOT LIKE 'yorick@%' THEN
    RAISE EXCEPTION 'Alleen de eigenaar kan dit instellen' USING ERRCODE = '42501';
  END IF;
  IF v_sleutel = '' THEN
    RAISE EXCEPTION 'Kies een taak' USING ERRCODE = '22023';
  END IF;
  IF v_actie NOT IN ('geen', 'mep', 'bestelbord', 'vriezer_naar_koelcel', 'intern_midsland') THEN
    RAISE EXCEPTION 'Onbekende vervolgactie' USING ERRCODE = '22023';
  END IF;
  IF v_als IS NOT NULL AND v_als NOT IN ('mep', 'bestelbord', 'vriezer_naar_koelcel', 'intern_midsland') THEN
    RAISE EXCEPTION 'Onbekende vervolgactie' USING ERRCODE = '22023';
  END IF;
  IF v_actie = 'geen' OR v_als = v_actie THEN
    v_als := NULL;
  END IF;

  IF v_vestiging IS NOT NULL THEN
    v_mag := public.heeft_vestiging(auth.uid(), v_vestiging);
    IF to_regprocedure('public.fase2_mag_vestiging(uuid,text)') IS NOT NULL THEN
      EXECUTE 'SELECT public.fase2_mag_vestiging($1, $2)'
        INTO v_fase2
        USING auth.uid(), v_vestiging;
      v_mag := coalesce(v_mag, false) OR coalesce(v_fase2, false);
    END IF;
    IF NOT coalesce(v_mag, false) THEN
      RAISE EXCEPTION 'Geen toegang tot deze vestiging' USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.taak_vervolg_config
     SET instructie = v_instructie,
         vervolgactie = v_actie,
         vervolg_als_op = v_als,
         bijgewerkt_door = auth.uid(),
         updated_at = now()
   WHERE taak_sleutel = v_sleutel
     AND vestiging IS NOT DISTINCT FROM v_vestiging
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    INSERT INTO public.taak_vervolg_config (
      taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op, bijgewerkt_door
    ) VALUES (
      v_sleutel, v_vestiging, v_instructie, v_actie, v_als, auth.uid()
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'taak_sleutel', v_sleutel,
    'vestiging', v_vestiging,
    'vervolgactie', v_actie,
    'vervolg_als_op', v_als
  );
END;
$$;

REVOKE ALL ON FUNCTION public.taak_vervolg_config_opslaan(text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.taak_vervolg_config_opslaan(text, text, text, text, text) TO authenticated;

ALTER TABLE public.taak_vervolg_config
  DROP CONSTRAINT IF EXISTS taak_vervolg_config_eindactie_check;

ALTER TABLE public.taak_vervolg_config
  DROP COLUMN IF EXISTS eindactie,
  DROP COLUMN IF EXISTS stap_magazijn,
  DROP COLUMN IF EXISTS stap_vriezer,
  DROP COLUMN IF EXISTS stap_koelcel;
