import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatNlDatumTijd, isVerlopen, sorteerOpDeadline, vandaagAmsterdam } from '@/lib/mt';

function formatDeadline(d: string | null) {
  if (!d) return '—';
  return new Date(`${d}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MtActiepunten() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['mt-actiepunten'],
    queryFn: async () => {
      const [punten, sync] = await Promise.all([
        supabase.from('mt_actiepunten').select('notion_page_id, wat, wie, deadline, status, notion_url'),
        supabase.from('mt_sync_status').select('laatst_gesynchroniseerd').eq('naam', 'mt_actiepunten').maybeSingle(),
      ]);
      if (punten.error) throw punten.error;
      return { punten: sorteerOpDeadline(punten.data ?? []), laatst: sync.data?.laatst_gesynchroniseerd ?? null };
    },
  });

  const vandaag = vandaagAmsterdam();

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <div className="space-y-1">
          {data?.laatst && (
            <p className="text-sm text-muted-foreground">Bijgewerkt op {formatNlDatumTijd(data.laatst)}</p>
          )}
          <p className="text-sm text-muted-foreground">Alleen-lezen overzicht uit Notion. Wijzigen gebeurt in Notion.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : isError ? (
          <p className="text-sm text-destructive">Actiepunten konden niet worden geladen.</p>
        ) : !data || data.punten.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen open actiepunten.</p>
        ) : (
          <div className="rounded-polar-lg border bg-card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground">
              <span>Wie</span><span>Wat</span><span>Deadline</span><span>Status</span><span className="sr-only">Link</span>
            </div>
            <ul className="divide-y">
              {data.punten.map((p) => {
                const verlopen = isVerlopen(p.deadline, vandaag);
                return (
                  <li key={p.notion_page_id} className="grid gap-1 px-4 py-3 md:grid-cols-[1fr_2fr_1fr_1fr_auto] md:gap-4 md:items-center">
                    <span className="text-sm font-medium">{p.wie || '—'}</span>
                    <span className="text-sm whitespace-pre-wrap">{p.wat}</span>
                    <span className={cn('text-sm flex items-center gap-2', verlopen && 'text-destructive font-medium')}>
                      {formatDeadline(p.deadline)}
                      {verlopen && <Badge variant="destructive">Verlopen</Badge>}
                    </span>
                    <span className="text-sm text-muted-foreground">{p.status || '—'}</span>
                    {p.notion_url ? (
                      <a
                        href={p.notion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Open in Notion <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : <span />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
