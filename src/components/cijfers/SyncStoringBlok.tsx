import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Storing = { jobname: string; start_time: string; status: string; melding: string };

function tijd(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', {
    timeZone: 'Europe/Amsterdam', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Toont de laatste mislukte automatische ophaalpogingen (laatste 48 uur). */
export function SyncStoringBlok() {
  const q = useQuery({
    queryKey: ['sync-cron-storingen'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('rpc_sync_cron_storingen');
      if (error) throw error;
      return ((data ?? []) as Storing[]);
    },
    refetchInterval: 120_000,
  });

  const rijen = q.data ?? [];
  if (rijen.length === 0) return null;

  return (
    <div className="rounded-[20px] border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <span className="text-sm font-semibold text-destructive">
          Automatisch ophalen mislukt ({rijen.length}× in 48 uur)
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        De cijfers worden dan niet bijgewerkt. Hieronder de laatste pogingen.
      </p>
      <ul className="space-y-1.5">
        {rijen.slice(0, 5).map((r, i) => (
          <li key={i} className="text-xs text-foreground">
            <span className="font-medium">{tijd(r.start_time)}</span>
            <span className="text-muted-foreground"> · {r.jobname} · </span>
            <span className="break-words">{r.melding.split('\n')[0] || r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
