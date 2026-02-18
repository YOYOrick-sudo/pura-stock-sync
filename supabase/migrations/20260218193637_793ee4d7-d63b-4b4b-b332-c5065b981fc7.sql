
-- Fix 1: Make accommodation_occupancy view respect RLS on underlying tables
CREATE OR REPLACE VIEW public.accommodation_occupancy
WITH (security_invoker = true)
AS
SELECT a.id,
    a.name,
    a.location,
    a.capacity,
    count(aa.id) FILTER (WHERE ((aa.status = 'active'::text) AND ((aa.end_date IS NULL) OR (aa.end_date >= CURRENT_DATE)))) AS current_occupancy,
    (a.capacity - count(aa.id) FILTER (WHERE ((aa.status = 'active'::text) AND ((aa.end_date IS NULL) OR (aa.end_date >= CURRENT_DATE))))) AS available_spots
   FROM (accommodations a
     LEFT JOIN accommodation_assignments aa ON ((a.id = aa.accommodation_id)))
  GROUP BY a.id, a.name, a.location, a.capacity;

-- Fix 2: Restrict employee_documents policies from 'public' to 'authenticated' role
DROP POLICY IF EXISTS "Managers can delete documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Managers can insert documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Managers can update documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Managers can view location documents" ON public.employee_documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.employee_documents;

CREATE POLICY "Managers can delete documents" ON public.employee_documents
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can insert documents" ON public.employee_documents
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can update documents" ON public.employee_documents
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view location documents" ON public.employee_documents
FOR SELECT TO authenticated
USING (is_manager_same_location(user_id));

CREATE POLICY "Users can view own documents" ON public.employee_documents
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
