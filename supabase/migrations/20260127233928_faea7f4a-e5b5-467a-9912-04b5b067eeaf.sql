
-- =============================================
-- HR SYSTEEM - STAP 1: ENUM TOEVOEGINGEN
-- =============================================

-- Add 'hr' role to existing app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hr';
