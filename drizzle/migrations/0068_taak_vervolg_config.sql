-- Vervolg per taak op de sluitlijst. Alleen toevoegen.
-- Niet uitvoeren vanuit de agent: preview en productie delen één database.
-- Rollback: docs/research/0068_taak_vervolg_config_rollback.sql
--
-- Raakt foh_tasks, horeko_artikelen en bestel_signalen niet.
-- Lezen: ingelogde gebruiker van de vestiging (fase2_mag_vestiging, anders heeft_vestiging).
-- Een rij zonder vestiging geldt voor elke vestiging en is voor elke ingelogde gebruiker leesbaar.
-- Schrijven alleen via taak_vervolg_config_opslaan. Die eist auth.email() like 'yorick@%'.

CREATE TABLE IF NOT EXISTS public.taak_vervolg_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taak_sleutel text NOT NULL,
  vestiging text,
  instructie text,
  vervolgactie text NOT NULL DEFAULT 'geen',
  vervolg_als_op text,
  bijgewerkt_door uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT taak_vervolg_config_actie_check CHECK (
    vervolgactie IN ('geen', 'mep', 'bestelbord', 'vriezer_naar_koelcel', 'intern_midsland')
  ),
  CONSTRAINT taak_vervolg_config_als_op_check CHECK (
    vervolg_als_op IS NULL
    OR vervolg_als_op IN ('geen', 'mep', 'bestelbord', 'vriezer_naar_koelcel', 'intern_midsland')
  )
);

COMMENT ON TABLE public.taak_vervolg_config IS
  'Per taak wat er moet gebeuren en welke vervolgactie na het afvinken komt. vestiging leeg = alle vestigingen.';

COMMENT ON COLUMN public.taak_vervolg_config.taak_sleutel IS
  'Productsleutel of naam, klein geschreven.';

COMMENT ON COLUMN public.taak_vervolg_config.vervolg_als_op IS
  'Tweede vervolg als de eerste stap niet bij te vullen is, bijvoorbeeld een lege vriezer.';

CREATE UNIQUE INDEX IF NOT EXISTS taak_vervolg_config_sleutel_vestiging_idx
  ON public.taak_vervolg_config (taak_sleutel, COALESCE(vestiging, ''));

ALTER TABLE public.taak_vervolg_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.taak_vervolg_config FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.taak_vervolg_config TO authenticated;

DROP POLICY IF EXISTS taak_vervolg_config_lezen ON public.taak_vervolg_config;

DO $policy$
BEGIN
  IF to_regprocedure('public.fase2_mag_vestiging(uuid,text)') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE POLICY taak_vervolg_config_lezen ON public.taak_vervolg_config
        FOR SELECT TO authenticated
        USING (
          vestiging IS NULL
          OR public.fase2_mag_vestiging(auth.uid(), vestiging)
          OR public.heeft_vestiging(auth.uid(), vestiging)
        )
    $sql$;
  ELSE
    EXECUTE $sql$
      CREATE POLICY taak_vervolg_config_lezen ON public.taak_vervolg_config
        FOR SELECT TO authenticated
        USING (
          vestiging IS NULL
          OR public.heeft_vestiging(auth.uid(), vestiging)
        )
    $sql$;
  END IF;
END
$policy$;

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

-- Zaad: falafel houdt de stap uit PR #14. Een bestaande rij blijft staan.
INSERT INTO public.taak_vervolg_config (taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op)
SELECT 'falafel', NULL, NULL, 'vriezer_naar_koelcel', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.taak_vervolg_config
  WHERE taak_sleutel = 'falafel' AND vestiging IS NULL
);
