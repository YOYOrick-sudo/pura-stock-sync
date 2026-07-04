import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EUR, vestigingenVan, type Periode, type VestKeuze } from './types';

const DAG_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const UREN = Array.from({ length: 14 }, (_, i) => 10 + i);

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Cel = { isodow: number; uur: number; gem_omzet: number; n_dagen: number };

export function CijfersHeatmap({ periode, vestigingKeuze, van: pvan, tot }: Props) {
  // Voor "vandaag" is één dag zinloos → toon laatste 8 weken.
  const isSingle = periode === 'vandaag';
  const van = isSingle
    ? (() => {
        const d = new Date(tot);
        d.setDate(d.getDate() - 56);
        return d.toISOString().slice(0, 10);
      })()
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


  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="text-base font-semibold mb-4">Uur-heatmap</div>
        <Skeleton className="h-[280px] rounded-[14px]" />
      </div>
    );
  }

  const cellen = q.data ?? [];
  const max = cellen.reduce((m, c) => Math.max(m, Number(c.gem_omzet)), 0);
  const grid = new Map<string, Cel>();
  cellen.forEach((c) => grid.set(`${c.isodow}|${c.uur}`, c));

  const kleur = (v: number) => {
    if (max === 0) return 'hsl(var(--muted))';
    const t = Math.min(1, v / max);
    // 6 stappen, van 6% → 85% opacity van primary
    const step = Math.round(t * 6) / 6;
    const alpha = 0.06 + step * 0.79;
    return `hsl(var(--primary) / ${alpha.toFixed(2)})`;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-base font-semibold">Uur-heatmap</div>
          <div className="text-xs text-muted-foreground">
            Gemiddelde omzet per uur × weekdag
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* header met uren */}
            <div className="grid" style={{ gridTemplateColumns: `48px repeat(${UREN.length}, minmax(0,1fr))` }}>
              <div />
              {UREN.map((u) => (
                <div key={u} className="text-[11px] text-muted-foreground text-center pb-1">
                  {u}
                </div>
              ))}
            </div>

            {/* rijen ma..zo */}
            {[1, 2, 3, 4, 5, 6, 7].map((iso, idx) => (
              <div
                key={iso}
                className="grid gap-[3px] mb-[3px]"
                style={{ gridTemplateColumns: `48px repeat(${UREN.length}, minmax(0,1fr))` }}
              >
                <div className="text-xs text-muted-foreground flex items-center justify-end pr-2">
                  {DAG_NL[idx]}
                </div>
                {UREN.map((u) => {
                  const c = grid.get(`${iso}|${u}`);
                  const v = Number(c?.gem_omzet ?? 0);
                  return (
                    <Tooltip key={u}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-8 rounded-[6px] border border-border/40 cursor-default"
                          style={{ background: kleur(v) }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <div className="font-semibold">{DAG_NL[idx]} {u}:00</div>
                        <div>gem. {EUR.format(v)}</div>
                        <div className="text-muted-foreground">n={c?.n_dagen ?? 0} weken</div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {isSingle && (
          <div className="text-xs text-muted-foreground mt-3">
            Op basis van de laatste 8 weken (een heatmap van één dag is zinloos).
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
