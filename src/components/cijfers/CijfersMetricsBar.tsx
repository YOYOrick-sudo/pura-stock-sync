import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, EUR2, vestigingenVan, type Periode, type VestKeuze } from './types';
import { useCountUp } from './useCountUp';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type Samenvatting = {
  totaal: { omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number };
  per_vestiging: Array<{ vestiging: string; omzet: number; bonnen: number; open_dagen: number; vorige_omzet: number }>;
};

export function CijfersMetricsBar({ periode, vestigingKeuze, van, tot }: Props) {
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
      <div className="rounded-[20px] border border-border bg-card shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 sm:divide-x sm:divide-y-0 divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = q.data;
  const omzet = Number(s?.totaal.omzet ?? 0);
  const prev = Number(s?.totaal.vorige_omzet ?? 0);
  const diff = omzet - prev;
  const pct = prev > 0 ? (diff / prev) * 100 : null;
  const opnDgn = Number(s?.totaal.open_dagen ?? 0);
  const bonnen = Number(s?.totaal.bonnen ?? 0);
  const gemDag = opnDgn > 0 ? omzet / opnDgn : 0;
  const gemBon = bonnen > 0 ? omzet / bonnen : 0;
  const per = s?.per_vestiging ?? [];

  const beideSubline = (getter: (p: Samenvatting['per_vestiging'][number]) => string) =>
    vestigingKeuze === 'Beide' && per.length > 0
      ? per.map(getter).join(' · ')
      : null;

  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 sm:divide-x sm:divide-y-0 divide-y divide-border">
        <MetricCol
          label="Omzet"
          value={<Money v={omzet} />}
          sub={beideSubline((p) => `${p.vestiging} ${EUR.format(Number(p.omzet))}`)}
        />
        <MetricCol
          label="T.o.v. vorige periode"
          value={
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[25px] font-bold tabular-nums leading-tight">
                {pct === null ? '—' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`}
              </span>
              {pct !== null && <DeltaPill pct={pct} />}
            </div>
          }
          sub={`${diff >= 0 ? '+' : ''}${EUR2.format(diff)} vs. ${EUR.format(prev)}`}
        />
        <MetricCol
          label="Bonnen"
          value={<Count v={bonnen} />}
          sub={beideSubline((p) => `${p.vestiging} ${Number(p.bonnen).toLocaleString('nl-NL')}`)}
        />
        <MetricCol
          label="Gem. besteding / bon"
          value={<Money v={gemBon} decimals={2} />}
          sub="per bon"
        />
        <MetricCol
          label="Gem. per open dag"
          value={<Money v={gemDag} />}
          sub={`${opnDgn} open ${opnDgn === 1 ? 'dag' : 'dagen'}`}
        />
      </div>
    </div>
  );
}

function MetricCol({ label, value, sub }: { label: string; value: React.ReactNode; sub: React.ReactNode }) {
  return (
    <div className="p-5 min-w-0">
      <div className="text-[10.5px] font-medium tracking-wide uppercase text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-[25px] font-bold tabular-nums leading-tight text-foreground">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

function Money({ v, decimals = 0 }: { v: number; decimals?: number }) {
  const anim = useCountUp(v, 320);
  const fmt = decimals === 2 ? EUR2 : EUR;
  return <span>{fmt.format(anim)}</span>;
}
function Count({ v }: { v: number }) {
  const anim = useCountUp(v, 320);
  return <span>{Math.round(anim).toLocaleString('nl-NL')}</span>;
}
function DeltaPill({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
        up ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '▲ +' : '▼ '}{pct.toFixed(1)}%
    </span>
  );
}
