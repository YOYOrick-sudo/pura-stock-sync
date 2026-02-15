
-- 1. Drop problematische policies
DROP POLICY IF EXISTS "Managers and owners can view roles in same location" ON user_roles;
DROP POLICY IF EXISTS "Owners can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Owners can update roles" ON user_roles;

-- 2. Recreate has_role as SECURITY DEFINER (already is, but ensure is_active check)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND is_active = true
  )
$$;

-- 3. Admin/manager SELECT policy (no recursion - uses SECURITY DEFINER function)
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- 4. Recreate mutation policies
CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  USING (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'));
