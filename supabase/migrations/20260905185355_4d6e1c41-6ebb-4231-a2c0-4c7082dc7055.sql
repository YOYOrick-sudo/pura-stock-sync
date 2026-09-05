REVOKE EXECUTE ON FUNCTION public.claim_next_print_job() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.print_bridge_mark_printed(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_print_job() TO service_role;
GRANT EXECUTE ON FUNCTION public.print_bridge_mark_printed(text) TO service_role;