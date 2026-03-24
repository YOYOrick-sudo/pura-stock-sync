-- ============================================
-- Pura Vida Onderhoudsmodule - Database Setup
-- ============================================

-- Maintenance users (pin-based auth)
CREATE TABLE maintenance_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('teamleider', 'eigenaar')),
  vestiging TEXT NOT NULL CHECK (vestiging IN ('west', 'midsland')),
  pincode_hash TEXT NOT NULL,
  actief BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance tickets
CREATE TABLE maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging TEXT NOT NULL CHECK (vestiging IN ('west', 'midsland')),
  titel TEXT NOT NULL,
  toelichting TEXT,
  prioriteit TEXT NOT NULL CHECK (prioriteit IN ('laag', 'midden', 'hoog')),
  status TEXT NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'in_behandeling', 'afgehandeld')),
  melder_id UUID NOT NULL REFERENCES maintenance_users(id),
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT now(),
  bijgewerkt_op TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket comments (fase 2 ready, table created now)
CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL REFERENCES maintenance_users(id),
  tekst TEXT NOT NULL,
  aangemaakt_op TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance settings (email config etc)
CREATE TABLE maintenance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default email setting
INSERT INTO maintenance_settings (key, value) VALUES ('notification_email', 'info@puravidafoodbar.nl');

-- Indexes for performance
CREATE INDEX idx_tickets_vestiging ON maintenance_tickets(vestiging);
CREATE INDEX idx_tickets_status ON maintenance_tickets(status);
CREATE INDEX idx_tickets_prioriteit ON maintenance_tickets(prioriteit);
CREATE INDEX idx_tickets_melder ON maintenance_tickets(melder_id);
CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_users_actief ON maintenance_users(actief);

-- Auto-update bijgewerkt_op on ticket changes
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bijgewerkt_op = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_timestamp
  BEFORE UPDATE ON maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_timestamp();

-- Auto-update updated_at on maintenance_users changes
CREATE OR REPLACE FUNCTION update_maintenance_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_maintenance_user_timestamp
  BEFORE UPDATE ON maintenance_users
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_user_timestamp();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE maintenance_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read maintenance_users (needed for pin verification)
CREATE POLICY "Authenticated users can read maintenance_users"
  ON maintenance_users FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage maintenance_users
CREATE POLICY "Authenticated users can insert maintenance_users"
  ON maintenance_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance_users"
  ON maintenance_users FOR UPDATE
  TO authenticated
  USING (true);

-- Tickets: authenticated users can do everything (app-level auth via pincode)
CREATE POLICY "Authenticated users can read tickets"
  ON maintenance_tickets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tickets"
  ON maintenance_tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets"
  ON maintenance_tickets FOR UPDATE
  TO authenticated
  USING (true);

-- Comments: authenticated users can do everything
CREATE POLICY "Authenticated users can read comments"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Settings: authenticated users can read and update
CREATE POLICY "Authenticated users can read settings"
  ON maintenance_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON maintenance_settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert settings"
  ON maintenance_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
