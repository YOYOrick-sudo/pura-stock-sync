import { useState, useMemo, useCallback } from 'react';
import { Loader2, Plus, X, BookTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { DragEndEvent } from '@dnd-kit/core';
import type { PhaseType, FohTaskWithEmployee } from '@/types/foh';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useIsTablet } from '@/hooks/use-mobile';

// Hooks
import { useFohTasks } from './hooks/useFohTasks';
import { useFohTemplates } from './hooks/useFohTemplates';
import {
  groupTasksByPhase, sortTasksInPhase, sortExtraTasks,
  getAmsterdamDateString, getAvailableCategoriesForPhase,
} from './hooks/useFohPhase';

// Components
import { FohTaskHeader } from './FohTaskHeader';
import { FohTaskList } from './FohTaskList';
import { FohPeriodicTasks } from './FohPeriodicTasks';
import { FohNewTaskDialog } from './FohNewTaskDialog';
import { FohAdminPanel } from './FohAdminPanel';

export function FohTasks() {
  const { userLocation } = useUserLocation();
  const isTablet = useIsTablet();

  // Core state
  const [mainCategory, setMainCategory] = useState<'dagelijks' | 'periodiek'>('dagelijks');
  const [activePhase, setActivePhase] = useState<PhaseType>('open');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Admin states
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTasks, setEditedTasks] = useState<FohTaskWithEmployee[]>([]);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [newTasks, setNewTasks] = useState<Array<{ tempId: string; title: string; category: string }>>([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Data hooks
  const {
    dailyTasks, extraTasks, employees, loading,
    toggleTask, deleteTask, createTask, createEmployeeInline,
    fetchDailyTasks, generateDailyTasks,
  } = useFohTasks(userLocation);

  // Memoized processed tasks
  const groupedDailyTasks = useMemo(() => {
    const grouped = groupTasksByPhase(dailyTasks);
    (['open', 'tussen', 'sluit'] as PhaseType[]).forEach(phase => {
      grouped[phase] = sortTasksInPhase(grouped[phase]);
    });
    return grouped;
  }, [dailyTasks]);

  const sortedExtraTasks = useMemo(() => sortExtraTasks(extraTasks), [extraTasks]);

  const getCurrentTasks = useCallback(() => {
    if (mainCategory === 'dagelijks') return groupedDailyTasks[activePhase];
    return sortedExtraTasks;
  }, [mainCategory, activePhase, groupedDailyTasks, sortedExtraTasks]);

  // Templates hook
  const templateHook = useFohTemplates(
    userLocation, activePhase, adminPanelOpen,
    getCurrentTasks, generateDailyTasks, fetchDailyTasks,
  );

  // Drag and drop
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditedTasks((tasks) => {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return tasks;
      const newArr = [...tasks];
      const [movedTask] = newArr.splice(oldIndex, 1);
      newArr.splice(newIndex, 0, movedTask);
      return newArr.map((task, idx) => ({ ...task, sort_order: (idx + 1) * 10 }));
    });
  }, []);

  const handleTemplateDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    templateHook.setEditingTemplate((tasks: any[]) => {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return tasks;
      const newArr = [...tasks];
      const [movedTask] = newArr.splice(oldIndex, 1);
      newArr.splice(newIndex, 0, movedTask);
      return newArr.map((task, idx) => ({ ...task, sort_order: (idx + 1) * 10 }));
    });
  }, [templateHook]);

  // Edit mode: save current tasks
  const handleSaveCurrentTasks = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      for (const task of editedTasks) {
        if (deletedTaskIds.includes(task.id)) continue;
        const { error } = await supabase
          .from('foh_tasks')
          .update({ title: task.title, sort_order: task.sort_order, category: task.category, description: task.description })
          .eq('id', task.id);
        if (error) { toast.error('Fout bij opslaan'); return; }
      }
      if (deletedTaskIds.length > 0) {
        const { error } = await supabase.from('foh_tasks').update({ archived: true }).in('id', deletedTaskIds);
        if (error) { toast.error('Fout bij verwijderen taken'); return; }
      }
      if (newTasks.length > 0) {
        const maxSortOrder = Math.max(...editedTasks.map(t => t.sort_order || 0), 0);
        const tasksToInsert = newTasks.map((task, idx) => ({
          location: userLocation, phase: activePhase, title: task.title,
          category: task.category, due_date: getAmsterdamDateString(),
          priority: 2, sort_order: maxSortOrder + (idx + 1) * 10,
          completed: false, archived: false,
        }));
        const { error } = await supabase.from('foh_tasks').insert(tasksToInsert);
        if (error) { toast.error('Fout bij toevoegen taken'); return; }
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

  // Password submit
  const handlePasswordSubmit = () => {
    if (passwordInput === '0000') {
      setAdminPanelOpen(true);
      setPasswordDialogOpen(false);
      setPasswordInput('');
      toast.success('Admin panel geopend');
    } else {
      toast.error('Onjuist wachtwoord');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currentTasks = isEditMode ? editedTasks : getCurrentTasks();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-card rounded-[20px] border border-border p-6 shadow-soft relative">
          <div className="flex flex-col gap-5">
            {/* Header with phase buttons and progress */}
            <FohTaskHeader
              mainCategory={mainCategory}
              activePhase={activePhase}
              dailyTasks={dailyTasks}
              extraTasks={extraTasks}
              onPhaseChange={(phase) => { setActivePhase(phase); }}
              onCategoryChange={(cat) => { setMainCategory(cat); }}
              onAdminClick={() => setPasswordDialogOpen(true)}
              onNewTaskClick={mainCategory === 'periodiek' ? () => setDialogOpen(true) : undefined}
            />

            <hr className="border-t border-border m-0" />

            {/* Task content */}
            <div>
              {mainCategory === 'dagelijks' && (
                <FohTaskList
                  tasks={groupedDailyTasks[activePhase]}
                  isEditMode={isEditMode}
                  editedTasks={editedTasks}
                  deletedTaskIds={deletedTaskIds}
                  onToggleTask={toggleTask}
                  onTitleChange={(id, title) => setEditedTasks(prev => prev.map(t => t.id === id ? { ...t, title } : t))}
                  onDescriptionChange={(id, description) => setEditedTasks(prev => prev.map(t => t.id === id ? { ...t, description } : t))}
                  onEstimatedMinutesChange={(id, minutes) => setEditedTasks(prev => prev.map(t => t.id === id ? { ...t, estimated_minutes: minutes } : t))}
                  onDeleteTask={(id) => setDeletedTaskIds(prev => [...prev, id])}
                  onDragEnd={handleDragEnd}
                />
              )}

              {mainCategory === 'periodiek' && (
                <FohPeriodicTasks
                  tasks={sortedExtraTasks}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                />
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
                      className="flex-1 rounded-2xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTaskInput.trim()) {
                          setNewTasks(prev => [...prev, { tempId: `temp-${Date.now()}`, title: newTaskInput.trim(), category: 'Algemeen' }]);
                          setNewTaskInput('');
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newTaskInput.trim()) {
                          setNewTasks(prev => [...prev, { tempId: `temp-${Date.now()}`, title: newTaskInput.trim(), category: 'Algemeen' }]);
                          setNewTaskInput('');
                        }
                      }}
                      className="rounded-2xl bg-primary text-primary-foreground"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>

                  {/* New tasks preview */}
                  {newTasks.length > 0 && (
                    <div className="p-3 bg-muted rounded-xl border border-border">
                      <div className="text-[13px] font-semibold text-muted-foreground mb-2">
                        Nieuwe taken ({newTasks.length}):
                      </div>
                      {newTasks.map(task => (
                        <div key={task.tempId} className="py-2 flex justify-between items-center">
                          <span className="text-sm text-foreground">{task.title}</span>
                          <button
                            onClick={() => setNewTasks(prev => prev.filter(t => t.tempId !== task.tempId))}
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
                      className="flex-1 rounded-[20px]"
                    >
                      Annuleren
                    </Button>
                    <Button onClick={handleSaveCurrentTasks} className="flex-1 rounded-[20px] bg-primary text-primary-foreground">
                      Opslaan
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={templateHook.handleSaveAsTemplate}
                    className="w-full rounded-[20px] border-primary text-primary"
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

      {/* New task dialog */}
      <FohNewTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employees={employees}
        userLocation={userLocation}
        onCreateTask={createTask}
        onCreateEmployee={createEmployeeInline}
      />

      {/* Admin panel */}
      <FohAdminPanel
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        activePhase={activePhase}
        userLocation={userLocation}
        passwordDialogOpen={passwordDialogOpen}
        setPasswordDialogOpen={setPasswordDialogOpen}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        onPasswordSubmit={handlePasswordSubmit}
        templatesLoading={templateHook.templatesLoading}
        groupedTemplates={templateHook.groupedTemplates}
        onMakeActive={templateHook.handleMakeTemplateActive}
        onOpenEditor={templateHook.handleOpenTemplateEditor}
        onDeleteTemplate={templateHook.handleDeleteTemplate}
        onNewTemplate={() => templateHook.setNewTemplateDialogOpen(true)}
        templateEditorOpen={templateHook.templateEditorOpen}
        setTemplateEditorOpen={templateHook.setTemplateEditorOpen}
        editingTemplate={templateHook.editingTemplate}
        setEditingTemplate={templateHook.setEditingTemplate}
        editingTemplateName={templateHook.editingTemplateName}
        deletedTemplateTaskIds={templateHook.deletedTemplateTaskIds}
        setDeletedTemplateTaskIds={templateHook.setDeletedTemplateTaskIds}
        newTemplateTaskInput={templateHook.newTemplateTaskInput}
        setNewTemplateTaskInput={templateHook.setNewTemplateTaskInput}
        newTemplateTaskCategory={templateHook.newTemplateTaskCategory}
        setNewTemplateTaskCategory={templateHook.setNewTemplateTaskCategory}
        onAddTemplateTask={templateHook.handleAddTemplateTask}
        onSaveTemplateEdits={templateHook.handleSaveTemplateEdits}
        onTemplateDragEnd={handleTemplateDragEnd}
        newTemplateDialogOpen={templateHook.newTemplateDialogOpen}
        setNewTemplateDialogOpen={templateHook.setNewTemplateDialogOpen}
        newTemplateName={templateHook.newTemplateName}
        setNewTemplateName={templateHook.setNewTemplateName}
        onCreateNewTemplate={templateHook.handleCreateNewTemplate}
      />
    </div>
  );
}
