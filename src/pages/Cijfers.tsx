import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ExternalLink, RefreshCw, Link2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusTone } from '@/components/pura/StatusBadge';
import { EmptyState } from '@/components/pura/EmptyState';
import { toast } from '@/hooks/use-toast';

type StatusRow = {
  vestiging: 'Midsland' | 'West';
  merchant_id: string;
  status: 'niet_gekoppeld' | 'gekoppeld' | 'token_verlopen' | 'fout';
  laatste_sync_op: string | null;
  laatste_fout: string | null;
  token_geldig: boolean;
  token_expires_at: string | null;
  updated_at: string;
};

type SyncRun = {
  id: string;
  vestiging: string | null;
  type: 'dagelijks' | 'handmatig' | 'backfill';
  periode_van: string | null;
  periode_tot: string | null;
  bonnen_verwerkt: number | null;
  status: 'bezig' | 'ok' | 'fout';
  foutmelding: string | null;
  gestart_op: string;
  klaar_op: string | null;
};

const statusTone: Record<StatusRow['status'], StatusTone> = {
  niet_gekoppeld: 'neutral',
  gekoppeld: 'success',
  token_verlopen: 'warning',
  fout: 'danger',
};
const statusLabel: Record<StatusRow['status'], string> = {
  niet_gekoppeld: 'Niet gekoppeld',
  gekoppeld: 'Gekoppeld',
  token_verlopen: 'Token verlopen',
  fout: 'Fout',
};

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} u geleden`;
  const days = Math.floor(hrs / 24);
  return `${days} d geleden`;
}

export default function Cijfers() {
  const qc = useQueryClient();

  const statusQ = useQuery({
    queryKey: ['lightspeed-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_lightspeed_status')
        .select('*')
        .order('vestiging');
      if (error) throw error;
      return (data ?? []) as StatusRow[];
    },
    refetchOnWindowFocus: true,
  });

  const runsQ = useQuery({
    queryKey: ['sync-runs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_runs')
        .select('*')
        .order('gestart_op', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as SyncRun[];
    },
  });

  const startOAuth = useMutation({
    mutationFn: async (vestiging: 'Midsland' | 'West') => {
      const { data, error } = await supabase.functions.invoke('lightspeed-oauth', {
        body: { action: 'start', vestiging },
      });
      if (error) throw error;
      if (!data?.authorize_url) throw new Error('Geen authorize URL ontvangen');
      window.location.href = data.authorize_url;
    },
    onError: (e: Error) => toast({ title: 'Koppelen mislukt', description: e.message, variant: 'destructive' }),
  });

  const syncNow = useMutation({
    mutationFn: async (vestiging: 'Midsland' | 'West') => {
      const { data, error } = await supabase.functions.invoke('lightspeed-sync', {
        body: { type: 'handmatig', vestiging },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'Sync gestart', description: JSON.stringify(data).slice(0, 200) });
      qc.invalidateQueries({ queryKey: ['lightspeed-status'] });
      qc.invalidateQueries({ queryKey: ['sync-runs-recent'] });
    },
    onError: (e: Error) => toast({ title: 'Sync mislukt', description: e.message, variant: 'destructive' }),
  });

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cijfers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Koppelingen met Lightspeed L-Series per vestiging. Het dashboard met omzet-cijfers volgt in een volgende sprint.
          </p>
        </div>

        {/* Koppelingskaarten */}
        {statusQ.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : statusQ.error ? (
          <EmptyState icon={AlertCircle} title="Kan status niet laden" description={(statusQ.error as Error).message} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(statusQ.data ?? []).map((row) => (
              <ConnectionCard
                key={row.vestiging}
                row={row}
                onKoppel={() => startOAuth.mutate(row.vestiging)}
                onSync={() => syncNow.mutate(row.vestiging)}
                busy={startOAuth.isPending || syncNow.isPending}
              />
            ))}
          </div>
        )}

        {/* Laatste sync-runs */}
        <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Laatste 5 sync-runs</h2>
          {runsQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Laden…</div>
          ) : (runsQ.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">Nog geen sync uitgevoerd.</div>
          ) : (
            <div className="space-y-2">
              {(runsQ.data ?? []).map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0 text-sm">
                  <div className="w-24 shrink-0 font-medium capitalize">{r.type}</div>
                  <div className="w-28 shrink-0 text-muted-foreground">{r.vestiging ?? '—'}</div>
                  <div className="flex-1 truncate text-muted-foreground">
                    {r.periode_van ?? '?'} → {r.periode_tot ?? '?'} · {r.bonnen_verwerkt ?? 0} bonnen
                  </div>
                  <div className="shrink-0">
                    <StatusBadge tone={r.status === 'ok' ? 'success' : r.status === 'fout' ? 'danger' : 'info'}>
                      {r.status}
                    </StatusBadge>
                  </div>
                  <div className="w-32 shrink-0 text-right text-xs text-muted-foreground">
                    {formatRelative(r.gestart_op)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

function ConnectionCard({
  row, onKoppel, onSync, busy,
}: {
  row: StatusRow;
  onKoppel: () => void;
  onSync: () => void;
  busy: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-semibold text-foreground">{row.vestiging}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Merchant ID: {row.merchant_id}</div>
        </div>
        <StatusBadge tone={statusTone[row.status]}>{statusLabel[row.status]}</StatusBadge>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Laatste sync: <span className="text-foreground">{formatRelative(row.laatste_sync_op)}</span>
      </div>

      {row.laatste_fout && (
        <div className="mb-4 rounded-[14px] bg-destructive/10 text-destructive text-xs p-3 border border-destructive/20">
          {row.laatste_fout}
        </div>
      )}

      <div className="flex gap-2">
        {row.status === 'gekoppeld' ? (
          <>
            <Button onClick={onSync} disabled={busy} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" /> Sync nu
            </Button>
            <Button onClick={onKoppel} disabled={busy} variant="outline">
              Opnieuw koppelen
            </Button>
          </>
        ) : (
          <Button onClick={onKoppel} disabled={busy} className="flex-1">
            <Link2 className="w-4 h-4 mr-2" />
            {row.status === 'niet_gekoppeld' ? `Koppel ${row.vestiging}` : 'Opnieuw koppelen'}
            <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-60" />
          </Button>
        )}
      </div>
    </div>
  );
}
