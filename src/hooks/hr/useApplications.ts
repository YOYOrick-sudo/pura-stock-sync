import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Application, ApplicationFormData, ApplicationStatus, FINAL_STATUSES } from '@/types/hr';
import { toast } from 'sonner';

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async (): Promise<Application[]> => {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          candidate:candidates(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Application[];
    },
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: async (): Promise<Application | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          candidate:candidates(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Application | null;
    },
    enabled: !!id,
  });
}

export function useApplicationsByCandidate(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['applications', 'candidate', candidateId],
    queryFn: async (): Promise<Application[]> => {
      if (!candidateId) return [];
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Application[];
    },
    enabled: !!candidateId,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApplicationFormData): Promise<Application> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return application as Application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-counts'] });
      toast.success('Sollicitatie aangemaakt');
    },
    onError: (error) => {
      console.error('Error creating application:', error);
      toast.error('Fout bij aanmaken sollicitatie');
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Application> }): Promise<Application> => {
      const { data: application, error } = await supabase
        .from('applications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return application as Application;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-counts'] });
      toast.success('Sollicitatie bijgewerkt');
    },
    onError: (error) => {
      console.error('Error updating application:', error);
      toast.error('Fout bij bijwerken sollicitatie');
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      actionType,
      notes,
      nextActionType,
      nextActionAt,
    }: { 
      id: string; 
      status?: ApplicationStatus;
      actionType: string;
      notes?: string;
      nextActionType?: string;
      nextActionAt?: string;
    }): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current application
      const { data: current } = await supabase
        .from('applications')
        .select('status')
        .eq('id', id)
        .single();

      // Create log entry
      await supabase
        .from('application_status_log')
        .insert({
          application_id: id,
          previous_status: current?.status,
          new_status: status || current?.status,
          action_type: actionType,
          notes,
          changed_by: user?.id,
        });

      // Update application
      const updateData: Partial<Application> = {
        last_contact_at: new Date().toISOString(),
      };

      if (status) {
        updateData.status = status;
      }

      // Only update next_action fields if not final status
      if (!FINAL_STATUSES.includes(status || current?.status)) {
        if (nextActionType) updateData.next_action_type = nextActionType;
        if (nextActionAt) updateData.next_action_at = nextActionAt;
      } else {
        updateData.next_action_type = null;
        updateData.next_action_at = null;
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
      queryClient.invalidateQueries({ queryKey: ['activity-log', id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-counts'] });
      toast.success('Status bijgewerkt');
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Fout bij bijwerken status');
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-counts'] });
      toast.success('Sollicitatie verwijderd');
    },
    onError: (error) => {
      console.error('Error deleting application:', error);
      toast.error('Fout bij verwijderen sollicitatie');
    },
  });
}
