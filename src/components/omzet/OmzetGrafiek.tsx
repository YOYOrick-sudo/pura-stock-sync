import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { formatEuro, formatProcent, MAAND_LANG, type MaandPunt } from '@/lib/omzet';

function asKort(waarde: number): string {
  const bedrag = Math.abs(waarde);
  const teken = waarde < 0 ? '−' : '';
  if (bedrag >= 1000) {
    const k = bedrag / 1000;
    const tekst = (k >= 10 ? Math.round(k) : Math.round(k * 10) / 10).toString().replace('.', ',');
    return `${teken}${tekst}k`;
  }
  return `${teken}${Math.round(bedrag)}`;
}

export function OmzetGrafiek({ punten, jaar }: { punten: MaandPunt[]; jaar: number }) {
  const config = {
    vorigJaar: { label: String(jaar - 1), color: 'hsl(var(--chart-prev-line))' },
    ditJaar: { label: String(jaar), color: 'hsl(var(--primary))' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full sm:h-80">
      <BarChart data={punten} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={asKort} />
        <ChartTooltip content={<Tip jaar={jaar} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="vorigJaar" fill="var(--color-vorigJaar)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="ditJaar" fill="var(--color-ditJaar)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}

function Tip({ active, payload, jaar }: { active?: boolean; payload?: Array<{ payload?: MaandPunt }>; jaar: number }) {
  const rij = payload?.[0]?.payload;
  if (!active || !rij) return null;
  return (
    <div className="min-w-36 rounded-polar-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium capitalize text-foreground">{MAAND_LANG[rij.maand - 1]}</p>
      <p className="flex justify-between gap-4 tabular-nums text-muted-foreground"><span>{jaar - 1}</span><span className="text-foreground">{rij.vorigJaar == null ? 'dicht' : formatEuro(rij.vorigJaar)}</span></p>
      <p className="flex justify-between gap-4 tabular-nums text-muted-foreground"><span>{jaar}</span><span className="text-foreground">{rij.ditJaar == null ? 'dicht' : formatEuro(rij.ditJaar)}</span></p>
      {rij.procent != null && <p className="mt-1 tabular-nums text-foreground">{formatProcent(rij.procent)}</p>}
    </div>
  );
}
