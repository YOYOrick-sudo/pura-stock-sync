
CREATE TABLE public.idea_box_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_text TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.idea_box_submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert ideas (anonymous - no user_id stored)
CREATE POLICY "Authenticated users can submit ideas"
  ON public.idea_box_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Nobody can read ideas (privacy/anonymity)
-- Only direct database access can see submissions
