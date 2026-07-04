import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Minus, Trophy } from 'lucide-react';
import { EUR, vestigingenVan, type Periode, type VestKeuze } from './types';
import { useCountUp } from './useCountUp';

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
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="text-base font-semibold mb-4">Weekdag-vergelijking</div>
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows = (q.data ?? []).sort((a, b) => a.isodow - b.isodow);
  const best = rows.reduce<Row | null>((m, r) => (r.gem_periode > (m?.gem_periode ?? 0) ? r : m), null);
  const maxVal = Math.max(1, ...rows.map((r) => Number(r.gem_periode)));

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6 h-full">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-base font-semibold">Weekdag-vergelijking</div>
        <div className="text-xs text-muted-foreground">vs. 8 wk gem.</div>
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">Geen data.</div>}
        {rows.map((r) => {
          const isBest = best && r.isodow === best.isodow && r.gem_periode > 0;
          const weekend = r.isodow === 5 || r.isodow === 6;
          const pct = r.delta_pct;
          const up = pct !== null && pct >= 0;
          const pctBar = Math.max(4, (Number(r.gem_periode) / maxVal) * 100);
          return (
            <div key={r.isodow} className="flex items-center gap-3 py-1.5">
              <div className={`w-10 text-sm capitalize flex items-center gap-1 ${weekend ? 'font-semibold' : 'font-medium'}`}>
                {DAG_NL[r.isodow - 1]}
                {isBest && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pctBar}%`, background: weekend ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.55)' }}
                  />
                </div>
                <div className="text-sm font-medium tabular-nums w-20 text-right"><Money v={Number(r.gem_periode)} /></div>
              </div>
              <div className="w-20 text-right">
                {pct === null ? (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Minus className="w-3 h-3" /> —</span>
                ) : (
                  <span className={`text-xs font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {up ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Money({ v }: { v: number }) {
  const anim = useCountUp(v, 320);
  return <span>{EUR.format(anim)}</span>;
}
