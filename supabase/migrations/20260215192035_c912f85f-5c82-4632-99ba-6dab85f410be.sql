
-- 2. Add columns to user_roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS hired_date date,
  ADD COLUMN IF NOT EXISTS contract_type text;

-- Add check constraint for contract_type
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_contract_type_check
  CHECK (contract_type IS NULL OR contract_type IN ('fulltime', 'parttime', 'seizoen', 'oproep'));

-- 3. Drop existing SELECT policy and replace with new ones
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers and owners can view roles in same location"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.is_active = true
        AND ur.role IN ('manager'::app_role, 'owner'::app_role, 'admin'::app_role)
        AND ur.location = public.user_roles.location
    )
  );

CREATE POLICY "Owners can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Helper function get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = uid AND is_active = true LIMIT 1;
$$;
