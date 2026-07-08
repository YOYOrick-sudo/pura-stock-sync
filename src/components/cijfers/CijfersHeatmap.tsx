import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { vestigingenVan, type Periode, type VestKeuze } from './types';
import { EUR0 } from './chartHelpers';

const DAG_NL_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const DAG_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const UREN = Array.from({ length: 15 }, (_, i) => 9 + i); // 09–23

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Cel = {
  isodow: number; uur: number;
  gem_omzet: number; n_dagen: number;
  gem_headcount: number; gem_fte: number;
};

export function CijfersHeatmap({ periode, vestigingKeuze, van: pvan, tot }: Props) {
  const isSingle = periode === 'vandaag';
  const van = isSingle
    ? (() => { const d = new Date(tot); d.setDate(d.getDate() - 56); return d.toISOString().slice(0, 10); })()
    : pvan;
  const vestigingen = vestigingenVan(vestigingKeuze);

  const q = useQuery({
    queryKey: ['cijfers-heatmap-bezet', periode, vestigingKeuze, van, tot],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_heatmap_bezet', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot,
      });
      if (error) throw error;
      return (data ?? []) as Cel[];
    },
    refetchOnWindowFocus: true,
  });

  const [hover, setHover] = useState<string | null>(null);

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px' }}>
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="grid gap-[5px]" style={{ gridTemplateColumns: `44px repeat(${UREN.length}, minmax(0,1fr))` }}>
              <Skeleton className="h-[40px]" />
              {Array.from({ length: UREN.length }).map((__, j) => <Skeleton key={j} className="h-[40px] rounded-[6px]" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (q.error) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card" style={{ padding: '22px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Uur-heatmap — omzet × bezetting</div>
        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.3)', fontSize: 12.5, color: 'hsl(var(--destructive))' }}>
          <b>RPC-fout:</b> {(q.error as any)?.message ?? String(q.error)}
        </div>
      </div>
    );
  }

  const cellen = q.data ?? [];
  const grid = new Map<string, Cel>();
  cellen.forEach((c) => grid.set(`${c.isodow}|${c.uur}`, c));
  const max = cellen.reduce((m, c) => Math.max(m, Number(c.gem_omzet)), 0);
  const bg = (v: number) => {
    if (max === 0) return 'hsl(var(--muted) / 0.4)';
    const t = v / max;
    return `hsl(var(--primary) / ${(0.05 + t * 0.78).toFixed(3)})`;
  };
  const contrastText = (v: number) => {
    if (max === 0) return 'hsl(var(--muted-foreground))';
    return v / max > 0.55 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))';
  };

  let heatSubtitle = 'Gem. omzet (kleur) + bezetting per cel — weekdag × uur';
  if (hover) {
    const [ds, hs] = hover.split('|').map(Number);
    const c = grid.get(`${ds + 1}|${UREN[hs]}`);
    const dn = DAG_NL_LONG[ds];
    const hc = Number(c?.gem_headcount ?? 0);
    const fte = Number(c?.gem_fte ?? 0);
    heatSubtitle = `${dn} ${String(UREN[hs]).padStart(2, '0')}:00 — ${EUR0.format(Number(c?.gem_omzet ?? 0))} · ${hc.toFixed(1)} pers · ${fte.toFixed(2)} FTE`;
  }

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Uur-heatmap — omzet × bezetting</div>
          <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', marginTop: 3 }}>{heatSubtitle}</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'hsl(var(--muted-foreground))' }}>
          <span>rustig</span>
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {[0.08, 0.24, 0.42, 0.62, 0.82].map((op) => (
              <span key={op} style={{ width: 16, height: 12, borderRadius: 3, background: `hsl(var(--primary) / ${op})` }} />
            ))}
          </span>
          <span>druk</span>
        </div>
      </div>

      <div style={{ marginTop: 16, overflowX: 'auto' }}>
        <div style={{ minWidth: 780 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${UREN.length}, minmax(0,1fr))`, gap: 4 }}>
            {/* Header row */}
            <div />
            {UREN.map((hr, i) => (
              <div key={hr} style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textAlign: 'center', paddingBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                {i % 2 === 0 ? String(hr).padStart(2, '0') : ''}
              </div>
            ))}
            {/* Rows */}
            {DAG_NL.flatMap((day, di) => {
              const weekend = di >= 5;
              return [
                <div
                  key={'d' + di}
                  style={{
                    fontSize: 11, fontWeight: weekend ? 700 : 500,
                    color: weekend ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                  }}
                >{day}</div>,
                ...UREN.map((hr, hi) => {
                  const c = grid.get(`${di + 1}|${hr}`);
                  const v = Number(c?.gem_omzet ?? 0);
                  const hc = Number(c?.gem_headcount ?? 0);
                  const fte = Number(c?.gem_fte ?? 0);
                  const id = di + '|' + hi;
                  const hov = hover === id;
                  const hasBez = hc > 0.05;
                  return (
                    <div
                      key={'c' + id}
                      onMouseEnter={() => setHover(id)}
                      onMouseLeave={() => setHover(null)}
                      style={{
                        height: 40, borderRadius: 6, background: bg(v),
                        cursor: 'default',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 1,
                        boxShadow: hov ? `0 0 0 2px hsl(var(--card)), 0 0 0 3px hsl(var(--primary))` : 'none',
                        transition: 'box-shadow .1s',
                        color: contrastText(v),
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                      }}
                      title={hasBez
                        ? `${DAG_NL_LONG[di]} ${String(hr).padStart(2,'0')}:00 — ${EUR0.format(v)} · ${hc.toFixed(1)} pers · ${fte.toFixed(2)} FTE`
                        : `${DAG_NL_LONG[di]} ${String(hr).padStart(2,'0')}:00 — ${EUR0.format(v)} · geen bezetting`}
                    >
                      {hasBez ? (
                        <>
                          <div style={{ fontSize: 10.5, fontWeight: 700 }}>{hc.toFixed(hc < 10 ? 1 : 0)}</div>
                          <div style={{ fontSize: 8.5, opacity: 0.78, fontWeight: 500 }}>{fte.toFixed(2)}</div>
                        </>
                      ) : v > 0 ? (
                        <div style={{ fontSize: 8.5, opacity: 0.6 }}>·</div>
                      ) : null}
                    </div>
                  );
                }),
              ];
            })}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 10.5, color: 'hsl(var(--muted-foreground))', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <span><b style={{ color: 'hsl(var(--foreground))' }}>groter cijfer</b> = gemiddeld aantal medewerkers</span>
        <span><b style={{ color: 'hsl(var(--foreground))' }}>kleiner cijfer</b> = FTE-fractie (met pauze-correctie)</span>
      </div>
    </div>
  );
}
