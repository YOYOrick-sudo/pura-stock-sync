import { useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMepKalender, ymd } from '@/hooks/useMepPlanning';

interface Props {
  vestiging: string;
  /** Dag die nu geldt voor de taak (yyyy-MM-dd). */
  waarde: string;
  /** De dag die op de pagina bekeken wordt (yyyy-MM-dd). */
  bekekenDatum: string;
  onKies: (dag: string) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Dagkeuze voor een MEP-taak: de bekeken dag, de eerstvolgende open dagen en
 * een kalender voor een andere dag. Gesloten dagen mogen, maar alleen na een
 * extra bevestiging — zodat niemand per ongeluk op een dichte dag plant.
 */
export function MepDagKiezer({
  vestiging,
  waarde,
  bekekenDatum,
  onKies,
  disabled,
  label = 'Wanneer?',
}: Props) {
  const kalender = useMepKalender(vestiging);
  const [kalenderOpen, setKalenderOpen] = useState(false);
  const [bevestigDag, setBevestigDag] = useState<string | null>(null);

  const opties = useMemo(() => {
    const lijst: { waarde: string; label: string }[] = [];
    const voegToe = (d: Date, tekst?: string) => {
      const key = ymd(d);
      if (lijst.some((o) => o.waarde === key)) return;
      lijst.push({ waarde: key, label: tekst ?? kalender.dagLabel(d) });
    };
    voegToe(parseISO(bekekenDatum));
    voegToe(addDays(kalender.vandaag, 1));
    let zoek = addDays(kalender.vandaag, 1);
    for (let i = 0; i < 3 && lijst.length < 4; i++) {
      zoek = kalender.volgendeOpenDag(zoek);
      voegToe(zoek, format(zoek, 'EEE d MMM', { locale: nl }));
    }
    return lijst.slice(0, 4);
  }, [bekekenDatum, kalender]);

  const kies = (dag: string) => {
    if (dag === waarde) return;
    const datum = parseISO(dag);
    if (!kalender.isOpen(datum)) {
      setBevestigDag(dag);
      return;
    }
    setBevestigDag(null);
    onKies(dag);
  };

  const gekozenLabel = (() => {
    const d = parseISO(waarde);
    const kort = kalender.dagLabel(d);
    if (kort === 'Vandaag' || kort === 'Morgen') return kort.toLowerCase();
    return format(d, 'EEEE d MMMM', { locale: nl });
  })();

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opties.map((o) => (
          <button
            key={o.waarde}
            type="button"
            disabled={disabled}
            onClick={() => kies(o.waarde)}
            className={cn(
              'rounded-polar-md border px-4 min-h-[44px] text-[14px] font-medium transition-colors disabled:opacity-50',
              waarde === o.waarde
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/60 bg-card hover:bg-primary/5 active:bg-primary/10',
            )}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setKalenderOpen((v) => !v)}
          className={cn(
            'rounded-polar-md border px-4 min-h-[44px] text-[14px] font-medium transition-colors disabled:opacity-50',
            !opties.some((o) => o.waarde === waarde)
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border/60 bg-card hover:bg-primary/5 active:bg-primary/10',
          )}
        >
          Andere dag…
        </button>
      </div>

      {kalenderOpen && (
        <input
          type="date"
          value={waarde}
          min={ymd(kalender.vandaag)}
          max={ymd(addDays(kalender.vandaag, 60))}
          disabled={disabled}
          onChange={(e) => e.target.value && kies(e.target.value)}
          className="mt-1 w-full min-h-[44px] rounded-polar-md border border-border/60 bg-card px-3 text-[15px] text-foreground"
        />
      )}

      {bevestigDag && (
        <div className="rounded-polar-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
          <p className="text-[14px] text-foreground">
            {format(parseISO(bevestigDag), 'EEEE d MMMM', { locale: nl })} is een gesloten dag
            {kalender.sluitReden(parseISO(bevestigDag))
              ? ` (${kalender.sluitReden(parseISO(bevestigDag))})`
              : ''}
            . Toch op deze dag plannen?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onKies(bevestigDag);
                setBevestigDag(null);
              }}
              className="rounded-polar-md border border-primary bg-primary px-4 min-h-[44px] text-[14px] font-medium text-primary-foreground"
            >
              Ja, toch plannen
            </button>
            <button
              type="button"
              onClick={() => setBevestigDag(null)}
              className="rounded-polar-md border border-border/60 bg-card px-4 min-h-[44px] text-[14px] font-medium"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {waarde !== bekekenDatum && !bevestigDag && (
        <p className="text-[13px] text-muted-foreground">Staat op {gekozenLabel}.</p>
      )}
    </div>
  );
}
