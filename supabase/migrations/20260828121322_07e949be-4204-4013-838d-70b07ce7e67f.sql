CREATE OR REPLACE FUNCTION public.is_service_call()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_user
  ) IN ('service_role','postgres','supabase_admin')
$$;

REVOKE ALL ON FUNCTION public.is_service_call() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_inkoop_beheerder() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.inkoop_orders_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inkoop_order_regels_guard() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rpc_extra_bestellen(text, text, text, uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_extra_bestellen(text, text, text, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_inkoop_beheerder() TO authenticated;
REVOKE ALL ON FUNCTION public.rpc_genereer_bestelvoorstel(text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_genereer_bestelvoorstel(text, date) TO authenticated;