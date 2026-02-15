
-- 1. Schedules table
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  location text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_minutes integer DEFAULT 0,
  shift_type text CHECK (shift_type IN ('ochtend','middag','avond','dubbel')),
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','confirmed','swapped','sick')),
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Employees can view their own schedules
CREATE POLICY "Users can view own schedules"
  ON public.schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Managers can view schedules in their location
CREATE POLICY "Managers can view location schedules"
  ON public.schedules FOR SELECT TO authenticated
  USING (public.is_manager_same_location(user_id));

-- Managers/owners can create schedules
CREATE POLICY "Managers can create schedules"
  ON public.schedules FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Managers/owners can update schedules
CREATE POLICY "Managers can update schedules"
  ON public.schedules FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Managers/owners can delete schedules
CREATE POLICY "Managers can delete schedules"
  ON public.schedules FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- updated_at trigger
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

-- 2. Time registrations table
CREATE TABLE public.time_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  schedule_id uuid REFERENCES public.schedules(id),
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  break_taken_minutes integer DEFAULT 0,
  location text NOT NULL,
  approved_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','disputed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.time_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view own time registrations
CREATE POLICY "Users can view own time registrations"
  ON public.time_registrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Managers can view time registrations in their location
CREATE POLICY "Managers can view location time registrations"
  ON public.time_registrations FOR SELECT TO authenticated
  USING (public.is_manager_same_location(user_id));

-- Users can clock in/out (insert own registrations)
CREATE POLICY "Users can create own time registrations"
  ON public.time_registrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own pending registrations
CREATE POLICY "Users can update own time registrations"
  ON public.time_registrations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Managers can update (approve) time registrations
CREATE POLICY "Managers can update time registrations"
  ON public.time_registrations FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. Leave requests table
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('vakantie','ziek','bijzonder')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Users can view own leave requests
CREATE POLICY "Users can view own leave requests"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Managers can view leave requests in their location
CREATE POLICY "Managers can view location leave requests"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (public.is_manager_same_location(user_id));

-- Users can create own leave requests
CREATE POLICY "Users can create own leave requests"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Managers can update (approve/deny) leave requests
CREATE POLICY "Managers can update leave requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
