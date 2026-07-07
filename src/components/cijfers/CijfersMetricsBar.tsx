import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { EUR, EUR2, vestigingenVan, type Periode, type VestKeuze } from './types';
import { useCountUp } from './useCountUp';
import { DeltaPill } from './chartHelpers';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type BronMix = { lightspeed: number; eitje: number; geen: number };
type Samenvatting = {
  periode?: { van: string; tot: string };
  vorige_periode?: { van: string; tot: string };
  totaal: {
    omzet: number;
    bonnen: number | null;
    open_dagen: number | null;
    vorige_omzet: number | null;
    omzet_bron_mix?: BronMix;
    vorige_omzet_bron_mix?: BronMix;
  };
  per_vestiging: Array<{
    vestiging: string;
    omzet: number;
    bonnen: number | null;
    open_dagen: number | null;
    vorige_omzet: number | null;
    omzet_bron_mix?: BronMix;
    vorige_omzet_bron_mix?: BronMix;
  }>;
};

function bronLabel(m?: BronMix): string {
  if (!m) return 'onbekend';
  const parts: string[] = [];
  if (m.lightspeed > 0) parts.push('Lightspeed');
  if (m.eitje > 0) parts.push('Eitje');
  if (parts.length === 0) return 'geen data';
  return parts.length === 1 ? parts[0] : parts.join(' + ');
}

function bronMismatch(cur?: BronMix, prev?: BronMix): boolean {
  if (!cur || !prev) return false;
  if (prev.lightspeed + prev.eitje === 0) return false; // geen vorige data → geen mismatch (delta wordt '—')
  const curHasEitje = cur.eitje > 0;
  const curHasLs = cur.lightspeed > 0;
  const prvHasEitje = prev.eitje > 0;
  const prvHasLs = prev.lightspeed > 0;
  // Mismatch als bron-samenstelling niet gelijk is
  return curHasEitje !== prvHasEitje || curHasLs !== prvHasLs;
}

function fmtRange(van?: string, tot?: string): string {
  if (!van || !tot) return '';
  const dv = new Date(van); const dt = new Date(tot);
  const sameDay = van === tot;
  const nowYear = new Date().getFullYear();
  const showYear = dv.getFullYear() !== nowYear || dt.getFullYear() !== nowYear;
  if (sameDay) {
    return format(dv, showYear ? 'd MMM yyyy' : 'd MMM', { locale: nl });
  }
  if (dv.getFullYear() === dt.getFullYear() && dv.getMonth() === dt.getMonth()) {
    return `${format(dv, 'd', { locale: nl })} – ${format(dt, showYear ? 'd MMM yyyy' : 'd MMM', { locale: nl })}`;
  }
  return `${format(dv, 'd MMM', { locale: nl })} – ${format(dt, showYear ? 'd MMM yyyy' : 'd MMM', { locale: nl })}`;
}

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
  const prev = s?.totaal.vorige_omzet == null ? null : Number(s.totaal.vorige_omzet);
  const opnDgn = s?.totaal.open_dagen == null ? null : Number(s.totaal.open_dagen);
  const bonnen = s?.totaal.bonnen == null ? null : Number(s.totaal.bonnen);
  const gemDag = opnDgn != null && opnDgn > 0 ? omzet / opnDgn : null;
  const gemBon = bonnen != null && bonnen > 0 ? omzet / bonnen : null;
  const per = s?.per_vestiging ?? [];
  const pct = prev != null && prev > 0 ? ((omzet - prev) / prev) * 100 : null;

  const bronMix = s?.totaal.omzet_bron_mix;
  const nEitje = Number(bronMix?.eitje ?? 0);

  const beideSubline = (getter: (p: Samenvatting['per_vestiging'][number]) => string) =>
    vestigingKeuze === 'Beide' && per.length > 0 ? per.map(getter).join(' · ') : null;

  const dash = '—';

  const cols: { label: string; value: React.ReactNode; sub: React.ReactNode; dp?: number | null }[] = [
    {
      label: 'Omzet',
      value: <Money v={omzet} />,
      sub: beideSubline((p) => `${p.vestiging} ${EUR.format(Number(p.omzet))}`) ?? `vestiging ${vestigingKeuze}`,
      dp: pct,
    },
    {
      label: 'Bonnen',
      value: bonnen == null ? <span>{dash}</span> : <Count v={bonnen} />,
      sub: bonnen == null ? 'niet beschikbaar bij Eitje-omzet' : 'aantal transacties',
    },
    {
      label: 'Gem. besteding / bon',
      value: gemBon == null ? <span>{dash}</span> : <Money v={gemBon} decimals={2} />,
      sub: gemBon == null ? 'niet beschikbaar bij Eitje-omzet' : 'per bon',
    },
    {
      label: 'Gem. per open dag',
      value: gemDag == null ? <span>{dash}</span> : <Money v={gemDag} />,
      sub: opnDgn == null
        ? 'niet beschikbaar bij Eitje-omzet'
        : `${opnDgn} open ${opnDgn === 1 ? 'dag' : 'dagen'}`,
    },
    {
      label: 'T.o.v. vorige periode',
      value: pct === null ? dash : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
      sub: prev == null
        ? 'geen vergelijkbare omzet'
        : `${omzet - prev >= 0 ? '+' : ''}${EUR2.format(omzet - prev)} vs. ${EUR.format(prev)}`,
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
      {nEitje > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
          borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted)/0.4)',
          fontSize: 12, color: 'hsl(var(--muted-foreground))',
        }}>
          <AlertTriangle size={14} className="text-amber-600" />
          <span>
            {nEitje} {nEitje === 1 ? 'dag omzet' : 'dagen omzet'} uit Eitje (Lightspeed leeg of niet-representatief).
            Bonnen, gem. besteding en gem. per open dag zijn dan niet beschikbaar.
          </span>
        </div>
      )}
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
