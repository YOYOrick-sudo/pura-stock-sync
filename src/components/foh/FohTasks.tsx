import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Check, ChevronsUpDown, Trash2, Info, Pencil, Settings, Shield, X, GripVertical, BookTemplate, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import type { FohTask, FohEmployee, FohTaskWithEmployee, PhaseType } from '@/types/foh';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useIsTablet } from '@/hooks/use-mobile';

import { PolarColors } from '@/components/polar/colors';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Phase time windows (minutes-based)
const PHASE_WINDOWS = [
  { phase: 'open' as const, label: 'Open', startMin: 8 * 60 + 30, endMin: 10 * 60 + 30 },
  { phase: 'tussen' as const, label: 'Tussen', startMin: 12 * 60, endMin: 18 * 60 },
  { phase: 'sluit' as const, label: 'Sluit', startMin: 20 * 60, endMin: 24 * 60 + 60 },
] as const;

// Category order for display
const CATEGORY_ORDER = ['Deel 1', 'Deel 2', 'Deel 3', 'Bar', 'Keuken', 'Zaal', 'Terras', 'Sanitair', 'Entree', 'Voorraad', 'Algemeen'] as const;

// Get available categories based on location and phase
const getAvailableCategoriesForPhase = (location: string, phase: string): string[] => {
  // Midsland - open
  if (location === 'Midsland' && phase === 'open') {
    return ['Deel 1', 'Deel 2', 'Deel 3'];
  }
  
  // Midsland - tussen
  if (location === 'Midsland' && phase === 'tussen') {
    return ['Binnen', 'Deel 1 - Bar Prep Check', 'Deel 2 - Bijvullen', 'Hygiëne', 'Overdracht', 'Terras'];
  }
  
  // Midsland - sluit
  if (location === 'Midsland' && phase === 'sluit') {
    return ['BAR', 'BIJVULLEN (FIFO)', 'BINNEN', 'HYGIENE', 'LAATSTE LOODJES', 'TERRAS'];
  }
  
  // Fallback voor andere locaties/fases
  return [...CATEGORY_ORDER];
};

// ===== SORTABLE TASK ITEM COMPONENT =====
interface SortableTaskItemProps {
  task: FohTaskWithEmployee;
  isEditMode: boolean;
  onTitleChange: (id: string, title: string) => void;
  onDescriptionChange?: (id: string, description: string) => void;
  onEstimatedMinutesChange?: (id: string, minutes: number | null) => void;
  onDelete: (id: string) => void;
  toggleTask?: (id: string, completed: boolean) => void;
  isDeleted: boolean;
  showAdminTools?: boolean;
  taskPadding?: string;
  taskNumber?: number;
  isNew?: boolean;
}

function SortableTaskItem({ task, isEditMode, onTitleChange, onDescriptionChange, onEstimatedMinutesChange, onDelete, toggleTask, isDeleted, showAdminTools = false, taskPadding = '14px 0', taskNumber, isNew = false }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(task.description || '');

  // Touch feedback state (tablet only)
  const isTablet = useIsTablet();
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isDeleted ? 0.3 : 1),
  };

  // Handle row click to toggle task (only when not in edit mode)
  const handleRowClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on buttons or inputs
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
      return;
    }
    if (!isEditMode && toggleTask && !isDeleted) {
      // Trigger ripple effect on tablet
      if (isTablet) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setRipple({ x, y });
        setTimeout(() => setRipple(null), 400);
      }
      toggleTask(task.id, task.completed);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={handleRowClick}
        className={cn(
          'border-b border-border/30 relative overflow-hidden transition-all duration-fast',
          task.completed ? 'bg-primary/[0.04]' : 'bg-transparent',
          isDeleted ? 'opacity-30' : (task.completed ? 'opacity-70' : 'opacity-100'),
          !isEditMode && toggleTask ? 'cursor-pointer hover:bg-primary/5' : 'cursor-default',
        )}
        style={{ padding: taskPadding }}
        onMouseEnter={(e) => {
          if (!isEditMode && toggleTask) {
            e.currentTarget.style.backgroundColor = task.completed
              ? 'rgba(27, 120, 103, 0.06)'
              : 'rgba(27, 120, 103, 0.05)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = task.completed
            ? 'rgba(27, 120, 103, 0.04)'
            : 'transparent';
        }}
        onMouseDown={(e) => {
          if (!isEditMode && toggleTask) {
            e.currentTarget.style.backgroundColor = 'rgba(27, 120, 103, 0.08)';
          }
        }}
        onMouseUp={(e) => {
          if (!isEditMode && toggleTask) {
            e.currentTarget.style.backgroundColor = task.completed
              ? 'rgba(27, 120, 103, 0.06)'
              : 'rgba(27, 120, 103, 0.05)';
          }
        }}
      >
        {/* Ripple effect for tablet */}
        {isTablet && ripple && (
          <span
            className="animate-ripple absolute rounded-full bg-primary/25 pointer-events-none"
            style={{
              left: ripple.x - 25,
              top: ripple.y - 25,
              width: 50,
              height: 50,
            }}
          />
        )}
        <div className="flex gap-3 items-center">
          {/* Drag Handle */}
          {isEditMode && !isDeleted && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab flex items-center justify-center w-6 h-6 min-w-[24px]"
            >
              <GripVertical size={18} className="text-muted-foreground opacity-50" />
            </div>
          )}

          {/* Checkbox - compact, whole row is clickable */}
          {!isEditMode && toggleTask && (
            <div className={cn(
              'w-5 h-5 min-w-[20px] rounded-md border-2 border-border/50 flex items-center justify-center transition-all duration-100 pointer-events-none',
              task.completed ? 'bg-primary' : 'bg-background',
            )}>
              {task.completed && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path
                    d="M1 5L4.5 8.5L11 1.5"
                    stroke="hsl(var(--primary-foreground))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Title - editable in edit mode */}
          <div className="flex items-center gap-2 flex-1">
            {isEditMode ? (
              <Input
                value={task.title}
                onChange={(e) => onTitleChange(task.id, e.target.value)}
                disabled={isDeleted}
                className={cn(
                  'flex-1 rounded-lg text-[15px] font-medium h-9',
                  isDeleted && 'line-through',
                )}
              />
            ) : (
              <span className={cn(
                'flex-1 flex items-center font-medium text-[15px]',
                toggleTask && task.completed ? 'line-through text-muted-foreground' : 'text-foreground',
              )}>
                {taskNumber != null && (
                  <span className="text-[hsl(var(--text-muted))] font-semibold mr-1.5 text-xs">
                    {taskNumber}.
                  </span>
                )}
                <span className="flex-1">{task.title}</span>
                {isNew && !isEditMode && (
                  <Sparkles size={14} className="text-warning ml-1.5 shrink-0" />
                )}
              </span>
            )}
          </div>

          {/* Time indicator & Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Time indicator - editable in edit mode */}
            {isEditMode ? (
              <Select
                value={task.estimated_minutes?.toString() || 'null'}
                onValueChange={(value) => {
                  if (onEstimatedMinutesChange) {
                    onEstimatedMinutesChange(task.id, value === 'null' ? null : parseInt(value));
                  }
                }}
                disabled={isDeleted}
              >
                <SelectTrigger className="w-20 h-7 text-xs rounded-md">
                  <SelectValue placeholder="Tijd" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Geen</SelectItem>
                  <SelectItem value="5">~5min</SelectItem>
                  <SelectItem value="10">~10min</SelectItem>
                  <SelectItem value="15">~15min</SelectItem>
                  <SelectItem value="20">~20min</SelectItem>
                  <SelectItem value="30">~30min</SelectItem>
                  <SelectItem value="45">~45min</SelectItem>
                  <SelectItem value="60">~60min</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              task.estimated_minutes && (
                <span className="text-[11px] font-medium text-muted-foreground bg-muted-foreground/[0.08] px-2 py-0.5 rounded">
                  ~{task.estimated_minutes}min
                </span>
              )
            )}

            {/* Info button - compact */}
            {!isEditMode && task.description && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDescription(true);
                }}
                className="w-[26px] h-[26px] min-w-[26px] rounded-sm border-1.5 border-primary/30 bg-secondary flex items-center justify-center p-0 cursor-pointer transition-all duration-fast"
                title="Bekijk info"
              >
                <Info size={16} className="text-primary" />
              </button>
            )}

            {/* Edit description button - compact */}
            {showAdminTools && !isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDescriptionValue(task.description || '');
                  setIsEditingDescription(true);
                }}
                className="w-6 h-6 min-w-[24px] rounded-md border border-border/50 bg-card flex items-center justify-center p-0 cursor-pointer transition-all duration-fast"
                title="Bewerk omschrijving"
              >
                <Pencil size={14} className="text-muted-foreground" />
              </button>
            )}

            {/* Delete button - compact */}
            {isEditMode && !isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="w-6 h-6 min-w-[24px] rounded-md border border-border/50 bg-card flex items-center justify-center p-0 cursor-pointer transition-all duration-fast hover:bg-destructive/10 hover:border-destructive"
                title="Verwijder taak"
              >
                <Trash2 size={14} className="text-destructive" />
              </button>
            )}
          </div>
        </div>

        {/* Description edit dialog */}
        {isEditingDescription && (
          <Dialog open={isEditingDescription} onOpenChange={setIsEditingDescription}>
            <DialogContent
              className="data-[state=open]:duration-300 data-[state=open]:ease-out data-[state=closed]:duration-200 bg-card border border-border/50 rounded-lg"
            >
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {showAdminTools ? 'Bewerk Omschrijving' : 'Taak Informatie'}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {showAdminTools && onDescriptionChange ? (
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Omschrijving (optioneel)"
                    rows={6}
                    className="rounded-lg whitespace-pre-wrap"
                  />
                ) : (
                  <div className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
                    {task.description || 'Geen omschrijving beschikbaar'}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingDescription(false)}
                  className="rounded-lg"
                >
                  {showAdminTools ? 'Annuleren' : 'Sluiten'}
                </Button>
                {showAdminTools && onDescriptionChange && (
                  <Button
                    onClick={() => {
                      onDescriptionChange(task.id, descriptionValue);
                      setIsEditingDescription(false);
                      toast.success('Omschrijving bijgewerkt');
                    }}
                    className="bg-primary text-primary-foreground rounded-lg"
                  >
                    Opslaan
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

// ===== HELPER FUNCTIONS =====
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

const groupTasksByCategory = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<string, FohTaskWithEmployee[]> = {};
  
  tasks.forEach(task => {
    const category = task.category || 'Algemeen';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(task);
  });
  
  const sortedGrouped: Record<string, FohTaskWithEmployee[]> = {};
  CATEGORY_ORDER.forEach(cat => {
    if (grouped[cat]) {
      // Sort by sort_order first, then move completed tasks to bottom
      sortedGrouped[cat] = grouped[cat].sort((a, b) => {
        // Completed tasks go to bottom
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Within same completion status, sort by sort_order
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        return 0;
      });
    }
  });
  
  Object.keys(grouped).forEach(cat => {
    if (!sortedGrouped[cat]) {
      // Also sort non-standard categories with completed at bottom
      sortedGrouped[cat] = grouped[cat].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return 0;
      });
    }
  });
  
  return sortedGrouped;
};

// Get category progress stats
const getCategoryProgress = (tasks: FohTaskWithEmployee[]) => {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  return { completed, total, allDone: completed === total && total > 0 };
};

const sortTasksInPhase = (tasks: FohTaskWithEmployee[]) => {
  return [...tasks].sort((a, b) => {
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order;
    }
    return 0;
  });
};

const sortExtraTasks = (tasks: FohTaskWithEmployee[]) => {
  return [...tasks].sort((a, b) => {
    const dateCompare = a.due_date.localeCompare(b.due_date);
    if (dateCompare !== 0) return dateCompare;
    return a.priority - b.priority;
  });
};

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

// Group tasks by day for periodic tasks view
const groupTasksByDay = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<string, FohTaskWithEmployee[]> = {};
  tasks.forEach(task => {
    const dateKey = task.due_date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  });
  // Sort by date
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
};

// Format day header for periodic tasks
const formatDayHeader = (dateString: string): string => {
  const TIMEZONE = 'Europe/Amsterdam';
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];
  
  if (dateString === todayDateStr) return 'Vandaag';
  if (dateString === tomorrowDateStr) return 'Morgen';
  
  if (dateString < todayDateStr) {
    // Calculate days overdue
    const dueDate = new Date(dateString + 'T12:00:00');
    const todayDate = new Date(todayDateStr + 'T12:00:00');
    const diffDays = Math.round((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Gisteren — 1 dag overtijd';
    return `${diffDays} dagen overtijd`;
  }
  
  // Format as "Maandag 23 dec"
  const date = new Date(dateString + 'T12:00:00');
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  return `${dayName} ${dayNum} ${monthName}`;
};

const getDateLabelColor = (dateString: string): string => {
  const TIMEZONE = 'Europe/Amsterdam';
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  
  if (dateString < todayDateStr) return 'hsl(var(--destructive))';
  if (dateString === todayDateStr) return 'hsl(var(--primary))';
  return 'hsl(var(--text-secondary))';
};

const getPriorityConfig = (priority: number) => {
  switch (priority) {
    case 1: return { color: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }; // High - Red
    case 3: return { color: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' }; // Low - Green
    default: return { color: 'hsl(var(--warning))', borderColor: 'hsl(var(--warning))' }; // Normal - Orange/Yellow
  }
};

// ===== MAIN COMPONENT =====
export function FohTasks() {
  const { userLocation } = useUserLocation();
  const queryClient = useQueryClient();
  const isTablet = useIsTablet();
  
  const [mainCategory, setMainCategory] = useState<'dagelijks' | 'periodiek'>('dagelijks');
  const [activePhase, setActivePhase] = useState<PhaseType>('open');
  const [isPhaseManuallySelected, setIsPhaseManuallySelected] = useState(false);
  
  const [dailyTasks, setDailyTasks] = useState<FohTaskWithEmployee[]>([]);
  const [extraTasks, setExtraTasks] = useState<FohTaskWithEmployee[]>([]);
  const [employees, setEmployees] = useState<FohEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 2 as 1 | 2 | 3,
    assigned_employee_id: null as string | null,
    category: 'Algemeen' as string,
    estimated_minutes: null as number | null,
  });
  
  // Task padding: slightly more on tablet
  const taskPadding = isTablet ? '18px 0' : '14px 0';
  const [employeeInput, setEmployeeInput] = useState('');
  const [employeeOpen, setEmployeeOpen] = useState(false);
  
  // Swipe state for delete functionality
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  // Admin panel states
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminTab, setAdminTab] = useState<'edit' | 'templates'>('templates');
  
  // Edit mode states (for Tab 1: Huidige Taken Bewerken)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTasks, setEditedTasks] = useState<FohTaskWithEmployee[]>([]);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [newTasks, setNewTasks] = useState<Array<{tempId: string, title: string, category: string}>>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  
  // Template management states (for Tab 2: Templates Beheren)
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any[]>([]);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [deletedTemplateTaskIds, setDeletedTemplateTaskIds] = useState<string[]>([]);
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateTaskInput, setNewTemplateTaskInput] = useState('');
  
  // Get available categories for current location and phase
  const availableCategories = getAvailableCategoriesForPhase(userLocation, activePhase);
  const [newTemplateTaskCategory, setNewTemplateTaskCategory] = useState(availableCategories[0] || 'Algemeen');
  
  // Fetch templates query
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['foh-templates', userLocation, activePhase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_daily_templates')
        .select('*')
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .in('repeat_type', ['daily', 'weekly'])
        .order('template_name')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: adminPanelOpen && adminTab === 'templates',
  });

  // Fetch template created_at dates for "new" indicator
  const { data: templateDates } = useQuery({
    queryKey: ['foh-template-dates', userLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_daily_templates')
        .select('id, created_at')
        .eq('location', userLocation)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userLocation,
  });

  // Map template_id → isNew (created less than 7 days ago)
  const newTemplateIds = new Set<string>();
  if (templateDates) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    for (const t of templateDates) {
      if (new Date(t.created_at) > sevenDaysAgo) {
        newTemplateIds.add(t.id);
      }
    }
  }

  // Group templates by name
  const groupedTemplates = templates?.reduce((acc, template) => {
    const name = template.template_name || 'Standaard';
    if (!acc[name]) {
      acc[name] = {
        name,
        tasks: [],
        isActive: false,
        lastModified: template.created_at,
      };
    }
    acc[name].tasks.push(template);
    if (template.is_active) {
      acc[name].isActive = true;
    }
    return acc;
  }, {} as Record<string, { name: string; tasks: any[]; isActive: boolean; lastModified: string }>);

  // ===== DATA FETCHING =====
  const generateDailyTasks = async () => {
    const todayDate = getAmsterdamDateString();
    
    // Fetch active daily templates
    const { data: dailyTemplates } = await supabase
      .from('foh_daily_templates')
      .select('*')
      .eq('location', userLocation)
      .eq('repeat_type', 'daily')
      .eq('is_active', true);
    
    // Fetch active weekly templates for today's day of week
    const amsterdamNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    const currentDayOfWeek = amsterdamNow.getDay(); // 0=Sun, 3=Wed, etc.
    
    const { data: weeklyTemplates } = await supabase
      .from('foh_daily_templates')
      .select('*')
      .eq('location', userLocation)
      .eq('repeat_type', 'weekly')
      .eq('day_of_week', currentDayOfWeek)
      .eq('is_active', true);
    
    const templates = [...(dailyTemplates || []), ...(weeklyTemplates || [])];
    if (templates.length === 0) return;
    
    const phases = ['open', 'tussen', 'sluit'] as const;
    const tasksToInsert: any[] = [];
    
    for (const phase of phases) {
      const { data: existingPhaseTasks } = await supabase
        .from('foh_tasks')
        .select('id')
        .eq('location', userLocation)
        .eq('due_date', todayDate)
        .eq('phase', phase)
        .limit(1);
      
      if (!existingPhaseTasks || existingPhaseTasks.length === 0) {
        const phaseTemplates = templates.filter(t => t.phase === phase);
        const phaseTasks = phaseTemplates.map(template => ({
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
          description: template.description,
        }));
        tasksToInsert.push(...phaseTasks);
      }
    }
    
    if (tasksToInsert.length > 0) {
      await supabase.from('foh_tasks').insert(tasksToInsert);
    }
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

  const shouldResetTasks = (): boolean => {
    const location = userLocation || 'West';
    const lastReset = localStorage.getItem(`lastTaskReset_${location}`);
    const now = new Date();
    const amsterdamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    
    if (!lastReset) return true;
    
    const lastResetDate = new Date(lastReset);
    const lastResetAmsterdam = new Date(lastResetDate.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    
    const currentHour = amsterdamTime.getHours();
    const lastResetDay = lastResetAmsterdam.toDateString();
    const currentDay = amsterdamTime.toDateString();
    
    if (currentDay !== lastResetDay && currentHour >= 4) {
      return true;
    }
    
    if (currentHour < 4) {
      const yesterday = new Date(amsterdamTime);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastResetDay === yesterday.toDateString()) {
        return false;
      }
    }
    
    return false;
  };

  const performClientSideReset = async () => {
    const location = userLocation || 'West';
    try {
      console.log(`[${location}] Performing client-side task reset...`);
      
      const todayDate = getAmsterdamDateString();
      
      const { error: archiveError } = await supabase
        .from('foh_tasks')
        .update({ archived: true })
        .eq('location', location)
        .lt('due_date', todayDate)
        .eq('archived', false)
        .not('phase', 'is', null);
      
      if (archiveError) {
        console.error('Error archiving old tasks:', archiveError);
        return;
      }
      
      await generateDailyTasks();
      
      localStorage.setItem(`lastTaskReset_${location}`, new Date().toISOString());
      console.log(`[${location}] Client-side reset completed`);
    } catch (error) {
      console.error('Error in client-side reset:', error);
    }
  };

  useEffect(() => {
    const initializeTasks = async () => {
      if (shouldResetTasks()) {
        await performClientSideReset();
      }
      
      await generateDailyTasks();
      await fetchDailyTasks();
      fetchExtraTasks();
      fetchEmployees();
    };
    
    initializeTasks();
  }, [userLocation]);
  
  // Auto phase-switching disabled to maintain task order consistency

  // ===== TASK ACTIONS =====
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

  const canSwitchToPhase = (targetPhase: PhaseType): boolean => {
    return true;
  };

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

  // ===== DRAG AND DROP =====
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setEditedTasks((tasks) => {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return tasks;
      
      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      
      return newTasks.map((task, idx) => ({
        ...task,
        sort_order: (idx + 1) * 10,
      }));
    });
  };

  const handleTemplateDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setEditingTemplate((tasks) => {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      
      if (oldIndex === -1 || newIndex === -1) return tasks;
      
      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      
      return newTasks.map((task, idx) => ({
        ...task,
        sort_order: (idx + 1) * 10,
      }));
    });
  };

  // ===== TAB 1: EDIT CURRENT TASKS =====
  const handleSaveCurrentTasks = async () => {
    try {
      for (const task of editedTasks) {
        if (deletedTaskIds.includes(task.id)) continue;
        
        const { error } = await supabase
          .from('foh_tasks')
          .update({
            title: task.title,
            sort_order: task.sort_order,
            category: task.category,
            description: task.description,
          })
          .eq('id', task.id);
        
        if (error) {
          console.error('Error updating task:', error);
          toast.error('Fout bij opslaan');
          return;
        }
      }
      
      if (deletedTaskIds.length > 0) {
        const { error } = await supabase
          .from('foh_tasks')
          .update({ archived: true })
          .in('id', deletedTaskIds);
        
        if (error) {
          console.error('Error deleting tasks:', error);
          toast.error('Fout bij verwijderen taken');
          return;
        }
      }
      
      if (newTasks.length > 0) {
        const maxSortOrder = Math.max(...editedTasks.map(t => t.sort_order || 0), 0);
        const tasksToInsert = newTasks.map((task, idx) => ({
          location: userLocation,
          phase: activePhase,
          title: task.title,
          category: task.category,
          due_date: getAmsterdamDateString(),
          priority: 2,
          sort_order: maxSortOrder + (idx + 1) * 10,
          completed: false,
          archived: false,
        }));
        
        const { error } = await supabase
          .from('foh_tasks')
          .insert(tasksToInsert);
        
        if (error) {
          console.error('Error inserting new tasks:', error);
          toast.error('Fout bij toevoegen taken');
          return;
        }
      }
      
      await fetchDailyTasks();
      setIsEditMode(false);
      setEditedTasks([]);
      setDeletedTaskIds([]);
      setNewTasks([]);
      setNewTaskInput('');
      toast.success('Wijzigingen opgeslagen');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Fout bij opslaan');
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      const currentPhaseTasks = getCurrentTasks().filter(t => !t.archived);
      
      if (currentPhaseTasks.length === 0) {
        toast.error('Geen taken om op te slaan als template');
        return;
      }
      
      // Get the current active template name
      const { data: activeTemplates } = await supabase
        .from('foh_daily_templates')
        .select('template_name')
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('is_active', true)
        .limit(1);
      
      const currentTemplateName = activeTemplates?.[0]?.template_name || `Standaard ${activePhase === 'open' ? 'Openlijst' : activePhase === 'tussen' ? 'Tussenlijst' : 'Sluitlijst'}`;
      
      // Delete old templates with this name
      const { error: deleteError } = await supabase
        .from('foh_daily_templates')
        .delete()
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('template_name', currentTemplateName)
        .eq('repeat_type', 'daily');
      
      if (deleteError) {
        console.error('Error deleting old templates:', deleteError);
        toast.error('Fout bij verwijderen oude template');
        return;
      }
      
      const templatesToInsert = currentPhaseTasks.map(task => ({
        location: task.location,
        phase: task.phase,
        title: task.title,
        category: task.category,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        sort_order: task.sort_order,
        description: task.description,
        repeat_type: 'daily',
        template_name: currentTemplateName,
        is_active: true,
      }));
      
      const { error: insertError } = await supabase
        .from('foh_daily_templates')
        .insert(templatesToInsert);
      
      if (insertError) {
        console.error('Error inserting templates:', insertError);
        toast.error('Fout bij opslaan template');
        return;
      }
      
      toast.success(`Template "${currentTemplateName}" bijgewerkt`);
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Fout bij opslaan template');
    }
  };

  // ===== TAB 2: TEMPLATE MANAGEMENT =====
  const handleMakeTemplateActive = async (templateName: string) => {
    try {
      // Set all other templates for this phase to inactive
      const { error: deactivateError } = await supabase
        .from('foh_daily_templates')
        .update({ is_active: false })
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .neq('template_name', templateName);
      
      if (deactivateError) throw deactivateError;
      
      // Set selected template to active
      const { error: activateError } = await supabase
        .from('foh_daily_templates')
        .update({ is_active: true })
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('template_name', templateName);
      
      if (activateError) throw activateError;
      
      toast.success(`Template "${templateName}" is nu actief`);
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
      await generateDailyTasks();
      await fetchDailyTasks();
    } catch (error) {
      console.error('Error activating template:', error);
      toast.error('Fout bij activeren template');
    }
  };

  const handleCreateNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Template naam is verplicht');
      return;
    }
    
    try {
      // Check if name already exists
      const { data: existing } = await supabase
        .from('foh_daily_templates')
        .select('id')
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('template_name', newTemplateName.trim())
        .limit(1);
      
      if (existing && existing.length > 0) {
        toast.error('Template naam bestaat al');
        return;
      }
      
      // Create from current daily tasks
      const currentPhaseTasks = getCurrentTasks().filter(t => !t.archived);
      
      if (currentPhaseTasks.length === 0) {
        // Create empty template
        const { error } = await supabase
          .from('foh_daily_templates')
          .insert({
            location: userLocation,
            phase: activePhase,
            title: 'Nieuwe taak',
            category: 'Algemeen',
            priority: 2,
            repeat_type: 'daily',
            template_name: newTemplateName.trim(),
            is_active: false,
            sort_order: 10,
          });
        
        if (error) throw error;
      } else {
        // Copy current tasks
        const templatesToInsert = currentPhaseTasks.map(task => ({
          location: task.location,
          phase: task.phase,
          title: task.title,
          category: task.category,
          priority: task.priority,
          estimated_minutes: task.estimated_minutes,
          sort_order: task.sort_order,
          description: task.description,
          repeat_type: 'daily',
          template_name: newTemplateName.trim(),
          is_active: false,
        }));
        
        const { error } = await supabase
          .from('foh_daily_templates')
          .insert(templatesToInsert);
        
        if (error) throw error;
      }
      
      toast.success(`Template "${newTemplateName.trim()}" aangemaakt`);
      setNewTemplateDialogOpen(false);
      setNewTemplateName('');
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Fout bij aanmaken template');
    }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    // Check if it's the active template
    const template = groupedTemplates?.[templateName];
    if (template?.isActive) {
      toast.error('Kan actieve template niet verwijderen');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('foh_daily_templates')
        .delete()
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('template_name', templateName);
      
      if (error) throw error;
      
      toast.success(`Template "${templateName}" verwijderd`);
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
      setSelectedTemplateName('');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Fout bij verwijderen template');
    }
  };

  const handleOpenTemplateEditor = (templateName: string) => {
    const template = groupedTemplates?.[templateName];
    if (template) {
      setEditingTemplate(template.tasks);
      setEditingTemplateName(templateName);
      setDeletedTemplateTaskIds([]);
      setTemplateEditorOpen(true);
    }
  };

  const handleAddTemplateTask = () => {
    if (!newTemplateTaskInput.trim()) {
      toast.error('Vul een taaknaam in');
      return;
    }
    
    const maxSortOrder = Math.max(...editingTemplate.map(t => t.sort_order || 0), 0);
    const tempId = `temp-${Date.now()}`;
    
    const newTask = {
      id: tempId,
      title: newTemplateTaskInput,
      category: newTemplateTaskCategory,
      sort_order: maxSortOrder + 10,
      estimated_minutes: null,
      description: null,
      phase: editingTemplate[0]?.phase || activePhase,
      location: editingTemplate[0]?.location || userLocation,
      priority: 2,
      repeat_type: 'daily',
      template_name: editingTemplateName,
      is_active: true,
      isNew: true,
    };
    
    setEditingTemplate(prev => [...prev, newTask]);
    setNewTemplateTaskInput('');
    toast.success('Taak toegevoegd');
  };

  const handleSaveTemplateEdits = async () => {
    try {
      // Update existing template tasks
      for (const task of editingTemplate) {
        if (deletedTemplateTaskIds.includes(task.id)) continue;
        if (task.isNew) continue; // Skip new tasks in this loop
        
        const { error } = await supabase
          .from('foh_daily_templates')
          .update({
            title: task.title,
            sort_order: task.sort_order,
            category: task.category,
            description: task.description,
            estimated_minutes: task.estimated_minutes,
          })
          .eq('id', task.id);
        
        if (error) {
          console.error('Error updating template task:', error);
          toast.error('Fout bij opslaan');
          return;
        }
      }
      
      // Insert new template tasks
      const newTasks = editingTemplate.filter(t => t.isNew);
      for (const task of newTasks) {
        const { error } = await supabase
          .from('foh_daily_templates')
          .insert({
            location: task.location,
            phase: task.phase,
            title: task.title,
            priority: task.priority,
            category: task.category,
            repeat_type: task.repeat_type,
            template_name: task.template_name,
            is_active: task.is_active,
            estimated_minutes: task.estimated_minutes,
            sort_order: task.sort_order,
            description: task.description,
          });
        
        if (error) {
          console.error('Error inserting new template task:', error);
          toast.error('Fout bij toevoegen nieuwe taak');
          return;
        }
      }
      
      // Delete removed tasks
      if (deletedTemplateTaskIds.length > 0) {
        const { error } = await supabase
          .from('foh_daily_templates')
          .delete()
          .in('id', deletedTemplateTaskIds);
        
        if (error) {
          console.error('Error deleting template tasks:', error);
          toast.error('Fout bij verwijderen taken');
          return;
        }
      }
      
      toast.success('Template opgeslagen');
      setTemplateEditorOpen(false);
      setNewTemplateTaskInput('');
      setNewTemplateTaskCategory('Algemeen');
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    } catch (error) {
      console.error('Error saving template edits:', error);
      toast.error('Fout bij opslaan');
    }
  };

  // ===== SWIPE HANDLERS =====
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, taskId: string) => {
    setTouchEnd(e.targetTouches[0].clientX);
    const diff = touchStart - e.targetTouches[0].clientX;
    
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
    
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

  // ===== PROCESS TASKS FOR DISPLAY =====
  const sortedExtraTasks = sortExtraTasks(extraTasks);
  
  const groupedDailyTasks = (() => {
    const grouped = groupTasksByPhase(dailyTasks);
    (Object.keys(grouped) as PhaseType[]).forEach(phase => {
      grouped[phase] = sortTasksInPhase(grouped[phase]);
    });
    return grouped;
  })();

  const getCurrentTasks = () => {
    if (mainCategory === 'dagelijks') {
      return groupedDailyTasks[activePhase];
    } else {
      return sortedExtraTasks;
    }
  };

  const getCurrentSectionStats = () => {
    let tasks: FohTaskWithEmployee[] = [];
    
    if (mainCategory === 'dagelijks') {
      tasks = groupedDailyTasks[activePhase];
    } else {
      tasks = sortedExtraTasks;
    }
    
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isComplete = percentage === 100;
    
    return { completed, total, percentage, isComplete };
  };

  const { completed: completedCount, total: totalCount, percentage: progressPercentage, isComplete } = getCurrentSectionStats();

  const getDailyListStats = (phase: PhaseType) => {
    const listTasks = groupedDailyTasks[phase];
    const completed = listTasks.filter(t => t.completed).length;
    const total = listTasks.length;
    return { completed, total };
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentTasks = isEditMode ? editedTasks : getCurrentTasks();
  const groupedCurrentTasks = groupTasksByCategory(currentTasks);

  return (
    <div className="min-h-screen bg-card">
      <div className="max-w-[1400px] mx-auto">
      <div className="bg-muted rounded-lg border border-border/50 p-6 shadow-sm relative">
          <div className="flex flex-col gap-5">

          {/* Single row with all buttons */}
          <div className="flex gap-3 items-center">
              
              {/* Dagelijks phase buttons */}
              {(['open', 'tussen', 'sluit'] as PhaseType[]).map((phase) => {
                const stats = getDailyListStats(phase);
                const isActive = mainCategory === 'dagelijks' && activePhase === phase;
                const labels = { open: 'Open', tussen: 'Tussen', sluit: 'Sluit' };
                
                return (
                  <button
                    key={phase}
                onClick={() => {
                  setMainCategory('dagelijks');
                  setActivePhase(phase);
                  setIsPhaseManuallySelected(true);
                }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 text-[15px] font-medium py-3.5 px-5 rounded-lg cursor-pointer transition-all duration-fast',
                      isActive
                        ? 'bg-primary text-primary-foreground border-none'
                        : 'bg-card text-foreground border border-border/50 hover:bg-muted hover:shadow-sm',
                    )}
                  >
                    <span>{labels[phase]}</span>
                    <span className={cn(
                      'text-xs font-semibold py-1 px-2.5 rounded-md min-w-[40px]',
                      isActive
                        ? 'bg-white/25 text-primary-foreground'
                        : 'bg-black/[0.04] text-muted-foreground',
                    )}>
                      {stats.completed}/{stats.total}
                    </span>
                  </button>
                );
              })}
              
            {/* Visual separator */}
            <div className="w-px h-8 bg-border/50 mx-5" />
              
              {/* Periodiek button */}
              {(() => {
                const completed = extraTasks.filter(t => t.completed).length;
                const total = extraTasks.length;
                const isActive = mainCategory === 'periodiek';
                
                return (
                  <button
                    onClick={() => {
                      setMainCategory('periodiek');
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 text-[15px] font-medium py-3.5 px-5 rounded-lg cursor-pointer transition-all duration-fast',
                      isActive
                        ? 'bg-primary text-primary-foreground border-none'
                        : 'bg-card text-foreground border border-border/50 hover:bg-muted hover:shadow-sm',
                    )}
                  >
                    <span>Periodiek</span>
                    <span className={cn(
                      'text-xs font-semibold py-1 px-2.5 rounded-md min-w-[40px]',
                      isActive
                        ? 'bg-white/25 text-primary-foreground'
                        : 'bg-black/[0.04] text-muted-foreground',
                    )}>
                      {completed}/{total}
                    </span>
                  </button>
                );
              })()}

            </div>

            <hr className="border-none border-t border-border/50 m-0" />

            {/* Full-width progress bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="h-2 bg-card rounded overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-muted-foreground">
                    {completedCount}/{totalCount}
                  </span>
                  <span className={cn(
                    'font-semibold text-[17px]',
                    isComplete ? 'text-primary' : 'text-foreground',
                  )}>
                    {progressPercentage}%
                  </span>
                </div>

                {/* Admin Button */}
                <button
                  onClick={() => setPasswordDialogOpen(true)}
                  className="flex items-center gap-2 py-3 px-5 bg-card text-primary border border-border/50 rounded-lg text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-muted hover:border-border/70"
                >
                  <Settings size={18} />
                  Admin
                </button>

                {/* New Task Button - only for periodiek */}
                {mainCategory === 'periodiek' && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        className="w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground border border-white/20 rounded-md cursor-pointer shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md active:scale-95"
                      >
                        <Plus size={24} />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border border-border/50 rounded-lg">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">
                          Nieuwe Periodieke Taak
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-4">
                        {/* Essential fields - always visible */}
                        <div>
                          <Label className="text-xs font-medium text-foreground">
                            Titel *
                          </Label>
                          <Input
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="Bijv. Voorraad tellen"
                            className="mt-1.5 rounded-lg"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium text-foreground">
                            Vervaldatum *
                          </Label>
                          <Input
                            type="date"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                            className="mt-1.5 rounded-lg"
                          />
                        </div>

                        {/* Toggle for advanced options */}
                        <button
                          type="button"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          className="flex items-center justify-center gap-1.5 p-2.5 bg-transparent border border-border/50 rounded-md cursor-pointer text-xs font-medium text-muted-foreground transition-all duration-fast"
                        >
                          {showAdvancedOptions ? (
                            <>
                              <ChevronUp size={16} />
                              Minder opties
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              Meer opties
                            </>
                          )}
                        </button>

                        {/* Advanced options - hidden by default */}
                        {showAdvancedOptions && (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-medium text-foreground">
                                  Prioriteit
                                </Label>
                                <div className="flex gap-2 mt-1.5">
                                  {[
                                    { value: 1, label: 'Hoog', color: PolarColors.status.error },
                                    { value: 2, label: 'Normaal', color: PolarColors.status.pending },
                                    { value: 3, label: 'Laag', color: PolarColors.status.success },
                                  ].map(({ value, label, color }) => (
                                    <button
                                      key={value}
                                      onClick={() => setNewTask({ ...newTask, priority: value as 1 | 2 | 3 })}
                                      className="flex-1 p-2 rounded-sm text-xs font-medium text-foreground cursor-pointer transition-all duration-fast"
                                      style={{
                                        border: newTask.priority === value ? `2px solid ${color}` : '1px solid rgba(197,197,202,0.5)',
                                        backgroundColor: newTask.priority === value ? `${color}15` : 'hsl(var(--card))',
                                      }}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-medium text-foreground">
                                  Categorie
                                </Label>
                                <Select value={newTask.category} onValueChange={(val) => setNewTask({ ...newTask, category: val })}>
                                  <SelectTrigger className="mt-1.5 rounded-lg">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableCategoriesForPhase(userLocation, 'periodiek').map(cat => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs font-medium text-foreground">
                                Geschatte tijd
                              </Label>
                              <Select
                                value={newTask.estimated_minutes?.toString() || ''}
                                onValueChange={(val) => setNewTask({ ...newTask, estimated_minutes: val ? parseInt(val) : null })}
                              >
                                <SelectTrigger className="mt-1.5 rounded-lg">
                                  <SelectValue placeholder="Selecteer..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5 min</SelectItem>
                                  <SelectItem value="10">10 min</SelectItem>
                                  <SelectItem value="15">15 min</SelectItem>
                                  <SelectItem value="20">20 min</SelectItem>
                                  <SelectItem value="30">30 min</SelectItem>
                                  <SelectItem value="45">45 min</SelectItem>
                                  <SelectItem value="60">60 min</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs font-medium text-foreground">
                                Medewerker
                              </Label>
                              <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeOpen}
                                    className="w-full justify-between mt-1.5 rounded-lg"
                                  >
                                    {newTask.assigned_employee_id
                                      ? employees.find((e) => e.id === newTask.assigned_employee_id)?.name
                                      : "Selecteer medewerker..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                  <Command>
                                    <CommandInput
                                      placeholder="Zoek medewerker..."
                                      value={employeeInput}
                                      onValueChange={setEmployeeInput}
                                    />
                                    <CommandList>
                                      <CommandEmpty>Geen medewerkers gevonden</CommandEmpty>
                                      <CommandGroup>
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
                                      {shouldShowAddNew && (
                                        <>
                                          <CommandSeparator />
                                          <CommandGroup>
                                            <CommandItem onSelect={handleAddNewEmployee}>
                                              <Plus className="mr-2 h-4 w-4" />
                                              Voeg "{employeeInput}" toe
                                            </CommandItem>
                                          </CommandGroup>
                                        </>
                                      )}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </>
                        )}
                      </div>
                      <DialogFooter>
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
                          className="rounded-lg"
                        >
                          Annuleren
                        </Button>
                        <Button
                          onClick={createTask}
                          className="bg-primary text-primary-foreground rounded-lg"
                        >
                          Toevoegen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
              </div>
            </div>

            <hr className="border-none border-t border-border/50 m-0" />

            {/* Tasks display */}
            <div>
              {mainCategory === 'dagelijks' && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div>
                    {Object.entries(groupedCurrentTasks).map(([category, categoryTasks]) => {
                      const progress = getCategoryProgress(categoryTasks);
                      return (
                        <div key={category} className="mb-6">
                          <h3 className={cn(
                            'text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2',
                            progress.allDone ? 'text-primary' : 'text-muted-foreground',
                          )}>
                            {category}
                            <span className={cn(
                              'text-[11px] font-medium py-0.5 px-1.5 rounded',
                              progress.allDone
                                ? 'text-primary bg-primary/10'
                                : 'text-[hsl(var(--text-muted))] bg-[hsl(var(--text-muted)/0.1)]',
                            )}>
                              {progress.completed}/{progress.total}
                            </span>
                          </h3>
                          <div className="border-b border-border/30 pb-4">
                            {progress.allDone ? (
                              <div className="p-5 text-center text-primary text-sm font-medium animate-[fade-in_0.3s_ease-out]">
                                🎉 Alle taken voltooid!
                              </div>
                            ) : (
                              <SortableContext items={categoryTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                {categoryTasks.map((task, index) => (
                                  <SortableTaskItem
                                    key={task.id}
                                    task={task}
                                    taskNumber={index + 1}
                                    isEditMode={isEditMode}
                                    onTitleChange={(id, title) => {
                                      setEditedTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t));
                                    }}
                                    onDescriptionChange={(id, description) => {
                                      setEditedTasks(prev => prev.map(t => t.id === id ? { ...t, description } : t));
                                    }}
                                    onEstimatedMinutesChange={(id, minutes) => {
                                      setEditedTasks(prev => prev.map(t => t.id === id ? { ...t, estimated_minutes: minutes } : t));
                                    }}
                                    onDelete={(id) => {
                                      setDeletedTaskIds(prev => [...prev, id]);
                                    }}
                                    toggleTask={!isEditMode ? toggleTask : undefined}
                                    isDeleted={deletedTaskIds.includes(task.id)}
                                    showAdminTools={false}
                                    taskPadding={taskPadding}
                                    isNew={!!task.template_id && newTemplateIds.has(task.template_id)}
                                  />
                                ))}
                              </SortableContext>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DndContext>
              )}

              {mainCategory === 'periodiek' && (
                <div>
                  {groupTasksByDay(sortedExtraTasks).map(([dateKey, tasksForDay]) => (
                    <div key={dateKey} className="mb-5">
                      {/* Day header */}
                      <h3
                        className="text-xs font-semibold uppercase tracking-wide mb-2 mt-4"
                        style={{ color: getDateLabelColor(dateKey) }}
                      >
                        {formatDayHeader(dateKey)}
                      </h3>
                      
                      {/* Tasks for this day */}
                      {tasksForDay.map(task => (
                        <div key={task.id}>
                          <div
                            className="relative"
                            style={{
                              transform: swipedTaskId === task.id ? `translateX(-${swipeOffset}px)` : 'none',
                              transition: touchStart === 0 ? 'transform 0.3s ease' : 'none',
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={(e) => handleTouchMove(e, task.id)}
                            onTouchEnd={handleTouchEnd}
                          >
                            <div
                              onClick={() => toggleTask(task.id, task.completed)}
                              className={cn(
                                'border-b border-border/30 -ml-1 pl-3 cursor-pointer transition-all duration-fast',
                                task.completed ? 'bg-primary/[0.04] opacity-70' : 'bg-transparent opacity-100',
                              )}
                              style={{
                                padding: taskPadding,
                                borderLeft: `4px solid ${getPriorityConfig(task.priority).borderColor}`,
                                paddingLeft: '12px',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = task.completed
                                  ? 'rgba(27, 120, 103, 0.06)'
                                  : 'rgba(27, 120, 103, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = task.completed
                                  ? 'rgba(27, 120, 103, 0.04)'
                                  : 'transparent';
                              }}
                            >
                              <div className="flex gap-3 items-center">
                                {/* Checkbox - compact, row is clickable */}
                                <div className={cn(
                                  'w-5 h-5 min-w-[20px] rounded-md border-2 border-border/50 flex items-center justify-center transition-all duration-100 pointer-events-none',
                                  task.completed ? 'bg-primary' : 'bg-background',
                                )}>
                                  {task.completed && (
                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                      <path
                                        d="M1 5L4.5 8.5L11 1.5"
                                        stroke="hsl(var(--primary-foreground))"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-1">
                                  <span className={cn(
                                    'flex-1 font-medium text-[15px]',
                                    task.completed ? 'line-through text-muted-foreground' : 'text-foreground',
                                  )}>
                                    {task.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Delete button - compact */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task.id);
                                    }}
                                    className="w-6 h-6 min-w-[24px] rounded-md border border-border/50 bg-card flex items-center justify-center p-0 cursor-pointer transition-all duration-fast hover:bg-destructive/15 hover:border-destructive"
                                    title="Verwijder taak"
                                  >
                                    <Trash2 size={14} className="text-destructive" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {swipedTaskId === task.id && (
                              <div className="absolute right-0 top-0 h-full w-20 flex items-center justify-center">
                                <button
                                  onClick={() => {
                                    deleteTask(task.id);
                                  }}
                                  className="bg-destructive text-primary-foreground border-none py-2 px-4 rounded-sm cursor-pointer text-xs font-medium"
                                >
                                  Verwijder
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit mode controls */}
              {isEditMode && mainCategory === 'dagelijks' && (
                <div className="mt-6 flex flex-col gap-4">
                  {/* Add new task */}
                  <div className="flex gap-2">
                    <Input
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="Nieuwe taak toevoegen..."
                      className="flex-1 rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTaskInput.trim()) {
                          setNewTasks(prev => [...prev, {
                            tempId: `temp-${Date.now()}`,
                            title: newTaskInput.trim(),
                            category: 'Algemeen',
                          }]);
                          setNewTaskInput('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newTaskInput.trim()) {
                          setNewTasks(prev => [...prev, {
                            tempId: `temp-${Date.now()}`,
                            title: newTaskInput.trim(),
                            category: 'Algemeen',
                          }]);
                          setNewTaskInput('');
                        }
                      }}
                      className="bg-primary text-primary-foreground rounded-lg"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  {/* New tasks preview */}
                  {newTasks.length > 0 && (
                    <div className="p-3 bg-muted rounded-md border border-border/50">
                      <div className="text-xs font-semibold text-muted-foreground mb-2">
                        Nieuwe taken ({newTasks.length}):
                      </div>
                      {newTasks.map(task => (
                        <div key={task.tempId} className="p-2 flex justify-between items-center">
                          <span className="text-sm text-foreground">
                            {task.title}
                          </span>
                          <button
                            onClick={() => {
                              setNewTasks(prev => prev.filter(t => t.tempId !== task.tempId));
                            }}
                            className="p-1 bg-transparent border-none cursor-pointer text-destructive"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false);
                        setEditedTasks([]);
                        setDeletedTaskIds([]);
                        setNewTasks([]);
                        setNewTaskInput('');
                      }}
                      className="flex-1 rounded-lg"
                    >
                      Annuleren
                    </Button>
                    <Button
                      onClick={handleSaveCurrentTasks}
                      className="flex-1 bg-primary text-primary-foreground rounded-lg"
                    >
                      Opslaan
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleSaveAsTemplate}
                    className="w-full rounded-lg border-primary text-primary"
                  >
                    <BookTemplate size={16} className="mr-2" />
                    Opslaan als template
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-card border border-border/50 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Admin Toegang
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Voer wachtwoord in"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && passwordInput === '0000') {
                  setAdminPanelOpen(true);
                  setPasswordDialogOpen(false);
                  setPasswordInput('');
                  toast.success('Admin panel geopend');
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setPasswordInput('');
              }}
              className="rounded-lg"
            >
              Annuleren
            </Button>
            <Button
              onClick={() => {
                if (passwordInput === '0000') {
                  setAdminPanelOpen(true);
                  setPasswordDialogOpen(false);
                  setPasswordInput('');
                  toast.success('Admin panel geopend');
                } else {
                  toast.error('Onjuist wachtwoord');
                }
              }}
              className="bg-primary text-primary-foreground rounded-lg"
            >
              Bevestigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Panel Dialog */}
      <Dialog open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
        <DialogContent className="bg-card border border-border/50 rounded-lg max-w-[650px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              Admin Panel
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-col gap-5">
              <p className="text-sm text-muted-foreground">
                Beheer templates voor {activePhase === 'open' ? 'Openlijst' : activePhase === 'tussen' ? 'Tussenlijst' : 'Sluitlijst'}.
              </p>

              {/* Create new template button */}
              <Button
                onClick={() => setNewTemplateDialogOpen(true)}
                className="bg-primary text-primary-foreground rounded-lg"
              >
                <Plus size={16} className="mr-2" />
                Nieuwe Template
              </Button>

              {/* Template list */}
              {templatesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : groupedTemplates && Object.keys(groupedTemplates).length > 0 ? (
                <div className="flex flex-col gap-3">
                  {Object.values(groupedTemplates).map(template => (
                    <div
                      key={template.name}
                      className={cn(
                        'p-4 bg-muted rounded-md',
                        template.isActive ? 'border-2 border-primary' : 'border border-border/50',
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-semibold text-foreground m-0">
                              {template.name}
                            </h4>
                            {template.isActive && (
                              <span className="text-[11px] font-semibold py-0.5 px-2 rounded bg-primary text-primary-foreground">
                                ACTIEF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 mb-0">
                            {template.tasks.length} taken
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {!template.isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleMakeTemplateActive(template.name)}
                            className="bg-primary text-primary-foreground rounded-md text-xs"
                          >
                            <Check size={14} className="mr-1" />
                            Maak Actief
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTemplateEditor(template.name)}
                          className="rounded-md text-xs"
                        >
                          <Pencil size={14} className="mr-1" />
                          Bewerk Template
                        </Button>

                        {!template.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je template "${template.name}" wilt verwijderen?`)) {
                                handleDeleteTemplate(template.name);
                              }
                            }}
                            className="rounded-md text-xs border-destructive text-destructive"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Verwijder
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Geen templates gevonden
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdminPanelOpen(false)}
              className="rounded-lg"
            >
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
        <DialogContent className="bg-card border border-border/50 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Nieuwe Template Aanmaken
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-xs font-medium text-foreground">
              Template Naam *
            </Label>
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Bijv. Zomer Openlijst"
              className="mt-1.5 rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-2">
              De template wordt aangemaakt op basis van de huidige taken voor {activePhase === 'open' ? 'Open' : activePhase === 'tussen' ? 'Tussen' : 'Sluit'}.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewTemplateDialogOpen(false);
                setNewTemplateName('');
              }}
              className="rounded-lg"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleCreateNewTemplate}
              className="bg-primary text-primary-foreground rounded-lg"
            >
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
        <DialogContent className="bg-card border border-border/50 rounded-lg max-w-[650px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Bewerk Template: {editingTemplateName}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTemplateDragEnd}
            >
              <SortableContext items={editingTemplate.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {editingTemplate.map(task => (
                  <SortableTaskItem
                    key={task.id}
                    task={task as any}
                    isEditMode={true}
                    onTitleChange={(id, title) => {
                      setEditingTemplate(prev => prev.map(t => t.id === id ? { ...t, title } : t));
                    }}
                    onDescriptionChange={(id, description) => {
                      setEditingTemplate(prev => prev.map(t => t.id === id ? { ...t, description } : t));
                    }}
                    onEstimatedMinutesChange={(id, minutes) => {
                      setEditingTemplate(prev => prev.map(t => t.id === id ? { ...t, estimated_minutes: minutes } : t));
                    }}
                    onDelete={(id) => {
                      setDeletedTemplateTaskIds(prev => [...prev, id]);
                    }}
                    isDeleted={deletedTemplateTaskIds.includes(task.id)}
                    showAdminTools={true}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add task section */}
            <div className="p-4 border-t border-border/30 mt-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Nieuwe taak toevoegen
                  </label>
                  <Input
                    value={newTemplateTaskInput}
                    onChange={(e) => setNewTemplateTaskInput(e.target.value)}
                    placeholder="Taaknaam..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddTemplateTask();
                    }}
                    className="rounded-lg"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Categorie
                  </label>
                  <Select value={newTemplateTaskCategory} onValueChange={setNewTemplateTaskCategory}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableCategoriesForPhase(userLocation, activePhase).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddTemplateTask}
                  className="bg-primary text-primary-foreground rounded-lg min-w-[100px]"
                >
                  <Plus size={16} className="mr-1" />
                  Toevoegen
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTemplateEditorOpen(false);
                setEditingTemplate([]);
                setDeletedTemplateTaskIds([]);
              }}
              className="rounded-lg"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSaveTemplateEdits}
              className="bg-primary text-primary-foreground rounded-lg"
            >
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
