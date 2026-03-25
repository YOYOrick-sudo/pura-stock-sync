
CREATE TABLE public.maintenance_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vestiging TEXT NOT NULL,
  titel TEXT NOT NULL,
  toelichting TEXT,
  prioriteit TEXT NOT NULL DEFAULT 'midden',
  status TEXT NOT NULL DEFAULT 'nieuw',
  melder_id UUID NOT NULL REFERENCES public.maintenance_users(id),
  aangemaakt_op TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bijgewerkt_op TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read maintenance tickets"
  ON public.maintenance_tickets FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create tickets"
  ON public.maintenance_tickets FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON public.maintenance_tickets FOR UPDATE TO public USING (true);

CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL REFERENCES public.maintenance_users(id),
  tekst TEXT NOT NULL,
  aangemaakt_op TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ticket comments"
  ON public.ticket_comments FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can create ticket comments"
  ON public.ticket_comments FOR INSERT TO public WITH CHECK (true);

CREATE TABLE public.maintenance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read maintenance settings"
  ON public.maintenance_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage maintenance settings"
  ON public.maintenance_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));
