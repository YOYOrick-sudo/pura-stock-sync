
-- Nieuwe kolommen op ticket_comments voor app-user auteurs
ALTER TABLE public.ticket_comments
  ALTER COLUMN auteur_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS auteur_user_id uuid,
  ADD COLUMN IF NOT EXISTS auteur_naam text;

-- Backfill: kopieer namen uit maintenance_users naar de nieuwe naam-kolommen
-- zodat oude rijen leesbaar blijven zonder toegang tot maintenance_users.
UPDATE public.ticket_comments c
   SET auteur_naam = u.naam
  FROM public.maintenance_users u
 WHERE c.auteur_id = u.id
   AND c.auteur_naam IS NULL;

UPDATE public.maintenance_tickets t
   SET melder_naam = u.naam
  FROM public.maintenance_users u
 WHERE t.melder_id = u.id
   AND t.melder_naam IS NULL;
