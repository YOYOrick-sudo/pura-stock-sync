import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend,
  Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { BarChart3 } from 'lucide-react';
import {
  EUR, VEST_KLEUR, granulariteitVoor, vestigingenVan,
  type Periode, type VestKeuze, type Vestiging,
} from './types';
import { CijfersTooltipCard, type TooltipRow } from './CijfersTooltip';

const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const GREY = 'hsl(var(--muted-foreground))';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Row = { bucket: string; vestiging: string; omzet: number; bonnen: number };

function labelVoor(bucket: string, gran: 'uur' | 'dag' | 'maand'): string {
  const d = new Date(bucket);
  if (gran === 'uur') return `${d.getHours().toString().padStart(2, '0')}:00`;
  if (gran === 'dag') return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
  return MND_NL[d.getMonth()];
}

function shift(date: string, dagen: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - dagen);
  return d.toISOString().slice(0, 10);
}

export function CijfersHoofdgrafiek({ periode, vestigingKeuze, van, tot }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const gran = granulariteitVoor(periode, van, tot);
  const lengte = Math.round((new Date(tot).getTime() - new Date(van).getTime()) / 86400000) + 1;
  const prevVan = shift(van, lengte);
  const prevTot = shift(tot, lengte);

  const curQ = useQuery({
    queryKey: ['cijfers-tijdreeks', 'cur', periode, vestigingKeuze, van, tot, gran],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_tijdreeks', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot, p_granulariteit: gran,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });
  const prevQ = useQuery({
    queryKey: ['cijfers-tijdreeks', 'prev', periode, vestigingKeuze, prevVan, prevTot, gran],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_tijdreeks', {
        p_vestigingen: vestigingen, p_van: prevVan, p_tot: prevTot, p_granulariteit: gran,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });

  const title =
    periode === 'vandaag' ? 'Vandaag per uur' :
    periode === 'week' ? 'Deze week per dag' :
    periode === 'maand' ? 'Deze maand per dag' :
    periode === 'jaar' ? 'Dit jaar per maand' :
    `Aangepast: ${van} → ${tot}`;

  const data = useMemo(() => {
    const cur = curQ.data ?? [];
    const prev = prevQ.data ?? [];
    // Totaal per bucket (som over vestigingen). Behoud per-vestiging huidig als optionele stapel.
    const map = new Map<string, any>();
    const idx = (i: number, arr: any[]) => arr[i]?.key ?? '';

    // Bouw de "geordende" set buckets uit cur (fallback prev). We aligneren prev op index (dus offset even lang).
    const curBuckets: string[] = [];
    for (const r of cur) if (!curBuckets.includes(r.bucket)) curBuckets.push(r.bucket);
    curBuckets.sort();

    const prevBuckets: string[] = [];
    for (const r of prev) if (!prevBuckets.includes(r.bucket)) prevBuckets.push(r.bucket);
    prevBuckets.sort();

    const n = Math.max(curBuckets.length, prevBuckets.length);
    for (let i = 0; i < n; i++) {
      const cb = curBuckets[i];
      const pb = prevBuckets[i];
      const key = cb ?? pb ?? String(i);
      const label = cb ? labelVoor(cb, gran) : pb ? labelVoor(pb, gran) : '';
      const entry: any = { key, label, curTotaal: 0, prevTotaal: 0, curBonnen: 0, prevBonnen: 0 };
      if (cb) {
        for (const r of cur.filter((x) => x.bucket === cb)) {
          entry.curTotaal += Number(r.omzet);
          entry.curBonnen += Number(r.bonnen);
          entry[`cur_${r.vestiging}`] = Number(r.omzet);
        }
      }
      if (pb) {
        for (const r of prev.filter((x) => x.bucket === pb)) {
          entry.prevTotaal += Number(r.omzet);
          entry.prevBonnen += Number(r.bonnen);
        }
      }
      map.set(key, entry);
    }
    return [...map.values()];
  }, [curQ.data, prevQ.data, gran]);

  if (curQ.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-base font-semibold">{title}</div>
        </div>
        <div className="h-[320px] flex flex-col justify-end gap-1">
          <Skeleton className="h-[280px] rounded-[10px] opacity-70" />
          <div className="flex gap-3 pt-2">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-2 flex-1" />)}
          </div>
        </div>
      </div>
    );
  }
  if (curQ.error) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <EmptyState icon={BarChart3} title="Kan grafiek niet laden" description={(curQ.error as Error).message} />
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="text-base font-semibold mb-4">{title}</div>
        <EmptyState icon={BarChart3} title="Geen data in deze periode" description="Zodra er omzet is, verschijnt hij hier." />
      </div>
    );
  }

  const series: Vestiging[] = vestigingen;
  const totalCur = data.reduce((s, d) => s + (d.curTotaal ?? 0), 0);
  const totalPrev = data.reduce((s, d) => s + (d.prevTotaal ?? 0), 0);
  const totalPct = totalPrev > 0 ? ((totalCur - totalPrev) / totalPrev) * 100 : null;

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Vergelijking met {prevVan} → {prevTot}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <LegendDot color="hsl(var(--primary))" label="Deze periode" />
          <LegendDot color={GREY} label="Vorige periode" dashed />
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {gran === 'uur' || gran === 'maand' || vestigingKeuze !== 'Beide' ? (
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="curFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 4" stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => EUR.format(Number(v))} width={72} />
              <Tooltip content={<Tt seriesLabels={{ cur: 'Deze periode', prev: 'Vorige periode' }} />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }} />
              {/* Prev als staafjes/lijn in grijs */}
              {gran !== 'uur' ? (
                <Bar dataKey="prevTotaal" name="Vorige periode" fill={GREY} fillOpacity={0.18} radius={[8, 8, 0, 0]} />
              ) : (
                <Line type="monotone" dataKey="prevTotaal" name="Vorige periode" stroke={GREY} strokeWidth={1.5} strokeDasharray="4 4" dot={false} activeDot={{ r: 3, fill: GREY, stroke: 'hsl(var(--card))', strokeWidth: 2 }} />
              )}
              {/* Cur */}
              {gran === 'uur' ? (
                <>
                  <Area type="monotone" dataKey="curTotaal" stroke="none" fill="url(#curFill)" isAnimationActive={false} />
                  <Line type="monotone" dataKey="curTotaal" name="Deze periode" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" dot={false} activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2 }} />
                </>
              ) : (
                <Bar dataKey="curTotaal" name="Deze periode" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} />
              )}
            </ComposedChart>
          ) : (
            /* Per-vestiging staven (Week/Maand + Beide) */
            <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => EUR.format(Number(v))} width={72} />
              <Tooltip content={<Tt seriesLabels={{ cur: 'Deze periode', prev: 'Vorige periode' }} showPerVest series={series} />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
              <Bar dataKey="prevTotaal" name="Vorige periode" fill={GREY} fillOpacity={0.18} radius={[8, 8, 0, 0]} />
              {series.map((v) => (
                <Bar key={v} dataKey={`cur_${v}`} name={v} stackId="cur" fill={VEST_KLEUR[v]} radius={[10, 10, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground mt-2">
        <span>Totaal deze periode <span className="text-foreground font-medium tabular-nums">{EUR.format(totalCur)}</span></span>
        <span>·</span>
        <span>Vorige <span className="tabular-nums">{EUR.format(totalPrev)}</span></span>
        {totalPct !== null && (
          <span className={`px-1.5 py-0.5 rounded-md font-semibold ${totalPct >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {totalPct >= 0 ? '+' : ''}{totalPct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span
        className="inline-block w-6 h-[3px] rounded"
        style={{
          background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)` : color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function Tt({ active, payload, label, seriesLabels, showPerVest, series }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload ?? {};
  const cur = Number(entry.curTotaal ?? 0);
  const prev = Number(entry.prevTotaal ?? 0);
  const pct = prev > 0 ? ((cur - prev) / prev) * 100 : null;
  const rows: TooltipRow[] = [];
  if (showPerVest && series) {
    for (const v of series as Vestiging[]) {
      const val = Number(entry[`cur_${v}`] ?? 0);
      if (val > 0) rows.push({ label: v, color: VEST_KLEUR[v], value: val });
    }
    if (rows.length === 0) rows.push({ label: seriesLabels.cur, color: 'hsl(var(--primary))', value: cur });
  } else {
    rows.push({ label: seriesLabels.cur, color: 'hsl(var(--primary))', value: cur, extra: `${entry.curBonnen ?? 0} bonnen` });
  }
  rows.push({ label: seriesLabels.prev, color: GREY, value: prev });
  return <CijfersTooltipCard title={label} rows={rows} deltaPct={pct} />;
}
