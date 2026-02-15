
-- 1. Extend app_role enum with new values
-- Note: 'owner' was already added in a previous migration, IF NOT EXISTS handles that
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';
