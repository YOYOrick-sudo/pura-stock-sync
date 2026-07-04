import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/pura/EmptyState';
import { BarChart3 } from 'lucide-react';
import {
  EUR, VEST_KLEUR, granulariteitVoor, periodeRange, vestigingenVan,
  type Periode, type VestKeuze, type Vestiging,
} from './types';

const DAG_NL = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MND_NL = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

interface Props { periode: Periode; vestigingKeuze: VestKeuze }

type Row = { bucket: string; vestiging: string; omzet: number; bonnen: number };

function labelVoor(bucket: string, gran: 'uur' | 'dag' | 'maand'): string {
  const d = new Date(bucket);
  if (gran === 'uur') return `${d.getHours().toString().padStart(2, '0')}:00`;
  if (gran === 'dag') return `${DAG_NL[d.getDay()]} ${d.getDate()}`;
  return MND_NL[d.getMonth()];
}

export function CijfersHoofdgrafiek({ periode, vestigingKeuze }: Props) {
  const { van, tot } = periodeRange(periode);
  const vestigingen = vestigingenVan(vestigingKeuze);
  const gran = granulariteitVoor(periode);

  const q = useQuery({
    queryKey: ['cijfers-tijdreeks', periode, vestigingKeuze, van, tot, gran],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_cijfers_tijdreeks', {
        p_vestigingen: vestigingen, p_van: van, p_tot: tot, p_granulariteit: gran,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchOnWindowFocus: true,
  });

  const title =
    periode === 'vandaag' ? 'Vandaag per uur' :
    periode === 'week' ? 'Deze week per dag' :
    periode === 'maand' ? 'Deze maand per dag' : 'Dit jaar per maand';

  if (q.isLoading) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="text-base font-semibold mb-4">{title}</div>
        <Skeleton className="h-[320px] rounded-[14px]" />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <EmptyState icon={BarChart3} title="Kan grafiek niet laden" description={(q.error as Error).message} />
      </div>
    );
  }

  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
        <div className="text-base font-semibold mb-4">{title}</div>
        <EmptyState icon={BarChart3} title="Geen data in deze periode" description="Zodra er omzet is, verschijnt hij hier." />
      </div>
    );
  }

  // Pivot naar {label, Midsland, West, bonnen_Midsland, bonnen_West}
  const map = new Map<string, any>();
  for (const r of rows) {
    const key = r.bucket;
    const label = labelVoor(r.bucket, gran);
    const entry = map.get(key) ?? { key, label };
    entry[r.vestiging] = Number(r.omzet);
    entry[`bonnen_${r.vestiging}`] = Number(r.bonnen);
    map.set(key, entry);
  }
  const data = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  const series: Vestiging[] = vestigingen;

  return (
    <div className="bg-card border border-border rounded-[20px] shadow-card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">
          {periode === 'vandaag' ? 'Openingsuren 10:00–24:00' : `${van} → ${tot}`}
        </div>
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          {gran === 'uur' ? (
            <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => EUR.format(Number(v))} width={72} />
              <Tooltip content={<Tt />} />
              {series.length > 1 && <Legend />}
              {series.map((v) => (
                <Line key={v} type="monotone" dataKey={v} stroke={VEST_KLEUR[v]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => EUR.format(Number(v))} width={72} />
              <Tooltip content={<Tt />} />
              {series.length > 1 && <Legend />}
              {series.map((v) => (
                <Bar key={v} dataKey={v} fill={VEST_KLEUR[v]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Tt({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-border bg-card px-3 py-2 shadow-md text-xs">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p: any) => {
        const key = p.dataKey as string;
        const bonnen = p.payload[`bonnen_${key}`] ?? 0;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{key}:</span>
            <span className="font-medium">{EUR.format(Number(p.value))}</span>
            <span className="text-muted-foreground">· {bonnen} bonnen</span>
          </div>
        );
      })}
    </div>
  );
}
