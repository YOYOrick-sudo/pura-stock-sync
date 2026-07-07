import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';

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

type Row = { bron: string; klaar_op: string | null; gestart_op: string; status: string };

export function BijgewerktRegel() {
  const q = useQuery({
    queryKey: ['bijgewerkt-per-bron'],
    queryFn: async () => {
      // Laatste succesvolle run per bron (lightspeed + eitje)
      const { data, error } = await supabase
        .from('sync_runs')
        .select('bron, klaar_op, gestart_op, status')
        .eq('status', 'ok')
        .not('klaar_op', 'is', null)
        .order('klaar_op', { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const laatsteLs = rows.find((r) => r.bron === 'lightspeed');
      const laatsteEitje = rows.find((r) => r.bron === 'eitje');
      return { ls: laatsteLs, eitje: laatsteEitje };
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const nu = Date.now();
  const lsMs = q.data?.ls?.klaar_op ? nu - new Date(q.data.ls.klaar_op).getTime() : null;
  const eitjeMs = q.data?.eitje?.klaar_op ? nu - new Date(q.data.eitje.klaar_op).getTime() : null;

  const WARN = 90 * 60_000; // 90 min → amber
  const ALARM = 4 * 60 * 60_000; // 4 uur → rood

  const worst = Math.max(lsMs ?? 0, eitjeMs ?? 0);
  const level: 'ok' | 'warn' | 'alarm' =
    worst > ALARM ? 'alarm' : worst > WARN ? 'warn' : 'ok';

  const nieuwste = [q.data?.ls?.klaar_op, q.data?.eitje?.klaar_op]
    .filter(Boolean)
    .sort()
    .reverse()[0];

  const tooltipParts: string[] = [];
  if (q.data?.ls?.klaar_op) tooltipParts.push(`Lightspeed: ${formatRelative(q.data.ls.klaar_op)}`);
  if (q.data?.eitje?.klaar_op) tooltipParts.push(`Eitje: ${formatRelative(q.data.eitje.klaar_op)}`);

  const { isOwner } = useRole();
  const text = nieuwste ? `Bijgewerkt: ${formatRelative(nieuwste as string)}` : 'Nog niet bijgewerkt';
  const classes = cn(
    'text-xs text-center pt-2 transition-colors',
    level === 'ok' && 'text-muted-foreground',
    level === 'warn' && 'text-amber-600',
    level === 'alarm' && 'text-red-600 font-medium',
  );

  if (isOwner) {
    return (
      <div className={classes} title={tooltipParts.join(' · ')}>
        <Link to="/settings/bronnen" className="hover:underline hover:text-foreground transition-colors">
          {text}
        </Link>
      </div>
    );
  }

  return (
    <div className={classes} title={tooltipParts.join(' · ')}>
      {text}
    </div>
  );
}
