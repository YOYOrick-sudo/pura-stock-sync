import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wallet, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/pura/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, EUR2, vestigingenVan, type Periode, type VestKeuze } from './types';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Samenvatting = {
  totaal: { omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number };
  per_vestiging: Array<{ vestiging: string; omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number }>;
};

export function CijfersStatCards({ periode, vestigingKeuze, van, tot }: Props) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-[20px]" />)}
      </div>
    );
  }

  const s = q.data;
  const omzet = Number(s?.totaal.omzet ?? 0);
  const prev = Number(s?.totaal.vorige_omzet ?? 0);
  const diff = omzet - prev;
  const pct = prev > 0 ? (diff / prev) * 100 : null;
  const opnDgn = Number(s?.totaal.open_dagen ?? 0);
  const gem = opnDgn > 0 ? omzet / opnDgn : 0;

  const trendUp = diff >= 0;
  const per = s?.per_vestiging ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="Omzet"
        icon={<Wallet />}
        tone="neutral"
        value={
          <div>
            <div>{EUR.format(omzet)}</div>
            {vestigingKeuze === 'Beide' && per.length > 0 && (
              <div className="text-xs text-muted-foreground font-normal mt-1">
                {per.map((p) => `${p.vestiging}: ${EUR.format(Number(p.omzet))}`).join(' · ')}
              </div>
            )}
          </div>
        }
      />
      <StatCard
        label="T.o.v. vorige periode"
        icon={trendUp ? <TrendingUp /> : <TrendingDown />}
        tone={trendUp ? 'success' : 'danger'}
        value={
          <div>
            <div>{pct === null ? '—' : `${trendUp ? '+' : ''}${pct.toFixed(1)}%`}</div>
            <div className="text-xs text-muted-foreground font-normal mt-1">
              {trendUp ? '+' : ''}{EUR2.format(diff)} vs. {EUR.format(prev)}
            </div>
          </div>
        }
      />
      <StatCard
        label="Gemiddelde per open dag"
        icon={<Calendar />}
        tone="neutral"
        value={
          <div>
            <div>{EUR.format(gem)}</div>
            <div className="text-xs text-muted-foreground font-normal mt-1">
              {opnDgn} open {opnDgn === 1 ? 'dag' : 'dagen'} · {s?.totaal.bonnen ?? 0} bonnen
            </div>
          </div>
        }
      />
    </div>
  );
}
