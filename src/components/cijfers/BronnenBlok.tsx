import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw, Link2, AlertCircle, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusBadge, type StatusTone } from '@/components/pura/StatusBadge';
import { EmptyState } from '@/components/pura/EmptyState';
import { toast } from '@/hooks/use-toast';
import { BackfillProgressDialog, type BackfillState, type WeekResult } from './BackfillProgressDialog';

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function diffDays(vanIso: string, totIso: string): number {
  return Math.round(
    (new Date(`${totIso}T00:00:00Z`).getTime() - new Date(`${vanIso}T00:00:00Z`).getTime()) / 86_400_000,
  ) + 1;
}
function splitInWeken(vanIso: string, totIso: string): { van: string; tot: string }[] {
  const chunks: { van: string; tot: string }[] = [];
  let cursor = vanIso;
  while (cursor <= totIso) {
    const chunkEnd = addDaysISO(cursor, 6);
    const eff = chunkEnd > totIso ? totIso : chunkEnd;
    chunks.push({ van: cursor, tot: eff });
    cursor = addDaysISO(eff, 1);
  }
  return chunks;
}

function isoYesterday(): string {
  return new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
}
function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

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
  bron: string;
  vestiging: string | null;
  type: string;
  periode_van: string | null;
  periode_tot: string | null;
  bonnen_verwerkt: number | null;
  status: string;
  foutmelding: string | null;
  gestart_op: string;
  klaar_op: string | null;
};

type EitjeConn = {
  id: string;
  status: 'niet_gekoppeld' | 'gekoppeld' | 'fout';
  laatste_sync_op: string | null;
  laatste_fout: string | null;
};

type EitjeEnv = {
  id: string;
  eitje_environment_id: string;
  eitje_naam: string | null;
  vestiging: 'Midsland' | 'West' | null;
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

const eitjeTone: Record<EitjeConn['status'], StatusTone> = {
  niet_gekoppeld: 'neutral',
  gekoppeld: 'success',
  fout: 'danger',
};
const eitjeLabel: Record<EitjeConn['status'], string> = {
  niet_gekoppeld: 'Niet gekoppeld',
  gekoppeld: 'Gekoppeld',
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

export function BronnenBlok() {
  const qc = useQueryClient();

  const statusQ = useQuery({
    queryKey: ['lightspeed-status'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_lightspeed_status').select('*').order('vestiging');
      if (error) throw error;
      return (data ?? []) as StatusRow[];
    },
  });

  const runsQ = useQuery({
    queryKey: ['sync-runs-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_runs').select('*')
        .order('gestart_op', { ascending: false }).limit(8);
      if (error) throw error;
      return (data ?? []) as SyncRun[];
    },
  });

  const eitjeConnQ = useQuery({
    queryKey: ['eitje-connection'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eitje_connection').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return (data ?? { id: '', status: 'niet_gekoppeld', laatste_sync_op: null, laatste_fout: null }) as EitjeConn;
    },
  });

  const eitjeEnvsQ = useQuery({
    queryKey: ['eitje-environments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('eitje_environments').select('*').order('eitje_naam');
      if (error) throw error;
      return (data ?? []) as EitjeEnv[];
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

  // ------- Client-side week-loop backfill (>30 dagen) + kleine handmatig-sync (≤30 dagen) -------
  const [backfill, setBackfill] = useState<BackfillState | null>(null);
  const cancelRef = useRef(false);
  const backfillRunning = useRef(false);

  // beforeunload-waarschuwing tijdens actieve loop
  useEffect(() => {
    if (!backfill || backfill.klaar || backfill.geannuleerd) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [backfill]);

  async function fetchWeekOmzet(vestiging: 'Midsland' | 'West', van: string, tot: string): Promise<number> {
    const { data } = await supabase
      .from('omzet_uren')
      .select('omzet_incl')
      .eq('vestiging', vestiging)
      .eq('is_demo', false)
      .gte('werkdag', van)
      .lte('werkdag', tot);
    return (data ?? []).reduce((s: number, r: any) => s + Number(r.omzet_incl ?? 0), 0);
  }

  async function runOneWeek(vestiging: 'Midsland' | 'West', van: string, tot: string): Promise<Omit<WeekResult, 'van' | 'tot' | 'status'>> {
    const t0 = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke('lightspeed-sync', {
        body: { type: 'handmatig', vestiging, van, tot },
      });
      if (error) throw new Error(error.message);
      if (data && (data as any).ok === false) throw new Error((data as any).error ?? 'onbekende fout');
      const bonnen = Number((data as any)?.bonnen ?? 0);
      const omzet = await fetchWeekOmzet(vestiging, van, tot);
      return { bonnen, omzet, duurMs: Math.round(performance.now() - t0), fout: null };
    } catch (e) {
      return { bonnen: null, omzet: null, duurMs: Math.round(performance.now() - t0), fout: (e as Error).message };
    }
  }

  async function runLoop(vestiging: 'Midsland' | 'West', weken: { van: string; tot: string }[], resumeIdx = 0) {
    if (backfillRunning.current) return;
    backfillRunning.current = true;
    cancelRef.current = false;

    for (let i = resumeIdx; i < weken.length; i++) {
      if (cancelRef.current) break;
      // mark bezig
      setBackfill((s) => s && ({
        ...s,
        huidigeIdx: i,
        weken: s.weken.map((w, idx) => idx === i ? { ...w, status: 'bezig' } : w),
      }));
      const res = await runOneWeek(vestiging, weken[i].van, weken[i].tot);
      const status: WeekResult['status'] = res.fout ? 'fout' : 'ok';
      setBackfill((s) => s && ({
        ...s,
        weken: s.weken.map((w, idx) => idx === i ? { ...w, status, ...res } : w),
      }));
      if (i < weken.length - 1) await new Promise((r) => setTimeout(r, 500));
    }

    setBackfill((s) => s && ({ ...s, klaar: true, geannuleerd: cancelRef.current }));
    backfillRunning.current = false;
    qc.invalidateQueries();
  }

  function startBackfill(vestiging: 'Midsland' | 'West', van: string, tot: string) {
    const weken = splitInWeken(van, tot);
    const initial: WeekResult[] = weken.map((w) => ({
      van: w.van, tot: w.tot, status: 'wachtend', bonnen: null, omzet: null, duurMs: null, fout: null,
    }));
    setBackfill({ open: true, vestiging, weken: initial, huidigeIdx: 0, geannuleerd: false, klaar: false });
    void runLoop(vestiging, weken, 0);
  }

  function retryFailed() {
    if (!backfill) return;
    const failedIndices = backfill.weken.map((w, i) => ({ w, i })).filter(({ w }) => w.status === 'fout');
    if (failedIndices.length === 0) return;
    const failed = failedIndices.map(({ w }) => ({ van: w.van, tot: w.tot }));
    // Reset alleen de gefaalde rijen naar wachtend + herbouw weken-array
    const newWeken: WeekResult[] = failed.map((w) => ({
      van: w.van, tot: w.tot, status: 'wachtend', bonnen: null, omzet: null, duurMs: null, fout: null,
    }));
    setBackfill({
      open: true, vestiging: backfill.vestiging,
      weken: newWeken, huidigeIdx: 0, geannuleerd: false, klaar: false,
    });
    void runLoop(backfill.vestiging, failed, 0);
  }

  const syncNow = useMutation({
    mutationFn: async ({ vestiging, van, tot }: { vestiging: 'Midsland' | 'West'; van: string; tot: string }) => {
      const dagen = diffDays(van, tot);
      if (dagen > 30) {
        startBackfill(vestiging, van, tot);
        return { path: 'backfill', dagen };
      }
      // Kleine range: direct één handmatig-invoke (bewezen pad, geen modal nodig)
      const { data, error } = await supabase.functions.invoke('lightspeed-sync', {
        body: { type: 'handmatig', vestiging, van, tot },
      });
      if (error) throw error;
      if (data && (data as any).ok === false) throw new Error((data as any).error ?? 'sync-fout');
      return { path: 'handmatig', dagen, bonnen: (data as any)?.bonnen };
    },
    onSuccess: (res: any, vars) => {
      if (res.path === 'backfill') {
        toast({ title: `Backfill gestart`, description: `${vars.vestiging}: ${res.dagen} dagen in ${splitInWeken(vars.van, vars.tot).length} weken` });
      } else {
        toast({ title: 'Sync klaar', description: `${vars.vestiging}: ${res.bonnen ?? 0} bonnen` });
        qc.invalidateQueries();
      }
    },
    onError: (e: Error) => toast({ title: 'Sync mislukt', description: e.message, variant: 'destructive' }),
  });

  const eitjeVerkennen = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('eitje-sync', { body: { type: 'verkennen' } });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error((data as any)?.error ?? 'Verkennen mislukt');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Verkennen gestart', description: 'Details staan in de sync-runs onder details.' });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast({ title: 'Verkennen mislukt', description: e.message, variant: 'destructive' }),
  });

  const eitjeSync = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('eitje-sync', { body: { type: 'dagelijks' } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.ok) toast({ title: 'Eitje-sync klaar' });
      else toast({ title: 'Eitje-sync', description: data?.error ?? 'Zie sync-runs', variant: 'destructive' });
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast({ title: 'Eitje-sync mislukt', description: e.message, variant: 'destructive' }),
  });

  const mapEnv = useMutation({
    mutationFn: async ({ id, vestiging }: { id: string; vestiging: 'Midsland' | 'West' | null }) => {
      const { error } = await supabase.from('eitje_environments').update({ vestiging }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eitje-environments'] });
    },
    onError: (e: Error) => toast({ title: 'Mapping mislukt', description: e.message, variant: 'destructive' }),
  });

  const eitje = eitjeConnQ.data;
  const envs = eitjeEnvsQ.data ?? [];

  return (
    <div className="space-y-4">
      <BackfillProgressDialog
        state={backfill}
        onClose={() => setBackfill(null)}
        onCancel={() => { cancelRef.current = true; setBackfill((s) => s && ({ ...s, geannuleerd: true })); }}
        onRetryFailed={retryFailed}
      />
      <div className="text-base font-semibold text-foreground">Bronnen</div>



      {statusQ.isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
      ) : statusQ.error ? (
        <EmptyState icon={AlertCircle} title="Kan status niet laden" description={(statusQ.error as Error).message} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(statusQ.data ?? []).map((row) => (
            <div key={row.vestiging} className="bg-card border border-border rounded-[20px] shadow-card p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold">Lightspeed · {row.vestiging}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Merchant: {row.merchant_id}</div>
                </div>
                <StatusBadge tone={statusTone[row.status]}>{statusLabel[row.status]}</StatusBadge>
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Laatste sync: <span className="text-foreground">{formatRelative(row.laatste_sync_op)}</span>
              </div>
              {row.laatste_fout && (
                <div className="mb-3 rounded-[12px] bg-destructive/10 text-destructive text-xs p-2 border border-destructive/20">
                  {row.laatste_fout}
                </div>
              )}
              <div className="flex gap-2">
                {row.status === 'gekoppeld' ? (
                  <>
                    <SyncPopover
                      vestiging={row.vestiging}
                      pending={syncNow.isPending}
                      onSubmit={(van, tot) => syncNow.mutate({ vestiging: row.vestiging, van, tot })}
                    />
                    <Button size="sm" onClick={() => startOAuth.mutate(row.vestiging)} disabled={startOAuth.isPending} variant="outline">
                      Opnieuw koppelen
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => startOAuth.mutate(row.vestiging)} disabled={startOAuth.isPending} className="flex-1">
                    <Link2 className="w-3.5 h-3.5 mr-2" />
                    Koppel {row.vestiging}
                    <ExternalLink className="w-3 h-3 ml-2 opacity-60" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Eitje-kaart */}
      <div className="bg-card border border-border rounded-[20px] shadow-card p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Eitje · personeel & loonkosten
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Gewerkte/geplande uren, loonkosten en Eitje-omzet per dag
            </div>
          </div>
          <StatusBadge tone={eitjeTone[eitje?.status ?? 'niet_gekoppeld']}>
            {eitjeLabel[eitje?.status ?? 'niet_gekoppeld']}
          </StatusBadge>
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          Laatste sync: <span className="text-foreground">{formatRelative(eitje?.laatste_sync_op ?? null)}</span>
        </div>
        {eitje?.laatste_fout && (
          <div className="mb-3 rounded-[12px] bg-destructive/10 text-destructive text-xs p-2 border border-destructive/20 whitespace-pre-wrap">
            {eitje.laatste_fout}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm" variant="outline"
            onClick={() => eitjeVerkennen.mutate()} disabled={eitjeVerkennen.isPending}
          >
            <Search className="w-3.5 h-3.5 mr-2" /> Verkennen
          </Button>
          <Button
            size="sm"
            onClick={() => eitjeSync.mutate()} disabled={eitjeSync.isPending}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Sync nu
          </Button>
          <div className="ml-auto text-[11px] text-muted-foreground self-center">
            Credentials nog niet ingevoerd → verkennen levert een fout tot Eitje reageert.
          </div>
        </div>

        {/* Environment-mapping */}
        <div className="border-t border-border pt-3">
          <div className="text-xs font-semibold mb-2 text-foreground">Eitje-omgevingen → Pura-vestiging</div>
          {envs.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              Nog geen omgevingen gevonden. Draai eerst <span className="font-medium text-foreground">Verkennen</span> zodra Eitje-credentials binnen zijn.
            </div>
          ) : (
            <div className="space-y-1">
              {envs.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{e.eitje_naam ?? '(geen naam)'}</div>
                    <div className="text-muted-foreground text-[11px]">ID: {e.eitje_environment_id}</div>
                  </div>
                  {(['Midsland', 'West'] as const).map((v) => (
                    <Button
                      key={v}
                      size="sm"
                      variant={e.vestiging === v ? 'default' : 'outline'}
                      className="h-7 px-2 text-[11px]"
                      onClick={() => mapEnv.mutate({ id: e.id, vestiging: v })}
                    >
                      {v}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant={e.vestiging === null ? 'secondary' : 'outline'}
                    className="h-7 px-2 text-[11px]"
                    onClick={() => mapEnv.mutate({ id: e.id, vestiging: null })}
                  >
                    Negeren
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-[20px] shadow-card p-5">
        <div className="text-sm font-semibold mb-3">Laatste sync-runs</div>
        {(runsQ.data ?? []).length === 0 ? (
          <div className="text-xs text-muted-foreground">Nog geen sync uitgevoerd.</div>
        ) : (
          <div className="space-y-1">
            {(runsQ.data ?? []).map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0 text-xs">
                <div className="w-16 shrink-0 font-medium capitalize">{r.bron}</div>
                <div className="w-24 shrink-0 capitalize">{r.type}</div>
                <div className="w-24 shrink-0 text-muted-foreground">{r.vestiging ?? '—'}</div>
                <div className="flex-1 truncate text-muted-foreground">
                  {r.periode_van ?? '?'} → {r.periode_tot ?? '?'} · {r.bonnen_verwerkt ?? 0}
                </div>
                <StatusBadge tone={r.status === 'ok' ? 'success' : r.status === 'fout' ? 'danger' : 'info'}>
                  {r.status}
                </StatusBadge>
                <div className="w-28 shrink-0 text-right text-muted-foreground">{formatRelative(r.gestart_op)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SyncPopover({
  vestiging,
  pending,
  onSubmit,
}: {
  vestiging: 'Midsland' | 'West';
  pending: boolean;
  onSubmit: (van: string, tot: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [van, setVan] = useState(isoYesterday());
  const [tot, setTot] = useState(isoYesterday());
  const today = isoToday();
  const valid = van && tot && van <= tot && tot <= today;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" disabled={pending} className="flex-1">
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${pending ? 'animate-spin' : ''}`} /> Sync nu
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3 space-y-3">
        <div className="text-xs font-semibold">Sync {vestiging}</div>
        <div className="space-y-2">
          <label className="block text-[11px] text-muted-foreground">
            Van
            <Input
              type="date"
              value={van}
              max={today}
              onChange={(e) => setVan(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </label>
          <label className="block text-[11px] text-muted-foreground">
            Tot
            <Input
              type="date"
              value={tot}
              max={today}
              min={van}
              onChange={(e) => setTot(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </label>
        </div>
        {!valid && (
          <div className="text-[11px] text-destructive">Van ≤ tot en niet in de toekomst.</div>
        )}
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuleer</Button>
          <Button
            size="sm"
            disabled={!valid || pending}
            onClick={() => {
              onSubmit(van, tot);
              setOpen(false);
            }}
          >
            Sync {van === tot ? van : `${van} → ${tot}`}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
