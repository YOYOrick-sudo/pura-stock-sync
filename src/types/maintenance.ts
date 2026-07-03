export type Vestiging = 'west' | 'midsland';
export type Prioriteit = 'laag' | 'midden' | 'hoog';
export type TicketStatus = 'nieuw' | 'in_behandeling' | 'afgehandeld';
export type MaintenanceRol = 'teamleider' | 'eigenaar';

export const PLEK_OPTIONS = [
  'Bar',
  'Keuken',
  'Zaal',
  'Terras',
  'Sanitair',
  'Entree',
  'Voorraad',
  'Overig',
] as const;
export type Plek = typeof PLEK_OPTIONS[number];

export interface MaintenanceUser {
  id: string;
  naam: string;
  rol: MaintenanceRol;
  vestiging: Vestiging;
  pincode_hash: string;
  actief: boolean;
  created_at: string;
  updated_at: string;
  /** true als deze user via de app-login (Supabase auth) binnenkomt in plaats van de pincode */
  isStaff?: boolean;
}

export interface MaintenanceTicket {
  id: string;
  vestiging: Vestiging;
  titel: string;
  toelichting: string | null;
  prioriteit: Prioriteit;
  status: TicketStatus;
  melder_id: string | null;
  melder_user_id: string | null;
  melder_naam: string | null;
  plek: string | null;
  foto_url: string | null;
  aangemaakt_op: string;
  bijgewerkt_op: string;
  // Joined
  melder?: MaintenanceUser | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  auteur_id: string;
  tekst: string;
  aangemaakt_op: string;
  auteur?: MaintenanceUser;
}

export interface MaintenanceSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface MaintenanceSession {
  user: MaintenanceUser;
  loggedInAt: number;
}
