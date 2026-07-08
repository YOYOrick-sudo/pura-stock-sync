import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, VEST_KLEUR, vestigingenVan, vergelijkModeVan, type Periode, type VestKeuze, type Vestiging, type VergelijkMode } from './types';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string; mode?: VergelijkMode }

type Samenvatting = {
  totaal: { omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number };
  per_vestiging: Array<{ vestiging: string; omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number }>;
};

const ORDER: Vestiging[] = ['Midsland', 'West'];

export function CijfersVestigingSplit({ periode, vestigingKeuze, van, tot, mode }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const effMode = mode ?? vergelijkModeVan(periode);
  const q = useQuery({
    queryKey: ['cijfers-samenvatting', periode, vestigingKeuze, van, tot, effMode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_samenvatting', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot, p_mode: effMode,
      });
      if (error) throw error;
      return data as unknown as Samenvatting;
    },
    refetchOnWindowFocus: true,
  });


  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in h-full" style={{ padding: '22px 24px 20px' }}>
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-56 mb-6" />
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
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
  const rows = ORDER.map((v) => ({ vestiging: v, omzet: Number(byName.get(v)?.omzet ?? 0) }));
  const totaal = rows.reduce((a, r) => a + r.omzet, 0);
  const grootste = rows.reduce((m, r) => (r.omzet > m ? r.omzet : m), 0);

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in h-full flex flex-col" style={{ padding: '22px 24px 20px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Omzet per vestiging</div>
      <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>Verdeling deze periode</div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {rows.map((r) => {
          const share = totaal > 0 ? Math.round((r.omzet / totaal) * 100) : 0;
          const barW = grootste > 0 ? (r.omzet / grootste) * 100 : 0;
          const kleur = VEST_KLEUR[r.vestiging];
          const dim = vestigingKeuze !== 'Beide' && vestigingKeuze !== r.vestiging;
          return (
            <div key={r.vestiging} style={{ opacity: dim ? 0.45 : 1, transition: 'opacity .2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: kleur, flex: '0 0 auto' }} />
                  {r.vestiging}
                </span>
                <span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {EUR.format(r.omzet)} <span style={{ color: 'hsl(var(--muted-foreground))' }}>· {share}%</span>
                </span>
              </div>
              <div style={{ height: 9, borderRadius: 999, background: 'hsl(var(--chart-track))', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barW}%`, background: kleur, borderRadius: 999, transition: 'width .6s cubic-bezier(.2,.7,.3,1)' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))' }}>Totaal beide vestigingen</span>
        <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--foreground))' }}>{EUR.format(totaal)}</span>
      </div>
    </div>
  );
}
