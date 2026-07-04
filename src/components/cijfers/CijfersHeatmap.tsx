import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { vestigingenVan, type Periode, type VestKeuze } from './types';
import { EUR0 } from './chartHelpers';

const DAG_NL_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const DAG_NL = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const UREN = Array.from({ length: 14 }, (_, i) => 10 + i);

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

  const [hover, setHover] = useState<string | null>(null);

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px' }}>
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="space-y-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="grid gap-[5px]" style={{ gridTemplateColumns: `44px repeat(14, minmax(0,1fr))` }}>
              <Skeleton className="h-[27px]" />
              {Array.from({ length: 14 }).map((__, j) => <Skeleton key={j} className="h-[27px] rounded-[6px]" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cellen = q.data ?? [];
  const grid = new Map<string, Cel>();
  cellen.forEach((c) => grid.set(`${c.isodow}|${c.uur}`, c));
  const max = cellen.reduce((m, c) => Math.max(m, Number(c.gem_omzet)), 0);
  const bg = (v: number) => {
    if (max === 0) return 'rgba(0,0,0,0.03)';
    const t = v / max;
    return `hsl(var(--primary) / ${(0.06 + t * 0.82).toFixed(3)})`;
  };

  let heatSubtitle = 'Gem. omzet per uur × weekdag';
  if (hover) {
    const [ds, hs] = hover.split('|').map(Number);
    const c = grid.get(`${ds + 1}|${UREN[hs]}`);
    const dn = DAG_NL_LONG[ds];
    heatSubtitle = `${dn} ${String(UREN[hs]).padStart(2, '0')}:00 — ${EUR0.format(Number(c?.gem_omzet ?? 0))} gem.`;
  }

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card cj-card-in" style={{ padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Uur-heatmap</div>
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
        <div style={{ minWidth: 640 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${UREN.length}, minmax(0,1fr))`, gap: 5 }}>
            {/* Header row */}
            <div />
            {UREN.map((hr, i) => (
              <div key={hr} style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))', textAlign: 'center', paddingBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                {i % 2 === 0 ? String(hr).padStart(2, '0') : ''}
              </div>
            ))}
            {/* Rows */}
            {DAG_NL.map((day, di) => {
              const weekend = di >= 5;
              return (
                <>
                  <div
                    key={'d' + di}
                    style={{
                      fontSize: 11, fontWeight: weekend ? 700 : 500,
                      color: weekend ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8,
                    }}
                  >{day}</div>
                  {UREN.map((hr, hi) => {
                    const c = grid.get(`${di + 1}|${hr}`);
                    const v = Number(c?.gem_omzet ?? 0);
                    const id = di + '|' + hi;
                    const hov = hover === id;
                    return (
                      <div
                        key={id}
                        onMouseEnter={() => setHover(id)}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          height: 27, borderRadius: 6, background: bg(v),
                          cursor: 'default',
                          boxShadow: hov ? `0 0 0 2px hsl(var(--card)), 0 0 0 3.5px hsl(var(--primary))` : 'none',
                          transition: 'box-shadow .1s',
                        }}
                      />
                    );
                  })}
                </>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
