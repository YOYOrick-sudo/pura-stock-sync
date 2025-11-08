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
  created_at: string;
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
