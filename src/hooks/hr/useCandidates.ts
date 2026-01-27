import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Candidate, CandidateFormData } from '@/types/hr';
import { toast } from 'sonner';

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async (): Promise<Candidate[]> => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Candidate[];
    },
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: async (): Promise<Candidate | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Candidate | null;
    },
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CandidateFormData): Promise<Candidate> => {
      const { data: candidate, error } = await supabase
        .from('candidates')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return candidate as Candidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Kandidaat aangemaakt');
    },
    onError: (error) => {
      console.error('Error creating candidate:', error);
      toast.error('Fout bij aanmaken kandidaat');
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CandidateFormData> }): Promise<Candidate> => {
      const { data: candidate, error } = await supabase
        .from('candidates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return candidate as Candidate;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
      toast.success('Kandidaat bijgewerkt');
    },
    onError: (error) => {
      console.error('Error updating candidate:', error);
      toast.error('Fout bij bijwerken kandidaat');
    },
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Kandidaat verwijderd');
    },
    onError: (error) => {
      console.error('Error deleting candidate:', error);
      toast.error('Fout bij verwijderen kandidaat');
    },
  });
}
