import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area, Bar, CartesianGrid, ComposedChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import {
  EUR, VEST_KLEUR, granulariteitVoor, vestigingenVan,
  type Periode, type VestKeuze, type Vestiging,
} from './types';
import { CijfersTooltipCard, type TooltipRow } from './CijfersTooltip';
import { useCountUp } from './useCountUp';

const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const GREY = 'hsl(var(--muted-foreground))';

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
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `€${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (abs >= 1_000) return `€${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace('.', ',')}k`;
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
      rows.push(entry);
    }
    return rows;
  }, [curQ.data, prevQ.data, gran]);

  const totalCur = useMemo(() => data.reduce((s, d) => s + (d.curTotaal ?? 0), 0), [data]);
  const totalPrev = useMemo(() => data.reduce((s, d) => s + (d.prevTotaal ?? 0), 0), [data]);
  const totalPct = totalPrev > 0 ? ((totalCur - totalPrev) / totalPrev) * 100 : null;
  const avg = useMemo(() => {
    const nonZero = data.filter((d) => d.curTotaal > 0);
    return nonZero.length ? totalCur / nonZero.length : 0;
  }, [data, totalCur]);

  const totalCurAnim = useCountUp(totalCur, 500);

  if (curQ.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-[340px] rounded-[12px] opacity-70" />
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
  const isLine = gran === 'uur';
  const showStacked = !isLine && vestigingKeuze === 'Beide';

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      {/* Header: KPI + legend */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
          <div className="mt-1 flex items-baseline gap-3">
            <div className="text-3xl font-semibold tabular-nums text-foreground">{EUR.format(totalCurAnim)}</div>
            {totalPct !== null && (
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  totalPct >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {totalPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {totalPct >= 0 ? '+' : ''}{totalPct.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">
            {subtitle}  ·  vorige periode <span className="text-foreground/80 font-medium">{EUR.format(totalPrev)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {showStacked ? (
            series.map((v) => <Chip key={v} color={VEST_KLEUR[v]} label={v} />)
          ) : (
            <Chip color="hsl(var(--primary))" label="Deze periode" />
          )}
          <Chip color={GREY} label="Vorige periode" soft />
        </div>
      </div>

      {/* Chart */}
      <div className="h-[340px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }} barCategoryGap="22%">
            <defs>
              <linearGradient id="curFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.32} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prevFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREY} stopOpacity={0.22} />
                <stop offset="100%" stopColor={GREY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="hsl(var(--border))" strokeOpacity={0.55} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
              dy={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => fmtEurCompact(Number(v))}
              width={56}
            />
            <Tooltip
              content={<Tt showPerVest={showStacked} series={series} />}
              cursor={
                isLine
                  ? { stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3', strokeOpacity: 0.4 }
                  : { fill: 'hsl(var(--primary) / 0.06)', radius: 8 }
              }
            />
            {avg > 0 && (
              <ReferenceLine
                y={avg}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 5"
                strokeOpacity={0.35}
                label={{ value: `gem ${fmtEurCompact(avg)}`, position: 'insideTopRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
            )}

            {/* Vorige periode ALTIJD als zachte grijze area/staaf, gedempt op de achtergrond */}
            {isLine ? (
              <Area
                type="monotone"
                dataKey="prevTotaal"
                stroke={GREY}
                strokeWidth={1.25}
                strokeDasharray="4 4"
                fill="url(#prevFill)"
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 3, fill: GREY, stroke: 'hsl(var(--card))', strokeWidth: 1.5 }}
              />
            ) : (
              <Bar dataKey="prevTotaal" fill={GREY} fillOpacity={0.16} radius={[6, 6, 0, 0]} maxBarSize={44} />
            )}

            {/* Huidige periode: sprekend */}
            {isLine ? (
              <>
                <Area type="monotone" dataKey="curTotaal" stroke="none" fill="url(#curFill)" isAnimationActive={false} />
                <Area
                  type="monotone"
                  dataKey="curTotaal"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="transparent"
                  dot={false}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2.5 }}
                />
              </>
            ) : showStacked ? (
              series.map((v, i) => (
                <Bar
                  key={v}
                  dataKey={`cur_${v}`}
                  name={v}
                  stackId="cur"
                  fill={VEST_KLEUR[v]}
                  radius={i === series.length - 1 ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={44}
                />
              ))
            ) : (
              <Bar dataKey="curTotaal" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} maxBarSize={44} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Chip({ color, label, soft }: { color: string; label: string; soft?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/60 bg-muted/40 text-[11px] font-medium text-foreground/80">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: color, opacity: soft ? 0.55 : 1 }}
      />
      {label}
    </div>
  );
}

function Tt({ active, payload, label, showPerVest, series }: any) {
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
    if (rows.length === 0) rows.push({ label: 'Deze periode', color: 'hsl(var(--primary))', value: cur });
  } else {
    rows.push({ label: 'Deze periode', color: 'hsl(var(--primary))', value: cur, extra: `${entry.curBonnen ?? 0} bonnen` });
  }
  rows.push({ label: 'Vorige periode', color: GREY, value: prev });
  return <CijfersTooltipCard title={label} rows={rows} deltaPct={pct} />;
}
