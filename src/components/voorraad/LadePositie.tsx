import { positieLabel, type VoorraadLade } from '@/hooks/useVoorraadLades';

/**
 * Heel subtiel 3x3 raster dat laat zien in welke lade van de koelwerkbank
 * iets hoort. Bedoeld als rustige hint naast een productnaam.
 */
export function LadePositie({
  lade,
  metNaam = true,
  className = '',
}: {
  lade: Pick<VoorraadLade, 'naam' | 'kolom' | 'rij'> | null | undefined;
  metNaam?: boolean;
  className?: string;
}) {
  if (!lade) return null;
  const vakjes = [1, 2, 3].flatMap((rij) => [1, 2, 3].map((kolom) => ({ rij, kolom })));

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={`${lade.naam} (${positieLabel(lade)})`}>
      <span className="grid grid-cols-3 gap-[2px]" aria-hidden>
        {vakjes.map((v) => {
          const actief = v.rij === lade.rij && v.kolom === lade.kolom;
          return (
            <span
              key={`${v.rij}-${v.kolom}`}
              className={`block h-[5px] w-[7px] rounded-[1px] ${actief ? 'bg-primary' : 'bg-muted-foreground/25'}`}
            />
          );
        })}
      </span>
      {metNaam && (
        <span className="truncate text-[11px] text-muted-foreground">{lade.naam}</span>
      )}
    </span>
  );
}

export default LadePositie;
