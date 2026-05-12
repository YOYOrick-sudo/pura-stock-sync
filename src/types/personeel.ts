export type Competence = "sterk" | "gemiddeld" | "zwak";

export interface PersoneelLocation {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type FunctionGroup = "keuken" | "bediening";

export interface PersoneelTeam {
  id: string;
  name: string;
  location_id: string;
  sort_order: number;
  function_group: FunctionGroup | null;
  created_at: string;
  updated_at: string;
}

export interface PersoneelHousing {
  id: string;
  name: string;
  color: string;
  capacity: number | null;
  sort_order: number;
  // Uitgebreide velden (allemaal optioneel)
  address: string | null;
  cost_per_month: number | null;
  rooms: number | null;
  room_size_m2: number | null;
  contact_name: string | null;
  facilities: string[];
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersoneelRoom {
  id: string;
  housing_id: string;
  name: string;
  size_m2: number | null;
  capacity: number;
  sort_order: number;
  notes: string | null;
  cost_per_person: number | null;
  cost_private: number | null;
  created_at: string;
  updated_at: string;
}

export interface PersonAssignment {
  id?: string;
  location_id: string;
  team_id: string;
}

export interface Person {
  id: string;
  name: string;
  user_id: string | null;
  /** Primaire/legacy locatie — eerste assignment. Behouden voor compat. */
  location_id: string;
  /** Primaire/legacy team — eerste assignment. */
  team_id: string;
  /** Alle locatie-toewijzingen voor deze persoon. */
  assignments?: PersonAssignment[];
  housing_id: string | null;
  room_id: string | null;
  start_date: string; // ISO date
  end_date: string;
  days_per_week: number | null;
  competence: Competence | null; // null voor non-managers
  pay: string | null; // null voor non-managers
  notes: string | null;
  deleted_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonInput {
  name: string;
  user_id?: string | null;
  /** Tenminste 1 assignment vereist. */
  assignments: PersonAssignment[];
  housing_id?: string | null;
  room_id?: string | null;
  start_date: string;
  end_date: string;
  days_per_week?: number | null;
  competence?: Competence | null;
  pay?: string | null;
  notes?: string | null;
}

export type PersonUpdate = Partial<PersonInput>;

export const HOUSING_FACILITY_PRESETS = [
  "wifi",
  "wasmachine",
  "parkeerplek",
  "eigen badkamer",
  "tuin",
  "fiets",
] as const;
