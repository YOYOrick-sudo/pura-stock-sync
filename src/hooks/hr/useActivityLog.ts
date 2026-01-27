import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationStatusLog } from '@/types/hr';

export function useActivityLog(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['activity-log', applicationId],
    queryFn: async (): Promise<ApplicationStatusLog[]> => {
      if (!applicationId) return [];
      
      const { data, error } = await supabase
        .from('application_status_log')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApplicationStatusLog[];
    },
    enabled: !!applicationId,
  });
}
