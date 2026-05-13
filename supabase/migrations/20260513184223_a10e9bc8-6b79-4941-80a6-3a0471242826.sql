CREATE TABLE public.terschelling_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  category TEXT,
  location TEXT,
  source_url TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, start_date)
);

CREATE INDEX idx_terschelling_events_start_date ON public.terschelling_events(start_date);

ALTER TABLE public.terschelling_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON public.terschelling_events FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage events"
  ON public.terschelling_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_terschelling_events_updated_at
  BEFORE UPDATE ON public.terschelling_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();