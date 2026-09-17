import { AlertTriangle, Check } from 'lucide-react';
import type { VoorraadLade } from '@/hooks/useVoorraadLades';

export type LadeStatus = 'open' | 'klaar' | 'tekort';

export interface KastVak {
  sleutel: string;
  naam: string;
  lade: VoorraadLade | null;
  status: LadeStatus;
  aantal: number;
}

const KOLOM_LABEL = ['Links', 'Midden', 'Rechts'];

function Vak({ vak, onTik }: { vak: KastVak; onTik: (sleutel: string) => void }) {
  const kleur =
    vak.status === 'klaar'
      ? 'border-primary/40 bg-primary/10 text-foreground'
      : vak.status === 'tekort'
        ? 'border-warning/50 bg-warning/10 text-foreground'
        : 'border-border bg-card text-foreground';

  return (
    <button
      type="button"
      onClick={() => onTik(vak.sleutel)}
      className={`flex w-full flex-col items-start justify-center gap-0.5 rounded-[12px] border px-2.5 py-2 text-left transition-colors ${kleur}`}
      style={{ minHeight: 48 }}
    >
      <span className="flex w-full items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold leading-tight">{vak.naam}</span>
        {vak.status === 'klaar' && <Check size={14} className="shrink-0 text-primary" />}
        {vak.status === 'tekort' && <AlertTriangle size={14} className="shrink-0 text-warning" />}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {vak.lade?.rol === 'reserve' ? 'reserve · ' : ''}
        {vak.aantal} {vak.aantal === 1 ? 'product' : 'producten'}
      </span>
    </button>
  );
}

/**
 * Kleine plattegrond van de koelwerkbank: 3 kolommen x 3 lades.
 * Tik een lade aan om in de lijst naar die lade te springen.
 */
export function KastOverzicht({
  vakken,
  losseVakken,
  onTik,
}: {
  vakken: KastVak[];
  losseVakken: KastVak[];
  onTik: (sleutel: string) => void;
}) {
  if (vakken.length === 0 && losseVakken.length === 0) return null;

  const klaar = [...vakken, ...losseVakken].filter((v) => v.status !== 'open').length;
  const totaal = vakken.length + losseVakken.length;
  const kolommen = [1, 2, 3];

  return (
    <div className="mb-3 rounded-[18px] border border-border bg-card p-3">
      {vakken.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {kolommen.map((kolom) => (
            <div key={kolom} className="space-y-1.5">
              <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {KOLOM_LABEL[kolom - 1]}
              </p>
              {vakken
                .filter((v) => v.lade?.kolom === kolom)
                .sort((a, b) => (a.lade?.rij ?? 0) - (b.lade?.rij ?? 0))
                .map((v) => (
                  <Vak key={v.sleutel} vak={v} onTik={onTik} />
                ))}
            </div>
          ))}
        </div>
      )}

      {losseVakken.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {losseVakken.map((v) => (
            <Vak key={v.sleutel} vak={v} onTik={onTik} />
          ))}
        </div>
      )}

      <p className="mt-2 text-center text-[12px] font-medium tabular-nums text-muted-foreground">
        {klaar} van {totaal} lades geteld
      </p>
    </div>
  );
}

export default KastOverzicht;
