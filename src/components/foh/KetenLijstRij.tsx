import type { ReactNode } from 'react';
import { Check, ChefHat, Loader2, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaakBewerkKnop } from './TaakBewerkKnop';
import { DRUK, STAP_MOTION } from './aanvulMotion';
import { cn } from '@/lib/utils';
import type { Eindactie } from '@/lib/keten';

type Knop = { id: 'op' | Eindactie; label: string };

/**
 * Productregel plus, als het product op is, de volgende stap in de keten.
 * Zelfde kaart, vinkje, tekst en knop als de rest van de sluitlijst.
 */
export function KetenLijstRij({
  naam,
  uitleg,
  instructie,
  afgevinkt,
  doorgezet,
  laden,
  fout,
  knop,
  stap,
  voorbeeld,
  onAfvinken,
  onKnop,
  onHerstel,
  onBewerk,
}: {
  naam: string;
  uitleg: ReactNode;
  instructie?: string | null;
  afgevinkt: boolean;
  doorgezet: boolean;
  laden: boolean;
  fout: boolean;
  knop: Knop | null;
  stap: {
    titel: string;
    detail?: string | null;
    afgevinkt: boolean;
    onAf: () => void;
    onOokOp: () => void;
  } | null;
  voorbeeld?: string | null;
  onAfvinken: () => void;
  onKnop: () => void;
  onHerstel: () => void;
  onBewerk?: () => void;
}) {
  return (
    <>
      <li
        data-keten="product"
        className={cn(
          'flex items-center gap-1.5 rounded-polar border px-2 py-1 transition-colors sm:gap-3',
          onBewerk && 'flex-wrap',
          afgevinkt ? 'border-transparent bg-muted/40' : doorgezet ? 'border-warning/30 bg-warning/5' : 'border-border bg-card',
        )}
      >
        <button
          type="button"
          aria-label={`${naam} afvinken`}
          aria-pressed={afgevinkt}
          disabled={laden || doorgezet}
          onClick={onAfvinken}
          className="flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <Vinkje af={afgevinkt} doorgezet={doorgezet} fout={fout} laden={laden} />
        </button>
        <div className={cn('min-w-0 flex-1 py-1.5', onBewerk && 'min-w-40')}>
          <p className={cn('text-[16px] font-medium leading-snug text-foreground', afgevinkt && 'text-muted-foreground line-through opacity-55')}>
            {naam}
          </p>
          <div className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{uitleg}</div>
          {!!instructie?.trim() && (
            <p className="mt-0.5 text-[13px] leading-snug text-foreground">{instructie.trim()}</p>
          )}
          {voorbeeld && <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{voorbeeld}</p>}
        </div>
        {onBewerk && <TaakBewerkKnop naam={naam} onClick={onBewerk} />}
        {knop && !afgevinkt && !doorgezet && (
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'h-11 shrink-0 gap-1.5 rounded-polar px-3 text-[13px] font-medium',
              DRUK,
              knop.id === 'mep'
                ? 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                : 'border border-border bg-muted/60 text-foreground hover:bg-muted',
            )}
            disabled={laden}
            onClick={onKnop}
            aria-label={knop.id === 'op' ? `${naam} op` : `${knop.label}: ${naam}`}
          >
            {knop.id === 'mep' ? <ChefHat className="h-4 w-4" /> : knop.id === 'bestelbord' ? <PackageX className="h-4 w-4" /> : null}
            {knop.label}
          </Button>
        )}
        {doorgezet && (
          <Button type="button" variant="ghost" className="h-11 shrink-0 px-2 text-[13px] text-muted-foreground" disabled={laden} onClick={onHerstel}>
            Herstel
          </Button>
        )}
      </li>
      {stap && (
        <li
          data-keten="stap"
          className={cn(
            'flex flex-wrap items-center gap-1.5 rounded-polar border px-2 py-1 sm:gap-3',
            STAP_MOTION,
            stap.afgevinkt ? 'border-transparent bg-muted/40' : 'border-border bg-card',
          )}
        >
          <button
            type="button"
            aria-label={`${stap.titel} afvinken`}
            aria-pressed={stap.afgevinkt}
            disabled={laden || stap.afgevinkt}
            onClick={stap.onAf}
            className={cn('flex h-11 w-11 shrink-0 items-center justify-center', DRUK)}
          >
            <Vinkje af={stap.afgevinkt} doorgezet={false} fout={fout && !stap.afgevinkt} laden={laden && !stap.afgevinkt} />
          </button>
          <div className="min-w-0 flex-1 py-1.5">
            <p className={cn('text-[16px] font-medium leading-snug text-foreground', stap.afgevinkt && 'text-muted-foreground line-through opacity-55')}>
              {stap.titel}
            </p>
            {stap.detail && <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{stap.detail}</p>}
          </div>
          {!stap.afgevinkt && (
            <Button
              type="button"
              variant="ghost"
              className={cn('h-11 shrink-0 rounded-polar border border-border bg-muted/60 px-3 text-[13px] font-medium text-foreground hover:bg-muted', DRUK)}
              disabled={laden}
              onClick={stap.onOokOp}
              aria-label={`Ook op: ${stap.titel}`}
            >
              Ook op
            </Button>
          )}
          {fout && !stap.afgevinkt && <p className="w-full text-[13px] text-destructive">Niet opgeslagen. Tik opnieuw.</p>}
        </li>
      )}
    </>
  );
}

function Vinkje({ af, doorgezet, fout, laden }: { af: boolean; doorgezet: boolean; fout: boolean; laden: boolean }) {
  return (
    <span
      className={cn(
        'flex h-[26px] w-[26px] items-center justify-center rounded-polar-sm border-2 bg-background transition-colors sm:h-6 sm:w-6',
        af
          ? 'border-muted-foreground/30 bg-muted-foreground/15 text-muted-foreground'
          : doorgezet
            ? 'border-warning bg-warning/15'
            : fout
              ? 'border-destructive'
              : 'border-border',
      )}
    >
      {laden ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : af ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
    </span>
  );
}
