import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Loader2, Plus, Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import type { FohTask, FohEmployee, FohTaskWithEmployee, PhaseType } from '@/types/foh';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { PolarColors } from '@/components/polar/colors';

// Phase time windows (minutes-based)
const PHASE_WINDOWS = [
  { phase: 'open' as const, label: 'Open', startMin: 8 * 60 + 30, endMin: 10 * 60 + 30 },
  { phase: 'tussen' as const, label: 'Tussen', startMin: 12 * 60, endMin: 18 * 60 },
  { phase: 'sluit' as const, label: 'Sluit', startMin: 20 * 60, endMin: 24 * 60 + 60 },
] as const;

// Category order for display
const CATEGORY_ORDER = ['Deel 1', 'Deel 2', 'Deel 3', 'Bar', 'Keuken', 'Zaal', 'Terras', 'Sanitair', 'Entree', 'Voorraad', 'Algemeen'] as const;

const nowInAmsterdamMinutes = (): number => {
  const TIMEZONE = 'Europe/Amsterdam';
  const nowInAmsterdam = toZonedTime(new Date(), TIMEZONE);
  const hours = nowInAmsterdam.getHours();
  const minutes = nowInAmsterdam.getMinutes();
  let totalMinutes = hours * 60 + minutes;
  
  if (hours === 0) {
    totalMinutes += 24 * 60;
  }
  
  return totalMinutes;
};

const getCurrentPhaseByTime = (): PhaseType => {
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

const getAmsterdamDateString = (): string => {
  const TIMEZONE = 'Europe/Amsterdam';
  const nowInAmsterdam = toZonedTime(new Date(), TIMEZONE);
  return nowInAmsterdam.toISOString().split('T')[0];
};

const isClosedDay = (): boolean => {
  const TIMEZONE = 'Europe/Amsterdam';
  const nowInAmsterdam = toZonedTime(new Date(), TIMEZONE);
  const dayOfWeek = nowInAmsterdam.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday
  return dayOfWeek === 1 || dayOfWeek === 2; // Monday or Tuesday
};

// Group tasks by phase helper
const groupTasksByPhase = (tasks: FohTaskWithEmployee[]) => {
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

// Get the first phase that has open (incomplete) tasks
const getFirstPhaseWithOpenTasks = (tasks: FohTaskWithEmployee[]): PhaseType => {
  const grouped = groupTasksByPhase(tasks);
  const phaseOrder: PhaseType[] = ['open', 'tussen', 'sluit'];
  
  for (const phase of phaseOrder) {
    const phaseTasks = grouped[phase];
    const hasOpenTasks = phaseTasks.some(task => !task.completed);
    
    if (hasOpenTasks) {
      return phase;
    }
  }
  
  return getCurrentPhaseByTime();
};

// Group tasks by category with ordering
const groupTasksByCategory = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<string, FohTaskWithEmployee[]> = {};
  
  tasks.forEach(task => {
    const category = task.category || 'Algemeen';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(task);
  });
  
  // Sort grouped object by CATEGORY_ORDER
  const sortedGrouped: Record<string, FohTaskWithEmployee[]> = {};
  CATEGORY_ORDER.forEach(cat => {
    if (grouped[cat]) {
      // Sort tasks within category by sort_order
      sortedGrouped[cat] = grouped[cat].sort((a, b) => {
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        return 0;
      });
    }
  });
  
  // Add any remaining categories not in CATEGORY_ORDER
  Object.keys(grouped).forEach(cat => {
    if (!sortedGrouped[cat]) {
      sortedGrouped[cat] = grouped[cat];
    }
  });
  
  return sortedGrouped;
};

// Sort tasks within phase by sort_order first, then completion status
const sortTasksInPhase = (tasks: FohTaskWithEmployee[]) => {
  return [...tasks].sort((a, b) => {
    // First sort by sort_order if both have it
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order;
    }
    // Then by completion status
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });
};

// Sort extra tasks by date, then priority
const sortExtraTasks = (tasks: FohTaskWithEmployee[]) => {
  return [...tasks].sort((a, b) => {
    const dateCompare = a.due_date.localeCompare(b.due_date);
    if (dateCompare !== 0) return dateCompare;
    return a.priority - b.priority;
  });
};

// Helper functions for extra tasks
const getDateLabel = (dateString: string): string => {
  const TIMEZONE = 'Europe/Amsterdam';
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
  
  if (dateString === todayDateStr) return 'Vandaag';
  if (dateString === tomorrowDateStr) return 'Morgen';
  if (dateString < todayDateStr) return 'Overdag';
  return dateString;
};

const getDateLabelColor = (dateString: string): string => {
  const TIMEZONE = 'Europe/Amsterdam';
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (dateString < todayDateStr) return '#DC2626';
  if (dateString === todayDateStr) return '#1B7867';
  return '#73747B';
};

const getPriorityConfig = (priority: number) => {
  switch (priority) {
    case 1: return { color: PolarColors.status.error };       // Hoog - Rood
    case 3: return { color: PolarColors.status.success };     // Laag - Groen
    default: return { color: PolarColors.status.pending };    // Normaal - Oranje
  }
};

export function FohTasks() {
  const { userLocation } = useUserLocation();
  
  const [mainCategory, setMainCategory] = useState<'dagelijks' | 'periodiek'>('dagelijks');
  const [activePhase, setActivePhase] = useState<PhaseType>('open');
  const [isPhaseManuallySelected, setIsPhaseManuallySelected] = useState(false);
  
  const [dailyTasks, setDailyTasks] = useState<FohTaskWithEmployee[]>([]);
  const [extraTasks, setExtraTasks] = useState<FohTaskWithEmployee[]>([]);
  const [employees, setEmployees] = useState<FohEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 2 as 1 | 2 | 3,
    assigned_employee_id: null as string | null,
    category: 'Algemeen' as string,
    estimated_minutes: null as number | null,
  });
  
  const [employeeInput, setEmployeeInput] = useState('');
  const [employeeOpen, setEmployeeOpen] = useState(false);
  
  // Swipe state for delete functionality
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Data fetching functions
  const generateDailyTasks = async () => {
    // Don't generate tasks on Monday and Tuesday (closed days)
    if (isClosedDay()) {
      return;
    }
    
    const todayDate = getAmsterdamDateString();
    
    const { data: existingTasks } = await supabase
      .from('foh_tasks')
      .select('id')
      .eq('location', userLocation)
      .eq('due_date', todayDate)
      .not('phase', 'is', null)
      .limit(1);
    
    if (existingTasks && existingTasks.length > 0) {
      return;
    }
    
    const { data: templates } = await supabase
      .from('foh_daily_templates')
      .select('*')
      .eq('location', userLocation)
      .eq('repeat_type', 'daily');
    
    if (!templates || templates.length === 0) return;
    
    const tasksToInsert = templates.map(template => ({
      title: template.title,
      due_date: todayDate,
      priority: template.priority,
      phase: template.phase,
      location: userLocation,
      category: template.category,
      template_id: template.id,
      repeat_type: 'daily',
      completed: false,
      archived: false,
      assigned_employee_id: null,
      estimated_minutes: template.estimated_minutes,
      sort_order: template.sort_order,
    }));
    
    await supabase.from('foh_tasks').insert(tasksToInsert);
  };

  const fetchDailyTasks = async () => {
    const todayDate = getAmsterdamDateString();
    
    const { data, error } = await supabase
      .from('foh_tasks')
      .select('*, foh_employees(*)')
      .eq('location', userLocation)
      .eq('due_date', todayDate)
      .eq('archived', false)
      .not('phase', 'is', null)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching daily tasks:', error);
      return;
    }
    
    setDailyTasks((data || []) as FohTaskWithEmployee[]);
    setLoading(false);
  };

  const fetchExtraTasks = async () => {
    const { data, error } = await supabase
      .from('foh_tasks')
      .select('*, foh_employees(*)')
      .eq('location', userLocation)
      .eq('archived', false)
      .is('phase', null)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: true });
    
    if (error) {
      console.error('Error fetching extra tasks:', error);
      return;
    }
    
    setExtraTasks((data || []) as FohTaskWithEmployee[]);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('foh_employees')
      .select('*')
      .eq('location', userLocation)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }
    
    setEmployees(data || []);
  };

  // Client-side fallback: check if tasks need reset
  const shouldResetTasks = (): boolean => {
    const location = userLocation || 'West';
    const lastReset = localStorage.getItem(`lastTaskReset_${location}`);
    const now = new Date();
    const amsterdamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    
    // If never reset before, needs reset
    if (!lastReset) return true;
    
    const lastResetDate = new Date(lastReset);
    const lastResetAmsterdam = new Date(lastResetDate.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    
    // Check if it's after 04:00 and we haven't reset today yet
    const currentHour = amsterdamTime.getHours();
    const lastResetDay = lastResetAmsterdam.toDateString();
    const currentDay = amsterdamTime.toDateString();
    
    // If it's a new day AND it's after 04:00, we need to reset
    if (currentDay !== lastResetDay && currentHour >= 4) {
      return true;
    }
    
    // If it's the same day but before 04:00, check if last reset was yesterday
    if (currentHour < 4) {
      const yesterday = new Date(amsterdamTime);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastResetDay === yesterday.toDateString()) {
        return false; // Already reset for "today" (which extends until 04:00)
      }
    }
    
    return false;
  };

  const performClientSideReset = async () => {
    const location = userLocation || 'West';
    try {
      console.log(`[${location}] Performing client-side task reset...`);
      
      const todayDate = getAmsterdamDateString();
      
      // Archive old tasks
      const { error: archiveError } = await supabase
        .from('foh_tasks')
        .update({ archived: true })
        .eq('location', location)
        .lt('due_date', todayDate)
        .eq('archived', false);
      
      if (archiveError) {
        console.error('Error archiving old tasks:', archiveError);
        return;
      }
      
      // Generate new tasks
      await generateDailyTasks();
      
      // Mark reset as done
      localStorage.setItem(`lastTaskReset_${location}`, new Date().toISOString());
      console.log(`[${location}] Client-side reset completed`);
    } catch (error) {
      console.error('Error in client-side reset:', error);
    }
  };

  useEffect(() => {
    const initializeTasks = async () => {
      // Check if reset is needed (client-side fallback)
      if (shouldResetTasks()) {
        await performClientSideReset();
      }
      
      // Generate and fetch current tasks
      await generateDailyTasks();
      await fetchDailyTasks();
      fetchExtraTasks();
      fetchEmployees();
    };
    
    initializeTasks();
  }, [userLocation]);
  
  // Auto-detect phase based on time and open tasks
  useEffect(() => {
    if (mainCategory === 'dagelijks' && !isPhaseManuallySelected) {
      const targetPhase = getFirstPhaseWithOpenTasks(dailyTasks);
      setActivePhase(targetPhase);
    }
  }, [dailyTasks, mainCategory, isPhaseManuallySelected]);

  // Toggle task completion
  const toggleTask = async (id: string, currentCompleted: boolean) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('foh_tasks')
      .update({
        completed: !currentCompleted,
        completed_at: !currentCompleted ? now : null,
      })
      .eq('id', id);
    
    if (error) {
      toast.error('Kon taak niet bijwerken');
      console.error(error);
      return;
    }
    
    await fetchDailyTasks();
    await fetchExtraTasks();
  };

  // Employee management functions
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(employeeInput.toLowerCase())
  );
  
  const exactMatch = employees.find(e => 
    e.name.toLowerCase() === employeeInput.toLowerCase()
  );
  
  const shouldShowAddNew = employeeInput.trim().length > 0 && !exactMatch;
  
  const createEmployeeInline = async (name: string) => {
    const { data, error } = await supabase
      .from('foh_employees')
      .insert({ name, location: userLocation })
      .select()
      .single();
    
    if (error) {
      toast.error('Kon medewerker niet aanmaken');
      console.error(error);
      return null;
    }
    
    toast.success(`${name} toegevoegd!`);
    await fetchEmployees();
    return data;
  };
  
  const handleEmployeeSelect = (employeeId: string) => {
    setNewTask({ ...newTask, assigned_employee_id: employeeId });
    setEmployeeOpen(false);
  };
  
  const handleAddNewEmployee = async () => {
    const newEmployee = await createEmployeeInline(employeeInput.trim());
    if (newEmployee) {
      setNewTask({ ...newTask, assigned_employee_id: newEmployee.id });
      setEmployeeOpen(false);
    }
  };

  // Check if user is allowed to switch to target phase
  const canSwitchToPhase = (targetPhase: PhaseType): boolean => {
    const phaseOrder: PhaseType[] = ['open', 'tussen', 'sluit'];
    const targetIndex = phaseOrder.indexOf(targetPhase);
    
    const grouped = groupTasksByPhase(dailyTasks);
    
    for (let i = 0; i < targetIndex; i++) {
      const priorPhase = phaseOrder[i];
      const priorTasks = grouped[priorPhase];
      const hasOpenTasks = priorTasks.some(task => !task.completed);
      
      if (hasOpenTasks) {
        return false;
      }
    }
    
    return true;
  };

  // Create new task
  const createTask = async () => {
    const trimmedTitle = newTask.title.trim();
    if (!trimmedTitle) {
      toast.error('Titel is verplicht');
      return;
    }
    if (trimmedTitle.length > 200) {
      toast.error('Titel mag maximaal 200 tekens zijn');
      return;
    }

    const { error } = await supabase
      .from('foh_tasks')
      .insert({
        title: trimmedTitle,
        due_date: newTask.due_date,
        priority: newTask.priority,
        assigned_employee_id: newTask.assigned_employee_id,
        template_id: null,
        location: userLocation,
        category: newTask.category,
        phase: null,
        completed: false,
        archived: false,
        estimated_minutes: newTask.estimated_minutes,
      });

    if (error) {
      toast.error('Kon taak niet aanmaken');
      console.error(error);
      return;
    }

    toast.success('Taak aangemaakt!');
    setDialogOpen(false);
    setNewTask({
      title: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 2,
      assigned_employee_id: null,
      category: 'Algemeen',
      estimated_minutes: null,
    });
    setEmployeeInput('');
    fetchExtraTasks();
  };

  // Delete periodic task
  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('foh_tasks')
      .update({ archived: true })
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      toast.error('Fout bij verwijderen taak');
      return;
    }

    toast.success('Taak verwijderd');
    setSwipedTaskId(null);
    fetchExtraTasks();
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, taskId: string) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const diff = touchStart - e.targetTouches[0].clientX;
    
    // Prevent scroll if horizontal swipe is detected
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
    
    // Update swipe offset for live feedback (cap at 80px)
    setSwipeOffset(Math.min(Math.max(diff, 0), 80));
    
    if (diff > 30) {
      setSwipedTaskId(taskId);
    } else if (diff < -10) {
      setSwipedTaskId(null);
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
    setTouchEnd(0);
    if (!swipedTaskId) {
      setSwipeOffset(0);
    }
  };

  // Process tasks for display
  const sortedExtraTasks = sortExtraTasks(extraTasks);
  
  const groupedDailyTasks = (() => {
    const grouped = groupTasksByPhase(dailyTasks);
    (Object.keys(grouped) as PhaseType[]).forEach(phase => {
      grouped[phase] = sortTasksInPhase(grouped[phase]);
    });
    return grouped;
  })();

  // Get current tasks to display
  const getCurrentTasks = () => {
    if (mainCategory === 'dagelijks') {
      return groupedDailyTasks[activePhase];
    } else {
      return sortedExtraTasks;
    }
  };

  // Calculate stats specific to the current active section
  const getCurrentSectionStats = () => {
    let tasks: FohTaskWithEmployee[] = [];
    
    if (mainCategory === 'dagelijks') {
      // Get tasks for the active phase only
      tasks = groupedDailyTasks[activePhase];
    } else {
      // Get periodic tasks
      tasks = sortedExtraTasks;
    }
    
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = percentage === 100;
    
    return { completed, total, percentage, isComplete };
  };

  const { completed: completedCount, total: totalCount, percentage: progressPercentage, isComplete } = getCurrentSectionStats();

  // Calculate stats per phase for buttons
  const getDailyListStats = (phase: PhaseType) => {
    const listTasks = groupedDailyTasks[phase];
    const completed = listTasks.filter(t => t.completed).length;
    const total = listTasks.length;
    return { completed, total };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: '#1B7867' }} className="animate-spin" />
      </div>
    );
  }

  // Show closed message on Monday and Tuesday
  if (isClosedDay()) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FEFFF1', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            backgroundColor: '#F6F7DD',
            borderRadius: '20px',
            border: '1px solid rgba(197, 197, 202, 0.5)',
            padding: '48px 24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#282E3A',
              marginBottom: '12px',
            }}>
              Wij zijn gesloten
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#73747B',
              marginBottom: '0',
            }}>
              Op maandag en dinsdag zijn er geen taken. We zien je graag terug op woensdag!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentTasks = getCurrentTasks();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FEFFF1', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: '#F6F7DD',
        borderRadius: '20px',
        border: '1px solid rgba(197, 197, 202, 0.5)',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
          {/* Single row with all buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              
              {/* Dagelijks phase buttons */}
              {(['open', 'tussen', 'sluit'] as PhaseType[]).map((phase) => {
                const stats = getDailyListStats(phase);
                const isActive = mainCategory === 'dagelijks' && activePhase === phase;
                const labels = { open: 'Open', tussen: 'Tussen', sluit: 'Sluit' };
                const canSwitch = canSwitchToPhase(phase);
                
                return (
                  <button
                    key={phase}
                    onClick={() => {
                      if (!canSwitch && phase !== activePhase) {
                        toast.error('Voltooien eerst alle taken in eerdere fases');
                        return;
                      }
                      setMainCategory('dagelijks');
                      setActivePhase(phase);
                      setIsPhaseManuallySelected(true);
                    }}
                    disabled={!canSwitch && phase !== activePhase}
                    onMouseEnter={(e) => {
                      if (!isActive && canSwitch) {
                        e.currentTarget.style.backgroundColor = '#F6F7DD';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#FEFFF1';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                  padding: '10px 16px',
                  backgroundColor: isActive ? '#1B7867' : '#FEFFF1',
                  color: isActive ? '#FFFFFF' : '#282E3A',
                  border: isActive ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                  borderRadius: '20px',
                  cursor: (!canSwitch && phase !== activePhase) ? 'not-allowed' : 'pointer',
                      opacity: (!canSwitch && phase !== activePhase) ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <span>{labels[phase]}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                      color: isActive ? '#FFFFFF' : '#73747B',
                      minWidth: '32px',
                    }}>
                      {stats.completed}/{stats.total}
                    </span>
                  </button>
                );
              })}
              
            {/* Visual separator */}
            <div style={{
              width: '1px',
              height: '32px',
              backgroundColor: 'rgba(197, 197, 202, 0.5)',
              margin: '0 20px',
            }} />
              
              {/* Periodiek button (unified) */}
              {(() => {
                const completed = extraTasks.filter(t => t.completed).length;
                const total = extraTasks.length;
                const isActive = mainCategory === 'periodiek';
                
                return (
                  <button
                    onClick={() => {
                      setMainCategory('periodiek');
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#F6F7DD';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#FEFFF1';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                    padding: '10px 16px',
                    backgroundColor: isActive ? '#1B7867' : '#FEFFF1',
                    color: isActive ? '#FFFFFF' : '#282E3A',
                    border: isActive ? 'none' : '1px solid rgba(197, 197, 202, 0.5)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <span>Periodiek</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.04)',
                      color: isActive ? '#FFFFFF' : '#73747B',
                      minWidth: '32px',
                    }}>
                      {completed}/{total}
                    </span>
                  </button>
                );
              })()}

            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(197, 197, 202, 0.5)', margin: 0 }} />

            {/* Full-width progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  height: '8px',
                  backgroundColor: '#FEFFF1',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: '#1B7867',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#73747B', fontFamily: 'Inter, sans-serif' }}>
                    {completedCount}/{totalCount}
                  </span>
                  <span style={{
                    fontWeight: 600,
                    color: isComplete ? '#1B7867' : '#282E3A',
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {progressPercentage}%
                  </span>
                </div>

                {/* New Task Button - only for periodiek */}
                {mainCategory === 'periodiek' && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        style={{
                          backgroundColor: '#1B7867',
                          color: '#FFFFFF',
                          borderRadius: '20px',
                          padding: '7px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          fontSize: '14px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#229580';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1B7867';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.backgroundColor = '#156353';
                          e.currentTarget.style.transform = 'scale(0.95)';
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.backgroundColor = '#229580';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Plus size={20} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent style={{
                      backgroundColor: '#FEFFF1',
                      borderRadius: '20px',
                      border: '1px solid rgba(197, 197, 202, 0.5)',
                      padding: '32px',
                      maxWidth: '480px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}>
                      <DialogHeader>
                        <DialogTitle style={{
                          fontSize: '18px',
                          fontWeight: 600,
                          color: '#282E3A',
                          fontFamily: 'Inter, sans-serif',
                          marginBottom: '24px',
                        }}>
                          Nieuwe Periodieke Taak
                        </DialogTitle>
                      </DialogHeader>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '6px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            Titel
                          </label>
                          <Input
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="Bijv. Voorraad controleren"
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(197, 197, 202, 0.5)',
                              borderRadius: '16px',
                              padding: '10px 14px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '6px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            Deadline
                          </label>
                          <Input
                            type="date"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(197, 197, 202, 0.5)',
                              borderRadius: '16px',
                              padding: '10px 14px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '14px',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '6px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            Geschatte tijd (optioneel)
                          </label>
                          <Select
                            value={newTask.estimated_minutes?.toString() || ''}
                            onValueChange={(value) => setNewTask({ ...newTask, estimated_minutes: value ? Number(value) : null })}
                          >
                            <SelectTrigger style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(197, 197, 202, 0.5)',
                              borderRadius: '16px',
                              padding: '10px 14px',
                              fontFamily: 'Inter, sans-serif',
                            }}>
                              <SelectValue placeholder="Niet ingevuld" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Niet ingevuld</SelectItem>
                              <SelectItem value="3">3 minuten</SelectItem>
                              <SelectItem value="5">5 minuten</SelectItem>
                              <SelectItem value="10">10 minuten</SelectItem>
                              <SelectItem value="15">15 minuten</SelectItem>
                              <SelectItem value="20">20 minuten</SelectItem>
                              <SelectItem value="30">30 minuten</SelectItem>
                              <SelectItem value="45">45 minuten</SelectItem>
                              <SelectItem value="60">1 uur</SelectItem>
                              <SelectItem value="90">1,5 uur</SelectItem>
                              <SelectItem value="120">2 uur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '6px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            Prioriteit
                          </label>
                          <Select
                            value={String(newTask.priority)}
                            onValueChange={(value) => setNewTask({ ...newTask, priority: Number(value) as 1 | 2 | 3 })}
                          >
                            <SelectTrigger style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(197, 197, 202, 0.5)',
                              borderRadius: '16px',
                              padding: '10px 14px',
                              fontFamily: 'Inter, sans-serif',
                            }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">🔴 Hoog</SelectItem>
                              <SelectItem value="2">🟡 Normaal</SelectItem>
                              <SelectItem value="3">🟢 Laag</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '6px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            Categorie
                          </label>
                          <Select
                            value={newTask.category}
                            onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                          >
                            <SelectTrigger style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid rgba(197, 197, 202, 0.5)',
                              borderRadius: '16px',
                              padding: '10px 14px',
                              fontFamily: 'Inter, sans-serif',
                            }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bar">Bar</SelectItem>
                              <SelectItem value="Keuken">Keuken</SelectItem>
                              <SelectItem value="Zaal">Zaal</SelectItem>
                              <SelectItem value="Terras">Terras</SelectItem>
                              <SelectItem value="Sanitair">Sanitair</SelectItem>
                              <SelectItem value="Entree">Entree</SelectItem>
                              <SelectItem value="Voorraad">Voorraad</SelectItem>
                              <SelectItem value="Algemeen">Algemeen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#282E3A',
                            marginBottom: '6px',
                            fontFamily: 'Inter, sans-serif',
                          }}>
                            Toegewezen aan
                          </label>
                          <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={employeeOpen}
                                style={{
                                  width: '100%',
                                  justifyContent: 'space-between',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid rgba(197, 197, 202, 0.5)',
                                  borderRadius: '16px',
                                  padding: '10px 14px',
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '14px',
                                  fontWeight: 400,
                                }}
                              >
                                {newTask.assigned_employee_id
                                  ? employees.find((e) => e.id === newTask.assigned_employee_id)?.name
                                  : "Selecteer medewerker..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Zoek of maak nieuwe medewerker..."
                                  value={employeeInput}
                                  onValueChange={setEmployeeInput}
                                />
                                <CommandList>
                                  {filteredEmployees.length === 0 && employeeInput.length === 0 && (
                                    <CommandEmpty>Geen medewerkers gevonden.</CommandEmpty>
                                  )}
                                  {filteredEmployees.length === 0 && employeeInput.length > 0 && (
                                    <CommandEmpty>Geen resultaten.</CommandEmpty>
                                  )}
                                  {filteredEmployees.length > 0 && (
                                    <CommandGroup heading="Bestaande medewerkers">
                                      {filteredEmployees.map((employee) => (
                                        <CommandItem
                                          key={employee.id}
                                          value={employee.name}
                                          onSelect={() => handleEmployeeSelect(employee.id)}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              newTask.assigned_employee_id === employee.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {employee.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                  {shouldShowAddNew && (
                                    <>
                                      {filteredEmployees.length > 0 && <CommandSeparator />}
                                      <CommandGroup>
                                        <CommandItem onSelect={handleAddNewEmployee}>
                                          <Plus className="mr-2 h-4 w-4" />
                                          Maak "{employeeInput}" aan
                                        </CommandItem>
                                      </CommandGroup>
                                    </>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <DialogFooter style={{ marginTop: '16px', gap: '8px' }}>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            setNewTask({
                              title: '',
                              due_date: new Date().toISOString().split('T')[0],
                              priority: 2,
                              assigned_employee_id: null,
                              category: 'Algemeen',
                              estimated_minutes: null,
                            });
                            setEmployeeInput('');
                          }}
                          style={{
                            borderRadius: '20px',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          Annuleren
                        </Button>
                        <Button
                          onClick={createTask}
                          style={{
                            backgroundColor: '#1B7867',
                            color: '#FFFFFF',
                            borderRadius: '20px',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          Aanmaken
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(197, 197, 202, 0.5)', margin: 0 }} />

            {/* Tasks list */}
            <div>
              {mainCategory === 'dagelijks' ? (
                <>
                  {Object.entries(groupTasksByCategory(currentTasks)).map(([category, categoryTasks]) => (
                    <div key={category} style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#73747B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '12px',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {category}
                      </div>

                      {categoryTasks.map((task, index) => (
                        <div key={task.id}>
                          <div style={{
                            padding: '14px 0',
                            opacity: task.completed ? 0.5 : 1,
                            transition: 'opacity 0.2s',
                          }}>
                            <div style={{
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'flex-start',
                            }}>
                              <div style={{ paddingTop: '2px' }}>
                                <button
                                  onClick={() => toggleTask(task.id, task.completed)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '6px',
                                    border: '1.5px solid rgba(197, 197, 202, 0.5)',
                                    backgroundColor: task.completed ? '#1B7867' : '#FFFFFF',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                    padding: 0,
                                  }}
                                >
                                  {task.completed && (
                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                      <path
                                        d="M1 5L4.5 8.5L11 1.5"
                                        stroke="#FFFFFF"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              
                              <span style={{
                                flex: 1,
                                textDecoration: task.completed ? 'line-through' : 'none',
                                color: task.completed ? '#73747B' : '#282E3A',
                                fontWeight: 500,
                                fontSize: '15px',
                                fontFamily: 'Inter, sans-serif',
                              }}>
                                {task.title}
                              </span>
                              
                              {task.foh_employees && (
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: '#73747B',
                                  backgroundColor: '#FEFFF1',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontFamily: 'Inter, sans-serif',
                                }}>
                                  {task.foh_employees.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {index < categoryTasks.length - 1 && (
                            <div style={{ height: '1px', backgroundColor: 'rgba(197, 197, 202, 0.3)' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {Object.entries(groupTasksByCategory(currentTasks)).map(([category, categoryTasks]) => (
                    <div key={category} style={{ marginBottom: '24px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#73747B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '12px',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {category}
                      </div>

                      {categoryTasks.map((task, index) => {
                        const dateLabel = getDateLabel(task.due_date);
                        const dateLabelColor = getDateLabelColor(task.due_date);
                        const priorityConfig = getPriorityConfig(task.priority);
                        const isPeriodic = !task.phase;
                        const isSwiped = swipedTaskId === task.id;

                        return (
                          <div key={task.id}>
                            <div 
                              style={{
                                padding: '14px 0',
                                opacity: task.completed ? 0.5 : 1,
                                transition: 'all 0.2s ease',
                                position: 'relative',
                                overflow: 'hidden',
                              }}
                              onTouchStart={isPeriodic ? handleTouchStart : undefined}
                              onTouchMove={isPeriodic ? (e) => handleTouchMove(e, task.id) : undefined}
                              onTouchEnd={isPeriodic ? handleTouchEnd : undefined}
                            >
                              {/* Delete button (shown on swipe for periodic tasks) */}
                              {isPeriodic && (
                                <div style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: '80px',
                                  backgroundColor: PolarColors.status.error,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transform: isSwiped ? 'translateX(0)' : 'translateX(100%)',
                                  transition: 'transform 0.2s ease',
                                }}>
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#FFFFFF',
                                      cursor: 'pointer',
                                      padding: '8px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontFamily: 'Inter, sans-serif',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}

                              {/* Task content */}
                              <div style={{
                                transform: `translateX(-${swipeOffset}px)`,
                                transition: swipeOffset === 0 ? 'transform 0.2s ease' : 'none',
                                backgroundColor: 'transparent',
                                position: 'relative',
                              }}>
                                <div style={{
                                  display: 'flex',
                                  gap: '12px',
                                  alignItems: 'flex-start',
                                }}>
                                  <div style={{ paddingTop: '2px' }}>
                                    <button
                                      onClick={() => toggleTask(task.id, task.completed)}
                                      style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: '1.5px solid rgba(197, 197, 202, 0.5)',
                                        backgroundColor: task.completed ? '#1B7867' : '#FFFFFF',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                        padding: 0,
                                      }}
                                    >
                                      {task.completed && (
                                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                          <path
                                            d="M1 5L4.5 8.5L11 1.5"
                                            stroke="#FFFFFF"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                  
                                  <span style={{
                                    flex: 1,
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    color: task.completed ? '#73747B' : '#282E3A',
                                    fontWeight: 500,
                                    fontSize: '15px',
                                    fontFamily: 'Inter, sans-serif',
                                  }}>
                                    {task.title}
                                  </span>

                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {task.estimated_minutes && (
                                      <span style={{
                                        fontSize: '11px',
                                        fontWeight: 400,
                                        color: '#73747B',
                                        opacity: 0.7,
                                        fontStyle: 'italic',
                                        fontFamily: 'Inter, sans-serif',
                                        whiteSpace: 'nowrap',
                                      }}>
                                        ~{task.estimated_minutes < 60 
                                          ? `${task.estimated_minutes}min` 
                                          : `${Math.floor(task.estimated_minutes / 60)}u${task.estimated_minutes % 60 > 0 ? ` ${task.estimated_minutes % 60}min` : ''}`}
                                      </span>
                                    )}
                                    
                                    <span style={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: dateLabelColor,
                                      backgroundColor: '#FEFFF1',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontFamily: 'Inter, sans-serif',
                                    }}>
                                      {dateLabel}
                                    </span>

                                    <div style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '2px',
                                      backgroundColor: priorityConfig.color,
                                    }} />

                                    {!task.phase && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTask(task.id);
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                                          e.currentTarget.style.borderColor = '#EF4444';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#FEFFF1';
                                          e.currentTarget.style.borderColor = 'rgba(197,197,202,0.5)';
                                        }}
                                        style={{
                                          width: '24px',
                                          height: '24px',
                                          borderRadius: '8px',
                                          border: '1px solid rgba(197,197,202,0.5)',
                                          backgroundColor: '#FEFFF1',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s ease',
                                          padding: 0,
                                        }}
                                        title="Verwijder taak"
                                      >
                                        <Trash2 size={14} style={{ color: '#EF4444' }} />
                                      </button>
                                    )}

                                    {task.foh_employees && (
                                      <span style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#73747B',
                                        backgroundColor: '#FEFFF1',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontFamily: 'Inter, sans-serif',
                                      }}>
                                        {task.foh_employees.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {index < categoryTasks.length - 1 && (
                              <div style={{ height: '1px', backgroundColor: 'rgba(197, 197, 202, 0.3)' }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}

              {currentTasks.length === 0 && (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontSize: '15px',
                    color: '#73747B',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Geen taken gevonden
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
