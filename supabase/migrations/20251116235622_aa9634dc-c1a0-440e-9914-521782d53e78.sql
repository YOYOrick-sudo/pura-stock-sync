-- Create handover_memos table for management notes
CREATE TABLE public.handover_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  message text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handover_memos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view memos for their location
CREATE POLICY "Users can view memos for their location"
  ON public.handover_memos
  FOR SELECT
  USING (location = current_user_location());

-- Policy: Admins can manage all memos
CREATE POLICY "Admins can manage memos"
  ON public.handover_memos
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_handover_memos_location_date ON public.handover_memos(location, created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_handover_memos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_handover_memos_updated_at
  BEFORE UPDATE ON public.handover_memos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_handover_memos_updated_at();