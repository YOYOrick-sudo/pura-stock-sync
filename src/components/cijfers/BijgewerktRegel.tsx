import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} u geleden`;
  const days = Math.floor(hrs / 24);
  return `${days} d geleden`;
}

export function BijgewerktRegel() {
  const q = useQuery({
    queryKey: ['bijgewerkt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_runs')
        .select('klaar_op, gestart_op, type, status')
        .not('klaar_op', 'is', null)
        .order('klaar_op', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: true,
  });

  const ts = q.data?.klaar_op ?? q.data?.gestart_op;
  return (
    <div className="text-xs text-muted-foreground text-center pt-2">
      {ts ? `Bijgewerkt: ${formatRelative(ts)}` : 'Nog niet bijgewerkt'}
    </div>
  );
}
