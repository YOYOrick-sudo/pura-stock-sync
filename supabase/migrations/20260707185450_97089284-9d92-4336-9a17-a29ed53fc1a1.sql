CREATE OR REPLACE FUNCTION public.trigger_sync_edge(_function text, _body jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_url text := 'https://ajtqzzzpawqcoaphdkaz.supabase.co/functions/v1/' || _function;
  v_secret_name text;
  v_req_id bigint;
BEGIN
  IF _function = 'lightspeed-sync' THEN v_secret_name := 'LIGHTSPEED_SYNC_TOKEN';
  ELSIF _function = 'eitje-sync' THEN v_secret_name := 'EITJE_SYNC_TOKEN';
  ELSE RAISE EXCEPTION 'unknown function %', _function;
  END IF;

  SELECT decrypted_secret INTO v_token
  FROM vault.decrypted_secrets WHERE name = v_secret_name LIMIT 1;
  IF v_token IS NULL THEN RAISE EXCEPTION 'secret % not found in vault', v_secret_name; END IF;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-sync-token', v_token),
    body := _body,
    timeout_milliseconds := 300000
  ) INTO v_req_id;
  RETURN v_req_id;
END $$;

REVOKE ALL ON FUNCTION public.trigger_sync_edge(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sync_edge(text, jsonb) TO service_role;