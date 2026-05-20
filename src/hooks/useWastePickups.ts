import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WasteSource = 'tst' | 'gemeente';
export type WasteFraction = 'restafval' | 'gft' | 'papier' | 'glas';

export interface WastePickup {
  id: string;
  pickup_date: string;
  source: WasteSource;
  fraction: WasteFraction;
  location: string;
  sluit_task_id: string | null;
  tussen_task_id: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  acknowledged_reason: string | null;
  sluit_completed?: boolean;
}

// Window rond de zichtbare week: 30 dagen terug, 90 dagen vooruit.
// Block-key groepeert weken in 8-weeks-blokken zodat we niet bij elke
// week-klik refetchen, maar wel automatisch bij ver navigeren.
const RANGE_BACK_DAYS = 30;
const RANGE_FORWARD_DAYS = 90;
const BLOCK_WEEKS = 8;

export function useWastePickups(location: string | null, weekOffset: number = 0) {
  const qc = useQueryClient();
  const blockKey = Math.floor(weekOffset / BLOCK_WEEKS);

  useEffect(() => {
    if (!location || location !== 'Midsland') return;
    const ch = supabase
      .channel('waste-pickups-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_pickups' }, () => {
        qc.invalidateQueries({ queryKey: ['waste-pickups', location] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'foh_tasks' }, () => {
        qc.invalidateQueries({ queryKey: ['waste-pickups', location] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [location, qc]);

  return useQuery({
    queryKey: ['waste-pickups', location, blockKey],
    enabled: location === 'Midsland',
    queryFn: async () => {
      // Center op de zichtbare week (maandag) in plaats van vandaag
      const center = new Date();
      center.setDate(center.getDate() + weekOffset * 7);
      const start = new Date(center); start.setDate(start.getDate() - RANGE_BACK_DAYS);
      const end = new Date(center); end.setDate(end.getDate() + RANGE_FORWARD_DAYS);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const { data: pickups, error } = await supabase
        .from('waste_pickups')
        .select('*')
        .eq('location', 'Midsland')
        .gte('pickup_date', fmt(start))
        .lte('pickup_date', fmt(end))
        .order('pickup_date', { ascending: true });
      if (error) throw error;

      const taskIds = (pickups ?? [])
        .map((p) => p.sluit_task_id)
        .filter((x): x is string => !!x);

      let taskMap = new Map<string, boolean>();
      if (taskIds.length) {
        const { data: tasks } = await supabase
          .from('foh_tasks')
          .select('id, completed')
          .in('id', taskIds);
        taskMap = new Map((tasks ?? []).map((t) => [t.id, t.completed]));
      }

      return (pickups ?? []).map((p) => ({
        ...p,
        sluit_completed: p.sluit_task_id ? taskMap.get(p.sluit_task_id) ?? false : false,
      })) as WastePickup[];
    },
  });
}
