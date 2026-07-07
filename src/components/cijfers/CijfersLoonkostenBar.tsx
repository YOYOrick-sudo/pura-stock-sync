import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { EUR, EUR2, vestigingenVan, prevLabel, type Periode, type VestKeuze } from './types';
import { useCountUp } from './useCountUp';
import { DeltaPill } from './chartHelpers';
import type { DeltaIntent } from './deltaKleur';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }

type PerVest = {
  vestiging: string;
  gewerkte_uren: number; geplande_uren: number;
  loonkosten: number; omzet: number;
  loonkosten_pct_omzet: number | null;
  omzet_per_gewerkt_uur: number | null;
  prev_loonkosten: number; prev_omzet: number; prev_gewerkte_uren: number;
  bron_mix: { eitje: number; berekend: number };
  omzet_bron_mix?: { lightspeed: number; eitje: number; geen: number };
};
type Sam = {
  periode: { van: string; tot: string };
  vorige_periode: { van: string; tot: string };
  totaal: PerVest & { vestiging?: never };
  per_vestiging: PerVest[];
};

export function CijfersLoonkostenBar({ vestigingKeuze, van, tot }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const q = useQuery({
    queryKey: ['cijfers-uren-samenvatting', vestigingKeuze, van, tot],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_uren_samenvatting', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot,
      });
      if (error) throw error;
      return data as unknown as Sam;
    },
    refetchOnWindowFocus: true,
  });

  if (q.isLoading) {
    return (
      <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: '18px 20px', borderLeft: i === 0 ? undefined : '1px solid hsl(var(--border))' }}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-28 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (q.isError || !q.data) return null;

  const t = q.data.totaal;
  const loonkosten = Number(t.loonkosten ?? 0);
  const prevLoon = Number(t.prev_loonkosten ?? 0);
  const omzet = Number(t.omzet ?? 0);
  const prevOmzet = Number(t.prev_omzet ?? 0);
  const gewerkt = Number(t.gewerkte_uren ?? 0);
  const gepland = Number(t.geplande_uren ?? 0);
  const prevGewerkt = Number(t.prev_gewerkte_uren ?? 0);
  const pctVanOmzet = t.loonkosten_pct_omzet != null ? Number(t.loonkosten_pct_omzet) : null;
  const omzPerUur = t.omzet_per_gewerkt_uur != null ? Number(t.omzet_per_gewerkt_uur) : null;

  // Vergelijkingen met vorige periode
  const dpLoon = prevLoon > 0 ? ((loonkosten - prevLoon) / prevLoon) * 100 : null;
  const prevOmzPerUur = prevGewerkt > 0 ? prevOmzet / prevGewerkt : 0;
  const dpOmzPerUur = prevOmzPerUur > 0 && omzPerUur != null
    ? ((omzPerUur - prevOmzPerUur) / prevOmzPerUur) * 100 : null;
  const dpUren = prevGewerkt > 0 ? ((gewerkt - prevGewerkt) / prevGewerkt) * 100 : null;

  const afwijking = gepland > 0 ? ((gewerkt - gepland) / gepland) * 100 : null;
  const berekend = Number(t.bron_mix?.berekend ?? 0);
  const omsEitje = Number(t.omzet_bron_mix?.eitje ?? 0);

  const prevLbl = prevLabel(q.data.vorige_periode?.van, q.data.vorige_periode?.tot);
  const vsSub = prevLbl ? ` · vs ${prevLbl}` : '';

  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Col first
          label="Loonkosten"
          value={<Money v={loonkosten} />}
          sub={(pctVanOmzet != null ? `${pctVanOmzet.toString().replace('.', ',')}% van omzet` : 'geen omzet in periode') + vsSub}
          dp={dpLoon}
          intent="neutraal"
          dpTitle={prevLbl ? `t.o.v. ${prevLbl}` : undefined}
        />
        <Col
          label="Omzet / gewerkt uur"
          value={omzPerUur == null ? <span>—</span> : <Money v={omzPerUur} decimals={2} />}
          sub={`${gewerkt.toFixed(1).replace('.', ',')} u gewerkt${vsSub}`}
          dp={dpOmzPerUur}
          intent="hoger-is-goed"
          dpTitle={prevLbl ? `t.o.v. ${prevLbl}` : undefined}
        />
        <Col
          label="Uren gewerkt vs gepland"
          value={<span>{gewerkt.toFixed(0)} / {gepland.toFixed(0)}</span>}
          sub={
            afwijking == null
              ? 'geen planning'
              : `${gewerkt.toFixed(0).replace('.', ',')} u gewerkt · ${gepland.toFixed(0)} u gepland`
          }
          dp={afwijking}
          intent="afwijking-signaal"
          dpTitle="afwijking t.o.v. planning"
        />
      </div>
      {(berekend > 0 || omsEitje > 0) && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 16px',
          borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted)/0.4)',
          fontSize: 12, color: 'hsl(var(--muted-foreground))',
        }}>
          {berekend > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} className="text-amber-600" />
              <span>
                {berekend} {berekend === 1 ? 'dag berekend' : 'dagen berekend'} met vangnet-uurloon
                {' '}(geen geldig tarief in Eitje). Loonkosten kunnen afwijken van werkelijk.
              </span>
            </div>
          )}
          {omsEitje > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} className="text-amber-600" />
              <span>
                {omsEitje} {omsEitje === 1 ? 'dag omzet' : 'dagen omzet'} uit Eitje (Lightspeed leeg of niet-representatief).
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Col({
  label, value, sub, dp, intent, dpTitle, first,
}: {
  label: string; value: React.ReactNode; sub: React.ReactNode;
  dp?: number | null; intent?: DeltaIntent; dpTitle?: string; first?: boolean;
}) {
  return (
    <div style={{
      padding: '18px 20px',
      borderLeft: first ? undefined : '1px solid hsl(var(--border))',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
        color: 'hsl(var(--muted-foreground))',
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 9 }}>
        <span style={{
          fontSize: 25, fontWeight: 700, letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: 'hsl(var(--foreground))',
        }}>{value}</span>
        {dp !== undefined && <DeltaPill pct={dp ?? null} intent={intent ?? 'hoger-is-goed'} title={dpTitle} />}
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
