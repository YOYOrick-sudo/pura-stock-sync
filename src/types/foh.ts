export interface FohTask {
  id: string;
  location: string;
  title: string;
  due_date: string; // 'YYYY-MM-DD' format (DATE type)
  priority: 1 | 2 | 3;
  completed: boolean;
  archived: boolean;
  completed_at: string | null;
  completed_by: string | null;
  assigned_employee_id: string | null;
  template_id: string | null;
  phase: 'open' | 'tussen' | 'borrel' | 'sluit' | null;
  category: string;
  created_at: string;
  estimated_minutes: number | null;
  sort_order?: number;
  description?: string | null;
}

export interface FohEmployee {
  id: string;
  location: string;
  name: string;
  created_at: string;
}

export interface FohTaskWithEmployee extends FohTask {
  foh_employees?: FohEmployee | null;
}

export interface FohDailyTemplate {
  id: string;
  location: string;
  phase: 'open' | 'tussen' | 'borrel' | 'sluit';
  title: string;
  priority: 1 | 2 | 3;
  category: string;
  created_at: string;
  estimated_minutes: number | null;
  sort_order?: number;
  description?: string | null;
}

export type PhaseType = 'open' | 'tussen' | 'borrel' | 'sluit';

export interface PhaseWindow {
  phase: PhaseType;
  label: string;
  start: string; // HH:mm format
  end: string;
}
