
-- =============================================
-- HR SYSTEEM - STAP 2: TABELLEN EN POLICIES
-- =============================================

-- 1. Create application_status enum
CREATE TYPE application_status AS ENUM (
  'received',
  'screening',
  'interview_scheduled',
  'trial_scheduled',
  'offer_sent',
  'hired',
  'rejected',
  'reserve'
);

-- 2. Create candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  cv_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  season TEXT,
  position TEXT NOT NULL,
  target_location TEXT,
  source TEXT,
  status application_status NOT NULL DEFAULT 'received',
  priority INTEGER NOT NULL DEFAULT 2,
  owner_user_id UUID REFERENCES auth.users(id),
  next_action_type TEXT,
  next_action_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  housing_required BOOLEAN NOT NULL DEFAULT false,
  housing_arranged BOOLEAN NOT NULL DEFAULT false,
  onboarding_docs_sent BOOLEAN NOT NULL DEFAULT false,
  house_rules_sent BOOLEAN NOT NULL DEFAULT false,
  contract_signed BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Workflow constraint
ALTER TABLE public.applications ADD CONSTRAINT check_workflow_fields
CHECK (
  status IN ('hired', 'rejected', 'reserve') 
  OR (owner_user_id IS NOT NULL AND next_action_at IS NOT NULL)
);

-- 5. Create application_status_log table
CREATE TABLE public.application_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  action_type TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create accommodations table
CREATE TABLE public.accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  location TEXT,
  capacity INTEGER NOT NULL,
  description TEXT,
  amenities TEXT[],
  house_rules_template_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create document_templates table
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Add FK for house_rules_template_id
ALTER TABLE public.accommodations 
ADD CONSTRAINT fk_house_rules_template 
FOREIGN KEY (house_rules_template_id) 
REFERENCES public.document_templates(id) ON DELETE SET NULL;

-- 9. Create accommodation_assignments table
CREATE TABLE public.accommodation_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id UUID NOT NULL REFERENCES public.accommodations(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 10. Create sent_documents table
CREATE TABLE public.sent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.document_templates(id) ON DELETE RESTRICT,
  channel TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  document_url TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ
);

-- 11. Capacity check trigger
CREATE OR REPLACE FUNCTION public.check_accommodation_capacity()
RETURNS TRIGGER AS $$
DECLARE
  max_capacity INTEGER;
  overlapping_count INTEGER;
BEGIN
  SELECT capacity INTO max_capacity 
  FROM public.accommodations 
  WHERE id = NEW.accommodation_id;
  
  SELECT COUNT(*) INTO overlapping_count 
  FROM public.accommodation_assignments 
  WHERE accommodation_id = NEW.accommodation_id 
    AND status = 'active'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (end_date IS NULL AND (NEW.end_date IS NULL OR NEW.start_date <= NEW.end_date))
      OR
      (end_date IS NOT NULL AND NEW.start_date <= end_date 
       AND (NEW.end_date IS NULL OR NEW.end_date >= start_date))
    );
  
  IF overlapping_count >= max_capacity THEN
    RAISE EXCEPTION 'Accommodation is at full capacity for this period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER enforce_accommodation_capacity
BEFORE INSERT OR UPDATE ON public.accommodation_assignments
FOR EACH ROW EXECUTE FUNCTION public.check_accommodation_capacity();

-- 12. Occupancy view
CREATE VIEW public.accommodation_occupancy AS
SELECT 
  a.id,
  a.name,
  a.location,
  a.capacity,
  COUNT(aa.id) FILTER (WHERE aa.status = 'active' AND (aa.end_date IS NULL OR aa.end_date >= CURRENT_DATE)) as current_occupancy,
  a.capacity - COUNT(aa.id) FILTER (WHERE aa.status = 'active' AND (aa.end_date IS NULL OR aa.end_date >= CURRENT_DATE)) as available_spots
FROM public.accommodations a
LEFT JOIN public.accommodation_assignments aa ON a.id = aa.accommodation_id
GROUP BY a.id, a.name, a.location, a.capacity;

-- 13. Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_hr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

CREATE TRIGGER update_accommodations_updated_at
BEFORE UPDATE ON public.accommodations
FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

CREATE TRIGGER update_document_templates_updated_at
BEFORE UPDATE ON public.document_templates
FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

-- 14. Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_documents ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies for candidates
CREATE POLICY "HR users can view candidates"
ON public.candidates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create candidates"
ON public.candidates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can update candidates"
ON public.candidates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can delete candidates"
ON public.candidates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 16. RLS Policies for applications
CREATE POLICY "HR users can view applications"
ON public.applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create applications"
ON public.applications FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can update applications"
ON public.applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can delete applications"
ON public.applications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 17. RLS Policies for application_status_log
CREATE POLICY "HR users can view application logs"
ON public.application_status_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create application logs"
ON public.application_status_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 18. RLS Policies for accommodations
CREATE POLICY "HR users can view accommodations"
ON public.accommodations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create accommodations"
ON public.accommodations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can update accommodations"
ON public.accommodations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can delete accommodations"
ON public.accommodations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 19. RLS Policies for accommodation_assignments
CREATE POLICY "HR users can view assignments"
ON public.accommodation_assignments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create assignments"
ON public.accommodation_assignments FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can update assignments"
ON public.accommodation_assignments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can delete assignments"
ON public.accommodation_assignments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 20. RLS Policies for document_templates
CREATE POLICY "HR users can view templates"
ON public.document_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create templates"
ON public.document_templates FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can update templates"
ON public.document_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can delete templates"
ON public.document_templates FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 21. RLS Policies for sent_documents
CREATE POLICY "HR users can view sent documents"
ON public.sent_documents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can create sent documents"
ON public.sent_documents FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

CREATE POLICY "HR users can update sent documents"
ON public.sent_documents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));

-- 22. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 23. Storage policies
CREATE POLICY "HR users can view HR documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'hr-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')));

CREATE POLICY "HR users can upload HR documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'hr-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')));

CREATE POLICY "HR users can update HR documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'hr-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')));

CREATE POLICY "HR users can delete HR documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'hr-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr')));

-- 24. Indexes
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_owner ON public.applications(owner_user_id);
CREATE INDEX idx_applications_next_action ON public.applications(next_action_at);
CREATE INDEX idx_application_log_application ON public.application_status_log(application_id);
CREATE INDEX idx_assignments_accommodation ON public.accommodation_assignments(accommodation_id);
CREATE INDEX idx_assignments_candidate ON public.accommodation_assignments(candidate_id);
CREATE INDEX idx_sent_documents_application ON public.sent_documents(application_id);
