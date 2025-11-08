-- ============================================
-- SECURITY HELPER FUNCTION
-- ============================================
-- Haalt automatisch de location van de huidige user op
CREATE OR REPLACE FUNCTION public.current_user_location() 
RETURNS text
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT ur.location
  FROM user_roles ur
  WHERE ur.user_id = auth.uid()
  LIMIT 1
$$;

-- ============================================
-- FOH EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.foh_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Data kwaliteit: Unieke namen per locatie (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_foh_employees_loc_name
ON public.foh_employees (location, lower(name));

-- Performance index
CREATE INDEX IF NOT EXISTS idx_foh_employees_loc 
ON public.foh_employees(location);

-- Enable RLS
ALTER TABLE public.foh_employees ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FOH TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.foh_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  title text NOT NULL,
  due_date date NOT NULL,
  priority int NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  completed boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  assigned_employee_id uuid NULL,
  completed_at timestamptz NULL,
  completed_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Foreign Key Constraint
ALTER TABLE public.foh_tasks
  ADD CONSTRAINT fk_foh_tasks_employee
  FOREIGN KEY (assigned_employee_id) 
  REFERENCES public.foh_employees(id)
  ON DELETE SET NULL;

-- Performance: Partial indexes voor veelgebruikte queries
CREATE INDEX IF NOT EXISTS idx_foh_tasks_open
ON public.foh_tasks (due_date, priority)
WHERE completed = false AND archived = false;

CREATE INDEX IF NOT EXISTS idx_foh_tasks_done
ON public.foh_tasks (completed, archived, completed_at);

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_foh_tasks_loc 
ON public.foh_tasks(location);

CREATE INDEX IF NOT EXISTS idx_foh_tasks_assigned 
ON public.foh_tasks(assigned_employee_id);

-- Enable RLS
ALTER TABLE public.foh_tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LOCATION ENFORCEMENT TRIGGERS (Anti-Spoof)
-- ============================================

-- Trigger functie voor foh_tasks
CREATE OR REPLACE FUNCTION public.foh_enforce_location_tasks()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Forceer location op basis van user's role, negeer client input
  NEW.location := public.current_user_location();
  
  -- Valideer dat user een location heeft
  IF NEW.location IS NULL THEN
    RAISE EXCEPTION 'User has no location assigned';
  END IF;
  
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_foh_tasks_loc ON public.foh_tasks;
CREATE TRIGGER trg_foh_tasks_loc
BEFORE INSERT OR UPDATE ON public.foh_tasks
FOR EACH ROW EXECUTE FUNCTION public.foh_enforce_location_tasks();

-- Trigger functie voor foh_employees
CREATE OR REPLACE FUNCTION public.foh_enforce_location_employees()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Forceer location op basis van user's role, negeer client input
  NEW.location := public.current_user_location();
  
  -- Valideer dat user een location heeft
  IF NEW.location IS NULL THEN
    RAISE EXCEPTION 'User has no location assigned';
  END IF;
  
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_foh_employees_loc ON public.foh_employees;
CREATE TRIGGER trg_foh_employees_loc
BEFORE INSERT OR UPDATE ON public.foh_employees
FOR EACH ROW EXECUTE FUNCTION public.foh_enforce_location_employees();

-- ============================================
-- RLS POLICIES: FOH_EMPLOYEES
-- ============================================

-- SELECT: Users can view employees for their location
CREATE POLICY "Users can view employees for their location"
ON public.foh_employees
FOR SELECT
USING (location = public.current_user_location());

-- INSERT: Users can create employees (location auto-set by trigger)
CREATE POLICY "Users can create employees for their location"
ON public.foh_employees
FOR INSERT
WITH CHECK (location = public.current_user_location());

-- UPDATE: Users can update employees for their location
CREATE POLICY "Users can update employees for their location"
ON public.foh_employees
FOR UPDATE
USING (location = public.current_user_location());

-- DELETE: Users can delete employees for their location
CREATE POLICY "Users can delete employees for their location"
ON public.foh_employees
FOR DELETE
USING (location = public.current_user_location());

-- ============================================
-- RLS POLICIES: FOH_TASKS
-- ============================================

-- SELECT: Users can view tasks for their location
CREATE POLICY "Users can view FOH tasks for their location"
ON public.foh_tasks
FOR SELECT
USING (location = public.current_user_location());

-- INSERT: Users can create tasks (location auto-set by trigger)
CREATE POLICY "Users can create FOH tasks for their location"
ON public.foh_tasks
FOR INSERT
WITH CHECK (location = public.current_user_location());

-- UPDATE: Users can update tasks for their location
CREATE POLICY "Users can update FOH tasks for their location"
ON public.foh_tasks
FOR UPDATE
USING (location = public.current_user_location());

-- DELETE: Users can delete tasks for their location
CREATE POLICY "Users can delete FOH tasks for their location"
ON public.foh_tasks
FOR DELETE
USING (location = public.current_user_location());