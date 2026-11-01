import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { formatEuro, maandDetail, MAAND_KORT, standaardZichtbareJaren, tintVoorJaar, type MaandPunt } from '@/lib/omzet';

export type GrafiekVorm = 'lijn' | 'staaf';

type Zichtbaar = { ditJaar: boolean; vorigJaar: boolean };

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

const cursorLijn = { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 };

export function OmzetGrafiek({
  punten,
  jaren,
  jaar,
  vorm,
  gekozen,
  onKies,
}: {
  punten: MaandPunt[];
  jaren: number[];
  jaar: number;
  vorm: GrafiekVorm;
  gekozen: number;
  onKies: (maand: number) => void;
}) {
  const [aan, setAan] = useState<number[]>(() => standaardZichtbareJaren(jaren, jaar));
  const [vast, setVast] = useState<number | null>(null);
  const jarenSleutel = jaren.join(',');
  useEffect(() => {
    setAan(standaardZichtbareJaren(jaren, jaar));
    setVast(null);
  }, [jaar, jarenSleutel]);

  const config = Object.fromEntries(jaren.map((j) => [String(j), { label: String(j), color: tintVoorJaar(j, jaren) }])) as ChartConfig;
  const data = punten.map((punt) => ({
    ...punt,
    ...Object.fromEntries(jaren.map((j) => [String(j), punt.perJaar[j] ?? null])),
  }));

  function kies(state: { activeTooltipIndex?: number | string }) {
    const index = Number(state?.activeTooltipIndex);
    if (!Number.isInteger(index) || index < 0 || index >= punten.length) return;
    setVast(index);
    onKies(punten[index].maand);
  }

  const gedeeld = {
    data,
    margin: { top: 8, right: 16, left: 0, bottom: 4 },
    onClick: kies,
  };
  const assen = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} tick={<MaandTick gekozen={gekozen} onKies={onKies} />} />
      <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={asKort} />
      <ChartTooltip cursor={cursorLijn} isAnimationActive={false} content={<Tip jaar={jaar} jaren={jaren} aan={aan} />} />
    </>
  );
  const aflopend = [...jaren].sort((a, b) => b - a);

  return (
    <div className="min-w-0">
      <ChartContainer config={config} className="aspect-auto h-64 w-full sm:h-80">
        {vorm === 'lijn' ? (
          <LineChart {...gedeeld}>
            {assen}
            {aflopend.map((j) => (
              <Line
                key={j}
                dataKey={String(j)}
                type="linear"
                stroke={`var(--color-${j})`}
                strokeWidth={j === jaar ? 2.5 : 2}
                dot={false}
                connectNulls={false}
                hide={!aan.includes(j)}
                isAnimationActive={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart {...gedeeld} barGap={2} barCategoryGap="20%">
            {assen}
            {aflopend.map((j) => (
              <Bar key={j} dataKey={String(j)} fill={`var(--color-${j})`} radius={[4, 4, 0, 0]} hide={!aan.includes(j)} isAnimationActive={false} />
            ))}
          </BarChart>
        )}
      </ChartContainer>
      <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
        {aflopend.map((j) => (
          <LegendaKnop
            key={j}
            label={String(j)}
            kleur={tintVoorJaar(j, jaren)}
            aan={aan.includes(j)}
            onKlik={() => setAan((nu) => nu.includes(j) ? nu.filter((jaarAan) => jaarAan !== j) : [...nu, j])}
          />
        ))}
      </div>
      {vast != null && punten[vast] && (
        <div className="flex justify-center pt-2">
          <TipBlok punt={punten[vast]} jaar={jaar} jaren={jaren} aan={aan} />
        </div>
      )}
    </div>
  );
}

function MaandTick({
  x = 0,
  y = 0,
  payload,
  gekozen,
  onKies,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  gekozen: number;
  onKies: (maand: number) => void;
}) {
  const label = payload?.value ?? '';
  const maand = MAAND_KORT.indexOf(label as typeof MAAND_KORT[number]) + 1;
  const gekozenLabel = maand === gekozen;
  return (
    <g transform={`translate(${x},${y})`} onClick={() => maand > 0 && onKies(maand)} style={{ cursor: 'pointer' }}>
      <text dy={12} textAnchor="middle" fill={gekozenLabel ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'} fontSize={12} fontWeight={gekozenLabel ? 600 : 400}>
        {label}
      </text>
    </g>
  );
}

function LegendaKnop({ label, kleur, aan, onKlik }: { label: string; kleur: string; aan: boolean; onKlik: () => void }) {
  return (
    <button type="button" aria-pressed={aan} onClick={onKlik} className="inline-flex min-h-11 items-center gap-2 rounded-polar-md px-3 text-sm">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: kleur, opacity: aan ? 1 : 0.3 }} />
      <span className={aan ? 'text-foreground' : 'text-muted-foreground line-through'}>{label}</span>
    </button>
  );
}

function Tip({
  active,
  payload,
  jaar,
  jaren,
  aan,
}: {
  active?: boolean;
  payload?: Array<{ payload?: MaandPunt }>;
  jaar: number;
  jaren: number[];
  aan: number[];
}) {
  const rij = payload?.[0]?.payload;
  if (!active || !rij) return null;
  return <TipBlok punt={rij} jaar={jaar} jaren={jaren} aan={aan} />;
}

function TipBlok({ punt, jaar, jaren, aan }: { punt: MaandPunt; jaar: number; jaren: number[]; aan: number[] }) {
  const zichtbaar: Zichtbaar = { ditJaar: aan.includes(jaar), vorigJaar: aan.includes(jaar - 1) };
  const detail = maandDetail(punt, jaar, zichtbaar);
  const aflopend = [...jaren].filter((j) => aan.includes(j)).sort((a, b) => b - a);
  return (
    <div data-testid="omzet-tooltip" className="min-w-40 rounded-polar-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium capitalize text-foreground">{detail.naam}{punt.loopt ? ' · loopt nog' : ''}</p>
      {aflopend.map((j) => (
        <TipRij key={j} label={String(j)} waarde={punt.perJaar[j] == null ? 'dicht' : formatEuro(punt.perJaar[j]!)} />
      ))}
      <TipRij label="Verschil" waarde={detail.euro} />
      <p className="mt-1 tabular-nums text-foreground">{detail.procent}</p>
    </div>
  );
}

function TipRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <p className="flex justify-between gap-4 tabular-nums text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{waarde}</span>
    </p>
  );
}
