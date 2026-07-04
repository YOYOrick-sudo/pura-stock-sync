import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EUR, EUR2, vestigingenVan, type Periode, type VestKeuze } from './types';
import { useCountUp } from './useCountUp';
import { DeltaPill } from './chartHelpers';

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
      <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '18px 20px', borderLeft: i === 0 ? undefined : '1px solid hsl(var(--border))' }}>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-32 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = q.data;
  const omzet = Number(s?.totaal.omzet ?? 0);
  const prev = Number(s?.totaal.vorige_omzet ?? 0);
  const opnDgn = Number(s?.totaal.open_dagen ?? 0);
  const bonnen = Number(s?.totaal.bonnen ?? 0);
  const gemDag = opnDgn > 0 ? omzet / opnDgn : 0;
  const gemBon = bonnen > 0 ? omzet / bonnen : 0;
  const per = s?.per_vestiging ?? [];
  const pct = prev > 0 ? ((omzet - prev) / prev) * 100 : null;

  const beideSubline = (getter: (p: Samenvatting['per_vestiging'][number]) => string) =>
    vestigingKeuze === 'Beide' && per.length > 0 ? per.map(getter).join(' · ') : null;

  const cols: { label: string; value: React.ReactNode; sub: React.ReactNode; dp?: number | null }[] = [
    {
      label: 'Omzet',
      value: <Money v={omzet} />,
      sub: beideSubline((p) => `${p.vestiging} ${EUR.format(Number(p.omzet))}`) ?? `vestiging ${vestigingKeuze}`,
      dp: pct,
    },
    {
      label: 'Bonnen',
      value: <Count v={bonnen} />,
      sub: beideSubline((p) => `${p.vestiging} ${Number(p.bonnen).toLocaleString('nl-NL')}`) ?? 'aantal transacties',
    },
    {
      label: 'Gem. besteding / bon',
      value: <Money v={gemBon} decimals={2} />,
      sub: 'per bon',
    },
    {
      label: 'Gem. per open dag',
      value: <Money v={gemDag} />,
      sub: `${opnDgn} open ${opnDgn === 1 ? 'dag' : 'dagen'}`,
    },
    {
      label: 'T.o.v. vorige periode',
      value: pct === null ? '—' : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      sub: `${omzet - prev >= 0 ? '+' : ''}${EUR2.format(omzet - prev)} vs. ${EUR.format(prev)}`,
      dp: pct,
    },
  ];

  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {cols.map((c, i) => (
          <MetricCol
            key={c.label}
            label={c.label}
            value={c.value}
            sub={c.sub}
            dp={c.dp}
            first={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCol({
  label, value, sub, dp, first,
}: { label: string; value: React.ReactNode; sub: React.ReactNode; dp?: number | null; first: boolean }) {
  return (
    <div
      style={{
        padding: '18px 20px',
        borderLeft: first ? undefined : '1px solid hsl(var(--border))',
        minWidth: 0,
      }}
    >
      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
        color: 'hsl(var(--muted-foreground))',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 9 }}>
        <span style={{
          fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: 'hsl(var(--foreground))',
        }}>{value}</span>
        {dp !== undefined && <DeltaPill pct={dp} />}
      </div>
      <div style={{
        fontSize: 11.5, color: 'hsl(var(--muted-foreground))', marginTop: 8,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{sub}</div>
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
