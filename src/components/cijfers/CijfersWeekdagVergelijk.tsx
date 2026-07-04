import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Minus, Trophy } from 'lucide-react';
import { EUR, vestigingenVan, type Periode, type VestKeuze } from './types';

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
        <Skeleton className="h-[280px] rounded-[14px]" />
      </div>
    );
  }

  const rows = (q.data ?? []).sort((a, b) => a.isodow - b.isodow);
  const best = rows.reduce<Row | null>((m, r) => (r.gem_periode > (m?.gem_periode ?? 0) ? r : m), null);

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-base font-semibold">Weekdag-vergelijking</div>
        <div className="text-xs text-muted-foreground">vs. gemiddelde weekdag (8 wk ervoor)</div>
      </div>
      <div className="space-y-1.5">
        {rows.length === 0 && <div className="text-sm text-muted-foreground">Geen data.</div>}
        {rows.map((r) => {
          const isBest = best && r.isodow === best.isodow && r.gem_periode > 0;
          const pct = r.delta_pct;
          const up = pct !== null && pct >= 0;
          return (
            <div
              key={r.isodow}
              className="flex items-center gap-3 py-2 px-3 rounded-[12px] hover:bg-muted/40 transition-colors"
            >
              <div className="w-10 text-sm font-medium capitalize flex items-center gap-1">
                {DAG_NL[r.isodow - 1]}
                {isBest && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <div className="flex-1 text-sm font-medium">{EUR.format(Number(r.gem_periode))}</div>
              <div className="w-24 text-right">
                {pct === null ? (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Minus className="w-3 h-3" /> —
                  </span>
                ) : (
                  <span
                    className={`text-xs font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
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
