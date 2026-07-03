CREATE OR REPLACE FUNCTION public.claim_next_print_job()
RETURNS TABLE(id uuid, zpl text, label_omschrijving text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.print_jobs pj
     SET status = 'printing'
   WHERE pj.id = (
     SELECT j.id FROM public.print_jobs j
      WHERE j.status = 'pending'
      ORDER BY j.created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
   )
   RETURNING pj.id, pj.zpl, pj.label_omschrijving;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_print_job() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_next_print_job() FROM anon;
REVOKE ALL ON FUNCTION public.claim_next_print_job() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_print_job() TO service_role;