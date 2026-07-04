import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, vestigingenVan, type Periode, type VestKeuze } from './types';
import { CijfersTooltipCard, type TooltipRow } from './CijfersTooltip';

const DAG_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const IDLE_GREY = '#E4E2DD';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Row = { isodow: number; gem_periode: number; gem_referentie: number; delta_pct: number | null };

function fmtEurCompact(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000) return `€${(v / 1_000).toFixed(a >= 10_000 ? 0 : 1).replace('.', ',')}k`;
  return `€${Math.round(v)}`;
}

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
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6 h-full">
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-56 mb-6" />
        <Skeleton className="h-[220px] rounded-[12px]" />
      </div>
    );
  }

  const rows = (q.data ?? []).slice().sort((a, b) => a.isodow - b.isodow);
  const maxVal = Math.max(0, ...rows.map((r) => Number(r.gem_periode)));
  const bestIso = rows.reduce<number | null>((best, r) => {
    if (Number(r.gem_periode) <= 0) return best;
    if (best === null) return r.isodow;
    const cur = rows.find((x) => x.isodow === best);
    return Number(r.gem_periode) > Number(cur?.gem_periode ?? 0) ? r.isodow : best;
  }, null);

  const data = rows.map((r) => ({
    dag: DAG_NL[r.isodow - 1],
    isodow: r.isodow,
    value: Number(r.gem_periode),
    delta: r.delta_pct,
    isBest: r.isodow === bestIso,
  }));

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="text-[15px] font-semibold text-foreground">Omzet per weekdag</div>
          <div className="text-[12px] text-muted-foreground mt-0.5">Gemiddeld · drukste dag uitgelicht</div>
        </div>
        <div className="text-[11px] text-muted-foreground shrink-0">vs. 8 wk gem.</div>
      </div>

      {rows.length === 0 || maxVal === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Geen data.</div>
      ) : (
        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 24, right: 8, bottom: 4, left: 0 }} barCategoryGap="18%">
              <defs>
                <linearGradient id="weekdagBestFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="dag"
                tick={(props: any) => {
                  const { x, y, payload } = props;
                  const isBest = data.find((d) => d.dag === payload.value)?.isBest;
                  return (
                    <text
                      x={x}
                      y={y + 12}
                      textAnchor="middle"
                      fontSize={11}
                      fill="hsl(var(--muted-foreground))"
                      fontWeight={isBest ? 700 : 400}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtEurCompact(Number(v))}
                width={42}
              />
              <Tooltip cursor={{ fill: 'hsl(var(--primary) / 0.06)' }} content={<Tt />} />
              <Bar dataKey="value" radius={[7, 7, 0, 0]} isAnimationActive={true}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.isBest ? 'url(#weekdagBestFill)' : IDLE_GREY} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, value, index } = props;
                    if (!data[index]?.isBest || !value) return null;
                    return (
                      <text
                        x={x + width / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        fill="hsl(var(--primary))"
                        className="tabular-nums"
                      >
                        {fmtEurCompact(Number(value))}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Tt({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rows: TooltipRow[] = [
    { label: 'gemiddeld', color: d.isBest ? 'hsl(var(--primary))' : IDLE_GREY, value: Number(d.value) },
  ];
  return <CijfersTooltipCard title={String(d.dag)} rows={rows} deltaPct={d.delta} />;
}
