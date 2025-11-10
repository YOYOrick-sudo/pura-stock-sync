-- Create foh_daily_templates table
CREATE TABLE public.foh_daily_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('open', 'tussen', 'sluit')),
  title text NOT NULL,
  priority int NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on foh_daily_templates
ALTER TABLE public.foh_daily_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for foh_daily_templates
CREATE POLICY "Users can view daily templates for their location"
  ON public.foh_daily_templates FOR SELECT
  USING (location = current_user_location());

CREATE POLICY "Users can create daily templates for their location"
  ON public.foh_daily_templates FOR INSERT
  WITH CHECK (location = current_user_location());

CREATE POLICY "Users can update daily templates for their location"
  ON public.foh_daily_templates FOR UPDATE
  USING (location = current_user_location());

CREATE POLICY "Users can delete daily templates for their location"
  ON public.foh_daily_templates FOR DELETE
  USING (location = current_user_location());

-- Location enforcement trigger for foh_daily_templates
CREATE TRIGGER foh_enforce_location_templates
  BEFORE INSERT OR UPDATE ON public.foh_daily_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.foh_enforce_location_employees();

-- Index for performance
CREATE INDEX idx_daily_templates_location_phase ON public.foh_daily_templates(location, phase);

-- Extend foh_tasks table with template_id and phase
ALTER TABLE public.foh_tasks
  ADD COLUMN template_id uuid REFERENCES public.foh_daily_templates(id) ON DELETE SET NULL,
  ADD COLUMN phase text CHECK (phase IS NULL OR phase IN ('open', 'tussen', 'sluit'));

-- Index for filtering daily tasks
CREATE INDEX idx_foh_tasks_template_phase ON public.foh_tasks(template_id, phase, due_date);