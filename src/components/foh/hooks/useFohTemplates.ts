import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PhaseType, FohTaskWithEmployee } from '@/types/foh';
import { getAmsterdamDateString, getAvailableCategoriesForPhase } from './useFohPhase';

export function useFohTemplates(
  userLocation: string,
  activePhase: PhaseType,
  adminPanelOpen: boolean,
  getCurrentTasks: () => FohTaskWithEmployee[],
  generateDailyTasks: () => Promise<void>,
  fetchDailyTasks: () => Promise<void>,
) {
  const queryClient = useQueryClient();

  // Template editor states
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any[]>([]);
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [deletedTemplateTaskIds, setDeletedTemplateTaskIds] = useState<string[]>([]);
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateTaskInput, setNewTemplateTaskInput] = useState('');
  const availableCategories = getAvailableCategoriesForPhase(userLocation, activePhase);
  const [newTemplateTaskCategory, setNewTemplateTaskCategory] = useState(availableCategories[0] || 'Algemeen');

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
    enabled: adminPanelOpen,
  });

  const groupedTemplates = templates?.reduce((acc, template) => {
    const name = template.template_name || 'Standaard';
    if (!acc[name]) {
      acc[name] = { name, tasks: [], isActive: false, lastModified: template.created_at };
    }
    acc[name].tasks.push(template);
    if (template.is_active) acc[name].isActive = true;
    return acc;
  }, {} as Record<string, { name: string; tasks: any[]; isActive: boolean; lastModified: string }>);

  const handleMakeTemplateActive = useCallback(async (templateName: string) => {
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

      toast.success(`Template "${templateName}" is nu actief`);
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
      await generateDailyTasks();
      await fetchDailyTasks();
    } catch (error) {
      console.error('Error activating template:', error);
      toast.error('Fout bij activeren template');
    }
  }, [userLocation, activePhase, queryClient, generateDailyTasks, fetchDailyTasks]);

  const handleCreateNewTemplate = useCallback(async () => {
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
        const { error } = await supabase
          .from('foh_daily_templates')
          .insert({
            location: userLocation, phase: activePhase, title: 'Nieuwe taak',
            category: 'Algemeen', priority: 2, repeat_type: 'daily',
            template_name: newTemplateName.trim(), is_active: false, sort_order: 10,
          });
        if (error) throw error;
      } else {
        const templatesToInsert = currentPhaseTasks.map(task => ({
          location: task.location, phase: task.phase, title: task.title,
          category: task.category, priority: task.priority,
          estimated_minutes: task.estimated_minutes, sort_order: task.sort_order,
          description: task.description, repeat_type: 'daily',
          template_name: newTemplateName.trim(), is_active: false,
        }));
        const { error } = await supabase.from('foh_daily_templates').insert(templatesToInsert);
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
  }, [newTemplateName, userLocation, activePhase, getCurrentTasks, queryClient]);

  const handleDeleteTemplate = useCallback(async (templateName: string) => {
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
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Fout bij verwijderen template');
    }
  }, [groupedTemplates, userLocation, activePhase, queryClient]);

  const handleOpenTemplateEditor = useCallback((templateName: string) => {
    const template = groupedTemplates?.[templateName];
    if (template) {
      setEditingTemplate(template.tasks);
      setEditingTemplateName(templateName);
      setDeletedTemplateTaskIds([]);
      setTemplateEditorOpen(true);
    }
  }, [groupedTemplates]);

  const handleAddTemplateTask = useCallback(() => {
    if (!newTemplateTaskInput.trim()) {
      toast.error('Vul een taaknaam in');
      return;
    }
    const maxSortOrder = Math.max(...editingTemplate.map(t => t.sort_order || 0), 0);
    const tempId = `temp-${Date.now()}`;
    const newTask = {
      id: tempId, title: newTemplateTaskInput, category: newTemplateTaskCategory,
      sort_order: maxSortOrder + 10, estimated_minutes: null, description: null,
      phase: editingTemplate[0]?.phase || activePhase,
      location: editingTemplate[0]?.location || userLocation,
      priority: 2, repeat_type: 'daily', template_name: editingTemplateName,
      is_active: true, isNew: true,
    };
    setEditingTemplate(prev => [...prev, newTask]);
    setNewTemplateTaskInput('');
    toast.success('Taak toegevoegd');
  }, [newTemplateTaskInput, newTemplateTaskCategory, editingTemplate, activePhase, userLocation, editingTemplateName]);

  const handleSaveTemplateEdits = useCallback(async () => {
    try {
      for (const task of editingTemplate) {
        if (deletedTemplateTaskIds.includes(task.id)) continue;
        if (task.isNew) continue;
        const { error } = await supabase
          .from('foh_daily_templates')
          .update({
            title: task.title, sort_order: task.sort_order,
            category: task.category, description: task.description,
            estimated_minutes: task.estimated_minutes,
          })
          .eq('id', task.id);
        if (error) { toast.error('Fout bij opslaan'); return; }
      }

      const newTasks = editingTemplate.filter(t => t.isNew);
      for (const task of newTasks) {
        const { error } = await supabase
          .from('foh_daily_templates')
          .insert({
            location: task.location, phase: task.phase, title: task.title,
            priority: task.priority, category: task.category,
            repeat_type: task.repeat_type, template_name: task.template_name,
            is_active: task.is_active, estimated_minutes: task.estimated_minutes,
            sort_order: task.sort_order, description: task.description,
          });
        if (error) { toast.error('Fout bij toevoegen nieuwe taak'); return; }
      }

      if (deletedTemplateTaskIds.length > 0) {
        const { error } = await supabase
          .from('foh_daily_templates')
          .delete()
          .in('id', deletedTemplateTaskIds);
        if (error) { toast.error('Fout bij verwijderen taken'); return; }
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
  }, [editingTemplate, deletedTemplateTaskIds, queryClient]);

  const handleSaveAsTemplate = useCallback(async () => {
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

      await supabase
        .from('foh_daily_templates')
        .delete()
        .eq('location', userLocation)
        .eq('phase', activePhase)
        .eq('template_name', currentTemplateName)
        .eq('repeat_type', 'daily');

      const templatesToInsert = currentPhaseTasks.map(task => ({
        location: task.location, phase: task.phase, title: task.title,
        category: task.category, priority: task.priority,
        estimated_minutes: task.estimated_minutes, sort_order: task.sort_order,
        description: task.description, repeat_type: 'daily',
        template_name: currentTemplateName, is_active: true,
      }));

      await supabase.from('foh_daily_templates').insert(templatesToInsert);
      toast.success(`Template "${currentTemplateName}" bijgewerkt`);
      queryClient.invalidateQueries({ queryKey: ['foh-templates'] });
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Fout bij opslaan template');
    }
  }, [getCurrentTasks, userLocation, activePhase, queryClient]);

  return {
    templates,
    templatesLoading,
    groupedTemplates,
    templateEditorOpen, setTemplateEditorOpen,
    editingTemplate, setEditingTemplate,
    editingTemplateName,
    deletedTemplateTaskIds, setDeletedTemplateTaskIds,
    newTemplateDialogOpen, setNewTemplateDialogOpen,
    newTemplateName, setNewTemplateName,
    newTemplateTaskInput, setNewTemplateTaskInput,
    newTemplateTaskCategory, setNewTemplateTaskCategory,
    handleMakeTemplateActive,
    handleCreateNewTemplate,
    handleDeleteTemplate,
    handleOpenTemplateEditor,
    handleAddTemplateTask,
    handleSaveTemplateEdits,
    handleSaveAsTemplate,
  };
}
