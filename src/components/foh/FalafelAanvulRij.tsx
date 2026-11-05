import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  aanvulUitkomst,
  doelLadeTekst,
  ontdooiInstructie,
  type AanvulStap,
} from '@/lib/aanvulketen';

type Props = {
  naam: string;
  vulnorm?: string | null;
  eenheid?: string | null;
  doelAantal?: number | null;
  batchAantal?: number | null;
  afgevinkt: boolean;
  doorgezet: boolean;
  doorgezetNaar?: string | null;
  laden: boolean;
  fout: boolean;
  /** Alleen voor tests en schermafbeeldingen; de medewerker begint op de lade. */
  beginStap?: AanvulStap;
  onOpPeil: () => void;
  onAangevuld: () => void;
  onOntdooien: () => void;
  onBestellen: () => void;
  onHerstel: () => void;
  onVink: () => void;
};

function Keuze({
  children,
  onClick,
  disabled,
  primair,
}: {
  children: string;
  onClick: () => void;
  disabled: boolean;
  primair?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={primair ? 'default' : 'outline'}
      className="h-auto min-h-14 w-full whitespace-normal px-4 py-3 text-base"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/**
 * Uitklapregel voor falafel. Eén tik als de lade op peil is. Alleen bij een
 * tekort komt de koelcel, daarna de vriezer, en pas dan een bestelsignaal.
 */
export function FalafelAanvulRij({
  naam,
  vulnorm,
  eenheid,
  doelAantal,
  batchAantal,
  afgevinkt,
  doorgezet,
  doorgezetNaar,
  laden,
  fout,
  beginStap = 'lade',
  onOpPeil,
  onAangevuld,
  onOntdooien,
  onBestellen,
  onHerstel,
  onVink,
}: Props) {
  const [stap, setStap] = useState<AanvulStap>(beginStap);
  const klaar = afgevinkt || doorgezet;

  return (
    <li
      data-aanvulketen="falafel"
      className={cn(
        'rounded-polar border px-3 py-3',
        afgevinkt ? 'border-transparent bg-muted/40' : doorgezet ? 'border-warning/30 bg-warning/5' : 'border-border bg-card',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`${naam} afvinken`}
          aria-pressed={afgevinkt}
          disabled={laden || doorgezet}
          onClick={onVink}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-polar-sm border-2 bg-background',
              afgevinkt
                ? 'border-muted-foreground/30 bg-muted-foreground/15 text-muted-foreground'
                : doorgezet
                  ? 'border-warning bg-warning/15'
                  : fout
                    ? 'border-destructive'
                    : 'border-border',
            )}
          >
            {laden ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : afgevinkt ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
          </span>
        </button>
        <div className="min-w-0 flex-1 pt-2">
          <p className={cn('text-base font-medium leading-snug', afgevinkt && 'text-muted-foreground line-through opacity-55')}>{naam}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {afgevinkt ? 'Op peil' : doorgezet ? aanvulUitkomst(doorgezetNaar) : doelLadeTekst(vulnorm)}
          </p>
        </div>
        {doorgezet && (
          <Button type="button" variant="ghost" className="h-11 shrink-0 px-3 text-sm text-muted-foreground" disabled={laden} onClick={onHerstel}>
            Herstel
          </Button>
        )}
      </div>

      {!klaar && (
        <div className="mt-3 space-y-2">
          {stap === 'koelcel' && <p className="text-base">Vul de lade aan uit de koelcel.</p>}
          {stap === 'vriezer' && (
            <p className="text-base">{ontdooiInstructie({ eenheid, doel_aantal: doelAantal, batch_aantal: batchAantal })}</p>
          )}
          {stap === 'lade' && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Keuze primair disabled={laden} onClick={onOpPeil}>Op peil</Keuze>
              <Keuze disabled={laden} onClick={() => setStap('koelcel')}>Aanvullen</Keuze>
            </div>
          )}
          {stap === 'koelcel' && (
            <div className="grid grid-cols-1 gap-2">
              <Keuze primair disabled={laden} onClick={onAangevuld}>Aangevuld uit koelcel</Keuze>
              <Keuze disabled={laden} onClick={() => setStap('vriezer')}>Koelcel onvoldoende</Keuze>
            </div>
          )}
          {stap === 'vriezer' && (
            <div className="grid grid-cols-1 gap-2">
              <Keuze primair disabled={laden} onClick={onOntdooien}>Ontdooien gestart (uit vriezer)</Keuze>
              <Keuze disabled={laden} onClick={onBestellen}>Vriezer onvoldoende</Keuze>
            </div>
          )}
          {stap !== 'lade' && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 px-3 text-sm text-muted-foreground"
              disabled={laden}
              onClick={() => setStap(stap === 'vriezer' ? 'koelcel' : 'lade')}
            >
              Terug
            </Button>
          )}
          {fout && <p className="text-sm text-destructive">Niet opgeslagen. Tik opnieuw.</p>}
        </div>
      )}
    </li>
  );
}
