import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { Clock } from 'lucide-react';
import { vestigingenVan, type Periode, type VestKeuze } from './types';

interface Props { periode: Periode; vestigingKeuze: VestKeuze; van: string; tot: string }
type Row = {
  bucket: string; vestiging: string;
  gewerkte_uren: number; geplande_uren: number;
  loonkosten: number; omzet: number;
};

function granVoor(van: string, tot: string): 'dag' | 'week' | 'maand' {
  const dagen = Math.round((new Date(tot).getTime() - new Date(van).getTime()) / 86400000) + 1;
  if (dagen <= 31) return 'dag';
  if (dagen <= 180) return 'week';
  return 'maand';
}
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
function weeknr(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
}
function label(iso: string, gran: 'dag' | 'week' | 'maand'): string {
  const d = new Date(iso);
  if (gran === 'maand') return `${MND_NL[d.getMonth()]}`;
  if (gran === 'week') return `w${weeknr(d)}`;
  return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
}

export function CijfersUrenVergelijk({ vestigingKeuze, van, tot }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const gran = granVoor(van, tot);

  const q = useQuery({
    queryKey: ['cijfers-uren-vergelijk', vestigingKeuze, van, tot, gran],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_uren_tijdreeks', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot, p_granulariteit: gran,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });

  const { data, gemAfw } = useMemo(() => {
    if (!q.data?.length) return { data: [], gemAfw: null as number | null };
    const m = new Map<string, { bucket: string; gewerkt: number; gepland: number }>();
    for (const r of q.data) {
      const cur = m.get(r.bucket) ?? { bucket: r.bucket, gewerkt: 0, gepland: 0 };
      cur.gewerkt += Number(r.gewerkte_uren ?? 0);
      cur.gepland += Number(r.geplande_uren ?? 0);
      m.set(r.bucket, cur);
    }
    const rows = Array.from(m.values())
      .sort((a, b) => a.bucket.localeCompare(b.bucket))
      .map(x => ({ ...x, label: label(x.bucket, gran) }));
    const totG = rows.reduce((a, x) => a + x.gepland, 0);
    const totW = rows.reduce((a, x) => a + x.gewerkt, 0);
    const gem = totG > 0 ? ((totW - totG) / totG) * 100 : null;
    return { data: rows, gemAfw: gem };
  }, [q.data, gran]);

  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Uren gewerkt vs gepland</h3>
          <div className="text-xs text-muted-foreground mt-1">
            {gemAfw == null
              ? 'Geen planningsdata'
              : (
                <span>
                  Gem. afwijking:{' '}
                  <span style={{ fontWeight: 600, color: Math.abs(gemAfw) < 3 ? 'hsl(var(--muted-foreground))' : (gemAfw > 0 ? 'rgb(190 18 60)' : 'rgb(4 120 87)') }}>
                    {gemAfw >= 0 ? '+' : ''}{gemAfw.toFixed(1).replace('.', ',')}%
                  </span>
                  {' '}({gemAfw > 0 ? 'meer gewerkt dan gepland' : 'minder gewerkt dan gepland'})
                </span>
              )}
          </div>
        </div>
      </div>
      {q.isLoading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={Clock} title="Geen data" description="Nog geen uren gesynct voor deze periode." />
      ) : (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={38} tickFormatter={(v) => `${v}u`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Bar dataKey="gepland" name="Gepland" fill="hsl(var(--muted-foreground)/0.35)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gewerkt" name="Gewerkt" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TT({ active, payload, label: lb }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      borderRadius: 12, padding: '10px 12px', boxShadow: '0 14px 30px -10px rgba(0,0,0,0.22)',
      minWidth: 160,
    }}>
      <div style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{lb}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {(p.value ?? 0).toFixed(1).replace('.', ',')} u
          </span>
        </div>
      ))}
    </div>
  );
}
