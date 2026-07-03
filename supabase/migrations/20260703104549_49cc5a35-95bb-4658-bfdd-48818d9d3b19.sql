
-- maintenance_tickets ------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read maintenance tickets"    ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.maintenance_tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON public.maintenance_tickets;

CREATE POLICY "Authenticated kan tickets lezen"
  ON public.maintenance_tickets FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Melder is de ingelogde user"
  ON public.maintenance_tickets FOR INSERT TO authenticated
  WITH CHECK (melder_user_id = auth.uid());

CREATE POLICY "Alleen owner/admin wijzigt tickets"
  ON public.maintenance_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- ticket_comments ----------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read ticket comments"   ON public.ticket_comments;
DROP POLICY IF EXISTS "Anyone can create ticket comments" ON public.ticket_comments;

CREATE POLICY "Authenticated kan comments lezen"
  ON public.ticket_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Auteur is de ingelogde user"
  ON public.ticket_comments FOR INSERT TO authenticated
  WITH CHECK (auteur_user_id = auth.uid());

-- maintenance_users --------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read active maintenance users" ON public.maintenance_users;

CREATE POLICY "Owner/admin kan maintenance_users lezen"
  ON public.maintenance_users FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- maintenance_settings -----------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read maintenance settings" ON public.maintenance_settings;

CREATE POLICY "Authenticated kan settings lezen"
  ON public.maintenance_settings FOR SELECT TO authenticated
  USING (true);
