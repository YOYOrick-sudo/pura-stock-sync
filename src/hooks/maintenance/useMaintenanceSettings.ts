import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceSetting } from '@/types/maintenance';

const SETTINGS_KEY = 'maintenance-settings';

export function useMaintenanceSettings() {
  return useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('maintenance_settings')
        .select('*');
      if (error) throw error;
      return data as MaintenanceSetting[];
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data, error } = await (supabase as any)
        .from('maintenance_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] });
    },
  });
}
