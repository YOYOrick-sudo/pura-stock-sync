import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { vestigingenVan, type Periode, type VestKeuze } from './types';
import {
  EUR0, axisEUR, smoothPath, svgHoverIndex, TipCard, TipRow, tipTransform,
} from './chartHelpers';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Cel = { isodow: number; uur: number; gem_omzet: number; n_dagen: number };

export function CijfersUurverloop({ periode, vestigingKeuze, van: pvan, tot }: Props) {
  const isSingle = periode === 'vandaag';
  const van = isSingle
    ? (() => { const d = new Date(tot); d.setDate(d.getDate() - 56); return d.toISOString().slice(0, 10); })()
    : pvan;
  const vestigingen = vestigingenVan(vestigingKeuze);

  const q = useQuery({
    queryKey: ['cijfers-heatmap', periode, vestigingKeuze, van, tot],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_heatmap', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot,
      });
      if (error) throw error;
      return (data ?? []) as Cel[];
    },
    refetchOnWindowFocus: true,
  });

  const { labels, vals, total, nDagen } = useMemo(() => {
    const cellen = q.data ?? [];
    const perUur = new Map<number, { som: number; n: number }>();
    const daysSet = new Set<string>();
    for (const c of cellen) {
      const cur = perUur.get(c.uur) ?? { som: 0, n: 0 };
      cur.som += Number(c.gem_omzet); cur.n += 1;
      perUur.set(c.uur, cur);
      daysSet.add(`${c.isodow}`);
    }
    // n_dagen som over cellen geeft geen betrouwbare uniek-dag-teller; approx: max n_dagen per uur
    const maxN = cellen.reduce((m, c) => Math.max(m, Number(c.n_dagen) || 0), 0);
    const _labels: string[] = []; const _vals: number[] = [];
    for (let u = 10; u <= 23; u++) {
      const p = perUur.get(u);
      _labels.push(String(u).padStart(2, '0'));
      _vals.push(p && p.n > 0 ? p.som / p.n : 0);
    }
    return { labels: _labels, vals: _vals, total: _vals.reduce((a, b) => a + b, 0), nDagen: maxN };
  }, [q.data]);

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px 16px' }}>
        <Skeleton className="h-4 w-52 mb-2" />
        <Skeleton className="h-3 w-64 mb-6" />
        <Skeleton className="h-[240px] rounded-[12px]" />
      </div>
    );
  }

  const heeft = vals.some((v) => v > 0);
  const subtitle = nDagen > 1
    ? `Gemiddeld per uur over ${nDagen} dagen · piek gemarkeerd`
    : 'Gemiddeld patroon per uur · piek gemarkeerd';

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in h-full flex flex-col" style={{ padding: '22px 24px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Omzetverloop over de dag</div>
      <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{subtitle}</div>
      <div style={{ marginTop: 12 }}>
        {!heeft
          ? <div className="py-10 text-center text-sm text-muted-foreground">Geen data.</div>
          : <HourChart labels={labels} vals={vals} total={total} />}
      </div>
    </div>
  );
}

function HourChart({ labels, vals, total }: { labels: string[]; vals: number[]; total: number }) {
  const [hv, setHv] = useState<number | null>(null);
  const n = vals.length;
  const W = 560, H = 240, padL = 50, padR = 16, padT = 32, padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;
  const hi = Math.max(...vals) * 1.18 || 1;
  const X = (i: number) => padL + (i * plotW) / (n - 1);
  const Y = (v: number) => padT + (1 - v / hi) * plotH;

  const pts = vals.map((v, i) => ({ x: X(i), y: Y(v) }));
  const d = smoothPath(pts);
  const areaD = `${d} L ${pts[n - 1].x.toFixed(1)},${baseY} L ${pts[0].x.toFixed(1)},${baseY} Z`;
  const maxIdx = vals.indexOf(Math.max(...vals));

  const grid = [];
  const ticks = 3;
  for (let i = 0; i <= ticks; i++) {
    const val = (hi * i) / ticks; const y = Y(val);
    grid.push(
      <g key={'g' + i}>
        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="hsl(var(--chart-grid))" strokeWidth={1} strokeDasharray="2 5" />
        <text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize={10.5} fill="hsl(var(--muted-foreground))">{axisEUR(val)}</text>
      </g>,
    );
  }
  const hatch = pts.map((p, i) => (
    <line
      key={'h' + i} x1={p.x} x2={p.x} y1={baseY} y2={p.y}
      stroke="hsl(var(--primary))" strokeWidth={(plotW / n) * 0.5}
      strokeOpacity={0.13} strokeLinecap="round"
    />
  ));
  const xlabels = labels.map((lab, i) =>
    i % 2 === 0
      ? <text key={'x' + i} x={X(i)} y={H - 8} textAnchor="middle" fontSize={10.5} fill="hsl(var(--muted-foreground))">{lab}</text>
      : null,
  );

  const pk = pts[maxIdx];
  const pillText = 'piek ' + axisEUR(vals[maxIdx]);
  const pw = pillText.length * 6.1 + 18;
  let px = pk.x;
  if (px - pw / 2 < padL) px = padL + pw / 2;
  if (px + pw / 2 > W - padR) px = W - padR - pw / 2;
  const peak = (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={pk.x} cy={pk.y} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2.5} />
      <g style={{ animation: 'cj-popIn .35s ease .45s both' }}>
        <rect x={px - pw / 2} y={pk.y - 32} width={pw} height={21} rx={10.5} fill="hsl(var(--primary))" />
        <text x={px} y={pk.y - 17} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{pillText}</text>
      </g>
    </g>
  );

  let hovG: any = null; let tip: any = null;
  if (hv != null && hv >= 0 && hv < n) {
    const gx = X(hv);
    hovG = (
      <g style={{ pointerEvents: 'none' }}>
        <line x1={gx} x2={gx} y1={padT} y2={baseY} stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.45} />
        <circle cx={gx} cy={Y(vals[hv])} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth={2.5} />
      </g>
    );
    const leftPct = (gx / W) * 100;
    const share = total ? (vals[hv] / total) * 100 : 0;
    tip = (
      <TipCard leftPct={leftPct} transform={tipTransform(leftPct)}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: 6 }}>
          {labels[hv]}:00 – {labels[hv]}:59
        </div>
        <TipRow color="hsl(var(--primary))" label="Gem. omzet" value={EUR0.format(vals[hv])} />
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid hsl(var(--border))', fontSize: 10.5, color: 'hsl(var(--muted-foreground))' }}>
          {share.toFixed(1)}% van de dagomzet
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
        {grid}
        {hatch}
        <path d={areaD} fill="hsl(var(--primary) / 0.10)" stroke="none" style={{ opacity: 0, animation: 'cj-fadeArea .8s ease .15s forwards' }} />
        <path
          d={d} fill="none" stroke="hsl(var(--primary))"
          strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: 'cj-drawLine 1s ease forwards' }}
        />
        {xlabels}
        {peak}
        {hovG}
      </svg>
      {tip}
    </div>
  );
}
