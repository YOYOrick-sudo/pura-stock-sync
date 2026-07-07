import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { BarChart3 } from 'lucide-react';
import {
  granulariteitVoor, vestigingenVan,
  type Periode, type VestKeuze,
} from './types';
import {
  EUR0, NUM, axisEUR, smoothPath, svgHoverIndex, TipCard, TipRow, tipTransform,
} from './chartHelpers';

const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Row = { bucket: string; vestiging: string; omzet: number; bonnen: number | null; omzet_bron?: 'lightspeed' | 'eitje' | 'gemengd' | 'geen' };

function labelVoor(bucket: string, gran: 'uur' | 'dag' | 'maand'): string {
  const d = new Date(bucket);
  if (gran === 'uur')  return `${d.getHours().toString().padStart(2, '0')}`;
  if (gran === 'dag')  return `${DAG_NL[d.getDay()]}`;
  return MND_NL[d.getMonth()];
}
function shift(date: string, dagen: number): string {
  const d = new Date(date); d.setDate(d.getDate() - dagen);
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

  const perfSub =
    periode === 'vandaag' ? 'Vandaag · per uur' :
    periode === 'week'    ? 'Deze week · per dag (ma–zo)' :
    periode === 'maand'   ? 'Deze maand · per dag' :
    periode === 'jaar'    ? 'Dit jaar · per maand' :
                            'Aangepaste periode';

  const series = useMemo(() => {
    const cur = curQ.data ?? [];
    const prev = prevQ.data ?? [];
    const curBuckets: string[] = [];
    for (const r of cur) if (!curBuckets.includes(r.bucket)) curBuckets.push(r.bucket);
    curBuckets.sort();
    const prevBuckets: string[] = [];
    for (const r of prev) if (!prevBuckets.includes(r.bucket)) prevBuckets.push(r.bucket);
    prevBuckets.sort();
    const n = Math.max(curBuckets.length, prevBuckets.length);
    const labels: string[] = []; const curArr: number[] = []; const prevArr: number[] = [];
    const bonnenArr: Array<number | null> = []; const bronArr: Array<Row['omzet_bron']> = [];
    for (let i = 0; i < n; i++) {
      const cb = curBuckets[i]; const pb = prevBuckets[i];
      labels.push(cb ? labelVoor(cb, gran) : pb ? labelVoor(pb, gran) : '');
      let c = 0, p = 0;
      let bSum = 0, bAny = false;
      const brons = new Set<string>();
      if (cb) for (const r of cur.filter((x) => x.bucket === cb))  {
        c += Number(r.omzet);
        if (r.bonnen != null) { bSum += Number(r.bonnen); bAny = true; }
        if (r.omzet_bron) brons.add(r.omzet_bron);
      }
      if (pb) for (const r of prev.filter((x) => x.bucket === pb)) { p += Number(r.omzet); }
      curArr.push(c); prevArr.push(p);
      bonnenArr.push(bAny && !brons.has('eitje') && !brons.has('gemengd') && !brons.has('geen') ? bSum : null);
      let bron: Row['omzet_bron'] = 'geen';
      const hasLS = brons.has('lightspeed'); const hasE = brons.has('eitje') || brons.has('gemengd');
      if (hasLS && hasE) bron = 'gemengd';
      else if (hasLS) bron = 'lightspeed';
      else if (hasE) bron = 'eitje';
      bronArr.push(bron);
    }
    return { labels, cur: curArr, prev: prevArr, bonnen: bonnenArr, bron: bronArr };
  }, [curQ.data, prevQ.data, gran]);

  if (curQ.isLoading) return <LoadingSkeleton />;
  if (curQ.error) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6 cj-card-in">
        <EmptyState icon={BarChart3} title="Kan grafiek niet laden" description={(curQ.error as Error).message} />
      </div>
    );
  }
  if (series.labels.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-[22px_24px_16px] cj-card-in">
        <Header sub={perfSub} />
        <EmptyState icon={BarChart3} title="Geen data in deze periode" description="Zodra er omzet is, verschijnt hij hier." />
      </div>
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-[20px] shadow-card cj-card-in"
      style={{ padding: '22px 24px 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <Header sub={perfSub} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: 'hsl(var(--primary))' }} />
            Deze periode
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 16, height: 3, borderRadius: 2, background: 'repeating-linear-gradient(90deg, hsl(var(--chart-prev-line)) 0 4px, transparent 4px 7px)' }} />
            Vorige periode
          </span>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <LineChart series={series} periode={periode} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header({ sub }: { sub: string }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Omzet</div>
      <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function LineChart({
  series, periode,
}: { series: { labels: string[]; cur: number[]; prev: number[]; bonnen: number[] }; periode: Periode }) {
  const [hv, setHv] = useState<number | null>(null);
  const showCmp = series.prev.some((v) => v > 0);

  const n = series.labels.length;
  const W = 760, H = 300, padL = 54, padR = 16, padT = 18, padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;

  const vals = showCmp ? series.cur.concat(series.prev) : series.cur.slice();
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const span0 = (hi - lo) || hi || 1;
  lo = Math.max(0, lo - span0 * 0.35);
  hi = hi + span0 * 0.12;
  if (hi <= lo) hi = lo + 1;

  const X = (i: number) => (n <= 1 ? padL + plotW / 2 : padL + (i * plotW) / (n - 1));
  const Y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * plotH;

  const curPts  = series.cur.map((v, i) => ({ x: X(i), y: Y(v) }));
  const prevPts = series.prev.map((v, i) => ({ x: X(i), y: Y(v) }));
  const curD  = smoothPath(curPts);
  const prevD = smoothPath(prevPts);
  const areaD = n > 0 ? `${curD} L ${curPts[n - 1].x.toFixed(1)},${baseY} L ${curPts[0].x.toFixed(1)},${baseY} Z` : '';
  const gid = 'pf_' + periode;

  const ticks = 4;
  const grid = [];
  for (let i = 0; i <= ticks; i++) {
    const val = lo + ((hi - lo) * i) / ticks;
    const y = Y(val);
    grid.push(
      <g key={'g' + i}>
        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="hsl(var(--chart-grid))" strokeWidth={1} strokeDasharray="2 5" />
        <text x={padL - 10} y={y + 3.5} textAnchor="end" fontSize={11} fill="hsl(var(--muted-foreground))">{axisEUR(val)}</text>
      </g>
    );
  }
  const everyX = n <= 12 ? 1 : Math.ceil(n / 8);
  const xlabels = series.labels.map((lab, i) =>
    i % everyX === 0 || i === n - 1
      ? <text key={'x' + i} x={X(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{lab}</text>
      : null,
  );

  let hovG: any = null; let tipCard: any = null;
  if (hv != null && hv >= 0 && hv < n) {
    const gx = X(hv);
    hovG = (
      <g style={{ pointerEvents: 'none' }}>
        <line x1={gx} x2={gx} y1={padT} y2={baseY} stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.45} />
        {showCmp && <circle cx={gx} cy={Y(series.prev[hv])} r={4} fill="hsl(var(--chart-prev-line))" stroke="hsl(var(--card))" strokeWidth={2} />}
        <circle cx={gx} cy={Y(series.cur[hv])} r={5.5} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2.5} />
      </g>
    );
    const leftPct = (gx / W) * 100;
    const c = series.cur[hv], p = series.prev[hv];
    const dp = p ? ((c - p) / p) * 100 : null;
    tipCard = (
      <TipCard leftPct={leftPct} transform={tipTransform(leftPct)}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>{series.labels[hv]}</span>
          {dp == null ? null : (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
              background: dp >= 0 ? 'rgb(209 250 229)' : 'rgb(255 225 229)',
              color:      dp >= 0 ? 'rgb(4 120 87)'    : 'rgb(190 18 60)',
            }}>{(dp >= 0 ? '▲ +' : '▼ ') + dp.toFixed(1) + '%'}</span>
          )}
        </div>
        <TipRow color="hsl(var(--primary))" label="Deze periode" value={EUR0.format(c)} />
        {showCmp && <TipRow color="hsl(var(--chart-prev-line))" label="Vorige periode" value={EUR0.format(p)} />}
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid hsl(var(--border))', fontSize: 10.5, color: 'hsl(var(--muted-foreground))' }}>
          ≈ {NUM.format(series.bonnen[hv] || Math.round(c / 36))} bonnen
        </div>
      </TipCard>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`} width="100%" height="auto"
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={(e) => setHv(svgHoverIndex(e, n, padL, plotW, W))}
        onMouseLeave={() => setHv(null)}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.20} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        {grid}
        {xlabels}
        {showCmp && <path d={prevD} fill="none" stroke="hsl(var(--chart-prev-line))" strokeWidth={2} strokeDasharray="5 5" strokeLinecap="round" />}
        <path d={areaD} fill={`url(#${gid})`} stroke="none" style={{ opacity: 0, animation: 'cj-fadeArea .8s ease .15s forwards' }} />
        <path
          d={curD} fill="none" stroke="hsl(var(--primary))"
          strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'cj-drawLine 1s ease forwards' }}
        />
        {hovG}
      </svg>
      {tipCard}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6 cj-card-in">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-[300px] rounded-[12px] opacity-70" />
    </div>
  );
}
