import { useState, type ReactNode } from 'react';
import { Check, Loader2, PackagePlus, ShoppingCart, Snowflake, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  aanvulUitkomst,
  doelLadeTekst,
  ontdooiInstructie,
  stapTitel,
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

type Tint = 'succes' | 'letop' | 'fout' | 'info';

const TINT: Record<Tint, string> = {
  succes: 'bg-success text-success-foreground hover:bg-success/90',
  letop: 'bg-warning text-warning-foreground hover:bg-warning/90',
  fout: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  info: 'bg-info text-info-foreground hover:bg-info/90',
};

function Keuze({
  children,
  toelichting,
  icon,
  tint,
  onClick,
  disabled,
}: {
  children: string;
  toelichting?: string;
  icon: ReactNode;
  tint: Tint;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      size="lg"
      className={cn(
        'h-auto min-h-16 w-full whitespace-normal px-4 py-3 text-lg font-semibold leading-tight shadow-sm [&_svg]:!h-6 [&_svg]:!w-6',
        TINT[tint],
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span className="text-center leading-tight">
        <span className="block">{children}</span>
        {toelichting ? <span className="mt-0.5 block text-sm font-medium">{toelichting}</span> : null}
      </span>
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
  const besteld = doorgezetNaar === 'bestelbord' || doorgezetNaar === 'midsland';

  return (
    <li
      data-aanvulketen="falafel"
      className={cn(
        'rounded-polar border px-3 py-3',
        afgevinkt
          ? 'border-success/40 bg-success/10'
          : doorgezet && !besteld
            ? 'border-info/40 bg-info/10'
            : besteld
              ? 'border-destructive/40 bg-destructive/10'
              : 'border-border bg-card',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`${naam} afvinken`}
          aria-pressed={afgevinkt}
          disabled={laden || doorgezet}
          onClick={onVink}
          className="flex h-12 w-12 shrink-0 items-center justify-center"
        >
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-polar-sm border-2 bg-background',
              afgevinkt
                ? 'border-success bg-success text-success-foreground'
                : doorgezet && !besteld
                  ? 'border-info bg-info/15 text-info'
                  : besteld
                    ? 'border-destructive bg-destructive/15 text-destructive'
                    : fout
                      ? 'border-destructive'
                      : 'border-border',
            )}
          >
            {laden ? <Loader2 className="h-5 w-5 animate-spin" /> : afgevinkt ? <Check className="h-5 w-5" strokeWidth={3} /> : null}
          </span>
        </button>
        <div className="min-w-0 flex-1 pt-2">
          <p className={cn('text-lg font-semibold leading-snug', afgevinkt && 'text-muted-foreground line-through')}>{naam}</p>
          <p className="mt-0.5 text-base text-muted-foreground">
            {afgevinkt ? 'Op peil' : doorgezet ? aanvulUitkomst(doorgezetNaar) : doelLadeTekst(vulnorm)}
          </p>
          {doorgezet && !afgevinkt && (
            <p className={cn('mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold', besteld ? 'bg-destructive text-destructive-foreground' : 'bg-info text-info-foreground')}>
              {besteld ? <ShoppingCart className="h-4 w-4" aria-hidden /> : <Snowflake className="h-4 w-4" aria-hidden />}
              {besteld ? 'Bestelsignaal' : 'Ontdooien'}
            </p>
          )}
        </div>
        {doorgezet && (
          <Button type="button" variant="outline" className="h-12 shrink-0 px-4 text-base" disabled={laden} onClick={onHerstel}>
            Herstel
          </Button>
        )}
      </div>

      {!klaar && (
        <div className="mt-4 space-y-3">
          <p className="text-lg font-semibold leading-snug">{stapTitel(naam, stap)}</p>
          {stap === 'koelcel' && <p className="text-base">Vul de lade aan uit de koelcel.</p>}
          {stap === 'vriezer' && (
            <p className="text-base">{ontdooiInstructie({ eenheid, doel_aantal: doelAantal, batch_aantal: batchAantal })}</p>
          )}
          {stap === 'lade' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Keuze tint="succes" icon={<Check aria-hidden />} disabled={laden} onClick={onOpPeil}>Op peil</Keuze>
              <Keuze tint="letop" icon={<PackagePlus aria-hidden />} disabled={laden} onClick={() => setStap('koelcel')}>Aanvullen</Keuze>
            </div>
          )}
          {stap === 'koelcel' && (
            <div className="grid grid-cols-1 gap-3">
              <Keuze tint="succes" icon={<Check aria-hidden />} disabled={laden} onClick={onAangevuld}>Aangevuld uit koelcel</Keuze>
              <Keuze tint="fout" icon={<TriangleAlert aria-hidden />} disabled={laden} onClick={() => setStap('vriezer')}>Koelcel onvoldoende</Keuze>
            </div>
          )}
          {stap === 'vriezer' && (
            <div className="grid grid-cols-1 gap-3">
              <Keuze tint="info" icon={<Snowflake aria-hidden />} disabled={laden} onClick={onOntdooien}>Ontdooien gestart (uit vriezer)</Keuze>
              <Keuze tint="fout" icon={<ShoppingCart aria-hidden />} toelichting="Bestelsignaal" disabled={laden} onClick={onBestellen}>Vriezer onvoldoende</Keuze>
            </div>
          )}
          {stap !== 'lade' && (
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 text-base text-muted-foreground"
              disabled={laden}
              onClick={() => setStap(stap === 'vriezer' ? 'koelcel' : 'lade')}
            >
              Terug
            </Button>
          )}
          {fout && <p className="text-base font-medium text-destructive">Niet opgeslagen. Tik opnieuw.</p>}
        </div>
      )}
    </li>
  );
}
