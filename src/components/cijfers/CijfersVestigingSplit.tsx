import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, VEST_KLEUR, vestigingenVan, type Periode, type VestKeuze, type Vestiging } from './types';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Samenvatting = {
  totaal: { omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number };
  per_vestiging: Array<{ vestiging: string; omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number }>;
};

const ORDER: Vestiging[] = ['Midsland', 'West'];

export function CijfersVestigingSplit({ periode, vestigingKeuze, van, tot }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const q = useQuery({
    queryKey: ['cijfers-samenvatting', periode, vestigingKeuze, van, tot],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_samenvatting', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot,
      });
      if (error) throw error;
      return data as unknown as Samenvatting;
    },
    refetchOnWindowFocus: true,
  });

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6 h-full">
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-56 mb-6" />
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-[9px] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = q.data;
  const per = s?.per_vestiging ?? [];
  const byName = new Map(per.map((p) => [p.vestiging, p]));
  // Zorg altijd voor beide rows, ook als er 0 is
  const rows = ORDER.map((v) => {
    const p = byName.get(v);
    return { vestiging: v, omzet: Number(p?.omzet ?? 0) };
  });
  const totaal = rows.reduce((a, r) => a + r.omzet, 0);
  const grootste = rows.reduce((m, r) => (r.omzet > m ? r.omzet : m), 0);

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6 h-full flex flex-col">
      <div className="mb-5">
        <div className="text-[15px] font-semibold text-foreground">Omzet per vestiging</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">Verdeling deze periode</div>
      </div>

      <div className="space-y-5 flex-1">
        {rows.map((r) => {
          const share = totaal > 0 ? (r.omzet / totaal) * 100 : 0;
          const barW = grootste > 0 ? (r.omzet / grootste) * 100 : 0;
          const kleur = VEST_KLEUR[r.vestiging];
          const dim = vestigingKeuze !== 'Beide' && vestigingKeuze !== r.vestiging;
          return (
            <div key={r.vestiging} className={dim ? 'opacity-45 transition-opacity' : 'transition-opacity'}>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <div className="inline-flex items-center gap-2 min-w-0">
                  <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: kleur }} />
                  <span className="text-sm font-semibold text-foreground truncate">{r.vestiging}</span>
                </div>
                <div className="text-[13px] tabular-nums font-medium text-foreground whitespace-nowrap">
                  {EUR.format(r.omzet)} <span className="text-muted-foreground">· {share.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-[9px] rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${barW}%`, background: kleur }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border/60 flex items-baseline justify-between">
        <div className="text-[12px] text-muted-foreground">Totaal beide vestigingen</div>
        <div className="text-[16px] font-bold tabular-nums text-foreground">{EUR.format(totaal)}</div>
      </div>
    </div>
  );
}
