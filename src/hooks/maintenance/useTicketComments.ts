import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TicketComment } from '@/types/maintenance';

const COMMENTS_KEY = 'ticket-comments';

export function useTicketComments(ticketId: string | null) {
  return useQuery({
    queryKey: [COMMENTS_KEY, ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      // Embedded join op maintenance_users faalt stil voor niet-admins (RLS).
      // UI valt daarom terug op `auteur_naam` (backfilled).
      const { data, error } = await (supabase as any)
        .from('ticket_comments')
        .select('*, auteur:maintenance_users!auteur_id(*)')
        .eq('ticket_id', ticketId)
        .order('aangemaakt_op', { ascending: true });
      if (error) throw error;
      return data as TicketComment[];
    },
    enabled: !!ticketId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: {
      ticket_id: string;
      auteur_user_id: string;
      auteur_naam: string;
      tekst: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('ticket_comments')
        .insert(comment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_KEY, variables.ticket_id] });
    },
  });
}
