CREATE OR REPLACE FUNCTION public.rpc_namen_voor_users(_ids uuid[])
RETURNS TABLE(user_id uuid, naam text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id AS user_id,
         coalesce(
           nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')), ''),
           u.email,
           'Onbekend'
         ) AS naam
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = ANY(_ids)
$$;

REVOKE EXECUTE ON FUNCTION public.rpc_namen_voor_users(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_namen_voor_users(uuid[]) TO authenticated;