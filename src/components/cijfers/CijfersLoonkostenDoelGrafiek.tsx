import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Pencil, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMagLoonkostenZien } from '@/hooks/useMagLoonkostenZien';
import { vestigingenVan, type Periode, type Vestiging, type VestKeuze, EUR2 } from './types';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type RpcRow = {
  bucket: string; vestiging: Vestiging;
  loonkosten: number; omzet: number;
  omzet_bron?: 'lightspeed' | 'eitje' | 'gemengd' | 'geen';
};
type InstRow = { vestiging: Vestiging; loon_pct_doel: number };

function granVoor(van: string, tot: string): 'dag' | 'week' | 'maand' {
  const dagen = Math.round((new Date(tot).getTime() - new Date(van).getTime()) / 86400000) + 1;
  if (dagen <= 31) return 'dag';
  if (dagen <= 180) return 'week';
  return 'maand';
}
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
function weeknr(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
}
function bucketLabel(iso: string, gran: 'dag' | 'week' | 'maand'): string {
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '—';
  if (gran === 'maand') return `${MND_NL[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  if (gran === 'week') return `w${weeknr(d)}`;
  return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
}


const KLEUR_GOED = 'hsl(142 71% 45%)'; // groen — onder doel
const KLEUR_SLECHT = 'hsl(0 72% 51%)'; // rood — boven doel

type DataPunt = {
  bucket: string; label: string;
  pct: number | null; // gecombineerd
  totOmzet: number; totLoonkosten: number;
  perVest: Array<{ vestiging: Vestiging; pct: number | null; omzet: number; loonkosten: number; doel: number; boven: boolean }>;
  status: 'goed' | 'slecht' | 'geen';
};

export function CijfersLoonkostenDoelGrafiek({ vestigingKeuze, van, tot }: Props) {
  const magLoon = useMagLoonkostenZien();
  const vestigingen = vestigingenVan(vestigingKeuze);
  const gran = granVoor(van, tot);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [popOpen, setPopOpen] = useState(false);

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

  const instQ = useQuery({
    queryKey: ['cijfers-instellingen-doel'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cijfers_instellingen').select('vestiging, loon_pct_doel');
      if (error) throw error;
      return (data ?? []) as InstRow[];
    },
    staleTime: 60_000,
  });
  const doelPerVest = useMemo(() => {
    const m: Record<Vestiging, number> = { Midsland: 30, West: 30 };
    for (const r of instQ.data ?? []) m[r.vestiging] = Number(r.loon_pct_doel);
    return m;
  }, [instQ.data]);

  const q = useQuery({
    queryKey: ['cijfers-loondoel', vestigingKeuze, van, tot, gran],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_uren_tijdreeks', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot, p_granulariteit: gran,
      });
      if (error) throw error;
      return (data ?? []) as RpcRow[];
    },
    enabled: magLoon,
    refetchOnWindowFocus: true,
  });

  const data: DataPunt[] = useMemo(() => {
    if (!q.data?.length) return [];
    // Groepeer per bucket → per vestiging
    const buckets = new Map<string, Map<Vestiging, { omzet: number; loonkosten: number }>>();
    for (const r of q.data) {
      const b = buckets.get(r.bucket) ?? new Map();
      const cur = b.get(r.vestiging) ?? { omzet: 0, loonkosten: 0 };
      cur.omzet += Number(r.omzet ?? 0);
      cur.loonkosten += Number(r.loonkosten ?? 0);
      b.set(r.vestiging, cur);
      buckets.set(r.bucket, b);
    }
    const result: DataPunt[] = [];
    for (const [bucket, perVestMap] of buckets) {
      let totO = 0, totL = 0;
      const perVest: DataPunt['perVest'] = [];
      let ergensBoven = false;
      let ergensData = false;
      for (const v of vestigingen) {
        const cur = perVestMap.get(v) ?? { omzet: 0, loonkosten: 0 };
        const pct = cur.omzet > 0 ? (cur.loonkosten / cur.omzet) * 100 : null;
        const doel = doelPerVest[v];
        const boven = pct !== null && pct > doel;
        if (boven) ergensBoven = true;
        if (pct !== null) ergensData = true;
        totO += cur.omzet; totL += cur.loonkosten;
        perVest.push({ vestiging: v, pct, omzet: cur.omzet, loonkosten: cur.loonkosten, doel, boven });
      }
      const pctCombi = totO > 0 ? (totL / totO) * 100 : null;
      const status: DataPunt['status'] = !ergensData || pctCombi === null ? 'geen' : ergensBoven ? 'slecht' : 'goed';
      result.push({
        bucket, label: bucketLabel(bucket, gran),
        pct: pctCombi === null ? null : Number(pctCombi.toFixed(1)),
        totOmzet: totO, totLoonkosten: totL,
        perVest, status,
      });
    }
    // Sorteer op bucket, filter buckets zonder data
    return result
      .filter((d) => {
        const dt = new Date(d.bucket);
        return !isNaN(dt.getTime()) && dt.getFullYear() >= 2000;
      })
      .sort((a, b) => a.bucket.localeCompare(b.bucket))
      .filter((d) => d.status !== 'geen');

  }, [q.data, gran, vestigingen, doelPerVest]);

  const periodeGem = useMemo(() => {
    if (!data.length) return null;
    const sO = data.reduce((s, d) => s + d.totOmzet, 0);
    const sL = data.reduce((s, d) => s + d.totLoonkosten, 0);
    return sO > 0 ? Number(((sL / sO) * 100).toFixed(1)) : null;
  }, [data]);

  const doelen: Array<{ vestiging: Vestiging | 'gedeeld'; waarde: number }> = useMemo(() => {
    if (vestigingen.length === 1) return [{ vestiging: vestigingen[0], waarde: doelPerVest[vestigingen[0]] }];
    if (doelPerVest.Midsland === doelPerVest.West) return [{ vestiging: 'gedeeld', waarde: doelPerVest.Midsland }];
    return vestigingen.map((v) => ({ vestiging: v, waarde: doelPerVest[v] }));
  }, [vestigingen, doelPerVest]);

  const yMax = useMemo(() => {
    const hoogste = Math.max(...data.map((d) => d.pct ?? 0), ...doelen.map((d) => d.waarde));
    return Math.max(Math.ceil((hoogste + 5) / 10) * 10, 50);
  }, [data, doelen]);

  if (!magLoon) return null;

  const subtitle =
    doelen.length === 1
      ? `${gran === 'dag' ? 'per dag' : gran === 'week' ? 'per week' : 'per maand'} · doel ${doelen[0].waarde}%`
      : `${gran === 'dag' ? 'per dag' : gran === 'week' ? 'per week' : 'per maand'} · doelen per vestiging`;

  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in p-5">
      <div className="flex items-baseline justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Loonkosten-% vs doel</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{subtitle}</span>
          {isOwner && (
            <Popover open={popOpen} onOpenChange={setPopOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Doel aanpassen">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Loonkosten-doel (%)</div>
                  {(['Midsland', 'West'] as Vestiging[]).map((v) => (
                    <DoelInput
                      key={v}
                      vestiging={v}
                      huidig={doelPerVest[v]}
                      onSaved={async () => {
                        await qc.invalidateQueries({ queryKey: ['cijfers-instellingen-doel'] });
                        toast({ title: 'Doel opgeslagen' });
                      }}
                      onError={(m) => toast({ title: 'Opslaan mislukt', description: m, variant: 'destructive' })}
                    />
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Zelfde waarde wordt later gebruikt voor loonkosten-alerts.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-[280px] w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={Target} title="Geen data" description="Geen dagen met omzet in deze periode." />
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false} axisLine={false} width={44}
                domain={[0, yMax]}
              />
              <Tooltip content={<TT />} cursor={{ fill: 'hsl(var(--muted) / 0.35)' }} />
              {doelen.map((d) => (
                <ReferenceLine
                  key={`doel-${d.vestiging}`}
                  y={d.waarde}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  label={{
                    value: d.vestiging === 'gedeeld' ? `Doel ${d.waarde}%` : `${d.vestiging} ${d.waarde}%`,
                    fill: 'hsl(var(--primary))',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              ))}
              {periodeGem !== null && (
                <ReferenceLine
                  y={periodeGem}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{
                    value: `Gem ${periodeGem}%`,
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />
              )}
              <Bar
                dataKey="pct"
                isAnimationActive={false}
                activeBar={false}
                radius={[4, 4, 0, 0]}
              >
                {data.map((d) => (
                  <Cell
                    key={`cell-${d.bucket}`}
                    fill={d.status === 'slecht' ? KLEUR_SLECHT : KLEUR_GOED}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function DoelInput({
  vestiging, huidig, onSaved, onError,
}: {
  vestiging: Vestiging; huidig: number;
  onSaved: () => void; onError: (m: string) => void;
}) {
  const [waarde, setWaarde] = useState<string>(String(huidig));
  const [saving, setSaving] = useState(false);
  const gewijzigd = Number(waarde) !== huidig && waarde !== '';

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label className="text-xs">{vestiging}</Label>
        <Input
          type="number"
          min={1}
          max={99}
          step="0.5"
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <Button
        size="sm"
        variant={gewijzigd ? 'default' : 'outline'}
        disabled={!gewijzigd || saving}
        onClick={async () => {
          const num = Number(waarde);
          if (!(num > 0 && num < 100)) {
            onError('Waarde moet tussen 0 en 100 liggen');
            return;
          }
          setSaving(true);
          const { error } = await supabase
            .from('cijfers_instellingen')
            .update({ loon_pct_doel: num })
            .eq('vestiging', vestiging);
          setSaving(false);
          if (error) onError(error.message);
          else onSaved();
        }}
        className="h-8"
      >
        {saving ? '…' : 'Opslaan'}
      </Button>
    </div>
  );
}

function TT({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload?: DataPunt }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      borderRadius: 12, padding: '10px 12px', boxShadow: '0 14px 30px -10px rgba(0,0,0,0.22)',
      minWidth: 220,
    }}>
      <div style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{d.label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>Loonkosten-%</span>
        <span style={{
          fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          color: d.status === 'slecht' ? KLEUR_SLECHT : KLEUR_GOED,
        }}>
          {d.pct === null ? '—' : `${d.pct.toString().replace('.', ',')}%`}
        </span>
      </div>
      <div style={{ borderTop: '1px dashed hsl(var(--border))', paddingTop: 6, marginTop: 4 }}>
        {d.perVest.map((v) => (
          <div key={v.vestiging} style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '2px 0', fontSize: 11 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: v.boven ? KLEUR_SLECHT : v.pct === null ? 'hsl(var(--muted-foreground))' : KLEUR_GOED,
              flexShrink: 0,
            }} />
            <span style={{ color: 'hsl(var(--muted-foreground))', flex: 1 }}>{v.vestiging}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
              {v.pct === null ? '—' : `${v.pct.toFixed(1).replace('.', ',')}%`}
            </span>
            <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: 10 }}>
              (doel {v.doel}%)
            </span>
          </div>
        ))}
        <div style={{
          display: 'flex', justifyContent: 'space-between', paddingTop: 6, marginTop: 4,
          borderTop: '1px dashed hsl(var(--border))', fontSize: 11,
        }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Omzet</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{EUR2.format(d.totOmzet)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Loonkosten</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{EUR2.format(d.totLoonkosten)}</span>
        </div>
      </div>
    </div>
  );
}
