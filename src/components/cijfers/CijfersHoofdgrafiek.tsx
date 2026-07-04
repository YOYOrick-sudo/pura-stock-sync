import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area, CartesianGrid, ComposedChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { BarChart3 } from 'lucide-react';
import {
  EUR, granulariteitVoor, vestigingenVan,
  type Periode, type VestKeuze,
} from './types';
import { CijfersTooltipCard, type TooltipRow } from './CijfersTooltip';

const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const PREV_GREY = '#C9C6C0';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Row = { bucket: string; vestiging: string; omzet: number; bonnen: number };

function labelVoor(bucket: string, gran: 'uur' | 'dag' | 'maand'): string {
  const d = new Date(bucket);
  if (gran === 'uur') return `${d.getHours().toString().padStart(2, '0')}u`;
  if (gran === 'dag') return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
  return MND_NL[d.getMonth()];
}
function shift(date: string, dagen: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() - dagen);
  return d.toISOString().slice(0, 10);
}
function fmtEurCompact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `€${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (a >= 1_000) return `€${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace('.', ',')}k`;
  return `€${Math.round(v)}`;
}
function fmtDateNL(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MND_NL[d.getMonth()]}`;
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
    periode === 'vandaag' ? 'Omzet per uur' :
    periode === 'week' ? 'Omzet per dag — deze week' :
    periode === 'maand' ? 'Omzet per dag — deze maand' :
    periode === 'jaar' ? 'Omzet per maand — dit jaar' :
    'Omzet — aangepaste periode';
  const subtitle = `${fmtDateNL(van)} – ${fmtDateNL(tot)}  ·  vs  ${fmtDateNL(prevVan)} – ${fmtDateNL(prevTot)}`;

  const data = useMemo(() => {
    const cur = curQ.data ?? [];
    const prev = prevQ.data ?? [];
    const curBuckets: string[] = [];
    for (const r of cur) if (!curBuckets.includes(r.bucket)) curBuckets.push(r.bucket);
    curBuckets.sort();
    const prevBuckets: string[] = [];
    for (const r of prev) if (!prevBuckets.includes(r.bucket)) prevBuckets.push(r.bucket);
    prevBuckets.sort();
    const n = Math.max(curBuckets.length, prevBuckets.length);
    const rows: any[] = [];
    for (let i = 0; i < n; i++) {
      const cb = curBuckets[i];
      const pb = prevBuckets[i];
      const key = cb ?? pb ?? String(i);
      const label = cb ? labelVoor(cb, gran) : pb ? labelVoor(pb, gran) : '';
      const entry: any = { key, label, cur: 0, prev: 0, curBonnen: 0, prevBonnen: 0 };
      if (cb) for (const r of cur.filter((x) => x.bucket === cb)) {
        entry.cur += Number(r.omzet);
        entry.curBonnen += Number(r.bonnen);
      }
      if (pb) for (const r of prev.filter((x) => x.bucket === pb)) {
        entry.prev += Number(r.omzet);
        entry.prevBonnen += Number(r.bonnen);
      }
      rows.push(entry);
    }
    return rows;
  }, [curQ.data, prevQ.data, gran]);

  const totalCur = useMemo(() => data.reduce((s, d) => s + (d.cur ?? 0), 0), [data]);
  const totalPrev = useMemo(() => data.reduce((s, d) => s + (d.prev ?? 0), 0), [data]);
  const totalPct = totalPrev > 0 ? ((totalCur - totalPrev) / totalPrev) * 100 : null;
  const totalBonnen = useMemo(() => data.reduce((s, d) => s + (d.curBonnen ?? 0), 0), [data]);

  if (curQ.isLoading) return <LoadingSkeleton />;
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
        <CardHeading title={title} subtitle={subtitle} />
        <EmptyState icon={BarChart3} title="Geen data in deze periode" description="Zodra er omzet is, verschijnt hij hier." />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <CardHeading title={title} subtitle={subtitle} />
        <div className="flex items-center gap-3">
          <LegendSwatch color="hsl(var(--primary))" label="Deze periode" />
          <LegendSwatch color={PREV_GREY} label="Vorige periode" dashed />
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="curAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.20} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} horizontal={true} strokeDasharray="2 5" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={18}
              dy={6}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtEurCompact(Number(v))}
              width={48}
            />
            <Tooltip
              content={<Tt />}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.6 }}
            />

            {/* Vorige periode — grey dashed line */}
            <Line
              type="monotone"
              dataKey="prev"
              stroke={PREV_GREY}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3, fill: PREV_GREY, stroke: 'hsl(var(--card))', strokeWidth: 1.5 }}
              isAnimationActive={true}
            />

            {/* Huidige periode — gradient area onder de lijn */}
            <Area
              type="monotone"
              dataKey="cur"
              stroke="none"
              fill="url(#curAreaFill)"
              isAnimationActive={true}
            />
            <Line
              type="monotone"
              dataKey="cur"
              stroke="hsl(var(--primary))"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2.5 }}
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Totals row */}
      <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-3 gap-4">
        <TotalCell label="Deze periode" value={EUR.format(totalCur)} highlight />
        <TotalCell label="Vorige periode" value={EUR.format(totalPrev)} />
        <TotalCell
          label="Verschil"
          value={totalPct === null ? '—' : `${totalPct >= 0 ? '+' : ''}${totalPct.toFixed(1)}%`}
          sub={`${totalBonnen.toLocaleString('nl-NL')} bonnen`}
          deltaPct={totalPct}
        />
      </div>
    </div>
  );
}

function CardHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[15px] font-semibold text-foreground">{title}</div>
      <div className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">{subtitle}</div>
    </div>
  );
}

function LegendSwatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span
        className="inline-block h-[2.5px] w-5 rounded"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
            : color,
        }}
      />
      {label}
    </div>
  );
}

function TotalCell({ label, value, sub, highlight, deltaPct }: { label: string; value: string; sub?: string; highlight?: boolean; deltaPct?: number | null }) {
  const showDelta = typeof deltaPct === 'number';
  const up = showDelta && deltaPct! >= 0;
  return (
    <div>
      <div className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-[16px] font-bold tabular-nums ${highlight ? 'text-foreground' : 'text-foreground/80'}`}>
        {showDelta ? (
          <span className={up ? 'text-emerald-700' : 'text-rose-700'}>
            {up ? '▲ ' : '▼ '}{value.replace(/^-/, '')}
          </span>
        ) : value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-[300px] rounded-[12px] opacity-70" />
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/60">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Tt({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload ?? {};
  const cur = Number(entry.cur ?? 0);
  const prev = Number(entry.prev ?? 0);
  const bonnen = Number(entry.curBonnen ?? 0);
  const pct = prev > 0 ? ((cur - prev) / prev) * 100 : null;
  const rows: TooltipRow[] = [
    { label: 'Deze periode', color: 'hsl(var(--primary))', value: cur, extra: bonnen > 0 ? `≈ ${bonnen} bonnen` : undefined },
    { label: 'Vorige periode', color: PREV_GREY, value: prev },
  ];
  return <CijfersTooltipCard title={label} rows={rows} deltaPct={pct} />;
}
