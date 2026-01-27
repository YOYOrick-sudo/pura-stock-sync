import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Application, FINAL_STATUSES, InboxTab } from '@/types/hr';

interface InboxCounts {
  new: number;
  today: number;
  overdue: number;
}

export function useInboxCounts() {
  return useQuery({
    queryKey: ['inbox-counts'],
    queryFn: async (): Promise<InboxCounts> => {
      const { data, error } = await supabase
        .from('applications')
        .select('owner_user_id, next_action_at, status');

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const applications = data as Pick<Application, 'owner_user_id' | 'next_action_at' | 'status'>[];

      const counts: InboxCounts = {
        new: 0,
        today: 0,
        overdue: 0,
      };

      applications.forEach((app) => {
        const isFinal = FINAL_STATUSES.includes(app.status);
        
        // New: no owner
        if (!app.owner_user_id && !isFinal) {
          counts.new++;
          return;
        }

        if (isFinal) return;

        const nextAction = app.next_action_at ? new Date(app.next_action_at) : null;

        // Overdue: past or null next_action for non-final
        if (!nextAction || nextAction < today) {
          counts.overdue++;
          return;
        }

        // Today: next_action is today
        if (nextAction >= today && nextAction < tomorrow) {
          counts.today++;
        }
      });

      return counts;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useInboxApplications(tab: InboxTab) {
  return useQuery({
    queryKey: ['inbox-applications', tab],
    queryFn: async (): Promise<Application[]> => {
      let query = supabase
        .from('applications')
        .select(`
          *,
          candidate:candidates(*)
        `)
        .not('status', 'in', `(${FINAL_STATUSES.join(',')})`)
        .order('created_at', { ascending: false });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (tab === 'new') {
        query = query.is('owner_user_id', null);
      } else if (tab === 'today') {
        query = query
          .gte('next_action_at', today.toISOString())
          .lt('next_action_at', tomorrow.toISOString());
      } else if (tab === 'overdue') {
        // Overdue: next_action_at < today OR next_action_at is null
        // We need to handle this with OR logic
        const { data: overdueData, error: overdueError } = await supabase
          .from('applications')
          .select(`
            *,
            candidate:candidates(*)
          `)
          .not('status', 'in', `(${FINAL_STATUSES.join(',')})`)
          .lt('next_action_at', today.toISOString())
          .order('next_action_at', { ascending: true });

        const { data: nullData, error: nullError } = await supabase
          .from('applications')
          .select(`
            *,
            candidate:candidates(*)
          `)
          .not('status', 'in', `(${FINAL_STATUSES.join(',')})`)
          .is('next_action_at', null)
          .not('owner_user_id', 'is', null) // Has owner but no next action
          .order('created_at', { ascending: false });

        if (overdueError) throw overdueError;
        if (nullError) throw nullError;

        // Combine and deduplicate
        const combined = [...(overdueData || []), ...(nullData || [])];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return unique as Application[];
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
  });
}
