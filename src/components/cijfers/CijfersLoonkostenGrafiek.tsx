import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { TrendingUp } from 'lucide-react';
import { vestigingenVan, type Periode, type VestKeuze } from './types';
import { EUR0, EUR2, axisEUR } from './chartHelpers';

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
function label(iso: string, gran: 'dag' | 'week' | 'maand'): string {
  const d = new Date(iso);
  if (gran === 'maand') return `${MND_NL[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  if (gran === 'week') return `w${weeknr(d)}`;
  return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
}
function weeknr(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
}

export function CijfersLoonkostenGrafiek({ vestigingKeuze, van, tot }: Props) {
  const vestigingen = vestigingenVan(vestigingKeuze);
  const gran = granVoor(van, tot);

  const q = useQuery({
    queryKey: ['cijfers-uren-tijdreeks', vestigingKeuze, van, tot, gran],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_uren_tijdreeks', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot, p_granulariteit: gran,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });

  const data = useMemo(() => {
    if (!q.data?.length) return [];
    // Aggregeer over vestigingen per bucket
    const m = new Map<string, { bucket: string; omzet: number; loonkosten: number }>();
    for (const r of q.data) {
      const key = r.bucket;
      const cur = m.get(key) ?? { bucket: key, omzet: 0, loonkosten: 0 };
      cur.omzet += Number(r.omzet ?? 0);
      cur.loonkosten += Number(r.loonkosten ?? 0);
      m.set(key, cur);
    }
    return Array.from(m.values())
      .sort((a, b) => a.bucket.localeCompare(b.bucket))
      .map(x => ({
        ...x,
        label: label(x.bucket, gran),
        pct: x.omzet > 0 ? Number(((x.loonkosten / x.omzet) * 100).toFixed(1)) : null,
      }));
  }, [q.data, gran]);

  return (
    <Card title="Omzet vs loonkosten" subtitle={granLabel(gran)}>
      {q.isLoading ? (
        <Skeleton className="h-[280px] w-full" />
      ) : data.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Geen data" description="Nog geen uren- of omzetdata voor deze periode." />
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" tickFormatter={axisEUR} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={54} />
              <YAxis yAxisId="r" orientation="right" tickFormatter={(v) => v + '%'} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} domain={[0, (dataMax: number) => Math.max(50, Math.ceil(dataMax / 10) * 10)]} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Area yAxisId="l" type="monotone" dataKey="omzet" name="Omzet" stroke="hsl(var(--primary))" fill="url(#omzetGrad)" strokeWidth={2} />
              <Line yAxisId="l" type="monotone" dataKey="loonkosten" name="Loonkosten" stroke="#E27726" strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="pct" name="Loon % omzet" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function granLabel(g: 'dag' | 'week' | 'maand'): string {
  return g === 'dag' ? 'per dag' : g === 'week' ? 'per week' : 'per maand';
}

function TT({ active, payload, label: lb }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      borderRadius: 12, padding: '10px 12px', boxShadow: '0 14px 30px -10px rgba(0,0,0,0.22)',
      minWidth: 180,
    }}>
      <div style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', marginBottom: 6 }}>{lb}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {p.name === 'Loon % omzet'
              ? (p.value == null ? '—' : `${p.value.toString().replace('.', ',')}%`)
              : (p.name === 'Loonkosten' ? EUR2.format(p.value ?? 0) : EUR0.format(p.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-border bg-card shadow-card cj-card-in p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}
