import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { hashPin } from './useMaintenanceAuth';
import type { MaintenanceUser, MaintenanceRol, Vestiging } from '@/types/maintenance';

const USERS_KEY = 'maintenance-users';

export function useMaintenanceUsers() {
  return useQuery({
    queryKey: [USERS_KEY],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('maintenance_users')
        .select('*')
        .order('naam');
      if (error) throw error;
      return data as MaintenanceUser[];
    },
  });
}

export function useCreateMaintenanceUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: {
      naam: string;
      rol: MaintenanceRol;
      vestiging: Vestiging;
      pincode: string;
    }) => {
      const pincode_hash = await hashPin(user.pincode);
      const { data, error } = await (supabase as any)
        .from('maintenance_users')
        .insert({
          naam: user.naam,
          rol: user.rol,
          vestiging: user.vestiging,
          pincode_hash,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}

export function useUpdateMaintenanceUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      naam?: string;
      rol?: MaintenanceRol;
      vestiging?: Vestiging;
      pincode?: string;
      actief?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.naam !== undefined) updateData.naam = updates.naam;
      if (updates.rol !== undefined) updateData.rol = updates.rol;
      if (updates.vestiging !== undefined) updateData.vestiging = updates.vestiging;
      if (updates.actief !== undefined) updateData.actief = updates.actief;
      if (updates.pincode) {
        updateData.pincode_hash = await hashPin(updates.pincode);
      }

      const { data, error } = await supabase
        .from('maintenance_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_KEY] });
    },
  });
}
