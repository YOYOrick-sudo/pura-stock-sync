import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceTicket, TicketStatus, Prioriteit, Vestiging } from '@/types/maintenance';

const TICKETS_KEY = 'maintenance-tickets';

export function useMaintenanceTickets(vestiging?: Vestiging | 'alles') {
  return useQuery({
    queryKey: [TICKETS_KEY, vestiging],
    queryFn: async () => {
      let query = (supabase as any)
        .from('maintenance_tickets')
        .select('*, melder:maintenance_users!melder_id(*)')
        .order('aangemaakt_op', { ascending: false });

      if (vestiging && vestiging !== 'alles') {
        query = query.eq('vestiging', vestiging);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MaintenanceTicket[];
    },
  });
}

export function useMaintenanceTicket(id: string | null) {
  return useQuery({
    queryKey: [TICKETS_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .select('*, melder:maintenance_users!melder_id(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as MaintenanceTicket;
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: {
      vestiging: Vestiging;
      titel: string;
      toelichting?: string;
      prioriteit: Prioriteit;
      melder_id: string;
    }) => {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .insert(ticket)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      const { data, error } = await supabase
        .from('maintenance_tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

export function useTicketCounts(vestiging?: Vestiging | 'alles') {
  const { data: tickets } = useMaintenanceTickets(vestiging);

  const hoog = tickets?.filter(t => t.prioriteit === 'hoog' && t.status !== 'afgehandeld').length ?? 0;
  const openstaand = tickets?.filter(t => t.status !== 'afgehandeld').length ?? 0;
  const afgehandeld = tickets?.filter(t => t.status === 'afgehandeld').length ?? 0;

  return { hoog, openstaand, afgehandeld };
}
