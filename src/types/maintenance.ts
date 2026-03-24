export type Vestiging = 'west' | 'midsland';
export type Prioriteit = 'laag' | 'midden' | 'hoog';
export type TicketStatus = 'nieuw' | 'in_behandeling' | 'afgehandeld';
export type MaintenanceRol = 'teamleider' | 'eigenaar';

export interface MaintenanceUser {
  id: string;
  naam: string;
  rol: MaintenanceRol;
  vestiging: Vestiging;
  pincode_hash: string;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTicket {
  id: string;
  vestiging: Vestiging;
  titel: string;
  toelichting: string | null;
  prioriteit: Prioriteit;
  status: TicketStatus;
  melder_id: string;
  aangemaakt_op: string;
  bijgewerkt_op: string;
  // Joined fields
  melder?: MaintenanceUser;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  auteur_id: string;
  tekst: string;
  aangemaakt_op: string;
  // Joined fields
  auteur?: MaintenanceUser;
}

export interface MaintenanceSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// Session state for pin-based auth
export interface MaintenanceSession {
  user: MaintenanceUser;
  loggedInAt: number;
}
