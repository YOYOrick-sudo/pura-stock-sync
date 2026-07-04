import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EUR, vestigingenVan, type Periode, type VestKeuze } from './types';
import { CijfersTooltipCard } from './CijfersTooltip';

const DAG_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const UREN = Array.from({ length: 14 }, (_, i) => 10 + i);
const STAPPEN = [0.06, 0.2, 0.35, 0.5, 0.65, 0.88];

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Cel = { isodow: number; uur: number; gem_omzet: number; n_dagen: number };

export function CijfersHeatmap({ periode, vestigingKeuze, van: pvan, tot }: Props) {
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

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="text-base font-semibold mb-4">Uur-heatmap</div>
        <div className="space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="grid gap-[6px]" style={{ gridTemplateColumns: `48px repeat(14, minmax(0,1fr))` }}>
              <Skeleton className="h-8" />
              {Array.from({ length: 14 }).map((__, j) => <Skeleton key={j} className="h-8 rounded-[8px]" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cellen = q.data ?? [];
  const max = cellen.reduce((m, c) => Math.max(m, Number(c.gem_omzet)), 0);
  const grid = new Map<string, Cel>();
  cellen.forEach((c) => grid.set(`${c.isodow}|${c.uur}`, c));

  const stepIndex = (v: number) => {
    if (max === 0) return 0;
    const t = Math.min(1, v / max);
    return Math.min(STAPPEN.length - 1, Math.round(t * (STAPPEN.length - 1)));
  };
  const kleur = (v: number) => v === 0 ? 'hsl(var(--muted) / 0.35)' : `hsl(var(--primary) / ${STAPPEN[stepIndex(v)]})`;

  return (
    <TooltipProvider delayDuration={80}>
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <div className="text-base font-semibold">Uur-heatmap</div>
            <div className="text-xs text-muted-foreground mt-0.5">Gem. omzet per uur × weekdag</div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>rustig</span>
            <div className="flex gap-[2px]">
              {STAPPEN.map((s, i) => (
                <div key={i} className="w-4 h-3 rounded-[3px] border border-border/40" style={{ background: `hsl(var(--primary) / ${s})` }} />
              ))}
            </div>
            <span>druk</span>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <div className="min-w-[640px]">
            <div className="grid" style={{ gridTemplateColumns: `48px repeat(${UREN.length}, minmax(0,1fr))` }}>
              <div />
              {UREN.map((u) => (
                <div key={u} className="text-[10px] text-muted-foreground text-center pb-1 tabular-nums">{u}</div>
              ))}
            </div>

            {[1, 2, 3, 4, 5, 6, 7].map((iso, idx) => {
              const weekend = iso === 5 || iso === 6;
              return (
                <div
                  key={iso}
                  className="grid gap-[6px] mb-[6px]"
                  style={{ gridTemplateColumns: `48px repeat(${UREN.length}, minmax(0,1fr))` }}
                >
                  <div
                    className={`text-xs flex items-center justify-end pr-2 rounded-[6px] ${
                      weekend ? 'font-semibold text-foreground bg-muted/40' : 'text-muted-foreground'
                    }`}
                  >
                    {DAG_NL[idx]}
                  </div>
                  {UREN.map((u) => {
                    const c = grid.get(`${iso}|${u}`);
                    const v = Number(c?.gem_omzet ?? 0);
                    return (
                      <Tooltip key={u}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-8 rounded-[8px] border border-border/40 cursor-default transition-shadow hover:ring-2 hover:ring-primary/40 hover:ring-offset-1"
                            style={{ background: kleur(v) }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-transparent border-0 p-0 shadow-none">
                          <CijfersTooltipCard
                            title={`${DAG_NL[idx]} ${u}:00`}
                            rows={[{ label: 'gemiddeld', color: 'hsl(var(--primary))', value: v }]}
                            footer={`n = ${c?.n_dagen ?? 0} ${((c?.n_dagen ?? 0) === 1) ? 'week' : 'weken'}`}
                          />
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              );
            })}
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
