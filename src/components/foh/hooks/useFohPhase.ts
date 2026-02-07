import { toZonedTime } from 'date-fns-tz';
import type { FohTaskWithEmployee, PhaseType } from '@/types/foh';

const TIMEZONE = 'Europe/Amsterdam';

// Phase time windows (minutes-based)
export const PHASE_WINDOWS = [
  { phase: 'open' as const, label: 'Open', startMin: 8 * 60 + 30, endMin: 10 * 60 + 30 },
  { phase: 'tussen' as const, label: 'Tussen', startMin: 12 * 60, endMin: 18 * 60 },
  { phase: 'sluit' as const, label: 'Sluit', startMin: 20 * 60, endMin: 24 * 60 + 60 },
] as const;

// Category order for display
export const CATEGORY_ORDER = ['Deel 1', 'Deel 2', 'Deel 3', 'Bar', 'Keuken', 'Zaal', 'Terras', 'Sanitair', 'Entree', 'Voorraad', 'Algemeen'] as const;

export const getAvailableCategoriesForPhase = (location: string, phase: string): string[] => {
  if (location === 'Midsland' && phase === 'open') {
    return ['Deel 1', 'Deel 2', 'Deel 3'];
  }
  if (location === 'Midsland' && phase === 'tussen') {
    return ['Binnen', 'Deel 1 - Bar Prep Check', 'Deel 2 - Bijvullen', 'Hygiëne', 'Overdracht', 'Terras'];
  }
  if (location === 'Midsland' && phase === 'sluit') {
    return ['BAR', 'BIJVULLEN (FIFO)', 'BINNEN', 'HYGIENE', 'LAATSTE LOODJES', 'TERRAS'];
  }
  return [...CATEGORY_ORDER];
};

export const nowInAmsterdamMinutes = (): number => {
  const nowInAmsterdam = toZonedTime(new Date(), TIMEZONE);
  const hours = nowInAmsterdam.getHours();
  const minutes = nowInAmsterdam.getMinutes();
  let totalMinutes = hours * 60 + minutes;
  if (hours === 0) {
    totalMinutes += 24 * 60;
  }
  return totalMinutes;
};

export const getCurrentPhaseByTime = (): PhaseType => {
  const currentMinutes = nowInAmsterdamMinutes();
  for (const window of PHASE_WINDOWS) {
    if (currentMinutes >= window.startMin && currentMinutes <= window.endMin) {
      return window.phase;
    }
  }
  if (currentMinutes < PHASE_WINDOWS[0].startMin) return 'open';
  if (currentMinutes > PHASE_WINDOWS[0].endMin && currentMinutes < PHASE_WINDOWS[1].startMin) return 'tussen';
  if (currentMinutes > PHASE_WINDOWS[1].endMin && currentMinutes < PHASE_WINDOWS[2].startMin) return 'sluit';
  return 'open';
};

export const getAmsterdamDateString = (): string => {
  const nowInAmsterdam = toZonedTime(new Date(), TIMEZONE);
  return nowInAmsterdam.toISOString().split('T')[0];
};

export const groupTasksByPhase = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<PhaseType, FohTaskWithEmployee[]> = {
    open: [],
    tussen: [],
    sluit: [],
  };
  tasks.forEach(task => {
    if (task.phase && task.phase in grouped) {
      grouped[task.phase].push(task);
    }
  });
  return grouped;
};

export const getFirstPhaseWithOpenTasks = (tasks: FohTaskWithEmployee[]): PhaseType => {
  const grouped = groupTasksByPhase(tasks);
  const phaseOrder: PhaseType[] = ['open', 'tussen', 'sluit'];
  for (const phase of phaseOrder) {
    if (grouped[phase].some(task => !task.completed)) {
      return phase;
    }
  }
  return getCurrentPhaseByTime();
};

export const groupTasksByCategory = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<string, FohTaskWithEmployee[]> = {};
  tasks.forEach(task => {
    const category = task.category || 'Algemeen';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(task);
  });

  const sortedGrouped: Record<string, FohTaskWithEmployee[]> = {};
  CATEGORY_ORDER.forEach(cat => {
    if (grouped[cat]) {
      sortedGrouped[cat] = grouped[cat].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.sort_order !== undefined && b.sort_order !== undefined) return a.sort_order - b.sort_order;
        return 0;
      });
    }
  });
  Object.keys(grouped).forEach(cat => {
    if (!sortedGrouped[cat]) {
      sortedGrouped[cat] = grouped[cat].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return 0;
      });
    }
  });
  return sortedGrouped;
};

export const getCategoryProgress = (tasks: FohTaskWithEmployee[]) => {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  return { completed, total, allDone: completed === total && total > 0 };
};

export const sortTasksInPhase = (tasks: FohTaskWithEmployee[]) => {
  return [...tasks].sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) return a.sort_order - b.sort_order;
    return 0;
  });
};

export const sortExtraTasks = (tasks: FohTaskWithEmployee[]) => {
  return [...tasks].sort((a, b) => {
    const dateCompare = a.due_date.localeCompare(b.due_date);
    if (dateCompare !== 0) return dateCompare;
    return a.priority - b.priority;
  });
};

export const groupTasksByDay = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<string, FohTaskWithEmployee[]> = {};
  tasks.forEach(task => {
    const dateKey = task.due_date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
};

export const formatDayHeader = (dateString: string): string => {
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  if (dateString === todayDateStr) return 'Vandaag';
  if (dateString === tomorrowDateStr) return 'Morgen';
  if (dateString < todayDateStr) return 'Overdag';

  const date = new Date(dateString + 'T12:00:00');
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
};

export const getDateLabelColor = (dateString: string): string => {
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  if (dateString < todayDateStr) return 'hsl(0 84% 60%)';
  if (dateString === todayDateStr) return 'hsl(var(--primary))';
  return 'hsl(var(--muted-foreground))';
};

export const getPriorityConfig = (priority: number) => {
  switch (priority) {
    case 1: return { color: 'hsl(0 84% 60%)', borderColor: 'hsl(0 84% 60%)' };
    case 3: return { color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' };
    default: return { color: 'hsl(25 95% 53%)', borderColor: 'hsl(25 95% 53%)' };
  }
};
