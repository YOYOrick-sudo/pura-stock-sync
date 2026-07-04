import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area, Bar, CartesianGrid, ComposedChart, ReferenceArea,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  EUR, VEST_KLEUR, granulariteitVoor, vestigingenVan,
  type Periode, type VestKeuze, type Vestiging,
} from './types';
import { CijfersTooltipCard, type TooltipRow } from './CijfersTooltip';
import { useCountUp } from './useCountUp';
import { cn } from '@/lib/utils';

const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const GREY = 'hsl(var(--muted-foreground))';

type Metric = 'omzet' | 'bonnen' | 'gem';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Row = { bucket: string; vestiging: string; omzet: number; bonnen: number };

function labelVoor(bucket: string, gran: 'uur' | 'dag' | 'maand'): string {
  const d = new Date(bucket);
  if (gran === 'uur') return `${d.getHours().toString().padStart(2, '0')}u`;
  if (gran === 'dag') return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
  return MND_NL[d.getMonth()];
}
function isWeekend(bucket: string): boolean {
  const dw = new Date(bucket).getDay();
  return dw === 0 || dw === 6;
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
function fmtNumCompact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (a >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace('.', ',')}k`;
  return `${Math.round(v)}`;
}
function fmtDateNL(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MND_NL[d.getMonth()]}`;
}
/** Nette-tick schaal: 5 stappen op mooie ronde getallen. */
function niceMax(raw: number): number {
  if (raw <= 0) return 10;
  const exp = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

export function CijfersHoofdgrafiek({ periode, vestigingKeuze, van, tot }: Props) {
  const [metric, setMetric] = useState<Metric>('omzet');
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

  /** Bouw gealigneerde rijen met per-metric waarden en per-vestiging-slice. */
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
      const weekend = cb ? isWeekend(cb) : pb ? isWeekend(pb) : false;
      const entry: any = { key, label, weekend, curOmzet: 0, prevOmzet: 0, curBonnen: 0, prevBonnen: 0 };
      if (cb) for (const r of cur.filter((x) => x.bucket === cb)) {
        entry.curOmzet += Number(r.omzet);
        entry.curBonnen += Number(r.bonnen);
        entry[`curOmzet_${r.vestiging}`] = Number(r.omzet);
      }
      if (pb) for (const r of prev.filter((x) => x.bucket === pb)) {
        entry.prevOmzet += Number(r.omzet);
        entry.prevBonnen += Number(r.bonnen);
      }
      entry.curGem = entry.curBonnen > 0 ? entry.curOmzet / entry.curBonnen : 0;
      entry.prevGem = entry.prevBonnen > 0 ? entry.prevOmzet / entry.prevBonnen : 0;
      entry.cur = entry[`cur${cap(metric)}`];
      entry.prev = entry[`prev${cap(metric)}`];
      rows.push(entry);
    }
    return rows;
  }, [curQ.data, prevQ.data, gran, metric]);

  const totalCurOmzet = useMemo(() => data.reduce((s, d) => s + (d.curOmzet ?? 0), 0), [data]);
  const totalPrevOmzet = useMemo(() => data.reduce((s, d) => s + (d.prevOmzet ?? 0), 0), [data]);
  const totalCurBonnen = useMemo(() => data.reduce((s, d) => s + (d.curBonnen ?? 0), 0), [data]);
  const totalPrevBonnen = useMemo(() => data.reduce((s, d) => s + (d.prevBonnen ?? 0), 0), [data]);

  const totalCur = metric === 'omzet' ? totalCurOmzet : metric === 'bonnen' ? totalCurBonnen : totalCurBonnen > 0 ? totalCurOmzet / totalCurBonnen : 0;
  const totalPrev = metric === 'omzet' ? totalPrevOmzet : metric === 'bonnen' ? totalPrevBonnen : totalPrevBonnen > 0 ? totalPrevOmzet / totalPrevBonnen : 0;
  const totalPct = totalPrev > 0 ? ((totalCur - totalPrev) / totalPrev) * 100 : null;

  const nonZero = data.filter((d) => d.cur > 0);
  const avg = nonZero.length ? totalCur / nonZero.length : 0;
  const peak = data.reduce((m, d) => (d.cur > (m?.cur ?? -1) ? d : m), null as any);
  const rawMax = Math.max(...data.map((d) => Math.max(d.cur ?? 0, d.prev ?? 0)), 0);
  const yMax = niceMax(rawMax * 1.08);
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const totalCurAnim = useCountUp(totalCur, 500);
  const totalPrevAnim = useCountUp(totalPrev, 500);
  const avgAnim = useCountUp(avg, 500);
  const peakAnim = useCountUp(peak?.cur ?? 0, 500);

  const fmt = metric === 'omzet' ? (v: number) => EUR.format(v)
    : metric === 'bonnen' ? (v: number) => `${Math.round(v)}`
    : (v: number) => EUR.format(v);
  const fmtCompact = metric === 'bonnen' ? fmtNumCompact : fmtEurCompact;

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
        <div className="text-base font-semibold mb-4">{title}</div>
        <EmptyState icon={BarChart3} title="Geen data in deze periode" description="Zodra er omzet is, verschijnt hij hier." />
      </div>
    );
  }

  const series: Vestiging[] = vestigingen;
  const isLine = gran === 'uur';
  const showStacked = !isLine && vestigingKeuze === 'Beide' && metric === 'omzet';
  const showWeekendBands = gran === 'dag';

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border/60">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              {title}
            </div>
            <div className="mt-1.5 flex items-baseline gap-3">
              <div className="text-[32px] leading-none font-semibold tracking-tight tabular-nums text-foreground">
                {fmt(totalCurAnim)}
              </div>
              <DeltaPill pct={totalPct} />
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">{subtitle}</div>
          </div>

          <MetricTabs value={metric} onChange={setMetric} />
        </div>

        {/* KPI-strip */}
        <div className="mt-5 grid grid-cols-4 gap-0 border-t border-border/60 pt-4 -mx-6 px-6">
          <Kpi label="Vorige periode" value={fmt(totalPrevAnim)} />
          <Kpi label="Gemiddeld / bucket" value={fmt(avgAnim)} />
          <Kpi label="Piek" value={fmt(peakAnim)} sub={peak?.label ? `bij ${peak.label}` : undefined} />
          <Kpi
            label={metric === 'omzet' ? 'Bonnen totaal' : 'Omzet totaal'}
            value={metric === 'omzet' ? fmtNumCompact(totalCurBonnen) : EUR.format(totalCurOmzet)}
            last
          />
        </div>
      </div>

      {/* Chart */}
      <div className="px-6 pt-5 pb-5">
        <div className="flex items-center justify-end gap-2 mb-2">
          {showStacked
            ? series.map((v) => <Chip key={v} color={VEST_KLEUR[v]} label={v} />)
            : <Chip color="hsl(var(--primary))" label="Deze periode" />}
          <Chip color={GREY} label="Vorige periode" dashed />
        </div>

        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 0 }} barCategoryGap="24%">
              <defs>
                <linearGradient id="curFillEnt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Weekend-shading */}
              {showWeekendBands && data.map((d, i) => {
                if (!d.weekend) return null;
                return (
                  <ReferenceArea
                    key={`we-${i}`}
                    x1={d.key}
                    x2={d.key}
                    strokeOpacity={0}
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.05}
                  />
                );
              })}

              <CartesianGrid vertical={false} strokeDasharray="2 6" stroke="hsl(var(--border))" strokeOpacity={0.6} />
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
                orientation="right"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtCompact(Number(v))}
                domain={[0, yMax]}
                ticks={yTicks}
                width={52}
              />
              <Tooltip
                content={<Tt showPerVest={showStacked} series={series} metric={metric} />}
                cursor={
                  isLine
                    ? { stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeOpacity: 0.5 }
                    : { fill: 'hsl(var(--primary) / 0.06)' }
                }
              />

              {/* Vorige periode — rustig, dotted lijn, geen fill */}
              {isLine ? (
                <Area
                  type="monotone"
                  dataKey="prev"
                  stroke={GREY}
                  strokeWidth={1.25}
                  strokeDasharray="3 4"
                  fill="transparent"
                  isAnimationActive={false}
                  dot={false}
                  activeDot={{ r: 3, fill: GREY, stroke: 'hsl(var(--card))', strokeWidth: 1.5 }}
                />
              ) : (
                <Bar dataKey="prev" fill={GREY} fillOpacity={0.14} radius={[4, 4, 0, 0]} maxBarSize={44} />
              )}

              {/* Huidige periode */}
              {isLine ? (
                <>
                  <Area type="monotone" dataKey="cur" stroke="none" fill="url(#curFillEnt)" isAnimationActive={false} />
                  <Area
                    type="monotone"
                    dataKey="cur"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="transparent"
                    dot={false}
                    activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2.5 }}
                  />
                </>
              ) : showStacked ? (
                series.map((v, i) => (
                  <Bar
                    key={v}
                    dataKey={`curOmzet_${v}`}
                    name={v}
                    stackId="cur"
                    fill={VEST_KLEUR[v]}
                    radius={i === series.length - 1 ? [10, 10, 0, 0] : [0, 0, 0, 0]}
                    maxBarSize={44}
                  />
                ))
              ) : (
                <Bar dataKey="cur" fill="hsl(var(--primary))" radius={[10, 10, 0, 0]} maxBarSize={44} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function cap(m: Metric): 'Omzet' | 'Bonnen' | 'Gem' {
  return (m.charAt(0).toUpperCase() + m.slice(1)) as any;
}

function MetricTabs({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  const tabs: { id: Metric; label: string }[] = [
    { id: 'omzet', label: 'Omzet' },
    { id: 'bonnen', label: 'Bonnen' },
    { id: 'gem', label: 'Gem. bon' },
  ];
  return (
    <div className="inline-flex items-center rounded-[10px] border border-border bg-muted/40 p-0.5">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors',
            value === t.id
              ? 'bg-card text-foreground shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({ label, value, sub, last }: { label: string; value: string; sub?: string; last?: boolean }) {
  return (
    <div className={cn('px-4 first:pl-0 last:pr-0', !last && 'border-r border-border/60')}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-[15px] font-semibold tabular-nums text-foreground leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{sub}</div>}
    </div>
  );
}

function DeltaPill({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <Minus className="h-3 w-3" /> geen vgl.
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function Chip({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-[11px] font-medium text-foreground/80">
      <span
        className="inline-block h-[3px] w-4 rounded"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`
            : color,
          opacity: dashed ? 0.7 : 1,
        }}
      />
      {label}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-border/60 space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3 w-64" />
        <div className="grid grid-cols-4 gap-4 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-6">
        <Skeleton className="h-[340px] rounded-[12px] opacity-70" />
      </div>
    </div>
  );
}

function Tt({ active, payload, label, showPerVest, series, metric }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload ?? {};
  const cur = Number(entry.cur ?? 0);
  const prev = Number(entry.prev ?? 0);
  const pct = prev > 0 ? ((cur - prev) / prev) * 100 : null;
  const rows: TooltipRow[] = [];
  if (showPerVest && series) {
    for (const v of series as Vestiging[]) {
      const val = Number(entry[`curOmzet_${v}`] ?? 0);
      if (val > 0) rows.push({ label: v, color: VEST_KLEUR[v], value: val });
    }
    if (rows.length === 0) rows.push({ label: 'Deze periode', color: 'hsl(var(--primary))', value: cur });
  } else {
    const extra = metric === 'omzet' ? `${entry.curBonnen ?? 0} bonnen`
      : metric === 'bonnen' ? `${EUR.format(entry.curOmzet ?? 0)}`
      : `${entry.curBonnen ?? 0} bonnen`;
    rows.push({ label: 'Deze periode', color: 'hsl(var(--primary))', value: cur, extra });
  }
  rows.push({ label: 'Vorige periode', color: GREY, value: prev });
  return <CijfersTooltipCard title={label} rows={rows} deltaPct={pct} />;
}
