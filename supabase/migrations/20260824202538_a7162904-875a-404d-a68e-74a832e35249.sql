REVOKE ALL ON FUNCTION public.mep_bouw_dag(text, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mep_verplaats_dag(text, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mep_bouw_dag(text, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mep_verplaats_dag(text, date, date) TO authenticated, service_role;