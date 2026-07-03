
-- 1) Store waste-tasks shared token in vault (idempotent)
DO $$
DECLARE tok text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'waste_tasks_token') THEN
    tok := encode(gen_random_bytes(32), 'hex');
    PERFORM vault.create_secret(tok, 'waste_tasks_token');
  END IF;
END $$;

-- 2) Security-definer accessor so the edge function (service_role) can read the token
CREATE OR REPLACE FUNCTION public.get_waste_tasks_token()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'waste_tasks_token' LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_waste_tasks_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waste_tasks_token() TO service_role;

-- 3) Scope personeel_people_locations to management roles
DROP POLICY IF EXISTS "Authenticated users can manage" ON public.personeel_people_locations;
DROP POLICY IF EXISTS "Authenticated users can manage personeel_people_locations" ON public.personeel_people_locations;
DROP POLICY IF EXISTS "personeel_people_locations_all" ON public.personeel_people_locations;

CREATE POLICY "Managers can read personeel_people_locations"
  ON public.personeel_people_locations
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Managers can write personeel_people_locations"
  ON public.personeel_people_locations
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR public.has_role(auth.uid(), 'owner'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 4) Rewire the two cron jobs to send the vault token in a custom header
SELECT cron.unschedule('generate-waste-tasks-0500');
SELECT cron.unschedule('escalate-waste-tasks-2330');

SELECT cron.schedule(
  'generate-waste-tasks-0500',
  '0 4 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://ajtqzzzpawqcoaphdkaz.supabase.co/functions/v1/generate-waste-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHF6enpwYXdxY29hcGhka2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjkzNTMsImV4cCI6MjA3NzI0NTM1M30.TfStK5lWTg08WutCGJ3L6y42eEcxnnKyGBOR1Wz66xg',
      'x-waste-tasks-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'waste_tasks_token' LIMIT 1)
    ),
    body := '{"mode":"generate"}'::jsonb
  );
  $cmd$
);

SELECT cron.schedule(
  'escalate-waste-tasks-2330',
  '30 22 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://ajtqzzzpawqcoaphdkaz.supabase.co/functions/v1/generate-waste-tasks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdHF6enpwYXdxY29hcGhka2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjkzNTMsImV4cCI6MjA3NzI0NTM1M30.TfStK5lWTg08WutCGJ3L6y42eEcxnnKyGBOR1Wz66xg',
      'x-waste-tasks-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'waste_tasks_token' LIMIT 1)
    ),
    body := '{"mode":"escalate"}'::jsonb
  );
  $cmd$
);
