CREATE OR REPLACE FUNCTION public.trigger_sync_edge(_function text, _body jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_url text := 'https://ajtqzzzpawqcoaphdkaz.supabase.co/functions/v1/' || _function;
  v_req_id bigint;
BEGIN
  IF _function NOT IN ('lightspeed-sync','eitje-sync') THEN
    RAISE EXCEPTION 'unknown function %', _function;
  END IF;

  SELECT decrypted_secret INTO v_token
  FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  IF v_token IS NULL THEN RAISE EXCEPTION 'service_role token not found in vault'; END IF;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_token,
      'apikey', v_token
    ),
    body := _body,
    timeout_milliseconds := 300000
  ) INTO v_req_id;
  RETURN v_req_id;
END $$;