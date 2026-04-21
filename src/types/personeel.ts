export type Competence = "sterk" | "gemiddeld" | "zwak";

export interface PersoneelLocation {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PersoneelTeam {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PersoneelHousing {
  id: string;
  name: string;
  color: string;
  capacity: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  name: string;
  user_id: string | null;
  location_id: string;
  team_id: string;
  housing_id: string | null;
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
  location_id: string;
  team_id: string;
  housing_id?: string | null;
  start_date: string;
  end_date: string;
  days_per_week?: number | null;
  competence?: Competence | null;
  pay?: string | null;
  notes?: string | null;
}

export type PersonUpdate = Partial<PersonInput>;
