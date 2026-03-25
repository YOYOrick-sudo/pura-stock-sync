
CREATE TABLE public.maintenance_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'teamleider',
  vestiging TEXT NOT NULL DEFAULT 'west',
  pincode_hash TEXT NOT NULL,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active maintenance users"
  ON public.maintenance_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage maintenance users"
  ON public.maintenance_users
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
