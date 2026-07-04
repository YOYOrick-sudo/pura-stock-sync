import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, vestigingenVan, type Periode, type VestKeuze } from './types';
import { CijfersTooltipCard, type TooltipRow } from './CijfersTooltip';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Cel = { isodow: number; uur: number; gem_omzet: number; n_dagen: number };

function fmtEurCompact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000) return `€${(v / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace('.', ',')}k`;
  return `€${Math.round(v)}`;
}

export function CijfersUurverloop({ periode, vestigingKeuze, van: pvan, tot }: Props) {
  // Hergebruik dezelfde query-key als de heatmap zodat we niet dubbel fetchen.
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

  const { data, peakIdx, dagTotaal } = useMemo(() => {
    const cellen = q.data ?? [];
    const perUur = new Map<number, { som: number; n: number }>();
    for (const c of cellen) {
      const cur = perUur.get(c.uur) ?? { som: 0, n: 0 };
      cur.som += Number(c.gem_omzet);
      cur.n += 1;
      perUur.set(c.uur, cur);
    }
    const rows: { uur: number; label: string; gem: number }[] = [];
    for (let u = 10; u <= 23; u++) {
      const p = perUur.get(u);
      const gem = p && p.n > 0 ? p.som / p.n : 0;
      rows.push({ uur: u, label: `${u}u`, gem });
    }
    const totaal = rows.reduce((s, r) => s + r.gem, 0);
    let pk = 0;
    for (let i = 1; i < rows.length; i++) if (rows[i].gem > rows[pk].gem) pk = i;
    return { data: rows, peakIdx: pk, dagTotaal: totaal };
  }, [q.data]);

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <Skeleton className="h-4 w-52 mb-2" />
        <Skeleton className="h-3 w-64 mb-6" />
        <Skeleton className="h-[240px] rounded-[12px]" />
      </div>
    );
  }

  const peak = data[peakIdx];
  const heeftData = data.some((d) => d.gem > 0);

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6 h-full flex flex-col">
      <div className="mb-4">
        <div className="text-[15px] font-semibold text-foreground">Omzetverloop over de dag</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">Gemiddeld patroon per uur · piek gemarkeerd</div>
      </div>

      {!heeftData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Geen data.</div>
      ) : (
        <div className="flex-1 min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 28, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="uurAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.20} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                interval={1}
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
                cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.6 }}
                content={<Tt dagTotaal={dagTotaal} />}
              />

              {/* Verticale accent-lijnen (impressionistisch) — via smalle Bar-look met Line-segmenten */}
              {/* Voor eenvoud gebruiken we een tweede Area met heel lage opacity */}
              <Area
                type="monotone"
                dataKey="gem"
                stroke="none"
                fill="url(#uurAreaFill)"
                fillOpacity={0.5}
                isAnimationActive={true}
              />
              <Line
                type="monotone"
                dataKey="gem"
                stroke="hsl(var(--primary))"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2.5 }}
                isAnimationActive={true}
              />
              {/* Piek marker */}
              <ReferenceDot
                x={peak.label}
                y={peak.gem}
                r={6}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--card))"
                strokeWidth={3}
                isFront
                label={({ viewBox }: any) => {
                  const cx = viewBox.cx ?? 0;
                  const cy = viewBox.cy ?? 0;
                  const txt = `piek ${fmtEurCompact(peak.gem)}`;
                  const w = Math.max(56, txt.length * 6 + 12);
                  return (
                    <g>
                      <rect x={cx - w / 2} y={cy - 26} width={w} height={16} rx={8} fill="hsl(var(--primary))" />
                      <text x={cx} y={cy - 15} textAnchor="middle" fontSize={11} fontWeight={700} fill="white" className="tabular-nums">
                        {txt}
                      </text>
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Tt({ active, payload, dagTotaal }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const gem = Number(d.gem);
  const share = dagTotaal > 0 ? (gem / dagTotaal) * 100 : 0;
  const rows: TooltipRow[] = [
    { label: 'gem. omzet', color: 'hsl(var(--primary))', value: gem, extra: `${share.toFixed(1)}% van dag` },
  ];
  const startU = d.uur;
  const endU = (startU + 1) % 24;
  const title = `${String(startU).padStart(2, '0')}:00 – ${String(endU).padStart(2, '0')}:00`;
  return <CijfersTooltipCard title={title} rows={rows} />;
}
