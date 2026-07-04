import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { vestigingenVan, type Periode, type VestKeuze } from './types';
import { axisEUR, roundedTopBar } from './chartHelpers';

const DAG_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Row = { isodow: number; gem_periode: number; gem_referentie: number; delta_pct: number | null };

export function CijfersWeekdagVergelijk({ periode, vestigingKeuze, van, tot }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const q = useQuery({
    queryKey: ['cijfers-weekdag', periode, vestigingKeuze, van, tot],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_weekdag_vergelijk', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px 16px' }}>
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-56 mb-6" />
        <Skeleton className="h-[260px] rounded-[12px]" />
      </div>
    );
  }

  const rows = (q.data ?? []).slice().sort((a, b) => a.isodow - b.isodow);
  const vals = rows.map((r) => Number(r.gem_periode));
  const labels = rows.map((r) => DAG_NL[r.isodow - 1]);

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in h-full flex flex-col" style={{ padding: '22px 24px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Omzet per weekdag</div>
      <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>Gemiddeld · drukste dag uitgelicht</div>
      <div style={{ marginTop: 14 }}>
        {vals.length === 0 || Math.max(...vals) === 0
          ? <div className="py-10 text-center text-sm text-muted-foreground">Geen data.</div>
          : <BarChart labels={labels} vals={vals} />}
      </div>
    </div>
  );
}

function BarChart({ labels, vals }: { labels: string[]; vals: number[] }) {
  const [hb, setHb] = useState<number | null>(null);
  const n = vals.length;
  const W = 380, H = 300, padL = 46, padR = 12, padT = 24, padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const baseY = padT + plotH;
  const hi = Math.max(...vals) * 1.16;
  const maxIdx = vals.indexOf(Math.max(...vals));
  const step = plotW / n;
  const bw = step * 0.56;
  const Y = (v: number) => padT + (1 - v / hi) * plotH;

  const grid = [];
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const val = (hi * i) / ticks; const y = Y(val);
    grid.push(
      <g key={'g' + i}>
        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="hsl(var(--chart-grid))" strokeWidth={1} strokeDasharray="2 5" />
        <text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize={10.5} fill="hsl(var(--muted-foreground))">{axisEUR(val)}</text>
      </g>,
    );
  }
  const gid = 'wkbest';
  const bars = vals.map((v, i) => {
    const x = padL + i * step + (step - bw) / 2;
    const y = Y(v); const hh = baseY - y;
    const isMax = i === maxIdx;
    const isHov = hb === i;
    const fill = isMax ? `url(#${gid})` : isHov ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--chart-idle-bar))';
    return (
      <g
        key={'b' + i}
        onMouseEnter={() => setHb(i)}
        onMouseLeave={() => setHb(null)}
        style={{ cursor: 'pointer' }}
      >
        <path
          d={roundedTopBar(x, y, bw, hh, 7)}
          fill={fill}
          style={{
            transformBox: 'fill-box', transformOrigin: 'center bottom',
            animation: `cj-growUp .6s cubic-bezier(.2,.7,.3,1) ${(i * 0.045).toFixed(3)}s both`,
          }}
        />
        {(isHov || isMax) && (
          <text
            x={x + bw / 2} y={y - 9} textAnchor="middle" fontSize={11} fontWeight={700}
            fill={isMax ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
          >{axisEUR(v)}</text>
        )}
      </g>
    );
  });
  const xlabels = labels.map((lab, i) => (
    <text
      key={'x' + i}
      x={padL + i * step + step / 2}
      y={H - 8}
      textAnchor="middle"
      fontSize={11}
      fontWeight={i === maxIdx ? 700 : 400}
      fill={i === maxIdx ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
    >{lab}</text>
  ));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      {grid}
      {bars}
      {xlabels}
    </svg>
  );
}
