import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FohEmployee, FohTaskWithEmployee } from '@/types/foh';
import { getAmsterdamDateString } from './useFohPhase';

export function useFohTasks(userLocation: string) {
  const [dailyTasks, setDailyTasks] = useState<FohTaskWithEmployee[]>([]);
  const [extraTasks, setExtraTasks] = useState<FohTaskWithEmployee[]>([]);
  const [employees, setEmployees] = useState<FohEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const generateDailyTasks = useCallback(async () => {
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
  }, [userLocation]);

  const fetchDailyTasks = useCallback(async () => {
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
  }, [userLocation]);

  const fetchExtraTasks = useCallback(async () => {
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
  }, [userLocation]);

  const fetchEmployees = useCallback(async () => {
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
  }, [userLocation]);

  const shouldResetTasks = useCallback((): boolean => {
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
  }, [userLocation]);

  const performClientSideReset = useCallback(async () => {
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
  }, [userLocation, generateDailyTasks]);

  // Optimistic toggle
  const toggleTask = useCallback(async (id: string, currentCompleted: boolean) => {
    // Optimistic update
    const updateTasks = (tasks: FohTaskWithEmployee[]) =>
      tasks.map(t => t.id === id ? { ...t, completed: !currentCompleted, completed_at: !currentCompleted ? new Date().toISOString() : null } : t);

    setDailyTasks(updateTasks);
    setExtraTasks(updateTasks);

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('foh_tasks')
      .update({
        completed: !currentCompleted,
        completed_at: !currentCompleted ? now : null,
      })
      .eq('id', id);

    if (error) {
      // Revert on error
      const revert = (tasks: FohTaskWithEmployee[]) =>
        tasks.map(t => t.id === id ? { ...t, completed: currentCompleted, completed_at: currentCompleted ? t.completed_at : null } : t);
      setDailyTasks(revert);
      setExtraTasks(revert);
      toast.error('Kon taak niet bijwerken');
      console.error(error);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
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
    fetchExtraTasks();
  }, [fetchExtraTasks]);

  const createTask = useCallback(async (taskData: {
    title: string;
    due_date: string;
    priority: 1 | 2 | 3;
    assigned_employee_id: string | null;
    category: string;
    estimated_minutes: number | null;
  }) => {
    const trimmedTitle = taskData.title.trim();
    if (!trimmedTitle) {
      toast.error('Titel is verplicht');
      return false;
    }
    if (trimmedTitle.length > 200) {
      toast.error('Titel mag maximaal 200 tekens zijn');
      return false;
    }

    const { error } = await supabase
      .from('foh_tasks')
      .insert({
        title: trimmedTitle,
        due_date: taskData.due_date,
        priority: taskData.priority,
        assigned_employee_id: taskData.assigned_employee_id,
        template_id: null,
        location: userLocation,
        category: taskData.category,
        phase: null,
        completed: false,
        archived: false,
        estimated_minutes: taskData.estimated_minutes,
      });

    if (error) {
      toast.error('Kon taak niet aanmaken');
      console.error(error);
      return false;
    }

    toast.success('Taak aangemaakt!');
    fetchExtraTasks();
    return true;
  }, [userLocation, fetchExtraTasks]);

  const createEmployeeInline = useCallback(async (name: string) => {
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
  }, [userLocation, fetchEmployees]);

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

  return {
    dailyTasks,
    extraTasks,
    employees,
    loading,
    toggleTask,
    deleteTask,
    createTask,
    createEmployeeInline,
    fetchDailyTasks,
    fetchExtraTasks,
    generateDailyTasks,
  };
}
