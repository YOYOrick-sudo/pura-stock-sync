
-- 1. Add 'staff' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

-- 2. Add mag_cijfers_zien column to profiles (future hook, unused in UI)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mag_cijfers_zien boolean NOT NULL DEFAULT false;

-- 3. Tighten user_roles SELECT policy: only owner/admin can see all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Owners can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4. Protect mag_cijfers_zien: only owners can set it (via a dedicated UPDATE policy on profiles)
-- The existing profile UPDATE policies remain for normal fields; we add a trigger-level guard.
CREATE OR REPLACE FUNCTION public.protect_mag_cijfers_zien()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.mag_cijfers_zien IS DISTINCT FROM OLD.mag_cijfers_zien THEN
    IF NOT (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
      RAISE EXCEPTION 'Alleen owners kunnen mag_cijfers_zien wijzigen';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_mag_cijfers_zien ON public.profiles;
CREATE TRIGGER profiles_protect_mag_cijfers_zien
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_mag_cijfers_zien();
