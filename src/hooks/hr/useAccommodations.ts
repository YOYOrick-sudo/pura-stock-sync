import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Accommodation, 
  AccommodationFormData, 
  AccommodationOccupancy,
  AccommodationAssignment 
} from '@/types/hr';
import { toast } from 'sonner';

export function useAccommodations() {
  return useQuery({
    queryKey: ['accommodations'],
    queryFn: async (): Promise<Accommodation[]> => {
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Accommodation[];
    },
  });
}

export function useAccommodation(id: string | undefined) {
  return useQuery({
    queryKey: ['accommodations', id],
    queryFn: async (): Promise<Accommodation | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Accommodation | null;
    },
    enabled: !!id,
  });
}

export function useAccommodationOccupancy() {
  return useQuery({
    queryKey: ['accommodation-occupancy'],
    queryFn: async (): Promise<AccommodationOccupancy[]> => {
      const { data, error } = await supabase
        .from('accommodation_occupancy')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as AccommodationOccupancy[];
    },
  });
}

export function useAccommodationAssignments(accommodationId?: string) {
  return useQuery({
    queryKey: ['accommodation-assignments', accommodationId],
    queryFn: async (): Promise<AccommodationAssignment[]> => {
      let query = supabase
        .from('accommodation_assignments')
        .select(`
          *,
          candidate:candidates(*),
          accommodation:accommodations(*)
        `)
        .order('start_date', { ascending: false });

      if (accommodationId) {
        query = query.eq('accommodation_id', accommodationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AccommodationAssignment[];
    },
  });
}

export function useCreateAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccommodationFormData): Promise<Accommodation> => {
      const { data: accommodation, error } = await supabase
        .from('accommodations')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return accommodation as Accommodation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-occupancy'] });
      toast.success('Woonruimte aangemaakt');
    },
    onError: (error) => {
      console.error('Error creating accommodation:', error);
      toast.error('Fout bij aanmaken woonruimte');
    },
  });
}

export function useUpdateAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AccommodationFormData> }): Promise<Accommodation> => {
      const { data: accommodation, error } = await supabase
        .from('accommodations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return accommodation as Accommodation;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['accommodations'] });
      queryClient.invalidateQueries({ queryKey: ['accommodations', id] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-occupancy'] });
      toast.success('Woonruimte bijgewerkt');
    },
    onError: (error) => {
      console.error('Error updating accommodation:', error);
      toast.error('Fout bij bijwerken woonruimte');
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      accommodation_id: string;
      candidate_id: string;
      start_date: string;
      end_date?: string;
      notes?: string;
    }): Promise<AccommodationAssignment> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: assignment, error } = await supabase
        .from('accommodation_assignments')
        .insert({
          ...data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('full capacity')) {
          throw new Error('Deze woonruimte is vol in de gekozen periode');
        }
        throw error;
      }
      return assignment as AccommodationAssignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-occupancy'] });
      toast.success('Huisvesting toegewezen');
    },
    onError: (error: Error) => {
      console.error('Error creating assignment:', error);
      toast.error(error.message || 'Fout bij toewijzen huisvesting');
    },
  });
}

export function useEndAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate: string }): Promise<void> => {
      const { error } = await supabase
        .from('accommodation_assignments')
        .update({ 
          status: 'ended',
          end_date: endDate,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accommodation-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['accommodation-occupancy'] });
      toast.success('Huisvesting beëindigd');
    },
    onError: (error) => {
      console.error('Error ending assignment:', error);
      toast.error('Fout bij beëindigen huisvesting');
    },
  });
}
