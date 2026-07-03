
-- Onderhoud toegankelijk maken voor app-medewerkers
ALTER TABLE public.maintenance_tickets
  ALTER COLUMN melder_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS melder_user_id uuid,
  ADD COLUMN IF NOT EXISTS melder_naam text,
  ADD COLUMN IF NOT EXISTS plek text,
  ADD COLUMN IF NOT EXISTS foto_url text;

-- Storage RLS voor de foto-bucket (bucket wordt via de storage tool aangemaakt)
CREATE POLICY "Ingelogde users kunnen onderhoud-fotos uploaden"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-photos');

CREATE POLICY "Ingelogde users kunnen onderhoud-fotos lezen"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Uploaders kunnen eigen onderhoud-fotos verwijderen"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'maintenance-photos' AND owner = auth.uid());
