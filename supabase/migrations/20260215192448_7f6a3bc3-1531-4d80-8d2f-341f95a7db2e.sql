
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN ('contract','id','certificate','other')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  expires_at date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Medewerkers zien eigen documenten
CREATE POLICY "Users can view own documents"
  ON public.employee_documents FOR SELECT
  USING (auth.uid() = user_id);

-- Managers zien documenten van hun locatie
CREATE POLICY "Managers can view location documents"
  ON public.employee_documents FOR SELECT
  USING (is_manager_same_location(user_id));

-- Managers kunnen documenten uploaden
CREATE POLICY "Managers can insert documents"
  ON public.employee_documents FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Managers kunnen documenten bewerken
CREATE POLICY "Managers can update documents"
  ON public.employee_documents FOR UPDATE
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Managers kunnen documenten verwijderen
CREATE POLICY "Managers can delete documents"
  ON public.employee_documents FOR DELETE
  USING (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
