-- Soft deactiveren van open bordregels voor de bestelbot.
-- Zet status op het bestaande 'vervallen'. Daardoor vallen de regels vanzelf
-- uit bestelbot_lees_open, bestelbot_lees_open_v2 en bestelbot_lees_besteld.
-- Die leesfuncties worden hier niet vervangen.
-- gedeactiveerd_op en deactivatie_reden zijn alleen extra, nullable kolommen.
-- Terugdraaien: supabase/rollbacks/bestelbot_deactiveer_rollback.sql

ALTER TABLE public.bestel_signalen
  ADD COLUMN IF NOT EXISTS gedeactiveerd_op timestamptz,
  ADD COLUMN IF NOT EXISTS deactivatie_reden text;

CREATE OR REPLACE FUNCTION public.bestelbot_deactiveer(p_vestiging text, p_ids uuid[], p_reden text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  s record;
  v_uit jsonb := '[]'::jsonb;
  v_reden text := left(nullif(trim(p_reden), ''), 500);
BEGIN
  IF NOT public.is_service_call() THEN
    RAISE EXCEPTION 'Alleen service role' USING ERRCODE = '42501';
  END IF;
  IF p_vestiging IS NULL OR p_vestiging NOT IN ('West', 'Midsland') THEN
    RAISE EXCEPTION 'Ongeldige vestiging' USING ERRCODE = '22023';
  END IF;
  IF p_ids IS NULL OR cardinality(p_ids) NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'Tussen 1 en 100 regels' USING ERRCODE = '22023';
  END IF;

  FOREACH v_id IN ARRAY p_ids LOOP
    SELECT * INTO s FROM public.bestel_signalen WHERE id = v_id FOR UPDATE;
    IF NOT FOUND OR s.vestiging IS DISTINCT FROM p_vestiging THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'niet gevonden voor deze vestiging');
    ELSIF s.status = 'vervallen' THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'ok', 'reden', 'al weg');
    ELSIF s.status <> 'open' THEN
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'overgeslagen', 'reden', 'status is ' || s.status);
    ELSE
      UPDATE public.bestel_signalen
      SET status = 'vervallen',
          gedeactiveerd_op = now(),
          deactivatie_reden = v_reden
      WHERE id = v_id;
      v_uit := v_uit || jsonb_build_object('id', v_id, 'status', 'ok');
    END IF;
  END LOOP;

  RETURN v_uit;
END;
$$;

REVOKE ALL ON FUNCTION public.bestelbot_deactiveer(text, uuid[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_deactiveer(text, uuid[], text) TO service_role;
