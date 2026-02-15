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
import { Loader2, Plus, Check, ChevronsUpDown, Trash2, Info, Pencil, Settings, Shield, X, GripVertical, BookTemplate, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import type { FohTask, FohEmployee, FohTaskWithEmployee, PhaseType } from '@/types/foh';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useIsTablet } from '@/hooks/use-mobile';


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
}

function SortableTaskItem({ task, isEditMode, onTitleChange, onDescriptionChange, onEstimatedMinutesChange, onDelete, toggleTask, isDeleted, showAdminTools = false, taskPadding = '14px 0' }: SortableTaskItemProps) {
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
  
  const isTablet = useIsTablet();
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isDeleted ? 0.3 : 1),
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) {
      return;
    }
    if (!isEditMode && toggleTask && !isDeleted) {
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
        style={{
          padding: taskPadding,
          opacity: isDeleted ? 0.3 : (task.completed ? 0.7 : 1),
          borderBottom: '1px solid #EAECF0',
          cursor: !isEditMode && toggleTask ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: task.completed ? '#FCFCFD' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isEditMode && toggleTask) {
            e.currentTarget.style.backgroundColor = task.completed 
              ? '#F8F9FA' 
              : '#FCFCFD';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = task.completed 
            ? '#FCFCFD' 
            : 'transparent';
        }}
        onMouseDown={(e) => {
          if (!isEditMode && toggleTask) {
            e.currentTarget.style.backgroundColor = '#F1F3F5';
          }
        }}
        onMouseUp={(e) => {
          if (!isEditMode && toggleTask) {
            e.currentTarget.style.backgroundColor = task.completed 
              ? '#F8F9FA' 
              : '#FCFCFD';
          }
        }}
      >
        {/* Ripple effect for tablet */}
        {isTablet && ripple && (
          <span
            className="animate-ripple"
            style={{
              position: 'absolute',
              left: ripple.x - 25,
              top: ripple.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--primary) / 0.25)',
              pointerEvents: 'none',
            }}
          />
        )}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          {/* Drag Handle */}
          {isEditMode && !isDeleted && (
            <div 
              {...attributes} 
              {...listeners}
              style={{
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                minWidth: '24px',
              }}
            >
              <GripVertical size={18} style={{ color: '#636878', opacity: 0.5 }} />
            </div>
          )}

          {/* Checkbox - v6.0: 16x16, radius 4px */}
          {!isEditMode && toggleTask && (
            <div style={{
              width: '16px',
              height: '16px',
              minWidth: '16px',
              borderRadius: '4px',
              border: '2px solid #C1C5CF',
              backgroundColor: task.completed ? '#E27726' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.1s ease',
              pointerEvents: 'none',
            }}>
              {task.completed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Title */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flex: 1 
          }}>
            {isEditMode ? (
              <Input
                value={task.title}
                onChange={(e) => onTitleChange(task.id, e.target.value)}
                disabled={isDeleted}
                style={{
                  flex: 1,
                  borderRadius: '14px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  height: '36px',
                  textDecoration: isDeleted ? 'line-through' : 'none',
                }}
              />
            ) : (
              <span style={{
                flex: 1,
                textDecoration: toggleTask && task.completed ? 'line-through' : 'none',
                color: toggleTask && task.completed ? '#636878' : '#282E3A',
                fontWeight: 500,
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {task.title}
              </span>
            )}
          </div>

          {/* Time indicator & Action buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            {/* Time indicator */}
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
                <SelectTrigger style={{
                  width: '80px',
                  height: '28px',
                  fontSize: '12px',
                  borderRadius: '12px',
                  fontFamily: 'Inter, sans-serif',
                }}>
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
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#636878',
                  backgroundColor: 'rgba(99, 104, 120, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  ~{task.estimated_minutes}min
                </span>
              )
            )}

            {/* Info button */}
            {!isEditMode && task.description && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDescription(true);
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  borderRadius: '6px',
                  border: '1px solid #D5D8E0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Bekijk info"
              >
                <Info size={14} style={{ color: '#E27726' }} />
              </button>
            )}

            {/* Edit description button */}
            {showAdminTools && !isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDescriptionValue(task.description || '');
                  setIsEditingDescription(true);
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  borderRadius: '6px',
                  border: '1px solid #D5D8E0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Bewerk omschrijving"
              >
                <Pencil size={14} style={{ color: '#636878' }} />
              </button>
            )}

            {/* Delete button */}
            {isEditMode && !isDeleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  minWidth: '24px',
                  borderRadius: '6px',
                  border: '1px solid #D5D8E0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Verwijder taak"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                  e.currentTarget.style.borderColor = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#D5D8E0';
                }}
              >
                <Trash2 size={14} style={{ color: '#EF4444' }} />
              </button>
            )}
          </div>
        </div>

        {/* Description edit dialog */}
        {isEditingDescription && (
          <Dialog open={isEditingDescription} onOpenChange={setIsEditingDescription}>
            <DialogContent style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D5D8E0',
              borderRadius: '24px',
              fontFamily: 'Inter, sans-serif',
            }}>
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: '#1A1F28' }}>
                  {showAdminTools ? 'Bewerk Omschrijving' : 'Taak Informatie'}
                </DialogTitle>
              </DialogHeader>
              <div style={{ padding: '16px 0' }}>
                {showAdminTools && onDescriptionChange ? (
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Omschrijving (optioneel)"
                    rows={6}
                    style={{
                      borderRadius: '14px',
                      fontFamily: 'Inter, sans-serif',
                      whiteSpace: 'pre-wrap',
                    }}
                  />
                ) : (
                  <div style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#303542',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                  }}>
                    {task.description || 'Geen omschrijving beschikbaar'}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingDescription(false)}
                  style={{
                    borderRadius: '16px',
                    fontFamily: 'Inter, sans-serif',
                  }}
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
                    style={{
                      backgroundColor: '#E27726',
                      color: '#FFFFFF',
                      borderRadius: '16px',
                      fontFamily: 'Inter, sans-serif',
                    }}
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
      sortedGrouped[cat] = grouped[cat].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        if (a.sort_order !== undefined && b.sort_order !== undefined) {
          return a.sort_order - b.sort_order;
        }
        return 0;
      });
    }
  });
  Object.keys(grouped).forEach(cat => {
    if (!sortedGrouped[cat]) {
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

const groupTasksByDay = (tasks: FohTaskWithEmployee[]) => {
  const grouped: Record<string, FohTaskWithEmployee[]> = {};
  tasks.forEach(task => {
    const dateKey = task.due_date;
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
};

const formatDayHeader = (dateString: string): string => {
  const TIMEZONE = 'Europe/Amsterdam';
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
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  return `${dayName} ${dayNum} ${monthName}`;
};

const getDateLabelColor = (dateString: string): string => {
  const TIMEZONE = 'Europe/Amsterdam';
  const today = toZonedTime(new Date(), TIMEZONE);
  const todayDateStr = today.toISOString().split('T')[0];
  if (dateString < todayDateStr) return '#DC2626';
  if (dateString === todayDateStr) return '#E27726';
  return '#636878';
};

const getPriorityConfig = (priority: number) => {
  switch (priority) {
    case 1: return { color: '#DC2626', borderColor: '#DC2626' }; // High - Red
    case 3: return { color: '#22C55E', borderColor: '#22C55E' }; // Low - Success green
    default: return { color: '#F59E0B', borderColor: '#F59E0B' }; // Normal - Warning
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
  
  const taskPadding = isTablet ? '18px 0' : '14px 0';
  const [employeeInput, setEmployeeInput] = useState('');
  const [employeeOpen, setEmployeeOpen] = useState(false);
  
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [adminTab, setAdminTab] = useState<'edit' | 'templates'>('templates');
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTasks, setEditedTasks] = useState<FohTaskWithEmployee[]>([]);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [newTasks, setNewTasks] = useState<Array<{tempId: string, title: string, category: string}>>([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any[]>([]);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [deletedTemplateTaskIds, setDeletedTemplateTaskIds] = useState<string[]>([]);
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateTaskInput, setNewTemplateTaskInput] = useState('');
  
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
        .eq('repeat_type', 'daily')
        .order('template_name')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: adminPanelOpen && adminTab === 'templates',
  });

  const groupedTemplates = templates?.reduce((acc, template) => {
    const name = template.template_name || 'Standaard';
    if (!acc[name]) {
      acc[name] = { name, tasks: [], isActive: false, lastModified: template.created_at };
    }
    acc[name].tasks.push(template);
    if (template.is_active) {
      acc[name].isActive = true;
    }
    return acc;
  }, {} as Record<string, { name: string; tasks: any[]; isActive: boolean; lastModified: string }>);

  // ===== DATA FETCHING (unchanged business logic) =====
  const generateDailyTasks = async () => {
    const todayDate = getAmsterdamDateString();
    const { data: templates } = await supabase
      .from('foh_daily_templates')
      .select('*')
      .eq('location', userLocation)
      .eq('repeat_type', 'daily')
      .eq('is_active', true);
    if (!templates || templates.length === 0) return;
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
    if (currentDay !== lastResetDay && currentHour >= 4) return true;
    if (currentHour < 4) {
      const yesterday = new Date(amsterdamTime);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastResetDay === yesterday.toDateString()) return false;
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
        .eq('archived', false);
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

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(employeeInput.toLowerCase())
  );
  
  const shouldShowAddNew = employeeInput.trim().length > 0 && 
    !filteredEmployees.some(e => e.name.toLowerCase() === employeeInput.toLowerCase());

  const createEmployeeInline = async (name: string) => {
    if (!name.trim()) return null;
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
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditedTasks((tasks) => {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return tasks;
      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      return newTasks.map((task, idx) => ({ ...task, sort_order: (idx + 1) * 10 }));
    });
  };

  const handleTemplateDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditingTemplate((tasks) => {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return tasks;
      const newTasks = [...tasks];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      return newTasks.map((task, idx) => ({ ...task, sort_order: (idx + 1) * 10 }));
    });
  };

  // ===== TAB 1: EDIT CURRENT TASKS =====
  const handleSaveCurrentTasks = async () => {
    try {
      for (const task of editedTasks) {
        if (deletedTaskIds.includes(task.id)) continue;
        const { error } = await supabase
          .from('foh_tasks')
          .update({ title: task.title, sort_order: task.sort_order, category: task.category, description: task.description })
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
        const { error } = await supabase.from('foh_tasks').insert(tasksToInsert);
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
      const { data: activeTemplates } = await supabase
        .from('foh_daily_templates')
        .select('template_name')
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('is_active', true)
        .limit(1);
      const currentTemplateName = activeTemplates?.[0]?.template_name || `Standaard ${activePhase === 'open' ? 'Openlijst' : activePhase === 'tussen' ? 'Tussenlijst' : 'Sluitlijst'}`;
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
      const { error: insertError } = await supabase.from('foh_daily_templates').insert(templatesToInsert);
      if (insertError) {
        console.error('Error inserting templates:', insertError);
        toast.error('Fout bij opslaan template');
        return;
      }
      toast.success(`Template \"${currentTemplateName}\" bijgewerkt`);
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Fout bij opslaan template');
    }
  };

  // ===== TAB 2: TEMPLATE MANAGEMENT =====
  const handleMakeTemplateActive = async (templateName: string) => {
    try {
      const { error: deactivateError } = await supabase
        .from('foh_daily_templates')
        .update({ is_active: false })
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .neq('template_name', templateName);
      if (deactivateError) throw deactivateError;
      const { error: activateError } = await supabase
        .from('foh_daily_templates')
        .update({ is_active: true })
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('template_name', templateName);
      if (activateError) throw activateError;
      toast.success(`Template \"${templateName}\" is nu actief`);
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
      const currentPhaseTasks = getCurrentTasks().filter(t => !t.archived);
      if (currentPhaseTasks.length === 0) {
        const { error } = await supabase.from('foh_daily_templates').insert({
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
        const { error } = await supabase.from('foh_daily_templates').insert(templatesToInsert);
        if (error) throw error;
      }
      toast.success(`Template \"${newTemplateName.trim()}\" aangemaakt`);
      setNewTemplateDialogOpen(false);
      setNewTemplateName('');
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Fout bij aanmaken template');
    }
  };

  const handleDeleteTemplate = async (templateName: string) => {
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
      toast.success(`Template \"${templateName}\" verwijderd`);
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
      for (const task of editingTemplate) {
        if (deletedTemplateTaskIds.includes(task.id)) continue;
        if (task.isNew) continue;
        const { error } = await supabase
          .from('foh_daily_templates')
          .update({ title: task.title, sort_order: task.sort_order, category: task.category, description: task.description, estimated_minutes: task.estimated_minutes })
          .eq('id', task.id);
        if (error) {
          console.error('Error updating template task:', error);
          toast.error('Fout bij opslaan');
          return;
        }
      }
      const newTasks = editingTemplate.filter(t => t.isNew);
      for (const task of newTasks) {
        const { error } = await supabase.from('foh_daily_templates').insert({
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
    if (Math.abs(diff) > 10) e.preventDefault();
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
    if (!swipedTaskId) setSwipeOffset(0);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: '#E27726' }} className="animate-spin" />
      </div>
    );
  }

  const currentTasks = isEditMode ? editedTasks : getCurrentTasks();
  const groupedCurrentTasks = groupTasksByCategory(currentTasks);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #D5D8E0',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        position: 'relative',
      }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
          {/* Segmented control tabs */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', backgroundColor: '#F8F9FA', border: '1px solid #EAECF0', borderRadius: '16px', padding: '3px' }}>
              
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
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#F1F3F5';
                  }
                }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                  padding: '10px 16px',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#1A1F28' : '#4A4F5E',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <span>{labels[phase]}</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? '#E27726' : 'rgba(141, 147, 160, 0.1)',
                      color: isActive ? '#FFFFFF' : '#636878',
                      minWidth: '36px',
                    }}>
                      {stats.completed}/{stats.total}
                    </span>
                  </button>
                );
              })}
              
            {/* Visual separator */}
            <div style={{
              width: '1px',
              height: '24px',
              backgroundColor: '#D5D8E0',
              margin: '0 4px',
            }} />
              
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
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#F1F3F5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                    padding: '10px 16px',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    color: isActive ? '#1A1F28' : '#4A4F5E',
                    border: 'none',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <span>Periodiek</span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: isActive ? '#E27726' : 'rgba(141, 147, 160, 0.1)',
                      color: isActive ? '#FFFFFF' : '#636878',
                      minWidth: '36px',
                    }}>
                      {completed}/{total}
                    </span>
                  </button>
                );
              })()}

            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #EAECF0', margin: 0 }} />

            {/* Progress bar - v6.0: 4px height */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  height: '4px',
                  backgroundColor: '#EAECF0',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPercentage}%`,
                    backgroundColor: '#E27726',
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
                  <span style={{ fontSize: '13px', color: '#636878', fontFamily: 'Inter, sans-serif' }}>
                    {completedCount}/{totalCount}
                  </span>
                  <span style={{
                    fontWeight: 600,
                    color: isComplete ? '#22C55E' : '#1A1F28',
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    {progressPercentage}%
                  </span>
                </div>

                {/* Admin Button - v6.0 secondary style */}
                <button
                  onClick={() => setPasswordDialogOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#FFF7ED',
                    color: '#A5500D',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFEDD5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF7ED';
                  }}
                >
                  <Settings size={16} />
                  Admin
                </button>

                {/* New Task Button - only for periodiek */}
                {mainCategory === 'periodiek' && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#E27726',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#C9630E';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#E27726';
                        }}
                        onMouseDown={(e) => {
                          e.currentTarget.style.transform = 'scale(0.97)';
                        }}
                        onMouseUp={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Plus size={20} />
                      </button>
                    </DialogTrigger>
                    <DialogContent style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D5D8E0',
                      borderRadius: '24px',
                      fontFamily: 'Inter, sans-serif',
                    }}>
                      <DialogHeader>
                        <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: '#1A1F28' }}>
                          Nieuwe Periodieke Taak
                        </DialogTitle>
                      </DialogHeader>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
                        <div>
                          <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
                            Titel *
                          </Label>
                          <Input
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            placeholder="Bijv. Voorraad tellen"
                            style={{ marginTop: '6px', borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}
                          />
                        </div>

                        <div>
                          <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
                            Vervaldatum *
                          </Label>
                          <Input
                            type="date"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                            style={{ marginTop: '6px', borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}
                          />
                        </div>

                        {/* Toggle for advanced options */}
                        <button
                          type="button"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#F8F9FA',
                            border: '1px solid #EAECF0',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#636878',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {showAdvancedOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          {showAdvancedOptions ? 'Verberg opties' : 'Meer opties'}
                        </button>

                        {showAdvancedOptions && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
                                  Prioriteit
                                </Label>
                                <Select value={newTask.priority.toString()} onValueChange={(val) => setNewTask({ ...newTask, priority: parseInt(val) as 1 | 2 | 3 })}>
                                  <SelectTrigger style={{ marginTop: '6px', borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Hoog</SelectItem>
                                    <SelectItem value="2">Normaal</SelectItem>
                                    <SelectItem value="3">Laag</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
                                  Categorie
                                </Label>
                                <Select value={newTask.category} onValueChange={(val) => setNewTask({ ...newTask, category: val })}>
                                  <SelectTrigger style={{ marginTop: '6px', borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}>
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
                              <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
                                Geschatte tijd
                              </Label>
                              <Select 
                                value={newTask.estimated_minutes?.toString() || ''} 
                                onValueChange={(val) => setNewTask({ ...newTask, estimated_minutes: val ? parseInt(val) : null })}
                              >
                                <SelectTrigger style={{ marginTop: '6px', borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}>
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
                              <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
                                Medewerker
                              </Label>
                              <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeOpen}
                                    style={{
                                      width: '100%',
                                      justifyContent: 'space-between',
                                      marginTop: '6px',
                                      borderRadius: '14px',
                                      fontFamily: 'Inter, sans-serif',
                                    }}
                                  >
                                    {newTask.assigned_employee_id
                                      ? employees.find((e) => e.id === newTask.assigned_employee_id)?.name
                                      : "Selecteer medewerker..."}
                                    <ChevronsUpDown style={{ marginLeft: '8px', height: '16px', width: '16px', opacity: 0.5 }} />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent style={{ width: '100%', padding: 0, fontFamily: 'Inter, sans-serif' }}>
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
                                              <Plus style={{ marginRight: '8px', height: '16px', width: '16px' }} />
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
                          style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif' }}
                        >
                          Annuleren
                        </Button>
                        <Button
                          onClick={createTask}
                          style={{
                            backgroundColor: '#E27726',
                            color: '#FFFFFF',
                            borderRadius: '16px',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          Toevoegen
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #EAECF0', margin: 0 }} />

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
                        <div key={category} style={{ marginBottom: '16px' }}>
                          {/* Category card container */}
                          <div style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #D5D8E0',
                            borderRadius: '20px',
                            padding: '16px',
                          }}>
                          <h3 style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: progress.allDone ? '#22C55E' : '#636878',
                            marginBottom: '12px',
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            {category}
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              color: progress.allDone ? '#22C55E' : '#8D93A0',
                              backgroundColor: progress.allDone ? 'rgba(34, 197, 94, 0.1)' : 'rgba(141, 147, 160, 0.1)',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}>
                              {progress.completed}/{progress.total}
                            </span>
                          </h3>
                          <div>
                            {progress.allDone ? (
                              <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#22C55E',
                                fontSize: '13px',
                                fontWeight: 500,
                                fontFamily: 'Inter, sans-serif',
                                animation: 'fade-in 0.3s ease-out',
                              }}>
                                Alle taken voltooid
                              </div>
                            ) : (
                              <SortableContext items={categoryTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                {categoryTasks.map(task => (
                                  <SortableTaskItem
                                    key={task.id}
                                    task={task}
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
                                  />
                                ))}
                              </SortableContext>
                            )}
                          </div>
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
                    <div key={dateKey} style={{ marginBottom: '20px' }}>
                      {/* Day header */}
                      <h3 style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: getDateLabelColor(dateKey),
                        marginBottom: '8px',
                        marginTop: '16px',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {formatDayHeader(dateKey)}
                      </h3>
                      
                      {/* Tasks for this day */}
                      {tasksForDay.map(task => (
                        <div key={task.id}>
                          <div
                            style={{
                              position: 'relative',
                              transform: swipedTaskId === task.id ? `translateX(-${swipeOffset}px)` : 'none',
                              transition: touchStart === 0 ? 'transform 0.3s ease' : 'none',
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={(e) => handleTouchMove(e, task.id)}
                            onTouchEnd={handleTouchEnd}
                          >
                            <div 
                              onClick={() => toggleTask(task.id, task.completed)}
                              style={{
                                padding: taskPadding,
                                backgroundColor: task.completed ? '#FCFCFD' : 'transparent',
                                borderBottom: '1px solid #EAECF0',
                                borderLeft: `4px solid ${getPriorityConfig(task.priority).borderColor}`,
                                marginLeft: '-4px',
                                paddingLeft: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                opacity: task.completed ? 0.7 : 1,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = task.completed 
                                  ? '#F8F9FA' 
                                  : '#FCFCFD';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = task.completed 
                                  ? '#FCFCFD' 
                                  : 'transparent';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                              }}>
                                {/* Checkbox - v6.0: 16x16, radius 4px */}
                                <div style={{
                                  width: '16px',
                                  height: '16px',
                                  minWidth: '16px',
                                  borderRadius: '4px',
                                  border: '2px solid #C1C5CF',
                                  backgroundColor: task.completed ? '#E27726' : '#FFFFFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.1s ease',
                                  pointerEvents: 'none',
                                }}>
                                  {task.completed && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                      <path
                                        d="M1 4L3.5 6.5L9 1"
                                        stroke="#FFFFFF"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  )}
                                </div>

                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px',
                                  flex: 1 
                                }}>
                                  <span style={{
                                    flex: 1,
                                    textDecoration: task.completed ? 'line-through' : 'none',
                                    color: task.completed ? '#636878' : '#282E3A',
                                    fontWeight: 500,
                                    fontSize: '13px',
                                    fontFamily: 'Inter, sans-serif',
                                  }}>
                                    {task.title}
                                  </span>
                                </div>

                                {task.estimated_minutes && (
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#636878',
                                    backgroundColor: 'rgba(99, 104, 120, 0.08)',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    fontFamily: 'Inter, sans-serif',
                                  }}>
                                    ~{task.estimated_minutes}min
                                  </span>
                                )}

                                {task.foh_employees && (
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: '#E27726',
                                    backgroundColor: 'rgba(226, 119, 38, 0.08)',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    fontFamily: 'Inter, sans-serif',
                                  }}>
                                    {(task.foh_employees as any).name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Swipe delete button */}
                            {swipedTaskId === task.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '80px',
                                backgroundColor: '#EF4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0 12px 12px 0',
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                                  style={{
                                    color: '#FFFFFF',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    padding: '12px',
                                  }}
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {sortedExtraTasks.length === 0 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '48px 20px',
                      maxWidth: '320px',
                      margin: '0 auto',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '20px',
                        backgroundColor: '#F1F3F5',
                        border: '1px solid #EAECF0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                      }}>
                        <Check size={22} style={{ color: '#8D93A0' }} />
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#303542', fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0' }}>
                        Geen periodieke taken
                      </p>
                      <p style={{ fontSize: '13px', color: '#636878', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                        Voeg een taak toe met de + knop
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit mode controls */}
              {isEditMode && mainCategory === 'dagelijks' && (
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid #EAECF0',
                  marginTop: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}>
                  {/* Add new task input */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="Nieuwe taak toevoegen..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newTaskInput.trim()) {
                          setNewTasks(prev => [...prev, {
                            tempId: `temp-${Date.now()}`,
                            title: newTaskInput.trim(),
                            category: availableCategories[0] || 'Algemeen',
                          }]);
                          setNewTaskInput('');
                        }
                      }}
                      style={{
                        flex: 1,
                        borderRadius: '14px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newTaskInput.trim()) {
                          setNewTasks(prev => [...prev, {
                            tempId: `temp-${Date.now()}`,
                            title: newTaskInput.trim(),
                            category: availableCategories[0] || 'Algemeen',
                          }]);
                          setNewTaskInput('');
                        }
                      }}
                      style={{
                        backgroundColor: '#E27726',
                        color: '#FFFFFF',
                        borderRadius: '16px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  {/* Preview of new tasks */}
                  {newTasks.length > 0 && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#F1F3F5',
                      borderRadius: '14px',
                    }}>
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#636878',
                        marginBottom: '8px',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        Nieuwe taken ({newTasks.length})
                      </p>
                      {newTasks.map(task => (
                        <div key={task.tempId} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: '1px solid #EAECF0',
                        }}>
                          <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', color: '#303542' }}>
                            {task.title}
                          </span>
                          <button
                            onClick={() => {
                              setNewTasks(prev => prev.filter(t => t.tempId !== task.tempId));
                            }}
                            style={{
                              padding: '4px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#EF4444',
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false);
                        setEditedTasks([]);
                        setDeletedTaskIds([]);
                        setNewTasks([]);
                        setNewTaskInput('');
                      }}
                      style={{
                        flex: 1,
                        borderRadius: '16px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button
                      onClick={handleSaveCurrentTasks}
                      style={{
                        flex: 1,
                        backgroundColor: '#E27726',
                        color: '#FFFFFF',
                        borderRadius: '16px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Opslaan
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleSaveAsTemplate}
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      fontFamily: 'Inter, sans-serif',
                      borderColor: '#E27726',
                      color: '#E27726',
                    }}
                  >
                    <BookTemplate size={16} style={{ marginRight: '8px' }} />
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
        <DialogContent style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5D8E0',
          borderRadius: '24px',
          fontFamily: 'Inter, sans-serif',
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: '#1A1F28' }}>
              Admin Toegang
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: '16px 0' }}>
            <Input
              type="password"
              placeholder="Voer wachtwoord in"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}
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
              onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); }}
              style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif' }}
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
              style={{
                backgroundColor: '#E27726',
                color: '#FFFFFF',
                borderRadius: '16px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Bevestigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Panel Dialog */}
      <Dialog open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
        <DialogContent style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5D8E0',
          borderRadius: '24px',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '650px',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: '#1A1F28', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} style={{ color: '#E27726' }} />
              Admin Panel
            </DialogTitle>
          </DialogHeader>

          <div style={{ padding: '16px 0', maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '13px', color: '#636878', fontFamily: 'Inter, sans-serif' }}>
                Beheer templates voor {activePhase === 'open' ? 'Openlijst' : activePhase === 'tussen' ? 'Tussenlijst' : 'Sluitlijst'}.
              </p>

              {/* Create new template button */}
              <Button
                onClick={() => setNewTemplateDialogOpen(true)}
                style={{
                  backgroundColor: '#E27726',
                  color: '#FFFFFF',
                  borderRadius: '16px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                Nieuwe Template
              </Button>

              {/* Template list */}
              {templatesLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: '#E27726' }} />
                </div>
              ) : groupedTemplates && Object.keys(groupedTemplates).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.values(groupedTemplates).map(template => (
                    <div key={template.name} style={{
                      padding: '16px',
                      backgroundColor: '#F1F3F5',
                      borderRadius: '16px',
                      border: template.isActive ? '2px solid #E27726' : '1px solid #D5D8E0',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: '#1A1F28',
                              fontFamily: 'Inter, sans-serif',
                              margin: 0,
                            }}>
                              {template.name}
                            </h4>
                            {template.isActive && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                backgroundColor: '#E27726',
                                color: '#FFFFFF',
                                fontFamily: 'Inter, sans-serif',
                              }}>
                                ACTIEF
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#636878', fontFamily: 'Inter, sans-serif', margin: '4px 0 0 0' }}>
                            {template.tasks.length} taken
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {!template.isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleMakeTemplateActive(template.name)}
                            style={{
                              backgroundColor: '#E27726',
                              color: '#FFFFFF',
                              borderRadius: '14px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                            }}
                          >
                            <Check size={14} style={{ marginRight: '4px' }} />
                            Maak Actief
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTemplateEditor(template.name)}
                          style={{
                            borderRadius: '14px',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                          }}
                        >
                          <Pencil size={14} style={{ marginRight: '4px' }} />
                          Bewerk Template
                        </Button>

                        {!template.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je template \"${template.name}\" wilt verwijderen?`)) {
                                handleDeleteTemplate(template.name);
                              }
                            }}
                            style={{
                              borderRadius: '14px',
                              fontFamily: 'Inter, sans-serif',
                              fontSize: '13px',
                              borderColor: '#EF4444',
                              color: '#EF4444',
                            }}
                          >
                            <Trash2 size={14} style={{ marginRight: '4px' }} />
                            Verwijder
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '48px 20px',
                  maxWidth: '320px',
                  margin: '0 auto',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '20px',
                    backgroundColor: '#F1F3F5',
                    border: '1px solid #EAECF0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <BookTemplate size={22} style={{ color: '#8D93A0' }} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#303542', fontFamily: 'Inter, sans-serif', margin: '0 0 4px 0' }}>
                    Geen templates gevonden
                  </p>
                  <p style={{ fontSize: '13px', color: '#636878', fontFamily: 'Inter, sans-serif', margin: 0 }}>
                    Maak een template aan om te beginnen
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdminPanelOpen(false)}
              style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif' }}
            >
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
        <DialogContent style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5D8E0',
          borderRadius: '24px',
          fontFamily: 'Inter, sans-serif',
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: '#1A1F28' }}>
              Nieuwe Template Aanmaken
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: '16px 0' }}>
            <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#303542' }}>
              Template Naam *
            </Label>
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Bijv. Zomer Openlijst"
              style={{ marginTop: '6px', borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}
            />
            <p style={{ fontSize: '13px', color: '#636878', fontFamily: 'Inter, sans-serif', marginTop: '8px' }}>
              De template wordt aangemaakt op basis van de huidige taken voor {activePhase === 'open' ? 'Open' : activePhase === 'tussen' ? 'Tussen' : 'Sluit'}.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setNewTemplateDialogOpen(false); setNewTemplateName(''); }}
              style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif' }}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleCreateNewTemplate}
              style={{
                backgroundColor: '#E27726',
                color: '#FFFFFF',
                borderRadius: '16px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
        <DialogContent style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #D5D8E0',
          borderRadius: '24px',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '650px',
          maxHeight: '90vh',
        }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Inter, sans-serif', color: '#1A1F28' }}>
              Bewerk Template: {editingTemplateName}
            </DialogTitle>
          </DialogHeader>

          <div style={{ padding: '16px 0', maxHeight: '60vh', overflowY: 'auto' }}>
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
            <div style={{
              padding: '16px',
              borderTop: '1px solid #EAECF0',
              marginTop: '16px',
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#636878',
                    marginBottom: '6px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Nieuwe taak toevoegen
                  </label>
                  <Input
                    value={newTemplateTaskInput}
                    onChange={(e) => setNewTemplateTaskInput(e.target.value)}
                    placeholder="Taaknaam..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddTemplateTask();
                    }}
                    style={{ borderRadius: '14px', fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
                <div style={{ width: '160px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#636878',
                    marginBottom: '6px',
                    fontFamily: 'Inter, sans-serif',
                  }}>
                    Categorie
                  </label>
                  <Select value={newTemplateTaskCategory} onValueChange={setNewTemplateTaskCategory}>
                    <SelectTrigger style={{ borderRadius: '14px' }}>
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
                  style={{
                    backgroundColor: '#E27726',
                    color: '#FFFFFF',
                    borderRadius: '16px',
                    fontFamily: 'Inter, sans-serif',
                    minWidth: '100px',
                  }}
                >
                  <Plus size={16} style={{ marginRight: '4px' }} />
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
              style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif' }}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSaveTemplateEdits}
              style={{
                backgroundColor: '#E27726',
                color: '#FFFFFF',
                borderRadius: '16px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
