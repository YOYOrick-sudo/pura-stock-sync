import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Info, Calendar as CalendarIcon, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { vestigingenVan, type Periode, type VestKeuze } from './types';
import { EUR0 } from './chartHelpers';

const DAG_NL = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Row = {
  vestiging: string;
  isodow: number;
  uur: number;
  n_dagen: number;
  gem_omzet: number;
  gem_headcount: number;
  gem_fte: number;
  gem_loonkosten: number;
  pct_vangnet: number;
  loonkosten_bron: 'schatting' | 'eitje';
  verspilling: number;
};

/** Bepaalt maand vorig jaar (bv nu juli 2026 → 1 t/m 31 juli 2025). */
function sameMonthLastYear(base: Date): { van: string; tot: string; label: string } {
  const y = base.getFullYear() - 1;
  const m = base.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return {
    van: first.toISOString().slice(0, 10),
    tot: last.toISOString().slice(0, 10),
    label: format(first, 'LLLL yyyy', { locale: nl }),
  };
}

type InstellingRow = { vestiging: string; service_uur_start: number; service_uur_eind: number };

export function CijfersLozeUren({ periode, vestigingKeuze, van: pvan, tot: ptot }: Props) {
  const [vooruit, setVooruit] = useState(false);
  const vestigingen = vestigingenVan(vestigingKeuze);
  const { toast } = useToast();
  const qc = useQueryClient();

  const roleQ = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.rpc('get_user_role', { uid: user.id });
      return (data as string | null) ?? null;
    },
    staleTime: 60_000,
  });
  const isOwner = roleQ.data === 'owner' || roleQ.data === 'admin';

  const ref = useMemo(() => {
    if (!vooruit) return { van: pvan, tot: ptot, label: null as string | null };
    const base = new Date(ptot);
    if (isNaN(base.getTime())) return { van: pvan, tot: ptot, label: null };
    const { van, tot, label } = sameMonthLastYear(base);
    return { van, tot, label };
  }, [vooruit, pvan, ptot]);

  const q = useQuery({
    queryKey: ['cijfers-loze-uren', vestigingKeuze, ref.van, ref.tot],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_loze_uren', {
        p_vestigingen: vestigingen, p_van: ref.van, p_tot: ref.tot, p_top: 12,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });

  const rows = q.data ?? [];
  const totVerspilling = rows.reduce((s, r) => s + Number(r.verspilling), 0);

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: 'hsl(var(--warning, 32 95% 44%))' }} />
            Loze uren — waar de bezetting z'n eigen loon niet terugverdient
          </div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>
            Loonkosten boven doel-percentage van omzet, binnen service-uren, ≥ 2 waarnemingen.
            {ref.label && (
              <> · <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>gebaseerd op {ref.label}</span></>
            )}
          </div>
        </div>
        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {isOwner && <ServiceUrenPopover onSaved={() => qc.invalidateQueries({ queryKey: ['cijfers-loze-uren'] })} />}
          <button
            type="button"
            onClick={() => setVooruit((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs font-medium border transition-colors"
            style={{
              background: vooruit ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
              color: vooruit ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              borderColor: vooruit ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border))',
            }}
          >
            <CalendarIcon size={13} />
            {vooruit ? 'Vooruitkijk: aan' : 'Vooruitkijk (vorig jaar)'}
          </button>
        </div>
      </div>

      {q.isLoading ? (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-[10px]" />)}
        </div>
      ) : q.error ? (
        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.3)', fontSize: 12.5, color: 'hsl(var(--destructive))' }}>
          <b>RPC-fout:</b> {(q.error as any)?.message ?? String(q.error)}
        </div>
      ) : rows.length === 0 ? (
        <div style={{ marginTop: 18, padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted) / 0.3)', borderRadius: 12 }}>
          Geen loze uren gevonden in deze periode — bezetting matcht de omzet binnen het doel-percentage.
        </div>
        <>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>Totale verspilling top-{rows.length}:</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>
              {EUR0.format(totVerspilling)}
            </div>
          </div>

          <ol style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0 }}>
            {rows.map((r, i) => {
              const dn = DAG_NL[r.isodow - 1] ?? '?';
              const uur = String(r.uur).padStart(2, '0');
              const uurEnd = String((r.uur + 1) % 24).padStart(2, '0');
              const isSchat = r.loonkosten_bron === 'schatting';
              const vangnetPct = Math.round(Number(r.pct_vangnet) * 100);
              return (
                <li key={i} style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr auto', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: i === 0 ? 'hsl(var(--destructive) / 0.06)' : 'hsl(var(--muted) / 0.35)',
                  border: `1px solid ${i === 0 ? 'hsl(var(--destructive) / 0.2)' : 'hsl(var(--border))'}`,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: 'hsl(var(--muted-foreground))',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{i + 1}</div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))', lineHeight: 1.4 }}>
                      <span style={{ textTransform: 'capitalize' }}>{r.vestiging}</span>
                      {' · '}
                      <span>{dn} {uur}–{uurEnd}u</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3, lineHeight: 1.45 }}>
                      Gem. <b style={{ color: 'hsl(var(--foreground))' }}>{EUR0.format(Number(r.gem_omzet))}</b> omzet,
                      {' '}<b style={{ color: 'hsl(var(--foreground))' }}>{Number(r.gem_headcount).toFixed(1)} pers</b>
                      {' '}({Number(r.gem_fte).toFixed(2)} FTE),
                      {' '}<b style={{ color: 'hsl(var(--foreground))' }}>{EUR0.format(Number(r.gem_loonkosten))}</b> loonkosten
                      {isSchat && (
                        <span title={`Deels op vangnet-uurloon (~${vangnetPct}%). Werkelijke euro's kunnen afwijken.`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            marginLeft: 6, padding: '1px 6px', borderRadius: 6,
                            background: 'hsl(var(--warning, 32 95% 44%) / 0.15)',
                            color: 'hsl(var(--warning, 32 95% 34%))',
                            fontSize: 10, fontWeight: 700, letterSpacing: 0.2,
                          }}>
                          <Info size={10} /> schatting
                        </span>
                      )}
                      {' '}· <span style={{ color: 'hsl(var(--muted-foreground))' }}>{r.n_dagen} dgn</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: 92 }}>
                    <div style={{ fontSize: 10.5, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: 0.4 }}>Verspilling</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--destructive))', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                      {EUR0.format(Number(r.verspilling))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div style={{ marginTop: 12, fontSize: 10.5, color: 'hsl(var(--muted-foreground))' }}>
            "Verspilling" = gem. loonkosten − (gem. omzet × loonkosten-doelpercentage). Alleen uren binnen service-venster van de vestiging.
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Service-uren-venster popover (owner only)                           */
/* ------------------------------------------------------------------ */
function ServiceUrenPopover({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<InstellingRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data, error } = await supabase
        .from('cijfers_instellingen')
        .select('vestiging, service_uur_start, service_uur_eind')
        .order('vestiging');
      if (error) { toast({ title: 'Kon instellingen niet laden', description: error.message, variant: 'destructive' }); return; }
      setRows((data ?? []) as InstellingRow[]);
    })();
  }, [open, toast]);

  const save = async () => {
    setSaving(true);
    try {
      for (const r of rows) {
        const s = Math.max(0, Math.min(23, Number(r.service_uur_start)));
        const e = Math.max(s + 1, Math.min(24, Number(r.service_uur_eind)));
        const { error } = await supabase
          .from('cijfers_instellingen')
          .update({ service_uur_start: s, service_uur_eind: e })
          .eq('vestiging', r.vestiging);
        if (error) throw error;
      }
      toast({ title: 'Service-venster opgeslagen' });
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast({ title: 'Opslaan mislukt', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Service-venster per vestiging"
          className="inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-xs font-medium border transition-colors hover:bg-muted"
          style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}
        >
          <Settings2 size={13} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="text-sm font-semibold mb-1">Service-venster per vestiging</div>
        <div className="text-xs text-muted-foreground mb-3">Uren buiten dit venster tellen niet mee als "loze uren" (prep, schoonmaak, sluit).</div>
        <div className="space-y-2.5">
          {rows.map((r, idx) => (
            <div key={r.vestiging} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
              <Label className="text-sm capitalize">{r.vestiging}</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number" min={0} max={23}
                  className="h-8 w-14 text-center"
                  value={r.service_uur_start}
                  onChange={(e) => setRows((prev) => prev.map((p, i) => i === idx ? { ...p, service_uur_start: Number(e.target.value) } : p))}
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                  type="number" min={1} max={24}
                  className="h-8 w-14 text-center"
                  value={r.service_uur_eind}
                  onChange={(e) => setRows((prev) => prev.map((p, i) => i === idx ? { ...p, service_uur_eind: Number(e.target.value) } : p))}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">uur</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuleren</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Opslaan…' : 'Opslaan'}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
