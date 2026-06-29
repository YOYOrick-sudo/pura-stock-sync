// Lijst beheren — ChatGPT-achtig gepolijst beheerscherm voor takenlijsten.
// Vervangt de oude "Admin Panel" templates-tab + losse Template Editor.
//
// Eén scherm met:
//  • Header: titel "Lijst beheren" + sublabel (fase · locatie)
//  • Template selector + "+ Nieuwe lijst"
//  • Taken gegroepeerd per categorie (zelfde volgorde als live lijst)
//  • Inline edit met optimistic updates + debounced autosave (500ms)
//  • Wekelijks/Dagelijks toggle met dag-chips
//  • Drag-and-drop volgorde binnen categorie
//  • Categorie hernoemen / verwijderen / reorder (West)
//  • Sync naar vandaag bij elke wijziging
//
// Geen kleurvlakken, dunne lijnen, veel witruimte, alles in Inter.
// ============================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  X,
  Check,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================================
// Types
// ============================================================================
interface TemplateTask {
  id: string;
  location: string;
  phase: string;
  department: string;
  title: string;
  category: string;
  priority: number;
  estimated_minutes: number | null;
  sort_order: number | null;
  description: string | null;
  repeat_type: string | null;
  day_of_week: number | null;
  template_name: string;
  is_active: boolean;
}

interface ListManagerProps {
  open: boolean;
  onClose: () => void;
  location: string;
  phase: 'open' | 'tussen' | 'sluit';
  department: 'voorkant' | 'achterkant';
  availableCategories: string[];
  isWest: boolean;
  // West-only: reorder/rename/delete categorieën (gedelegeerd naar FohTasks)
  westCategoryRows?: { category: string; sort_order: number | null }[];
  onMoveCategory?: (category: string, direction: -1 | 1) => void;
  onRenameCategory?: (oldName: string) => void;
  onDeleteCategory?: (category: string) => void;
}

const DAY_LABELS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

// ============================================================================
// Helpers
// ============================================================================
function getAmsterdamDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function phaseLabel(phase: string) {
  if (phase === 'open') return 'Openen';
  if (phase === 'tussen') return 'Tussen';
  return 'Sluiten';
}

function locationLabel(loc: string) {
  if (loc === 'West') return 'Daily';
  if (loc === 'Midsland') return 'Foodbar';
  return loc;
}

// ============================================================================
// Sortable task row
// ============================================================================
interface SortableRowProps {
  task: TemplateTask;
  onUpdate: (id: string, patch: Partial<TemplateTask>) => void;
  onDelete: (id: string) => void;
  categoryOptions: string[];
}

function SortableRow({ task, onUpdate, onDelete, categoryOptions }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const [title, setTitle] = useState(task.title);
  const [hovered, setHovered] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Keep input in sync if external value changes
  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const commitTitle = (next: string) => {
    if (next.trim() === task.title) return;
    onUpdate(task.id, { title: next.trim() });
  };

  const onTitleChange = (val: string) => {
    setTitle(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim() && val.trim() !== task.title) {
        onUpdate(task.id, { title: val.trim() });
      }
    }, 600);
  };

  const isWeekly = task.repeat_type === 'weekly';
  const daysActive: number[] = isWeekly && task.day_of_week !== null ? [task.day_of_week] : [];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 8px',
          borderRadius: '10px',
          backgroundColor: hovered ? 'hsl(var(--muted) / 0.4)' : 'transparent',
          transition: 'background-color 120ms ease',
        }}
      >
        {/* Drag handle (verschijnt op hover) */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Verslepen"
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'grab',
            color: 'hsl(var(--muted-foreground))',
            opacity: hovered ? 0.7 : 0.25,
            transition: 'opacity 120ms ease',
            padding: 0,
            touchAction: 'none',
          }}
        >
          <GripVertical size={16} />
        </button>

        {/* Title input */}
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => commitTitle(title)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: '15px',
            fontWeight: 400,
            color: 'hsl(var(--foreground))',
            padding: '4px 8px',
            height: 'auto',
            fontFamily: 'Inter, sans-serif',
            boxShadow: 'none',
          }}
        />

        {/* Repeat indicator / picker */}
        <Popover open={showRepeat} onOpenChange={setShowRepeat}>
          <PopoverTrigger asChild>
            <button
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: '1px solid hsl(var(--border))',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: 500,
                color: isWeekly ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                opacity: hovered || isWeekly ? 1 : 0.5,
                transition: 'opacity 120ms ease',
              }}
            >
              {isWeekly && task.day_of_week !== null ? DAY_LABELS[task.day_of_week] : 'dagelijks'}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            style={{ width: 240, padding: 12, fontFamily: 'Inter, sans-serif' }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Herhaling
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button
                onClick={() => {
                  onUpdate(task.id, { repeat_type: 'daily', day_of_week: null });
                  setShowRepeat(false);
                }}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: !isWeekly ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  color: !isWeekly ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  fontWeight: !isWeekly ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Dagelijks
              </button>
              <button
                onClick={() => {
                  if (!isWeekly) {
                    onUpdate(task.id, { repeat_type: 'weekly', day_of_week: 1 });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: isWeekly ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  color: isWeekly ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  fontWeight: isWeekly ? 600 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Wekelijks
              </button>
            </div>
            {isWeekly && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                  const active = daysActive.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => onUpdate(task.id, { day_of_week: d })}
                      style={{
                        flex: 1,
                        minWidth: 28,
                        padding: '6px 0',
                        borderRadius: 8,
                        border: `1px solid ${active ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                        background: active ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                        color: active ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                        fontWeight: active ? 600 : 500,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  );
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Delete */}
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Verwijderen"
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))',
            opacity: hovered ? 0.85 : 0,
            transition: 'opacity 120ms ease, color 120ms ease, background 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'hsl(var(--destructive))';
            e.currentTarget.style.background = 'hsl(var(--destructive) / 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main component
// ============================================================================
export function ListManager({
  open,
  onClose,
  location,
  phase,
  department,
  availableCategories,
  isWest,
  westCategoryRows,
  onMoveCategory,
  onRenameCategory,
  onDeleteCategory,
}: ListManagerProps) {
  const queryClient = useQueryClient();
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [addingTaskInCategory, setAddingTaskInCategory] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newListDialogOpen, setNewListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [savingPing, setSavingPing] = useState(false);

  // Fetch all templates voor deze (location, phase, department)
  const { data: rawTemplates = [], isLoading } = useQuery({
    queryKey: ['list-manager-templates', location, phase, department],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_daily_templates')
        .select('*')
        .eq('location', location)
        .eq('phase', phase)
        .eq('department', department)
        .in('repeat_type', ['daily', 'weekly'])
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as TemplateTask[];
    },
    enabled: open,
  });

  // Groep templates op naam
  const templateNames = useMemo(() => {
    const map = new Map<string, { name: string; isActive: boolean; count: number }>();
    for (const t of rawTemplates) {
      const cur = map.get(t.template_name);
      if (!cur) {
        map.set(t.template_name, { name: t.template_name, isActive: t.is_active, count: 1 });
      } else {
        cur.count += 1;
        if (t.is_active) cur.isActive = true;
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [rawTemplates]);

  // Default: kies actieve template
  useEffect(() => {
    if (!selectedTemplateName && templateNames.length > 0) {
      const active = templateNames.find((t) => t.isActive);
      setSelectedTemplateName(active?.name || templateNames[0].name);
    }
  }, [templateNames, selectedTemplateName]);

  const currentTasks = useMemo(
    () => rawTemplates.filter((t) => t.template_name === selectedTemplateName),
    [rawTemplates, selectedTemplateName],
  );
  const isCurrentActive = currentTasks.some((t) => t.is_active);

  // Group by category, respecting availableCategories order
  const tasksByCategory = useMemo(() => {
    const groups = new Map<string, TemplateTask[]>();
    for (const cat of availableCategories) groups.set(cat, []);
    for (const t of currentTasks) {
      const cat = t.category || 'Algemeen';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(t);
    }
    // sort each group
    for (const arr of groups.values()) {
      arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
    // remove empty if not in availableCategories
    const result: { category: string; tasks: TemplateTask[] }[] = [];
    for (const [cat, arr] of groups) {
      if (arr.length === 0 && !availableCategories.includes(cat)) continue;
      result.push({ category: cat, tasks: arr });
    }
    return result;
  }, [currentTasks, availableCategories]);

  // ==========================================================================
  // Sync helpers
  // ==========================================================================
  const flashSaved = () => {
    setSavingPing(true);
    setTimeout(() => setSavingPing(false), 800);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['list-manager-templates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-weekly-templates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-template-dates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-west-subcategories'] });
    queryClient.invalidateQueries({ queryKey: ['foh-category-order'] });
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
  };

  // Sync wijziging naar vandaag (alleen als template actief is)
  const syncToToday = async (templateId: string, patch: Partial<TemplateTask>) => {
    if (!isCurrentActive) return;
    const todayNL = getAmsterdamDateString();
    const updateFields: Record<string, unknown> = {};
    if (patch.title !== undefined) updateFields.title = patch.title;
    if (patch.category !== undefined) updateFields.category = patch.category;
    if (patch.sort_order !== undefined) updateFields.sort_order = patch.sort_order;
    if (patch.description !== undefined) updateFields.description = patch.description;
    if (patch.estimated_minutes !== undefined) updateFields.estimated_minutes = patch.estimated_minutes;
    if (Object.keys(updateFields).length === 0) return;

    await supabase
      .from('foh_tasks')
      .update(updateFields)
      .eq('template_id', templateId)
      .eq('due_date', todayNL)
      .eq('archived', false);
  };

  // ==========================================================================
  // Mutations
  // ==========================================================================
  const updateTask = useCallback(
    async (id: string, patch: Partial<TemplateTask>) => {
      // Optimistic update
      queryClient.setQueryData<TemplateTask[]>(
        ['list-manager-templates', location, phase, department],
        (prev) => (prev || []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );

      const { error } = await supabase
        .from('foh_daily_templates')
        .update(patch)
        .eq('id', id);
      if (error) {
        toast.error('Opslaan mislukt');
        invalidateAll();
        return;
      }
      await syncToToday(id, patch);
      flashSaved();
      // Geen invalidate hier — optimistic state is al correct, voorkomt flicker
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
      queryClient.invalidateQueries({ queryKey: ['foh-weekly-templates'] });
      queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
    },
    [location, phase, department, isCurrentActive, queryClient],
  );

  const deleteTask = async (id: string) => {
    const task = currentTasks.find((t) => t.id === id);
    if (!task) return;
    if (!window.confirm(`"${task.title}" verwijderen?`)) return;

    // Optimistic
    queryClient.setQueryData<TemplateTask[]>(
      ['list-manager-templates', location, phase, department],
      (prev) => (prev || []).filter((t) => t.id !== id),
    );

    // Archiveer eventuele live taak van vandaag
    const todayNL = getAmsterdamDateString();
    await supabase
      .from('foh_tasks')
      .update({ archived: true })
      .eq('template_id', id)
      .eq('due_date', todayNL)
      .eq('archived', false);

    const { error } = await supabase.from('foh_daily_templates').delete().eq('id', id);
    if (error) {
      toast.error('Verwijderen mislukt');
      invalidateAll();
      return;
    }
    flashSaved();
    invalidateAll();
  };

  const addTaskInCategory = async (category: string) => {
    const title = newTaskTitle.trim();
    if (!title) {
      toast.error('Vul een taaknaam in');
      return;
    }
    const sample = currentTasks[0];
    const maxSort = Math.max(0, ...currentTasks.filter((t) => t.category === category).map((t) => t.sort_order ?? 0));
    const newTemplateName = selectedTemplateName || sample?.template_name || 'Standaard';

    const { data: inserted, error } = await supabase
      .from('foh_daily_templates')
      .insert({
        location,
        phase,
        department,
        title,
        category,
        priority: 2,
        repeat_type: 'daily',
        template_name: newTemplateName,
        is_active: isCurrentActive,
        sort_order: maxSort + 10,
      })
      .select('*')
      .single();

    if (error || !inserted) {
      toast.error('Toevoegen mislukt');
      return;
    }

    // Als template actief is, gelijk taak voor vandaag aanmaken
    if (isCurrentActive) {
      const todayNL = getAmsterdamDateString();
      await supabase.from('foh_tasks').insert({
        location,
        phase,
        department,
        title,
        category,
        priority: 2,
        template_id: inserted.id,
        sort_order: maxSort + 10,
        due_date: todayNL,
        completed: false,
        archived: false,
      });
    }

    setNewTaskTitle('');
    setAddingTaskInCategory(null);
    flashSaved();
    invalidateAll();
  };

  const handleDragEnd = async (event: DragEndEvent, category: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const tasks = currentTasks
      .filter((t) => t.category === category)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const oldIdx = tasks.findIndex((t) => t.id === active.id);
    const newIdx = tasks.findIndex((t) => t.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);

    // Optimistic
    const withNewOrder = reordered.map((t, i) => ({ ...t, sort_order: (i + 1) * 10 }));
    queryClient.setQueryData<TemplateTask[]>(
      ['list-manager-templates', location, phase, department],
      (prev) => {
        if (!prev) return prev;
        const map = new Map(withNewOrder.map((t) => [t.id, t]));
        return prev.map((t) => map.get(t.id) || t);
      },
    );

    // Persist
    for (const t of withNewOrder) {
      await supabase
        .from('foh_daily_templates')
        .update({ sort_order: t.sort_order })
        .eq('id', t.id);
      await syncToToday(t.id, { sort_order: t.sort_order });
    }
    flashSaved();
    queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    queryClient.invalidateQueries({ queryKey: ['foh-daily-tasks'] });
  };

  const handleActivateTemplate = async (templateName: string) => {
    const todayNL = getAmsterdamDateString();
    // Deactiveer andere
    await supabase
      .from('foh_daily_templates')
      .update({ is_active: false })
      .eq('location', location)
      .eq('phase', phase)
      .eq('department', department)
      .neq('template_name', templateName);
    // Activeer gekozen
    await supabase
      .from('foh_daily_templates')
      .update({ is_active: true })
      .eq('location', location)
      .eq('phase', phase)
      .eq('department', department)
      .eq('template_name', templateName);

    // Verwijder vandaag's onvoltooide taken van inactieve templates
    const { data: inactive } = await supabase
      .from('foh_daily_templates')
      .select('id')
      .eq('location', location)
      .eq('phase', phase)
      .eq('department', department)
      .eq('is_active', false);
    const inactiveIds = (inactive || []).map((t: { id: string }) => t.id);
    if (inactiveIds.length > 0) {
      await supabase
        .from('foh_tasks')
        .delete()
        .eq('due_date', todayNL)
        .eq('archived', false)
        .eq('completed', false)
        .in('template_id', inactiveIds);
    }
    toast.success(`Lijst "${templateName}" actief`);
    invalidateAll();
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) {
      toast.error('Naam is verplicht');
      return;
    }
    const exists = templateNames.some((t) => t.name === name);
    if (exists) {
      toast.error('Naam bestaat al');
      return;
    }
    const { error } = await supabase.from('foh_daily_templates').insert({
      location,
      phase,
      department,
      title: 'Nieuwe taak',
      category: availableCategories[0] || 'Algemeen',
      priority: 2,
      repeat_type: 'daily',
      template_name: name,
      is_active: false,
      sort_order: 10,
    });
    if (error) {
      toast.error('Aanmaken mislukt');
      return;
    }
    setNewListName('');
    setNewListDialogOpen(false);
    setSelectedTemplateName(name);
    invalidateAll();
  };

  const handleCreateCategory = async () => {
    const cat = newCategoryName.trim();
    if (!cat) return;
    if (availableCategories.includes(cat)) {
      toast.error('Categorie bestaat al');
      return;
    }
    if (isWest) {
      const nextSort = (westCategoryRows && westCategoryRows.length > 0
        ? Math.max(...westCategoryRows.map((r) => r.sort_order ?? 0))
        : 0) + 10;
      await supabase
        .from('foh_category_order')
        .upsert(
          { location, department, category: cat, sort_order: nextSort },
          { onConflict: 'location,department,category' },
        );
    }
    setNewCategoryName('');
    setShowNewCategory(false);
    invalidateAll();
  };

  // ==========================================================================
  // Render
  // ==========================================================================
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '20px',
          fontFamily: 'Inter, sans-serif',
          maxWidth: '720px',
          width: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <DialogHeader style={{ padding: '20px 24px 12px', borderBottom: '1px solid hsl(var(--border))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <DialogTitle
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  letterSpacing: '-0.01em',
                }}
              >
                Lijst beheren
              </DialogTitle>
              <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', marginTop: 2 }}>
                {phaseLabel(phase)} · {locationLabel(location)}
                {isWest && ` · ${department === 'voorkant' ? 'Bediening' : 'Keuken'}`}
                {savingPing && (
                  <span style={{ marginLeft: 10, fontSize: 12, color: 'hsl(var(--primary))', opacity: 0.9 }}>
                    Opgeslagen
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          {/* Template selector */}
          {templateNames.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Select
                value={selectedTemplateName || ''}
                onValueChange={(v) => setSelectedTemplateName(v)}
              >
                <SelectTrigger
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    height: 40,
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateNames.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.name} {t.isActive ? '· actief' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isCurrentActive && selectedTemplateName && (
                <Button
                  size="sm"
                  onClick={() => handleActivateTemplate(selectedTemplateName)}
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: 12,
                    height: 40,
                    fontSize: 13,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <Check size={14} style={{ marginRight: 4 }} /> Activeren
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewListDialogOpen(true)}
                style={{ borderRadius: 12, height: 40, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                aria-label="Nieuwe lijst"
              >
                <Plus size={14} />
              </Button>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={20} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
            </div>
          ) : tasksByCategory.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>
              Geen taken in deze lijst. Voeg er één toe via de knoppen hieronder.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {tasksByCategory.map(({ category, tasks }) => {
                const catRowIdx = westCategoryRows?.findIndex((r) => r.category === category) ?? -1;
                const canMoveUp = isWest && catRowIdx > 0;
                const canMoveDown = isWest && catRowIdx >= 0 && catRowIdx < (westCategoryRows?.length ?? 0) - 1;
                return (
                  <div key={category}>
                    {/* Category header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                        paddingLeft: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'hsl(var(--muted-foreground))',
                          flex: 1,
                        }}
                      >
                        {category}
                      </div>
                      {isWest && onMoveCategory && (
                        <>
                          <button
                            onClick={() => onMoveCategory(category, -1)}
                            disabled={!canMoveUp}
                            aria-label="Categorie omhoog"
                            style={{
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: 6,
                              cursor: canMoveUp ? 'pointer' : 'not-allowed',
                              opacity: canMoveUp ? 0.6 : 0.2,
                              color: 'hsl(var(--muted-foreground))',
                            }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => onMoveCategory(category, 1)}
                            disabled={!canMoveDown}
                            aria-label="Categorie omlaag"
                            style={{
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: 6,
                              cursor: canMoveDown ? 'pointer' : 'not-allowed',
                              opacity: canMoveDown ? 0.6 : 0.2,
                              color: 'hsl(var(--muted-foreground))',
                            }}
                          >
                            <ChevronDown size={14} />
                          </button>
                          {onRenameCategory && (
                            <button
                              onClick={() => onRenameCategory(category)}
                              aria-label="Hernoem"
                              style={{
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                opacity: 0.6,
                                color: 'hsl(var(--muted-foreground))',
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {onDeleteCategory && tasks.length === 0 && (
                            <button
                              onClick={() => onDeleteCategory(category)}
                              aria-label="Verwijder categorie"
                              style={{
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                opacity: 0.6,
                                color: 'hsl(var(--destructive))',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Tasks */}
                    <div
                      style={{
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 14,
                        padding: 6,
                        background: 'hsl(var(--background))',
                      }}
                    >
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, category)}
                      >
                        <SortableContext
                          items={tasks.map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {tasks.map((task) => (
                            <SortableRow
                              key={task.id}
                              task={task}
                              onUpdate={updateTask}
                              onDelete={deleteTask}
                              categoryOptions={availableCategories}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>

                      {tasks.length === 0 && (
                        <div style={{ padding: '12px 16px', fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                          Nog geen taken in deze categorie.
                        </div>
                      )}

                      {/* Add task in category */}
                      {addingTaskInCategory === category ? (
                        <div style={{ display: 'flex', gap: 6, padding: 6 }}>
                          <Input
                            autoFocus
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Nieuwe taak..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addTaskInCategory(category);
                              if (e.key === 'Escape') {
                                setAddingTaskInCategory(null);
                                setNewTaskTitle('');
                              }
                            }}
                            style={{
                              flex: 1,
                              borderRadius: 10,
                              height: 36,
                              fontSize: 14,
                              fontFamily: 'Inter, sans-serif',
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => addTaskInCategory(category)}
                            style={{
                              backgroundColor: 'hsl(var(--primary))',
                              color: 'hsl(var(--primary-foreground))',
                              borderRadius: 10,
                              height: 36,
                              fontFamily: 'Inter, sans-serif',
                              fontSize: 13,
                            }}
                          >
                            Toevoegen
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAddingTaskInCategory(null);
                              setNewTaskTitle('');
                            }}
                            style={{ borderRadius: 10, height: 36 }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingTaskInCategory(category);
                            setNewTaskTitle('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '10px 12px',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: 10,
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: 13,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'color 120ms ease, background 120ms ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'hsl(var(--foreground))';
                            e.currentTarget.style.background = 'hsl(var(--muted) / 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Plus size={14} /> Taak in {category}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* + Nieuwe categorie (West) */}
              {isWest && (
                <div style={{ paddingLeft: 8 }}>
                  {showNewCategory ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Input
                        autoFocus
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Naam categorie..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateCategory();
                          if (e.key === 'Escape') {
                            setShowNewCategory(false);
                            setNewCategoryName('');
                          }
                        }}
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          height: 36,
                          fontSize: 14,
                          fontFamily: 'Inter, sans-serif',
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateCategory}
                        style={{
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                          borderRadius: 10,
                          height: 36,
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 13,
                        }}
                      >
                        Aanmaken
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                        }}
                        style={{ borderRadius: 10, height: 36 }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewCategory(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 0',
                        background: 'transparent',
                        border: 'none',
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} /> Nieuwe categorie
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            style={{
              borderRadius: 12,
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            Sluiten
          </Button>
        </div>
      </DialogContent>

      {/* Nieuwe lijst dialog */}
      <Dialog open={newListDialogOpen} onOpenChange={setNewListDialogOpen}>
        <DialogContent
          style={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 20,
            fontFamily: 'Inter, sans-serif',
            maxWidth: 420,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 600 }}>
              Nieuwe lijst
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: '12px 0' }}>
            <Input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Bijv. Zomer Sluitlijst"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateList();
              }}
              style={{ borderRadius: 12, height: 40, fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setNewListDialogOpen(false);
                setNewListName('');
              }}
              style={{ borderRadius: 12, fontFamily: 'Inter, sans-serif' }}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleCreateList}
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: 12,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Aanmaken
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
