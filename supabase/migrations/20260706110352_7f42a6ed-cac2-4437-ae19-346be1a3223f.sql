CREATE OR REPLACE FUNCTION public.sync_lease_acquire(_bron text, _holder text, _seconds int)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token uuid := gen_random_uuid();
  updated  int;
BEGIN
  UPDATE public.sync_leases
     SET lease_token = new_token,
         expires_at  = now() + make_interval(secs => _seconds),
         holder      = _holder,
         updated_at  = now()
   WHERE bron = _bron
     AND (lease_token IS NULL OR expires_at < now());
  GET DIAGNOSTICS updated = ROW_COUNT;
  IF updated = 0 THEN RETURN NULL; END IF;
  RETURN new_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_lease_release(_bron text, _token uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.sync_leases
     SET lease_token = NULL, expires_at = NULL, holder = NULL, updated_at = now()
   WHERE bron = _bron AND lease_token = _token;
$$;

GRANT EXECUTE ON FUNCTION public.sync_lease_acquire(text,text,int) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_lease_release(text,uuid) TO service_role, authenticated;
NOTIFY pgrst, 'reload schema';