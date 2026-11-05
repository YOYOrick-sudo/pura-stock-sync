import { useState, type ReactNode } from 'react';
import { Check, Loader2, PackagePlus, ShoppingCart, Snowflake, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VulPeil } from './VulPeil';
import { cn } from '@/lib/utils';
import {
  aanvulTekst,
  peilBlokjes,
  peilKort,
} from '@/lib/sluitronde';
import {
  aanvulUitkomst,
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
  succes: 'border-transparent bg-success text-success-foreground hover:bg-success/90',
  letop: 'border-transparent bg-warning text-warning-foreground hover:bg-warning/90',
  fout: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
  info: 'border-transparent bg-info text-info-foreground hover:bg-info/90',
};

/** Korte fade/slide. Transform raakt de hoogte van de lijst niet. */
const STAP_MOTION = 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200 motion-safe:ease-out';
const DRUK = 'transition-transform duration-150 ease-out motion-safe:active:scale-[0.98]';

function Keuze({
  children,
  icon,
  tint,
  title,
  onClick,
  disabled,
}: {
  children: string;
  icon: ReactNode;
  tint: Tint;
  title?: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="touch"
      title={title}
      className={cn('h-11 shrink-0 gap-1.5 px-3 text-[13px] font-medium', DRUK, TINT[tint])}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </Button>
  );
}

/**
 * Falafel in dezelfde regel als de rest van Bijvullen. De kleuren zitten in
 * de actieknoppen; peil, titel en padding blijven die van de lijst.
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
  const hint = stap === 'vriezer'
    ? ontdooiInstructie({ eenheid, doel_aantal: doelAantal, batch_aantal: batchAantal })
    : stapTitel(naam, stap);

  return (
    <li
      data-aanvulketen="falafel"
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-polar border px-2 py-1 sm:gap-3',
        afgevinkt ? 'border-transparent bg-muted/40' : doorgezet ? 'border-warning/30 bg-warning/5' : 'border-border bg-card',
      )}
    >
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
            'flex h-[26px] w-[26px] items-center justify-center rounded-polar-sm border-2 bg-background sm:h-6 sm:w-6',
            afgevinkt
              ? 'border-muted-foreground/30 bg-muted-foreground/15 text-muted-foreground'
              : doorgezet
                ? 'border-warning bg-warning/15'
                : fout
                  ? 'border-destructive'
                  : 'border-border',
          )}
        >
          {laden ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : afgevinkt ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : null}
        </span>
      </button>
      <div className="min-w-0 flex-1 py-1.5">
        <p className={cn('text-[16px] font-medium leading-snug text-foreground', afgevinkt && 'text-muted-foreground line-through opacity-55')}>
          {naam}
        </p>
        <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <VulPeil procent={peilBlokjes(vulnorm)} label={aanvulTekst(vulnorm)} />
              <span className="text-[13px] font-medium text-foreground">{peilKort(vulnorm)}</span>
            </span>
            <span className="text-muted-foreground/60" aria-hidden>·</span>
            <span key={klaar ? 'klaar' : stap} className={cn('text-[13px] text-muted-foreground', !klaar && STAP_MOTION)}>
              {afgevinkt ? 'Op peil' : doorgezet ? aanvulUitkomst(doorgezetNaar) : hint}
            </span>
          </span>
        </div>
      </div>
      {!klaar && (
        <div key={stap} className={cn('flex shrink-0 flex-wrap items-center justify-end gap-1.5', STAP_MOTION)}>
          {stap === 'lade' && (
            <>
              <Keuze tint="succes" icon={<Check className="h-4 w-4" aria-hidden />} disabled={laden} onClick={onOpPeil}>Op peil</Keuze>
              <Keuze tint="letop" icon={<PackagePlus className="h-4 w-4" aria-hidden />} disabled={laden} onClick={() => setStap('koelcel')}>Aanvullen</Keuze>
            </>
          )}
          {stap === 'koelcel' && (
            <>
              <Keuze tint="succes" icon={<Check className="h-4 w-4" aria-hidden />} disabled={laden} onClick={onAangevuld}>Aangevuld uit koelcel</Keuze>
              <Keuze tint="fout" icon={<TriangleAlert className="h-4 w-4" aria-hidden />} disabled={laden} onClick={() => setStap('vriezer')}>Koelcel onvoldoende</Keuze>
              <Button type="button" variant="ghost" className={cn('h-11 shrink-0 px-2 text-[13px] text-muted-foreground', DRUK)} disabled={laden} onClick={() => setStap('lade')}>Terug</Button>
            </>
          )}
          {stap === 'vriezer' && (
            <>
              <Keuze tint="info" icon={<Snowflake className="h-4 w-4" aria-hidden />} disabled={laden} onClick={onOntdooien}>Ontdooien gestart</Keuze>
              <Keuze tint="fout" icon={<ShoppingCart className="h-4 w-4" aria-hidden />} title="Bestelsignaal" disabled={laden} onClick={onBestellen}>Vriezer onvoldoende</Keuze>
              <Button type="button" variant="ghost" className={cn('h-11 shrink-0 px-2 text-[13px] text-muted-foreground', DRUK)} disabled={laden} onClick={() => setStap('koelcel')}>Terug</Button>
            </>
          )}
        </div>
      )}
      {doorgezet && (
        <Button type="button" variant="ghost" className="h-11 shrink-0 px-2 text-[13px] text-muted-foreground" disabled={laden} onClick={onHerstel}>
          Herstel
        </Button>
      )}
      {fout && !klaar && <p className="w-full text-[13px] text-destructive">Niet opgeslagen. Tik opnieuw.</p>}
    </li>
  );
}
